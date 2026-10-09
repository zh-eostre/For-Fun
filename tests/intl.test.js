// 天际冠军杯: 16 clubs (甲级's top two, the 天穹杯 winner and 13 from abroad), four groups home and away, then
// quarter-finals, semi-finals and a final. clubs from abroad stay out of the league, the 天穹杯 and transfers.
require('./harness').run(`
const play=()=>{let n=0;while(S.round<rounds()){if(S.event)ACT.event('0');if(S.offer)ACT.offerNo();ACT.ff();S.event=null;S.offer=null;S.lineup=autoPick(my(),S.formation);
  if(nextFix().intl)n++;startMatch();if(!M)throw 'stuck: '+lineupIssues();skipMatch();ACT.matchDone()}return n};
const top=TEAMS.map((t,i)=>[t,i]).filter(([t])=>t.div===0).sort((a,b)=>b[0].rep-a[0].rep)[0][1];
newGame(top,teamNames());
const I=S.intl,away=S.teams.filter(t=>t.foreign);
ok(I&&I.groups.length===4&&I.groups.every(g=>g.length===4)&&new Set(I.groups.flat()).size===16,'16 clubs in four groups of four');
ok(I.home.length===3&&I.home.includes(S.my)&&I.home.every(id=>S.teams[id].div===0),'three 甲级 clubs enter, us among them');
ok(I.home.every(id=>I.groups.filter(g=>g.includes(id)).length===1)&&I.groups.every(g=>g.filter(id=>I.home.includes(id)).length<=1),'our clubs are drawn into different groups');
ok(away.length===FOREIGN.length&&away.every(t=>t.div===-1&&t.players.length>=16),'the clubs from abroad have squads and no division');
ok(away.every(t=>t.players.every(p=>!!p.sig===(p.ovr>=SIG_OVR&&p.age<SIG_FADE))),'their stars learn signature moves like everyone else');
ok(!S.fixtures.flat(3).filter(x=>typeof x==='number').some(id=>S.teams[id].foreign),'no club from abroad in the league');
ok(![...S.cup.ties.flat(),...(S.cup.byes||[])].some(id=>S.teams[id].foreign),'or in the 天穹杯');
ok(DIVS.every((_,d)=>divSize(d)===DIV_SIZES[d])&&domestic().length===36,'the pyramid is still 10 / 12 / 14');
ok(/海外/.test(buyBlock(away[0].players[0],away[0])),'their players are not for sale');
// the calendar: Wednesdays that never meet a 天穹杯 tie, all before the league ends
const iDays=INTL_WEEKS.map((_,k)=>intlDay(k)),cDays=cupFmt().names.map((_,k)=>cupDay(k));
ok(iDays.every(d=>d%7===2&&!cDays.includes(d)&&d<leagueDay(rounds()-1)),'every stage on a Wednesday, apart from 天穹杯 ties, before the last round');
// screens
UI.tab='home';render();ok(!bad(els.app.innerHTML)&&els.app.innerHTML.includes(INTL_NAME),'home: the season list shows our 冠军杯 matches');
UI.tab='cup';UI.cupv='intl';render();ok(!bad(els.app.innerHTML)&&/A 组/.test(els.app.innerHTML)&&/D 组/.test(els.app.innerHTML),'cup tab: four group tables');
UI.cupv='dom';render();ok(!bad(els.app.innerHTML)&&els.app.innerHTML.includes(CUP_NAME),'and the 天穹杯 behind the switch');
ACT.team(String(away[0].id));render();ok(!bad(els.app.innerHTML)&&/海外俱乐部/.test(els.app.innerHTML),'a club from abroad has a team page');UI.pages=[];UI.tab='home';
// a whole season
const before=S.budget,live=play();
ok(I.winner!=null&&I.stage===intlStages()&&I.ties.length===0,'the cup is decided: '+S.teams[I.winner].name);
ok(I.res.every(g=>g.length===6&&g.every(rd=>rd.length===2)),'six group rounds of two matches in each group');
ok(I.res.every((g,gi)=>intlTable(gi).every(r=>r.p===6)),'everyone plays six group matches');
ok(I.ko.map(r=>r.length).join()==='4,2,1'&&I.ko.flat().every(r=>r.w===r.h||r.w===r.a),'quarter-finals, semi-finals, final, each with a winner');
ok(I.ko.flat().every(r=>r.hg!==r.ag||(r.hp!=null&&r.hp!==r.ap)),'a level knockout tie went to penalties');
const qf=I.ko[0].flatMap(r=>[r.h,r.a]),ups=[0,1,2,3].flatMap(gi=>intlTable(gi).slice(0,2).map(r=>r.id));
ok(qf.sort().join()===ups.sort().join(),'the quarter-finalists are the top two of each group');
const ourKO=I.ko.filter(rd=>rd.some(r=>r.h===S.my||r.a===S.my)).length;
ok(live===6+ourKO,'we played our six group games and '+ourKO+' knockout ties live');
ok(S.news.some(n=>n.t.includes(INTL_NAME)),'the news follows it');
render();ok(els.app.innerHTML.includes(INTL_NAME),'the season-end screen mentions it');
S.round--;UI.view='main';UI.tab='cup';UI.cupv='intl';render();ok(!bad(els.app.innerHTML)&&/八强/.test(els.app.innerHTML)&&/决赛/.test(els.app.innerHTML),'cup tab shows the knockout rounds');
UI.tab='honours';render();ok(!bad(els.app.innerHTML)&&els.app.innerHTML.includes(INTL_NAME),'honours has a 冠军杯 trophy count');S.round++;
// next season: a new draw from the final 甲级 table and the 天穹杯 winner
const t0=table(0).map(r=>r.id),cw=S.cup.winner,want=intlEntrants(t0,cw),winner=S.teams[I.winner].name;
newSeason();
ok(S.records[S.records.length-1].intl===winner,'the season record keeps the winner');
ok(S.intl!==I&&S.intl.season===S.season&&S.intl.stage===0,'a new 冠军杯 for the new season');
ok(S.intl.home.join()===want.join()&&want.length===3&&new Set(want).size===3,'entrants: 甲级 1st and 2nd and the 天穹杯 winner (or 3rd)');
ok(S.teams.filter(t=>t.foreign).length===FOREIGN.length,'the same clubs from abroad, not a second set');
ok(S.teams.filter(t=>t.foreign).every(t=>aiGap(t)<=3),'and they renew their squads to stay at their level');
// an old save without the cup: plays on, and gets one next season
delete S.intl;UI.tab='home';render();ok(!bad(els.app.innerHTML),'a save without the 冠军杯 renders');
ok(nextFix()&&!nextFix().intl,'and plays its league');
`);
