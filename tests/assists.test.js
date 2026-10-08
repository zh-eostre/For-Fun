// Assists: about 78% of goals, mostly midfielders, shown on a board, an award, and not counted in friendlies.
require('./harness').run(`
newGame(12,teamNames());
// friendlies: goals and assists show in the match but not in season tallies
let fg=0;while(nextFriendly()){ACT.ff();S.event=null;S.offer=null;startMatch();skipMatch();fg+=M.hg+M.ag;M=null;UI.view='main'}
const all=()=>S.teams.flatMap(t=>t.players);
ok(all().every(p=>!p.goals&&!p.ast),'friendlies ('+fg+' goals) add no season goals or assists');
while(S.round<rounds()){ACT.ff();S.event=null;S.offer=null;S.lineup=autoPick(my(),S.formation);startMatch();skipMatch();
  if(S.round===3)console.log('  a goal line: '+(M.feed.find(e=>/助攻/.test(e.t))||{t:'(no assisted goal this match)'}).t);
  M=null;UI.view='main'}
const goals=all().reduce((s,p)=>s+p.goals,0),ast=all().reduce((s,p)=>s+(p.ast||0),0),ratio=ast/goals;
ok(ratio>.7&&ratio<.86,'assists on '+Math.round(ratio*100)+'% of '+goals+' goals');
const byPos={};all().forEach(p=>byPos[p.pos]=(byPos[p.pos]||0)+(p.ast||0));console.log('  assists by position: '+JSON.stringify(byPos));
ok(byPos.MF>byPos.FW&&byPos.FW>byPos.DF&&byPos.DF>byPos.GK,'midfielders assist most, keepers least');
const r0=S.round;S.round=rounds()-1;  // the table page (the season-end page has no leaderboards)
UI.tab='table';render();ok(new RegExp('data-act="lb" data-arg="'+my().div+':ast"').test(els.app.innerHTML),'data panel has a 助攻 switch');
ACT.lb(my().div+':ast');const h=els.app.innerHTML;ok(/助攻榜/.test(h)&&!/射手榜/.test(h)&&!bad(h),'switching shows the 助攻榜');
S.round=r0;
const aw=seasonAwards(my().div);ok(aw.ast&&/次助攻/.test(aw.ast.stat),'助攻王 award: '+aw.ast.name+'（'+aw.ast.stat+'）');
newSeason();ok(all().every(p=>!p.ast),'assists reset for the new season');
UI.tab='squad';render();ok(/球 \\d+ 助/.test(els.app.innerHTML),'squad list shows goals and assists');
`);
