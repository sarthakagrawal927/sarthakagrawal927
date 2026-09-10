import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const START = '<!-- SAAS-MAKER-PROJECTS:START -->';
export const END = '<!-- SAAS-MAKER-PROJECTS:END -->';

function httpsUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Expected a public HTTPS URL');
  return url.href.replaceAll('(', '%28').replaceAll(')', '%29');
}

export function validateCatalog(catalog) {
  if (catalog?.schemaVersion !== 5 || !Array.isArray(catalog.directory) || !catalog.directory.length) {
    throw new Error('Expected a nonempty public catalog');
  }
  const ids = new Set();
  for (const project of catalog.directory) {
    if (!project || project.shareable !== true || typeof project.id !== 'string' || !project.id.trim() || ids.has(project.id)) {
      throw new Error('Private or duplicate project in public catalog');
    }
    ids.add(project.id);
    for (const key of ['name', 'description']) {
      if (typeof project[key] !== 'string' || !project[key].trim()) throw new Error(`Missing project ${key}`);
    }
    if (!['featured', 'current', 'past'].includes(project.group)) throw new Error('Unknown public project group');
    httpsUrl(project.url);
    if (project.repositoryUrl) httpsUrl(project.repositoryUrl);
  }
  return catalog.directory;
}

function text(value) {
  return value.replace(/[\r\n]+/g, ' ').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replace(/([\\`*_{}\[\]()#!|])/g, '\\$1');
}

export function renderProjectSection(catalog) {
  const projects = validateCatalog(catalog);
  const lines = [START, '## Start here', '', 'Selected work from my [SaaS Maker directory](https://sassmaker.com/projects).', ''];
  for (const [group, label] of [['featured', 'Featured'], ['current', 'Current projects'], ['past', 'Past work and experiments']]) {
    const rows = projects.filter((project) => project.group === group);
    if (!rows.length) continue;
    lines.push(`### ${label}`, '');
    for (const project of rows) {
      const repository = project.repositoryUrl ? ` · [GitHub](${httpsUrl(project.repositoryUrl)})` : '';
      lines.push(`- [${text(project.name)}](${httpsUrl(project.url)})${repository} — ${text(project.description)}`);
    }
    lines.push('');
  }
  lines.push('[Project data](https://sassmaker.com/portfolio.json) · [Personal portfolio](https://sarthakagrawal.dev/projects)', '', END);
  return lines.join('\n');
}

export function updateReadme(readme, catalog, initialize = false) {
  const section = renderProjectSection(catalog);
  const startCount = readme.split(START).length - 1;
  const endCount = readme.split(END).length - 1;
  if (startCount === 1 && endCount === 1 && readme.indexOf(START) < readme.indexOf(END)) {
    return readme.slice(0, readme.indexOf(START)) + section + readme.slice(readme.indexOf(END) + END.length);
  }
  if (startCount || endCount || !initialize) throw new Error('Expected exactly one ordered pair of project markers');
  const matches = [...readme.matchAll(/^## Start here\r?\n[\s\S]*?(?=^## |$(?![\s\S]))/gm)];
  if (matches.length !== 1) throw new Error('Cannot identify the existing Start here section');
  const match = matches[0];
  return readme.slice(0, match.index) + section + '\n\n' + readme.slice(match.index + match[0].length);
}

async function main(args) {
  const readmePath = args[0];
  const catalogPath = args[1];
  if (!readmePath || !catalogPath || args.slice(2).some((arg) => !['--check', '--initialize'].includes(arg))) {
    throw new Error('Usage: public-profile.mjs README.md catalog.json [--check] [--initialize]');
  }
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  const before = await readFile(readmePath, 'utf8');
  const after = updateReadme(before, catalog, args.includes('--initialize'));
  if (args.includes('--check')) {
    if (after !== before) throw new Error('GitHub profile projects are stale');
  } else if (after !== before) await writeFile(readmePath, after);
  console.log(`GitHub profile: ${catalog.directory.length} public projects`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
