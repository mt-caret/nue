let Nue = {};

(() => {
  "use strict";

  Nue.Entry = function(data) {
    data = data || {};
    this.regexp = m.prop(data.regexp || new RegExp);
    this.profile_name = m.prop(data.profile_name || "");
    this.cookies = m.prop(data.cookies || false);
  };

  Nue.Profile = function(data) {
    data = data || {};
    this.name = m.prop(data.name || "");
    this.user_agent = m.prop(data.user_agent || "");
    this.referer = m.prop(data.referer || "");
  };

  Nue.Widget = {
    vm: (() => {
      let vm = {};
      vm.init = () => {
        vm.entry_list = [];
        vm.profile_list = [];
        vm.settings = () => {
          const m2o = (e) => {
            return _.mapObject(e, (v, k) => {
              return Util.regexp.serialize_filter(k, v());
            });
          };
          return {
            entry_list: vm.entry_list.map(m2o),
            profile_list: vm.profile_list.map(m2o)
          };
        }
        vm.sync_settings = () => {
          const data = vm.settings();
          console.log("Syncing changes...");
          console.log(data)
          chrome.storage.sync.set(data, () => {});
        };
        vm.load_settings = (settings) => {
          if (settings.entry_list && settings.profile_list) {
            vm.entry_list = settings.entry_list.map((entry) => {
              return new Nue.Entry(_.mapObject(entry, (v, k) => {
                return Util.regexp.unserialize_filter(k, v);
              }));
            });
            vm.profile_list = settings.profile_list.map((profile) => {
              return new Nue.Profile(profile);
            });
            vm.sync_settings();
          }
        }
        console.log("Syncing...");
        chrome.storage.sync.get(null, (items) => {
          vm.load_settings(items);
          m.redraw();
        });

        vm.entry_edit_index = -1;
        vm.regexp = m.prop("");
        vm.profile_name = m.prop("");
        vm.cookies = m.prop(false);
        vm.add_entry = (e) => {
          e.preventDefault();
          if (Util.regexp.validate(vm.regexp()) && vm.profile_name()) {
            let entry = new Nue.Entry({
              regexp: Util.regexp.unserialize(vm.regexp()),
              profile_name: vm.profile_name(),
              cookies: vm.cookies()
            });
            console.log(entry);
            vm.entry_list.push(entry);
            vm.regexp("");
            vm.profile_name("");
            vm.cookies(false);
            vm.sync_settings();
          }
        };
        vm.edit_entry = (index, flag, e) => {
          e.preventDefault();
          vm.entry_edit_index = flag ? index : -1;
          vm.sync_settings();
        };
        vm.remove_entry = (index, e) => {
          e.preventDefault();
          vm.entry_list.splice(index, 1);
          vm.sync_settings();
        };

        vm.profile_edit_index = -1;
        vm.name = m.prop("");
        vm.user_agent = m.prop("");
        vm.referer = m.prop("");
        vm.add_profile = (e) => {
          e.preventDefault();
          if (vm.name() && vm.user_agent()) {
            let profile = new Nue.Profile({
              name: vm.name(),
              user_agent: vm.user_agent(),
              referer: vm.referer()
            });
            vm.profile_list.push(profile);
            vm.name("");
            vm.user_agent("");
            vm.referer("");
            vm.sync_settings();
          }
        };
        vm.edit_profile = (index, flag, e) => {
          e.preventDefault();
          vm.profile_edit_index = flag ? index : -1;
          vm.sync_settings();
        };
        vm.remove_profile = (index, e) => {
          e.preventDefault();
          vm.profile_list.splice(index, 1);
          vm.sync_settings();
        };

        vm.import_settings = function(e) {
          console.log("Importing...");
          let reader = new FileReader();
          reader.onload = (e) => {
            let data = JSON.parse(e.target.result);
            vm.load_settings(data);
            m.redraw();
          };
          reader.readAsText(this.files[0]);
        };
        vm.export_settings = function() {
          console.log("Exporting...");
          const json = JSON.stringify(vm.settings());
          console.log(json);
          this.href = 'data:application/json;charset=utf-8,' +
            encodeURIComponent(json);
        };
        console.log("Initialized.");
      };
      return vm;
    })(),
    controller: function() {
      Nue.Widget.vm.init();
    },
    view: (ctrl) => {
      return [
        m("table", [
          m("thead", [
            m("tr", [
              m("th", "Regular Expression"),
              m("th", "Profile"),
              m("th", "Cookies"),
              m("th"),
              m("th")
            ])
          ]),
          m("tbody", [
            Nue.Widget.vm.entry_list.map(function(entry, index) {
              const editing = index === Nue.Widget.vm.entry_edit_index;
              return m("tr", (editing ? [
                m("td", [ m("input", {
                    onchange: m.withAttr("value", (str) => {
                      entry.regexp(Util.regexp.unserialize(str));
                    }),
                    value: Util.regexp.serialize(entry.regexp())
                }) ]),
                m("td", [ m("input", {
                    onchange: m.withAttr("value", entry.profile_name),
                    value: entry.profile_name()
                }) ]),
                m("td", [ m("input[type=checkbox]", {
                    onclick: m.withAttr("checked", entry.cookies),
                    checked: entry.cookies()
                }) ])
              ] : [
                m("td", Util.regexp.serialize(entry.regexp())),
                m("td", entry.profile_name()),
                m("td", entry.cookies().toString())
              ]).concat([
                m("td", [ m("a[href='#']", {
                  onclick: Nue.Widget.vm.edit_entry.bind(null, index, !editing)
                }, editing ? "done" : "edit") ]),
                m("td", [ m("a[href='#']", {
                  onclick: Nue.Widget.vm.remove_entry.bind(null, index)
                }, "x") ])
              ]));
            }),
            m("tr", [
              m("td", [ m("input", {
                onchange: m.withAttr("value", Nue.Widget.vm.regexp),
                value: Nue.Widget.vm.regexp()
              }) ]),
              m("td", [ m("input", {
                onchange: m.withAttr("value", Nue.Widget.vm.profile_name),
                value: Nue.Widget.vm.profile_name()
              }) ]),
              m("td", [ m("input[type=checkbox]", {
                onclick: m.withAttr("checked", Nue.Widget.vm.cookies),
                checked: Nue.Widget.vm.cookies()
              }) ]),
              m("td", [
                m("a[href='#']", { onclick: Nue.Widget.vm.add_entry }, "add")
              ]),
              m("td")
            ])
          ])
        ]),
        m("table", [
          m("thead", [
            m("tr", [
              m("th", "Name"),
              m("th", "User Agent"),
              m("th", "Referer"),
              m("th"),
              m("th")
            ])
          ]),
          m("tbody", [
            Nue.Widget.vm.profile_list.map(function(profile, index) {
              const editing = index === Nue.Widget.vm.profile_edit_index;
              return m("tr", (editing ? [
                m("td", [ m("input", {
                    onchange: m.withAttr("value", profile.name),
                    value: profile.name()
                }) ]),
                m("td", [ m("input", {
                    onchange: m.withAttr("value", profile.user_agent),
                    value: profile.user_agent()
                }) ]),
                m("td", [ m("input", {
                    onchange: m.withAttr("value", profile.referer),
                    value: profile.referer()
                }) ])
              ] : [
                m("td", profile.name()),
                m("td", profile.user_agent()),
                m("td", profile.referer())
              ]).concat([
                m("td", [ m("a[href='#']", {
                  onclick: Nue.Widget.vm.edit_profile.bind(null, index, !editing)
                }, editing ? "done" : "edit") ]),
                m("td", [ m("a[href='#']", {
                  onclick: Nue.Widget.vm.remove_profile.bind(null, index)
                }, "x") ])
              ]));
            }),
            m("tr", [
              m("td", [ m("input", {
                onchange: m.withAttr("value", Nue.Widget.vm.name),
                value: Nue.Widget.vm.name()
              }) ]),
              m("td", [ m("input", {
                onchange: m.withAttr("value", Nue.Widget.vm.user_agent),
                value: Nue.Widget.vm.user_agent()
              }) ]),
              m("td", [ m("input", {
                onchange: m.withAttr("value", Nue.Widget.vm.referer),
                value: Nue.Widget.vm.referer()
              }) ]),
              m("td", [
                m("a[href='#']", { onclick: Nue.Widget.vm.add_profile }, "add")
              ]),
              m("td")
            ])
          ])
        ]),
        m("hr"),
        m("a#export_anchor[href='#'][download='nue_settings.json']", {
          onclick: Nue.Widget.vm.export_settings
        },"Export"),
        m("a#import_anchor[href='#']", {
          onclick: (e) => {
            document.getElementById("import_input").click();
            e.preventDefault();
          }
        }, "Import"),
        m("input#import_input[type='file'][accept='application/json']", {
          onchange: Nue.Widget.vm.import_settings
        })
      ];
    }
  };
  m.mount(document.body, Nue.Widget);
})();
