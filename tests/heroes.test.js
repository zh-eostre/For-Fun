// Choosing a hero: the picker, each hero's start, and the starting relics that only they have.
require('./harness').run(`
render();A.new();ok(UI.pick&&!S&&/选择你的英雄/.test(els.app.innerHTML)&&(els.app.innerHTML.match(/data-act="start"/g)||[]).length===3&&!bad(els.app.innerHTML),'starting an adventure first asks for a hero');
A.home();ok(!UI.pick&&/开始冒险/.test(els.app.innerHTML),'and you can go back');
for(const [k,H] of Object.entries(HEROES)){
  A.new();A.start(k);const n=Object.values(H.deck).reduce((a,b)=>a+b,0);
  ok(S.hero===k&&S.hp===H.hp&&S.maxHp===H.hp&&S.relics.join()===H.relic&&S.deck.length===n&&!UI.pick,H.n+': '+H.hp+' HP, '+n+' cards, '+RELICS[H.relic].n);
}
ok(Object.values(HEROES).every(H=>RELICS[H.relic].start)&&!freeRelics(false).some(k=>RELICS[k].start),'a starting relic is never found in the tower');
// 蛇牙: the first attack each turn poisons
A.start('assassin');S.map[0]=['fight','fight','fight'];A.go('0');C.enemies=[makeEnemy('cultist')];C.enemies[0].next={a:5};C.target=C.enemies[0].uid;C.energy=9;
const e=C.enemies[0],play=id=>{const c={uid:nid(),id};C.hand.push(c);A.play(String(c.uid))};
play('strike');ok(e.poison===3,'蛇牙: the first attack poisons');play('strike');ok(e.poison===3,'but only the first each turn');
// 灰烬法典: the first exhaust each turn gives energy
A.start('pyro');S.map[0]=['fight','fight','fight'];A.go('0');C.enemies=[makeEnemy('cultist')];C.enemies[0].next={a:5};C.energy=3;C.hand=[];C.draw=[];C.discard=[];
play('shout');ok(C.energy===4,'灰烬法典: exhausting a card gives an energy');play('scare');ok(C.energy===4,'but only once a turn');
// rewards lean toward the hero's cards
S.hero='assassin';let liked=0;for(let i=0;i<2000;i++)if(HEROES.assassin.like.includes(rollCard(false)))liked++;
S.hero='knight';let liked2=0;for(let i=0;i<2000;i++)if(HEROES.assassin.like.includes(rollCard(false)))liked2++;
ok(liked>liked2*1.3,'card rewards lean toward the hero ('+liked+' of 2000 a 刺客 card for the 刺客, '+liked2+' for the 骑士)');
// an old save, from before heroes, is a knight
const old=JSON.parse(JSON.stringify(S));delete old.hero;S=old;ok(hero()===HEROES.knight,'a save from before heroes plays as the knight');
`);
