// Pets: summoned by cards, they act at the end of your turn, three at most, and 兽群之力 makes them stronger.
require('./harness').run(`
const fight=ks=>{A.new('knight');S.map[0]=['fight','fight','fight'];A.go('0');C.enemies=ks.map(makeEnemy);C.enemies.forEach(e=>e.next={a:1});C.target=C.enemies[0].uid;C.energy=9;C.hand=[];C.draw=[];C.discard=[]};
const play=(id,up=false)=>{const c={uid:nid(),id,up};C.hand.push(c);A.play(String(c.uid))};
fight(['cultist']);const e=C.enemies[0];play('wolfcall');ok(C.pets.length===1&&/pet-wolf\\.png/.test(els.app.innerHTML)&&/data-tip="战狼 · 宠物/.test(els.app.innerHTML),'召唤战狼: a wolf joins you, shown beside you with a tip');
let hp=e.hp;A.end();await flush();ok(e.hp===hp-5,'it bites the target at the end of your turn');
play('turtle');play('toad');play('pack');hp=e.hp;const p0=e.poison;S.hp=80;C.p.block=0;e.next={a:1};A.end();await flush();
ok(e.hp===hp-7-(p0+4)&&e.poison===p0+3&&S.hp===80,'兽群之力 adds 2 to each: the wolf bites for 7, the toad poisons 4, the turtle blocks the hit');
play('raven');ok(C.pets.length===3&&C.pets[0].k==='turtle','a fourth pet sends the oldest away');
hp=e.hp;C.p.pack=0;play('command');ok(e.hp<hp,'号令: the pets act at once');
hp=e.hp;C.energy=9;play('bloodpact');ok(e.hp===hp-21||e.hp===0,'血契: 7 damage for each of three pets');
fight(['cultist']);play('wildcall');ok(C.pets.map(p=>p.k).join()==='wolf,turtle,toad','野性呼唤: a wolf, a turtle and a toad');
fight(['bat']);S.relics.push('whistle');startCombat('fight');ok(C.pets.length===1&&C.pets[0].k==='wolf'&&C.pets[0].p===4,'骨哨: every fight starts with a wolf');
const m=Object.keys(PETS).filter(k=>!png('pet-'+k));ok(!m.length,'every pet has a sprite');
`,{png:k=>require('fs').existsSync(require('path').join(__dirname,'../art/monsters',k+'.png'))});
