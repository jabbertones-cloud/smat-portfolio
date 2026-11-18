import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const read = p => readFileSync(resolve(root,p));
const sha = b => createHash('sha256').update(b).digest('hex');
const fontReceipt = JSON.parse(read('docs/self-hosted-fonts-receipt.json'));
const vendorReceipt = JSON.parse(read('docs/vendor-scripts-receipt.json'));
const html = read('index.html').toString();
const css = read('assets/fonts/site-fonts.css').toString();
assert.match(html,/href="\/assets\/fonts\/site-fonts\.css"/);
assert.doesNotMatch(html,/fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net/);
assert.doesNotMatch(css,/fonts\.gstatic\.com|@import/);
assert.equal(sha(Buffer.from(css)),fontReceipt.cssLocalSha256);
for(const f of fontReceipt.fonts){
 assert.equal(sha(read('assets/fonts/'+f.file)),f.sha256,f.file);
 assert.ok(css.includes('./'+f.file),f.file);
}
for(const f of vendorReceipt.dependencies){
 assert.equal(sha(read('assets/vendor/'+f.file)),f.sha256,f.file);
 assert.ok(html.includes('/assets/vendor/'+f.file));
}
for(const name of ['Bebas Neue','DM Sans','JetBrains Mono'])assert.ok(css.includes("font-family: '"+name+"'"));
for(const license of fontReceipt.licenses)assert.ok(read(license.notice).includes('SIL OPEN FONT LICENSE'));
assert.ok(read(vendorReceipt.lenisLicense).includes('MIT License'));
console.log('PASS SMAT Designs: 10 first-party WOFF2 hashes, 3 exact JS bundles, notices, and CSS');
