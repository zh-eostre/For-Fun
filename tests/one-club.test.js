// 一人一城: players who came up at a club (or joined it at 20 or under) and never left take the name after ONE_CLUB
// seasons. ours: milestones in the news, a home lift, half of clubs' approaches turned down, a cost for selling one,
// a farewell when they retire, a panel in the honours room. at AI clubs: harder to prise away, dearer to buy.
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());UI.guide=null;
ok(S.teams.every(t=>t.players.every(p=>p.since===1&&(p.home===t.id)===(p.age<=21))),'a new game: the young ones count as their club\u2019s own');
const p=my().players.find(x=>x.pos==='MF'),q=my().players.find(x=>x.pos==='FW');p.home=q.home=S.my;  // say they came up here
ok(seasonsAt(p)===1&&!oneClub(p,my()),'first season: not yet');
// five seasons on: the sixth brings the name, the news and the title
S.season=ONE_CLUB;oneClubNews('season');
ok(oneClub(p,my())&&S.news.some(n=>n.t.includes(p.name)&&/一人一城/.test(n.t))&&S.ach.oneclub,'season '+ONE_CLUB+': 一人一城, in the news, title 城之守望者');
UI.tab='squad';render();ok(/tag2 oneclub/.test(els.app.innerHTML),'tagged in the squad list');
ACT.player(String(p.id));ok(/一人一城 · 效力第 6 季/.test(els.app.innerHTML),'and in his dialog');UI.modal=null;
UI.tab='honours';render();ok(/<h2>一人一城<\\/h2>/.test(els.app.innerHTML)&&els.app.innerHTML.includes(p.name),'the honours room lists him');
// a hundred appearances
S.club[p.id]={name:p.name,pos:p.pos,goals:0,apps:99,seasons:5};p.apps=1;delete p.bk;oneClubNews('apps');ok(S.news[0].t.includes('第 100 场'),'his 100th match is in the news');
// clubs' approaches: about half turned down
let refused=0,bids=0;my().players.forEach(x=>{x.inj=0;x.bans={}});
const nw=news;news=t=>{if(t.includes(p.name)&&/回绝/.test(t))refused++;nw(t)};  // count every approach turned down
for(let k=0;k<600;k++){S.day=S.pre-6;rollOffer();if(offerFor(p.id))bids++}
news=nw;
ok(refused>0&&bids>0&&refused/(refused+bids)>.3&&refused/(refused+bids)<.7,'about half the approaches turned down ('+refused+' refused, '+bids+' bids)');
// the home lift: a 一人一城 on the pitch at home
S.season=ONE_CLUB;S.offers=[];S.friendlies.forEach(f=>f.res={hg:0,ag:0});ffToMatch();S.event=null;
S.lineup=autoPick(my(),S.formation);if(!S.lineup.includes(p.id)){const i=S.lineup.findIndex((id,j)=>slotRoles(S.formation)[j]==='MF');S.lineup[i]=p.id}
startMatch();clearTimeout(M.timer);M.skip=true;
if(M.h===S.my){ok(totem()===ONE_CLUB_AURA*Math.min(2,onPitch(my(),M.hIds).filter(x=>x&&oneClub(x,my())).length)||totem()===ONE_CLUB_AURA_MAX,'主场图腾: +'+totem());const b=myBoost();ok(b.def>=totem(),'it lifts defence and attack')}
else ok(totem()===0,'away from home: no lift');
skipMatch();ACT.matchDone();
// selling one costs reputation
S.mgr.rep=20;const r0=S.mgr.rep;S.day=1;const btn={dataset:{},textContent:'',isConnected:true};ACT.sell(String(q.id),btn);ACT.sell(String(q.id),btn);
ok(!findP(q.id)&&S.mgr.rep===r0-ONE_CLUB_SALE_REP&&S.news.some(n=>/球迷愤怒/.test(n.t)),'selling a 一人一城: the fans are angry, reputation -'+ONE_CLUB_SALE_REP);
// retiring: a farewell, and he joins the legends as one
retireLegend(p);const L=S.legends[S.legends.length-1];
ok(L&&L.name===p.name&&L.oneClub&&S.news.some(n=>/告别赛/.test(n.t)),'his retirement: a farewell, and a place among the legends');
// a player signed at 22 is never one, even after years
const m=makePlayer('DF',60,22);joinClub(m,my(),m.age<=20,1);my().players.push(m);ok(!oneClub(m,my()),'signed at 22: never 一人一城');
const y=makePlayer('DF',55,19);joinClub(y,my(),y.age<=20,1);my().players.push(y);ok(oneClub(y,my()),'signed at 19 and stayed: 一人一城');
// AI clubs: their loyal players don't move, to us or anyone
const t=S.teams.find(x=>x.id!==S.my&&!x.foreign),a=t.players[0];a.home=t.id;a.since=1;S.season=Math.max(S.season,ONE_CLUB);
ok(/终老/.test(buyBlock(a,t)||''),'an AI club\u2019s loyal player is not for sale: '+buyBlock(a,t));
ACT.team(String(t.id));ok(/tag2 loyal/.test(els.app.innerHTML)&&!/tag2 oneclub/.test(els.app.innerHTML),'tagged 忠诚 on its team page (一人一城 is ours alone)');UI.pages=[];
// an older save: our record says how long ours have been here; academy players are ours from the start
const old=JSON.parse(JSON.stringify(S));old.v=21;old.teams.forEach(tm=>tm.players.forEach(x=>{delete x.since;delete x.home}));
const k=old.teams[old.my].players[0];k.youth=true;old.club[k.id]={seasons:3};store[KEY]=JSON.stringify(old);const up=load();
const k2=up.teams[up.my].players.find(x=>x.id===k.id);ok(up.v===SAVE_V&&k2.since===up.season-3&&k2.home===up.my,'an older save: an academy player who has been with us 3 seasons');
`);
