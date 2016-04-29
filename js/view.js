(function() {
  "use strict";

  const edit_entry = function() {
  };
  const remove = function(e) {
    e.preventDefault();
    const tr = $(this).parent();
    const property_name = tr.parent().parent().data("property");
    const index = tr.data("index");
    settings[property_name].splice(index, 1);
  };
  //let settings = {};
  const list_table = () => { return $("table#list_table > tbody"); };
  const profiles_table = () => { return $("table#profiles_table > tbody"); };
  const reflow_table = (table, a) => {
    //table().find("tbody").find("tr").each(function() { $(this).remove(); });
    const trs = a.map((entry, index) => {
      const x = $('<td><a href="#">x</a></td>').addClass("x").on("click", remove);
      const edit = $('<td><a href="#">edit</a></td>').addClass("edit");
      const tds = Object.keys(entry).map((key) => {
        const e = $("<td></td>").data("key", key).append(entry[key].toString());
        return e.prop("outerHTML");
      }).concat(edit.prop("outerHTML"), x.prop("outerHTML"));
      return $("<tr></tr>").append(tds.join('')).
        data("index",index).prop("outerHTML");
    });
    table().empty();
    table().append(trs.join(''));
  };
  const reflow = () => {
    reflow_table(list_table, settings.list);
    reflow_table(profiles_table, settings.profiles);
    // apply changes to through chrome.storage.sync
  }
  const apply_settings = (items) => {
    settings = items;
    reflow();
  };
  //chrome.storage.sync.get({ list: [] }, apply_settings);
  let settings = {
    list: [
      {
        regexp: /^https?:\/\/www.wsj.com\//,
        profile_name: "Googlebot",
        cookies: false
      }
    ],
    profiles: [
      {
        name: "Googlebot",
        referer: "https://www.google.com/",
        user_agent: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
      }
    ]
  };

  //from http://stackoverflow.com/a/33416684
  const replacer = (key, value) => {
    return (value instanceof RegExp) ? ("__REGEXP" + value.toString()) : value;
  };

  $(function() {
    $("a#export_anchor").on("click", function() {
      this.href = 'data:application/json;charset=utf-8,' +
        JSON.stringify(settings, replacer);
    });
    $("a#import_anchor").on("click", function(e) {
      $("input#import_input").trigger("click");
      e.preventDefault();
    });
    $("input#import_input").on("change", function() {
      console.log("Importing settings...");
      let reader = new FileReader();
      reader.onload = (e) => {
        let result = JSON.parse(e.target.result);
        result.list = result.list.map((entry) => {
          return Object.keys(entry).map((key) => {
            if(key === "regexp") {
              let m = entry[key].split("__REGEXP")[1].match(/\/(.*)\/(.*)?/);
              return new RegExp(m[1], m[2] || "");
            } else {
              return entry[key];
            }
          });
        });
        console.log("...Imported:");
        console.log(result);
        reflow();
      };
      reader.readAsText(this.files[0]);
    });
  });
})();
