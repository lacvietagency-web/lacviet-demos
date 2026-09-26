/* Lạc Việt demo kit — motion layer (mechanism only; which effects run is chosen by ChatGPT in
   spec.art_direction.effects and emitted as #fx-config). Uses transform/opacity/clip-path only,
   individual `translate`/`scale` properties so effects never fight, and does nothing when the
   visitor prefers reduced motion (the .fx class is never added in that case). */
(function () {
  "use strict";
  var root = document.documentElement;
  if (!root.classList.contains("fx")) return;
  var cfgEl = document.getElementById("fx-config");
  var fx = cfgEl ? JSON.parse(cfgEl.textContent) : {};
  var fine = window.matchMedia("(pointer: fine)").matches;
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  // ---- split headings into masked lines -------------------------------------------------
  function splitLines(el) {
    if (el.dataset.splitDone) return;
    var text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    var words = text.split(/\s+/);
    el.innerHTML = words.map(function (w) { return '<span class="w" aria-hidden="true">' + w.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</span>"; }).join(" ");
    var lines = [], top = null;
    $$(".w", el).forEach(function (w) {
      if (top === null || Math.abs(w.offsetTop - top) > 4) { lines.push([]); top = w.offsetTop; }
      lines[lines.length - 1].push(w.textContent);
    });
    el.innerHTML = lines.map(function (ws, i) {
      return '<span class="ln" aria-hidden="true"><span class="ln__i" style="--i:' + i + '">' + ws.join(" ").replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</span></span>";
    }).join(" ");
    el.dataset.splitDone = "1";
    el.classList.add("fx-split");
  }
  var splitSel = { hero: ".hero h1, .product h1, .intro h1", all: ".hero h1, .product h1, .intro h1, main h2" }[fx.split_headings] || "";

  // ---- in-view observer -----------------------------------------------------------------
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      (en.target._fxTargets || [en.target]).forEach(function (t) { t.classList.add("is-in"); });
      io.unobserve(en.target);
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0 });
  // A clip-path'd element can report no intersection, so reveal media is watched through its
  // (unclipped) parent box.
  function watchThroughParent(el) {
    var host = el.parentElement || el;
    (host._fxTargets = host._fxTargets || []).push(el);
    io.observe(host);
  }

  function prepare() {
    if (splitSel) $$(splitSel).forEach(function (el) { splitLines(el); io.observe(el); });
    if (fx.image_reveal) $$("main .media").forEach(function (m) {
      if (m.closest(".location, .summary, .gallery__item")) return;   // small UI images stay put
      m.classList.add("fx-reveal"); watchThroughParent(m);
    });
    if (fx.stagger) $$(".collection__grid, .steps, .facts, .principles, .benefits, .specs, .related__grid, .gallery__grid, .info-grid, .story__notes").forEach(function (list) {
      list.classList.add("fx-stagger");
      Array.prototype.forEach.call(list.children, function (c, i) { c.style.setProperty("--i", i); });
      io.observe(list);
    });
    // hero choreography: runs on load instead of on scroll
    if (fx.load_sequence) {
      root.classList.add("fx-load");
      requestAnimationFrame(function () {
        $$(".hero, .product, .intro").forEach(function (h) {
          $$(".fx-split, .fx-reveal", h).forEach(function (el) { el.classList.add("is-in"); });
          h.classList.add("is-in");
        });
      });
    }
  }
  var prepared = false;
  function once() { if (!prepared) { prepared = true; prepare(); } }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(once);
  setTimeout(function () {            // safety net: never leave content hidden
    once();
    $$(".fx-split, .fx-reveal, .fx-stagger, .hero, .product, .intro").forEach(function (el) {
      var r = el.getBoundingClientRect(); if (r.top < window.innerHeight) el.classList.add("is-in");
    });
  }, 2500);

  // ---- parallax + wordmark drift + scroll progress (one rAF loop) ------------------------
  var par = [], strength = Math.max(0, Math.min(0.25, Number(fx.parallax) || 0));
  if (strength) $$(".hero__media img, .split__media img, .philosophy .media img, .appointment > .media img, .product > .media img, .intro > .media img, .atelier > .media img, .story .media img").forEach(function (img) {
    par.push(img); img.style.scale = "1.08";
  });
  var mark = document.querySelector(".wordmark");
  var bar = null;
  if (fx.scroll_progress) { bar = document.createElement("div"); bar.className = "fx-progress"; document.body.appendChild(bar); }
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = window.innerHeight;
    par.forEach(function (img) {
      var r = img.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var d = (r.top + r.height / 2 - vh / 2) / vh;          // -1 … 1 across the viewport
      img.style.translate = "0 " + (-d * strength * 100).toFixed(2) + "px";
    });
    if (mark) {
      var mr = mark.getBoundingClientRect();
      if (mr.top < vh) mark.style.translate = ((mr.top - vh) * 0.25).toFixed(1) + "px 0";
    }
    if (bar) {
      var max = document.documentElement.scrollHeight - vh;
      bar.style.scale = (max > 0 ? window.scrollY / max : 0).toFixed(4) + " 1";
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  if (par.length || mark || bar) { window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("resize", onScroll); frame(); }

  // ---- magnetic buttons (mouse only) ------------------------------------------------------
  if (fx.magnetic && fine) $$(".btn").forEach(function (b) {
    b.addEventListener("pointermove", function (ev) {
      var r = b.getBoundingClientRect();
      var x = (ev.clientX - r.left - r.width / 2) * 0.22, y = (ev.clientY - r.top - r.height / 2) * 0.32;
      b.style.translate = x.toFixed(1) + "px " + y.toFixed(1) + "px";
    });
    b.addEventListener("pointerleave", function () { b.style.translate = "0 0"; });
  });
})();
