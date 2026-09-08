# Current UI and pre-publish checks — 9 September 2026

Follow-up repair: legacy title writers now use the same professional title;
avatar-render.js is the shared image renderer and preserves the loaded image
node over repeated sync. Plan pseudo-border removed, sidebar rings no longer
combine border and image inset. Loading completion waits for live state, DOM
and font readiness rather than page-load timers. Failed loading shows a retry.
Supporter export no longer silently substitutes an initial when a configured
photo cannot be fetched. Control background uses CORS-safe image loading and
its error is shown inline, not a misleading missing-bg.jpg alert.
PWA standalone detection is scoped to Watermark Pro's own launch identity;
the parent site's standalone mode alone does not mark this app installed.

Implemented: restored 2px Pro rings on header/settings and aligned Top User/card
rings; white supporter-preview username; saved avatar loading before PNG export;
preview-based normal username/mark typography; centered banner close; matching
Control loading sizes; one-shot isolated receipt printing; professional title;
pink granted receipt label; even Pro-card border; tablet two-column auth layout
and smaller heading; per-item unread dots persisted per account in this browser;
visible Control-style navigation; clean account routes; single floating install
icon; clickable sidebar identity; compact Control mobile menu rows.

Verified by isolated SQLite + headless Chrome: auth/control/password flows,
three automatic notifications, read persistence on refresh, public-profile
toggle, logout/back, logo geometry, install-event visibility, viewer geometry,
PNG download success including Top 3, and avatar rendered in supporter PNG.
Receipt tests assert one print call even when clicked twice and A4-content
height; the print-layout screenshot was visually inspected. Native system print
dialogs/printer-specific output were not tested.

Avatar backend tests use mocked upstream images: stored-photo authorization,
raster output, redirect rejection. Live external image hosts were not tested
through the new production endpoint because the Worker has not been deployed.

Production: deploy worker.js, check the existing D1 migrations, run
node build-publish.cjs, and upload publish/ contents under /watermark-pro/.
The build contains route directories for plain static hosting; directory URLs
may acquire a trailing slash. Do not upload the entire source workspace.

Read history is local to this browser/account, not synchronized between devices.
The OS controls installed-app launch screens and home-screen icon masks. The
website adds no installation splash; it retains the session-loading guard so
protected pages never flash before authentication is confirmed.
