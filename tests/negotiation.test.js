// negotiating with an AI club: pay the price, haggle (taken or turned down: then no more haggling this window, and a
// cheeky offer puts the price up), or a part-exchange with one of ours counted at his sale value
require('./harness').run(`
const btn=()=>({dataset:{},textContent:'',isConnected:true}),twice=(k,a)=>{const b=btn();ACT[k](a,b);ACT[k](a,b)};
newGame(TEAMS.map((t,i)=>[t,i]).filter(([t])=>t.div===0).sort((a,b)=>b[0].rep-a[0].rep)[0][1],teamNames());UI.guide=null;S.budget=99999;
const choose=t=>t.players.find(p=>p.pos!=='GK'&&!buyBlock(p,t,false));
const clubs=S.teams.filter(t=>!t.foreign&&t.id!==S.my&&t.players.length>15&&choose(t));
const real=Math.random;
// a 10% offer taken
let t=clubs[0],p=choose(t),full=dealPrice(p,t);Math.random=()=>0;const b0=S.budget;
ok(makeOffer(p.id,1)==='yes'&&findP(p.id)&&S.budget===b0-Math.round(full*.9),'a 10% haggle taken: '+money(Math.round(full*.9))+' instead of '+money(full));
// a 20% offer turned down: the price goes up, no more haggling
t=clubs[1];p=choose(t);full=dealPrice(p,t);Math.random=()=>.99;
ok(makeOffer(p.id,2)==='no'&&!findP(p.id)&&dealPrice(p,t)===Math.round(full*(1+HAGGLE_UP))&&S.news[0].t.includes(p.name),'a cheeky offer turned down: his price up '+Math.round(HAGGLE_UP*100)+'%, in the news');
ok(makeOffer(p.id,1)===undefined&&!findP(p.id),'no more haggling over him this window');
ACT.bid(String(p.id));ok(/本窗口不再接受还价/.test(els.app.innerHTML)&&/按要价签下/.test(els.app.innerHTML),'the dialog says so');
Math.random=()=>.99;ok(makeOffer(p.id,0)==='yes'&&findP(p.id),'but the full price still buys him');Math.random=real;UI.modal=null;
// a part-exchange
t=clubs[2];p=choose(t);full=dealPrice(p,t);const sw=swapsFor(p,t);
ok(sw.length&&sw.every(x=>x.q.age<=SWAP_AGE&&x.q.ovr>=xiLevel(t)-SWAP_BELOW),'part-exchange: '+sw.length+' of ours they would take');
const give=sw[0].q,cash=Math.max(0,full-sw[0].credit),b1=S.budget,n=my().players.length;
ACT.bid(String(p.id));ok(/球员加钱交换/.test(els.app.innerHTML)&&els.app.innerHTML.includes(give.name),'the dialog offers them');
twice('swap',p.id+':'+give.id);
ok(findP(p.id)&&!findP(give.id)&&t.players.includes(give)&&S.budget===b1-cash&&my().players.length===n,'he joins, ours goes the other way, '+money(cash)+' on top');
ok(S.news[0].t.includes('交易达成')&&!bad(els.app.innerHTML),'a deal in the news');
// a player they'd not take: too old
const old=my().players.find(x=>x.age>SWAP_AGE);if(old){const p2=choose(t);ok(!swapsFor(p2,t).some(x=>x.q===old),'a veteran over '+SWAP_AGE+' is no use to them')}
// a new window: haggling again
const q=clubs[3].players.find(x=>x.pos!=='GK');q.hg={w:'0:s',up:.05};ok(!haggled(q)&&dealPrice(q,clubs[3])===askPrice(q,clubs[3]),'last window\\u2019s quarrel is forgotten');
`);
