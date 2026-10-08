// Loaned players do not count toward the 22-man squad; recall needs a free place.
require('./harness').run(`

const btn=()=>({dataset:{},textContent:'',isConnected:true});const twice=(k,a)=>{const b=btn();ACT[k](a,b);ACT[k](a,b)};
newGame(2,teamNames());S.budget=5000;
// fill the first team to 22 with market signings
while(squadSize()<22&&S.market.length){ACT.buy(String(S.market[0].id));UI.reveal=null}
ok(squadSize()===22,'first team full: 22');
const kids=my().players.filter(p=>p.age<=LOAN_AGE).sort((a,b)=>a.ovr-b.ovr).slice(0,2);
kids.forEach(k=>twice('loan',String(k.id)));
ok(squadSize()===20&&my().players.length===22,'loaning 2 out frees 2 places (registered '+squadSize()+', owned '+my().players.length+')');
refreshMarket();ACT.buy(String(S.market[0].id));ACT.buy(String(S.market[1].id));UI.reveal=null;
ok(squadSize()===22&&my().players.length===24,'can sign 2 more while they are away (owned '+my().players.length+')');
ACT.recall(String(kids[0].id));ok(kids[0].loan&&/已满/.test(els.toast.textContent),'recall blocked while full: "'+els.toast.textContent+'"');
UI.tab='squad';render();const h=els.app.innerHTML;
ok(/租借在外/.test(h)&&/一线队 <span[^>]*>22\\/22/.test(h)&&!bad(h),'squad page: 一线队 22/22 + separate 租借在外 list');
const listPart=h.slice(h.indexOf('一线队 <span'),h.indexOf('租借在外'));ok(!kids.some(k=>listPart.includes('data-arg="'+k.id+'" role="button"')),'loaned players are not in the first-team list');
ok(!(h.slice(h.indexOf('替补席'),h.indexOf('一线队 <span')).includes('data-flip="p'+kids[0].id+'"')),'loaned players are not on the bench');
// sell one, then recall works
const spare=my().players.find(p=>!p.loan&&!S.lineup.includes(p.id));twice('sell',String(spare.id));ACT.recall(String(kids[0].id));
ok(!kids[0].loan&&squadSize()===22,'after selling one, recall works');
// season end: the other one returns even though that makes 23
while(S.round<rounds()){ACT.ff();S.event=null;S.offer=null;S.lineup=autoPick(my(),S.formation);startMatch();skipMatch();M=null;UI.view='main'}
my().players.forEach(p=>p.age=Math.min(p.age,28));  // nobody retires, so the count is exact
newSeason();ok(!kids[1].loan&&squadSize()===23&&S.news.some(n=>/超过 22 人上限/.test(n.t)),'season end: loan returns, squad 23 with a warning');
refreshMarket();const n=my().players.length;ACT.buy(String(S.market[0].id));ok(my().players.length===n,'cannot sign while over 22');
`);
