/* KAYAN — DM microsite */
(function () {
  "use strict";

  var SHARE_TEXT = "وصلني كيان، وش تتوقعون؟ #كيان";
  var SHARE_URL = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(SHARE_TEXT);

  var $ = function (id) { return document.getElementById(id); };
  var stage = $("stage"), scene = $("scene"), tilt = $("tilt"), env = $("env");
  var seal = $("seal"), flap = $("flap"), card = $("card"), share = $("share"), soundBtn = $("sound");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var T = reduce ? 0.45 : 1; // time scale

  share.href = SHARE_URL;

  /* ---------------- sound (synthesised, no files) ---------------- */
  var ctx = null, master = null, soundOn = true;
  function audio() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function noiseBuffer(sec, shape) {
    var n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * shape(i / n);
    return b;
  }
  function play(buf, filterType, freq, q, gain, when) {
    if (!soundOn || !ctx) return;
    var src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = buf; f.type = filterType; f.frequency.value = freq; f.Q.value = q; g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(ctx.currentTime + (when || 0));
  }
  function sndCrack() {
    if (!audio() || !soundOn) return;
    // brittle wax snap: a few sharp clicks over a short crackle
    var crackle = noiseBuffer(0.16, function (t) {
      var spike = Math.random() < 0.06 ? 1 : 0.25;
      return spike * Math.pow(1 - t, 3);
    });
    play(crackle, "highpass", 1600, 0.7, 0.55);
    play(noiseBuffer(0.05, function (t) { return Math.pow(1 - t, 6); }), "bandpass", 2600, 1.2, 0.7, 0.02);
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(150, ctx.currentTime); o.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.22, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
    o.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime + 0.2);
  }
  function sndPaper(sec, freq, gain, when) {
    if (!audio() || !soundOn) return;
    // soft paper movement: band-limited noise with an uneven, crinkly envelope
    var grain = 1, k = 0;
    var buf = noiseBuffer(sec, function (t) {
      if (k-- <= 0) { grain = 0.35 + Math.random() * 0.65; k = 200 + Math.random() * 900; }
      return grain * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (1 - t * 0.35);
    });
    play(buf, "bandpass", freq, 0.6, gain, when);
  }
  soundBtn.addEventListener("click", function () {
    soundOn = !soundOn;
    soundBtn.setAttribute("aria-pressed", soundOn ? "true" : "false");
    if (soundOn) audio();
  });

  /* ---------------- light, tilt and dust ---------------- */
  var fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  var tx = 0.5, ty = 0.35, cx = 0.5, cy = 0.35, maxTilt = 5;
  function onMove(x, y) { tx = x / window.innerWidth; ty = y / window.innerHeight; }
  window.addEventListener("pointermove", function (e) { onMove(e.clientX, e.clientY); }, { passive: true });
  window.addEventListener("touchmove", function (e) { if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });

  var dust = $("dust"), dctx = dust.getContext("2d"), motes = [], dpr = 1;
  function sizeDust() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    dust.width = Math.round(window.innerWidth * dpr); dust.height = Math.round(window.innerHeight * dpr);
    var count = Math.round(Math.min(46, (window.innerWidth * window.innerHeight) / 26000));
    motes = [];
    for (var i = 0; i < count; i++) motes.push({
      x: Math.random(), y: Math.random(), r: 0.4 + Math.random() * 1.3,
      vx: (Math.random() - 0.5) * 0.00006, vy: -0.00003 - Math.random() * 0.00007, p: Math.random() * 6.28
    });
  }
  sizeDust();

  var last = performance.now(), t0 = last, running = true;
  function frame(now) {
    if (!running) return;
    var dt = Math.min(50, now - last); last = now;
    var k = 1 - Math.pow(0.001, dt / 1000 * 1.4);
    var idle = fine ? 0 : 1;
    var ix = idle ? 0.5 + Math.sin((now - t0) / 2600) * 0.12 : tx;
    var iy = idle ? 0.38 + Math.cos((now - t0) / 3300) * 0.06 : ty;
    cx += (ix - cx) * k; cy += (iy - cy) * k;
    stage.style.setProperty("--mx", (cx * 100).toFixed(2) + "%");
    stage.style.setProperty("--my", (cy * 100).toFixed(2) + "%");
    tilt.style.setProperty("--ry", ((cx - 0.5) * 2 * maxTilt).toFixed(3) + "deg");
    tilt.style.setProperty("--rx", ((0.5 - cy) * 2 * maxTilt * 0.7).toFixed(3) + "deg");
    env.style.setProperty("--lx", (cx * 100).toFixed(1) + "%");
    env.style.setProperty("--ly", (cy * 60).toFixed(1) + "%");

    var w = dust.width, h = dust.height;
    dctx.clearRect(0, 0, w, h);
    for (var i = 0; i < motes.length; i++) {
      var m = motes[i];
      m.x += m.vx * dt; m.y += m.vy * dt; m.p += dt * 0.0012;
      if (m.y < -0.02) { m.y = 1.02; m.x = Math.random(); }
      if (m.x < -0.02) m.x = 1.02; else if (m.x > 1.02) m.x = -0.02;
      var dx = m.x - cx, dy = m.y - cy, near = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) * 2.4);
      var a = (0.06 + near * 0.35) * (0.6 + 0.4 * Math.sin(m.p));
      dctx.fillStyle = "rgba(255,244,228," + a.toFixed(3) + ")";
      dctx.beginPath(); dctx.arc(m.x * w, m.y * h, m.r * dpr, 0, 6.283); dctx.fill();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  document.addEventListener("visibilitychange", function () {
    running = !document.hidden;
    if (running) { last = performance.now(); requestAnimationFrame(frame); }
  });

  /* ---------------- the opening ---------------- */
  stage.classList.add("intro");
  setTimeout(function () { stage.classList.add("ready"); }, 1300 * T);

  var opened = false, finalState = null;
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms * T); }); }
  function anim(el, frames, ms, easing, delay) {
    var a = el.animate(frames, { duration: ms * T, easing: easing, delay: (delay || 0) * T, fill: "forwards" });
    return a.finished ? a.finished.catch(function () {}) : wait(ms + (delay || 0));
  }

  function cardTarget(slide) {
    // where the card should rest: centred, a little above the middle
    var r = card.getBoundingClientRect();
    var s = Math.min(1.3, (window.innerWidth * 0.92) / r.width, (window.innerHeight * 0.62) / r.height);
    var dx = window.innerWidth / 2 - (r.left + r.width / 2);
    var dy = window.innerHeight * 0.47 - (r.top + r.height / 2);
    return { slide: slide, dx: dx, dy: dy, s: s };
  }

  function open() {
    if (opened) return;
    opened = true;
    audio();
    stage.classList.add("opened");
    seal.setAttribute("aria-hidden", "true");
    seal.tabIndex = -1;

    // 1 — the seal cracks, then falls away in two halves
    sndCrack();
    seal.classList.add("cracking");
    wait(150).then(function () { seal.classList.add("broken"); })
    // 2 — the flap lifts and folds back
    .then(function () { return wait(260); })
    .then(function () {
      sndPaper(0.95, 2300, 0.32);
      setTimeout(function () { flap.classList.add("behind"); }, 600 * T);
      setTimeout(function () { seal.classList.add("gone"); }, 900 * T);
      return anim(flap, [
        { transform: "rotateX(0deg)" },
        { transform: "rotateX(105deg)", offset: 0.55 },
        { transform: "rotateX(180deg)" }
      ], 1200, "cubic-bezier(.55,.05,.25,1)");
    })
    // 3 — the card slides out of the envelope
    .then(function () {
      var slide = card.offsetHeight * 0.97;
      sndPaper(1.3, 1100, 0.42, 0.05);
      return anim(card, [
        { transform: "translateY(0)" },
        { transform: "translateY(" + (-slide) + "px)" }
      ], 1350, "cubic-bezier(.33,.0,.15,1)").then(function () { return slide; });
    })
    // 4 — the envelope sinks away and the card glides to the centre
    .then(function (slide) {
      card.classList.add("lifted");
      maxTilt = 3;
      var away = { transform: "translateY(60%)", opacity: 0 };
      [".back", ".pocket", ".pocket-tex", ".pocket-light"].forEach(function (q) {
        anim(env.querySelector(q), [{ transform: "none", opacity: 1 }, away], 1300, "cubic-bezier(.6,0,.3,1)", 80);
      });
      anim(flap, [{ transform: "rotateX(180deg)", opacity: 1 }, { transform: "translateY(85%) rotateX(180deg)", opacity: 0 }], 1300, "cubic-bezier(.6,0,.3,1)", 80);
      anim(document.querySelector(".shadow"), [{ opacity: 1 }, { opacity: 0 }], 900, "ease-out");
      var f = cardTarget(slide);
      finalState = f;
      sndPaper(0.8, 800, 0.18, 0.1);
      return anim(card, [
        { transform: "translateY(" + (-slide) + "px)" },
        { transform: "translate(" + f.dx + "px," + (f.dy - slide) + "px) scale(" + f.s + ")" }
      ], 1400, "cubic-bezier(.45,0,.15,1)");
    })
    // 5 — the words appear
    .then(function () {
      card.classList.add("reveal");
      share.setAttribute("tabindex", "0");
    });
  }

  share.setAttribute("tabindex", "-1");
  seal.addEventListener("click", open);

  // keep the card centred if the screen rotates or resizes after opening
  var rz;
  window.addEventListener("resize", function () {
    sizeDust();
    if (!finalState) return;
    clearTimeout(rz);
    rz = setTimeout(function () {
      card.getAnimations().forEach(function (a) { a.cancel(); });
      card.style.transform = "translateY(" + (-card.offsetHeight * 0.97) + "px)";
      var f = cardTarget(card.offsetHeight * 0.97);
      card.style.transform = "translate(" + f.dx + "px," + (f.dy - f.slide) + "px) scale(" + f.s + ")";
    }, 120);
  });
})();
