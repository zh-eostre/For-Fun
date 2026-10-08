// Important moments in live play (our automatic changes, injuries, red cards, goals against, 绝境爆发) hold the
// match for a moment and show a card; skipping to the result does neither.
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());ACT.ff();S.event=null;S.offer=null;startMatch();clearTimeout(M.timer);
const s=mySide(),on=M[s+'Ids'].find(id=>id!=null&&M.role[id]==='MF'),inn=my().players.find(p=>!M[s+'XI'].includes(p.id)&&!unavail(p));
M.hold=0;substitute(on,inn.id,s,null,'tired');ok(M.hold>Date.now(),'an automatic change in live play holds the match');
M.hold=0;ACT.pauseSub();const b=my().players.find(p=>!M[s+'XI'].includes(p.id)&&!unavail(p)),o=M[s+'Ids'].find(id=>id!=null&&M.role[id]==='DF');
ACT.subOut(String(o));ACT.subIn(String(b.id));ok(!M.hold,'a change we make ourselves during a stop does not');
ACT.resume();clearTimeout(M.timer);
M.skip=true;M.hold=0;flag('red','🟥','x',1200);ok(!M.hold,'nothing while skipping to the result');
M.skip=false;flag('red','🟥','x',1200);ok(M.hold>Date.now()+1000,'a red card holds about a second');
M.skip=true;while(!M.done)tick(true);ok(M.done,'the match finishes');
`);
