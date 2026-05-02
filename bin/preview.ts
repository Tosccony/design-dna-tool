#!/usr/bin/env -S tsx
/**
 * Generate a static HTML reference page for the design-dna-tool's
 * typography and color presets — a designer's specimen catalog used
 * before opening Claude for a new mockup.
 *
 * Usage:
 *   tsx bin/preview.ts
 *   npm run preview
 *
 * Output:
 *   previews/index.html — open in any browser
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  typographyPresets,
  colorPresets,
  type TypographyPreset,
  type ColorPreset,
  type FontFamily,
} from '../presets';

// ================================================================
// Configuration
// ================================================================

const OUT_DIR = 'previews';
const OUT_FILE = 'index.html';

const SAMPLE_DISPLAY = 'The shape of ideas.';
const SAMPLE_BODY =
  'Typography is the voice of the page — tracking, weight contrast, and rhythm carry as much intent as the words themselves.';

// ================================================================
// Helpers
// ================================================================

function fontStack(font: FontFamily): string {
  return [`'${font.name}'`, ...font.fallback].join(', ');
}

function uniqueFontUrls(presets: TypographyPreset[]): string[] {
  const urls = new Set<string>();
  for (const p of presets) {
    if (p.display.source.type === 'google') urls.add(p.display.source.url);
    if (p.body.source.type === 'google') urls.add(p.body.source.url);
    if (p.mono?.source.type === 'google') urls.add(p.mono.source.url);
  }
  return [...urls];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Pick a readable label color for a swatch chip based on its background
 * luminance. Standard approximation — good enough for swatch labels.
 */
function inkForBg(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? 'rgba(20, 17, 14, 0.85)' : 'rgba(252, 250, 246, 0.92)';
}

// ================================================================
// Rendering
// ================================================================

function renderTypographyCard(p: TypographyPreset): string {
  const displayStyle = [
    `font-family: ${fontStack(p.display)}`,
    `font-weight: ${p.displaySpec.weight}`,
    `line-height: ${p.displaySpec.lineHeight}`,
    `letter-spacing: ${p.displaySpec.tracking}em`,
    p.display.opticalSizing ? 'font-optical-sizing: auto' : '',
  ]
    .filter(Boolean)
    .join('; ');

  const bodyStyle = [
    `font-family: ${fontStack(p.body)}`,
    `font-weight: ${p.bodySpec.weight}`,
    `line-height: ${p.bodySpec.lineHeight}`,
    `letter-spacing: ${p.bodySpec.tracking}em`,
  ].join('; ');

  return `
    <article class="card">
      <header class="card-head">
        <h3 class="card-name">${escapeHtml(p.name)}<span class="card-id">${escapeHtml(p.id)}</span></h3>
        <p class="card-char">${escapeHtml(p.character)}</p>
        <p class="card-meta">${escapeHtml(p.display.name)} ${p.displaySpec.weight} / ${escapeHtml(p.body.name)} ${p.bodySpec.weight} · scale ${p.scaleRatio} · ${p.baseSize}px</p>
      </header>
      <div class="card-body">
        <p class="sample-display" style="${displayStyle}">${escapeHtml(SAMPLE_DISPLAY)}</p>
        <p class="sample-body" style="${bodyStyle}">${escapeHtml(SAMPLE_BODY)}</p>
      </div>
    </article>`;
}

function renderSwatch(role: string, hex: string): string {
  const ink = inkForBg(hex);
  return `<div class="swatch" style="background: ${hex}; color: ${ink};"><span class="swatch-role">${escapeHtml(role)}</span><span class="swatch-hex">${escapeHtml(hex)}</span></div>`;
}

function renderColorCard(p: ColorPreset): string {
  const swatches = Object.entries(p.tokens)
    .map(([role, hex]) => renderSwatch(role, hex))
    .join('');

  return `
    <article class="card">
      <header class="card-head">
        <h3 class="card-name">${escapeHtml(p.name)}<span class="card-id">${escapeHtml(p.id)}</span></h3>
        <p class="card-char">${escapeHtml(p.character)}</p>
        <p class="card-meta">${p.mode} · ${p.contrast.inkOnBackground.toFixed(1)}:1 · ${escapeHtml(p.accentRules)}</p>
      </header>
      <div class="swatches">${swatches}</div>
    </article>`;
}

function renderPage(): string {
  const fontLinks = uniqueFontUrls(typographyPresets)
    .map((url) => `  <link rel="stylesheet" href="${escapeHtml(url)}" />`)
    .join('\n');

  const typographyCards = typographyPresets.map(renderTypographyCard).join('');
  const colorCards = colorPresets.map(renderColorCard).join('');

  const today = new Date().toISOString().split('T')[0];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Design DNA — Preset Reference</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
${fontLinks}
  <style>
${PAGE_STYLES}
  </style>
</head>
<body>
  <header class="page-head">
    <p class="eyebrow">Design DNA</p>
    <h1 class="page-title">Preset Reference</h1>
    <p class="page-meta">${typographyPresets.length} typography presets · ${colorPresets.length} color presets · Generated ${today}</p>
  </header>

  <section class="section">
    <p class="section-eyebrow">Typography</p>
    <div class="cards-grid">${typographyCards}
    </div>
  </section>

  <section class="section">
    <p class="section-eyebrow">Color</p>
    <div class="cards-grid">${colorCards}
    </div>
  </section>

  <footer class="page-foot">
    <p>Regenerate via <code>npm run preview</code> after adding presets to <code>presets.ts</code>.</p>
  </footer>
</body>
</html>
`;
}

// ================================================================
// Styles
// ================================================================

const PAGE_STYLES = `    :root {
      --bg: #FCFAF6;
      --card-bg: #FFFFFF;
      --ink: #14110E;
      --ink-muted: #6B645C;
      --ink-subtle: #9A938A;
      --border: #ECE5D9;
      --chrome-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      --mono-font: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, monospace;
    }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: var(--chrome-font);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      font-size: 14px;
      line-height: 1.5;
    }

    .page-head, .section, .page-foot {
      padding-left: 2rem;
      padding-right: 2rem;
    }

    .page-head {
      padding-top: 2.5rem;
      padding-bottom: 1.75rem;
      border-bottom: 1px solid var(--border);
    }

    .eyebrow, .section-eyebrow {
      font-size: 0.6875rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-weight: 600;
      color: var(--ink-muted);
      margin: 0 0 0.4rem;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 500;
      margin: 0 0 0.5rem;
      letter-spacing: -0.015em;
    }

    .page-meta {
      color: var(--ink-muted);
      margin: 0;
      font-size: 0.8125rem;
    }

    .section {
      padding-top: 2rem;
      padding-bottom: 0.5rem;
    }

    .section-eyebrow {
      margin-bottom: 1rem;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
      gap: 0.75rem;
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 1rem 1.25rem 1.25rem;
      overflow: hidden;
    }

    .card-head {
      margin-bottom: 0.75rem;
    }

    .card-name {
      font-size: 0.9375rem;
      font-weight: 600;
      margin: 0 0 0.25rem;
      letter-spacing: -0.005em;
      display: flex;
      align-items: baseline;
      gap: 0.625rem;
      flex-wrap: wrap;
    }

    .card-id {
      font-family: var(--mono-font);
      font-size: 0.6875rem;
      font-weight: 400;
      color: var(--ink-subtle);
    }

    .card-char {
      margin: 0 0 0.25rem;
      color: var(--ink-muted);
      font-size: 0.8125rem;
      line-height: 1.45;
    }

    .card-meta {
      margin: 0;
      color: var(--ink-subtle);
      font-size: 0.6875rem;
      font-family: var(--mono-font);
    }

    /* Typography card body */
    .card-body { padding-top: 0.25rem; }

    .sample-display {
      font-size: 2.25rem;
      margin: 0.5rem 0 0.75rem;
      color: var(--ink);
    }

    @media (max-width: 700px) {
      .sample-display { font-size: 1.875rem; }
    }

    .sample-body {
      font-size: 0.9375rem;
      margin: 0;
      color: var(--ink);
    }

    /* Color swatches — edge-to-edge, swatchbook style */
    .swatches {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid var(--border);
      margin-top: 0.5rem;
    }

    .swatch {
      flex: 1 1 0;
      min-width: 0;
      height: 84px;
      padding: 0.4rem 0.5rem;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      gap: 0.1rem;
      overflow: hidden;
      font-size: 0.625rem;
      line-height: 1.25;
    }

    .swatch-role {
      font-weight: 600;
      letter-spacing: -0.005em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .swatch-hex {
      font-family: var(--mono-font);
      opacity: 0.78;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .page-foot {
      padding-top: 2rem;
      padding-bottom: 2.5rem;
      color: var(--ink-subtle);
      font-size: 0.75rem;
      border-top: 1px solid var(--border);
      margin-top: 2rem;
    }

    .page-foot code {
      background: rgba(20, 17, 14, 0.04);
      padding: 0.125rem 0.375rem;
      border-radius: 3px;
      font-size: 0.92em;
      font-family: var(--mono-font);
    }`;

// ================================================================
// Main
// ================================================================

function main() {
  const outDir = path.resolve(OUT_DIR);
  const outPath = path.join(outDir, OUT_FILE);

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, renderPage(), 'utf-8');

  const fileUrl = 'file:///' + outPath.replace(/\\/g, '/');

  console.log(`✓ Preset reference written`);
  console.log(`  ${outPath}`);
  console.log(``);
  console.log(`Open in your browser:`);
  console.log(`  ${fileUrl}`);
  console.log(``);
}

main();
