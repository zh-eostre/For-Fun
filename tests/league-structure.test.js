// The 12 / 14 / 16 pyramid, its rounds and match days, the 42-club cup with a qualifying round, 底蕴 (prestige),
// and older saves (8-club; 10 / 12 / 14) expanding.
require('./harness').run(`
const play=()=>{while(!seasonDone()){ffToMatch();S.event=null;S.offer=null;S.lineup=autoPick(my(),S.formation);startMatch();if(!M)throw 'stuck: '+lineupIssues();skipMatch();M=null;UI.view='main'}};
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());
ok(DIVS.every((_,d)=>divSize(d)===DIV_SIZES[d])&&[0,1,2].map(rounds).join()==='22,26,30','new game: 12 / 14 / 16 clubs, 22 / 26 / 30 rounds');
ok(new Set(DIVS.map((_,d)=>leagueDay(rounds(d)-1,d))).size===1,'every division ends on the same day');
const wk=d=>Math.floor((d-S.pre)/7),cupWs=cupFmt().at;
const sats=d=>seasonDays(d).filter(x=>x%7===5).map(wk),tues=d=>seasonDays(d).filter(x=>x%7===1).map(wk);
ok(weeks()===24&&seasonDays(0).every(x=>x%7===5)&&sats(0).length===22,'a 24-week season; 甲级 plays every Saturday but the breaks, and nothing else');
ok(DIVS.every((_,d)=>seasonDays(d).every(x=>!BREAK_WEEKS.includes(wk(x)))),'no league round in either break week ('+BREAK_WEEKS.map(w=>w+2).join(', ')+')');
ok(sats(1).length===22&&sats(2).length===22,'乙级 and 丙级 play every weekend');
ok(tues(1).length===4&&tues(2).length===8&&[...tues(1),...tues(2)].every(w=>!cupWs.includes(w)),'乙级 and 丙级 play their 4 and 8 extra rounds on Tuesdays, never in a 天穹杯 week');
ok(S.cup.fmt.names[0]==='资格赛'&&S.cup.fmt.names[1]==='三十二强'&&S.cup.ties.length===10&&S.cup.byes.length===22,'cup: 20 clubs in the qualifying round, 22 byes');
const weakest=domestic().sort((a,b)=>a.rep-b.rep).slice(0,20).map(t=>t.id).sort().join();
ok(S.cup.ties.flat().sort().join()===weakest,'the qualifying round is the 20 lowest-底蕴 clubs');
UI.tab='cup';UI.cupv='dom';render();ok(/底蕴最低的 20 队先打资格赛/.test(els.app.innerHTML)&&/22 队轮空，直接进入三十二强/.test(els.app.innerHTML),'the cup page says so');UI.tab='home';
const tiers={};domestic().forEach(t=>tiers[DIVS[t.div]+tierOf(t.rep)]=(tiers[DIVS[t.div]+tierOf(t.rep)]||0)+1);console.log('  tiers at start: '+JSON.stringify(tiers));
play();
ok(S.cup.winner!=null&&S.cup.rounds.length===6&&S.cup.rounds[1].length===16,'cup completes: 6 stages, last 32 = 16 ties');
ok(S.results.map(r=>r.length).join()==='22,26,30','every division played its full season');
UI.tab='cup';render();ok(!bad(els.app.innerHTML),'cup page renders');
const reps=S.teams.map(t=>t.rep);newSeason();
ok(S.teams.some((t,i)=>t.rep!==reps[i])&&S.teams.every(t=>t.str===strFromRep(t.rep)),'底蕴 changed with results and strength follows it');
ok(DIVS.every((_,d)=>divSize(d)===DIV_SIZES[d]),'still 12 / 14 / 16 after promotion and relegation');
// several seasons: the league keeps a spread of giants, mid-table and weak clubs
for(let s=0;s<5;s++){play();newSeason()}
const t2={};domestic().forEach(t=>t2[tierOf(t.rep)]=(t2[tierOf(t.rep)]||0)+1);console.log('  tiers after 6 seasons: '+JSON.stringify(t2));
ok(Object.keys(t2).length>=3,'still at least three tiers across the league');
UI.tab='table';render();ok(!bad(els.app.innerHTML),'table renders');
// an old 8-club save (v13) mid-season: plays out its 14-round season with the 16-club cup, then expands
newGame(2,teamNames());
const keep=[0,1,2,3,4,5,6,7,12,13,14,15,16,17,18,19];
S.teams=keep.map((id,i)=>({...S.teams[id],id:i}));S.teams.forEach(t=>delete t.rep);
S.fixtures=[genFixtures(divIds(0)),genFixtures(divIds(1))];S.results=[[],[]];S.cup={stage:0,ties:pairUp(shuffle(S.teams.map(t=>t.id))),rounds:[],winner:null};
delete S.friendlies;delete S.pre;delete S.intl;  // saves from before the preseason week have none of these
S.rival=pickRival();S.lineup=autoPick(my(),S.formation);S.day=nextMatchDay();S.v=13;
store[KEY]=JSON.stringify(S);loadSaveText(store[KEY]);
ok(S.v===SAVE_V&&rounds()===14&&cupFmt().names.length===4&&S.teams.every(t=>t.rep>0),'old save loads: 14 rounds, 16-club cup, 底蕴 estimated');
play();ok(S.cup.winner!=null&&S.cup.rounds.length===4,'old-format season and cup finish');
newSeason();
ok(DIVS.every((_,d)=>divSize(d)===DIV_SIZES[d])&&rounds(0)===22&&S.cup.fmt.names[1]==='三十二强','next season: expanded to 12 / 14 / 16 with the 42-club cup');
ok(S.news.some(n=>/联赛扩军/.test(n.t)),'expansion is announced: '+(S.news.find(n=>/联赛扩军/.test(n.t))||{}).t);
const ids=S.teams.map(t=>t.id);ok(ids.every((id,i)=>id===i),'team ids stay aligned with their index');
play();ok(true,'a full expanded season plays');
// a 10 / 12 / 14 save (before this pyramid): its season promotes more (乙级 4, 丙级 6), then 6 new clubs join 丙级
{newGame(TEAMS.findIndex(t=>t.div===2),teamNames());UI.guide=null;
  const drop=new Set(DIVS.flatMap((_,d)=>S.teams.filter(t=>t.div===d&&t.id!==S.my).slice(-2).map(t=>t.id)));
  const kept=S.teams.filter(t=>!drop.has(t.id)),map=new Map(kept.map((t,i)=>[t.id,i]));
  S.my=map.get(S.my);S.teams=kept;S.teams.forEach((t,i)=>t.id=i);S.rival=pickRival();
  S.fixtures=DIVS.map((_,d)=>genFixtures(divIds(d)));S.results=DIVS.map(()=>[]);S.cup=newCup();S.intl=null;S.intl=newIntl(divIds(0).slice(0,3));
  S.friendlies=[];S.lineup=autoPick(my(),S.formation);
  ok(DIVS.map((_,d)=>divSize(d)).join()==='10,12,14'&&DIVS.map((_,d)=>promoSlots(d)).join()==='2,4,6','a 10 / 12 / 14 season: 乙级 sends 4 up, 丙级 6');
  S.div=1;UI.tab='table';UI.div=1;render();ok(/前 [46] 名升级（联赛扩军/.test(els.app.innerHTML),'the table says so');UI.tab='home';
  play();finishIntl();newSeason();
  ok(DIVS.map((_,d)=>divSize(d)).join()==='12,14,16'&&S.teams.every((t,i)=>t.id===i)&&S.news.some(n=>/丙级新增 6 队/.test(n.t)),'then 12 / 14 / 16, with 6 new clubs in 丙级');
  ok(DIVS.map((_,d)=>promoSlots(d)).join()==='2,2,2','and back to 2 up, 2 down');}
`);
