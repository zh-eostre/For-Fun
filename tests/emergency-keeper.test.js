// Emergency keeper when none is available; playing short-handed; minimum of 7.
require('./harness').run(`

newGame(2,teamNames());S.friendlies.forEach(f=>f.res={hg:0,ag:0});  // straight to the league (a friendly ignores bans)
// both keepers out: one suspended for the league, one injured
my().players.filter(p=>p.pos==='GK').forEach((p,i)=>i?p.inj=5:p.bans={lg:1});
ACT.auto();const gk=findP(S.lineup[0]);
ok(gk&&gk.pos!=='GK'&&lineupIssues().length===0,'no keeper available: '+gk.name+' ('+POS[gk.pos]+') goes in goal, match can start');
UI.tab='squad';render();ok(/临时客串门将/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'squad page explains the emergency keeper');
ACT.ff();S.event=null;startMatch();ok(!!M,'match kicks off with the emergency keeper');skipMatch();M=null;UI.view='main';
// mass absences: only 9 fit players
newGame(2,teamNames());my().players.forEach((p,i)=>{if(i>=9)p.inj=10});ACT.auto();
ok(lineupCount()===9&&lineupIssues().length===0,'only 9 fit: plays with 9, no blocking issue');
ACT.ff();S.event=null;startMatch();ok(!!M&&M[mySide()+'Ids'].filter(x=>x!=null).length===9,'match starts 9 v 11');skipMatch();M=null;
my().players.forEach((p,i)=>{if(i>=6)p.inj=10});ACT.auto();ok(lineupIssues().some(x=>/不足 7 人/.test(x)),'below 7 fit players: blocked ('+lineupIssues()[0]+')');
// short-handed and no keeper: an outfield player still goes in goal, so the match can be played
newGame(12,teamNames());S.pre=0;S.day=10;
my().players.filter(p=>p.pos==='GK').forEach(p=>p.inj=20);my().players.filter(p=>p.pos!=='GK').slice(9).forEach(p=>p.inj=20);
ACT.auto();ok(findP(S.lineup[0])&&S.lineup.filter(x=>x!=null).length===9&&!lineupIssues().length,'9 fit outfield players, no keeper: one goes in goal and the match can start');
`);
