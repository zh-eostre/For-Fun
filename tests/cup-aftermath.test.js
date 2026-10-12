// After we go out of a cup its remaining rounds stay on the season list and the calendar (the final names its
// winner); a cup final puts its result at the top of the club page for a week, and in the news.
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());UI.guide=null;
const step=()=>{if(S.event)ACT.event('0');ACT.ff();S.event=null;S.lineup=autoPick(my(),S.formation);startMatch();skipMatch();ACT.matchDone()};
// play until we're out of the 天穹杯 (our squad made weak so it happens)
my().players.forEach(p=>p.ovr=Math.min(p.ovr,45));
let g=0;while(cupAlive()&&!seasonDone()&&g++<80)step();
ok(!cupAlive(),'out of the 天穹杯');
UI.tab='home';render();let h=els.app.innerHTML;
const left=cupAfterExit();ok(left.length>0&&left.every(x=>x.kind.startsWith(CUP_NAME)),'its remaining rounds: '+left.map(x=>x.kind.split('·')[1]).join('、'));
ok(left.some(x=>h.includes(x.kind))&&/本队已出局/.test(h),'they are on the season list, marked 本队已出局');
// play on to the final
g=0;while(S.cup.winner==null&&!seasonDone()&&g++<80)step();
ok(S.cup.winner!=null,'the cup is won: '+S.teams[S.cup.winner].name);
ok(S.headline&&S.headline.cup===CUP_NAME&&S.headline.winner===S.cup.winner,'the final is the headline');
ok(S.news.some(n=>n.t.includes('夺得'+CUP_NAME+'冠军')),'and in the news');
UI.tab='home';render();h=els.app.innerHTML;
if(S.day-S.headline.day<=7)ok(/class="headline/.test(h)&&h.includes(S.teams[S.cup.winner].name+' 夺冠'),'the club page shows it at the top');else ok(true,'(more than a week ago)');
ok(h.includes('冠军：'+S.teams[S.cup.winner].name),'the season list names the winner at the final');
S.day=S.headline.day+8;render();ok(!/class="headline/.test(els.app.innerHTML),'a week on, the headline is gone');
`);
