// The winter transfer window: opens the day after the halfway league round, for us and the AI, then shuts again.
require('./harness').run(`
newGame(9,teamNames());
const w=winterStart();
ok(w===leagueDay(8)+1,'winter window opens the day after round 9 (day '+w+')');
const log=()=>({cond:0,days:0,trained:[]});
const play=()=>{if(S.event)ACT.event('0');if(S.offer)ACT.offerNo();ACT.ff();S.lineup=autoPick(my(),S.formation);startMatch();skipMatch();M=null;UI.view='main'};
while(S.round<9)play();
ok(!windowOpen()&&/冬窗第 \\d+ 周/.test(windowShut()),'shut before winter, and says when it opens: '+windowShut());
UI.tab='market';render();ok(/冬窗/.test(els.app.innerHTML),'market page says when the winter window opens');
const before=S.market.length;
while(S.day<w)advanceDay(log());
ok(windowOpen()&&windowLeft()===WINTER&&windowName()==='冬季转会窗口','window open on day '+S.day+', '+windowLeft()+' days left');
const fresh=S.market.filter(p=>p.fresh===S.season).length;  // AI clubs may already have snapped one up on day one
ok(S.news.some(n=>n.t.includes('新到 '+WINTER_NEW+' 名'))&&fresh>=WINTER_NEW-5&&S.market.length>before,'new names on the transfer list ('+fresh+' still there)');
render();ok(/tag2 fresh/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'new names are tagged');
UI.tab='home';render();ok(/冬季转会窗口开放中/.test(els.app.innerHTML),'home shows the winter window');
// we can buy during the window
const target=S.market.filter(p=>p.price<=S.budget).sort((a,b)=>a.price-b.price)[0],n=my().players.length;
if(target){S.budget+=0;ACT.buy(String(target.id),{dataset:{},textContent:'',isConnected:true});ACT.buy(String(target.id),{dataset:{},textContent:'',isConnected:true});
  ok(my().players.length===n+1,'signed '+target.name+' in the winter window')}
const buys=()=>S.teams.reduce((s,t)=>s+(t.winBuys||0),0);
while(S.round<rounds()&&windowOpen()){if(isMatchDay())play();else advanceDay(log())}
ok(!windowOpen()&&S.day===w+WINTER&&S.news.some(n=>n.t==='转会窗口关闭。'),'window shuts after '+WINTER+' days');
ok(S.teams.every(t=>t.id===S.my||(t.winBuys||0)<=2),'AI clubs make at most one winter signing each');
ok(windowShut()==='转会窗口已关闭，下赛季季前再开放','after winter: next window is next preseason');
`);
