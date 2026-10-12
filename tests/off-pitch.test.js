// The live stamina list shows only the men on the pitch; the pause panel lists those taken off under 已下场.
require('./harness').run(`
newGame(5,teamNames());ffToMatch();S.event=null;S.offer=null;S.autoSub=false;startMatch();clearTimeout(M.timer);
while(M.min<50)tick(false);if(M.ht)ACT.resume();clearTimeout(M.timer);
ACT.pauseSub();const s=mySide(),A=M[s+'Ids'].map(findP).find(p=>p&&M.role[p.id]==='MF'),B=my().players.find(p=>!M[s+'XI'].includes(p.id)&&!unavail(p));
ACT.subOut(String(A.id));ACT.subIn(String(B.id));render();
const h0=els.app.innerHTML,i0=h0.indexOf('gone-row'),goneRow=i0<0?'':h0.slice(i0,h0.indexOf('</div>',i0));
ok(!goneRow.includes(pName(A))&&/换回/.test(els.app.innerHTML),'a change still open in this pause shows as 换回, not under 已下场');
ACT.resume();clearTimeout(M.timer);tick(false);render();
const h=els.app.innerHTML;
ok(!h.includes(pName(A)+'</span>')||!/class="lc gone"/.test(h),'the live stamina list only shows players on the pitch');
ok(h.includes(pName(B)),'the sub who came on is in the live stamina list');
ACT.pauseSub();render();ok(/已下场/.test(els.app.innerHTML)&&els.app.innerHTML.includes(pName(A)),'the pause panel lists him under 已下场');
ACT.resume();clearTimeout(M.timer);skipMatch();render();ok(!bad(els.app.innerHTML),'match finishes cleanly');
`);
