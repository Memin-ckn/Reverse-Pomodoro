/*
 * Reverse Pomodoro - UI and timer logic.
 *
 * The app has three phases:
 *   idle     -> waiting for the user to start
 *   studying -> a stopwatch counts UP while the user studies
 *   resting  -> a countdown runs for the rest time the user earned
 *
 * Pure calculation helpers (rest time, time formatting) live in logic.js.
 */
(function () {
  "use strict";

  // ---------------------------------------------------------------------
  // Page elements
  // ---------------------------------------------------------------------
  function byId(id) { return document.getElementById(id); }

  var phaseEl = byId("phase");      // "Ready" / "Studying" / "Resting" label
  var timeEl = byId("time");        // big clock
  var hintEl = byId("hint");        // small helper text under the clock
  var primaryBtn = byId("primary"); // start / stop / skip button
  var pauseBtn = byId("pause");     // pause / resume (rest only)
  var capEl = byId("cap");          // "max rest" input (minutes)
  var totalsEl = byId("totals");    // today's totals line
  var listEl = byId("list");        // today's session list
  var clearBtn = byId("clear");     // "Clear history" button

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
  var HISTORY_KEY = "rp_history";   // localStorage key: saved sessions
  var CAP_KEY = "rp_cap";           // localStorage key: max rest setting
  var TICK_MS = 250;                // how often the screen refreshes

  var phase = "idle";               // "idle" | "studying" | "resting"
  var studyStartedAt = 0;           // timestamp (ms) when studying began
  var restEndsAt = 0;               // timestamp (ms) when rest will end
  var restSecondsLeft = 0;          // rest seconds remaining, saved on pause
  var paused = false;               // is the rest countdown paused?
  var timerId = null;               // id of the setInterval refresh loop

  // ---------------------------------------------------------------------
  // Settings: maximum rest length
  // ---------------------------------------------------------------------

  // Returns the "max rest" setting in minutes (0 = no limit).
  function getCapMinutes() {
    return Math.max(0, parseInt(capEl.value, 10) || 0);
  }

  capEl.value = localStorage.getItem(CAP_KEY) || "0";
  capEl.addEventListener("change", function () {
    var minutes = getCapMinutes();
    capEl.value = minutes; // clean up invalid input such as "-3" or "abc"
    localStorage.setItem(CAP_KEY, minutes);
    if (phase === "studying") render(); // refresh the "you'll earn" hint
  });

  // ---------------------------------------------------------------------
  // History (stored in the browser's localStorage, never sent anywhere)
  // ---------------------------------------------------------------------

  // Today's date in the user's local time zone, e.g. "2026-10-31".
  function todayString() {
    var now = new Date();
    function twoDigits(n) { return (n < 10 ? "0" : "") + n; }
    return now.getFullYear() + "-" + twoDigits(now.getMonth() + 1) + "-" + twoDigits(now.getDate());
  }

  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch (error) {
      return []; // corrupted data: start fresh
    }
  }

  function saveSession(studySec, restSec) {
    var history = loadHistory();
    history.push({ date: todayString(), studySec: studySec, restSec: restSec });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  // Shows today's totals and the list of today's sessions.
  function renderHistory() {
    var today = todayString();
    var sessions = loadHistory().filter(function (s) { return s.date === today; });

    var totalStudy = 0, totalRest = 0;
    sessions.forEach(function (s) {
      totalStudy += s.studySec;
      totalRest += s.restSec;
    });

    if (sessions.length) {
      totalsEl.textContent = "Studied " + Logic.fmt(totalStudy) +
        " · Rested " + Logic.fmt(totalRest) +
        " · " + sessions.length + " session" + (sessions.length > 1 ? "s" : "");
    } else {
      totalsEl.textContent = "No sessions yet today.";
    }

    listEl.innerHTML = "";
    sessions.forEach(function (s, index) {
      var number = document.createElement("span");
      number.textContent = "#" + (index + 1);
      var detail = document.createElement("span");
      detail.textContent = "Study " + Logic.fmt(s.studySec) + " → Rest " + Logic.fmt(s.restSec);

      var item = document.createElement("li");
      item.appendChild(number);
      item.appendChild(detail);
      listEl.appendChild(item);
    });
  }

  // ---------------------------------------------------------------------
  // Time helpers
  // ---------------------------------------------------------------------
  function studyElapsedSec() {
    return (Date.now() - studyStartedAt) / 1000;
  }

  function restRemainingSec() {
    return paused ? restSecondsLeft : (restEndsAt - Date.now()) / 1000;
  }

  // ---------------------------------------------------------------------
  // Drawing the screen
  // ---------------------------------------------------------------------

  // Updates labels, clock, buttons and tab title for the current phase.
  function render() {
    document.body.dataset.phase = phase; // CSS uses this to change colors

    if (phase === "idle") {
      phaseEl.textContent = "Ready";
      primaryBtn.textContent = "Start studying";
      pauseBtn.hidden = true;
      document.title = "Reverse Pomodoro";

    } else if (phase === "studying") {
      var elapsed = studyElapsedSec();
      var earned = Logic.restFor(Math.floor(elapsed), getCapMinutes());
      phaseEl.textContent = "Studying";
      timeEl.textContent = Logic.fmt(elapsed);
      hintEl.textContent = "You'll earn " + Logic.fmt(earned) + " rest";
      primaryBtn.textContent = "Stop & rest";
      pauseBtn.hidden = true;
      document.title = "▶ " + Logic.fmt(elapsed);

    } else { // resting
      var remaining = Math.ceil(restRemainingSec());
      phaseEl.textContent = paused ? "Rest paused" : "Resting";
      timeEl.textContent = Logic.fmt(remaining);
      primaryBtn.textContent = "Skip rest";
      pauseBtn.hidden = false;
      pauseBtn.textContent = paused ? "Resume" : "Pause";
      document.title = "☕ " + Logic.fmt(remaining);
    }
  }

  // Runs several times per second: ends the rest when time is up,
  // otherwise redraws the clock.
  function tick() {
    if (phase === "resting" && !paused && restRemainingSec() <= 0) {
      finishRest(true);
      return;
    }
    render();
  }

  // ---------------------------------------------------------------------
  // Alerts
  // ---------------------------------------------------------------------

  // Plays two short beeps using the browser's built-in audio (no sound file).
  function beep() {
    try {
      var audio = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.35].forEach(function (delay) {
        var oscillator = audio.createOscillator();
        var volume = audio.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = 660;
        oscillator.connect(volume);
        volume.connect(audio.destination);

        // Quick fade in and out so the beep doesn't click.
        var start = audio.currentTime + delay;
        volume.gain.setValueAtTime(0.0001, start);
        volume.gain.exponentialRampToValueAtTime(0.2, start + 0.05);
        volume.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
        oscillator.start(start);
        oscillator.stop(start + 0.32);
      });
    } catch (error) {
      // Audio isn't available: the app still works, just silently.
    }
  }

  // ---------------------------------------------------------------------
  // Phase transitions
  // ---------------------------------------------------------------------

  function startStudy() {
    // Ask once for permission to show a "rest is over" notification.
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    phase = "studying";
    studyStartedAt = Date.now();
    clearInterval(timerId);
    timerId = setInterval(tick, TICK_MS);
    render();
  }

  // Ends studying, saves the session and starts the earned rest.
  function stopStudy() {
    var studySec = Math.floor(studyElapsedSec());
    var restSec = Logic.restFor(studySec, getCapMinutes());
    saveSession(studySec, restSec);
    renderHistory();

    if (restSec <= 0) { // studied too briefly to earn any rest
      phase = "idle";
      clearInterval(timerId);
      timeEl.textContent = Logic.fmt(studySec);
      render();
      hintEl.textContent = "Session too short to earn rest. Start again when ready.";
      return;
    }

    phase = "resting";
    paused = false;
    restEndsAt = Date.now() + restSec * 1000;
    hintEl.textContent = "Studied " + Logic.fmt(studySec) + " → rest " + Logic.fmt(restSec);
    render();
  }

  // Ends the rest. `completed` is true when the time ran out naturally and
  // false when the user skipped it (only a completed rest alerts the user).
  function finishRest(completed) {
    phase = "idle";
    paused = false;
    clearInterval(timerId);
    timeEl.textContent = "0:00";
    render();
    hintEl.textContent = completed ? "Rest is over. Ready when you are."
                                   : "Rest skipped. Ready when you are.";
    if (completed) {
      beep();
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Rest is over", { body: "Ready for the next study session?" });
      }
    }
  }

  // ---------------------------------------------------------------------
  // Button handlers
  // ---------------------------------------------------------------------

  // The big button does something different in each phase.
  primaryBtn.addEventListener("click", function () {
    if (phase === "idle") startStudy();
    else if (phase === "studying") stopStudy();
    else finishRest(false);
  });

  pauseBtn.addEventListener("click", function () {
    if (paused) {
      paused = false;
      restEndsAt = Date.now() + restSecondsLeft * 1000; // resume where we left off
    } else {
      restSecondsLeft = restRemainingSec();
      paused = true;
    }
    render();
  });

  clearBtn.addEventListener("click", function () {
    if (confirm("Clear all saved sessions?")) {
      localStorage.removeItem(HISTORY_KEY);
      renderHistory();
    }
  });

  // ---------------------------------------------------------------------
  // Start-up
  // ---------------------------------------------------------------------
  renderHistory();
  render();
})();
