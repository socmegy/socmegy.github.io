# Publishing Watermark Pro

The account entry point is `index.html`; Control is `control.html`. Both embed
the current UI scripts. After editing `release-ui.js`, `control-release.js`,
`wmark-shared.js`, or `pwa.js`, run `node sync-html.cjs` to update the HTML.
Publish both alongside
`sw.js`, `manifest.webmanifest`, `logo.jpg`, `bg.jpg`, `qr.jpg`, `threads.svg`,
`icon-192.png`, `icon-512.png`, and `apple-touch-icon.png`. Keep these files in
one directory. Do not publish the workspace wholesale: it contains historical
previews, ZIP backups, backend source, and test files.

The production account URL is `https://socmegy.com/watermark-pro/index.html`;
Control is `https://socmegy.com/watermark-pro/control.html`. Root-directory and
other subdirectory hosting also work. Navigation uses `index.html#/tetapan`,
`#/profil`, and `#/sokongan`, so static hosts do not need SPA rewrite support.
The supplied `_redirects` belongs at the hosting root on hosts supporting that
format; it preserves the old `/control/` and `/watermark-pro/tetapan`-style URLs.
On other hosts configure equivalent redirects. Adjust those compatibility
redirects when deploying under a different prefix. Direct HTML links and hash
navigation work without them.

## Backend release requirements

Both HTML files already default to the HTTPS Worker at
`https://watermark-pro-api.socmegy.workers.dev`. Local preview injection is not
required for production API access. To use another Worker, set
`window.WATERMARK_API_BASE` before the inline Cloudflare client in each HTML.
Never use a localhost API address in published configuration.

Deploy `worker.js` using `wrangler.jsonc` and its existing
`DB` D1 binding. The frontend and Worker changes must be released together:
uploading HTML alone does not fix Control account notifications on the server.
No production Worker or database was modified during this repair.

Forgot-password recovery currently requires contacting the administrator through
Support. There is no email delivery/reset-token implementation in this Worker.
The page no longer claims to send an email or asks a locked-out user to log in.
Control can assign a new password without the old password and revokes the
user's previous sessions.

Check `PRAGMA table_info(users)` in the production D1 database. If
`public_profile` is absent, apply `migrations-add-public-profile.sql` once.
The existing banner and community migrations are also prerequisites for their
respective settings. The profile endpoint now fails rather than pretending to
save visibility when the schema is missing.

Set the Worker `ALLOWED_ORIGINS` variable to an explicit comma-separated list
of website origins, including any preview/custom domain and development ports
you use. Defaults include socmegy.com, www.socmegy.com, control.socmegy.com,
socmegy.github.io, and localhost/127.0.0.1 on port 4173. A different local port
or hosting domain must be added. The current Worker also accepts the `null`
origin used by direct local file previews.
The active pages use Cloudflare/D1 authentication, not the archived Firebase app.

## Local previews

Double-click `index.html` or `control.html` for a direct local preview. The
latest shared assets and UI fixes are embedded in each HTML. Keep the image
files beside them. Both use the HTTPS Worker for real data; file preview API
access depends on the running Worker accepting the `null` origin.

For a preview closest to deployment, run `START-LOCAL-PREVIEW.bat` and open
`http://localhost:4173/watermark-pro/index.html` or
`http://localhost:4173/watermark-pro/control.html`. Localhost serves these same
HTML files from this folder. Reload after editing. File URLs and localhost
have separate login storage, so sign in separately. PWA installation needs
HTTPS or localhost; local-file canvas exports remain browser-dependent.

The preview server previously supplied clean-route handling and API config,
and `/control/` resolved scripts beneath the wrong directory. Preview now
redirects Control to its actual file. Asset, manifest, and service-worker paths
resolve from the published directory. The new service-worker cache version
replaces the previous shell cache on activation.

## Verification

Run `node verify-scripts.cjs` and `node test-worker.cjs --browser`.
The latter uses isolated SQLite and headless Chrome with Playwright; it never
mutates the live Worker. Install Playwright locally if the bundled Codex runtime
is unavailable. Screenshots are written to `test-account-desktop.png`,
`test-account-mobile.png`, and `test-control-result.png`.

Local development: run `node local-preview-server.js`, then open
`http://localhost:4173/watermark-pro/index.html` or
`http://localhost:4173/watermark-pro/control.html`. This preview uses the configured
remote API, so actions there affect that service. The automated browser tests
use a separate temporary local API instead.
