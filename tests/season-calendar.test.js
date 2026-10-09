// Calendar 3: 22 weeks, a match for us every week (a warm-up friendly when the league sits a weekend out and we
// have no cup tie), the 天穹杯 final the week before the last round and the 冠军杯 final the week after it.
require('./harness').run(`
const step=()=>{if(S.event)ACT.event('0');if(S.offer)ACT.offerNo();ACT.ff();S.event=null;S.offer=null;S.lineup=autoPick(my(),S.formation);
  startMatch();if(!M)throw 'stuck: '+lineupIssues();skipMatch();ACT.matchDone()};
// a 甲级 club outside the 冠军杯
const ids=TEAMS.map((t,i)=>[t,i]).filter(([t])=>t.div===0).sort((a,b)=>b[0].rep-a[0].rep).map(x=>x[1]);
newGame(ids[ids.length-1],teamNames());
ok(S.cal===3&&weeks()===22&&!intlIn(),'a new game is on the 22-week calendar; this club is not in the 冠军杯');
const played=[];
while(!seasonDone()){step();played.push(S.lastMatchDay)}
const warm=S.friendlies.filter(f=>f.warm).length;
const wk=d=>Math.floor((d-S.pre)/7),empty=Array.from({length:weeks()},(_,w)=>w).filter(w=>!played.some(d=>wk(d)===w));
ok(empty.length===0,'a match every week of the season'+(empty.length?' (empty: '+empty.join(',')+')':''));
ok(warm===4,'four warm-up friendlies, one for each weekend 甲级 sits out ('+warm+')');
const W=S.friendlies.filter(f=>f.warm);
ok(W.every(f=>f.day%7===5&&S.teams[f.opp].foreign&&f.res),'warm-ups are on Saturdays against clubs from abroad, and were played');
ok(S.news.some(n=>/安排了一场热身赛/.test(n.t))&&S.news.some(n=>/^热身赛：/.test(n.t)),'the news announces and reports them');
ok(S.results[0].length===rounds(0)&&S.round===rounds(),'warm-ups take no league round');
// a warm-up shows as one in the season list
UI.view='main';S.round--;UI.tab='home';render();ok(/热身赛 · 海外/.test(els.app.innerHTML),'the season list shows 热身赛 · 海外');S.round++;
// the 冠军杯 final: the week after the league. a finalist's season goes on until it is played
newGame(ids[0],teamNames());
while(S.round<rounds()&&!(S.intl.stage===8))step();
if(S.intl.stage===8&&S.intl.ties[0].includes(S.my)){
  while(S.round<rounds())step();
  ok(!seasonDone()&&intlMine(),'league over, but we are in the 冠军杯 final: the season is not over yet');
  UI.view='main';render();ok(/联赛已结束/.test(els.app.innerHTML)&&/data-act="ff"|data-act="play"/.test(els.app.innerHTML),'the club page shows the final still to come');
  const fd=intlDay(8);step();ok(S.lastMatchDay===fd&&S.intl.winner!=null&&seasonDone(),'final played on '+dayLabel(fd)+', and now the season is over');
}else{
  // not in the final this time: put us there to check the order of things
  while(S.round<rounds())step();
  ok(seasonDone()&&S.intl.winner!=null,'not in the final: the season ends with the league and the final is played off');
  newGame(ids[0],teamNames());const I=S.intl;
  for(let k=0;k<8;k++)playIntl(null);I.ties=[[S.my,I.ties[0].find(x=>x!==S.my)]];
  while(S.round<rounds())step();
  ok(!seasonDone()&&intlMine(),'put into the final: the season is not over after the league');
  const fd=intlDay(8);step();ok(S.lastMatchDay===fd&&I.winner!=null&&seasonDone(),'final played on '+dayLabel(fd)+', and now the season is over');
}
UI.view='main';render();ok(/赛季/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'season-end screen renders');
`);
