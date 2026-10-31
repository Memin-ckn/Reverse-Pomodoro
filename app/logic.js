/*
 * Reverse Pomodoro - pure helper functions.
 * No page or browser access here, so they work in the browser
 * (as `Logic`) and in Node.js (for tests/test.js).
 */
(function (root) {
  // Returns rest seconds earned for `studySec` seconds of study.
  // Rest earned = 1/4 of study time, optionally capped (capMin = 0 means no cap).
  function restFor(studySec, capMin) {
    var rest = Math.floor(studySec / 4);
    if (capMin > 0) rest = Math.min(rest, Math.floor(capMin * 60));
    return rest;
  }

  // Formats seconds as "m:ss", or "h:mm:ss" when an hour or longer.
  function fmt(sec) {
    sec = Math.max(0, Math.floor(sec));
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = sec % 60;
    var mm = (h ? String(m).padStart(2, "0") : String(m));
    var ss = String(s).padStart(2, "0");
    return (h ? h + ":" : "") + mm + ":" + ss;
  }

  // Export for Node.js if available, otherwise attach to the page as `Logic`.
  var api = { restFor: restFor, fmt: fmt };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Logic = api;
})(typeof window !== "undefined" ? window : this);
