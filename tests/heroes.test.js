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
// each hero keeps their own best; a record from before heroes is the knight's
store[BEST]=JSON.stringify({sc:15,loop:1,floor:2});ok(getBest('knight').sc===15&&!getBest('assassin'),"an old best record becomes the knight's");
A.start('assassin');S.floor=4;ok(setBest()===true&&getBest('assassin').floor===4&&getBest('knight').sc===15,"a 刺客 record is kept apart from the 骑士's");
S.floor=3;ok(setBest()===false&&getBest('assassin').floor===4,'and only a higher climb replaces it');
S=null;UI.pick=false;render();ok(/最佳纪录：骑士 第 2 轮第 3 层 · 刺客 第 1 轮第 5 层/.test(els.app.innerHTML),"the title screen lists each hero's best");
A.new();ok(/最佳 第 2 轮第 3 层/.test(els.app.innerHTML)&&/还没有纪录/.test(els.app.innerHTML),"and so does each hero's card");
A.start('pyro');S.floor=2;S.map[2]=['fight','fight','fight'];A.go('0');S.hp=1;C.p.block=0;alive().forEach(e=>e.next={a:99});A.end();await flush();
ok(S.screen==='dead'&&/新纪录！/.test(els.app.innerHTML)&&/灰烬术士倒在了/.test(els.app.innerHTML),'a first death sets a new record, and says so');
// an old save, from before heroes, is a knight
const old=JSON.parse(JSON.stringify(S));delete old.hero;S=old;ok(hero()===HEROES.knight,'a save from before heroes plays as the knight');
`);
