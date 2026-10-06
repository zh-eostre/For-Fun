// Runs every tests/*.test.js (each in its own process, 60s limit) and prints a summary.
// Usage: node tests/run.js            exit code 1 if anything failed
const {spawnSync}=require('child_process'),fs=require('fs'),path=require('path');
let failed=0;
for(const f of fs.readdirSync(__dirname).filter(f=>f.endsWith('.test.js')).sort()){
  const r=spawnSync(process.execPath,[path.join(__dirname,f)],{encoding:'utf8',timeout:60000});
  const out=(r.stdout||'')+(r.stderr||''),pass=(out.match(/^PASS /gm)||[]).length;
  const bad=out.split('\n').filter(l=>/^FAIL |Error|STUCK/.test(l));
  const hung=r.error&&r.error.code==='ETIMEDOUT';
  if(bad.length||hung||r.status)failed++;
  console.log(`${bad.length||hung||r.status?'✗':'✓'} ${f.padEnd(34)} ${pass} pass${bad.length?`, ${bad.length} fail`:''}${hung?', timed out':''}`);
  bad.forEach(l=>console.log('    '+l));
}
console.log(failed?`\n${failed} test file(s) failed`:'\nall tests passed');
process.exit(failed?1:0);
