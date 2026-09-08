# pi-gato-knowledge-reader

Pi extension. It reads a
[gato-knowledge](https://github.com/turisanapo/gato-knowledge) style folder:

- `knowledge/Skill.md` is appended to the system prompt on every turn, like `AGENTS.md`.
- `read_skill` tool: `read_skill({ skill: "stock-sharing-queries" })` returns `knowledge/stock-sharing-queries.md`.
  Unknown names return the list of available topics.
- Country filter: content is filtered for the selected country (`MY` default, or `PH`) before it reaches the model.
  - inline: `Price my[RM 100]ph[PHP 1000]`
  - block: a `:::ph` line, content, then a `:::` line
  - Nested or overlapping directives are an error.
- `/country [MY|PH]` selects the country. Without an argument it opens a picker. The choice is
  saved in the session and shown in the footer as `country: MY`.

## Install

In the Gato project `.pi/settings.json`:

```json
{ "packages": ["git:github.com/turisanapo/pi-gato-knowledge-reader"] }
```

Start pi from the folder that contains `./knowledge`, for example `gato-prod/v1`.

## Configuration

| Variable              | Default     | Effect                                  |
| --------------------- | ----------- | --------------------------------------- |
| `GATO_KNOWLEDGE_DIR`  | `knowledge` | Knowledge folder, relative to the cwd   |

## Test

```bash
npm test
```
