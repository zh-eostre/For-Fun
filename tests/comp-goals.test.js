// goals and assists are kept per competition: the league's boards and awards count the league alone; the cup page
// has each cup's scorers; a player's page splits them
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===1),teamNames());UI.guide=null;
const p=my().players.find(x=>x.pos==='FW');
COMP='cup';countStat(p,'goals');countStat(p,'goals');countStat(p,'ast');COMP='lg';countStat(p,'goals');COMP=null;
ok(p.goals===3&&compStat(p,'goals','lg')===1&&compStat(p,'goals','cup')===2&&compStat(p,'ast','cup')===1&&compStat(p,'ast','lg')===0,'3 goals: 1 in the league, 2 in the cup (and a cup assist)');
// AI matches count by competition too
const [h,a]=domestic().filter(t=>t.id!==S.my).slice(0,2).map(t=>t.id),r=quickSim(h,a,'cup');
const cupGoals=[h,a].flatMap(id=>S.teams[id].players).reduce((s,x)=>s+compStat(x,'goals','cup'),0);
ok(cupGoals===r.hg+r.ag,'an AI cup tie: its '+(r.hg+r.ag)+' goals are cup goals');
// boards: a cup-only scorer is not on the league's board, but is on the cup's
const q=my().players.find(x=>x.pos==='MF');q.goals=9;q.cupG={cup:9};
UI.tab='table';render();{const h=els.app.innerHTML,i=h.indexOf('射手榜'),lb=h.slice(i,h.indexOf('</ol>',i));ok(i>0&&!lb.includes(q.name),'his 9 cup goals are not on the league\u2019s board')}
ok(/射手榜 <span class="muted"[^>]*>只算联赛/.test(els.app.innerHTML),'the league boards say they count the league alone');
UI.tab='cup';UI.cupv='dom';render();ok(new RegExp(CUP_NAME+'射手榜').test(els.app.innerHTML)&&els.app.innerHTML.includes(q.name),'the cup page has the cup\\u2019s scorers, with him');
// awards: the golden boot is the league's
const b=seasonAwards(my().div).boot;ok(!b||b.name!==q.name||compStat(q,'goals','lg')>0,'the golden boot ignores cup goals'+(b?' ('+b.name+' '+b.stat+')':''));
// his page splits them
ACT.player(String(p.id));ok(new RegExp('联赛 1 球 0 助 · '+CUP_NAME+' 2 球 1 助').test(els.app.innerHTML),'his page: 联赛 1 球 0 助 · '+CUP_NAME+' 2 球 1 助');UI.modal=null;
// a new season starts them afresh
S.round=rounds();newSeason();ok(!p.cupG&&!p.cupA&&!q.cupG&&p.goals===0,'a new season starts afresh');
`);
