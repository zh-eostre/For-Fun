// Every card, relic, room, event and enemy has its art: an icon in js/icons.js (built from art/icons) or a sprite in
// art/monsters, and js/icons.js is up to date with the SVGs.
const fs=require('fs'),path=require('path'),root=path.join(__dirname,'..');
const svgs=fs.readdirSync(path.join(root,'art/icons')).filter(f=>f.endsWith('.svg')).map(f=>f.slice(0,-4)).sort().join();
require('./harness').run(`
const miss=(pre,keys)=>keys.filter(k=>!ICONS[pre+k]);
ok(Object.keys(ICONS).sort().join()===svgs,'js/icons.js matches art/icons ('+Object.keys(ICONS).length+' icons)');
[['c-',CARDS,'cards'],['r-',RELICS,'relics'],['n-',NODE,'map rooms'],['e-',EVENTS,'events']].forEach(([p,o,n])=>{
  const m=miss(p,Object.keys(o));ok(!m.length,'every one of the '+n+' has an icon'+(m.length?' (missing: '+m+')':''))});
const ui=['u-hp','u-gold','u-tower','u-tomb','u-remove','u-sleep','u-forge','i-attack','i-block','i-buff','i-debuff','i-poison'].filter(k=>!ICONS[k]);
ok(!ui.length,'the screens and intents have their icons'+(ui.length?' (missing: '+ui+')':''));
const m=[...Object.keys(EN),'hero'].filter(k=>!png(k));ok(!m.length,'every enemy and the hero has a sprite'+(m.length?' (missing: '+m+')':''));
`,{svgs,png:k=>fs.existsSync(path.join(root,'art/monsters',k+'.png'))});
