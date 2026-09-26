/* Lạc Việt demo kit — motion engine v3 (mechanism only).
   Which variant runs where is decided by ChatGPT in spec.art_direction.motion and emitted by build.py as
   data-fx-* attributes on each section + a page-level #fx-config. Nothing runs when the visitor prefers
   reduced motion (the .fx class is never set). Animations use transform/opacity/clip-path/filter only. */
(function () {
  "use strict";
  var root = document.documentElement;
  if (!root.classList.contains("fx")) return;
  var cfgEl = document.getElementById("fx-config");
  var cfg = cfgEl ? JSON.parse(cfgEl.textContent) : {};
  var page = cfg.page || {}, hover = cfg.hover || {};
  var fine = window.matchMedia("(pointer: fine)").matches;
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var esc = function (s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;"); };
  var LISTS = ".collection__grid, .steps, .facts, .principles, .benefits, .specs, .related__grid, .gallery__grid, .info-grid, .story__notes, .times";

  // ------------------------------------------------------------------ text splitting
  function words(el) { return el.textContent.trim().normalize("NFC").split(/\s+/); }
  function label(el) { el.setAttribute("aria-label", el.textContent.trim()); }
  function splitLines(el) {
    label(el);
    var ws = words(el);
    el.innerHTML = ws.map(function (w) { return '<span class="w" aria-hidden="true">' + esc(w) + "</span>"; }).join(" ");
    var lines = [], top = null;
    $$(".w", el).forEach(function (w) {
      if (top === null || Math.abs(w.offsetTop - top) > 4) { lines.push([]); top = w.offsetTop; }
      lines[lines.length - 1].push(w.textContent);
    });
    el.innerHTML = lines.map(function (l, i) {
      return '<span class="ln" aria-hidden="true"><span class="ln__i" style="--i:' + i + '">' + esc(l.join(" ")) + "</span></span>";
    }).join(" ");
  }
  function splitWords(el) {
    label(el);
    el.innerHTML = words(el).map(function (w, i) {
      return '<span class="wd" aria-hidden="true"><span class="wd__i" style="--i:' + i + '">' + esc(w) + "</span></span>";
    }).join(" ");
  }
  function splitChars(el) {
    label(el);
    var n = 0;
    el.innerHTML = words(el).map(function (w) {
      return '<span class="wdn" aria-hidden="true">' + Array.from(w).map(function (c) {
        return '<span class="ch" style="--i:' + (n++) + '">' + esc(c) + "</span>";
      }).join("") + "</span>";
    }).join(" ");
  }
  function scramble(el) {
    var target = el.textContent.trim().normalize("NFC"); label(el);
    var pool = "ABCDEFGHKLMNOPRSTUVXYĐƠƯ0123456789/+×";
    var start = null, dur = 1100;
    el.classList.add("is-scrambling");
    function step(t) {
      if (start === null) start = t;
      var p = Math.min(1, (t - start) / dur), done = Math.floor(p * target.length), out = "";
      for (var i = 0; i < target.length; i++) out += (i < done || target[i] === " ") ? target[i] : pool[(Math.random() * pool.length) | 0];
      el.textContent = out;
      if (p < 1) requestAnimationFrame(step); else { el.textContent = target; el.classList.remove("is-scrambling"); }
    }
    requestAnimationFrame(step);
  }
  var SPLIT = { lines: splitLines, words: splitWords, chars: splitChars };

  // ------------------------------------------------------------------ in-view
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      (en.target._fx || [en.target]).forEach(function (t) {
        t.classList.add("is-in");
        if (t._onIn) { t._onIn(); t._onIn = null; }
      });
      io.unobserve(en.target);
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0 });
  function watch(el) {                                   // watch through the unclipped parent box
    var host = el.parentElement || el;
    (host._fx = host._fx || []).push(el);
    io.observe(host);
  }

  // ------------------------------------------------------------------ per-section variants
  var scrollers = [];
  function headingsOf(sec) { return $$("h1, h2", sec).filter(function (h) { return !h.closest(".card, .gallery__item"); }); }
  function mediaOf(sec) { return $$(".media", sec).filter(function (m) { return !m.closest(".location, .summary, .gallery__item, .card"); }); }

  function applyHeading(h, v) {
    if (!v || v === "none") return;
    if (SPLIT[v]) SPLIT[v](h);
    h.classList.add("fxh", "fxh-" + v);
    if (v === "scramble") h._onIn = function () { scramble(h); };
    watch(h);
  }
  function applyImage(m, v) {
    if (!v || v === "none") return;
    m.classList.add("fxi", "fxi-" + v);
    watch(m);
  }
  function applyList(l, v) {
    if (!v || v === "none") return;
    l.classList.add("fxl", "fxl-" + v);
    Array.prototype.forEach.call(l.children, function (c, i) { c.style.setProperty("--i", i); });
    watch(l);
  }
  function applyScroll(sec, v) {
    if (!v || v === "none") return;
    if (v === "text-fill") {
      headingsOf(sec).slice(0, 1).forEach(function (h) {
        if (!h.querySelector(".wd, .ln, .wdn")) splitWords(h);
        h.classList.add("fxs-fill");
        scrollers.push({ kind: "fill", el: h, parts: $$(".wd__i, .ln__i, .ch", h) });
      });
      return;
    }
    mediaOf(sec).forEach(function (m) {
      var img = m.querySelector("img"); if (!img) return;
      m.classList.add("fxs-" + v);
      scrollers.push({ kind: v, el: m, img: img });
    });
  }

  function prepare() {
    $$("[data-fx-heading], [data-fx-image], [data-fx-list], [data-fx-scroll]").forEach(function (sec) {
      var d = sec.dataset;
      headingsOf(sec).forEach(function (h) { applyHeading(h, d.fxHeading); });
      mediaOf(sec).forEach(function (m) { applyImage(m, d.fxImage); });
      $$(LISTS, sec).forEach(function (l) { applyList(l, d.fxList); });
      applyScroll(sec, d.fxScroll);
      if (d.fxHero !== undefined && root.classList.contains("fx-load")) {
        // the hero plays on load, not on scroll
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          $$(".fxh, .fxi, .fxl", sec).forEach(function (el) { el.classList.add("is-in"); if (el._onIn) { el._onIn(); el._onIn = null; } });
          sec.classList.add("is-in");
        }); });
      }
    });
    frame();
  }
  var prepared = false;
  function once() { if (!prepared) { prepared = true; prepare(); } }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(once);
  setTimeout(function () {                               // safety net: never leave content hidden
    once();
    $$(".fxh, .fxi, .fxl, main > section").forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-in");
    });
  }, 2600);

  // ------------------------------------------------------------------ scroll-linked loop
  var strength = Math.max(0, Math.min(0.25, Number(cfg.parallax_strength) || 0.1));
  var mark = document.querySelector(".wordmark");
  var bar = null;
  if (page.progress) { bar = document.createElement("div"); bar.className = "fx-progress"; document.body.appendChild(bar); }
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = window.innerHeight;
    scrollers.forEach(function (s) {
      var r = s.el.getBoundingClientRect();
      if (r.bottom < -150 || r.top > vh + 150) return;
      var d = (r.top + r.height / 2 - vh / 2) / vh;                            // -1 … 1 through the viewport
      var p = Math.max(0, Math.min(1, 1 - (r.top + r.height * 0.3) / vh));     // 0 → 1 while entering
      if (s.kind === "parallax") { s.img.style.scale = "1.1"; s.img.style.translate = "0 " + (-d * strength * 100).toFixed(2) + "px"; }
      else if (s.kind === "zoom") { s.img.style.scale = (1 + 0.2 * p).toFixed(4); }
      else if (s.kind === "tilt") { s.img.style.scale = "1.12"; s.img.style.rotate = (d * -3).toFixed(2) + "deg"; }
      else if (s.kind === "fill") {
        var n = s.parts.length, lit = Math.round(p * 1.9 * n);
        s.parts.forEach(function (w, i) { w.style.opacity = i < lit ? "1" : "0.18"; });
      }
    });
    if (mark) { var mr = mark.getBoundingClientRect(); if (mr.top < vh) mark.style.translate = ((mr.top - vh) * 0.25).toFixed(1) + "px 0"; }
    if (bar) { var max = document.documentElement.scrollHeight - vh; bar.style.scale = (max > 0 ? window.scrollY / max : 0).toFixed(4) + " 1"; }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  // ------------------------------------------------------------------ hover
  if (fine) {
    var cards = ".card, .gallery__item, .panel, .bk-col, .location";
    if (hover.cards === "tilt") $$(cards).forEach(function (c) {
      c.classList.add("fx-tilt");
      c.addEventListener("pointermove", function (ev) {
        var r = c.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width - 0.5, y = (ev.clientY - r.top) / r.height - 0.5;
        c.style.transform = "perspective(900px) rotateX(" + (-y * 7).toFixed(2) + "deg) rotateY(" + (x * 9).toFixed(2) + "deg)";
      });
      c.addEventListener("pointerleave", function () { c.style.transform = ""; });
    });
    if (hover.cards === "spotlight") $$(cards).forEach(function (c) {
      c.classList.add("fx-spot");
      c.addEventListener("pointermove", function (ev) {
        var r = c.getBoundingClientRect();
        c.style.setProperty("--mx", (ev.clientX - r.left) + "px"); c.style.setProperty("--my", (ev.clientY - r.top) + "px");
      });
    });
    if (hover.buttons === "magnetic") $$(".btn").forEach(function (b) {
      b.addEventListener("pointermove", function (ev) {
        var r = b.getBoundingClientRect();
        b.style.translate = ((ev.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + "px " + ((ev.clientY - r.top - r.height / 2) * 0.32).toFixed(1) + "px";
      });
      b.addEventListener("pointerleave", function () { b.style.translate = "0 0"; });
    });
    if (page.cursor) {
      var dot = document.createElement("div"); dot.className = "fx-cursor"; document.body.appendChild(dot);
      var tx = -100, ty = -100, cx = -100, cy = -100;
      window.addEventListener("pointermove", function (ev) { tx = ev.clientX; ty = ev.clientY; }, { passive: true });
      document.addEventListener("pointerover", function (ev) { dot.classList.toggle("is-hover", !!ev.target.closest("a, button, label, .card, .gallery__item")); });
      (function loop() { cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18; dot.style.translate = cx.toFixed(1) + "px " + cy.toFixed(1) + "px"; requestAnimationFrame(loop); })();
    }
  }
})();
