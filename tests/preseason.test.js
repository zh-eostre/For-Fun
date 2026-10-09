// Preseason week: transfer window (us and AI), two friendlies, a fixed season transfer list with pages.
require('./harness').run(`
const btn=()=>({dataset:{},textContent:'',isConnected:true});
// moves to a day, playing any match met on the way
const toDay=n=>{let g=0;while(S.day<n&&g++<50){const log={days:0,cond:0,trained:[],healed:[]};if(!advanceDay(log)){S.event=null;startMatch();if(!M)throw 'stuck '+lineupIssues();skipMatch();M=null;UI.view='main'}}};
newGame(3,teamNames());S.budget=3000;S.event=null;
ok(S.pre===7&&windowOpen()&&S.friendlies.length===2&&S.market.length===36,'new game: 7-day window, 2 friendlies, 36-player list');
ok(S.friendlies.every(f=>S.teams[f.opp].div!==my().div),'friendlies are against the other division');
UI.tab='home';render();{const o=S.teams[S.friendlies[0].opp];ok(els.app.innerHTML.includes('对手'+DIVS[o.div])&&els.app.innerHTML.includes('友谊赛 · '+DIVS[o.div]),'the opponent\u2019s division is shown ('+DIVS[o.div]+')')}
ok(leagueDay(0)===12&&S.friendlies[0].day===2&&S.friendlies[1].day===5,'friendlies Wed and Sat, league starts '+dayLabel(leagueDay(0)));
// AI clubs do business during the week
const before=JSON.stringify(S.teams.map(t=>t.players.length));
let offers=0;const seen=new Set();
toDay(6);
ok(S.news.some(n=>/其他球队转会动态/.test(n.t)),'AI clubs signed players during the window');
// friendlies played without table, apps, cards or season ratings
ok(S.friendlies.every(f=>f.res)&&S.results.every(r=>r.length===0),'both friendlies played, league table untouched');
ok(my().players.every(p=>p.apps===0&&!p.rn&&!p.yc),'no appearances, ratings or bookings from friendlies');
// buy in the window: fine
const m0=S.market.length,p=S.market.find(x=>x.price<S.budget);ACT.buy(String(p.id));UI.reveal=null;ok(S.market.length===m0-1&&findP(p.id),'buying in the window works');
// window shuts on day 7
toDay(7);
ok(!windowOpen()&&S.news.some(n=>n.t==='转会窗口关闭。'),'window shut on day '+S.day);
const q=S.market[0],n0=my().players.length;ACT.buy(String(q.id));ok(my().players.length===n0&&/转会窗口已关闭/.test(els.toast.textContent),'buying after the window is refused');
const s=my().players.find(x=>!S.lineup.includes(x.id)),b=btn();ACT.sell(String(s.id),b);ACT.sell(String(s.id),b);ok(findP(s.id),'selling after the window is refused');
const other=S.teams.find(t=>t.id!==S.my);ok(/关闭/.test(buyBlock(other.players[0],other)),'buying from other clubs is refused');
// market list stays put through league matches; AI clubs stop signing
const list=JSON.stringify(S.market.map(x=>x.id)),squads=JSON.stringify(S.teams.filter(t=>t.id!==S.my).map(t=>t.players.map(x=>x.id).sort()));
for(let k=0;k<3;k++){ACT.ff();S.event=null;startMatch();skipMatch();M=null;UI.view='main'}
// nobody leaves the list (a surprise scout tip may add a hidden gem)
ok(JSON.parse(list).every(id=>S.market.some(x=>x.id===id)),'the season list does not change after matches');
ok(!S.offer,'no bids for our players outside the window');
const aiNews=S.news.filter(n=>/其他球队转会动态/.test(n.t)&&n.r.includes('第'+(S.round)+'轮'));ok(aiNews.length===0,'AI clubs do not sign players during the season');
// scouts add four
const m1=S.market.length;ACT.scout();ok(S.market.length===m1+4,'scouting adds 4 players to the list');
// pages
UI.tab="market";UI.mpage=0;render();let h=els.app.innerHTML;
ok(/第 1\\/\\d+ 页/.test(h)&&(h.match(/data-act="buy"/g)||[]).length===12&&/转会窗口已关闭/.test(h)&&!bad(h),'market shows 12 per page, page count, closed-window banner');
ACT.mpage('1');h=els.app.innerHTML;ok(/第 2\\/\\d+ 页/.test(h),'page 2');ACT.mf('pos:GK');ok(UI.mpage===0,'changing a filter goes back to page 1');
// next season: window and list reopen
while(S.round<rounds()){ACT.ff();S.event=null;S.offer=null;S.lineup=autoPick(my(),S.formation);startMatch();skipMatch();M=null;UI.view='main'}
newSeason();ok(windowOpen()&&S.day===0&&S.friendlies.every(f=>!f.res)&&JSON.stringify(S.market.map(x=>x.id))!==list,'next season: window open again, new friendlies, new list');
UI.tab='home';render();ok(/季前转会窗口开放中/.test(els.app.innerHTML)&&/友谊赛/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'home shows the window and the friendly');
`);
