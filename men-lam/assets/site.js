/* MEN LAM — behaviour. Works without JS for reading; JS adds cart, filters, booking, forms and the motion layer. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var DATA = window.MENLAM || { products: [] };
  var money = function (n) { return n.toLocaleString("vi-VN") + " ₫"; };
  var norm = function (s) { return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d"); };   // "binh sen" finds "Bình Sen"
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem("menlam:" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("menlam:" + k, JSON.stringify(v)); } catch (e) {} }
  };
  var byId = {}; DATA.products.forEach(function (p) { byId[p.id] = p; });

  /* toast */
  var toastEl = document.createElement("div"); toastEl.className = "toast"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl);
  var toastT; function toast(msg) { toastEl.textContent = msg; toastEl.classList.add("is-on"); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("is-on"); }, 2600); }

  /* menu */
  var menu = $(".menu"), menuBtn = $(".menu-btn");
  function setMenu(open) {
    if (!menu) return; menu.classList.toggle("is-open", open); menuBtn && menuBtn.setAttribute("aria-expanded", open);
    menu.setAttribute("aria-hidden", !open); document.documentElement.style.overflow = open ? "hidden" : "";
    if (open) { var f = $("a", menu); f && f.focus(); } else menuBtn && menuBtn.focus();
  }
  menuBtn && menuBtn.addEventListener("click", function () { setMenu(true); });
  $(".menu__close") && $(".menu__close").addEventListener("click", function () { setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu && menu.classList.contains("is-open")) setMenu(false); });
  menu && menu.addEventListener("keydown", function (e) {
    if (e.key !== "Tab") return; var f = $$("button, a", menu), first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); } else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  });

  /* cart */
  var cart = store.get("cart", {});
  function cartCount() { return Object.keys(cart).reduce(function (s, k) { return s + cart[k]; }, 0); }
  function saveCart() { store.set("cart", cart); $$(".cart-count").forEach(function (el) { el.textContent = cartCount() || ""; }); renderCart(); }
  function add(id, q) {
    var p = byId[id]; if (!p || p.stock < 1) return; var cur = cart[id] || 0;
    if (cur >= p.stock) { toast("Bạn đã chọn hết " + p.stock + " món còn trong kho"); return; }
    cart[id] = Math.min(p.stock, cur + q); saveCart(); toast("Đã thêm “" + p.name + "” vào giỏ" + (cur + q > p.stock ? " (tối đa " + p.stock + " món)" : ""));
  }
  $$("[data-add]").forEach(function (b) {
    b.addEventListener("click", function () { var q = $("[data-qty-input]"); add(b.getAttribute("data-add"), q ? Math.max(1, parseInt(q.value, 10) || 1) : 1); });
  });
  $$("[data-qty]").forEach(function (box) {
    var input = $("input", box), max = parseInt(box.getAttribute("data-max"), 10) || 99;
    $$("button", box).forEach(function (b) {
      b.addEventListener("click", function () { var v = (parseInt(input.value, 10) || 1) + parseInt(b.getAttribute("data-step"), 10); input.value = Math.max(1, Math.min(max, v)); });
    });
  });

  var SHIP_FREE = 1500000, SHIP = 35000;
  function renderCart() {
    var list = $("[data-cart-list]"); if (!list) return;
    var ids = Object.keys(cart).filter(function (k) { return byId[k] && cart[k] > 0; }), sub = 0;
    list.innerHTML = ids.length ? "" : '<p class="empty">Giỏ hàng đang trống. <a class="link" href="cua-hang.html">Xem cửa hàng</a></p>';
    ids.forEach(function (id) {
      var p = byId[id], line = document.createElement("div"); sub += p.price * cart[id]; line.className = "cart-line";
      line.innerHTML = '<img src="assets/img/' + p.id + '-640.webp" alt="" width="96" height="120" loading="lazy">' +
        '<div><h3><a href="san-pham/' + p.id + '.html">' + p.name + '</a></h3><p class="muted" style="margin:0">' + money(p.price) + '</p>' +
        '<div class="qty" data-line="' + id + '"><button type="button" aria-label="Bớt 1" data-d="-1">−</button><input aria-label="Số lượng" value="' + cart[id] + '" inputmode="numeric"><button type="button" aria-label="Thêm 1" data-d="1">+</button></div></div>' +
        '<div><strong>' + money(p.price * cart[id]) + '</strong><br><button class="remove" type="button" data-remove="' + id + '">Xoá</button></div>';
      list.appendChild(line);
    });
    $$("[data-line]", list).forEach(function (box) {
      var id = box.getAttribute("data-line");
      $$("button", box).forEach(function (b) { b.addEventListener("click", function () { cart[id] = Math.max(1, Math.min(byId[id].stock, cart[id] + parseInt(b.getAttribute("data-d"), 10))); saveCart(); }); });
      var inp = $("input", box); inp.addEventListener("change", function () { var v = parseInt(inp.value, 10); cart[id] = Math.max(1, Math.min(byId[id].stock, isNaN(v) ? 1 : v)); saveCart(); });
    });
    $$("[data-remove]", list).forEach(function (b) { b.addEventListener("click", function () { delete cart[b.getAttribute("data-remove")]; saveCart(); }); });
    var ship = sub === 0 || sub >= SHIP_FREE ? 0 : SHIP;
    $("[data-sub]").textContent = money(sub); $("[data-ship]").textContent = ship ? money(ship) : (sub ? "Miễn phí" : "—");
    $("[data-total]").textContent = money(sub + ship);
    var left = $("[data-free-left]"); if (left) left.textContent = sub && sub < SHIP_FREE ? "Mua thêm " + money(SHIP_FREE - sub) + " để được miễn phí giao hàng." : "";
    var go = $("[data-checkout]"); if (go) go.disabled = !ids.length;
  }

  /* form validation shared by checkout, booking, contact, newsletter */
  var RULES = {
    name: function (v) { return v.trim().length >= 2 || "Vui lòng nhập họ tên."; },
    phone: function (v) { return /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(v.replace(/[\s.]/g, "")) || "Số điện thoại Việt Nam chưa đúng (vd 0912 345 678)."; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "Email chưa đúng định dạng."; },
    required: function (v) { return v.trim().length > 0 || "Vui lòng điền mục này."; }
  };
  function validate(form) {
    var ok = true;
    $$("[data-rule]", form).forEach(function (input) {
      var r = RULES[input.getAttribute("data-rule")](input.value), err = $("#" + input.id + "-err");
      input.setAttribute("aria-invalid", r !== true); if (err) err.textContent = r === true ? "" : r; if (r !== true && ok) { ok = false; input.focus(); }
    });
    return ok;
  }
  function code(prefix) { return prefix + "-" + Date.now().toString(36).toUpperCase().slice(-6); }

  var checkout = $("[data-checkout-form]");
  checkout && checkout.addEventListener("submit", function (e) {
    e.preventDefault(); if (!cartCount() || !validate(checkout)) return;
    var id = code("ML"), orders = store.get("orders", []);
    orders.push({ id: id, at: new Date().toISOString(), items: cart, name: checkout.elements.name.value }); store.set("orders", orders);
    cart = {}; store.set("cart", cart); $$(".cart-count").forEach(function (el) { el.textContent = ""; });
    checkout.hidden = true; $("[data-cart-list]").hidden = true;
    var done = $("[data-order-done]"); done.hidden = false; $("[data-order-id]", done).textContent = id; done.focus();
  });

  /* shop: filter + sort + search, state kept in the URL */
  var grid = $("[data-shop]");
  if (grid) {
    var cards = $$("[data-product]", grid), state = new URLSearchParams(location.search), q = $("[data-search]"), sort = $("[data-sort]");
    function apply() {
      var col = state.get("bst") || "all", term = norm((q.value || "").trim()), shown = 0;
      $$("[data-filter]").forEach(function (c) { c.setAttribute("aria-pressed", c.getAttribute("data-filter") === col); });
      var list = cards.slice().sort(function (a, b) {
        var pa = +a.getAttribute("data-price"), pb = +b.getAttribute("data-price");
        return sort.value === "asc" ? pa - pb : sort.value === "desc" ? pb - pa : +a.getAttribute("data-i") - +b.getAttribute("data-i");
      });
      list.forEach(function (c) {
        var hit = (col === "all" || c.getAttribute("data-collection") === col) && (!term || norm(c.getAttribute("data-text")).indexOf(term) > -1);
        c.hidden = !hit; if (hit) shown++; grid.appendChild(c);
      });
      $("[data-count]").textContent = shown + " sản phẩm"; $("[data-none]").hidden = shown > 0;
      history.replaceState(null, "", state.toString() ? "?" + state.toString() : location.pathname);
    }
    $$("[data-filter]").forEach(function (c) { c.addEventListener("click", function () { var v = c.getAttribute("data-filter"); v === "all" ? state.delete("bst") : state.set("bst", v); apply(); }); });
    q.addEventListener("input", apply); sort.addEventListener("change", apply); apply();
  }

  /* workshop booking: class → day (next 14 days, closed Mondays, seats left) → slot → details */
  var booking = $("[data-booking]");
  if (booking) {
    var days = $("[data-days]"), slots = $("[data-slots]"), pick = { day: null, slot: null }, wd = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    for (var i = 1; i <= 14; i++) {
      var d = new Date(); d.setDate(d.getDate() + i);
      var b = document.createElement("button"), full = (d.getDate() * 7) % 11 === 0;
      b.type = "button"; b.className = "day"; b.setAttribute("aria-pressed", "false"); b.disabled = d.getDay() === 1 || full;
      b.innerHTML = wd[d.getDay()] + "<br>" + d.getDate() + "/" + (d.getMonth() + 1) + "<small>" + (d.getDay() === 1 ? "Nghỉ" : full ? "Hết chỗ" : "Còn chỗ") + "</small>";
      b.setAttribute("data-date", d.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "numeric" }));
      days.appendChild(b);
    }
    $$(".day", days).forEach(function (b) {
      b.addEventListener("click", function () { $$(".day", days).forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); pick.day = b.getAttribute("data-date"); summary(); });
    });
    $$("[data-slot]", slots).forEach(function (b) {
      b.addEventListener("click", function () { $$("[data-slot]", slots).forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); pick.slot = b.getAttribute("data-slot"); summary(); });
    });
    $$("input[name=class]", booking).forEach(function (r) { r.addEventListener("change", summary); });
    function summary() {
      var c = $("input[name=class]:checked", booking);
      $("[data-pick-class]").textContent = c ? c.getAttribute("data-name") : "Chưa chọn";
      $("[data-pick-day]").textContent = pick.day || "Chưa chọn"; $("[data-pick-slot]").textContent = pick.slot || "Chưa chọn";
      $("[data-pick-price]").textContent = c ? money(+c.getAttribute("data-price") * (+booking.elements.people.value || 1)) : "—";
    }
    booking.elements.people.addEventListener("change", summary);
    booking.addEventListener("submit", function (e) {
      e.preventDefault(); var err = $("#pick-err");
      if (!$("input[name=class]:checked", booking) || !pick.day || !pick.slot) { err.textContent = "Vui lòng chọn lớp, ngày và khung giờ."; err.setAttribute("tabindex", "-1"); err.focus(); err.scrollIntoView({ block: "center" }); return; }
      err.textContent = ""; if (!validate(booking)) return;
      var id = code("WS"), list = store.get("bookings", []); list.push({ id: id, day: pick.day, slot: pick.slot }); store.set("bookings", list);
      booking.hidden = true; var done = $("[data-booking-done]"); done.hidden = false; $("[data-booking-id]", done).textContent = id + " · " + pick.day + " · " + pick.slot; done.focus();
    });
    summary();
  }

  /* contact + newsletter */
  $$("[data-simple-form]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault(); if (!validate(f)) return; var done = $("[data-done]", f.parentNode);
      f.reset(); if (done) { done.hidden = false; done.focus(); } else toast("Cảm ơn bạn — MEN LAM sẽ phản hồi trong 24 giờ.");
    });
  });

  /* accordion */
  $$(".acc__btn").forEach(function (b) { b.addEventListener("click", function () { b.setAttribute("aria-expanded", b.getAttribute("aria-expanded") !== "true"); }); });

  saveCart();

  /* ---------- motion layer (skipped entirely for prefers-reduced-motion) ---------- */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !window.gsap) return;
  var gsap = window.gsap; gsap.registerPlugin(window.ScrollTrigger);
  if (window.Lenis) {             // motion|lerp-smooth-scroll-core: light inertia, native scroll stays the source of truth
    var lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true });
    lenis.on("scroll", window.ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); }); gsap.ticker.lagSmoothing(0);
  }

  /* signature moment: one continuous camera move from three stills of the same scene */
  var hero = $(".hero");
  if (hero) {
    var shots = $$(".hero__shot", hero);
    var tl = gsap.timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom bottom", scrub: 0.8 } });
    // the vase sits at ~41% in shot 1 and ~49% in shot 2: zoom around the vase and drift it to centre so the cut is invisible
    gsap.set(shots[0], { transformOrigin: "41% 62%" });
    tl.to(shots[0], { scale: 1.32, xPercent: 8, yPercent: -2, ease: "none", duration: 1 }, 0)
      .fromTo(shots[1], { opacity: 0, scale: 1.18, filter: "blur(10px)" }, { opacity: 1, scale: 1.04, filter: "blur(0px)", ease: "none", duration: .55 }, .35)
      .to(shots[1], { scale: 1.2, ease: "none", duration: .45 }, .9)
      .fromTo(shots[2], { opacity: 0, scale: 1.15, filter: "blur(8px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", ease: "none", duration: .45 }, 1.05)
      .to(".hero__copy", { yPercent: -18, opacity: 0, ease: "none", duration: .5 }, .55);
  }

  /* typography|mask-line-word-reveal: headings rise line by line out of a mask (open above/below for Vietnamese marks) */
  $$("[data-reveal]").forEach(function (h) {
    if (h.closest(".hero")) return;
    var words = h.textContent.trim().split(/\s+/); h.setAttribute("aria-label", h.textContent.trim());
    h.innerHTML = words.map(function (w) { return '<span class="reveal-line" style="display:inline-block" aria-hidden="true"><span>' + w + "</span></span>"; }).join(" ");
    gsap.from($$(".reveal-line > span", h), { yPercent: 110, duration: 1.1, ease: "power4.out", stagger: 0.035, scrollTrigger: { trigger: h, start: "top 85%" } });
  });

  /* imagery|oversized-inner-image-zoom: images drift inside their frame */
  $$(".frame:not(.card .frame) img").forEach(function (img) {
    gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: img.parentNode, start: "top bottom", end: "bottom top", scrub: true } });
  });

  /* quiet entrance for cards and blocks */
  $$("[data-rise]").forEach(function (el) {
    gsap.from(el.children.length > 1 && el.hasAttribute("data-stagger") ? el.children : el,
      { y: 40, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: el, start: "top 88%" } });
  });

  /* craft page scene stack: each scene scales back slightly as the next one covers it */
  if (window.matchMedia("(min-width: 761px)").matches) {
    $$(".scene").forEach(function (s, i, all) {
      if (i === all.length - 1) return;
      gsap.to(s, { scale: .94, opacity: .55, ease: "none", scrollTrigger: { trigger: all[i + 1], start: "top bottom", end: "top 72px", scrub: true } });
    });
  }
})();
