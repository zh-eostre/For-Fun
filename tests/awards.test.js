// Season awards judged within each position, the team of the season, and keepers' saves.
require('./harness').run(`
newGame(6,teamNames());
const tally={};
for(let s=0;s<4;s++){
  while(!seasonDone()){if(S.event)ACT.event('0');if(S.offer)ACT.offerNo();ACT.ff();S.lineup=autoPick(my(),S.formation);startMatch();skipMatch();M=null;UI.view='main'}
  if(s===0){
    const xi=seasonXI(my().div);
    ok(xi.length===11&&PO.every(pos=>xi.filter(w=>w.pos===pos).length===XI_SHAPE[pos]),'team of the season is a 1-4-3-3: '+xi.map(w=>w.name).join('、'));
    render();ok(/年度最佳阵容/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'season end shows the team of the season');
    const gks=S.teams.flatMap(t=>t.players).filter(p=>p.pos==='GK'&&p.rn>=8);
    ok(gks.every(p=>p.ss&&p.ss.sv>=0)&&gks.some(p=>p.ss.sv>p.rn*.3),'keepers make saves in AI matches too');
  }
  for(let d=0;d<DIVS.length;d++){const a=seasonAwards(d);if(a.mvp)tally[a.mvp.pos]=(tally[a.mvp.pos]||0)+1}
  newSeason();
  if(s===0)ok(S.records[0].xi&&S.records[0].xi.length===DIVS.length,'team of the season is recorded for both divisions');
}
console.log('  best player by position over 12 awards:',JSON.stringify(tally));
ok(Object.keys(tally).length>=2,'best player is not always the same position');
// honours room lists our players picked for the team of the season
S.records.push({season:99,champs:[],cup:null,div:1,rank:5,awards:[{},{}],xi:[[],[{name:'测试球员',pos:'DF',team:my().short,tid:S.my,stat:'7.90'}]]});
UI.tab='honours';render();ok(/最佳阵容：测试球员/.test(els.app.innerHTML),'honours room lists team-of-the-season picks');
// full-time table: saves for keepers only
S.records.pop();ACT.ff();S.event=null;S.offer=null;startMatch();skipMatch();render();
ok(/<th>扑救<\\/th>/.test(els.app.innerHTML),'stats table has a saves column');
`);
