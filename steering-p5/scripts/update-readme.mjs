#!/usr/bin/env node
// update-readme.mjs — régénère les sections automatiques de README.md et la
// page d'accueil index.html à partir du contenu réel du projet.
//
// Usage :
//   node scripts/update-readme.mjs           mise à jour unique
//   node scripts/update-readme.mjs --watch   mise à jour à chaque modification
//   node scripts/update-readme.mjs --check   code 1 si README/index périmés (CI)
//
// Seul le texte situé entre les marqueurs <!-- AUTO:NOM:START --> et
// <!-- AUTO:NOM:END --> est réécrit : le reste du README est manuel.
// Aucune dépendance npm.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const README = path.join(ROOT, 'README.md');
const INDEX = path.join(ROOT, 'index.html');
const IGNORED = new Set(['.git', 'node_modules', 'lib', '.DS_Store']);

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

function listFiles(dir, filter = () => true) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !IGNORED.has(entry.name))
    .flatMap((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? listFiles(full, filter) : [full];
    })
    .filter(filter)
    .sort();
}

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

function classesIn(file) {
  const source = read(file);
  const regex = /^class\s+(\w+)(?:\s+extends\s+(\w+))?/gm;
  return [...source.matchAll(regex)].map((m) => ({
    name: m[1],
    parent: m[2] ?? '—',
    file: rel(file),
  }));
}

function apps() {
  const appsDir = path.join(ROOT, 'apps');
  if (!fs.existsSync(appsDir)) {
    return [];
  }
  return fs.readdirSync(appsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((name) => {
      const dir = path.join(appsDir, name);
      const html = read(path.join(dir, 'index.html'));
      const title = (html.match(/<title>([^<]*)<\/title>/i) ?? [])[1] ?? name;
      const description = (html.match(
        /<meta\s+name="description"\s+content="([^"]*)"/i,
      ) ?? [])[1] ?? '';
      const classes = listFiles(dir, (f) => f.endsWith('.js'))
        .flatMap(classesIn);
      return { name, title, description, classes };
    });
}

function section(content) {
  return `\n${content.trim()}\n`;
}

function appsSection() {
  const rows = apps().map((app) => {
    const classes = app.classes
      .map((c) => `\`${c.name}\`${c.parent !== '—' ? ` ← ${c.parent}` : ''}`)
      .join(', ') || '—';
    return `| [${app.title}](apps/${app.name}/index.html) | ${app.description} | ${classes} |`;
  });
  if (rows.length === 0) {
    return section('_Aucune application pour l\'instant._');
  }
  return section([
    '| Application | Description | Classes |',
    '|---|---|---|',
    ...rows,
  ].join('\n'));
}

function sharedSection() {
  const classes = listFiles(path.join(ROOT, 'shared'), (f) => f.endsWith('.js'))
    .flatMap(classesIn);
  return section([
    '| Classe | Hérite de | Fichier |',
    '|---|---|---|',
    ...classes.map((c) => `| \`${c.name}\` | ${c.parent} | \`${c.file}\` |`),
  ].join('\n'));
}

function behaviorsSection() {
  const source = read(path.join(ROOT, 'shared', 'Vehicle.js'));
  const lines = [...source.matchAll(/@behavior\s+(.+?)\s*$/gm)]
    .map((m) => `- ${m[1].replace(/\s*\*\/\s*$/, '')}`);
  return section(lines.join('\n') || '_Aucun comportement documenté._');
}

function tasksSection() {
  const spec = read(path.join(ROOT, '1-Specification.md'));
  const blocks = spec.split(/^## /m).slice(1)
    .filter((block) => /^Tâche/i.test(block));
  const rows = blocks.map((block) => {
    const title = block.split('\n')[0].trim();
    const status = (block.match(/\*\*Statut\s*:\*\*\s*(.+)/) ?? [])[1] ?? '—';
    const app = (block.match(/\*\*Application\s*:\*\*\s*(.+)/) ?? [])[1] ?? '—';
    return `| ${title} | ${status.trim()} | ${app.trim()} |`;
  });
  return section([
    '| Tâche | Statut | Application |',
    '|---|---|---|',
    ...rows,
  ].join('\n'));
}

function treeSection() {
  const files = listFiles(ROOT, (f) => !f.endsWith('.zip')).map(rel);
  return section(['```text', ...files, '```'].join('\n'));
}

function handoffSection() {
  const handoff = read(path.join(ROOT, 'HANDOFF.md'));
  const journal = handoff.split(/^## Journal des opérations/m)[1] ?? '';
  const last = (journal.match(/^### (.+)$/m) ?? [])[1];
  const next = (handoff.split(/^## Prochaines étapes/m)[1] ?? '')
    .split(/^## /m)[0].trim();
  return section([
    `**Dernière opération :** ${last ?? '—'}`,
    '',
    '**Prochaines étapes :**',
    '',
    next || '—',
    '',
    'Détails : [HANDOFF.md](HANDOFF.md).',
  ].join('\n'));
}

function replaceSection(text, name, content) {
  const start = `<!-- AUTO:${name}:START -->`;
  const end = `<!-- AUTO:${name}:END -->`;
  const regex = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!regex.test(text)) {
    return `${text.trimEnd()}\n\n${start}${content}${end}\n`;
  }
  return text.replace(regex, `${start}${content}${end}`);
}

function buildReadme() {
  let text = read(README);
  text = replaceSection(text, 'STATUS', handoffSection());
  text = replaceSection(text, 'TASKS', tasksSection());
  text = replaceSection(text, 'APPS', appsSection());
  text = replaceSection(text, 'SHARED', sharedSection());
  text = replaceSection(text, 'BEHAVIORS', behaviorsSection());
  text = replaceSection(text, 'TREE', treeSection());
  return text;
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildIndex() {
  const cards = apps().map((app) => `    <a class="card" href="apps/${app.name}/index.html">
      <h2>${escapeHtml(app.title)}</h2>
      <p>${escapeHtml(app.description)}</p>
    </a>`).join('\n');
  return `<!DOCTYPE html>
<!-- Fichier GÉNÉRÉ par scripts/update-readme.mjs : ne pas modifier à la main. -->
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Steering behaviors — p5.js</title>
  <style>
    body { margin: 0; padding: 40px; background: #0b0d14; color: #f2f4f8;
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
    h1 { font-weight: 600; margin: 0 0 6px; }
    .sub { opacity: 0.7; margin: 0 0 28px; }
    .grid { display: grid; gap: 16px;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
    .card { display: block; padding: 18px 20px; border-radius: 10px;
      background: rgba(255, 255, 255, 0.05); color: inherit;
      text-decoration: none; border: 1px solid rgba(255, 255, 255, 0.1); }
    .card:hover { border-color: #7fb0ff; }
    .card h2 { font-size: 17px; margin: 0 0 8px; }
    .card p { font-size: 14px; margin: 0; opacity: 0.75; line-height: 1.45; }
  </style>
</head>
<body>
  <h1>Steering behaviors — p5.js</h1>
  <p class="sub">D'après Craig Reynolds, « Steering Behaviors For Autonomous Characters » (GDC 1999).</p>
  <div class="grid">
${cards}
  </div>
</body>
</html>
`;
}

function run(mode) {
  const readme = buildReadme();
  const index = buildIndex();
  const stale = readme !== read(README) || index !== read(INDEX);
  if (mode === 'check') {
    if (stale === true) {
      console.error('README.md ou index.html est périmé : lancez npm run readme.');
      process.exit(1);
    }
    console.log('README.md et index.html sont à jour.');
    return;
  }
  if (stale === true) {
    fs.writeFileSync(README, readme);
    fs.writeFileSync(INDEX, index);
    console.log(`[readme] mis à jour (${new Date().toLocaleTimeString()})`);
  }
}

const args = process.argv.slice(2);
if (args.includes('--check')) {
  run('check');
} else {
  run('write');
  if (args.includes('--watch')) {
    // Scrutation chaque seconde : plus fiable que fs.watch sur toutes les
    // plateformes (éditeurs qui remplacent les fichiers, WSL, réseaux…).
    // run() n'écrit que si le contenu généré a réellement changé.
    console.log('[readme] surveillance active (Ctrl+C pour arrêter)…');
    setInterval(() => run('write'), 1000);
  }
}
