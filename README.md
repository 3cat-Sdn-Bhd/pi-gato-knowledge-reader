# pi-gato-knowledge-reader

Pi extension. It applies the [gato-knowledge](https://github.com/3cat-Sdn-Bhd/gato-knowledge)
country filter over pi's native `AGENTS.md` and `.agents/skills/` discovery.

Pi loads `AGENTS.md` into the system prompt and lists every `.agents/skills/<name>/SKILL.md`
in an `<available_skills>` catalog. The model reads skill files with the built-in `read` tool.
This extension filters that content for the selected country (`MY` default, or `PH`):

- The system prompt, so `AGENTS.md` and every skill description are filtered. A skill whose
  description is written wholly as `my[...]` is absent from the catalog under `PH`.
- Every `read` of `AGENTS.md` or a file under `.agents/skills/`. Other files are untouched.

Directive syntax:

- inline: `Price my[RM 100]ph[PHP 1000]`
- block: a `:::ph` line, content, then a `:::` line
- Nested or overlapping directives are an error. The extension shows a red notification and the
  model receives only the error text, never the unfiltered content.

`/country [MY|PH]` selects the country. Without an argument it opens a picker. The choice is
saved in the session and shown in the footer as `country: MY`.

## Install

In the Gato project `.pi/settings.json`:

```json
{ "packages": ["git:github.com/turisanapo/pi-gato-knowledge-reader"] }
```

Start pi from the folder that contains `AGENTS.md` and `.agents/skills/`.

## Test

```bash
npm test
```
