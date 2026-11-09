#!/usr/bin/env node
// Validates the template registry against Mux Bot's template schema
// (SCHEMA.md): templates.json, then each template's PLAYBOOK.md and
// .darkmux/preview.json at its pinned commit, fetched from raw GitHub.
// No dependencies. Exits non-zero on any problem, naming the file, the
// key path and, for an unknown key, the closest valid one.
//
//   node scripts/validate.mjs                 the registry and every template
//   node scripts/validate.mjs --template DIR  one template checkout on disk

import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const SCHEMA = 2

const ANIMALS = ['octopus', 'fox', 'otter', 'beaver', 'owl', 'cat', 'bear', 'rabbit', 'panda', 'raccoon', 'penguin', 'frog', 'dog', 'squirrel']
const CREW = ['coder', 'reviewer', 'evalRunner', 'researcher']
const FIRST_RUN_PLACEHOLDERS = ['name', 'purpose', 'feel']

const LIST_KEYS = { schema: true, templates: true }
const ENTRY_KEYS = { id: true, repo: true, ref: true, title: true, icon: true, summary: false }
const PLAYBOOK_KEYS = { schema: true, title: true, icon: true, pitch: true, animal: false, colors: false, crew: false,
  page_file: false, pages: false, viewports: false }
// darkmux's preview recipe (its client_preview reader): an unknown key is
// refused there, and a template has no checkout for env_from_source.
const RECIPE_VERSION = '1.0'
const PREVIEW_KEYS = { schema_version: true, command: true, env: false, ready: false, install: false }

/** Edit distance, for "did you mean". */
function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[a.length][b.length]
}

export function closest(key, known) {
  return [...known].sort((x, y) => distance(key, x) - distance(key, y))[0]
}

class Report {
  constructor() { this.problems = [] }
  add(file, keyPath, problem) { this.problems.push(`${file}: ${keyPath}: ${problem}`) }
  get ok() { return this.problems.length === 0 }
}

function checkKeys(report, file, prefix, object, keys) {
  for (const key of Object.keys(object)) {
    if (!(key in keys)) report.add(file, `${prefix}${key}`, `unknown key (closest valid key: ${closest(key, Object.keys(keys))})`)
  }
  for (const [key, required] of Object.entries(keys)) {
    if (required && !(key in object)) report.add(file, `${prefix}${key}`, 'missing (required)')
  }
}

function checkSchema(report, file, keyPath, value) {
  if (value === undefined) return // reported as missing
  if (value !== SCHEMA) {
    const newer = Number.isInteger(value) && value > SCHEMA
    report.add(file, keyPath, newer
      ? `schema ${value} is newer than this validator's (${SCHEMA}); update the validator`
      : `must be ${SCHEMA}`)
  }
}

const isString = (v) => typeof v === 'string' && v.length > 0

// ─── templates.json ──────────────────────────────────────────────────────

export function validateList(report, text, file = 'templates.json') {
  let list
  try { list = JSON.parse(text) } catch (e) { report.add(file, '(file)', `not valid JSON: ${e.message}`); return [] }
  if (typeof list !== 'object' || list === null || Array.isArray(list)) { report.add(file, '(file)', 'must be a JSON object'); return [] }
  checkKeys(report, file, '', list, LIST_KEYS)
  checkSchema(report, file, 'schema', list.schema)
  if (!Array.isArray(list.templates)) { report.add(file, 'templates', 'must be an array'); return [] }
  const ids = new Set()
  list.templates.forEach((entry, i) => {
    const at = `templates[${i}].`
    if (typeof entry !== 'object' || entry === null) { report.add(file, `templates[${i}]`, 'must be an object'); return }
    checkKeys(report, file, at, entry, ENTRY_KEYS)
    if (entry.id !== undefined && !/^[a-z0-9][a-z0-9-]*$/.test(entry.id)) report.add(file, `${at}id`, 'lowercase letters, digits and dashes')
    if (ids.has(entry.id)) report.add(file, `${at}id`, `duplicate id ${entry.id}`)
    ids.add(entry.id)
    if (entry.repo !== undefined && !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(entry.repo)) report.add(file, `${at}repo`, 'must be owner/name')
    if (entry.ref !== undefined && !/^[0-9a-f]{40}$/.test(entry.ref)) report.add(file, `${at}ref`, 'must be a full 40-character commit SHA (pinned, never a branch or tag)')
    for (const key of ['title', 'icon']) if (key in entry && !isString(entry[key])) report.add(file, `${at}${key}`, 'must be a non-empty string')
    if ('summary' in entry && !isString(entry.summary)) report.add(file, `${at}summary`, 'must be a non-empty string')
  })
  return list.templates
}

// ─── PLAYBOOK.md ─────────────────────────────────────────────────────────

export function validatePlaybook(report, text, file = 'PLAYBOOK.md') {
  const header = {}
  const sections = []
  for (const line of text.split('\n')) {
    if (line.startsWith('## ')) { sections.push({ heading: line.slice(3).trim(), body: [] }); continue }
    if (sections.length) { sections.at(-1).body.push(line); continue }
    // A header key is a lowercase word, a colon, then the value; prose is ignored.
    const m = /^([a-z_]+):\s*(.*)$/.exec(line)
    if (m) {
      if (m[1] in header) report.add(file, m[1], 'given twice')
      header[m[1]] = m[2].trim()
    }
  }
  checkKeys(report, file, '', header, PLAYBOOK_KEYS)
  if ('schema' in header) checkSchema(report, file, 'schema', /^\d+$/.test(header.schema) ? Number(header.schema) : header.schema)
  for (const key of ['page_file', 'pages', 'viewports']) {
    if (key in header && !header[key]) report.add(file, key, 'empty')
  }
  if (header.viewports) {
    for (const v of header.viewports.split(',').map((x) => x.trim())) {
      if (!['desktop', 'tablet', 'phone'].includes(v)) report.add(file, 'viewports', `${v} is not a viewport (closest: ${closest(v, ['desktop', 'tablet', 'phone'])})`)
    }
  }
  if (header.pages) {
    for (const page of header.pages.split(',').map((x) => x.trim())) if (!page.startsWith('/')) report.add(file, 'pages', `${page} must start with /`)
  }
  for (const key of ['title', 'icon', 'pitch']) if (key in header && !header[key]) report.add(file, key, 'empty')
  if (header.animal && !ANIMALS.includes(header.animal)) report.add(file, 'animal', `not one of Mux Bot's animals (closest: ${closest(header.animal, ANIMALS)})`)
  if (header.colors) {
    header.colors.split(',').map((c) => c.trim()).forEach((c, i) => {
      if (!/^[0-9a-fA-F]{6}$/.test(c)) report.add(file, `colors[${i}]`, `${c} is not a 6-digit hex color`)
    })
  }
  if (header.crew) {
    for (const c of header.crew.split(',').map((x) => x.trim())) {
      if (!CREW.includes(c)) report.add(file, 'crew', `${c} is not a crew role (closest: ${closest(c, CREW)})`)
    }
  }
  const body = (s) => s.body.join('\n').trim()
  const questions = sections.find((s) => s.heading === 'Questions')
  if (!questions) report.add(file, '## Questions', 'missing (required)')
  else if (!questions.body.some((l) => /^\s*[-*] \S/.test(l))) report.add(file, '## Questions', 'needs at least one "- " question')
  const persona = sections.find((s) => s.heading === 'Persona')
  if (!persona) report.add(file, '## Persona', 'missing (required)')
  else if (!body(persona)) report.add(file, '## Persona', 'empty')
  const firstRun = sections.filter((s) => s.heading === 'First run')
  if (firstRun.length > 1) report.add(file, '## First run', 'given twice')
  for (const s of firstRun) {
    if (!body(s)) report.add(file, '## First run', 'empty (leave the section out instead)')
    for (const m of body(s).matchAll(/\{([^}]*)\}/g)) {
      if (!FIRST_RUN_PLACEHOLDERS.includes(m[1])) report.add(file, '## First run', `unknown placeholder {${m[1]}} (closest: {${closest(m[1], FIRST_RUN_PLACEHOLDERS)}})`)
    }
  }
  const skills = sections.filter((s) => s.heading.startsWith('Skill:'))
  if (skills.length === 0) report.add(file, '## Skill:', 'at least one skill section is required')
  for (const s of skills) {
    const name = s.heading.slice('Skill:'.length).trim()
    if (!name) report.add(file, `## ${s.heading}`, 'a skill needs a name')
    else if (!body(s)) report.add(file, `## Skill: ${name}`, 'empty')
  }
}

// ─── .darkmux/preview.json ───────────────────────────────────────────────

export function validatePreview(report, text, file = '.darkmux/preview.json') {
  let p
  try { p = JSON.parse(text) } catch (e) { report.add(file, '(file)', `not valid JSON: ${e.message}`); return }
  if (typeof p !== 'object' || p === null || Array.isArray(p)) { report.add(file, '(file)', 'must be a JSON object'); return }
  checkKeys(report, file, '', p, PREVIEW_KEYS)
  if ('schema_version' in p && p.schema_version !== RECIPE_VERSION) report.add(file, 'schema_version', `must be "${RECIPE_VERSION}" (darkmux's recipe format)`)
  if ('env' in p && p.env && typeof p.env === 'object' && p.env.HOST && p.env.HOST !== '0.0.0.0') {
    report.add(file, 'env.HOST', 'must be 0.0.0.0: darkmux runs previews in a container and publishes the ports on 127.0.0.1')
  }
  if ('command' in p && !isString(p.command)) report.add(file, 'command', 'must be a non-empty string')
  if ('env' in p) {
    if (typeof p.env !== 'object' || p.env === null || Array.isArray(p.env)) report.add(file, 'env', 'must be an object')
    else for (const [k, v] of Object.entries(p.env)) if (typeof v !== 'string') report.add(file, `env.${k}`, 'must be a string')
  }
  if ('ready' in p) {
    if (typeof p.ready !== 'object' || p.ready === null) report.add(file, 'ready', 'must be an object')
    else {
      checkKeys(report, file, 'ready.', p.ready, { http: false })
      if ('http' in p.ready && !(isString(p.ready.http) && p.ready.http.startsWith('/'))) report.add(file, 'ready.http', 'must be a path starting with /')
    }
  }
  if ('install' in p) {
    if (typeof p.install !== 'object' || p.install === null) report.add(file, 'install', 'must be an object')
    else {
      checkKeys(report, file, 'install.', p.install, { command: true, unless_exists: false })
      if ('command' in p.install && !isString(p.install.command)) report.add(file, 'install.command', 'must be a non-empty string')
    }
  }
  const plainPath = (v) => isString(v) && !v.startsWith('/') && !v.split('/').includes('..')
  if (p.install?.unless_exists !== undefined && !plainPath(p.install.unless_exists)) report.add(file, 'install.unless_exists', 'must be a plain relative path')
}

// ─── Running it ──────────────────────────────────────────────────────────

async function fetchText(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

async function validateTemplateAt(report, entry) {
  const base = `https://raw.githubusercontent.com/${entry.repo}/${entry.ref}`
  for (const [name, check] of [['PLAYBOOK.md', validatePlaybook], ['.darkmux/preview.json', validatePreview]]) {
    const file = `${entry.repo}@${entry.ref.slice(0, 7)}:${name}`
    try {
      check(report, await fetchText(`${base}/${name}`), file)
    } catch (e) {
      report.add(file, '(file)', `could not be fetched (${e.message})`)
    }
  }
}

async function main(argv) {
  const report = new Report()
  const at = argv.indexOf('--template')
  if (at >= 0) {
    const dir = argv[at + 1]
    validatePlaybook(report, await readFile(path.join(dir, 'PLAYBOOK.md'), 'utf8'))
    validatePreview(report, await readFile(path.join(dir, '.darkmux/preview.json'), 'utf8'))
  } else {
    const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..')
    const entries = validateList(report, await readFile(path.join(root, 'templates.json'), 'utf8'))
    for (const entry of entries) {
      if (entry?.repo && /^[0-9a-f]{40}$/.test(entry.ref ?? '')) await validateTemplateAt(report, entry)
    }
    if (report.ok) console.log(`templates.json: schema ${SCHEMA}, ${entries.length} template(s): ${entries.map((e) => `${e.id} (${e.repo}@${e.ref.slice(0, 7)})`).join(', ')}`)
  }
  if (!report.ok) {
    for (const p of report.problems) console.error(p)
    console.error(`${report.problems.length} problem(s)`)
    process.exit(1)
  }
  console.log('valid')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main(process.argv.slice(2))
}
