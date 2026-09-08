# Final 27-item check

Historical batch below. Superseded instructions in the latest Sept 9 batch:
banner close is bottom-center; installation is a single floating download icon
on auth/account pages; Pro rings remain on header/settings avatars; clean URLs
use route directories from build-publish.cjs. See LATEST-FIX-CHECK.md for current
verification and remaining deployment requirements.

Checked against the current index.html and control.html. Existing working fixes
were retained; the account page was not replaced with an older preview.

1. Password: isolated browser registration passes with eight characters even
   after revealing the password; short passwords use Malay inline feedback.
   Backend password boundaries and change/reset flows pass integration tests.
2. Control creation hides reset fields; editing exposes a separate reset flow
   without requesting the user's old password. Browser tests pass.
3. Temporary password uses a selectable modal with a copy button, not alert;
   closing removes the password field. Browser tests pass.
4. Mobile header logo measures 40 by 40 pixels in browser testing.
5. Header/settings avatar W Mark pseudo-elements are absent in browser testing.
6. Auth-only floating install control and normal account install control are
   implemented; simulated installation events verify account visibility/removal.
   Actual OS installation was not performed.
7. Pro feature W Mark uses the same icon-column layout as other features.
8. Control uses the shared embedded W Mark asset rather than a broken image URL.
9. Community placeholder is absent in browser testing.
10. Normal username/W Mark CSS uses 16px/13px, 3px spacing and a truncation
    adjustment. Generated images use the separate shared scaled drawing helper.
11. Logout clears the account route; Back does not reveal the account page.
    Browser logout/relogin tests pass.
12. Script syntax, isolated backend integration and browser flows pass.
13. Fixed the inaccessible isProUser helper in Control's Top 3 exporter.
    Top 3, supporter-card and progress PNG downloads complete without errors.
14. Active progress export uses the successful-download title.
15. Active account card/export headers use mixed-case brand and status labels;
    corrected the remaining active progress header in this batch.
16. Active progress export draws the username in pure black.
17. W Mark modal's redundant close button is hidden by the scoped UI rule.
18. Production requirements and file:// limitations are in DEPLOYMENT.md.
    Production deployment and live database migration have NOT been performed.
19. Active entry points are index.html and control.html; preview routing and
    deployment instructions use these filenames. Historical backups are retained.
20. Corrected banner/tool close positioning to the image's lower-right corner;
    browser geometry verifies half-overlap on both axes.
21. Avatar viewer close control is hidden in browser testing.
22. Creation, pending payment and Pro approval notifications pass isolated
    backend/browser checks, including targeting, duplicates and rollback on error.
23. Public profile false survives refresh; true survives relogin in browser
    tests. Persistence is backend-backed rather than a default UI value.
24. Avatar hint uses inline emphasis and can wrap naturally on narrow screens.
25. Account header bottom border measures zero; existing scoped hero spacing
    adjustment is retained.
26. Existing Pro mobile navigation uses bg.jpg through icon masks.
27. Scoped auth-main rules remove top/bottom padding, including mobile.

Verification commands:

    node verify-scripts.cjs
    node test-worker.cjs --browser

The tests use an isolated SQLite database and local test API, not production
accounts. Browser page errors and native dialogs are asserted absent for the
tested flows. This is not a guarantee that every external production service
or browser/OS combination has been tested. Publish the frontend and updated
Worker together and confirm the production origin allowlist and D1 schema first.
