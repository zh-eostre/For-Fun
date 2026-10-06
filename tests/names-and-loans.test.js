// Fictional club names; loan destinations outside our divisions; old loans convert.
require('./harness').run(`

const names=teamNames().map(t=>t.name);console.log('  sample clubs:',names.slice(0,8).join(' '));
ok(new Set(names).size===16,'16 unique club names from fictional places');
newGame(2,teamNames());
const lg={};for(let i=0;i<400;i++){const o=30+i%40,h=loanHost({ovr:o});(lg[(o<50?'<50':'50+')]=lg[(o<50?'<50':'50+')]||{})[h.league]=1}
console.log('  loan leagues by ability:',JSON.stringify(lg));
ok(Object.keys(lg['<50']).sort().join()==='丙级联赛,外地联赛'&&Object.keys(lg['50+']).sort().join()==='外地联赛,海外联赛','below 50: 丙级/外地; 50+: 外地/海外');
const ourClubs=new Set(S.teams.map(t=>t.name));ok(Object.values(LOAN_LEAGUES).every(([l,cs])=>cs.every(c=>!ourClubs.has(c))),'no loan club is one of our 16');
const kid=my().players.filter(p=>p.age<=LOAN_AGE)[0];const b={dataset:{},textContent:'',isConnected:true};ACT.loan(String(kid.id),b);ACT.loan(String(kid.id),b);
UI.tab='squad';render();ok(new RegExp(loanLabel(kid)).test(els.app.innerHTML)&&!bad(els.app.innerHTML),'squad shows: 租借至'+loanLabel(kid));
ACT.player(String(kid.id));ok(/租借至/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'player page shows the loan');UI.pages=[];
// v10 save with an old-style loan (a team id) converts
const old=JSON.parse(JSON.stringify(S));old.v=10;old.teams[old.my].players.find(p=>p.id===kid.id).loan={club:12,ovr0:kid.ovr};
store[KEY]=JSON.stringify(old);const up=load();const k2=up.teams[up.my].players.find(p=>p.id===kid.id);
ok(up.v===SAVE_V&&typeof k2.loan.club==='string'&&k2.loan.league,'old loan to team 12 becomes '+k2.loan.league+'的'+k2.loan.club);
`);
