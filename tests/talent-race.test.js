// The market's young talents and the big clubs: fewer talents on harder difficulties; a rumour three days before a
// window ends names the one a big club is after (tagged on the market, and fast-forward stops for it); on the last
// day he may be signed by that club, unless we bought him first.
require('./harness').run(`
const toDay=d=>{while(S.day<d){S.event=null;S.offers=[];if(S.day===nextMatchDay()){S.lineup=autoPick(my(),S.formation);startMatch();skipMatch();ACT.matchDone()}else ACT.nextDay()}};
const talents=()=>S.market.filter(p=>p.age<=21&&shownPot(p)>=84);
newGame(TEAMS.findIndex(t=>t.div===2),teamNames(),'normal');UI.guide=null;
ok(DIFF.easy.talent>DIFF.normal.talent&&DIFF.normal.talent>DIFF.hard.talent&&DIFF.hard.grab>DIFF.easy.grab,'more talents and fewer grabs on 轻松, the reverse on 困难');
while(!talents().length)addToMarket(4);
toDay(S.pre-4);ok(!S.market.some(p=>p.eyed!=null),'early in the window nobody is after them');
toDay(S.pre-3);const eyed=S.market.filter(p=>p.eyed!=null);
ok(eyed.length===DIFF.normal.eyes&&eyed.every(p=>p.age<=21&&shownPot(p)>=84),'three days before the end: a rumour about '+eyed.map(p=>p.name).join('、'));
ok(S.news.some(n=>n.t.includes(eyed[0].name)&&/盯上|总监/.test(n.t)),'in the news');
UI.tab='market';UI.mf={...UI.mf,age:'all',pos:'all',sort:'pot'};UI.mpage=0;render();ok(/豪门盯上/.test(els.app.innerHTML),'tagged on the market');
// buy him first: he's ours, and no grab happens
const p=eyed[0];my().rep=95;S.budget+=marketPrice(p);ACT.buy(String(p.id));  // a club he'd joinok(findP(p.id)&&p.eyed==null,'we got there first');
toDay(S.pre-1);ok(findP(p.id),'the last day (the window\u2019s seventh) takes nothing from us');
// the grab itself, over many windows: about the difficulty's chance
let taken=0,tries=0;for(let k=0;k<40;k++){S.day=S.pre-3;S.market.forEach(x=>delete x.eyed);while(!talents().length)addToMarket(4);
  talentRace(2);const t=S.market.find(x=>x.eyed!=null);if(!t)continue;tries++;const before=S.market.length;talentRace(0);if(!S.market.includes(t))taken++}
ok(tries>30&&taken/tries>.35&&taken/tries<.75,'signed on the last day about '+Math.round(DIFF.normal.grab*100)+'% of the time ('+taken+'/'+tries+')');
// fast-forward stops for a rumour
newGame(TEAMS.findIndex(t=>t.div===2),teamNames(),'normal');UI.guide=null;while(!talents().length)addToMarket(4);
toDay(S.pre-4);while(talents().length<4)addToMarket(4);let stopped=false;for(let k=0;k<5&&!stopped;k++){ACT.ff();if(S.market.some(x=>x.eyed!=null)&&S.day===S.pre-3)stopped=true;S.offers=[]}
ok(stopped&&/天才少年/.test(els.toast.textContent),'fast-forward stops on the rumour: '+els.toast.textContent);
`);
