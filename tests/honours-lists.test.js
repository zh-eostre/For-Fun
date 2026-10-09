// Honours lists that grow every season (awards, legends, past champions) scroll inside their panels.
require('./harness').run(`
newGame(2,teamNames());
for(let s=1;s<=12;s++){
  S.records.push({season:s,champs:['甲A','乙B'],cup:'杯C',div:0,rank:1,awards:[{mvp:{name:'球员'+s,pos:'MF',team:my().name,tid:S.my,stat:'7.50'}},{}]});
  S.history.push({season:s,div:0,rank:1,pts:30});
  S.legends.push({name:'传奇'+s,pos:'FW',goals:50,apps:200,seasons:9,titles:['x'],season:s});
}
UI.tab='honours';render();const h=els.app.innerHTML;
ok((h.match(/class="scrollbox"/g)||[]).length===2&&/class="tw scrollbox"/.test(h),'awards, legends and records scroll in their boxes');
ok(/12 项/.test(h)&&/12 人/.test(h),'headings show how many');
ok(h.indexOf('传奇12')<h.indexOf('传奇1<')||h.indexOf('传奇12')<h.indexOf('传奇11'),'newest legend first');
S.round=rounds();finishIntl();render();const e=els.app.innerHTML;
const hist=e.slice(e.indexOf('se-hist'),e.indexOf('</div>',e.indexOf('se-hist')));
ok((hist.match(/<span/g)||[]).length===7&&/>S7 /.test(hist)&&!/>S6 /.test(hist),'season end shows only the last 6 seasons (plus this one)');
ok(!bad(h)&&!bad(e),'pages render cleanly');
`);
