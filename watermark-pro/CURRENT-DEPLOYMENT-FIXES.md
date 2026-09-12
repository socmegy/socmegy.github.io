# Current batch

Changed: worker.js, migrations-notification-reads.sql, index.html,
release-ui.js, control.html, control-release.js, manifest.webmanifest,
sw.js, build-publish.cjs, test-worker.cjs, test-browser.cjs.
Restored generated app-icon-192.png and app-icon-512.png from legacy assets.
Tests: independent-login read persistence, duplicate read prevention, all
existing integration/browser tests passed; mobile/desktop payment screenshots
inspected. Native OS install and live external avatar exports are not verified.

Run migrations-notification-reads.sql on D1 BEFORE deploying worker.js.
Read state is now stored per user/notification in D1, shared across logins.
Old browser-local read history is not automatically imported.

Run node build-publish.cjs. Upload only contents of publish/ into the intended
app directory (for example /watermark-pro-api/ or /watermark-pro/), including
profil/, pelan/, tetapan/, sokongan/, control/ and all assets. Do not upload
only index.html. Directory routes can receive a trailing slash on static hosts.
Source, tests, backups and Worker secrets are not included in publish/.

Deploy the updated Worker for cross-device read state and Control avatar export.
The avatar proxy requires authentication and only fetches stored images from
approved HTTPS hosts; AVATAR_EXPORT_HOSTS can configure trusted hosts.

Manifest identity/scope are relative to the deployment directory; legacy PNG
logo icons are copied by the build. Native installation eligibility is controlled
by the browser. No installation or production deployment has been performed.
