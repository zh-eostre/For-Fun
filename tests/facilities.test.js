// Scout department, physio room and training ground effects; facility upgrades; migration.
require('./harness').run(`


newGame(2,teamNames());S.budget=5000;
// scout department
const scoutStats=()=>{let n=0,young=0,high=0,inRange=0,gems=0;for(let i=0;i<300;i++){refreshMarket();n+=S.market.length;
  S.market.filter(p=>p.age<=23).forEach(p=>{young++;if(p.scout.conf==='high')high++;if(p.pot>=p.scout.lo&&p.pot<=p.scout.hi)inRange++});
  if(S.market.some(p=>p.pot>=88&&p.scout.conf==='low'&&p.scout.est<=77))gems++}
  return {market:(n/300).toFixed(1),highConf:(high/young*100).toFixed(0)+'%',truthInRange:(inRange/young*100).toFixed(0)+'%',gemRate:(gems/300*100).toFixed(0)+'%',refresh:scoutCost()}};
const s1=scoutStats();S.fac.scout=5;const s5=scoutStats();
console.log('  scout L1',JSON.stringify(s1));console.log('  scout L5',JSON.stringify(s5));
ok(+s5.market===16&&parseInt(s5.highConf)>parseInt(s1.highConf)+25&&s5.refresh===10,'scout L5: bigger market, more confident, cheaper');
UI.tab='home';render();ok(/球探情报/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'scout L5 shows the opponent report on the home page');
S.fac.scout=1;render();ok(!/球探情报：/.test(els.app.innerHTML),'scout L1 shows no opponent report');
// facilities page + upgrade action
UI.tab='fac';render();ok(/球探部/.test(els.app.innerHTML)&&/理疗室/.test(els.app.innerHTML)&&/训练场/.test(els.app.innerHTML)&&/本季青训少年/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'facilities tab shows 3 cards + academy');
const b={dataset:{},textContent:'',isConnected:true};const bud=S.budget;ACT.fup('physio',b);ACT.fup('physio',b);ok(S.fac.physio===2&&S.budget===bud-60,'upgrade physio 1→2 costs 60');
// physio: injuries and durations over many matches with the same tired squad
function physio(L){
  S.fac.physio=L;let inj=0,knocks=0,ones=0,matches=0;
  for(let k=0;k<120;k++){
    my().players.forEach(p=>{p.cond=55;p.inj=0;p.ban=0;p.away=0});S.lineup=autoPick(my(),S.formation);
    S.day=nextMatchDay();S.event=null;S.offer=null;startMatch();skipMatch();matches++;
    const mine=M.myInjuries;inj+=mine.length;ones+=mine.filter(p=>p.inj===1).length;knocks+=M.feed.filter(e=>e.t.includes('只是轻伤')).length;M=null;
    if(S.round>=ROUNDS)newSeason();
  }
  return {injPerMatch:(inj/matches).toFixed(3),oneRound:inj?(ones/inj*100).toFixed(0)+'%':'-',knocksPerMatch:(knocks/matches).toFixed(3),restDay:restAmt()};
}
const p1=physio(1),p5=physio(5);console.log('  physio L1',JSON.stringify(p1));console.log('  physio L5',JSON.stringify(p5));
ok(physioRisk()===.7&&knockChance()===.5&&p5.restDay===14,'physio L5: fewer injuries, knocks played through, +14 rest');
// training ground
function ground(L){S.fac.ground=L;let ups=0;for(let k=0;k<40;k++){my().players.forEach(p=>{p.ovr=50;p.pot=80;p.age=19;p.inj=0;p.away=0});
  S.round=0;S.day=0;S.lastMatchDay=-9;const log={days:0,cond:0,trained:[]};while(advanceDay(log));ups+=log.trained.length}return ups}
const g1=ground(1),g5=ground(5);console.log('  training ground ups: L1',g1,'L5',g5);ok(g5>g1*1.3,'training ground L5 speeds up training growth');
// migration v7 -> v8
newGame(3,teamNames());const old=JSON.parse(JSON.stringify(S));old.v=7;delete old.fac;store[KEY]=JSON.stringify(old);
const up=load();ok(up.v===SAVE_V&&up.fac.scout===1&&up.fac.physio===1&&up.fac.ground===1,'v7 save gets level-1 facilities');
`);
