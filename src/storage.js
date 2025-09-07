import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');
export const resultsFile = path.join(dataDir, 'results.json');

async function ensure() {
  await fs.mkdir(dataDir, { recursive: true });
  try { await fs.access(resultsFile); }
  catch { await fs.writeFile(resultsFile, '[]', 'utf-8'); }
}

export async function loadResults() {
  await ensure();
  const raw = await fs.readFile(resultsFile, 'utf-8');
  return JSON.parse(raw);
}

export async function saveResult(run) {
  await ensure();
  const all = await loadResults();
  all.unshift(run);
  await fs.writeFile(resultsFile, JSON.stringify(all, null, 2), 'utf-8');
}
