// a player is rated, and shown, by where he played longest: a midfielder moved to the back late on by a change of
// shape (and then taken off) is still a midfielder; one who spent most of the match at the back shows "中→后"
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===1),teamNames());UI.guide=null;S.friendlies.forEach(f=>f.res={hg:0,ag:0});ffToMatch();S.event=null;S.offers=[];
ACT.form('3-5-2');S.lineup=autoPick(my(),'3-5-2');startMatch();clearTimeout(M.timer);M.skip=true;
const s=mySide();for(let i=0;i<70;i++)tick(false);
M.paused=true;changeMatchForm('4-4-2');const moved=onPitch(my(),M[s+'Ids']).find(p=>p&&p.pos==='MF'&&M.role[p.id]==='DF');
ok(moved,'a change to four at the back puts a midfielder in defence: '+(moved&&moved.name));
const bench=my().players.find(p=>p.pos==='DF'&&!M[s+'XI'].includes(p.id)&&!unavail(p));
if(bench)ok(substitute(moved.id,bench.id,s),'and then he is taken off for a defender');
M.paused=false;while(!M.done){if(M.pk)pkStep();else tick(false)}
const r=(s==='h'?M.rh:M.ra).find(x=>x.p.id===moved.id);
ok(r&&r.role==='MF','rated as a midfielder (70 minutes there), not as a defender: '+(r&&r.role));
ok(roleTag({p:moved,role:'MF'})==='中'&&roleTag({p:moved,role:'DF'})==='中→后','the label: his own line, or 中→后 when he spent most of it elsewhere');
render();ok(!bad(els.app.innerHTML),'the full-time screen renders');
`);
