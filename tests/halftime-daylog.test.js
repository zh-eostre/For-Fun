// The halftime stamina perk (our players only) and the day log that adds up until the next match.
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
// halftime perk: our players on the pitch win back a little stamina, the opponents don't
S.event=null;S.offer=null;startMatch();
while(M.min<44)tick(false);
const s=mySide(),mine=()=>onPitch(my(),M[s+'Ids']).filter(Boolean),opp=()=>onPitch(S.teams[s==='h'?M.a:M.h],M[(s==='h'?'a':'h')+'Ids']).filter(Boolean);
const condBefore=new Map(mine().map(p=>[p.id,p.cond])),oppBefore=new Map(opp().map(p=>[p.id,p.cond]));
tick(false);
const gain=mine().map(p=>p.cond-condBefore.get(p.id)),oppGain=opp().map(p=>p.cond-oppBefore.get(p.id));
ok(M.ht&&gain.every(g=>g>=1&&g<=10),'our players get a little back at halftime: '+gain.join(','));
ok(oppGain.every(g=>g<=0),'the opponents only tire: '+oppGain.join(','));
ok(M.feed.some(e=>e.t.includes('缓过一口气')),'commentary mentions it');
render();ok(!/刹那/.test(els.app.innerHTML),'no cheat button at halftime');
// bench cards: picking a midfielder on the pitch marks same-position subs and shows the stamina they'd bring
const mfOn=M[s+'Ids'].find(id=>M.role[id]==='MF');ACT.subOut(String(mfOn));render();
const h=els.app.innerHTML,cards=h.match(/class="scard[^"]*"/g)||[];
ok(cards.length>0&&cards.some(c=>/fit/.test(c))===my().players.some(p=>p.pos==='MF'&&!M[s+'XI'].includes(p.id)&&!unavail(p)),'bench cards mark same-position subs ('+cards.length+' cards)');
ok(/sc-gain/.test(h)&&/sc-ovr num pos-/.test(h),'cards show the stamina gain and a position-coloured rating');
M.sel=null;
ACT.resume();
// a change by hand in the second half, then full time lists every change with ↑ / ↓ marks
while(M.min<60)tick(false);M.paused=true;
const outP=mine()[3],inP=my().players.find(p=>!M[s+'XI'].includes(p.id)&&!unavail(p)&&p.pos===outP.pos)||my().players.find(p=>!M[s+'XI'].includes(p.id)&&!unavail(p));
ACT.subOut(String(outP.id));ACT.subIn(String(inP.id));ACT.resume();clearTimeout(M.timer);skipMatch();render();
const fh=els.app.innerHTML;
ok(M.subLog.some(x=>x.out===outP.id&&x.in===inP.id&&x.min===60&&!x.why),'our change is logged at minute 60');
ok(new RegExp('换人 '+M.subs+'/'+SUBS).test(fh)&&/↑60'/.test(fh)&&/↓60'/.test(fh)&&!bad(fh),'full time shows the changes and marks who came on and off');
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
