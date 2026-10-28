/* ============================================================
   COOKIE CONSENT  (Nigeria Data Protection Act 2023)
   Nothing non-essential runs until the visitor chooses.
   - Analytics (Google Analytics 4) loads only after "Accept".
   - Google Maps embeds load only after consent to third-party
     content (or when the visitor clicks "Show map").
   The choice is remembered across every page (see read/persist
   below) and can be changed at any time from "Cookie settings" in
   the footer.
   ============================================================ */
(function () {
  "use strict";
  var KEY = "scp-consent";
  var VERSION = 1;
  var me = document.currentScript;
  var GA_ID = (me && me.getAttribute("data-ga-id")) || "";

  /* The choice is kept in three places so it carries to every page:
     - localStorage: the normal home on the live site;
     - a first-party cookie: a second copy for the live site;
     - window.name: carries the choice from page to page in the same
       tab even when the pages are opened straight from a folder,
       where some browsers give every file its own storage. */
  var NAME_PREFIX = "scp-consent:";
  function parse(raw) {
    try {
      var v = JSON.parse(raw || "null");
      return v && v.v === VERSION ? v : null;
    } catch (e) { return null; }
  }
  function fromCookie() {
    var m = document.cookie.match(/(?:^|;\s*)scp_consent=([^;]*)/);
    return m ? parse(decodeURIComponent(m[1])) : null;
  }
  function fromWindowName() {
    var n = window.name || "";
    var i = n.indexOf(NAME_PREFIX);
    return i === 0 ? parse(n.slice(NAME_PREFIX.length)) : null;
  }
  function read() {
    var v = null;
    try { v = parse(window.localStorage.getItem(KEY)); } catch (e) {}
    v = v || fromCookie() || fromWindowName();
    if (v) persist(v); // copy into any store that was missing it
    return v;
  }
  function persist(c) {
    var raw = JSON.stringify(c);
    try { window.localStorage.setItem(KEY, raw); } catch (e) {}
    try {
      var secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = "scp_consent=" + encodeURIComponent(raw) + "; path=/; max-age=31536000; SameSite=Lax" + secure;
    } catch (e) {}
    try {
      var n = window.name || "";
      if (!n || n.indexOf(NAME_PREFIX) === 0) window.name = NAME_PREFIX + raw;
    } catch (e) {}
  }
  function write(c) {
    c.v = VERSION; c.ts = new Date().toISOString();
    persist(c);
    state = c;
  }
  var state = read();

  window.SCPConsent = {
    analytics: function () { return !!(state && state.analytics); },
    embeds: function () { return !!(state && state.embeds); },
    open: function () { showBanner(true); }
  };

  /* ---- Analytics: load GA4 only with consent ---- */
  var gaLoaded = false;
  function loadAnalytics() {
    if (gaLoaded || !GA_ID || !window.SCPConsent.analytics()) return;
    gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { anonymize_ip: true });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
  }
  function removeAnalyticsCookies() {
    document.cookie.split(";").forEach(function (c) {
      var name = c.split("=")[0].trim();
      if (/^_ga/.test(name) || name === "_gid") {
        var host = window.location.hostname;
        ["", host, "." + host.replace(/^www\./, "")].forEach(function (d) {
          document.cookie = name + "=; Max-Age=0; path=/" + (d ? "; domain=" + d : "");
        });
      }
    });
  }

  /* ---- Third-party embeds (Google Maps) ---- */
  function loadEmbeds() {
    document.querySelectorAll("iframe[data-consent-src]").forEach(function (f) {
      if (!f.getAttribute("src")) f.setAttribute("src", f.getAttribute("data-consent-src"));
      var ph = f.parentNode.querySelector(".embed-placeholder");
      if (ph) ph.hidden = true;
      f.hidden = false;
    });
  }

  /* ---- Banner ---- */
  var banner, prefs;
  function apply(c) {
    var had = window.SCPConsent.analytics();
    write(c);
    hideBanner();
    if (c.analytics) loadAnalytics();
    else if (had) { removeAnalyticsCookies(); }
    if (c.embeds) loadEmbeds();
  }
  function showBanner(withPrefs) {
    if (!banner) return;
    banner.hidden = false;
    if (prefs) {
      setPrefs(withPrefs);
      var a = banner.querySelector("[name=consent-analytics]");
      var e = banner.querySelector("[name=consent-embeds]");
      if (a) a.checked = window.SCPConsent.analytics();
      if (e) e.checked = window.SCPConsent.embeds();
    }
    var first = banner.querySelector("button");
    if (first && withPrefs) first.focus();
  }
  function setPrefs(open) {
    prefs.hidden = !open;
    banner.classList.toggle("is-managing", open);
    var t = banner.querySelector("[data-consent=prefs]");
    if (t) {
      t.setAttribute("aria-expanded", open ? "true" : "false");
      var l = t.querySelector(".cookie-manage-label");
      if (l) l.textContent = open ? "Hide preferences" : "Manage preferences";
    }
  }
  function hideBanner() { if (banner) banner.hidden = true; }

  function init() {
    banner = document.getElementById("cookieBanner");
    prefs = banner && banner.querySelector(".cookie-prefs");
    if (banner) {
      banner.addEventListener("click", function (ev) {
        var b = ev.target.closest("[data-consent]");
        if (!b) return;
        var act = b.getAttribute("data-consent");
        if (act === "accept") apply({ analytics: true, embeds: true });
        else if (act === "reject") apply({ analytics: false, embeds: false });
        else if (act === "prefs") { if (prefs) setPrefs(prefs.hidden); }
        else if (act === "save") apply({
          analytics: !!banner.querySelector("[name=consent-analytics]:checked"),
          embeds: !!banner.querySelector("[name=consent-embeds]:checked")
        });
      });
    }
    document.addEventListener("click", function (ev) {
      var o = ev.target.closest("[data-cookie-settings]");
      if (o) { ev.preventDefault(); showBanner(true); }
      var m = ev.target.closest("[data-load-embed]");
      if (m) {
        write({ analytics: window.SCPConsent.analytics(), embeds: true });
        loadEmbeds();
      }
    });
    if (!state) showBanner(false);
    else {
      loadAnalytics();
      if (state.embeds) loadEmbeds();
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
