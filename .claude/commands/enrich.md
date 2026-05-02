Enrich a generated mockup with AI-generated imagery. Use the asset-enrichment skill for the workflow.

Usage:
- `/enrich <slug>` — interactive (asks scope and generation mode)
- `/enrich <slug> <scope>` — pre-fills scope (`hero`, `work`, `both`, `all`, `none`)
- `/enrich <slug> <scope> <mode>` — pre-fills both (`manual`, `auto`)
- `/enrich <slug> <scope> <mode> keep` — additionally skip targets where the file already exists (>100 KB)

Examples:

```
/enrich example-acme-studio                       # interactive
/enrich example-acme-studio hero                  # scope only
/enrich example-acme-studio hero auto             # scope + generation mode
/enrich example-acme-studio hero auto keep        # + skip-existing
```

The slug is the directory name under `generated/`. If the user invoked without a slug, ask which mockup to enrich (list `generated/` directories if helpful).
