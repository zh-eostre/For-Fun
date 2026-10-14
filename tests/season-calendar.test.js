// Calendar 3: 22 weeks, a match for us every week (every division has a round every weekend; on an older, smaller
// pyramid a warm-up friendly fills a weekend the league sits out), the 天穹杯 final the week before the last round
// and the 冠军杯 final the week after it.
require('./harness').run(`
const step=()=>{if(S.event)ACT.event('0');if(S.offer)ACT.offerNo();ffToMatch();S.event=null;S.offer=null;S.lineup=autoPick(my(),S.formation);
  startMatch();if(!M)throw 'stuck: '+lineupIssues();skipMatch();ACT.matchDone()};
const ids=TEAMS.map((t,i)=>[t,i]).filter(([t])=>t.div===0).sort((a,b)=>b[0].rep-a[0].rep).map(x=>x[1]);
// a 甲级 club outside the 冠军杯: a league round every weekend, so no warm-ups
newGame(ids[ids.length-1],teamNames());
ok(S.cal===3&&weeks()===22&&!intlIn()&&seasonDays(0).length===weeks()&&!S.friendlies.some(f=>f.warm),'a new game: 22 weeks, 甲级 plays every weekend, no warm-ups needed');
// an older pyramid (10 / 12 / 14): its 甲级 sits 4 weekends out, and each gets a warm-up
{const drop=new Set(DIVS.flatMap((_,d)=>S.teams.filter(t=>t.div===d&&t.id!==S.my).slice(-2).map(t=>t.id)));
  const kept=S.teams.filter(t=>!drop.has(t.id)),map=new Map(kept.map((t,i)=>[t.id,i]));
  S.my=map.get(S.my);S.teams=kept;S.teams.forEach((t,i)=>t.id=i);S.rival=pickRival();
  S.fixtures=DIVS.map((_,d)=>genFixtures(divIds(d)));S.results=DIVS.map(()=>[]);S.cup=newCup();
  S.intl=null;S.intl=newIntl(divIds(0).filter(id=>id!==S.my).slice(0,3));S.intl.weeks=INTL_WEEKS4;
  S.friendlies=S.friendlies.filter(f=>!f.warm);S.lineup=autoPick(my(),S.formation);planWarmups()}
ok(rounds(0)===18&&!intlIn()&&S.friendlies.filter(f=>f.warm).length===4,'the warm-ups are planned from the start, so the fixture list has no empty week ('+S.friendlies.filter(f=>f.warm).map(f=>dayLabel(f.day)).join(' ')+')');
ok(S.news.some(n=>/安排了一场热身赛/.test(n.t)),'the news announces them at the start');
{const keep=JSON.stringify(S);S.friendlies.filter(f=>!f.warm).forEach(f=>f.res={hg:0,ag:0});
  ok(!nextFix().friendly&&/联赛第 1 轮/.test(fixLabel(nextFix())),'with warm-ups weeks ahead, the next match is still the league\u2019s first round');S=JSON.parse(keep)}
const played=[];
while(!seasonDone()){step();played.push(S.lastMatchDay)}
const warm=S.friendlies.filter(f=>f.warm).length;
const wk=d=>Math.floor((d-S.pre)/7),empty=Array.from({length:weeks()},(_,w)=>w).filter(w=>!played.some(d=>wk(d)===w));
ok(empty.length===0,'a match every week of the season'+(empty.length?' (empty: '+empty.join(',')+')':''));
ok(warm===4,'four warm-up friendlies, one for each weekend the old 甲级 sits out ('+warm+')');
const W=S.friendlies.filter(f=>f.warm);
ok(W.every(f=>f.day%7===5&&S.teams[f.opp].foreign&&f.res),'warm-ups are on Saturdays against clubs from abroad, and were played');
ok(S.news.some(n=>/^热身赛：/.test(n.t)),'the news reports them');
ok(S.results[0].length===rounds(0)&&S.round===rounds(),'warm-ups take no league round');
// a warm-up shows as one in the season list
UI.view='main';S.round--;UI.tab='home';render();ok(/热身赛 · 海外/.test(els.app.innerHTML),'the season list shows 热身赛 · 海外');S.round++;
// the 冠军杯 final: the week after the league. a finalist's season goes on until it is played
newGame(ids[0],teamNames());
const FIN=intlStages()-1;
while(S.round<rounds()&&!(S.intl.stage===FIN))step();
if(S.intl.stage===FIN&&S.intl.ties[0].includes(S.my)){
  while(S.round<rounds())step();
  ok(!seasonDone()&&intlMine(),'league over, but we are in the 冠军杯 final: the season is not over yet');
  UI.view='main';render();ok(/联赛已结束/.test(els.app.innerHTML)&&/data-act="ff"|data-act="play"/.test(els.app.innerHTML),'the club page shows the final still to come');
  const fd=intlDay(FIN);step();ok(S.lastMatchDay===fd&&S.intl.winner!=null&&seasonDone(),'final played on '+dayLabel(fd)+', and now the season is over');
}else{
  // not in the final this time: put us there to check the order of things
  while(S.round<rounds())step();
  ok(seasonDone()&&S.intl.winner!=null,'not in the final: the season ends with the league and the final is played off');
  newGame(ids[0],teamNames());const I=S.intl;
  for(let k=0;k<FIN;k++)playIntl(null);I.ties=[[S.my,I.ties[0].find(x=>x!==S.my)]];
  while(S.round<rounds())step();
  ok(!seasonDone()&&intlMine(),'put into the final: the season is not over after the league');
  const fd=intlDay(FIN);step();ok(S.lastMatchDay===fd&&I.winner!=null&&seasonDone(),'final played on '+dayLabel(fd)+', and now the season is over');
}
UI.view='main';render();ok(/赛季/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'season-end screen renders');
`);
