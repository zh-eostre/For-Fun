// The combo cards (飞刀 and the cards that count what you played this turn) and the berserk cards (blood for power).
require('./harness').run(`
const fight=(k='knight')=>{A.new(k);S.map[0]=['fight','fight','fight'];A.go('0');C.enemies=[makeEnemy('cultist')];C.enemies[0].next={a:1};C.target=C.enemies[0].uid;C.energy=9;C.hand=[];C.draw=[];C.discard=[];C.played=0};
const play=(id,up=false)=>{const c={uid:nid(),id,up};C.hand.push(c);A.play(String(c.uid))};
const e=()=>C.enemies[0];
// combo
fight();play('blades');ok(C.hand.filter(c=>c.id==='shiv').length===3&&!POOL('token').some(id=>POOL('com').includes(id)),'飞刀雨: three 飞刀 in hand, and 飞刀 are never offered as rewards');
let hp=e().hp;play('accuracy');A.play(String(C.hand.find(c=>c.id==='shiv').uid));ok(e().hp===hp-7&&C.exhaust.some(c=>c.id==='shiv'),'精准 makes a 飞刀 hit for 7, and it is gone after');
fight();C.played=2;hp=e().hp;play('quickblade');ok(e().hp===hp-4,'快刀: one hit after two cards');C.played=3;hp=e().hp;play('quickblade');ok(e().hp===hp-8,'and two after three');
fight();C.played=4;hp=e().hp;play('thousand');ok(e().hp===hp-12,'千刃: a hit for each card played this turn');
fight();play('flow');C.draw=[{uid:nid(),id:'strike'},{uid:nid(),id:'strike'}];C.played=3;play('defend');ok(C.hand.length===2,'流水: the fourth card this turn draws two');
fight();S.relics.push('bracelet');C.energy=9;for(let i=0;i<6;i++)play('defend');ok(C.energy===4,'疾风手环: the sixth card gives an energy back');
fight();play('bladedance');A.end();await flush();ok(C.hand.filter(c=>c.id==='shiv').length===2,'刀锋舞: two 飞刀 every turn');
fight();C.hand=[];for(let i=0;i<10;i++)C.hand.push({uid:nid(),id:'defend'});play('blades');ok(C.hand.length===10&&C.discard.filter(c=>c.id==='shiv').length>=1,'飞刀 beyond a full hand go to the discard pile');
// berserk
fight();S.hp=80;hp=e().hp;play('reckless');ok(e().hp===hp-12&&S.hp===78,'鲁莽打击: 12 damage for 2 HP');
fight();S.hp=80;play('bloodrage');ok(S.hp===78&&C.p.str===1,'血怒: 2 HP for a strength');
fight();S.hp=50;hp=e().hp;play('drain');ok(e().hp===hp-10&&S.hp===55,'饮血: heals half of what it deals');
fight();play('laststand');S.hp=41;ok(pDmg(10,null)===10,'背水一战: nothing above half HP');S.hp=40;ok(pDmg(10,null)===15,'and +50% at half or below');
fight();play('agony');S.hp=80;play('reckless');ok(C.p.str===1,'以痛为力: losing HP on your turn gives strength');
const s0=C.p.str;e().next={a:5};A.end();await flush();ok(C.p.str===s0,'but not when the enemy hits you');
fight();S.hp=40;hp=e().hp;play('bloodfeast');ok(e().hp===hp-20,'鲜血狂欢: half the HP you are missing');
// the new heroes
fight('berserker');ok(S.maxHp===80&&has('scar'),'狂战士: 80 HP and 战痕');S.hp=40;startTurn();ok(C.energy===4,'战痕: an energy more at half HP or below');
fight('beastmaster');ok(C.pets.length===1&&C.pets[0].k==='wolf'&&RELICS.whistle.start,'驯兽师 starts every fight with a wolf, and 骨哨 is theirs alone');
`);
