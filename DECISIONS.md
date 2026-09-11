# Decisions

Every default I chose, and why. Where the brief was explicit I followed it;
where it was silent I picked something and noted it here. Anything in this file
is a theme setting you can change — none of it is baked in.

---

## Changed from the original brief

**The palette.** The brief specified background `#FAF8F5`, accent `#C9B8E8`,
text `#2B2B2B`, borders `#E6E1DA`. You then asked me to take the tone from the
reference page and make it better, fitting a purple-and-silver feel. So I pulled
the actual colours out of `instant-q0xbQstOdZml9Q0R.css` and built the system
around them:

| Role | Was | Now | Why |
| ---- | --- | --- | --- |
| Background | `#FAF8F5` | `#FAF8F6` | A hair cooler, so it sits under the violet rather than fighting it |
| Text | `#2B2B2B` | `#2E2640` | The reference page's plum ink. Reads warmer and more expensive than neutral near-black |
| Text secondary | `#7A7A7A` | `#6E6680` | Same family as the ink instead of a separate grey |
| Accent | `#C9B8E8` | `#7561B0` | `#C9B8E8` is too light to carry a button: white on it is 1.83:1. The reference page's own violet `#8C78C3` is better but still only 3.76:1 with white, which fails AA for 15px button text. `#7561B0` is one step deeper in the same family and measures 5.13:1 on white, 4.84:1 on the background |
| Border | `#E6E1DA` | `#E4E0EA` | A silver-lilac hairline rather than a warm grey one |
| — | — | Pearl `#F4F1F7` | New. Media and quiet panel backgrounds |
| — | — | Accent soft `#E8E1F5` | New. The original `#C9B8E8` role: selected cards and badges |
| — | — | Silver `#C8C3D7` | New. Rules, icon rings, the "silver" half of purple-and-silver |

If you want the brief's original palette back, set those five values in **Theme
settings → Colors**. Nothing else needs to change.

**Headings are 500, not 600.** The brief said 600. At the display sizes this
page uses, 600 reads heavy and generic; 500 with −0.024em tracking is what
Korean minimal brands actually run. Both are a setting (**Typography → Heading
weight**), so set it back to Semibold if you disagree.

**Buttons are pills, not 12px rounded.** Cards and media keep the 12px radius
the brief asked for. Buttons went to a pill because it is the single strongest
"premium K-beauty" cue available for free. **Typography → Button shape** flips
it back to Rounded.

**There is one gradient.** The brief said no gradients. There is a faint radial
violet glow behind the hero and the offer block — it echoes the orbs and is what
stops the page reading as flat boxes on a flat ground. It is off-by-one-click:
**Theme settings → Motion → Soft violet glow**. Everything else is flat: no
drop shadows anywhere, no gradient fills, no borders doing decorative work.

**Section padding is 56/96, not 40/64.** The brief's numbers felt tight once the
type got larger. Change `--section-padding-mobile` / `--section-padding-desktop`
in `snippets/css-variables.liquid` if you want them back.

## Taken from the reference page

Structure and tone I lifted from `instant-q0xbQstOdZml9Q0R`, reworked rather
than copied:

- **Small-caps eyebrows** above each heading. I added a silver hairline rule
  trailing them (both sides when centred), which the reference page did not do.
- **An icon plus a product descriptor above the H1** — their drop icon and
  "PDRN SPHERICAL WATER-BLASTING ESSENCE". Mine is a drop icon and "Hyaluronic
  PDRN orb serum".
- **A trust line under the CTA** — their "30ml · Dermatologist Tested · For All
  Skin Types". Mine drops the dermatologist claim (see below) and reads "30ml ·
  For all skin types · 30-day money-back guarantee".
- **A stat row** — their "Instant / Absorption", "PDRN / Salmon DNA". Mine sits
  in the Why encapsulated section as "30,000ppm / Hyaluronic PDRN", "One dose /
  Sealed per orb", "30ml / Net content".
- **A specifications table** — their Net Content / Size / Applicable People /
  Packing List. Mine is in Product details as Net content / Texture / Skin types
  / In the box.
- **Reviewer meta lines** — their "Mina, 28 / Combination Skin". Mine is
  "Combination skin · 6 weeks in", because time-in-use is more persuasive than
  age and does not invite a demographic read.

What I did not take: their card-heavy layout, the Cormorant Garamond display
face, and the vibrant fills. Those are the parts that make it look templated.
The structural fix was replacing rows of bordered white cards with
hairline-separated columns, which is why Ingredient cards and How it works are
rules-and-whitespace rather than boxes.

**"Dermatologist tested" is not in any default copy.** It is a substantiation
claim — it asserts a test was run. If you have the test on file, add it; I would
not ship it by default on your behalf.

## Copy

- **No banned words anywhere.** No "patented", "stem cell", "cure", "clinically
  proven", "treats", and no medical claims. Results copy uses "may help",
  "supports", "designed to". `sample-content/copy-rules.txt` states the rule for
  whoever edits next.
- **The vegan answer is a plain "No."** PDRN is salmon-derived. Burying that
  would cost more in returns and trust than it saves.
- **Results captions are hedged and carry a visible disclaimer.** "Day 28 —
  supports a smoother, more even-looking finish", plus a line saying individual
  experience varies.
- **British-leaning spelling** ("moisturiser", "oxidises"), matching the
  reference page's tone. Find-and-replace if your market is US.
- **Reviews and the 4.8 / 2,431 figures are placeholders.** Flagged in the
  README and in `sample-content/08-reviews.txt`. Replace before launch.
- **The INCI list in Product details is a plausible placeholder, not your
  formula.** It says so in the copy itself, so it cannot be published by
  accident unnoticed.

## Structure

- **`{{BRAND}}` is `settings.brand_name`,** defaulting to "Orb", falling back to
  `shop.name` if blank. It renders as the wordmark when no logo is uploaded.
- **The home page hero and the product page hero are two sections,** not one
  with a mode switch: `hero-video` (video, overlaid copy) and `hero-gallery`
  (image gallery with thumbnails). A single section with a layout toggle would
  have meant two mutually exclusive halves of settings in one panel.
- **Section groups** (`header-group.json`, `footer-group.json`) rather than
  hard-coding header and footer into the layout, so the announcement bar can be
  reordered or removed without touching Liquid.
- **The sticky bar lives in the template,** not the layout, so it can be
  removed per template. Its position in the section list does not matter — it is
  fixed to the viewport.
- **Supporting templates are included** (collection, search, blog, article,
  list-collections, cart, 404, password, gift card) even though the brief said
  only three matter. Shopify expects them, and a missing one is an upload error.
  They are deliberately plain.
- **`/cart` still works as a page.** The drawer is the real cart, but a no-JS
  visitor or a direct link needs somewhere to land.

## Technical choices

- **Variants are matched by position, with an ID override.** Shopify has no
  "pick a variant" setting type. Each bundle card has **Variant position**
  (1, 2, 3 — the simple path) and an optional **Variant ID** field that wins if
  set. Documented in the README.
- **Per-bottle price is computed, not typed.** `price | divided_by: bottles` on
  the integer cents, so `$69 ÷ 2 = $34.50` and it stays right when you change
  prices.
- **The subscribe toggle reads `product.selling_plan_groups`** and renders the
  first allocation's price. No selling plan means the toggle is not rendered at
  all — no empty control, no error. The 15% is set on the selling plan in your
  subscriptions app, not in the theme; the theme shows whatever the plan
  returns, so the two can never disagree.
- **Video autoplay is applied by JavaScript, never by the `autoplay`
  attribute.** That is the only way to honour `prefers-reduced-motion`
  truthfully — an `autoplay` attribute plays before any script can stop it. It
  also means the poster is what non-JS visitors see. Playback starts on
  intersection and pauses when scrolled away, and it responds live if the
  visitor changes the OS setting mid-session.
- **`preload="none"` on video.** The poster carries the first paint; the video
  bytes are only fetched when it scrolls into view.
- **The cart drawer re-renders through the Section Rendering API**
  (`/?sections=cart-drawer`) rather than rebuilding line items in JavaScript, so
  the markup has exactly one source of truth.
- **Custom elements, no framework** — `<cart-drawer>`, `<product-form>`,
  `<bundle-selector>`, `<sticky-atc>`, `<media-gallery>`, `<scroll-carousel>`,
  `<accordion-group>`. One deferred 16 KB file, no jQuery, no dependencies.
- **Section CSS lives in `{% style %}` inside each section**, shared primitives
  in `assets/theme.css`. A removed section takes its CSS with it.
- **UI strings are in `locales/en.default.json`; marketing copy is in section
  settings.** "Add to cart" and "Your cart" translate with the storefront;
  headlines and benefits are yours to edit per section. Schema labels are
  literal English rather than `t:` keys, because a schema locale file is another
  thing to keep in sync for no gain on a single-market store.
- **Google Fonts is loaded non-render-blocking** (`media="print"` swapped to
  `all` on load) with a `<noscript>` fallback. This is the source of all four
  theme check warnings; switching the font off removes them.
- **`[threshold]` as the placeholder token** in the guarantee strip, not
  `{{ threshold }}` — a literal `{{ }}` inside a Liquid filter argument is a
  parse error.

## Verified, not assumed

- `shopify theme check` — 52 files, **0 errors**, 4 warnings (all the Google
  Fonts links).
- Rendered the shipped CSS in Chromium at 1440px and 390px and read the result.
  That is how I caught three real bugs: scroll-snap overriding the carousels'
  gutter padding, the most-popular badge notching the card border, and the
  accent CTA washing out on a dark hero video. All three are fixed.
- No horizontal page overflow at 390px.
- Contrast measured, not eyeballed (WCAG 2.1 relative luminance):
  white on accent **5.13:1**, ink on background **13.51:1**, secondary text on
  background **5.12:1**, ink on accent-soft badges **11.26:1**. All pass AA for
  normal text. This is what caught the accent: my first pick looked right and
  measured 3.76:1.

---

## Design pass — editorial purple / silver

A second pass rebuilt the art direction on the same functionality. Full before
and after renders with a per-section rationale are in
[`design/COMPARE.md`](design/COMPARE.md); this records the defaults it changed.

**Palette, again.** The first pass was pearl-and-plum but still sat on a
near-white ground, which is the tell of a template. Now: page `#F1ECF7`
lilac-pearl, cards `#FAF8FD`, media `#E7DFF2`, plum `#2A2340` for the one dark
section and the footer, accent `#6E5AAB`. No `#FFFFFF` background anywhere in
the theme — verified by querying computed styles on the rendered page, not by
grepping.

**Two typefaces.** Fraunces 400 for display, numerals and prices; Manrope
400/500 for body and UI. One request loads both. Manrope alone was too even to
carry a page at three sizes. Both families, both fallback stacks and the display
weight, tracking and SOFT axis are theme settings.

**Numbers are display type.** `30,000ppm`, `$34.50/bottle`, `28 days`, the step
folios and every price render in Fraunces, larger than their surroundings. On a
page selling an ingredient concentration, the figures are the argument.

**Materials over flat colour.** A 3% grain generated from an inline SVG
turbulence filter (no asset request), a pearl-to-lilac radial wash behind the
hero and the offer, a blurred violet orb on a 60-second drift, and pearl
surfaces with a sheen gradient and an inner top highlight. The orb, grain, glow
and sheen are all settings, so the page can be taken completely flat.

**Depth is a violet halo, and the earlier no-drop-shadows rule is retired.**
The first pass banned shadows outright, which is what made the page read
architectural rather than dewy. Reading the reference page's CSS, its depth is
`0 16px 40px rgba(150,130,200,.22)` — the accent colour, wide blur, low opacity
— and its surfaces carry soft diagonal gradients. Both are tokens here, scaled
by a **Glow** setting; 0 restores the flat look exactly. No grey shadow is used
anywhere.

**Silver is drawn as metal.** Every rule is a gradient that fades at both ends
and brightens in the middle; every ring, tag and frame edge is a gradient border
painted in the border box with the fill in the padding box, so the metal follows
the curve. A second token, **Silver — highlight `#EDEBF2`**, provides the bright
point. Flat `1px solid grey` disappears next to purple; this does not.

**Motion is tokenised, not hand-written per rule.** Hero copy rises on load
(520ms, 80ms stagger); sections reveal on scroll (900ms expo-out, siblings
staggered 90ms by an index set in JS); the hero media parallaxes on a
rAF-throttled listener clamped to ±48px; cards, buttons and rings lift on hover
over 240ms with their halo widening. Every displacement is a custom property
(`--lift-y`, `--lift-y-sm`, `--lift-scale`) so `prefers-reduced-motion` zeroes
all of them in one block. That mattered: the first attempt reset hovers rule by
rule and the bundle card still lifted under reduced motion — rendering in
`reducedMotion: 'reduce'` caught it.

**A second accent token, and why.** `#6E5AAB` passes AA on the page ground and
with white button text, but violet *text* on the tinted fills did not: the
per-bottle price on a selected card measured 4.18:1 and the reviews eyebrow on
the pearl band 4.37:1. Both looked fine. **Accent — text `#635099`** now carries
eyebrows, figures and unit prices, worst case 4.94:1 across all four surfaces.

**Review numbers ship empty, and the stars hide with them.** The brief asked for
empty defaults; rendering an empty five-star row alongside no number reads as
zero reviews, so the whole summary is suppressed until a count exists.

**Compositions, not a grid of three.** Hero asymmetric with pill-masked media
bleeding off the right edge; ingredients as hairline rows in a two-column
spread; step numerals as folios behind the copy; a dark clinic section with a
pull quote; tilted pearl frames in the gallery; three tall pill cards for the
offer with the tag astride the top edge; staggered review cards on a pearl band;
a single-column serif FAQ. The brief's rule — if a section could be dropped into
another Shopify store unchanged, it isn't done — is the one I designed against.

**Overrides are listed in COMPARE.md**, with measurements: the accent ink split,
the hidden star row, hairline separators instead of the brief's `·` dots (which
orphan a floating dot when the stat row wraps), and grain under the header
rather than over it.

**One bug the render caught.** `.section--deep a` was overriding `.button--light`,
painting the dark section's button light violet on a pearl fill at roughly 2:1.
Scoped to `a:not(.button)`. It is the second time rendering and measuring has
caught something that reading the CSS did not.

## The 404, and what it cost

The design pass shipped a theme that uploaded cleanly and then rendered the 404
template on every page, including Home in the theme editor.

**Root cause: `overlay_opacity: 34` against a range of `min: 0, max: 70,
step: 5`.** Shopify requires a range value to be exactly `min + N x step`. 34 is
not reachable from 0 in fives. It was wrong in two places, which is why the
damage was theme-wide rather than confined to the home page: the schema
**default** in `sections/hero-video.liquid`, and the stored **value** in
`templates/index.json`. `main` had 30 and rendered fine.

Nothing static catches this. The JSON is valid, the type is right, the number
sits inside min and max, and theme check has no rule for step alignment. I
introduced it by nudging an opacity from 30 to 34 for looks.

Two further defects surfaced in the same sweep. Both **pre-existed on `main`**,
so neither caused the 404, but both are real:

- `heading_tracking` used `unit: "/1000em"`. Shopify caps a range unit at three
  characters. The unit is gone; the explanation moved into `info`.
- `sections/footer.liquid` had
  `t: year: 'now' | date: '%Y', brand: brand`. That does not nest the way it
  reads — Liquid applies `| date` to the output of `t` and hands `brand:` to
  `date` as a third argument, which raises "wrong number of arguments" at render
  time. The year is assigned before the filter now.

**Ruled out**, so they do not need re-investigating: `comment`/`endcomment`
inside `{% liquid %}` (the real Ruby Liquid gem parses it clean in strict mode),
duplicate JSON keys, id charsets, block and order integrity, `enabled_on`
misuse, section-group wiring, invalid UTF-8 and BOMs, and theme check with every
check enabled at `--fail-level warning`.

**`scripts/validate-theme.py` exists because of this.** It encodes the runtime
rules theme check does not enforce. I regression-tested it rather than trusting
a green result: 3 failures on the broken head, 1 on `main`, 0 on the fix. Run it
alongside theme check; it exits non-zero.

## Cutting the page down

One product does not need a browse-then-buy funnel, so the three-option selector
moved directly under the hero on both templates:

    Home     hero -> bundle (3 choices) -> how it works -> FAQ
    Product  hero -> bundle (3 choices) -> how it works -> details -> FAQ

Removed from the templates: why encapsulated (the dark plum section), ingredient
cards, results gallery, reviews, guarantee strip. **The section files all stay**,
presets included, so each goes back from Customize with no code. Nothing was
deleted.

- The bundle heading "One bottle lasts about 8 weeks" is gone. The section reads
  "The serum / Choose your bundle", with shipping and refund terms in the
  footnote under the button, where they do the most work.
- The FAQ gained "How do I use it?" as its second question, carrying the same
  three steps, so that content survives in both places.
- Home page height went from 7963px to 4379px at 1440, and 5251px at 390.

**The judgement call I would revisit.** This removes the page's only social
proof and its only trust block. The guarantee line survives in the bundle
footnote, but the review cards are gone entirely, and on a $39 DTC serum those
are usually the last thing you should cut. The instruction was explicit and
named four sections, so I took it literally rather than quietly keeping a fifth
— but if anything goes back, it should be Reviews, directly under the bundle.

## Not done

- **Lighthouse ≥ 90 is not measured.** It needs a running store with real
  images and Shopify's own scripts, neither of which exists yet. The structural
  work is done — one deferred script, lazy images below the fold, `srcset` and
  `image_url` everywhere, explicit `width`/`height` on every image, `preload="none"`
  video, non-blocking fonts. Run it against `shopify theme dev` once the product
  and imagery are in, because the number will be dominated by your image weight
  and any apps you install, not by this theme.
- **No `shopify theme dev` run against a live store.** I have no store
  credentials. Liquid is now validated three ways — theme check, a strict parse
  with the real Ruby Liquid gem, and a mock-engine render of every section — but
  none of that is Shopify itself. The variant-position logic in particular is
  worth eyeballing once your three variants exist.
- **No customer account templates.** The brief did not mention accounts. If you
  enable them, add `templates/customers/*`.
