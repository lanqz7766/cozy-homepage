import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
for (const species of ['bear','cat','bunny','panda']) {
  const run=spawnSync(process.execPath,[fileURLToPath(new URL('./build-companion.mjs',import.meta.url)),species],{stdio:'inherit'});
  if(run.status!==0) process.exit(run.status || 1);
}
