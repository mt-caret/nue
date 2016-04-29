let Util = {};

(() => {
  "use strict";

  const regexp_matcher = /^\/(.+)\/(.*)?$/;
  Util.regexp = {
    serialize: (regexp) => { return regexp.toString(); },
    unserialize: (str) => {
      let m = str.match(regexp_matcher);
      return new RegExp(m[1], m[2] || "");
    },
    validate: (str) => { return regexp_matcher.test(str); },
    serialize_filter: (key, value) => {
      return ((key === "regexp") ? Util.regexp.serialize(value) : value);
    },
    unserialize_filter: (key, value) => {
      return ((key === "regexp" && Util.regexp.validate(value)) ?
        Util.regexp.unserialize(value) : value);
    }
  };
})();
