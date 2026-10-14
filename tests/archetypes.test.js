// The cards and relic that round out the poison, block and exhaust decks: each does what its text says.
require('./harness').run(`
const fight=(...ks)=>{A.new();S.map[0]=['fight','fight','fight'];A.go('0');C.enemies=ks.map(makeEnemy);C.enemies.forEach(e=>{e.next={a:5}});C.target=C.enemies[0].uid;C.energy=9};
const play=(id,up=false)=>{const c={uid:nid(),id,up};C.hand.push(c);A.play(String(c.uid))};
// poison
fight('cultist');const e=C.enemies[0];play('darts');ok(e.poison===3&&e.hp===e.max-6,'淬毒飞镖: 2 damage three times, a poison each hit');
play('toxin');play('venom');ok(e.poison===3+3+1,'剧毒: each poisoning adds one more');
let hp=e.hp;e.block=20;play('rupture');ok(e.hp===hp-7&&e.block===20,'毒发: loses HP equal to its poison, through block');
C.p.fumes=2;C.p.toxin=1;const p0=e.poison;startTurn();ok(e.poison===p0+3,'毒气 is poisoning too, so 剧毒 adds to it');
// block
fight('wolf');const w=C.enemies[0];play('ironfist');ok(w.hp===w.max-5&&C.p.block===5,'铁拳: hits and blocks');
play('thorns');w.next={a:3,n:2};hp=w.hp;S.hp=80;A.end();await flush();ok(w.hp===hp-6,'荆棘护甲: hurts the attacker each hit, even when blocked');
fight('bat');const b=C.enemies[0];b.hp=b.max=40;play('thorns',true);b.next={a:2,n:10};C.p.thorns=40;A.end();await flush();
ok(b.hp===0&&S.screen==='reward'&&S.hp>0,'an attacker killed by thorns stops attacking, and the fight is won');
// exhaust
fight('cultist');C.hand=[];C.draw=[{uid:nid(),id:'strike'},{uid:nid(),id:'defend'},{uid:nid(),id:'bash'}];C.discard=[];play('embers');play('devour');
play('shout');ok(C.p.block===4&&C.hand.length===3,'余烬 and 吞噬: exhausting a card gives block and draws');
fight('cultist');const c=C.enemies[0];C.hand=['strike','defend','bash'].map(id=>({uid:nid(),id}));C.draw=[];C.discard=[];
play('hellfire');ok(c.hp===c.max-21&&C.exhaust.length===4&&!C.hand.length,'业火焚身: exhausts the hand, 7 damage for each card, then itself');
fight('cultist');const d=C.enemies[0];S.relics.push('censer');d.block=2;play('shout');ok(d.hp===d.max-1&&d.block===0,'焚香炉: exhausting a card hurts every enemy for 3');
`);
