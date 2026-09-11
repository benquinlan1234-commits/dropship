# Upload order

Three zips, theme folders at the archive root, containing only the seven
Shopify theme directories — no `design/`, `sample-content/` or docs. That also
removes "extra top-level folders in the zip" as a variable.

| Zip | What it is | Expected |
| --- | --- | --- |
| `v2-fixed.zip` | PR #2 with the fix | **Upload this one.** Should render normally |
| `v2-broken.zip` | PR #2 head before the fix (`43fa5c2`) | Reproduces the 404 |
| `v1.zip` | `main`, the version you know works | Control |

The only difference between `v2-broken.zip` and `v2-fixed.zip` is
`overlay_opacity`: `34` (invalid) versus `35` (valid). If `v2-fixed` renders and
`v2-broken` 404s, that confirms the root cause.

Rebuild any of these with:

    git archive <ref> | tar -x -C /tmp/theme
    cd /tmp/theme && zip -r out.zip assets config layout locales sections snippets templates
