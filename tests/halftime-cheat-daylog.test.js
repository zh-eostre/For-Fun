// The halftime cheat (our players only) and the day log that adds up until the next match.
require('./harness').run(`
const btn=()=>({dataset:{},textContent:'',isConnected:true});
newGame(4,teamNames());
// day log: several single days add up, gains go to the news
let days=0;S.training='hard';
const n0=S.news.length;
while(S.day+1<nextMatchDay()){ACT.nextDay();days++}
ok(UI.dayLog.days===days,'clicking 下一天 '+days+' times: the log covers '+UI.dayLog.days+' days');
const gains=UI.dayLog.trained.length;
ok(gains===0||S.news.some(n=>n.t.startsWith('训练成果')),'training gains reach the news ('+gains+')');
render();ok(new RegExp('过了 '+days+' 天').test(els.app.innerHTML)&&!bad(els.app.innerHTML),'calendar shows the running total');
ACT.ff();ok(UI.dayLog.days===days+1,'skipping to match day keeps adding to the same log');
// halftime cheat
S.event=null;S.offer=null;startMatch();
ACT.cheat('rest',btn());ok(!S.cheatUsed,'not usable before halftime');
while(!M.ht)tick(false);
const s=mySide(),mine=()=>onPitch(my(),M[s+'Ids']).filter(Boolean),opp=onPitch(S.teams[s==='h'?M.a:M.h],M[(s==='h'?'a':'h')+'Ids']).filter(Boolean);
ok(mine().some(p=>p.cond<100),'our players are tired at halftime');
render();ok(/刹那·圣泉/.test(els.app.innerHTML),'halftime panel offers the cheat');
const oppBefore=opp.map(p=>p.cond).join(),stored=store[KEY];
const b=btn();ACT.cheat('rest',b);ACT.cheat('rest',b);
ok(S.cheatUsed&&mine().every(p=>p.cond===100),'our players on the pitch are back to full');
ok(opp.map(p=>p.cond).join()===oppBefore,'the opponents are untouched');
ok(store[KEY]===stored,'nothing saved mid-match');
render();ok(!/刹那·圣泉<\\/button>/.test(els.app.innerHTML),'card spent: no button any more');
ACT.resume();skipMatch();ok(JSON.parse(store[KEY]).cheatUsed===true,'full time saves the card as spent');
// a full week between league rounds, one click at a time
ACT.matchDone();
while(S.round<1){if(S.event)ACT.event('0');if(S.offer)ACT.offerNo();ACT.ff();startMatch();skipMatch();ACT.matchDone()}
S.training='hard';let k=0;const before=S.news.filter(n=>n.t.startsWith('训练成果')).length;
while(S.day+1<nextMatchDay()){ACT.nextDay();k++}
const L=UI.dayLog,nl=S.news.filter(n=>n.t.startsWith('训练成果')).length-before;
ok(k>=5&&L.days===k,k+' clicks, the log covers '+L.days+' days, '+L.trained.length+' gains, '+nl+' news lines');
ok(L.trained.length===0||nl>0,'gains made one day at a time still reach the news');
render();ok(!bad(els.app.innerHTML),'log renders: '+(els.app.innerHTML.match(/过了[^<]*/)||[''])[0].slice(0,120));
`);
