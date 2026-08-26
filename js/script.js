/* ============================================================
   SimmonsCooper Partners — script.js
   Shared behaviour across every page.
   ============================================================ */
(function () {
  "use strict";

  const header = document.getElementById("siteHeader");
  const nav = document.getElementById("primaryNav");
  const toggle = document.getElementById("menuToggle");
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));

  /* ---------- Sticky header state ---------- */
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 40) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile / tablet menu (drawer + submenu accordion) ---------- */
  const DRAWER_MQ = "(min-width: 1181px)";
  let backdrop = null;

  if (nav && toggle) {
    backdrop = document.createElement("div");
    backdrop.className = "nav-backdrop";
    document.body.appendChild(backdrop);
  }

  /* every top-level item that owns a dropdown panel */
  const dropItems = nav ? Array.from(nav.querySelectorAll(".nav-item")).filter((i) => i.querySelector(".nav-panel")) : [];

  const collapseSubmenus = () => {
    dropItems.forEach((item) => {
      item.classList.remove("open");
      const b = item.querySelector(".nav-sub-toggle");
      if (b) b.setAttribute("aria-expanded", "false");
    });
  };

  const setMenu = (open) => {
    if (!nav || !toggle) return;
    nav.classList.toggle("open", open);
    toggle.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    if (backdrop) backdrop.classList.toggle("is-shown", open);
    if (!open) collapseSubmenus();
  };

  const closeMenu = () => setMenu(false);

  if (toggle && nav) {
    toggle.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
    if (backdrop) backdrop.addEventListener("click", closeMenu);
    nav.querySelectorAll("a").forEach((l) => l.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });

    /* accordion toggles — hidden by CSS above the drawer breakpoint */
    dropItems.forEach((item) => {
      const link = item.querySelector(".nav-link");
      const label = ((link && link.textContent) || "submenu").trim();
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "nav-sub-toggle";
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "Show " + label + " links");
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const willOpen = !item.classList.contains("open");
        collapseSubmenus();
        item.classList.toggle("open", willOpen);
        btn.setAttribute("aria-expanded", String(willOpen));
      });
      item.appendChild(btn);
    });

    /* leaving drawer widths (rotate / resize) resets everything */
    const mq = window.matchMedia(DRAWER_MQ);
    const onBreakpoint = () => {
      if (mq.matches) closeMenu();
    };
    if (mq.addEventListener) mq.addEventListener("change", onBreakpoint);
    else if (mq.addListener) mq.addListener(onBreakpoint);
    onBreakpoint();
  }

  /* ---------- Smooth scroll for same-page anchors ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id.length <= 1) return;
      let target = null;
      try {
        target = document.querySelector(id);
      } catch (err) {
        return;
      }
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: y, behavior: "smooth" });
    });
  });

  /* ---------- Scroll reveal ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Count-up stats ---------- */
  const stats = document.querySelectorAll(".stat-num");
  const runCount = (el) => {
    const target = parseInt(el.dataset.target, 10) || 0;
    const suffix = el.dataset.suffix || "";
    const duration = 1600;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ("IntersectionObserver" in window && stats.length) {
    const so = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runCount(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    stats.forEach((el) => so.observe(el));
  } else {
    stats.forEach((el) => (el.textContent = (el.dataset.target || "") + (el.dataset.suffix || "")));
  }

  /* ---------- Section scroll-spy (home page only) ---------- */
  const hashLinks = navLinks.filter((l) => (l.getAttribute("href") || "").startsWith("#"));
  const sections = hashLinks
    .map((l) => {
      try {
        return document.querySelector(l.getAttribute("href"));
      } catch (err) {
        return null;
      }
    })
    .filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = "#" + entry.target.id;
            hashLinks.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === id));
          }
        });
      },
      { threshold: 0.5, rootMargin: "-20% 0px -60% 0px" }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Hero background slideshow ---------- */
  (function heroSlideshow() {
    const slides = Array.from(document.querySelectorAll(".hero-slide"));
    if (slides.length < 2) return;

    const bars = Array.from(document.querySelectorAll(".hero-bar"));
    const caption = document.querySelector(".hero-caption");
    const controls = document.getElementById("heroControls");

    const cssMs = getComputedStyle(document.documentElement)
      .getPropertyValue("--hero-slide-ms")
      .trim();
    const parsed = parseFloat(cssMs);
    const HOLD = parsed ? (cssMs.endsWith("ms") ? parsed : parsed * 1000) : 6000;

    let index = slides.findIndex((s) => s.classList.contains("is-active"));
    if (index < 0) index = 0;
    let timer = null;

    const restartAnim = (el) => {
      if (!el) return;
      el.style.animation = "none";
      void el.offsetWidth;
      el.style.animation = "";
    };

    const show = (n) => {
      index = (n + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const on = i === index;
        slide.classList.toggle("is-active", on);
        if (on) restartAnim(slide.querySelector("img"));
      });
      bars.forEach((bar, i) => {
        bar.classList.remove("is-active");
        if (i === index) {
          restartAnim(bar.querySelector(".hero-bar-fill"));
          bar.classList.add("is-active");
        }
      });
      if (caption) {
        const text = slides[index].getAttribute("data-caption");
        if (text) caption.textContent = text;
      }
    };

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const start = () => {
      stop();
      timer = setInterval(() => show(index + 1), HOLD);
    };
    const goTo = (n) => {
      show(n);
      start();
    };

    if (controls) {
      controls.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const dir = btn.getAttribute("data-hero");
        const jump = btn.getAttribute("data-hero-go");
        if (dir === "next") goTo(index + 1);
        else if (dir === "prev") goTo(index - 1);
        else if (jump !== null) goTo(parseInt(jump, 10));
      });
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else goTo(index + 1);
    });

    show(index);
    start();
  })();

  /* ============================================================
     ANALYTICS  (brief §13)
     Pushes to window.dataLayer so GA4 / GTM can pick events up.
     ============================================================ */
  window.dataLayer = window.dataLayer || [];
  const track = (event, params) => {
    window.dataLayer.push(
      Object.assign(
        {
          event: event,
          page_path: window.location.pathname,
          page_title: document.title,
        },
        params || {}
      )
    );
  };

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-track]");
    if (!el) return;
    track("cta_click", { cta_id: el.getAttribute("data-track"), cta_text: (el.textContent || "").trim().slice(0, 60) });
  });

  /* ============================================================
     ENQUIRY FORMS  (brief §12)
     Source capture + routing. Replace the demo submit handler with
     a POST to the CRM endpoint (HubSpot) when the back end is live.
     ============================================================ */
  const pageName = document.body.getAttribute("data-page") || "";
  document.querySelectorAll("[data-source-page]").forEach((i) => {
    i.value = pageName + " — " + document.title;
  });
  document.querySelectorAll("[data-source-url]").forEach((i) => {
    i.value = window.location.href;
  });

  const syncRouting = (form) => {
    const select = form.querySelector("[data-routing]");
    const hidden = form.querySelector("[data-routing-team]");
    if (select && hidden) hidden.value = select.value;
  };
  document.querySelectorAll("form").forEach((form) => {
    syncRouting(form);
    const select = form.querySelector("[data-routing]");
    if (select) select.addEventListener("change", () => syncRouting(form));
  });

  const showStatus = (form, message) => {
    const box = form.querySelector(".form-status");
    if (!box) return;
    box.textContent = message;
    box.classList.add("is-shown");
  };

  document.querySelectorAll("form[data-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (typeof form.reportValidity === "function" && !form.reportValidity()) return;

      syncRouting(form);
      const kind = form.getAttribute("data-form");
      const team = (form.querySelector("[data-routing-team]") || {}).value || "";

      track("form_submit", {
        form_id: form.id || kind,
        form_type: kind,
        routing_team: team,
        source_page: pageName,
      });

      let message;
      if (kind === "newsletter") {
        message = "Thank you — please check your inbox to confirm your subscription.";
      } else if (kind === "notify") {
        message = "Thank you — we will email you as soon as this title publishes.";
      } else if (kind === "application") {
        message = "Application received. It has been sent to HR and you will hear from us within two weeks.";
      } else {
        message =
          "Thank you — your enquiry has been received" +
          (team ? " and routed to the " + team + "." : ".") +
          " A lawyer will reply within 24 hours.";
      }
      showStatus(form, message);
      form.querySelectorAll("input, textarea, select").forEach((f) => {
        if (f.type !== "hidden" && f.type !== "submit") {
          if (f.type === "checkbox") f.checked = false;
          else if (f.tagName !== "SELECT") f.value = "";
        }
      });

      /* TODO (back end): POST the FormData to the CRM endpoint here.
         The routing_team, source_page and source_url fields are already
         populated and should be passed through to HubSpot. */
    });
  });

  /* ============================================================
     FILTERS  (insights, services, careers)
     ============================================================ */
  (function filters() {
    const bars = Array.from(document.querySelectorAll("[data-filter-group]"));
    if (!bars.length) return;

    const items = Array.from(document.querySelectorAll(".filterable"));
    const empty = document.querySelector("[data-empty]");
    const state = {};
    bars.forEach((b) => (state[b.getAttribute("data-filter-group")] = "all"));

    const apply = () => {
      let visible = 0;
      items.forEach((item) => {
        const ok = Object.keys(state).every((key) => {
          const want = state[key];
          if (want === "all") return true;
          return (item.getAttribute("data-" + key) || "") === want;
        });
        item.classList.toggle("is-hidden", !ok);
        if (ok) visible++;
      });
      if (empty) empty.classList.toggle("is-hidden", visible > 0);
      track("filter_apply", { filters: JSON.stringify(state), results: visible });
    };

    bars.forEach((bar) => {
      bar.addEventListener("click", (e) => {
        const chip = e.target.closest("[data-filter]");
        if (!chip) return;
        const group = chip.getAttribute("data-filter");
        state[group] = chip.getAttribute("data-value");
        bar.querySelectorAll("[data-filter]").forEach((c) => c.classList.toggle("is-active", c === chip));
        apply();
      });
    });

    document.querySelectorAll("[data-filter-reset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        bars.forEach((bar) => {
          const group = bar.getAttribute("data-filter-group");
          state[group] = "all";
          bar.querySelectorAll("[data-filter]").forEach((c) =>
            c.classList.toggle("is-active", c.getAttribute("data-value") === "all")
          );
        });
        apply();
      });
    });
  })();

  /* ============================================================
     PEOPLE SEARCH  (our-people.html)
     Filters the profile cards live on name, role and practice areas.
     ============================================================ */
  (function peopleSearch() {
    const form = document.querySelector("[data-people-search]");
    if (!form) return;

    const input = form.querySelector('input[type="search"], input[name="q"]');
    if (!input) return;

    const status = document.querySelector("[data-people-count]");
    const empty = document.querySelector("[data-people-empty]");
    const groups = Array.from(document.querySelectorAll(".people-group"));
    const cards = Array.from(document.querySelectorAll(".person"));
    if (!cards.length) return;

    const norm = (s) =>
      (s || "")
        .toLowerCase()
        .replace(/[\[\]]/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim();

    /* Build a haystack once per card: name + role + practice areas. */
    const records = cards.map((card) => {
      const pick = (sel) => {
        const el = card.querySelector(sel);
        return el ? el.textContent : "";
      };
      return {
        card: card,
        group: card.closest(".people-group"),
        haystack: norm([pick(".person-name"), pick(".person-role"), pick(".person-areas")].join(" ")),
      };
    });

    const total = records.length;
    let lastQuery = null;

    /* Remember each group's published headcount before any filtering. */
    groups.forEach((group) => {
      const countEl = group.querySelector(".people-group-head span");
      if (countEl && !countEl.hasAttribute("data-total")) {
        countEl.setAttribute("data-total", countEl.textContent.trim());
      }
    });

    const setCount = (visible, query) => {
      if (!status) return;
      if (!query) {
        status.textContent = total + " " + (total === 1 ? "person" : "people") + " listed.";
        return;
      }
      status.textContent =
        visible === 0
          ? "No matches for “" + query + "”."
          : visible + " of " + total + " " + (visible === 1 ? "match" : "matches") + " “" + query + "”.";
    };

    const apply = () => {
      const query = norm(input.value);
      if (query === lastQuery) return;
      lastQuery = query;

      const terms = query ? query.split(" ") : [];
      let visible = 0;

      records.forEach((rec) => {
        const ok = terms.every((t) => rec.haystack.indexOf(t) !== -1);
        rec.card.classList.toggle("is-hidden", !ok);
        /* Cards revealed after the observer has passed still need the reveal class. */
        if (ok) {
          rec.card.classList.add("in");
          visible++;
        }
      });

      /* Hide a seniority group entirely when none of its cards survive,
         and keep its headline count honest while a search is active. */
      groups.forEach((group) => {
        const inGroup = records.filter((r) => r.group === group);
        const shown = inGroup.filter((r) => !r.card.classList.contains("is-hidden")).length;
        group.classList.toggle("is-hidden", terms.length > 0 && shown === 0);
        const countEl = group.querySelector(".people-group-head span");
        if (countEl) countEl.textContent = terms.length ? String(shown) : countEl.getAttribute("data-total") || String(inGroup.length);
      });

      if (empty) empty.classList.toggle("is-hidden", visible > 0 || !terms.length);

      form.querySelectorAll("[data-people-clear]").forEach((btn) => {
        btn.hidden = !query;
      });

      setCount(visible, query);
      if (query) track("people_search", { query: query, results: visible });
    };

    const reset = () => {
      input.value = "";
      apply();
      input.focus();
    };

    let debounce = null;
    input.addEventListener("input", () => {
      window.clearTimeout(debounce);
      debounce = window.setTimeout(apply, 120);
    });
    input.addEventListener("search", apply);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && input.value) {
        e.preventDefault();
        reset();
      }
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      window.clearTimeout(debounce);
      apply();
    });

    document.querySelectorAll("[data-people-clear]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        reset();
      });
    });

    setCount(total, "");
  })();

  /* ============================================================
     COOKIE CONSENT  (brief §11)
     ============================================================ */
  (function cookieConsent() {
    const banner = document.getElementById("cookieBanner");
    if (!banner) return;
    const KEY = "scp_cookie_consent";
    let saved = null;
    try {
      saved = window.localStorage.getItem(KEY);
    } catch (err) {
      saved = null;
    }
    if (!saved) {
      window.setTimeout(() => banner.classList.add("is-shown"), 900);
    }
    banner.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-cookie]");
      if (!btn) return;
      const choice = btn.getAttribute("data-cookie");
      try {
        window.localStorage.setItem(KEY, choice);
      } catch (err) {
        /* storage unavailable — the banner simply reappears next visit */
      }
      banner.classList.remove("is-shown");
      track("cookie_consent", { consent: choice });
    });
  })();

  /* ---------- Language switch (French site not yet published) ---------- */
  document.querySelectorAll("[data-lang]").forEach((a) => {
    a.addEventListener("click", (e) => {
      if (a.getAttribute("data-lang") === "fr") {
        e.preventDefault();
        track("language_switch", { language: "fr" });
        window.alert("The French site is not published yet. Wire this link to /fr/ once the translations are live.");
      }
    });
  });

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* ============================================================
     ENQUIRY FORM  (contact.html)
     Validates, then posts to FormSubmit's AJAX endpoint so the
     visitor stays on the page. Without JS the form still submits
     natively to the same endpoint.
     ============================================================ */
  (function enquiryForm() {
    const form = document.querySelector("[data-enquiry-form]");
    if (!form) return;

    const status = form.querySelector("[data-form-status]");
    const submit = form.querySelector('button[type="submit"]');
    const AJAX = form.getAttribute("action").replace(
      "https://formsubmit.co/",
      "https://formsubmit.co/ajax/"
    );

    const setStatus = (msg, kind) => {
      if (!status) return;
      status.textContent = msg;
      status.classList.remove("is-error", "is-ok");
      if (kind) status.classList.add(kind);
      status.classList.toggle("is-shown", Boolean(msg));
    };

    const clearError = (el) => {
      el.classList.remove("is-invalid");
      el.removeAttribute("aria-invalid");
      const next = el.parentNode.querySelector(".field-error");
      if (next) next.remove();
    };

    const setError = (el, msg) => {
      el.classList.add("is-invalid");
      el.setAttribute("aria-invalid", "true");
      if (!el.parentNode.querySelector(".field-error")) {
        const p = document.createElement("p");
        p.className = "field-error";
        p.textContent = msg;
        el.parentNode.appendChild(p);
      }
    };

    const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const PHONE = /^[+()\-\s0-9]{7,}$/;

    const validate = () => {
      const checks = [
        ["name", "Please tell us your full name."],
        ["phone", "Please give a phone number we can reach you on."],
        ["email", "Please give an email address."],
        ["enquiry", "Please tell us briefly what your enquiry is about."],
      ];
      let firstBad = null;
      checks.forEach(([field, msg]) => {
        const el = form.elements[field];
        if (!el) return;
        clearError(el);
        const v = (el.value || "").trim();
        let bad = !v ? msg : "";
        if (!bad && field === "email" && !EMAIL.test(v)) bad = "That email address does not look right.";
        if (!bad && field === "phone" && !PHONE.test(v)) bad = "That phone number does not look right.";
        if (bad) {
          setError(el, bad);
          if (!firstBad) firstBad = el;
        }
      });
      return firstBad;
    };

    form.addEventListener("input", (e) => {
      if (e.target && e.target.classList.contains("is-invalid")) clearError(e.target);
    });

    form.addEventListener("submit", (e) => {
      const firstBad = validate();
      if (firstBad) {
        e.preventDefault();
        setStatus("Please check the highlighted fields and try again.", "is-error");
        firstBad.focus();
        return;
      }
      if (!window.fetch) return; /* let the native POST happen */

      e.preventDefault();
      const data = new FormData(form);
      if (submit) {
        submit.setAttribute("disabled", "disabled");
        submit.dataset.label = submit.textContent;
        submit.textContent = "Sending…";
      }
      setStatus("Sending your enquiry…", null);

      fetch(AJAX, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then((r) => r.json().catch(() => ({})).then((j) => ({ ok: r.ok, body: j })))
        .then((res) => {
          const success = res.ok && String(res.body.success) !== "false";
          if (!success) throw new Error(res.body.message || "Submission failed");
          form.reset();
          setStatus(
            "Thank you — your enquiry has been sent. You will receive an acknowledgement by email, and a substantive reply from a lawyer within 24 hours.",
            "is-ok"
          );
          track("enquiry_form_submit", { ok: true });
        })
        .catch(() => {
          setStatus(
            "We could not send that just now. Please try again, email scprecords@scp-law.com directly, or message us on WhatsApp.",
            "is-error"
          );
          track("enquiry_form_submit", { ok: false });
        })
        .then(() => {
          if (submit) {
            submit.removeAttribute("disabled");
            submit.textContent = submit.dataset.label || "Send enquiry";
          }
        });
    });
  })();

  /* ============================================================
     FLOATING WHATSAPP — lift clear of the cookie banner
     ============================================================ */
  (function whatsappFloat() {
    const wa = document.querySelector("[data-wa-float]");
    const banner = document.getElementById("cookieBanner");
    if (!wa || !banner) return;
    const sync = () => wa.classList.toggle("has-cookie", banner.classList.contains("is-shown"));
    sync();
    if (window.MutationObserver) {
      new MutationObserver(sync).observe(banner, { attributes: true, attributeFilter: ["class"] });
    }
  })();

})();
