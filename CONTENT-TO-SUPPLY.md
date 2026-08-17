# Content to supply — SimmonsCooper Partners website

Built to *Website Rebuild — Brief for the Developer*. Every page listed in the brief
exists and is wired up. This file records **what is real structure** and **what is
placeholder copy that must be replaced before launch.**

---

## 1. What was built

**28 pages.**

| Area | Files |
|---|---|
| Eight menu pages | `index.html`, `practice-areas.html`, `our-work.html`, `insights.html`, `abuja.html`, `our-people.html`, `careers.html`, `contact.html` |
| Ten practice areas | `practice/*.html` — one reusable layout, ten instances |
| Paid services | `services.html` (filterable catalogue) + `services/*.html` (six detail pages) |
| Lawyer profiles | `people/senior-partner-1.html`, `people/senior-partner-2.html`, `people/profile-template.html` |
| Shared | `css/styles.css`, `js/script.js` |

Navigation: Practice Areas (with a dropdown listing all ten areas plus the service
catalogue), Our Work, Insights, Abuja, Our People, Careers, Contact. Home is the
logo. Every page is reachable in one or two clicks and carries a get-in-touch route.

---

## 2. Replace before launch

### Names and photographs — **all placeholders**
Individual lawyers' names, portraits and biographies are personal to them, so
nothing was invented. Every person renders as `[Partner name]`, `[Associate name]`
etc. with a monogram tile marked *Photo to be supplied*.

- `our-people.html` — 16 people across Partners / Counsel / Senior Associates /
  Associates, plus a six-entry alumni list. Confirm the seniority groups you want.
- `people/profile-template.html` — duplicate this per lawyer.
- Practice pages pull their team from `content.py`'s `PEOPLE` list.

### Drafted copy — plausible, but not yours
Each affected page carries a visible **Draft content** banner. Remove the banner
markup (`<div class="notice">…`) once real copy lands.

| Page | What is drafted |
|---|---|
| `practice/*.html` | Overview paragraphs, "what we do" bullets, taglines for all ten areas |
| `services/*.html` | Scope, service level, price and process for six services |
| `services.html` | The six services shown; the brief says you will supply the full list |
| `our-work.html` | Six case studies — narratives and figures are illustrative |
| `insights.html` | Nine articles and two textbook entries |
| `abuja.html` | Regulatory track record, event calendar, subscription pricing |
| `careers.html` | Training-programme description and six vacancies |
| `index.html` | Hero headline and standfirst |

### Contact details — **check these**
Telephone numbers in `contact.html` and the footer are dummies
(`+234 (0) 1 000 0000`). Office addresses match your existing site. Maps are
OpenStreetMap embeds — swap for Google Maps if you prefer.

---

## 3. Wiring left for the back end

These are built to the point a static site can reach; each needs a server.

1. **Enquiry forms → CRM (brief §12).** Every form posts nothing today; it shows a
   confirmation and pushes an analytics event. Each carries three populated hidden
   fields ready to pass through to HubSpot:
   - `routing_team` — set from the topic dropdown, so Competition enquiries carry
     the competition team, Careers carries HR, Press carries Marketing
   - `source_page` and `source_url` — which page and which URL the enquiry came from
   The handoff point is marked `TODO (back end)` in `js/script.js`.
   Confirm the exact routing table and the 24-hour acknowledgement copy.

2. **Online payment (brief §4).** Paystack and Stripe are described on the site but
   not integrated. Three products need checkout: the Abuja newsletter subscription,
   the regulatory-intelligence subscription, and the two textbook pre-orders.

3. **Analytics (brief §13).** All CTA clicks, form submissions, filter use, cookie
   choices and language switches push to `window.dataLayer`. Add the GA4 or GTM
   snippet and the events flow straight through — no further tagging needed.

4. **Insights migration (brief §6).** The filters (topic / author / type) work on
   the markup already present. Migrating `resource.scp-law.com` content into this
   section, plus the redirect map, still needs doing.

5. **French site.** The footer has an EN / FR switch. FR currently warns that the
   translation is not published — point it at `/fr/` when it is.

6. **Newsletter.** Subscribe forms are structured for Mailchimp or HubSpot; connect
   the list and the double opt-in.

---

## 4. Decisions worth confirming

- **Nav shape.** Paid Services sits under Practice Areas (per §1 of the brief) rather
  than as its own top-level item. Say the word if you'd rather it were top-level.
- **Practice-area names.** Taken verbatim from §3. Two are long — *Consumer Credit and
  Digital Money Lending* and *Energy — Hydrocarbon and Renewable* — and shorten to
  "Consumer Credit" and "Energy" in the navigation and card labels.
- **Service count.** Six built, from the examples in §4. Send the full catalogue and
  each additional service is one entry in `content.py`.
- **Case-study confidentiality.** The drafted studies name no clients and give no
  identifying detail. Apply your own clearance before publishing real ones.

---

## 5. Not in scope of this build

From §11 and §14, still outstanding and mostly infrastructure:

- Switching off `resource.scp-law.com` and the full redirect map
- Hosting, HTTPS, CDN and the sub-3-second performance target under load
- CMS choice and content modelling (the brief suggests Sanity)
- Accessibility audit against WCAG — the markup uses landmarks, skip links, labelled
  form fields and visible focus, but has not been tested with a screen reader
- Cookie-consent *enforcement* — the banner records the choice in `localStorage`;
  suppressing analytics on decline is a one-line change once GA4 is added
