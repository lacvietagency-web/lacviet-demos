/* Lạc Việt demo kit v1 — interaction mechanism only (menu, reveal, lightbox, booking demo). Nothing is sent anywhere. */
(function () {
  "use strict";

  // Mobile menu
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".menu-toggle");
  if (header && toggle) {
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
    });
  }

  // Reveal on scroll (fade-up)
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // Gallery lightbox (crossfade)
  var lightbox = document.querySelector(".lightbox");
  if (lightbox) {
    var items = Array.prototype.slice.call(document.querySelectorAll(".gallery__item"));
    var lbImg = lightbox.querySelector("img");
    var lbCap = lightbox.querySelector(".lightbox__caption");
    var current = 0, lastFocus = null;
    var show = function (i) {
      current = (i + items.length) % items.length;
      var src = items[current].querySelector("img");
      lbImg.style.opacity = "0";
      setTimeout(function () {
        lbImg.src = src.getAttribute("src"); lbImg.alt = src.alt;
        lbCap.textContent = items[current].querySelector(".card__title").textContent;
        lbImg.style.transition = "opacity .5s ease"; lbImg.style.opacity = "1";
      }, 120);
    };
    var open = function (i) { lastFocus = document.activeElement; lightbox.hidden = false; show(i); lightbox.querySelector(".lb-close").focus(); };
    var close = function () { lightbox.hidden = true; if (lastFocus) lastFocus.focus(); };
    items.forEach(function (btn, i) { btn.addEventListener("click", function () { open(i); }); });
    var opener = document.querySelector("[data-open-lightbox]");
    if (opener) opener.addEventListener("click", function () { open(0); });
    lightbox.querySelector(".lb-close").addEventListener("click", close);
    lightbox.querySelector(".lb-prev").addEventListener("click", function () { show(current - 1); });
    lightbox.querySelector(".lb-next").addEventListener("click", function () { show(current + 1); });
    lightbox.addEventListener("click", function (ev) { if (ev.target === lightbox) close(); });
    document.addEventListener("keydown", function (ev) {
      if (lightbox.hidden) return;
      if (ev.key === "Escape") close();
      if (ev.key === "ArrowLeft") show(current - 1);
      if (ev.key === "ArrowRight") show(current + 1);
    });
  }

  // Booking demo
  var grid = document.querySelector("[data-cal-grid]");
  if (!grid) return;
  var state = { date: null, time: null, option: null, focus: null };
  var sums = function (key, value) {
    document.querySelectorAll('[data-sum="' + key + '"]').forEach(function (el) { el.textContent = value; });
  };
  var activate = function (step) {
    document.querySelectorAll(".bk-col").forEach(function (c) { c.classList.toggle("is-active", c.dataset.step === step); });
  };
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var view = new Date(today.getFullYear(), today.getMonth(), 1);
  var label = document.querySelector("[data-cal-label]");
  var dows = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  var fmt = function (d) {
    var names = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    return names[d.getDay()] + ", " + String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear();
  };
  // Closed weekdays come from the spec (0 = Sunday … 6 = Saturday).
  var closed = (grid.dataset.closed || "").split(",").filter(Boolean).map(Number);
  var available = function (d) { return d >= today && closed.indexOf(d.getDay()) === -1; };
  var render = function () {
    label.textContent = "Tháng " + (view.getMonth() + 1) + ", " + view.getFullYear();
    grid.innerHTML = dows.map(function (d) { return '<span class="cal__dow">' + d + "</span>"; }).join("");
    var offset = (view.getDay() + 6) % 7;
    for (var i = 0; i < offset; i++) grid.insertAdjacentHTML("beforeend", "<span></span>");
    var days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    for (var dnum = 1; dnum <= days; dnum++) {
      var d = new Date(view.getFullYear(), view.getMonth(), dnum);
      var b = document.createElement("button");
      b.type = "button"; b.className = "cal__day"; b.textContent = dnum;
      if (!available(d)) b.disabled = true; else b.classList.add("is-available");
      if (state.date && d.getTime() === state.date.getTime()) b.classList.add("is-selected");
      b.addEventListener("click", (function (day) {
        return function () { state.date = day; sums("date", fmt(day)); render(); activate("time"); };
      })(d));
      grid.appendChild(b);
    }
  };
  document.querySelectorAll("[data-cal]").forEach(function (b) {
    b.addEventListener("click", function () {
      var next = new Date(view.getFullYear(), view.getMonth() + Number(b.dataset.cal), 1);
      if (next >= new Date(today.getFullYear(), today.getMonth(), 1)) { view = next; render(); }
    });
  });
  render();

  document.querySelectorAll(".chip[data-time]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      document.querySelectorAll(".chip[data-time]").forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
      chip.setAttribute("aria-pressed", "true");
      var start = chip.dataset.time.split(":");
      var end = new Date(0, 0, 0, Number(start[0]), Number(start[1]) + 45);
      state.time = chip.dataset.time + " – " + String(end.getHours()).padStart(2, "0") + ":" + String(end.getMinutes()).padStart(2, "0") + " (45 phút)";
      sums("time", state.time); activate("location");
    });
  });
  var setOption = function () {
    var checked = document.querySelector('input[name="option"]:checked');
    if (checked) { state.option = checked.value; sums("option", checked.value); }
  };
  document.querySelectorAll('input[name="option"]').forEach(function (r) { r.addEventListener("change", setOption); });
  setOption();

  var focus = document.querySelector("[data-focus-field]");
  var params = new URLSearchParams(location.search);
  if (focus) {
    if (params.get("focus")) {
      Array.prototype.forEach.call(focus.options, function (o) { if (o.text === params.get("focus")) focus.value = o.value; });
    }
    var setFocus = function () { state.focus = focus.value; sums("focus", focus.value); };
    focus.addEventListener("change", setFocus); setFocus();
  }

  var form = document.querySelector("[data-booking-form]");
  var confirmBtn = document.querySelector("[data-confirm]");
  var done = document.querySelector("[data-confirm-done]");
  if (form && confirmBtn) {
    confirmBtn.addEventListener("click", function () {
      var ok = true;
      form.querySelectorAll("input[required]").forEach(function (input) {
        var field = input.closest(".field");
        var valid = input.checkValidity() && input.value.trim() !== "";
        field.classList.toggle("is-invalid", !valid);
        if (!valid && ok) { ok = false; input.focus(); }
      });
      if (!state.date || !state.time) {
        ok = false;
        document.getElementById("booking-selector").scrollIntoView({ behavior: "smooth" });
        activate(state.date ? "time" : "date");
      }
      if (ok) done.classList.add("is-shown");
    });
  }
})();
