/* Lạc Việt demo kit — motion v4 (GSAP + ScrollTrigger + Lenis; three.js only for a "3d" moment).
   Harmony rules (IBM Carbon motion, ui-ux-pro-max motion presets, Codrops ScrollTrigger demos):
   one productive reveal language for the whole site, one expressive hero, at most two scroll
   "moments" per page, short durations, small offsets, pins only on desktop. Choices come from
   spec.art_direction.motion4 via #fx-config and data-moment attributes; nothing runs for
   prefers-reduced-motion (html.fx is never set) and content is visible without JS. */
(function () {
  "use strict";
  var root = document.documentElement;
  if (!root.classList.contains("fx") || !window.gsap || !window.ScrollTrigger) { root.classList.remove("fx-load"); return; }
  gsap.registerPlugin(ScrollTrigger);
  var cfg = JSON.parse((document.getElementById("fx-config") || { textContent: "{}" }).textContent);
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var desktop = window.matchMedia("(min-width: 901px) and (pointer: fine)").matches;

  // ---------------------------------------------------------------- tempo tokens
  var TEMPO = {
    calm:      { dur: 0.9,  ease: "power2.out", stagger: 0.08, y: 14, img: 1.35, imgEase: "power3.inOut" },
    crisp:     { dur: 0.6,  ease: "power3.out", stagger: 0.05, y: 12, img: 1.05, imgEase: "power4.inOut" },
    energetic: { dur: 0.45, ease: "expo.out",   stagger: 0.04, y: 16, img: 0.9,  imgEase: "expo.inOut" }
  }[cfg.tempo || "crisp"];
  var reveal = cfg.reveal || { image: "up", text: "rise" };
  var CLIP = { up: "inset(100% 0% 0% 0%)", left: "inset(0% 100% 0% 0%)" };

  // ---------------------------------------------------------------- smooth scroll (desktop)
  var lenis = null;
  if (cfg.smooth_scroll && desktop && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (ev) {
        var id = a.getAttribute("href"); if (id.length < 2) return;
        var t = document.querySelector(id); if (!t) return;
        ev.preventDefault(); lenis.scrollTo(t, { offset: -90 });
      });
    });
  }

  // ---------------------------------------------------------------- helpers
  function splitWords(el) {
    if (el.dataset.split) return $$(".w4", el);
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = el.textContent.trim().split(/\s+/).map(function (w) {
      return '<span class="w4" aria-hidden="true">' + w.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</span>";
    }).join(" ");
    el.dataset.split = "1";
    return $$(".w4", el);
  }
  function textBlocks(sec) {                     // copy groups: eyebrow, heading, lead, buttons, meta
    return $$(".stack, .hero__content, .product__info, .intro__content, .appointment__body, .atelier__body, .philosophy__quote", sec)
      .filter(function (b) { return !b.parentElement.closest(".stack, .hero__content, .product__info, .intro__content, .appointment__body, .atelier__body, .philosophy__quote"); });
  }
  function media(sec) { return $$(".media", sec).filter(function (m) { return !m.closest(".location, .summary, .card, .gallery__item"); }); }
  var LISTS = ".collection__grid, .steps, .facts, .principles, .benefits, .specs, .related__grid, .gallery__grid, .info-grid, .story__notes";

  // ---------------------------------------------------------------- baseline reveal (one language)
  function revealText(block, trigger) {
    var kids = Array.prototype.slice.call(block.children).slice(0, 8);
    gsap.from(kids, { opacity: 0, y: reveal.text === "fade" ? 0 : TEMPO.y, duration: TEMPO.dur, ease: TEMPO.ease,
      stagger: TEMPO.stagger, scrollTrigger: { trigger: trigger || block, start: "top 85%", once: true } });
  }
  function revealMedia(m) {
    var img = m.querySelector("img");
    if (reveal.image === "fade") {
      gsap.from(m, { opacity: 0, duration: TEMPO.img, ease: TEMPO.ease, scrollTrigger: { trigger: m.parentElement, start: "top 85%", once: true } });
    } else {
      gsap.fromTo(m, { clipPath: CLIP[reveal.image] || CLIP.up }, { clipPath: "inset(0% 0% 0% 0%)", duration: TEMPO.img, ease: TEMPO.imgEase,
        scrollTrigger: { trigger: m.parentElement, start: "top 85%", once: true } });
    }
    if (img) gsap.from(img, { scale: 1.1, duration: TEMPO.img * 1.3, ease: "power2.out", scrollTrigger: { trigger: m.parentElement, start: "top 85%", once: true } });
  }
  function revealList(l) {
    var kids = Array.prototype.slice.call(l.children).slice(0, 8);
    gsap.from(kids, { opacity: 0, y: TEMPO.y, duration: TEMPO.dur, ease: TEMPO.ease, stagger: TEMPO.stagger,
      scrollTrigger: { trigger: l, start: "top 88%", once: true } });
  }

  // ---------------------------------------------------------------- hero signatures (expressive, once)
  function hero(sec) {
    var h1 = sec.querySelector("h1"), m = media(sec)[0], img = m && m.querySelector("img");
    var rest = $$(":scope > * > :not(h1), .hero__content > :not(h1), .product__info > :not(h1), .intro__content > :not(h1)", sec)
      .filter(function (x, i, a) { return a.indexOf(x) === i && !x.contains(h1); });
    var words = h1 ? splitWords(h1) : [];
    var tl = gsap.timeline({ defaults: { ease: "power3.out" }, onStart: function () { root.classList.remove("fx-load"); } });
    var kind = cfg.hero || "rise";
    if (m && kind === "expand") {
      tl.fromTo(m, { clipPath: "inset(18% 22% 18% 22% round 18px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 1.6, ease: "power4.inOut" }, 0);
      if (img) tl.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 2, ease: "power3.out" }, 0);
    } else if (m && kind === "curtain") {
      tl.fromTo(m, { clipPath: "inset(0% 50% 0% 50%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "power4.inOut" }, 0);
      if (img) tl.fromTo(img, { scale: 1.18 }, { scale: 1, duration: 2, ease: "power3.out" }, 0);
    } else if (m) {
      tl.fromTo(m, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "power2.out" }, 0);
      if (img) tl.fromTo(img, { scale: 1.12 }, { scale: 1, duration: 2.2, ease: "power2.out" }, 0);
    }
    var at = (kind === "expand" || kind === "curtain") ? 0.75 : 0.2;
    if (words.length) tl.from(words, { yPercent: 110, opacity: 0, duration: 0.9, stagger: 0.035, ease: "power4.out" }, at);
    if (rest.length) tl.from(rest, { opacity: 0, y: 12, duration: 0.7, stagger: 0.08 }, at + 0.35);
    tl.from(".site-header", { opacity: 0, y: -10, duration: 0.7 }, 0.1);
  }

  // ---------------------------------------------------------------- scroll moments (≤2 per page)
  var MOMENTS = {
    expand: function (sec) {                         // image grows from a framed card to full size while scrolling in
      var m = media(sec)[0]; if (!m) return false;
      gsap.fromTo(m, { clipPath: "inset(12% 16% 12% 16% round 20px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none",
        scrollTrigger: { trigger: sec, start: "top 85%", end: "top 15%", scrub: 1 } });
      var img = m.querySelector("img");
      if (img) gsap.fromTo(img, { scale: 1.3 }, { scale: 1, ease: "none", scrollTrigger: { trigger: sec, start: "top 85%", end: "top 15%", scrub: 1 } });
      return true;
    },
    stack: function (sec) {                          // previous section stays pinned and recedes while this one slides over it
      var prev = sec.previousElementSibling;
      if (!desktop || !prev || prev.offsetHeight > window.innerHeight * 1.4) return false;
      sec.classList.add("m4-stack-top");
      ScrollTrigger.create({ trigger: prev, start: "bottom bottom", endTrigger: sec, end: "top top", pin: true, pinSpacing: false });
      gsap.to(prev, { scale: 0.93, opacity: 0.45, transformOrigin: "50% 100%", ease: "none",
        scrollTrigger: { trigger: sec, start: "top bottom", end: "top top", scrub: true } });
      return true;
    },
    horizontal: function (sec) {                     // pinned horizontal track for a card row / gallery
      var track = sec.querySelector(".collection__grid, .gallery__grid, .related__grid");
      if (!desktop || !track) return false;
      sec.classList.add("m4-horizontal");
      var dist = function () { return Math.max(0, track.scrollWidth - track.clientWidth); };
      if (dist() < 80) { sec.classList.remove("m4-horizontal"); return false; }
      gsap.to(track.children, { x: function () { return -dist(); }, ease: "none",
        scrollTrigger: { trigger: sec, start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true } });
      return true;
    },
    highlight: function (sec) {                      // statement lights up word by word as it is read
      var h = sec.querySelector("h2"); if (!h) return false;
      var ws = splitWords(h);
      gsap.fromTo(ws, { opacity: 0.16 }, { opacity: 1, stagger: 0.1, ease: "none",
        scrollTrigger: { trigger: h, start: "top 80%", end: "bottom 35%", scrub: 1 } });
      return true;
    },
    "3d": function (sec) {                           // procedural metal ring (three.js), rotates with scroll; loads when near
      var m = media(sec)[0]; if (!m || !desktop) return false;
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return; io.disconnect();
        import(new URL(cfg.three_url, document.baseURI).href).then(function (mod) { mod.mountRing(m, sec, cfg.three_colors || {}); }).catch(function () {});
      }, { rootMargin: "600px 0px" });
      io.observe(sec);
      return true;
    }
  };

  // ---------------------------------------------------------------- run
  function init() {
    var sections = $$("main > section");
    sections.forEach(function (sec, i) {
      if (sec.hasAttribute("data-fx-hero")) { hero(sec); return; }
      var moment = sec.getAttribute("data-moment");
      var used = moment && MOMENTS[moment] ? MOMENTS[moment](sec) : false;
      textBlocks(sec).forEach(function (b) { revealText(b, sec); });
      if (!used || moment === "highlight" || moment === "stack") media(sec).forEach(revealMedia);
      if (moment !== "horizontal") $$(LISTS, sec).forEach(revealList);
    });
    ScrollTrigger.refresh();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(init); else init();
  setTimeout(function () { root.classList.remove("fx-load"); }, 2500);   // safety: never keep the hero hidden

  // ---------------------------------------------------------------- hover + page chrome
  var hover = cfg.hover || {}, page = cfg.page || {};
  if (window.matchMedia("(pointer: fine)").matches) {
    var cards = ".card, .gallery__item, .panel, .location";
    if (hover.cards === "tilt") $$(cards).forEach(function (c) {
      c.addEventListener("pointermove", function (ev) {
        var r = c.getBoundingClientRect();
        gsap.to(c, { rotationY: ((ev.clientX - r.left) / r.width - 0.5) * 8, rotationX: -((ev.clientY - r.top) / r.height - 0.5) * 6, transformPerspective: 900, duration: 0.4, ease: "power2.out" });
      });
      c.addEventListener("pointerleave", function () { gsap.to(c, { rotationX: 0, rotationY: 0, duration: 0.6, ease: "power3.out" }); });
    });
    if (hover.cards === "spotlight") $$(cards).forEach(function (c) {
      c.classList.add("fx-spot");
      c.addEventListener("pointermove", function (ev) { var r = c.getBoundingClientRect(); c.style.setProperty("--mx", (ev.clientX - r.left) + "px"); c.style.setProperty("--my", (ev.clientY - r.top) + "px"); });
    });
    if (hover.buttons === "magnetic") $$(".btn").forEach(function (b) {
      b.addEventListener("pointermove", function (ev) { var r = b.getBoundingClientRect(); gsap.to(b, { x: (ev.clientX - r.left - r.width / 2) * 0.2, y: (ev.clientY - r.top - r.height / 2) * 0.3, duration: 0.3, ease: "power2.out" }); });
      b.addEventListener("pointerleave", function () { gsap.to(b, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" }); });
    });
    if (page.cursor) {
      var dot = document.createElement("div"); dot.className = "fx-cursor"; document.body.appendChild(dot);
      var qx = gsap.quickTo(dot, "x", { duration: 0.35, ease: "power3" }), qy = gsap.quickTo(dot, "y", { duration: 0.35, ease: "power3" });
      window.addEventListener("pointermove", function (ev) { qx(ev.clientX); qy(ev.clientY); }, { passive: true });
      document.addEventListener("pointerover", function (ev) { dot.classList.toggle("is-hover", !!ev.target.closest("a, button, label, .card, .gallery__item")); });
    }
  }
  if (page.progress) {
    var bar = document.createElement("div"); bar.className = "fx-progress"; document.body.appendChild(bar);
    gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
  }
  var mark = document.querySelector(".wordmark");
  if (mark) gsap.fromTo(mark, { xPercent: 6 }, { xPercent: -6, ease: "none", scrollTrigger: { trigger: mark, start: "top bottom", end: "bottom top", scrub: 1 } });
})();
