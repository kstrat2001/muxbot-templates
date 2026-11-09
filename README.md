# Mux Bot templates

The list of templates [Mux Bot](https://github.com/kstrat2001/muxbot) offers when you start a project ("What do you want to get done?"). Mux Bot reads `templates.json` from this repo, keeps a copy, and falls back to the copy built into the app when it can't reach GitHub.

## The entry format

`templates.json` holds a `version` (1) and a list of `templates`, each with:

| Key | What it is |
|---|---|
| `id` | A short, stable name for the use case, like `website`. A bot remembers it. |
| `repo` | The template's GitHub repo, `owner/name`. It must be public. |
| `ref` | The tag or commit Mux Bot uses. Always pinned, never a branch. |
| `title` | What the picker shows, like "Build a website". |
| `icon` | An SF Symbol name, like `globe`. |

## What a template carries

- `PLAYBOOK.md` at its root: the recipe Mux Bot reads to make a bot for the project. A header of `key: value` lines (title, icon, pitch, animal, colors, crew), then `## Questions` (what Mux Bot asks first), `## Persona`, and one `## Skill: <name>` section per skill (when to use it, what to do, files and conventions, done-when).
- `.darkmux/preview.json`: how darkmux runs the live preview.

## Pinned, on purpose

Mux Bot uses a template only at the `ref` listed here. Setting it up runs the template's install on your Mac, and its PLAYBOOK.md is read by the bots' models, so a template changes only when this list moves to a new tag that has been reviewed and tested.

## Proposing a template

Open a pull request that adds an entry, pointing at a public repo with a `PLAYBOOK.md` and a `.darkmux/preview.json`, pinned to a tag. Say what it's for and how you tested it with Mux Bot.

## License

MIT
