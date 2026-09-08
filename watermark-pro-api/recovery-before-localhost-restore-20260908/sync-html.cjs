// Embed the current UI sources into both entry points, including file:// previews.
// Run after editing any of these JS files: node sync-html.cjs
const fs = require('node:fs');
const path = require('node:path');
const entries = {
  'index.html': ['pwa.js', 'wmark-shared.js', 'release-ui.js'],
  'control.html': ['wmark-shared.js', 'control-release.js']
};
for (const [entry, sources] of Object.entries(entries)) {
  const target = path.join(__dirname, entry);
  let html = fs.readFileSync(target, 'utf8');
  for (const source of sources) {
    const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existing = new RegExp(`<!-- bundled:${escaped}:start -->[\\s\\S]*?<!-- bundled:${escaped}:end -->|<script\\b[^>]*src=["']${escaped}["'][^>]*><\\/script>`);
    if (!existing.test(html)) throw new Error(`Missing ${source} in ${entry}`);
    let code = fs.readFileSync(path.join(__dirname, source), 'utf8').replace(/<\/script/gi, '<\\/script');
    // Preserve deferred execution after the document's remaining inline scripts.
    if (source !== 'wmark-shared.js') {
      code = `document.addEventListener('DOMContentLoaded', function () {\n${code}\n}, {once:true});`;
    }
    const block = `<!-- bundled:${source}:start -->\n<script data-bundled-source="${source}">\n${code}\n</script>\n<!-- bundled:${source}:end -->`;
    html = html.replace(existing, () => block);
  }
  fs.writeFileSync(target, html);
  console.log(`${entry}: embedded ${sources.join(', ')}`);
}
