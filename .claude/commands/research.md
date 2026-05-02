Research design-press-recognized reference websites for a vertical or brief. Use the website-research skill for the workflow.

Usage:
- `/research <free-form input>` — full workflow (parse input, discover candidates, verify URLs, analyze each, save note)
- `/research` (no args) — ask the user what they want researched

Examples:

```
/research law firm specializing in IP, leans modern + premium
/research indie band tour merch, printmaker / zine vibe
/research SaaS landing pages for developer tools
```

The skill saves the resulting note to `docs/research/<slug>-<YYYY-MM-DD>.md` and surfaces a chat summary. If the user already has prior research on the same vertical, the skill offers to reuse, refresh, or augment. If the input is too broad (single generic noun like "SaaS"), the skill asks for narrowing before running.
