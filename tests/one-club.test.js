// a club's own (its academy, its young players at the start) who never left are loyal after ONE_CLUB seasons, and a
// 一人一城 once they reach ONE_CLUB_OVR. ours: milestones in the news, half of clubs' approaches turned down; a
// 一人一城 also lifts the team at home, costs reputation to sell, gets a farewell and a panel in the honours room.
// at AI clubs both kinds never move; their 一人一城 make the news when crowned and when they retire.
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());UI.guide=null;
ok(S.teams.every(t=>t.players.every(p=>p.since===1&&(p.home===t.id)===(p.age<=21))),'a new game: the young ones count as their club\u2019s own');
const p=my().players.find(x=>x.pos==='MF'),q=my().players.find(x=>x.pos==='FW');p.home=q.home=S.my;p.ovr=q.ovr=82;  // say they came up here, and are good
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
for(let k=0;k<2000;k++){S.day=S.pre-6;rollOffer();if(offerFor(p.id))bids++}
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
p.hist=[{s:3,o:88},{s:4,o:86}];S.club[p.id].titles=['第 2 季甲级冠军','第 4 季甲级冠军','第 4 季'+INTL_NAME+'冠军'];retireLegend(p);const L=S.legends[S.legends.length-1];
ok(L.peak===88,'his peak ability is kept: '+L.peak);UI.tab='honours';render();ok(/巅峰 <b class="num">88<\\/b>/.test(els.app.innerHTML),'and shown among the legends');
ok(els.app.innerHTML.includes('🏆 甲级冠军 ×2、'+INTL_NAME+'冠军'),'with the trophies he won, counted');
ok(L&&L.name===p.name&&L.oneClub&&S.news.some(n=>/告别赛/.test(n.t)),'his retirement: a farewell, and a place among the legends');
// bought, however young: never one, even after years
const y=makePlayer('DF',82,19);joinClub(y,my(),false,1);my().players.push(y);ok(!loyal(y,my())&&!oneClub(y,my()),'bought at 19 and stayed: never one');
// one of ours under ONE_CLUB_OVR: loyal only, no lift; reaching it makes him one for good
const w=makePlayer('DF',70,24);joinClub(w,my(),true,1);w.youth=true;my().players.push(w);S.season=ONE_CLUB;
oneClubNews('season');ok(loyal(w,my())&&!oneClub(w,my())&&S.news.some(n=>n.t.includes(w.name)&&/🛡 忠诚/.test(n.t)),'ability 70: loyal, in the news, not 一人一城');
UI.tab='squad';render();ok(/tag2 loyal/.test(els.app.innerHTML),'tagged 忠诚 in the squad list');
w.ovr=ONE_CLUB_OVR;oneClubNews('apps');ok(oneClub(w,my())&&w.ocs&&S.news[0].t.includes(w.name)&&/登上巅峰/.test(S.news[0].t),'he reaches '+ONE_CLUB_OVR+': crowned 一人一城 in the news');
w.ovr=75;ok(oneClub(w,my()),'and keeps the name when he falls back');
// AI clubs: their loyal players and 一人一城 don't move, to us or anyone
const t=S.teams.find(x=>x.id!==S.my&&!x.foreign);S.season=Math.max(S.season,ONE_CLUB);
t.players.forEach(x=>{delete x.home;delete x.ocs});const [a,b]=t.players.filter(loyalKind),c=t.players.find(x=>!loyalKind(x));c.home=t.id;c.since=1;
ok(!loyal(c,t)&&!buyBlock(c,t).includes('终老'),'an AI academy player without it in him: not loyal, can be bought');[a,b].forEach(x=>{x.home=t.id;x.since=1});a.ovr=70;b.ovr=85;
ok(/终老/.test(buyBlock(a,t)||'')&&/终老/.test(buyBlock(b,t)||''),'an AI club\u2019s loyal player and 一人一城 are not for sale: '+buyBlock(a,t));
ACT.team(String(t.id));ok(/tag2 loyal/.test(els.app.innerHTML)&&/tag2 oneclub/.test(els.app.innerHTML),'tagged 忠诚 and 一人一城 on its team page');UI.pages=[];
S.teams.forEach(x=>{if(x.id!==S.my)x.players.forEach(z=>{if(z!==b)z.ocs=true})});  // only b is new this summer
aiOneClubNews([{p:b,t,n:9}]);ok(b.ocs&&S.news.some(n=>n.t.includes(b.name)&&/一人一城/.test(n.t)&&/✨/.test(n.t))&&S.news[0].t.includes(b.name)&&/挂靴/.test(S.news[0].t),'his crowning and his farewell make the news');
// an older save: our record says how long ours have been here; academy players are ours from the start
const old=JSON.parse(JSON.stringify(S));old.v=21;old.teams.forEach(tm=>tm.players.forEach(x=>{delete x.since;delete x.home}));
const k=old.teams[old.my].players[0];k.youth=true;old.club[k.id]={seasons:3};store[KEY]=JSON.stringify(old);const up=load();
const k2=up.teams[up.my].players.find(x=>x.id===k.id);ok(up.v===SAVE_V&&k2.since===up.season-3&&k2.home===up.my,'an older save: an academy player who has been with us 3 seasons');
// a v22 save: the young ones we bought lose the mark, the academy and the young ones from the start keep it
const o2=JSON.parse(JSON.stringify(S));o2.v=22;const ps=o2.teams[o2.my].players;ps.forEach(x=>{delete x.youth;x.since=1;x.home=o2.my});ps[0].since=3;ps[1].since=3;ps[1].youth=true;
store[KEY]=JSON.stringify(o2);const u2=load().teams[o2.my].players;
ok(u2[0].home==null&&u2[1].home===o2.my&&u2[2].home===o2.my,'a v22 save: bought young, the mark goes; academy and the start keep it');
`);
