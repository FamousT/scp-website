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

  /* ---------- Mobile menu ---------- */
  const closeMenu = () => {
    if (!nav || !toggle) return;
    nav.classList.remove("open");
    toggle.classList.remove("open");
    document.body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
  };
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.classList.toggle("open", open);
      document.body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach((l) => l.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
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
})();
