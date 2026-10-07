// Players taken off stay visible: greyed at the end of the live stamina list and under the bench as 已换下.
require('./harness').run(`
newGame(5,teamNames());ACT.ff();S.event=null;S.offer=null;S.autoSub=false;startMatch();clearTimeout(M.timer);
while(M.min<50)tick(false);if(M.ht)ACT.resume();clearTimeout(M.timer);
ACT.pauseSub();const s=mySide(),A=M[s+'Ids'].map(findP).find(p=>p&&M.role[p.id]==='MF'),B=my().players.find(p=>!M[s+'XI'].includes(p.id)&&!unavail(p));
ACT.subOut(String(A.id));ACT.subIn(String(B.id));render();
ok(!/已换下/.test(els.app.innerHTML),'a change still open in this pause shows as 换回, not 已换下');
ACT.resume();clearTimeout(M.timer);tick(false);render();
const h=els.app.innerHTML;
const q=String.fromCharCode(39),mark='↓50'+q+'</small> '+pName(A);
ok(h.includes('class="lc gone"><span class="lc-n">')&&h.includes(mark),'live stamina list keeps '+A.name+', greyed, with the minute he went off');
ACT.pauseSub();render();ok(/已换下/.test(els.app.innerHTML)&&els.app.innerHTML.includes(pName(A)),'the pause panel lists him under 已换下');
ACT.resume();clearTimeout(M.timer);skipMatch();render();ok(!bad(els.app.innerHTML),'match finishes cleanly');
`);
