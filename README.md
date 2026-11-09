# Mux Bot templates

The list of templates [Mux Bot](https://github.com/kstrat2001/muxbot) offers when you start a project ("What do you want to get done?"). Mux Bot reads `templates.json` from this repo, keeps a copy, and falls back to the copy built into the app when it can't reach GitHub.

## The format

The three files involved (`templates.json` here, and each template's `PLAYBOOK.md` and `.darkmux/preview.json`) follow one versioned schema, documented in [SCHEMA.md](SCHEMA.md). Each entry here pins a template to a full commit SHA: Mux Bot uses a template only as of that commit, since setting one up runs its install on your Mac and its PLAYBOOK.md is read by the bots' models.

## Adding a template

1. Make a public repo with a `PLAYBOOK.md` at its root and a `.darkmux/preview.json`, both following [SCHEMA.md](SCHEMA.md). Check it locally: `node scripts/validate.mjs --template path/to/your/template`.
2. Open a pull request here that adds an entry to `templates.json`, pinned to the commit you tested.
3. The Validate check fetches your template at that commit and checks all three files. Say in the pull request what the template is for and how you tested it with Mux Bot.

To update a template, merge its change in the template repo, then open a pull request here that moves its `ref` to the new commit.

## License

MIT
