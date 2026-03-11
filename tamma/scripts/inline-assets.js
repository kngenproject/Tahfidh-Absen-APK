#!/usr/bin/env node
/**
 * inline-assets.js
 * Downloads all CDN dependencies and inlines them directly into index.html
 * so the app works 100% offline (no internet required after install).
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const HTML_PATH = join(__dirname, '../www/index.html');

const CDN_ASSETS = {
  fontawesome_css: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  xlsx_js: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
};

async function fetchText(url) {
  console.log(`  ↓ Fetching: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

async function fetchBase64(url) {
  console.log(`  ↓ Fetching font: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

function getMimeType(url) {
  if (url.endsWith('.woff2')) return 'font/woff2';
  if (url.endsWith('.woff'))  return 'font/woff';
  if (url.endsWith('.ttf'))   return 'font/ttf';
  if (url.endsWith('.eot'))   return 'application/vnd.ms-fontobject';
  if (url.endsWith('.svg'))   return 'image/svg+xml';
  return 'application/octet-stream';
}

async function inlineFontAwesome(cssUrl) {
  let css = await fetchText(cssUrl);
  const baseUrl = cssUrl.replace(/\/[^/]+$/, '/');

  // Find all url() references in @font-face blocks
  const urlPattern = /url\(["']?((?:https?:\/\/|\.\.\/|\.\/)?[^"')]+\.(woff2?|ttf|eot|svg)[^"')]*?)["']?\)/g;

  const fontUrls = new Set();
  let match;
  while ((match = urlPattern.exec(css)) !== null) {
    const rawUrl = match[1].split('?')[0].split('#')[0]; // strip query/hash
    const absUrl = rawUrl.startsWith('http') ? rawUrl : baseUrl + rawUrl.replace(/^\.\//, '');
    fontUrls.add(absUrl);
  }

  console.log(`  → Found ${fontUrls.size} font files to inline`);

  // Download all font files and replace with data URIs
  for (const fontUrl of fontUrls) {
    const b64 = await fetchBase64(fontUrl);
    const mime = getMimeType(fontUrl);
    const dataUri = `data:${mime};base64,${b64}`;
    // Replace all variants of this URL (with or without query strings)
    const escapedUrl = fontUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    css = css.replace(
      new RegExp(`url\\(["']?${escapedUrl}[^"')]*["']?\\)`, 'g'),
      `url(${dataUri})`
    );
  }

  return css;
}

async function main() {
  console.log('\n🔧 Tamma Offline Builder');
  console.log('========================');

  let html = readFileSync(HTML_PATH, 'utf8');

  // ─── 1. Inline Font Awesome ───────────────────────────────────────────────
  console.log('\n📦 Inlining Font Awesome...');
  const faCss = await inlineFontAwesome(CDN_ASSETS.fontawesome_css);
  html = html.replace(
    /<link[^>]*font-awesome[^>]*>/i,
    `<style id="fa-inline">\n${faCss}\n</style>`
  );
  console.log('  ✅ Font Awesome inlined');

  // ─── 2. Inline SheetJS ───────────────────────────────────────────────────
  console.log('\n📦 Inlining SheetJS (xlsx)...');
  const xlsxJs = await fetchText(CDN_ASSETS.xlsx_js);
  html = html.replace(
    /<script[^>]*xlsx\.full\.min\.js[^>]*><\/script>/i,
    `<script id="xlsx-inline">\n${xlsxJs}\n</script>`
  );
  console.log('  ✅ SheetJS inlined');

  // ─── 3. Add Capacitor bridge ─────────────────────────────────────────────
  if (!html.includes('capacitor.js')) {
    html = html.replace(
      '</head>',
      `  <script src="capacitor.js" defer></script>\n</head>`
    );
    console.log('\n✅ Capacitor bridge added');
  }

  // ─── 4. Fix service worker scope for Capacitor ───────────────────────────
  // Capacitor uses its own caching, SW is optional — keep it but make it safe
  html = html.replace(
    "navigator.serviceWorker.register(",
    "navigator.serviceWorker && navigator.serviceWorker.register("
  );

  // ─── 5. Write output ─────────────────────────────────────────────────────
  writeFileSync(HTML_PATH, html, 'utf8');

  const sizeKB = Math.round(Buffer.byteLength(html, 'utf8') / 1024);
  console.log(`\n✅ Done! Output: www/index.html (${sizeKB} KB)`);
  console.log('   App is now fully offline-capable.\n');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
