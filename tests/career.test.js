// Manager career: reputation from results, offers from bigger clubs, moving clubs cleanly, old-save migration.
require('./harness').run(`
const season=()=>{while(!seasonDone()){ffToMatch();S.event=null;S.offer=null;S.lineup=autoPick(my(),S.formation);startMatch();if(!M)throw 'stuck '+lineupIssues();skipMatch();M=null;UI.view='main'}};
newGame(15,teamNames());ok(S.mgr.rep===15&&mgrTitle(15)==='无名之辈','new manager: reputation 15, 无名之辈');
const log=[];let offersSeen=null;
for(let s=0;s<7&&!offersSeen;s++){
  my().players.forEach(p=>{p.ovr=Math.max(p.ovr,84);p.pot=Math.max(p.pot,p.ovr)});  // a dominant squad
  season();log.push('S'+S.season+' '+DIVS[my().div]+'#'+myRank()+' 声望 '+S.mgr.rep+'('+(S.mgr.last>=0?'+':'')+S.mgr.last+') 邀请 '+(S.jobOffers||[]).length);
  if((S.jobOffers||[]).length)offersSeen=S.jobOffers;else newSeason();
}
console.log('  '+log.join('\\n  '));
ok(S.mgr.rep>15,'reputation grew with success');
const nd=t=>{const r=table(t.div).findIndex(x=>x.id===t.id)+1,z=zone(t.div,r);return t.div+(z==='up'?-1:z==='down'?1:0)};
ok(offersSeen&&offersSeen.every(o=>{const t=S.teams[o.club];return t.id!==S.my&&jobReq(t)<=S.mgr.rep&&nd(t)<=nd(my())&&(nd(t)<nd(my())||t.rep>my().rep+5)}),'offers come from bigger clubs we qualify for, judged by the division they play in next season');
render();ok(/执教邀请|想请你执教/.test(els.app.innerHTML)&&/data-act="takeJob"/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'season end shows the offers');
// accept the first offer
const old=my(),o=offersSeen[0],target=S.teams[o.club];old.players[0].loan={club:'x',league:'y',ovr0:50};
old.players.filter(p=>p.pos==='GK').slice(1).forEach(p=>old.players.splice(old.players.indexOf(p),1));  // down to one keeper: the trim must sign another
while(squadSize()<SQUAD_MAX){const p=makePlayer(pick(['DF','MF','FW']),60,ri(20,30));my().players.push(p)}  // a full 25 plus one on loan
const b={dataset:{},textContent:'',isConnected:true};ACT.takeJob(String(o.club),b);ACT.takeJob(String(o.club),b);
ok(S.my===target.id&&S.budget===o.budget,'moved to '+target.name+' with budget '+money(o.budget));
ok(S.rival!==S.my&&S.teams[S.rival].div===my().div,'new rival in our new division');
ok(old.players.every(p=>!p.loan),'loans at the old club came home');
{const n={GK:0,DF:0,MF:0,FW:0};old.players.forEach(p=>n[p.pos]++);const gone=S.market.filter(p=>p.ex===old.name);
  ok(old.players.length===AI_SQUAD_MAX&&n.GK>=2&&n.DF>=5&&n.MF>=5&&n.FW>=3,'the club we left is back to '+old.players.length+' with every line covered');
  ok(gone.length>=1&&gone.every(p=>p.price>0&&p.scout&&!p.youth),gone.length+' released players are on the transfer list');
  ok(S.news.some(x=>x.t.includes(old.name+'清理阵容')),'the news says so');
  UI.tab='market';render();ok(/挂牌的老部下/.test(els.app.innerHTML)&&gone.every(p=>els.app.innerHTML.includes(p.name)),'the market lists them as 老部下');UI.tab='home';}
ok(S.fac.scout===clamp(1+Math.floor(target.rep/25),1,5)&&S.academy.intake.length>0,'new club facilities (level '+S.fac.scout+') and a fresh academy intake');
ok(lineupIssues().length===0&&S.lineup.every(id=>id==null||findP(id)),'lineup is from the new squad');
ok(!S.jobOffers,'offers cleared');
season();newSeason();ok(S.history.length>=2&&S.history[S.history.length-1].club===target.name,'a full season at the new club, recorded under its name');
UI.tab='honours';render();ok(/执教生涯/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'honours room shows the career');
// staying is the default
newGame(16,teamNames());season();const stayId=S.my;newSeason();ok(S.my===stayId,'starting the next season without accepting keeps us at our club');
// v14 save gets an estimated reputation
const o14=JSON.parse(JSON.stringify(S));o14.v=14;delete o14.mgr;o14.history=[{season:1,div:1,rank:1,pts:40},{season:2,div:0,rank:3,pts:30}];
store[KEY]=JSON.stringify(o14);const u=load();ok(u.v===SAVE_V&&u.mgr.rep>15&&u.history.every(h=>h.club),'v14 save: reputation '+u.mgr.rep+' estimated, history credited to the club');
`);
