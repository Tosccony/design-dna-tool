Start a new design conversation. Use the design-mockup-builder skill for the workflow.

Read what the user has already shared in this session — they may have given you a brief, references, or constraints already. Then probe for the missing pieces with 1–2 focused questions, not a questionnaire.

Things you need to know before proposing DNAs:
- What's the business or project, and who's the audience?
- Reference sites or aesthetic direction (the most useful signal — push for this if not given)
- Any hard constraints (brand colors, owned fonts, accessibility requirements)

Don't generate anything yet. The point of this command is to start the conversation, not to skip it. Wait for the user to commit to a DNA option after you've proposed 2–3.

After the writer has finished generating, offer asset enrichment: "Generate AI imagery for this mockup? `hero` / `work` / `both` / `all` / `none`". On any non-`none` answer, hand off to the asset-enrichment skill with the user's scope choice — the skill takes it from there (asks generation mode `manual`/`auto`, composes prompts, dispatches if auto).

If the user has no references when asked, offer the research workflow — the design-mockup-builder skill handles this and will invoke `/research` automatically on a yes-answer. Check `docs/research/` for prior notes on the same vertical first; reuse beats fresh runs.
