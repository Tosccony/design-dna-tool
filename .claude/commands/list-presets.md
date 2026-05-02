Read `presets.ts` and present a compact digest of all current presets, organized by category.

For each category, show one entry per preset:

- **Typography** — ID · name · display family + body family · brief character note
- **Color** — ID · name · mode (light/dark/duotone) · brief character note
- **Easing** — ID · name · personality · the cubic-bezier values
- **Motion primitive** — ID · name · library (gsap / framer-motion / css) · one-line description
- **Layout** — ID · name · hero pattern · density · brief character note

End with totals per category.

Use a clean, scannable format — markdown tables or compact bullet lists. The goal is to give the user a quick overview before composing a DNA, or to spot gaps where the library could be extended.

If the user has been discussing a specific brief, also call out which presets seem like the strongest matches for it at the end.
