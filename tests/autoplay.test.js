// A simple bot plays whole runs (random paths, the affordable cards in hand, every reward), checking after each step
// that nothing in the run is broken and every screen renders.
require('./harness').run(`
const sane=()=>[S.hp,S.maxHp,S.gold,S.floor].every(Number.isFinite)&&S.hp<=S.maxHp&&S.deck.every(c=>CARDS[c.id])&&S.relics.every(k=>RELICS[k]);
let runs=0,floors=0,broken=0,loops=0,wins=0;
for(let r=0;r<6;r++){A.new('knight');runs++;let guard=0;
  while(S.screen!=='dead'&&guard++<400&&S.loop<2){
    if(!sane()||bad(els.app.innerHTML)){broken++;console.log('  broken at',S.screen,S.floor,els.app.innerHTML.match(/.{40}(undefined|NaN).{20}/));break}
    if(UI.over&&UI.over.sel){A.upgrade();continue}
    if(UI.over){const c=S.deck.find(x=>UI.over.mode!=='upgrade'||!x.up);if(c)A.pick(String(c.uid));else A.close();continue}
    if(S.screen==='map'){A.go(String(Math.floor(Math.random()*S.map[S.floor].length)));continue}
    if(S.screen==='combat'){
      for(let k=0;k<12&&C&&!C.busy;k++){const c=C.hand.find(x=>costOf(x)<=C.energy);if(!c)break;A.play(String(c.uid))}
      if(C&&!C.busy)A.end();await flush();continue}
    if(S.screen==='reward'){const R=S.reward;if(R.relic&&!R.relicTaken)A.rrelic();if(R.boss&&!R.bossTaken){A.rboss(R.boss[0]);wins++}if(!R.cardTaken)A.rcard(R.cards[0]);floors++;if(R.boss){A.nextloop();loops++}else A.next();continue}
    if(S.screen==='rest'){if(!S.rest.done)(S.hp<S.maxHp*.6?A.rheal():A.rup());if(!UI.over)A.next();continue}
    if(S.screen==='shop'){if(S.gold>=S.shop.cards[0].price&&!S.shop.cards[0].sold)A.buy('0');A.next();continue}
    if(S.screen==='event'){if(S.event.res==null){const o=EVENTS[S.event.k].opts()[0][1];A.ev(o);if(S.event.res==null&&!UI.over)A.ev('x')}if(!UI.over&&S.event.res!=null)A.next();continue}
  }}
ok(broken===0,'nothing broke in '+runs+' runs ('+floors+' fights won, '+wins+' bosses beaten)');
`);
