// Match ratings, shots and possession, season awards.
require('./harness').run(`

newGame(2,teamNames());const all=[],shots=[],poss=[];let badV=0;
while(S.round<ROUNDS){ACT.ff();S.event=null;S.offer=null;S.lineup=autoPick(my(),S.formation);startMatch();skipMatch();
  all.push(...M.rh.map(x=>x.r),...M.ra.map(x=>x.r));shots.push(M.st.h.sh+M.st.a.sh);poss.push(M.poss);render();if(bad(els.app.innerHTML))badV++;
  if(S.round===3)console.log('  sample full-time:',M.hg+':'+M.ag,'shots',M.st.h.sh+'/'+M.st.h.on,'vs',M.st.a.sh+'/'+M.st.a.on,'poss',M.poss+'%','MVP',M.mvp.p.name,M.mvp.r);
  M=null;UI.view='main';for(const t of ['home','squad','table','honours']){UI.tab=t;render();if(bad(els.app.innerHTML))badV++}}
const avg=a=>(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1);
console.log('  ratings: avg',avg(all),'min',Math.min(...all),'max',Math.max(...all),'| shots/match',avg(shots),'| home possession range',Math.min(...poss)+'-'+Math.max(...poss));
const a=seasonAwards(my().div);console.log('  awards:',Object.entries(a).map(([k,w])=>AWARDS[k]+' '+(w?w.name+' '+w.stat:'-')).join(' | '));
render();ok(!bad(els.app.innerHTML)&&/个人奖项/.test(els.app.innerHTML),'season end page shows awards');
ok(badV===0,'all views clean during the season');
newSeason();ok(S.records[0].awards.length===2&&my().players.every(p=>!p.rn),'awards recorded, ratings reset for the new season');
`);
