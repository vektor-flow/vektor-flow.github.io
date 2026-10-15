# Vektor Flow public site

Only the reviewed0.7.2 compiler is published. `public/current-compiler-release.json`
pins the module, WASM and data hashes. The reviewed release was restored from
feb5150 after later preview publication inadvertently restored0.7.1 content.
The GPU math typing preview is preserved from8309ba2.

Legacy0.4.7 pages, runtimes and downloads,0.6 previews and superseded0.7.1
packages are retired from the deployment tree. Git history retains them; do not
copy them back into public assets. Old URLs return404 using a noindex error page.
The sitemap contains current pages only. Existing search-engine caches can take
time to disappear after recrawling; removing files does not instantly erase them.

Before publication run `python3 scripts/verify-current-site.py`, update reviewed
hashes with `python3 scripts/update-manifest.py`, and review the full asset diff.
CI checks both current-release policy and all manifest bytes before Pages deploys.
For browser verification, serve public on localhost8857 and run
`VKF_PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node tests/site-browser.mjs`.
Set VKF_SITE_URL for hosted checks. The local test uses software rendering and
makes no physical GPU performance claim. Do not reset or bypass GPU stop markers.

The existing GPU math typing transitions use CPU glyph matching/interpolation
and crossfades; they are not a GPU morphology solver or performance benchmark.
