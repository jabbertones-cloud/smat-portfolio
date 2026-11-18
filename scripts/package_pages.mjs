import { cp, mkdir, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const dest = resolve(process.argv[2] || await mkdtemp(join(tmpdir(), 'smatdesigns-stage-')));
const dirs = ['.well-known', 'a-plus-content', 'assets', 'bimi', 'brands',
  'case-studies', 'contact', 'images', 'privacy', 'security', 'services', 'software', 'terms'];
const files = ['.nojekyll', '404.html', '_headers', '_worker.js', 'index.html', 'robots.txt', 'sitemap.xml'];
await mkdir(dest, { recursive: true });
if ((await readdir(dest)).length) throw Error('Refusing nonempty deployment directory: ' + dest);
for (const p of dirs) await cp(join(root, p), join(dest, p), { recursive: true, errorOnExist: true });
for (const p of files) await cp(join(root, p), join(dest, p), { errorOnExist: true });
const html = await readFile(join(dest, 'index.html'));
const htmlText = html.toString();
for (const p of ['/assets/fonts/site-fonts.css', '/assets/vendor/gsap.3.12.5.min.js',
  '/assets/vendor/ScrollTrigger.3.12.5.min.js', '/assets/vendor/lenis.1.1.18.min.js']) {
  if (!htmlText.includes(p)) throw Error('Required first-party asset reference missing: ' + p);
}
const sha = b => createHash('sha256').update(b).digest('hex');
const gitSha = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
await writeFile(join(dest, '_release.json'), JSON.stringify({
  gitSha, source: 'jabbertones-cloud/smat-portfolio', package: 'public Pages output only',
  homepageSha256: sha(html), workerSha256: sha(await readFile(join(dest, '_worker.js')))
}, null, 2) + '\n');
console.log(JSON.stringify({ gitSha, dest, directories: dirs.length, files: files.length + 1, homepageSha256: sha(html) }));
