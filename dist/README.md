# Upload order

Three zips, theme folders at the archive root, containing only the seven
Shopify theme directories — no `design/`, `sample-content/` or docs. That also
removes "extra top-level folders in the zip" as a variable.

| Zip | What it is | Expected |
| --- | --- | --- |
| `v2-fixed.zip` | PR #2 with the fix **and the trimmed page structure** | **Upload this one.** Should render normally |
| `v2-broken.zip` | PR #2 head before the fix (`43fa5c2`) | Reproduces the 404 |
| `v1.zip` | `main`, the version you know works | Control |

The only difference between `v2-broken.zip` and `v2-fixed.zip` is
`overlay_opacity`: `34` (invalid) versus `35` (valid). If `v2-fixed` renders and
`v2-broken` 404s, that confirms the root cause.

Rebuild any of these with:

    git archive <ref> | tar -x -C /tmp/theme
    cd /tmp/theme && zip -r out.zip assets config layout locales sections snippets templates

## Page structure in `v2-fixed.zip`

    Home     hero -> bundle (3 choices) -> how it works -> FAQ
    Product  hero -> bundle (3 choices) -> how it works -> details -> FAQ

The sections cut from the templates — ingredients, why encapsulated, results
gallery, reviews, guarantee strip — are still in the theme. Add any of them back
from **Customize -> Add section** without touching code.
