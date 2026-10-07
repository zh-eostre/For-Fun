// Changes made at halftime (or in a pause) can be redone or undone until play resumes, without using extra subs.
require('./harness').run(`
newGame(5,teamNames());ACT.ff();S.event=null;S.offer=null;S.autoSub=false;startMatch();clearTimeout(M.timer);
while(!M.ht)tick(false);
const s=mySide(),onP=()=>M[s+'Ids'].map(findP).filter(Boolean),benchP=()=>my().players.filter(p=>!M[s+'XI'].includes(p.id)&&!unavail(p));
const A=onP().find(p=>M.role[p.id]==='MF'),[B,C]=benchP().filter(p=>p.id!==A.id);
ACT.subOut(String(A.id));ACT.subIn(String(B.id));
ok(M.subs===1&&M[s+'Ids'].includes(B.id),'A off, B on: 1 change');
render();ok(/换回/.test(els.app.innerHTML),'A stays on the bench list as 换回');
// change of mind: take B off again for C — still one change, B never played
ACT.subOut(String(B.id));ACT.subIn(String(C.id));
ok(M.subs===1&&M[s+'Ids'].includes(C.id)&&!M[s+'XI'].includes(B.id)&&M.subLog.length===1&&M.subLog[0].in===C.id,'B swapped for C: still 1 change, B never played');
// bring A back in C's place: the change is cancelled
ACT.subOut(String(C.id));ACT.subIn(String(A.id));
ok(M.subs===0&&M[s+'Ids'].includes(A.id)&&!M[s+'XI'].includes(C.id)&&!(M.subLog||[]).length&&M.off[A.id]==null,'A back on: no change at all');
ok(!M.feed.some(e=>e.t.includes(B.name)||e.t.includes(C.name)),'no commentary left for the cancelled change');
// A can only come back in the slot of the man who replaced him
ACT.subOut(String(A.id));ACT.subIn(String(B.id));const D=onP().find(p=>p.id!==B.id&&M.role[p.id]!=='GK');
ACT.subOut(String(D.id));ACT.subIn(String(A.id));ok(M[s+'Ids'].includes(D.id)&&/只能换回/.test(els.toast.textContent),'A cannot come back for someone else');
M.sel=null;
// after play resumes the change is final: taking B off again uses a new substitution
ACT.resume();clearTimeout(M.timer);tick(false);ACT.pauseSub();
const E=benchP()[0];ACT.subOut(String(B.id));ACT.subIn(String(E.id));
ok(M.subs===2&&!M[s+'Ids'].includes(B.id),'after resuming, changes are final (2 subs used)');
ACT.resume();clearTimeout(M.timer);skipMatch();render();ok(M.done&&!bad(els.app.innerHTML),'match finishes cleanly');
`);
