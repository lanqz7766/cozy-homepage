import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = p => readFileSync(resolve(root,p),'utf8');
for (const dir of ['src','data','tools']) {
  for (const file of readdirSync(resolve(root,dir)).filter(f=>/\.m?js$/.test(f))) {
    const result = spawnSync(process.execPath,['--check',resolve(root,dir,file)],{encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);
  }
}
const sandbox = {window:{}};
runInNewContext(read('data/content.js'), sandbox);
const data = sandbox.window.SITE_CONTENT;
assert.ok(data.profile.name.trim());
const html = read('index.html');
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
for (const pub of [...data.selectedPublications,...data.otherPublications.flatMap(g=>g.items)]) if(pub.id) ids.add(pub.id);
function checkReference(value) {
  if (!value || /^(https?:|mailto:)/.test(value)) return;
  if(value.startsWith('#')) { assert.ok(ids.has(value.slice(1)),`Missing anchor ${value}`); return; }
  assert.ok(existsSync(resolve(root,value.split('?')[0])),`Missing file ${value}`);
}
function visit(value) {
  if(!value || typeof value !== 'object') return;
  for (const [key,item] of Object.entries(value)) {
    if(['url','image','avatar','logo','qr'].includes(key) && typeof item==='string') checkReference(item);
    else visit(item);
  }
}
visit(data);
for(const [,ref] of html.matchAll(/(?:src|href|data-model)="([^"]+)"/g)) checkReference(ref);
for (const animal of ['bear','cat','bunny','panda']) {
const poster = readFileSync(resolve(root,`assets/scenes/${animal}-poster.png`));
assert.equal(poster.toString('ascii',1,4),'PNG',`Missing PNG poster for ${animal}`);
const glb = readFileSync(resolve(root,`assets/scenes/${animal}-station.glb`));
assert.equal(glb.toString('ascii',0,4),'glTF');
const model = JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString());
assert.ok(model.animations?.some(a=>a.name==='Alternating keystrokes'),'Missing typing animation');
}
console.log('PASS: JavaScript syntax, local assets/anchors, content, four animated models and PNG posters.');
