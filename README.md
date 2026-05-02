# Design DNA Tool

A schema-driven mockup generator for high-end Next.js websites. Compose a "Design DNA" from a curated library of typography, color, layout, and motion presets, then run a writer that turns that DNA into a complete, runnable Next.js 15 + Tailwind v4 starter project.

The point of the schema is to fight cookie-cutter output. By forcing every project to commit to a curated typography/color/motion combination — rather than leaving the AI to free-style — generated mockups stay distinctive instead of collapsing into the bland "centered hero with three feature cards" pattern that AI-generated sites trend toward.

It's used as a designer's assistant inside Claude Code: brainstorm a brief, propose 2–3 DNAs, generate the chosen one, iterate. The orchestration spec lives in [`CLAUDE.md`](./CLAUDE.md) — that's the file Claude Code loads when you open this repo. This README covers what the tool does and how to run it.

## What this is not

- Not a SaaS or a hosted product
- Not a CMS or a production design system — generated projects are visual proposals, not shippable code
- Not a no-code tool — it expects you to be comfortable in a terminal and reading TypeScript

## Stack

- **Tool**: TypeScript run via `tsx` (no build step)
- **Generated mockups**: Next.js 15 (App Router) · React 19 · Tailwind v4 (CSS-first `@theme`, no `tailwind.config.js`) · Framer Motion · GSAP · Lenis · TypeScript

## Setup

```bash
npm install
```

Installs `tsx`, `typescript`, and `@types/node`. The tool itself has no runtime dependencies — it's a build-time generator.

### Optional: image generation

The `/image` and `/enrich` commands generate AI imagery via Google's Gemini 2.5 Flash Image (Nano Banana). Image generation is **optional** — the core mockup writer doesn't need it. Skip this section if you only want to generate code.

If you do want image generation:

1. Create an API key at <https://aistudio.google.com/apikey> with billing enabled (Nano Banana has no free tier, ~$0.04 per image).
2. Set `GEMINI_API_KEY` in your shell environment. PowerShell:
   ```powershell
   [System.Environment]::SetEnvironmentVariable('GEMINI_API_KEY', 'YOUR-KEY', 'User')
   ```
   Then restart your terminal. Bash/zsh: add `export GEMINI_API_KEY=...` to your shell profile.

The key is read from `process.env.GEMINI_API_KEY` at runtime by [`bin/gemini-image.ts`](./bin/gemini-image.ts). It's never written to disk by this tool.

## Commands

### `tsx bin/generate.ts <dna.json>`

Generates a Next.js project from a saved DNA. The output goes to `generated/<slug>/`, where `<slug>` defaults to the DNA filename without extension.

```bash
tsx bin/generate.ts library/example-acme-studio.json

# Equivalent via npm:
npm run generate -- library/example-acme-studio.json

# Flags:
tsx bin/generate.ts library/foo.json --overwrite          # blow away existing dir
tsx bin/generate.ts library/foo.json --out-dir /tmp/foo   # custom output path
tsx bin/generate.ts library/foo.json --name custom-slug   # custom slug
tsx bin/generate.ts -h                                    # full help
```

### `tsx bin/gemini-image.ts "<prompt>" <output-path>`

Direct image-generation client (REST). Used internally by the `/image` and `/enrich` Claude Code commands; you can call it directly too.

```bash
tsx bin/gemini-image.ts "a weathered fisherman in a yellow oilskin, 35mm film, golden hour, 4:3" out.png
```

Requires `GEMINI_API_KEY`. Exits non-zero with a stderr message on any failure.

### `npm run typecheck`

Runs `tsc --noEmit` over the tool source. Generated projects under `generated/` are excluded — each has its own `tsconfig.json`.

## Viewing a generated mockup

Each generated project is a standalone Next.js app:

```bash
cd generated/<slug>
npm install
npm run dev
```

Open <http://localhost:3000>. The generated project has its own `README.md` and `CLAUDE.md` describing its specific Design DNA and edit conventions.

## Claude Code commands

This repo defines slash commands and skills under `.claude/`. When opened in Claude Code, the following are available:

- `/new-mockup` — full brief-to-generation flow (the main entry point)
- `/analyze <url>` — extract design language from a reference site
- `/research <vertical>` — research design-press-recognized references for a vertical, save a note to `docs/research/`
- `/enrich <slug>` — fill placeholder images in a generated mockup with on-DNA imagery
- `/image <prompt>` — one-off image generation (mood boards, references, scratch)
- `/list-presets` — print the current preset library

You don't need Claude Code to use the tool — the CLI scripts work standalone — but the skills are how the tool was designed to be operated.

## Repo layout

```
.
├── CLAUDE.md             # Operating spec (loaded by Claude Code)
├── README.md             # This file
├── presets.ts            # Schema types + curated preset library
├── compiler.ts           # DesignDNA → Tailwind v4 @theme block + type scale
├── writer.ts             # DesignDNA → full Next.js project on disk
├── bin/
│   ├── generate.ts       # CLI: tsx bin/generate.ts <dna.json>
│   └── gemini-image.ts   # REST client for Nano Banana image gen
├── lib/                  # Helpers (URL analysis, DNA proposal — incremental)
├── library/              # Saved DNAs (one .json per project — committed, reusable)
├── generated/            # Mockup output (regenerable from saved DNAs)
│   └── _images/          # Scratch images from /image (gitignored)
├── docs/
│   ├── plans/            # Design + implementation plans
│   └── research/         # Accumulated /research notes
└── .claude/
    ├── commands/         # Slash command definitions
    └── skills/           # Skills loaded by Claude Code
```

## Design DNA, in one paragraph

A `DesignDNA` is a JSON object that references presets by ID — one typography preset, one color preset, one layout archetype, a set of easing roles, and a list of motion primitives — plus an `overrides` block for project-specific tweaks. The full schema and the seed preset library live in [`presets.ts`](./presets.ts). The compiler turns a DNA into a Tailwind v4 `@theme` block + type scale; the writer turns it into a complete Next.js project. New presets get added by hand based on real reference research (`/research`), not generated — the curated library is the aesthetic.

For example DNAs, see the JSON files in [`library/`](./library/).

## License

No license is granted at this time. The code is published for reference and discussion, not for unrestricted use. Open an issue if you'd like to use it for something specific.
