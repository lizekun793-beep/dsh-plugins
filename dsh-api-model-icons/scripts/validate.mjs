import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

const read = (path) => {
  try {
    return readFileSync(join(root, path), 'utf8');
  } catch (error) {
    errors.push(`${path}: ${error.message}`);
    return '';
  }
};

const parse = (path, text) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    errors.push(`${path}: ${error.message}`);
    return undefined;
  }
};

const pkg = parse('package.json', read('package.json'));
const en = parse('locale/en.json', read('locale/en.json'));
const zh = parse('locale/zh.json', read('locale/zh.json'));
const client = read('client.js');
const patch = read('cordis.patch.yml');

if (pkg) {
  if (pkg.name !== 'dsh-api-model-icons') errors.push('package.json: name must be dsh-api-model-icons');
  if (!pkg.dsh?.bundle?.patch) errors.push('package.json: dsh.bundle.patch is required');
  if (pkg.dsh?.client?.platform !== 'web') errors.push('package.json: dsh.client.platform must be web');
  if (!Array.isArray(pkg.dsh?.client?.inject) || !pkg.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-model-selection')) {
    errors.push('package.json: dsh.client.inject must order the model-selection package');
  }
  for (const key of ['.', './client', './locale/*.json', './icon']) {
    if (!pkg.exports?.[key]) errors.push(`package.json: missing exports["${key}"]`);
  }
  for (const entry of ['index.js', 'client.js', 'cordis.patch.yml', 'locale/*.json', 'icon.svg']) {
    if (!pkg.files?.includes(entry)) errors.push(`package.json: files must include ${entry}`);
  }
}

if (en && !en.meta?.title) errors.push('locale/en.json: meta.title is required');
if (zh && !zh.meta?.title) errors.push('locale/zh.json: meta.title is required');

if (pkg && !client.includes(`id: '${pkg.name}'`)) {
  errors.push('client.js: module id must match package.json name');
}
if (pkg && !patch.includes(`name: '${pkg.name}'`)) {
  errors.push('cordis.patch.yml: bundle name must match package.json name');
}
if (!client.includes('conversation.input.model.label')) {
  errors.push('client.js: must register into conversation.input.model.label');
}
if (client.includes("require('@deepseek-ai/dsh-client-ui-primitives')")) {
  errors.push('client.js: must not load Harness Client packages');
}
if (!/priority:\s*-1/.test(client)) {
  errors.push('client.js: label registration must use priority -1');
}

for (const file of [
  'icon.svg',
  'assets/banner.svg',
  'assets/deepseek.svg',
  'assets/qwen.svg',
  'assets/doubao.svg',
  'LICENSE',
  'NOTICE.md',
  'THIRD_PARTY_LICENSES.md',
]) {
  if (!existsSync(join(root, file))) errors.push(`missing ${file}`);
}

for (const file of ['icon.svg', 'assets/banner.svg', 'assets/deepseek.svg', 'assets/qwen.svg', 'assets/doubao.svg']) {
  const text = read(file);
  if (!text.trimStart().startsWith('<svg') || !text.includes('viewBox=')) {
    errors.push(`${file}: not a viewBox SVG`);
  }
}

if (errors.length > 0) {
  console.error(`dsh-api-model-icons: ${errors.length} validation error(s)`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log('dsh-api-model-icons: validation passed');
