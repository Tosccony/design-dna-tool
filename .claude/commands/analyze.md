Analyze the reference provided: $ARGUMENTS

Steps:
1. If it's a URL, use `web_fetch` to load it. If it's a screenshot already in the conversation, look at the image directly. If it's a description without a URL, work from the description.
2. Run the analysis through the four lenses from the design-mockup-builder skill:
   - **Typography** — family characteristics, weight contrast, scale ratio, tracking
   - **Color** — mode, the logic (not hexes), where the accent earns its place
   - **Layout** — hero pattern, asymmetry, density, vertical rhythm
   - **Motion** — easing personalities, where motion lives, density
3. Report 3–4 bullets per category, brief and concrete.
4. Bridge to the preset library: read `presets.ts` and call out which existing presets are closest matches per category, or flag gaps where nothing in the library fits well.

Ethics reminder: extract patterns, not assets. Don't propose copying the site verbatim — we're learning from how it's constructed, not cloning it.

If the user hasn't explicitly asked for a mockup yet, stop after the bridge. Don't compose DNAs unless they ask.
