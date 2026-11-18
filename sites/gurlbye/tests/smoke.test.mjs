import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import worker from '../worker.mjs';
const root=fileURLToPath(new URL('../', import.meta.url));
const file=name=>readFile(join(root,name));
test('assets unchanged except corrective CSS',async()=>{
 const receipt=JSON.parse(await file('RECOVERY.json'));
 for(const item of receipt.files){const data=await file('dist/'+item.path);
  if(item.path!=='site.css')assert.equal(createHash('sha256').update(data).digest('hex'),item.originalSha256,item.path);
 }
 assert.equal(receipt.routeCount,28);
});
test('five navigation links stay visible and at least 44px high at 280-414px',async()=>{
 const html=(await file('dist/index.html')).toString();const css=(await file('dist/site.css')).toString();
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||undefined});
 try{for(const width of [280,320,360,390,414]){
  const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'});
  try {await page.setContent(html,{waitUntil:'domcontentloaded'});await page.addStyleTag({content:css});
   const x=await page.evaluate(()=>({width:document.documentElement.scrollWidth,links:[...document.querySelectorAll('#page-home .nav-banner nav a')].map(a=>({left:a.getBoundingClientRect().left,right:a.getBoundingClientRect().right,height:a.getBoundingClientRect().height}))}));
   assert.ok(x.width<=width,JSON.stringify({width,...x}));assert.equal(x.links.length,5);
   assert.ok(x.links.every(a=>a.left>=0&&a.right<=width&&a.height>=44),JSON.stringify({width,...x}));
  }finally{await page.close()}
 }}finally{await browser.close()}
});
test('recovered Worker retains existing endpoint and security contracts',async()=>{
 const health=await worker.fetch(new Request('https://gurlbye.smatdesigns.com/__health'),{EMAIL:{send:async()=>{}}});
 assert.equal((await health.json()).formBinding,true);
 const denied=await worker.fetch(new Request('https://gurlbye.smatdesigns.com/api/join',{method:'GET'}),{});
 assert.equal(denied.status,405);
 const page=await worker.fetch(new Request('https://gurlbye.smatdesigns.com/'),{ASSETS:{fetch:async()=>new Response('<h1>Test</h1>',{headers:{'content-type':'text/html'}})}});
 assert.equal(page.status,200);assert.match(page.headers.get('content-security-policy'),/frame-ancestors 'none'/);
});
