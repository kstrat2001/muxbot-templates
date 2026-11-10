# Mux Bot template schema

One versioned schema covers this repo's `templates.json` and each template's `PLAYBOOK.md`; each says which version it follows. This is **schema 3**. A template's `.darkmux/preview.json` is darkmux's own recipe, in darkmux's format (see below).

**Schema 3** (from schema 2): a question in PLAYBOOK.md can be a **choice** ("Pick a design."), answered by tapping one of its choices, and a template can have **preview pictures** (desktop and phone) for itself and for each choice. Both are optional. The pictures live in this repo under `previews/`, never in the template, since a template's files are copied into every new project. Nothing in templates.json changed, so a list may still say `"schema": 2`. Mux Bot still reads schema 1 and 2 templates.

**Schema 2** (from schema 1): `.darkmux/preview.json` holds only darkmux's recipe (`schema_version: "1.0"`), as darkmux refuses any other key, and the app's hints (`page_file`, `pages`, `viewports`, `conventions`) move into PLAYBOOK.md. Mux Bot still reads schema 1 templates.

## Versioning

- Adding an **optional** key keeps the schema number.
- Adding a **required** key, or renaming or removing any key, makes it the next number (2).
- Mux Bot refuses a file whose schema is newer than the one it supports, by name ("this template needs a newer Mux Bot"), and a file with no schema at all. It never guesses.

`scripts/validate.mjs` checks all three files, and runs on every pull request here.

## templates.json

```json
{
  "schema": 2,
  "templates": [
    {
      "id": "website",
      "repo": "kstrat2001/muxbot-template-site",
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
| `schema` | yes | `2` or `3` (the list itself is the same in both). |
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

schema: 2
title: Build a website
icon: globe
pitch: A one-page site you can grow.
crew: coder
page_file: src/pages/{page}.tsx
pages: /
viewports: desktop, phone

## Questions

- What's the site called?
- What is it for, in a sentence?

## Conventions

Vite + React. Each page is a component in src/pages/ ...

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
| `schema` | yes | `2` (`1` still reads, without the schema 2 keys). |
| `title` | yes | The use case's name. |
| `icon` | yes | An SF Symbol name. |
| `pitch` | yes | One sentence on what you get. |
| `crew` | no | Comma-separated crew roles: coder, reviewer, evalRunner, researcher. Coder when left out. |
| `page_file` | no | Where a page's source lives, `{page}` for the route's last segment (`/` is `home`). Schema 2. |
| `pages` | no | Comma-separated paths worth previewing. Schema 2. |
| `viewports` | no | Comma-separated widths worth checking: `desktop`, `tablet`, `phone`. Schema 2. |
| `previews` | no | `desktop, phone` (either or both): this repo has the template's own pictures, `previews/<id>/desktop.jpg` and `phone.jpg`, shown on its card. Schema 3. |

Retired: `animal` and `colors`. A bot's look is the user's choice: Mux Bot gives each new bot a fresh look they can shuffle, so a template doesn't set one. The validator refuses them; Mux Bot still reads a playbook that has them and ignores them.

| Section | Required | What it is |
|---|---|---|
| `## Questions` | yes | What Mux Bot asks first, as `- ` bullets: the name, what it's for, how it should feel. Since schema 3, a question can be a choice (below). |
| `## Conventions` | no | A sentence or two on the project's layout, passed to the crew with every run. Schema 2. |
| `## Persona` | yes | The new bot's persona; `{name}` becomes the bot's name. |
| `## First run` | no | The new bot's first dispatch, written from your answers: one instruction per line, with `{name}`, `{purpose}` (the second question's answer), `{feel}` (the third's) and, since schema 3, each choice question's `{key}` (the picked choice's id). Mux Bot fills them in and joins the lines into one task, leaving out any line whose answer was left blank; the bot posts it as a dispatch card that waits for Approve. Any other `{placeholder}` is refused. |
| `## Skill: <name>` | at least one | When it applies (with example asks in quotes; the first one is what the bot offers as an example), what to do, the files and conventions, and when it's done. Copied into the bot when it's made. |

An unknown header key is refused by name. Other `##` sections are ignored.

### Choice questions (schema 3)

A question with indented lines under it is a choice:

```markdown
## Questions

- What's the site called?
- What is it for, in a sentence?
- How should it feel? (For example: warm and friendly, calm and quiet.)
- Pick a design.
  key: design
  previews: desktop, phone
  - editorial: Editorial. Warm paper and a classic serif: a shop, a cafe.
  - modern: Modern. Clean and bright with a vivid blue: an app, a product.
```

| Line | Required | What it is |
|---|---|---|
| `key: <key>` | yes | Lowercase letters, digits and dashes; not `name`, `purpose` or `feel`. The pick is `{key}` in `## First run`. |
| `previews: desktop, phone` | no | Each choice has these pictures here, `previews/<template id>/<choice id>-desktop.jpg` (and `-phone.jpg`). Without it, the choices show as chips. |
| `- <id>: <Title>. <What it fits.>` | two or more | One choice: a unique id (lowercase letters, digits and dashes), its title up to the first `. `, then a sentence on what it fits. |

The first choice is picked until you pick another. The word questions keep their order (the name, what it's for, how it should feel) whatever choices sit among them.

### Preview pictures

JPEG, at most 400 KB each, in `previews/<template id>/`: a desktop picture at 1280 × 800 and a phone picture at 390 × 844 (taken at 2×). The Validate check fails a pull request where a playbook asks for a picture that isn't here.

## .darkmux/preview.json

darkmux's preview recipe, exactly as darkmux reads it: darkmux runs it, refuses any key it doesn't know, and for a project made from a template reads it from the project's first commit. A template has no checkout to copy files from, so it has no `env_from_source`. darkmux runs previews in a container and publishes the ports on 127.0.0.1, so the dev server listens on `0.0.0.0`.

```json
{
  "schema_version": "1.0",
  "command": "npm run dev",
  "env": { "PORT": "{port}", "HOST": "0.0.0.0", "VITE_HMR_PORT": "{hmrPort}" },
  "ready": { "http": "/" },
  "install": { "command": "npm ci --no-audit --no-fund", "unless_exists": "node_modules" }
}
```

| Key | Required | What it is |
|---|---|---|
| `schema_version` | yes | `"1.0"`, darkmux's recipe format. |
| `command` | yes | Starts the dev server. |
| `env` | no | Its environment; `{port}` and `{hmrPort}` become the free ports darkmux picks (darkmux fills them in only here, not in `command`). |
| `ready` | no | `http`: the path that answers once it's up. |
| `install` | no | `command`, run first when `unless_exists` (a plain relative path) is missing. |

A schema 1 template's preview.json was `"schema": 1` with the app's hints in it; darkmux no longer reads that file.
