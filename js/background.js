(function() {
  "use strict";

  let settings = {};
  chrome.storage.sync.get({ entry_list: [], profile_list: [] }, (items) => {
    settings = {
      entry_list: items.entry_list.map((entry) => {
        return _.mapObject(entry, (v, k) => {
          return Util.regexp.unserialize_filter(k, v);
        });
      }),
      profile_list: items.profile_list
    };
  });

  const fetch_metadata = (url) => {
    let result = _.find(settings.entry_list, (entry) => {
      return entry.regexp.test(url);
    });
    if (result === undefined) {
      return undefined;
    }
    result.profile = _.find(settings.profile_list, (profile) => {
      return result.profile_name === profile.name
    });
    if (result.profile === undefined) {
      console.log("Profile not found.");
      return undefined;
    }
    return result;
  }

  const change_referer = (details) => {
    const metadata = fetch_metadata(details.url);
    if (metadata === undefined) {
      toggle_icon(false, details.tabId);
      return { requestHeaders: details.requestHeaders };
    }
    console.log("Changing referer for...");
    console.log(metadata);

    let found_referer = false;
    let found_user_agent = false;
    const change_referer = metadata.profile.referer !== "";
    const change_user_agent = metadata.profile.user_agent !== "";
    const request_headers = details.requestHeaders.filter((header) => {
      return header.name !== "Cookie" || metadata.cookies;
    }).map((header) => {
      if (header.name === "Referer" && change_referer) {
        header.value = metadata.profile.referer;
        found_referer = true;
      } else if (header.name === "User-Agent" && change_user_agent) {
        header.value = metadata.profile.user_agent;
        found_user_agent = true;
      }
      return header;
    });

    if (!found_referer && change_referer) {
      request_headers.push({
        name: "Referer",
        value: metadata.profile.referer
      });
    }
    if (!found_user_agent && change_user_agent) {
      request_headers.push({
        name: "User-Agent",
        value: metadata.profile.user_agent
      });
    }
    toggle_icon(change_referer || change_user_agent, details.tabId);
    return { requestHeaders: request_headers }
  };

  const block_cookies = (details) => {
    const metadata = fetch_metadata(details.url);
    if (metadata === undefined || !metadata.cookies) {
      return { responseHeaders: details.responseHeaders };
    }
    console.log("Blocking cookies for...");
    console.log(metadata);

    const response_headers = details.responseHeaders.filter((header) => {
      return header.name !== "Set-Cookie";
    });
    return { responseHeaders: response_headers };
  };

  const toggle_icon = (on, id) => {
    const build_path = (str) => {
      return {
        "38": chrome.extension.getURL('img/38_' + str + '.png'),
        "19": chrome.extension.getURL('img/19_' + str + '.png')
      };
    };
    const path = build_path(on ? "exclamation" : "question");
    chrome.browserAction.setIcon({ path: path, tabId: id });
  };

  const open_background_page = () => {
    chrome.tabs.create({ url: chrome.extension.getURL('background.html') });
  };

  const load_listeners = () => {
    chrome.webRequest.onBeforeSendHeaders.addListener(
      change_referer,
      { urls: [ "<all_urls>" ], types: ["main_frame"] },
      ["requestHeaders", "blocking"]);
    chrome.webRequest.onHeadersReceived.addListener(
      block_cookies,
      { urls: [ "<all_urls>" ], types: ["main_frame"] },
      ["responseHeaders", "blocking"]);
    chrome.browserAction.onClicked.addListener(open_background_page);
    chrome.storage.onChanged.addListener((changes, namespace) => {
      Object.keys(changes).forEach((key) => {
        settings[key] = changes[key].newValue.map((e) => {
          return _.mapObject(e, (v, k) => {
            return Util.regexp.unserialize_filter(k, v);
          });
        });
      });
    });
  }

  load_listeners();
})();
