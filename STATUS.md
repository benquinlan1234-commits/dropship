# Status

Where the theme stands, what was done to get here, and what is left.

- **Branch:** `claude/pdrn-orb-serum-theme-iqu86p` — [PR #2](https://github.com/benquinlan1234-commits/dropship/pull/2), open against `main`
- **`main`** is v1, merged as PR #1. It renders, but it is the pre-design-pass theme
- **To upload:** `dist/v2-fixed.zip`
- **Checks:** `shopify theme check` 0 errors / 2 warnings · `scripts/validate-theme.py` 0 failures · both run in CI on every PR

Companion documents:

| File | What it holds |
| --- | --- |
| [`README.md`](README.md) | How to run, upload, and which settings to fill first |
| [`DECISIONS.md`](DECISIONS.md) | Every default chosen and why, including the 404 post-mortem |
| [`design/COMPARE.md`](design/COMPARE.md) | Before/after renders with a per-section rationale |
| [`dist/README.md`](dist/README.md) | Which zip to upload and in what order |
| [`sample-content/`](sample-content/) | Default copy as plain text, for editing outside the Customizer |

---

## What exists

A single-product Online Store 2.0 theme. Liquid, JSON templates, vanilla JS, no
build step, no dependencies.

    assets/     2 files    theme.css (18.5 KB), theme.js (22.9 KB)
    config/     2 files    settings_schema.json, settings_data.json
    layout/     2 files    theme.liquid, password.liquid
    locales/    1 file     en.default.json
    sections/  27 files    25 sections + 2 section groups
    snippets/   8 files
    templates/ 12 files
    scripts/    1 file     validate-theme.py

### The page

One product does not need a browse-then-buy funnel, so the offer sits second.

| | Home | Product |
| --- | --- | --- |
| 1 | Hero video | Product hero (gallery) |
| 2 | Bundle selector — `#bundle` | Bundle selector |
| 3 | How it works — `#how` | How it works |
| 4 | FAQ — `#faq` | Product details |
| 5 | — | FAQ |

Plus **Sticky add to cart**, fixed to the viewport.

### Built, but not on the page

Each ships with a preset, so restoring one is **Customize → Add section**, no
code. Nothing was deleted.

- **Ingredient cards** — the three actives as editorial hairline rows
- **Why encapsulated** — the dark plum section with the pull quote
- **Results gallery** — tilted pearl frames, horizontal scroll
- **Reviews** — staggered pearl cards, plus the reviews-app slot
- **Guarantee strip** — the three trust items

### Design system

Pearl, lilac and plum with one violet accent, all theme settings. Fraunces for
display and numerals, Manrope for body and UI. Depth is a soft violet halo
rather than a grey drop shadow; silver is drawn as gradient metal rather than
flat grey. Glow, sheen, grain and the drifting orb are each a setting, so the
page can be taken completely flat without touching code. Full table in the
README.

---

## How it got here

| Commit | What it did |
| --- | --- |
| `0e62eac`…`bdcb2a1` | **v1** — scaffold, all sections, templates, docs. Merged to `main` as PR #1 |
| `cbffb19` | **Design pass** — lilac-pearl ground, two typefaces, asymmetric hero, dark clinic section, pill offer cards, silver hairlines |
| `43fa5c2` | **Softening** — violet halos instead of flat surfaces, silver as gradient metal, scroll reveals, parallax, hover on every key surface |
| `8b9ab30` | **404 fix** — `overlay_opacity: 34` was off-step for its range. Added `scripts/validate-theme.py` |
| `14a1d3c` | **Page trim** — cut to hero → offer → how it works → FAQ on both templates |
| `b0c3b28` | **Docs** — brought README, DECISIONS, COMPARE and sample-content in line |
| `71947a2` | **Handover** — added this file |
| `88cc856` | **CI** — theme check and the runtime rules on every PR |

Housekeeping commits that only corrected documentation are left out. For the
exact list, `git log origin/main..HEAD`.

### The 404, briefly

The design pass uploaded cleanly and then rendered the 404 template on every
page. Cause: **`overlay_opacity: 34` against `min: 0, max: 70, step: 5`.**
Shopify requires a range value to be exactly `min + N × step`, and 34 is not
reachable from 0 in fives. It was wrong in both the schema default and the
stored value, which is why the damage was theme-wide.

Nothing static caught it — valid JSON, right type, inside min/max, and theme
check has no rule for step alignment. That is why `scripts/validate-theme.py`
exists. Full write-up, including the two pre-existing defects found alongside it
and everything ruled out, is in [`DECISIONS.md`](DECISIONS.md).

---

## How this is checked

Four layers, because theme check alone let a page-breaking bug through.

| Layer | Command | Catches |
| --- | --- | --- |
| Shopify's own | `shopify theme check` | Liquid and schema lint, deprecated filters |
| Runtime rules | `python3 scripts/validate-theme.py` | Range step/bounds/unit limits, duplicate JSON keys, id charsets, block/order integrity, settings_data drift, unresolved render targets |
| Real Liquid | Ruby `liquid` gem, strict parse | Genuine parse errors, free of theme-check's reimplementation |
| Rendered | Chromium at 1440 and 390 | Contrast against real backdrops, hover states, reduced motion, overflow |

The first two run in CI on every pull request
([`.github/workflows/theme-checks.yml`](.github/workflows/theme-checks.yml)).
The Ruby parse and the Chromium renders are manual — worth doing after any
change to Liquid or to the design system.

`validate-theme.py` was regression-tested rather than trusted: 3 failures on the
broken head, 1 on `main`, 0 on this branch. It exits non-zero, so it drops
straight into CI or a pre-push hook.

---

## What is left

### Blocking — the store cannot sell without these

1. **Upload `dist/v2-fixed.zip` and confirm it renders.** The 404 fix is proven
   as a constraint violation unique to this branch, but I could not execute
   Shopify to watch the 404 disappear. `v2-broken.zip` and `v1.zip` are in
   `dist/` if you want to see the break and the control first.
2. **Set the featured product** — Theme settings → Product. Every section falls
   back to it. Currently unset.
3. **Create the three variants**, in this order:

   | Position | Title | Price | Compare at |
   | --- | --- | --- | --- |
   | 1 | 1 bottle | $39 | — |
   | 2 | 2 bottles | $69 | $78 |
   | 3 | 3 bottles | $99 | $117 |

   Per-bottle prices are computed from the "Bottles in this option" setting, so
   they stay correct if prices change. If your variants land in a different
   order, fix **Variant position** on each bundle card or paste the numeric
   **Variant ID**.
4. **Imagery.** Every image and the hero video are placeholders. Hero video
   (mp4/webm + poster with alt text), product gallery images, logo and favicon.
   The README has both routes for the video.
5. **Replace the INCI list** in Product details. What ships is a plausible
   placeholder and says so in the copy — but it is not your formula.

### Before launch — content and claims

6. **Review numbers are empty by design** and the star row stays hidden until
   you fill the count. Fill them only with real figures.
7. **The review cards are invented placeholders.** If you put the Reviews
   section back, replace them first, or wire a reviews app into
   `snippets/reviews-app-slot.liquid`.
8. **Subscribe-and-save needs a subscriptions app.** The toggle only appears
   when the product has a selling plan; the 15% lives on the plan, not in the
   theme, so the two can never disagree.
9. **Header links** point at `/#bundle` and `/#faq`. Set a real navigation menu
   if you would rather they go to pages.
10. **Confirm the free shipping threshold** — currently $35, used by the cart
    drawer progress bar and the `[threshold]` token.
11. **Policy pages** — `page.json` is ready; shipping, returns and privacy still
    need writing.

### Recommended — not blocking

12. ~~**Add CI.**~~ **Done** — `.github/workflows/theme-checks.yml` runs
    `shopify theme check --fail-level error` and `scripts/validate-theme.py` as
    two jobs on every pull request and on pushes to `main`. Verified against the
    commit that broke Shopify: theme check passes it, the runtime-rules job
    fails it, so this would have blocked the 404 before upload.
13. **Measure Lighthouse** once the store is live with real imagery. The
    structural work is done — one deferred script, lazy images, `srcset`,
    explicit dimensions, `preload="none"` video, non-blocking fonts — but the
    number will be dominated by image weight and installed apps, not by this
    theme.
14. **`theme.js` is 22.9 KB raw.** Theme check's non-default "all" preset flags
    it against a 10 KB compressed threshold. It is one deferred file with no
    dependencies; split it only if Lighthouse says so.
15. **Customer account templates** — none exist. Add `templates/customers/*` if
    you enable accounts.

---

## Open decisions

Things I would put back to you rather than decide alone.

**Cutting Reviews and the Guarantee strip.** The instruction named four sections
and I took it literally, which removed the page's only social proof and its only
trust block. The guarantee line survives in the bundle footnote under the
add-to-cart. On a $39 DTC serum the review cards are usually the last thing to
cut — if one section goes back, make it Reviews, directly under the bundle.

**The bundle card shape.** At their current proportions the 170px radius makes
the three cards read closer to circles than stadiums. I think a tighter radius
would look sharper, but shape was never in the brief and you said the design was
close, so I left it. One value in `sections/bundle-selector.liquid`.

**British spelling** — "moisturiser", "oxidises" — throughout the copy. Worth a
find-and-replace if the market is US.

**`sample-content/` and `design/` are not theme folders.** They are excluded
from the zips. Harmless in the repo, but if you ever upload the repo directly
rather than a built zip, they are extra baggage.

---

## Known limits

Stated plainly so nothing here reads as more verified than it is.

- **Never run against a real Shopify store.** No credentials. Liquid is
  validated by theme check, a strict parse with the real Ruby Liquid gem, and a
  mock-engine render of every section — but none of that is Shopify itself. The
  variant-position logic is the piece most worth eyeballing once the variants
  exist.
- **The 404 mapping was not directly observed.** The constraint violation is
  proven and unique to this branch; the broken/fixed zip pair settles the rest.
- **All renders are Chromium only**, from a static page that mirrors the section
  markup with placeholder imagery. Fonts were served locally for the captures
  because the sandbox cannot reach Google Fonts; the theme loads them from
  Google normally.
- **Lighthouse is unmeasured.**
- **Real photography will change the design's balance** — the pearl frames and
  the tall pill mask are carrying empty space right now.

---

## Working on it

```bash
shopify theme dev --store your-store.myshopify.com   # local, hot reload

shopify theme check                                  # Shopify's linter
python3 scripts/validate-theme.py                    # the runtime rules it misses

shopify theme push --unpublished --theme "PDRN Orb Serum"
```

Rebuild an upload zip — theme folders at the archive root, nothing else:

```bash
git archive HEAD | tar -x -C /tmp/theme
cd /tmp/theme && zip -r out.zip assets config layout locales sections snippets templates
```
