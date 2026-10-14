// 天际冠军杯: 32 clubs (甲级's top three, the 天穹杯 winner and 28 from abroad), eight groups home and away, then
// the last 16, quarter-finals, semi-finals and a final. clubs from abroad stay out of the league, the 天穹杯 and transfers.
require('./harness').run(`
const play=()=>{let n=0;while(!seasonDone()){if(S.event)ACT.event('0');if(S.offer)ACT.offerNo();ffToMatch();S.event=null;S.offer=null;S.lineup=autoPick(my(),S.formation);
  if(nextFix().intl)n++;startMatch();if(!M)throw 'stuck: '+lineupIssues();skipMatch();ACT.matchDone()}return n};
const top=TEAMS.map((t,i)=>[t,i]).filter(([t])=>t.div===0).sort((a,b)=>b[0].rep-a[0].rep)[0][1];
newGame(top,teamNames());
const I=S.intl,away=S.teams.filter(t=>t.foreign);
ok(I&&I.groups.length===8&&I.groups.every(g=>g.length===4)&&new Set(I.groups.flat()).size===32,'32 clubs in eight groups of four');
ok(I.home.length===4&&I.home.includes(S.my)&&I.home.every(id=>S.teams[id].div===0),'four 甲级 clubs enter, us among them');
ok(I.home.every(id=>I.groups.filter(g=>g.includes(id)).length===1)&&I.groups.every(g=>g.filter(id=>I.home.includes(id)).length<=1),'our clubs are drawn into different groups');
ok(I.home.map(id=>I.groups.findIndex(g=>g.includes(id))).join()==='0,2,4,6','in groups A, C, E and G, so they can\u2019t meet in the last 16');
ok(away.length===FOREIGN.length&&away.every(t=>t.div===-1&&t.players.length>=16),'the clubs from abroad have squads and no division');
ok(away.every(t=>t.players.every(p=>!!p.sig===(p.ovr>=SIG_OVR&&p.age<SIG_FADE))),'their stars learn signature moves like everyone else');
ok(!S.fixtures.flat(3).filter(x=>typeof x==='number').some(id=>S.teams[id].foreign),'no club from abroad in the league');
ok(![...S.cup.ties.flat(),...(S.cup.byes||[])].some(id=>S.teams[id].foreign),'or in the 天穹杯');
ok(DIVS.every((_,d)=>divSize(d)===DIV_SIZES[d])&&domestic().length===42,'the pyramid is still 12 / 14 / 16');
ok(/海外/.test(buyBlock(away[0].players[0],away[0])),'their players are not for sale');
// the calendar: Wednesdays that never meet a 天穹杯 tie, all before the league ends
const iDays=intlStageNames().map((_,k)=>intlDay(k)),cDays=cupFmt().names.map((_,k)=>cupDay(k));
const last=leagueDay(rounds()-1);
ok(iDays.every(d=>d%7===2&&!cDays.includes(d))&&iDays.slice(0,-1).every(d=>d<last),'every stage on a Wednesday, apart from 天穹杯 ties; all but the final before the last round');
const wkOf=d=>Math.floor((d-S.pre)/7);
ok(wkOf(iDays[iDays.length-1])===wkOf(last)+1,'the 冠军杯 final comes the week after the last league round');
ok(wkOf(cDays[cDays.length-1])===wkOf(last)-1,'the 天穹杯 final is in the week before it');
// screens
UI.tab='home';render();ok(!bad(els.app.innerHTML)&&els.app.innerHTML.includes(INTL_NAME),'home: the season list shows our 冠军杯 matches');
ok(seasonDays(0).length===weeks()-BREAK_WEEKS.length,'甲级 has a round every weekend but the two breaks');
ok(BREAK_WEEKS.every(w=>[intlDay(intlStages()-3),intlDay(intlStages()-2)].some(d=>Math.floor((d-S.pre)/7)===w)),'the quarter- and semi-finals are played in the breaks');
UI.tab='cup';UI.cupv='intl';render();ok(!bad(els.app.innerHTML)&&/A 组/.test(els.app.innerHTML)&&/H 组/.test(els.app.innerHTML)&&/32 队 · 8 个小组/.test(els.app.innerHTML),'cup tab: eight group tables');
UI.cupv='dom';render();ok(!bad(els.app.innerHTML)&&els.app.innerHTML.includes(CUP_NAME),'and the 天穹杯 behind the switch');
ACT.team(String(away[0].id));render();ok(!bad(els.app.innerHTML)&&/海外俱乐部/.test(els.app.innerHTML),'a club from abroad has a team page');UI.pages=[];UI.tab='home';
// a whole season
const before=S.budget,live=play();
ok(I.winner!=null&&I.stage===intlStages()&&I.ties.length===0,'the cup is decided: '+S.teams[I.winner].name);
ok(I.res.every(g=>g.length===6&&g.every(rd=>rd.length===2)),'six group rounds of two matches in each group');
ok(I.res.every((g,gi)=>intlTable(gi).every(r=>r.p===6)),'everyone plays six group matches');
ok(I.ko.map(r=>r.length).join()==='8,4,2,1'&&I.ko.flat().every(r=>r.w===r.h||r.w===r.a),'last 16, quarter-finals, semi-finals, final, each with a winner');
ok(I.ko.flat().every(r=>r.hg!==r.ag||(r.hp!=null&&r.hp!==r.ap)),'a level knockout tie went to penalties');
const qf=I.ko[0].flatMap(r=>[r.h,r.a]),ups=I.groups.flatMap((_,gi)=>intlTable(gi).slice(0,2).map(r=>r.id));
ok(qf.sort().join()===ups.sort().join(),'the last 16 are the top two of each group');
ok(I.ko[0].every(r=>I.groups.findIndex(g=>g.includes(r.h))!==I.groups.findIndex(g=>g.includes(r.a))),'no group\u2019s two meet in the last 16');
const ourKO=I.ko.filter(rd=>rd.some(r=>r.h===S.my||r.a===S.my)).length;
ok(live===6+ourKO,'we played our six group games and '+ourKO+' knockout ties live');
ok(S.news.some(n=>n.t.includes(INTL_NAME)),'the news follows it');
render();ok(els.app.innerHTML.includes(INTL_NAME),'the season-end screen mentions it');
S.round--;UI.view='main';UI.tab='cup';UI.cupv='intl';render();ok(!bad(els.app.innerHTML)&&/十六强/.test(els.app.innerHTML)&&/八强/.test(els.app.innerHTML)&&/决赛/.test(els.app.innerHTML),'cup tab shows the knockout rounds');
UI.tab='honours';render();ok(!bad(els.app.innerHTML)&&els.app.innerHTML.includes(INTL_NAME),'honours has a 冠军杯 trophy count');S.round++;
// next season: a new draw from the final 甲级 table and the 天穹杯 winner
// the 甲级 table marks next season's places: amber for the entrants (top three plus the cup winner or 4th)
{const rows=h=>(h.match(/<tr class="[^"]*"/g)||[]),T=table(0),E=intlEntrants(T.map(r=>r.id),S.cup.winner);
  S.round--;UI.view='main';UI.tab='table';UI.div=0;render();const r=rows(els.app.innerHTML);
  ok(T.every((x,i)=>/ intl"/.test(r[i])===(E.includes(x.id))),'甲级 table: the clubs in next season\u2019s 冠军杯 are marked ('+E.map(id=>S.teams[id].short).join('、')+')');
  ok(/获得下赛季/.test(els.app.innerHTML),'with a legend');
  const keep=S.cup.winner;S.cup.winner=null;render();const r2=rows(els.app.innerHTML);
  ok(/ intl"/.test(r2[0])&&/ intl"/.test(r2[1])&&/ intl"/.test(r2[2])&&/intl-maybe/.test(r2[3])&&/递补/.test(els.app.innerHTML),'before the cup final: top three in, 4th a maybe');
  S.cup.winner=keep;S.round++;UI.tab='home';}
const t0=table(0).map(r=>r.id),cw=S.cup.winner,want=intlEntrants(t0,cw),winner=S.teams[I.winner].name;
newSeason();
ok(S.records[S.records.length-1].intl===winner,'the season record keeps the winner');
ok(S.intl!==I&&S.intl.season===S.season&&S.intl.stage===0,'a new 冠军杯 for the new season');
ok(S.intl.home.join()===want.join()&&want.length===4&&new Set(want).size===4,'entrants: 甲级 1st, 2nd and 3rd and the 天穹杯 winner (or 4th)');
ok(S.teams.filter(t=>t.foreign).length===FOREIGN.length,'the same clubs from abroad, not a second set');
ok(S.teams.filter(t=>t.foreign).every(t=>aiGap(t)<=3),'and they renew their squads to stay at their level');
// an old save without the cup: plays on, and gets one next season
delete S.intl;UI.tab='home';render();ok(!bad(els.app.innerHTML),'a save without the 冠军杯 renders');
ok(nextFix()&&!nextFix().intl,'and plays its league');
// the pool abroad: 40 clubs, drawn by standing, and their standing moves with their 冠军杯 runs
{newGame(TEAMS.findIndex(t=>t.div===2),teamNames());UI.guide=null;const F=S.teams.filter(t=>t.foreign);
  ok(F.length===FOREIGN.length&&FOREIGN.length===40&&F.every(t=>t.base===t.rep),'40 clubs abroad, each starting at its own standing');
  const top=F.reduce((a,b)=>a.rep>b.rep?a:b),low=F.reduce((a,b)=>a.rep<b.rep?a:b);let nt=0,nl=0;
  for(let k=0;k<300;k++){const d=drawAbroad(13);if(d.includes(top))nt++;if(d.includes(low))nl++}
  ok(nt>nl*2,'the draw favours the strong: '+top.short+' in '+nt+'/300, '+low.short+' in '+nl+'/300');
  // a cup played out: the winner goes up, a group's last goes down, a club not in it drifts back
  const I=S.intl;finishIntl();const W=S.teams[I.winner],last=I.groups.map((g,gi)=>intlTable(gi)[3].id).map(id=>S.teams[id]).find(t=>t.foreign);
  const out=F.find(t=>!I.groups.flat().includes(t.id));out.rep=out.base+3;
  const before=new Map(F.map(t=>[t.id,t.rep]));foreignForm(I);
  ok(!W.foreign||W.rep===Math.min(FOREIGN_REP[1],before.get(W.id)+3),'the winner abroad gains (+3)');
  ok(!last||last.rep===Math.max(FOREIGN_REP[0],before.get(last.id)-2+(Math.abs(before.get(last.id)-last.base)>FOREIGN_PULL?Math.sign(last.base-before.get(last.id)):0)),'a group\u2019s last loses (-2)');
  ok(out.rep===out.base+2,'a club not in it drifts back toward its old standing');
  ok(F.every(t=>t.str===strFromRep(t.rep)),'strength follows standing');
  // an older save with the first 16 gets the rest
  const old=JSON.parse(JSON.stringify(S));const keep=new Set(FOREIGN.slice(0,16).map(f=>f[0]));
  old.teams=old.teams.filter(t=>!t.foreign||keep.has(t.name));old.teams.forEach((t,i)=>t.id=i);S=old;S.intl=null;
  ensureForeign();ok(S.teams.filter(t=>t.foreign).length===FOREIGN.length&&S.teams.every((t,i)=>t.id===i),'an older save gets the new clubs, ids in order');}
// clubs abroad are held to their level too: one far above it loses its best players over the summer
{newGame(TEAMS.findIndex(t=>t.div===2),teamNames());UI.guide=null;const t=S.teams.find(x=>x.foreign);
  [...t.players].sort((a,b)=>b.ovr-a.ovr).slice(0,8).forEach(p=>p.ovr=Math.min(95,p.ovr+25));const before=aiGap(t),top=Math.max(...t.players.map(p=>p.ovr));
  const star=[...t.players].sort((a,b)=>b.ovr-a.ovr)[0],n0=t.players.length;freshenForeign();ok(before<-6&&!t.players.includes(star)&&aiGap(t)>=before&&t.players.length===n0,'a club abroad far over its level (eight stars arrived): one moves on each summer ('+before+' → '+aiGap(t)+')');}
`);
