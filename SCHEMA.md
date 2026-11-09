# Mux Bot template schema

One versioned schema covers the three files a template takes part in: this repo's `templates.json`, and each template's `PLAYBOOK.md` and `.darkmux/preview.json`. Each file says which version it follows. This is **schema 1**.

## Versioning

- Adding an **optional** key keeps the schema number.
- Adding a **required** key, or renaming or removing any key, makes it the next number (2).
- Mux Bot refuses a file whose schema is newer than the one it supports, by name ("this template needs a newer Mux Bot"), and a file with no schema at all. It never guesses.

`scripts/validate.mjs` checks all three files, and runs on every pull request here.

## templates.json

```json
{
  "schema": 1,
  "templates": [
    {
      "id": "website",
      "repo": "kstrat2001/muxbot-template-vite-react",
      "ref": "<40-character commit SHA>",
      "title": "Build a website",
      "icon": "globe",
      "summary": "A one-page site you can grow, with a live preview."
    }
  ]
}
```

| Key | Required | What it is |
|---|---|---|
| `schema` | yes | `1`. |
| `templates` | yes | The list. |
| `id` | yes | Stable, lowercase letters, digits and dashes. A bot made from the template remembers it. |
| `repo` | yes | `owner/name` on GitHub. Public. |
| `ref` | yes | A full commit SHA. Never a branch or a tag: Mux Bot uses the template only as of this commit. |
| `title` | yes | What the picker shows. |
| `icon` | yes | An SF Symbol name. |
| `summary` | no | One line under the title. |

An unknown key is refused by name.

## PLAYBOOK.md

At the template's root, readable on GitHub. A header of `key: value` lines (a lowercase key, a colon, the value) before the first `##` section, then sections. Other prose in the header is ignored.

```markdown
# Playbook: a website

schema: 1
title: Build a website
icon: globe
pitch: A one-page site you can grow.
animal: fox
colors: 0e9f8e, ffffff
crew: coder

## Questions

- What's the site called?
- What is it for, in a sentence?

## Persona

You look after {name}, a website built with Vite and React. ...

## First run

Make {name} the site for {purpose}.
Make it feel {feel}: set the colors and fonts to match.

## Skill: Add a page

When: someone wants a new page. "Add an About page", "I need a pricing page".

What to do: ...

Files and conventions: ...

Done when: ...
```

| Header key | Required | What it is |
|---|---|---|
| `schema` | yes | `1`. |
| `title` | yes | The use case's name. |
| `icon` | yes | An SF Symbol name. |
| `pitch` | yes | One sentence on what you get. |
| `animal` | no | The new bot's animal: octopus, fox, otter, beaver, owl, cat, bear, rabbit, panda, raccoon, penguin, frog, dog or squirrel. |
| `colors` | no | The bot's main color, then its eye color, as 6-digit hex. |
| `crew` | no | Comma-separated crew roles: coder, reviewer, evalRunner, researcher. Coder when left out. |

| Section | Required | What it is |
|---|---|---|
| `## Questions` | yes | What Mux Bot asks first, as `- ` bullets: the name, what it's for, how it should feel. |
| `## Persona` | yes | The new bot's persona; `{name}` becomes the bot's name. |
| `## First run` | no | The new bot's first dispatch, written from your answers: one instruction per line, with `{name}`, `{purpose}` (the second question's answer) and `{feel}` (the third's). Mux Bot fills them in and joins the lines into one task, leaving out any line whose answer was left blank; the bot posts it as a dispatch card that waits for Approve. Any other `{placeholder}` is refused. |
| `## Skill: <name>` | at least one | When it applies (with example asks in quotes; the first one is what the bot offers as an example), what to do, the files and conventions, and when it's done. Copied into the bot when it's made. |

An unknown header key is refused by name. Other `##` sections are ignored.

## .darkmux/preview.json

How darkmux runs the live preview from the bot's work copy.

```json
{
  "schema": 1,
  "command": "npm run dev",
  "env": { "PORT": "{port}", "HOST": "127.0.0.1", "VITE_HMR_PORT": "{hmrPort}" },
  "ready": { "http": "/" },
  "install": { "command": "npm ci --no-audit --no-fund", "unless_exists": "node_modules" },
  "env_from_source": [".env"],
  "conventions": "Each page is a component in src/pages/ ...",
  "page_file": "src/pages/{page}.tsx",
  "pages": ["/"],
  "viewports": ["desktop", "phone"]
}
```

| Key | Required | What it is |
|---|---|---|
| `schema` | yes | `1`. |
| `command` | yes | Starts the dev server. |
| `env` | no | Its environment; `{port}` and `{hmrPort}` become the free ports darkmux picks. |
| `ready` | no | `http`: the path that answers once it's up (default `/`). |
| `install` | no | `command`, run first when `unless_exists` (a plain relative path) is missing. |
| `env_from_source` | no | Untracked files (like `.env`) copied from the checkout a worktree was made from, never overwriting. Plain relative paths. |
| `conventions` | no | A sentence or two on the layout, passed to the crew with every run. |
| `page_file` | no | Where a page's source lives, `{page}` for the route's last segment (`/` is `home`). |
| `pages` | no | Paths worth previewing. |
| `viewports` | no | Widths worth checking: `desktop`, `tablet`, `phone`. |

An unknown key is refused by name, as darkmux refuses unknown keys in its own files.
