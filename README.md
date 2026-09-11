# PDRN Orb Serum — Shopify theme

A single-product Online Store 2.0 theme. Liquid, JSON templates, vanilla JS, no
frameworks and no build step. The home page *is* the product page: every
section reads its price and variants from one product you pick in Theme
settings.

- **52 files, `shopify theme check` clean** (0 errors; 2 warnings, both from the
  Google Fonts `<link>` — see [Known warnings](#known-warnings)).
- Mobile-first, lazy-loaded imagery, `prefers-reduced-motion` respected.
- Cart is a slide-out drawer using `/cart/add.js` and the Section Rendering API.

---

## Run it locally

You need the [Shopify CLI](https://shopify.dev/docs/api/shopify-cli) and a
development store.

```bash
npm install -g @shopify/cli@latest   # if you don't have it
shopify theme dev --store your-store.myshopify.com
```

That serves the theme at `http://127.0.0.1:9292` with hot reload. The first run
opens a browser to log in.

Check it before you push — **both** of these:

```bash
shopify theme check
python3 scripts/validate-theme.py
```

`shopify theme check` does not enforce everything Shopify enforces at runtime, so
a theme can pass it and then fail to render. `scripts/validate-theme.py` covers
that gap: range step/bounds/unit limits on schema defaults *and* on every value
stored in templates and section groups, strict duplicate-key JSON parsing,
setting id charsets, default-vs-type agreement, select defaults present in their
options, declared block types, `order`/`block_order` integrity, `settings_data`
keys existing in `settings_schema`, and `render`/`section` targets resolving.

It exits non-zero on failure, so it drops straight into CI or a pre-push hook.
This is not hypothetical — a range value of `34` against `step: 5` passed theme
check and made every page render the 404 template. See
[`DECISIONS.md`](DECISIONS.md) for that one.

## Upload it

```bash
# Push as a new unpublished theme, then preview it from admin
shopify theme push --unpublished --theme "PDRN Orb Serum"

# Or push to a theme you have already created
shopify theme push --theme <theme-id>
```

You can also zip the repository (excluding `.git`, `node_modules` and
`sample-content`) and upload it under **Online Store → Themes → Add theme →
Upload zip**.

---

## Fill these settings first

The theme renders without any of this, but the page is not sellable until the
first two are done. Everything is under **Online Store → Customize**.

### 1. The product (required)

**Theme settings → Product → Featured product.**

Every section — hero, sticky bar, bundle selector, cart upsell — falls back to
this product. Pick it once and the whole page wires itself up.

Your product needs **three variants**, in this order:

| Position | Variant title | Price | Compare at |
| -------- | ------------- | ----- | ---------- |
| 1        | 1 bottle      | $39   | —          |
| 2        | 2 bottles     | $69   | $78        |
| 3        | 3 bottles     | $99   | $117       |

The compare-at prices are what produce the struck-through "was" price. The
per-bottle figure (`$34.50/bottle`) is calculated by the theme from the
**Bottles in this option** setting on each bundle card, so it stays correct if
you change prices.

If your variants are in a different order, open the **Bundle selector** section
and either fix **Variant position** on each card, or paste the numeric
**Variant ID** from the product's admin URL.

### 2. Brand

**Theme settings → Brand.** Set the brand name (used as the wordmark when no
logo is uploaded), upload a logo and a favicon, and write the logo alt text.

### 3. Free shipping threshold

**Theme settings → Product → Free shipping threshold.** A plain number, no
decimals, in your store currency. It drives the cart drawer progress bar and
anywhere you type `[threshold]` in the guarantee strip (that section is not on
the page by default — see [Sections built but not on the page](#sections-built-but-not-on-the-page)).

### 4. Header links

**Header section.** The defaults are `Shop → /#bundle` and `FAQ → /#faq`, which
scroll down the home page. If you would rather point at real pages, either
change those two links or set a Shopify navigation menu, which replaces both.

### 5. Subscribe and save

The toggle in the bundle selector appears **only** if the product has a
subscription selling plan attached, via a subscriptions app. With no plan, the
toggle hides itself and nothing breaks. Set the 15% discount on the selling
plan in the app, not in the theme — the theme reads whatever price the plan
returns.

### 6. Review counts

The star rating and review count ship **empty**, and the star row stays hidden
until you fill the count in — an empty five-star row reads as zero reviews.
They are plain text settings in three places: the hero, the product hero and the
reviews section. The manual review blocks are placeholders too — replace them
before you put that section back on the page.

---

## Upload the hero video

Shopify does not let a theme setting accept an arbitrary file upload, so there
are two routes. Use whichever suits you; the theme prefers WebM, then MP4, then
the Shopify-hosted video.

### Route A — Shopify-hosted (simplest)

1. **Content → Files → Upload files**, add your `.mp4`.
2. Customize → **Hero video** section → **Video** → pick it.

Shopify transcodes and serves it from its CDN.

### Route B — your own MP4 + WebM (smallest files)

1. **Content → Files → Upload files**, add both `hero.webm` and `hero.mp4`.
2. Click each file and copy its URL.
3. Customize → **Hero video** → paste them into **WebM URL** and **MP4 URL**.

Either way, **always set a poster image**. It is what shows before the video
loads, what visitors with reduced motion see instead of the video, and what
appears if the video fails. Give it alt text.

Video guidance: 6–12 seconds, silent, seamless loop, 1920×1080 or 1080×1350,
under about 3 MB. The theme sets `preload="none"` and only starts playback when
the hero scrolls into view, so a large file costs you on engagement rather than
on first load — but keep it small anyway.

**Reduced motion:** autoplay is applied by JavaScript, never by an `autoplay`
attribute. If the visitor's OS asks for reduced motion the video stays paused
and the poster image stays visible, and it reacts live if they change that
setting.

---

## What is where

```
assets/
  theme.css          Design system: tokens, layout, buttons, type
  theme.js           Cart API, drawer, forms, bundle selector, carousels, video
config/
  settings_schema.json   Brand, colours, typography, product, cart, social
  settings_data.json     The shipped defaults
layout/
  theme.liquid       Document shell, font loading, section groups
  password.liquid
locales/
  en.default.json    Storefront strings (cart, a11y labels, pagination)
sections/            One file per section, each with a {% schema %}
snippets/
  css-variables      Theme settings -> CSS custom properties
  icon               Inline SVG set
  product-price      Compare-at and per-bottle maths
  video              Responsive video with poster + reduced-motion fallback
  star-rating, product-card, pagination, reviews-app-slot
templates/
  index.json         Home page (the whole funnel)
  product.json       Product page
  page.json          FAQ and policy pages
  ...                cart, search, collection, blog, 404, password, gift card
sample-content/      Default copy as plain text, for editing outside the Customizer
```

### What is on the page

One product does not need a browse-then-buy funnel, so the offer sits directly
under the hero.

| | Home | Product |
| --- | --- | --- |
| 1 | Hero video | Product hero (gallery) |
| 2 | Bundle selector — the offer, `#bundle` | Bundle selector |
| 3 | How it works, `#how` | How it works |
| 4 | FAQ, `#faq` | Product details |
| 5 | — | FAQ |

Plus **Sticky add to cart**, which is fixed to the viewport — its position in
the list does not matter.

### Sections built but not on the page

These ship with the theme and are not in either template. Each has a preset, so
adding one back is **Customize → Add section**, no code:

- **Ingredient cards** — the three actives as editorial hairline rows
- **Why encapsulated** — the dark plum section with the pull quote
- **Results gallery** — tilted pearl frames, horizontal scroll
- **Reviews** — staggered pearl cards, plus the reviews-app slot
- **Guarantee strip** — the three trust items

If you add just one back, make it Reviews, directly under the bundle. It is the
page's only social proof, and on a $39 serum that is usually the most expensive
thing to leave out. The guarantee line still appears in the bundle footnote
under the add-to-cart button.

### Adding a reviews app later

`snippets/reviews-app-slot.liquid` renders an empty div carrying the product id
and handle. Paste your app's embed code inside it, or add the app's block to
the Reviews section. The manual review blocks can stay or go.

---

## Design system

Set in **Theme settings → Colors / Typography**; nothing is hard-coded.

| Token | Default | Used for |
| ----- | ------- | -------- |
| Page | `#F1ECF7` | Lilac-pearl ground. Deliberately not white |
| Card | `#FAF8FD` | Pearl surfaces, drawer, inputs |
| Media | `#E7DFF2` | Behind images and placeholder blocks |
| Plum | `#2A2340` | The dark clinic section, footer, announcement bar |
| Text on plum | `#EFE9F7` | 12.51:1 |
| Accent on plum | `#BCA9EC` | Links inside dark sections — 7.10:1 |
| Text | `#2A2340` | 12.80:1 on the page |
| Text secondary | `#5C5470` | 6.11:1 |
| Accent | `#6E5AAB` | Buttons, rings, fills — 5.66:1 with white |
| Accent — text | `#635099` | Eyebrows, figures, unit prices — 4.94:1 worst case |
| Accent — soft | `#E3D9F5` | Selected cards, tints |
| Hairline | `#D6CEE4` | Borders |
| Silver | `#C6C0D2` | Brushed-silver rules, rings, tags. Decorative only |
| Silver — highlight | `#EDEBF2` | The bright point along a silver line or ring |

Two families, both from Google Fonts and both theme settings: **Fraunces** 400
for display, numerals and prices (optical sizing on, SOFT axis at 30), and
**Manrope** 400/500 for body and UI. Eyebrows are Manrope small caps at 0.14em
tracking in accent ink.

Materials rather than flat fills: a 3% generated grain over the whole page, a
pearl-to-lilac radial wash behind the hero and the offer, a large blurred violet
orb that drifts on a 60-second loop, and pearl surfaces carrying a sheen
gradient, an inner top highlight and a soft violet halo.

**Silver is drawn as metal, not as grey.** Rules are gradients that fade at both
ends and catch the light in the middle; rings, tags and frame edges are gradient
borders that follow the curve.

**Depth is a violet halo, never a grey drop shadow** — the accent colour, wide
blur, low opacity, the way beauty packaging photographs. Section padding 112px
desktop / 64px mobile, content column 1180px.

Glow, surface sheen, the orb and the grain are all settings (**Theme settings →
Motion & softness**), so the page can be taken completely flat.

Motion: hero copy rises in on load, sections reveal on scroll with siblings
staggered, the hero media parallaxes gently, and every card, button and ring
lifts on hover with its halo widening. All of it is disabled under
`prefers-reduced-motion` — every lift is a token so reduced motion zeroes them
from one place.

Before and after renders, with a per-section rationale, are in
[`design/COMPARE.md`](design/COMPARE.md).

## Known warnings

`shopify theme check` reports two `RemoteAsset` warnings, both pointing at the
Google Fonts `<link>` tags in `layout/theme.liquid`. That is theme check
telling you a non-Shopify CDN is slower than Shopify's own. It is expected:
neither Fraunces nor Manrope is in Shopify's font library. One request carries
both families, loaded non-render-blocking with a `<noscript>` fallback.

To silence them, turn off **Theme settings → Typography → Load fonts from Google
Fonts**. The theme falls back to the Georgia and system-sans stacks and the
warnings go away — though the serif/sans contrast is most of the art direction,
so expect it to look markedly plainer.

## Accessibility notes

- Every image setting has a matching alt text setting.
- The cart drawer is a labelled `role="dialog"` with focus trapping and Escape
  to close.
- The FAQ and product details use native `<details>`/`<summary>`.
- Add-to-cart forms are real `<form>` elements posting to `/cart/add`; the
  JavaScript intercepts them, so they still work without it.
- Focus styles are visible everywhere and never removed.
- All motion — reveals, smooth scrolling, video autoplay — is disabled under
  `prefers-reduced-motion: reduce`.
