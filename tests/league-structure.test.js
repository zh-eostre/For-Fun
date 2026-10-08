// The 10 / 12 / 14 pyramid, its rounds and match days, the 36-club cup with a qualifying round, 底蕴 (prestige),
// and older saves (8-club, 2 x 10) expanding.
require('./harness').run(`
const play=()=>{while(S.round<rounds()){ACT.ff();S.event=null;S.offer=null;S.lineup=autoPick(my(),S.formation);startMatch();if(!M)throw 'stuck: '+lineupIssues();skipMatch();M=null;UI.view='main'}};
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());
ok(DIVS.every((_,d)=>divSize(d)===DIV_SIZES[d])&&[0,1,2].map(rounds).join()==='18,22,26','new game: 10 / 12 / 14 clubs, 18 / 22 / 26 rounds');
ok(new Set(DIVS.map((_,d)=>leagueDay(rounds(d)-1,d))).size===1,'every division ends on the same day');
const cupDs=cupFmt().names.map((_,k)=>cupDay(k)),mid=seasonDays(2).filter(d=>d%7===1);
ok(mid.length===8&&mid.every(d=>cupDs.every(c=>Math.abs(c-d)>1)),'丙级 plays 8 rounds on Tuesdays, never next to a cup tie');
ok(S.cup.fmt.names[0]==='资格赛'&&S.cup.fmt.names[1]==='三十二强'&&S.cup.ties.length===4&&S.cup.byes.length===28,'cup: 8 clubs in the qualifying round, 28 byes');
const weakest=[...S.teams].sort((a,b)=>a.rep-b.rep).slice(0,8).map(t=>t.id).sort().join();
ok(S.cup.ties.flat().sort().join()===weakest,'the qualifying round is the 8 lowest-底蕴 clubs');
const tiers={};S.teams.forEach(t=>tiers[DIVS[t.div]+tierOf(t.rep)]=(tiers[DIVS[t.div]+tierOf(t.rep)]||0)+1);console.log('  tiers at start: '+JSON.stringify(tiers));
play();
ok(S.cup.winner!=null&&S.cup.rounds.length===6&&S.cup.rounds[1].length===16,'cup completes: 6 stages, last 32 = 16 ties');
ok(S.results.map(r=>r.length).join()==='18,22,26','every division played its full season');
UI.tab='cup';render();ok(!bad(els.app.innerHTML),'cup page renders');
const reps=S.teams.map(t=>t.rep);newSeason();
ok(S.teams.some((t,i)=>t.rep!==reps[i])&&S.teams.every(t=>t.str===strFromRep(t.rep)),'底蕴 changed with results and strength follows it');
ok(DIVS.every((_,d)=>divSize(d)===DIV_SIZES[d]),'still 10 / 12 / 14 after promotion and relegation');
// several seasons: the league keeps a spread of giants, mid-table and weak clubs
for(let s=0;s<5;s++){play();newSeason()}
const t2={};S.teams.forEach(t=>t2[tierOf(t.rep)]=(t2[tierOf(t.rep)]||0)+1);console.log('  tiers after 6 seasons: '+JSON.stringify(t2));
ok(Object.keys(t2).length>=3,'still at least three tiers across the league');
UI.tab='table';render();ok(!bad(els.app.innerHTML),'table renders');
// an old 8-club save (v13) mid-season: plays out its 14-round season with the 16-club cup, then expands
newGame(2,teamNames());
const keep=[0,1,2,3,4,5,6,7,10,11,12,13,14,15,16,17];
S.teams=keep.map((id,i)=>({...S.teams[id],id:i}));S.teams.forEach(t=>delete t.rep);
S.fixtures=[genFixtures(divIds(0)),genFixtures(divIds(1))];S.results=[[],[]];S.cup={stage:0,ties:pairUp(shuffle(S.teams.map(t=>t.id))),rounds:[],winner:null};
delete S.friendlies;delete S.pre;  // saves from before the preseason week have neither
S.rival=pickRival();S.lineup=autoPick(my(),S.formation);S.day=nextMatchDay();S.v=13;
store[KEY]=JSON.stringify(S);loadSaveText(store[KEY]);
ok(S.v===SAVE_V&&rounds()===14&&cupFmt().names.length===4&&S.teams.every(t=>t.rep>0),'old save loads: 14 rounds, 16-club cup, 底蕴 estimated');
play();ok(S.cup.winner!=null&&S.cup.rounds.length===4,'old-format season and cup finish');
newSeason();
ok(DIVS.every((_,d)=>divSize(d)===DIV_SIZES[d])&&rounds(0)===18&&S.cup.fmt.names[1]==='三十二强','next season: expanded to 10 / 12 / 14 with the 36-club cup');
ok(S.news.some(n=>/联赛扩军/.test(n.t)),'expansion is announced: '+(S.news.find(n=>/联赛扩军/.test(n.t))||{}).t);
const ids=S.teams.map(t=>t.id);ok(ids.every((id,i)=>id===i),'team ids stay aligned with their index');
play();ok(true,'a full expanded season plays');
`);
