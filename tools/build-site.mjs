import { cp, mkdir, rm } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const out = new URL('dist/', root);
await rm(out, { recursive:true, force:true });
await mkdir(out, { recursive:true });
// Only deploy the public site; tools, dependencies and repository docs stay out.
for (const name of ['index.html', '.nojekyll', 'src', 'data', 'assets', 'licenses', 'LICENSE', 'THIRD_PARTY_NOTICES.md']) {
  await cp(new URL(name, root), new URL(name, out), { recursive:true });
}
console.log('Static site ready in dist/');
