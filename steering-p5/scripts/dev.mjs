#!/usr/bin/env node
// dev.mjs — serveur statique local + mise à jour automatique du README.
// Usage : npm run dev   (puis ouvrir http://localhost:8080)
// Aucune dépendance npm.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT ?? 8080);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
};

const server = http.createServer((request, response) => {
  let urlPath = decodeURIComponent(new URL(request.url, 'http://x').pathname);
  if (urlPath.endsWith('/')) {
    urlPath += 'index.html';
  }
  const file = path.join(ROOT, path.normalize(urlPath));
  if (!file.startsWith(ROOT) || !fs.existsSync(file)
    || fs.statSync(file).isDirectory()) {
    response.writeHead(404);
    response.end('404');
    return;
  }
  response.writeHead(200, {
    'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  fs.createReadStream(file).pipe(response);
});

server.listen(PORT, () => {
  console.log(`[dev] http://localhost:${PORT}`);
});

spawn(process.execPath, [path.join(ROOT, 'scripts', 'update-readme.mjs'), '--watch'], {
  stdio: 'inherit',
});
