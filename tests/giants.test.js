// The league always keeps at least two AI giants, even when we win every season.
require('./harness').run(`
newGame(1,teamNames());const lines=[];let minGiants=99;
for(let s=0;s<12;s++){
  my().players.forEach(p=>{p.ovr=95;p.pot=95;p.cond=100});
  while(S.round<rounds()){ACT.ff();S.event=null;S.offer=null;S.lineup=autoPick(my(),S.formation);startMatch();skipMatch();M=null;UI.view='main'}
  const rank=myRank();newSeason();
  const g=S.teams.filter(t=>t.id!==S.my&&t.rep>=80);minGiants=Math.min(minGiants,g.length);
  lines.push('S'+(S.season-1)+' 我们第'+rank+' | 豪门 '+g.map(t=>t.short+t.rep).join('/'));
}
console.log('  '+lines.filter((l,i)=>i%3===2).join('\\n  '));
ok(minGiants>=2,'never fewer than 2 AI giants (minimum seen: '+minGiants+')');
`);
