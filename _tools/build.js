/* ============================================================
   SimmonsCooper Partners: shared header, footer and <head>
   ------------------------------------------------------------
   The header, footer and <head> are written ONCE, in:
       _includes/head.html     (meta tags, fonts, stylesheets)
       _includes/header.html   (logo and navigation)
       _includes/footer.html   (footer, cookie banner, scripts)

   Every page carries a copy between marker comments, so each page
   opens correctly on its own: double-clicked from the folder, in an
   editor preview, or on GitHub Pages.

   After editing anything in _includes/ (or _config.yml), run this
   from the site folder to update all pages at once:

       node _tools/build.js

   Page-specific settings (title, description, which nav item is
   highlighted, folder depth) sit in the comment at the top of each
   page:  <!-- page-settings: {...} -->
   The script also regenerates sitemap.xml and robots.txt.
   ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");
const { Liquid } = require("./liquid.node.js");

const SRC = path.resolve(__dirname, "..");
const INC = path.join(SRC, "_includes");

function parseScalar(v) {
  v = v.trim();
  if (v.startsWith('"')) { try { return JSON.parse(v); } catch (e) { return v.slice(1, -1); } }
  if (v.startsWith("'")) return v.slice(1, -1).replace(/''/g, "'");
  if (v === "true") return true;
  if (v === "false") return false;
  return v;
}
function parseYaml(text) {
  const o = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (m && m[2] !== "") o[m[1]] = parseScalar(m[2].replace(/\s+#.*$/, ""));
  }
  return o;
}
function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    if (e.name.startsWith("_") || e.name.startsWith(".")) return [];
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const site = parseYaml(fs.readFileSync(path.join(SRC, "_config.yml"), "utf8"));
site.baseurl = site.baseurl || "";
const engine = new Liquid({ root: INC, dynamicPartials: false, jekyllInclude: true });
const SETTINGS_RE = /<!-- page-settings: (\{.*?\}) -->/;
const BLOCKS = ["head", "header", "footer"];

function urlFor(rel, data) {
  if (data.permalink) return data.permalink;
  const u = "/" + rel.split(path.sep).join("/");
  return u === "/index.html" ? "/" : u;
}

/* One-time conversion of a Jekyll page (front matter + {% include %}). */
function convertJekyll(text) {
  const end = text.indexOf("\n---", 3);
  const data = parseYaml(text.slice(3, end));
  let body = text.slice(text.indexOf("\n", end + 1) + 1);
  body = body.replace(/<!DOCTYPE html>\n?/i, "");
  for (const b of BLOCKS) {
    body = body.replace(`{% include ${b}.html %}`, `<!-- shared:${b} -->\n<!-- /shared:${b} -->`);
  }
  return `<!DOCTYPE html>\n<!-- page-settings: ${JSON.stringify(data)} -->\n` + body;
}

(async () => {
  const pages = [];
  for (const f of walk(SRC)) {
    if (!f.endsWith(".html")) continue;
    const rel = path.relative(SRC, f);
    let text = fs.readFileSync(f, "utf8");
    if (text.startsWith("---")) text = convertJekyll(text);
    const m = text.match(SETTINGS_RE);
    if (!m) continue; // not a site page
    const data = JSON.parse(m[1]);
    pages.push({ f, rel, text, data, url: urlFor(rel, data) });
  }
  site.html_pages = pages.map((p) => Object.assign({ url: p.url }, p.data));

  for (const p of pages) {
    const root = p.data.permalink === "/404.html" ? site.baseurl + "/" : (p.data.root || "");
    const ctx = { site, root, page: Object.assign({ url: p.url }, p.data) };
    let out = p.text;
    for (const b of BLOCKS) {
      const html = (await engine.renderFile(`${b}.html`, ctx)).trim();
      const re = new RegExp(`<!-- shared:${b} -->[\\s\\S]*?<!-- /shared:${b} -->`);
      if (!re.test(out)) throw new Error(`${p.rel}: missing <!-- shared:${b} --> markers`);
      out = out.replace(re, () => `<!-- shared:${b} -->\n${html}\n<!-- /shared:${b} -->`);
    }
    if (out !== fs.readFileSync(p.f, "utf8")) fs.writeFileSync(p.f, out);
  }

  // sitemap.xml and robots.txt
  const base = site.url + site.baseurl;
  const locs = pages
    .filter((p) => p.data.sitemap !== false)
    .map((p) => p.url)
    .sort()
    .map((u) => `  <url>\n    <loc>${base}${u}</loc>\n  </url>`);
  fs.writeFileSync(path.join(SRC, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locs.join("\n")}\n</urlset>\n`);
  fs.writeFileSync(path.join(SRC, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);

  console.log(`Updated ${pages.length} pages, sitemap.xml and robots.txt.`);
})().catch((e) => { console.error(e.message || e); process.exit(1); });
