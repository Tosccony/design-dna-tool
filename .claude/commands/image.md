Generate a single standalone image via Nano Banana (Gemini 2.5 Flash Image) from a free-form prompt. The model takes the user's raw idea, proposes 2–3 enriched art-direction takes with suggested aspect ratios, and dispatches the chosen one through `bin/gemini-image.ts`.

This is for **one-off images** — sketches, mood boards, references, anything not tied to a mockup. For mockup imagery (heroes, work tiles, etc.) use `/enrich <slug>` instead, which is DNA-aware.

## Usage

- `/image <prompt>` — propose 2–3 directions, wait for the user's pick.
- `/image <prompt> --ratio <ratio>` — pre-pick aspect ratio (16:9, 4:3, 1:1, 3:2, 9:16, 2:3, 21:9). Skip the ratio recommendation step.
- `/image <prompt> --out <path>` — override save location. Default is `generated/_images/<slug>-<YYYYMMDD-HHMMSS>.png`.
- `/image <prompt> --yolo` — skip the proposal step entirely; pick the best enrichment internally and dispatch immediately. Useful when the user is iterating fast.

Flags can combine. The free-form prompt is everything before the first flag.

## Prerequisites

- `GEMINI_API_KEY` env var set with billing enabled on the AI Studio account. Nano Banana has no free tier (~$0.04/image).
- `bin/gemini-image.ts` exists in this repo. If it doesn't, halt — the script is what makes auto generation possible.

If `GEMINI_API_KEY` is missing, halt with: "GEMINI_API_KEY not set. Generate a key at https://aistudio.google.com/apikey with billing enabled, then set persistently via PowerShell: `[System.Environment]::SetEnvironmentVariable('GEMINI_API_KEY', 'YOUR-KEY', 'User')` and restart the terminal."

## The flow

### 1. Read the prompt

If the prompt is one or two words ("a sunset", "shoes"), ask **one** targeted clarifier — typically: subject specificity, intended use, or hard constraints. Don't bundle a wall of questions; one beat at most. If the prompt is already specific, skip this step.

### 2. Propose 2–3 directions

Each direction must differ **meaningfully** — different lighting, different angle, different medium, or different mood. Three takes on the same shot with slightly different colors is not three directions; it's one direction with rounding error.

For each direction, output:

- **Name** — a short label that captures the aesthetic (e.g., "Editorial Documentary", "Studio Still Life", "Cinematic Wide", "Risograph Print", "Polaroid Snapshot").
- **Suggested aspect ratio** with one-line reason (don't default to 16:9 for everything — see cheat-sheet below).
- **Enriched prompt** — full prose, structured per the recipe below.
- **Trade-off** — one line on what this take emphasizes vs. sacrifices ("warm and intimate but loses scale" / "graphic and bold but reads less photographic").

Format the directions as a clean numbered list so the user can reply "1" / "2" / "3".

### 3. Wait for the pick

The user replies with a number, asks for a refinement ("2 but at golden hour instead of overcast"), or asks for a fresh round of directions. Honor refinements by editing the chosen prompt's relevant clause; don't rewrite from scratch unless they ask.

When `--yolo` is set, skip steps 2 and 3 — pick the strongest single direction internally, show the enriched prompt as a one-line confirmation, and proceed.

### 4. Dispatch

Run from the repo root:

```
tsx bin/gemini-image.ts "<final enriched prompt>" "<output-path>"
```

**Output path defaults**: `generated/_images/<slug>-<YYYYMMDD-HHMMSS>.png` where `<slug>` is the first 3–4 alphanumeric words of the user's original prompt, kebab-cased and lowercased. Example: prompt "fisherman on a dock at dawn" → `generated/_images/fisherman-on-a-20260502-143055.png`. The directory is created automatically by the script.

**Quote handling**: the prompt may contain double quotes, backticks, or `$`. In PowerShell, use a here-string to pass the prompt safely:

```
tsx bin/gemini-image.ts @'
<prompt with any quotes>
'@ "<output-path>"
```

Or escape inline: backticks for `$` and `` ` ``, doubled `""` for embedded quotes.

### 5. Report

After dispatch, print:
- Absolute path of the saved image
- File size
- The exact prompt that was sent (so the user can copy it for tweaks)

Then offer one of: "regenerate with a tweak?", "try direction 2?", or "done." Don't auto-loop — wait for user direction.

## Prompt-enrichment recipe

Build the enriched prompt by concatenating, in this order:

1. **Subject** — concrete noun phrase. "A weathered fisherman in a yellow oilskin" beats "a man." "A handful of dried lavender on raw linen" beats "some flowers." Ground the image in something specific.
2. **Composition** — framing (close-up / medium / wide), angle (eye-level / low-angle / top-down / three-quarter), placement (centered / off-center / rule-of-thirds left / negative space on right).
3. **Lighting** — source (window light from camera-left / harsh midday sun / single tungsten bulb / overcast diffused), quality (soft / hard / dappled), time of day if it matters (golden hour / blue hour / pre-dawn).
4. **Medium / lens** — photographic (shot on 35mm film / medium-format / Polaroid SX-70 / phone snapshot / wet plate) or non-photographic (oil painting / pen and ink / risograph two-color / charcoal sketch / gouache illustration). This is the single biggest lever for differentiating directions.
5. **Mood** — one or two atmosphere words (quiet, contemplative / chaotic, kinetic / nostalgic, faded / clinical, sterile).
6. **Negative cues, baked into every prompt**:
   - "No text overlays."
   - "No recognizable brand names, logos, or trademarked products."
   - "No watermarks."
7. **Aspect ratio clause** at the very end: e.g., "16:9 landscape aspect ratio." Nano Banana's REST API has no ratio parameter, so the prompt is the only knob. Be explicit.

## Aspect ratio cheat-sheet

Pick the ratio that fits the composition, not the other way around.

- **16:9** — wide hero, landscape scene, cinematic establishing shot. Subject must spread horizontally or sit in environment.
- **9:16** — phone wallpaper, vertical poster, IG story. Subject must be vertically composed (a standing figure, a tall object, a top-to-bottom column of light).
- **4:3** — classic photo, portfolio thumbnail, web grid. Honest middle-ground; reads like a "real photo."
- **1:1** — social square, product still, centered single subject. Good when the subject is the entire idea.
- **3:2** — DSLR-native, editorial photo. The "looks like a published magazine shot" choice.
- **2:3** — magazine cover, portrait orientation. Good for full-body or shoulder-up human subjects.
- **21:9** — ultrawide cinematic banner, panoramic. Use sparingly; the subject must read at extreme width.

## Don't

- Don't dispatch before showing the enriched prompt (unless `--yolo`). The enrichment is the value.
- Don't propose three near-identical directions. Different lighting, angle, OR medium between options — preferably more than one of those.
- Don't bake brand names or trademarked subjects into prompts ("an Apple Store interior", "Nike Air Force 1s"). The negative cues are not optional — they protect against generating something the user can't actually use.
- Don't default to 16:9. Match the ratio to the composition.
- Don't auto-retry on failure. Surface the error and ask. Quota/billing errors mean the API key needs attention, not another attempt.
