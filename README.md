# PDRN Orb Serum — Shopify theme

A single-product Online Store 2.0 theme. Liquid, JSON templates, vanilla JS, no
frameworks and no build step. The home page *is* the product page: every
section reads its price and variants from one product you pick in Theme
settings.

- **52 files, `shopify theme check` clean** (0 errors; 4 warnings, all from the
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

Check it before you push:

```bash
shopify theme check
```

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
anywhere you type `[threshold]` in the guarantee strip.

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

`4.8` and `2,431 reviews` are placeholders in three places: the hero, the
product hero and the reviews section. They are plain text settings, so update
them to whatever is true. The manual review blocks are placeholders too.

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

### Home page section order

1. Hero video
2. Ingredient cards
3. How it works
4. Why encapsulated
5. Results gallery
6. Bundle selector *(the offer — `#bundle`)*
7. Reviews
8. FAQ *(`#faq`)*
9. Guarantee strip
10. Sticky add to cart *(fixed to the viewport; its position in the list does not matter)*

Reorder or remove any of them in the Customizer. Every section has a preset, so
you can also add them to other templates.

### Adding a reviews app later

`snippets/reviews-app-slot.liquid` renders an empty div carrying the product id
and handle. Paste your app's embed code inside it, or add the app's block to
the Reviews section. The manual review blocks can stay or go.

---

## Design system

Set in **Theme settings → Colors / Typography**; nothing is hard-coded.

| Token | Default | Used for |
| ----- | ------- | -------- |
| Background | `#FAF8F6` | Page ground |
| Surface | `#FFFFFF` | Cards, inputs |
| Pearl | `#F4F1F7` | Media backgrounds, quiet panels |
| Text | `#2E2640` | Primary — a plum ink, warmer than black |
| Text secondary | `#6E6680` | Supporting copy |
| Accent | `#7561B0` | Buttons, active states — 5.13:1 with white |
| Accent soft | `#E8E1F5` | Selected cards, badges |
| Hairline | `#E4E0EA` | Dividers and borders |
| Silver | `#C8C3D7` | Rules, icon rings, small detail |

Type is Manrope from Google Fonts, headings at 500 with −0.024em tracking, body
at 400 / 1.7. Radius 12px on cards, pill buttons. No drop shadows. The only
soft-edged element is an optional radial glow behind the hero and offer, which
you can switch off in **Theme settings → Motion**.

## Known warnings

`shopify theme check` reports four `RemoteAsset` warnings, all pointing at the
Google Fonts `<link>` tags in `layout/theme.liquid`. That is theme check
telling you a non-Shopify CDN is slower than Shopify's own. It is expected:
Manrope is not in Shopify's font library. The links are loaded
non-render-blocking with a `<noscript>` fallback.

To silence them, turn off **Theme settings → Typography → Load font from Google
Fonts**. The theme falls back to the system sans stack and the warnings go away.

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
