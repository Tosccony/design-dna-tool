# Design DNA Tool

> Schema-driven mockup generator for high-end websites. Compose a Design DNA from a curated preset library, then ship a complete, runnable starter project in one command.

**The point:** kill cookie-cutter AI output. By forcing every project to commit to a specific typography / color / motion combination, mockups stay distinctive instead of collapsing into the bland "centered hero with three feature cards" pattern AI-generated sites trend toward.

---

## Quick start

```bash
npm install                                       # one-time
tsx bin/generate.ts library/atelier-house.json    # generate the mockup
cd generated/atelier-house && npm install && npm run dev
```

Open <http://localhost:3000>. Each generated project is a standalone npm package with its own `README.md` and `CLAUDE.md` describing its specific Design DNA.

---

## Frameworks

| Flag        | Status           | Output                                                          |
| ----------- | ---------------- | --------------------------------------------------------------- |
| _(default)_ | Stable           | Next.js 15 + React 19 + Tailwind v4 → `generated/<slug>/`       |
| `-f astro`  | **Experimental** | Astro 5 + Tailwind v4 → `generated/<slug>.astro/`               |

> **Astro is experimental.** v1 supports the `cinematic-gallery` layout only — other layouts error loudly. The Next.js writer remains the default and the validated source of truth. Visual parity is good but not exhaustively verified.

Both writers consume the same compiled `@theme` block, so colors, typography, and motion easings are identical across frameworks for any DNA. Enriched images auto-share between both outputs of the same DNA — run `/enrich` once.

---

## Commands

```bash
tsx bin/generate.ts <dna.json>            # generate (default: nextjs)
tsx bin/generate.ts <dna.json> -f astro   # experimental Astro target
tsx bin/generate.ts <dna.json> --overwrite
tsx bin/generate.ts -h                    # full help

tsx bin/gemini-image.ts "<prompt>" out.png   # one-off image via Gemini REST

npm run typecheck                         # tsc --noEmit over the tool source
```

`npm run generate -- <dna.json>` works too.

---

## Slash commands (in Claude Code)

| Command              | What it does                                                  |
| -------------------- | ------------------------------------------------------------- |
| `/new-mockup`        | Brief → DNA proposal → generation (the main flow)             |
| `/analyze <url>`     | Extract design language from a reference site                 |
| `/research <input>`  | Research design-press refs, save a note to `docs/research/`   |
| `/enrich <slug>`     | Fill placeholder images with on-DNA Nano Banana imagery       |
| `/image <prompt>`    | One-off image generation                                      |
| `/list-presets`      | Print the current preset library                              |

The CLI scripts work standalone — Claude Code is how the tool was designed to be operated, but isn't required.

---

## Optional: image generation

`/enrich` and `/image` call Google's Gemini 2.5 Flash Image (Nano Banana). Skip this section if you only want to generate code.

1. Create a key at <https://aistudio.google.com/apikey> (billing enabled, ~$0.04/image, no free tier).
2. Set `GEMINI_API_KEY` in your shell:
   ```powershell
   # PowerShell
   [System.Environment]::SetEnvironmentVariable('GEMINI_API_KEY', 'YOUR-KEY', 'User')
   ```
   Bash / zsh: `export GEMINI_API_KEY=...` in your profile.

The key is read at runtime by [`bin/gemini-image.ts`](./bin/gemini-image.ts); it's never persisted by this tool.

---

## How it works

A `DesignDNA` is JSON referencing presets by ID — typography, color, layout, easings, motion primitives — plus an `overrides` block for project-specific tweaks. The compiler turns it into a Tailwind v4 `@theme` block + type scale. Per-framework writers turn it into a complete starter project.

Saved DNAs live in [`library/`](./library/). The full preset library and schema live in [`presets.ts`](./presets.ts). New presets get added by hand from real reference research (`/research`) — the curated library *is* the aesthetic.

The full operating spec — conventions for brainstorming, analysis, and iteration — lives in [`CLAUDE.md`](./CLAUDE.md).

---

## Layout

```
presets.ts             Schema + curated preset library
compiler.ts            DNA → @theme block + type scale (framework-agnostic)
writers/               Per-framework writers
  nextjs.ts              Next.js 15 + React 19 (stable)
  astro.ts               Astro 5 (experimental)
bin/                   CLI scripts
library/               Saved DNAs (one .json per project)
generated/             Mockup outputs (regenerable)
docs/                  Plans + research notes
.claude/               Slash commands + skills
```

---

## What this is not

- Not a SaaS or hosted product
- Not a CMS or production design system — generated projects are visual proposals, not shippable code
- Not a no-code tool — comfort in a terminal + reading TypeScript expected

## License

Published for reference and discussion, not unrestricted use. Open an issue if you'd like to use it for something specific.
