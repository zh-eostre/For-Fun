// A run from the title screen: the map, a fight played card by card, the enemies' turn, the reward, and the other rooms.
require('./harness').run(`
render();ok(/深渊之塔/.test(els.app.innerHTML)&&/开始冒险/.test(els.app.innerHTML),'title screen');
A.new();ok(S&&S.deck.length===10&&S.hp===80&&S.map.length===13&&S.screen==='map','a new run: 10 cards, 80 HP, a 13-floor map');
ok(/选择下一站/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'the map renders');
// a fight
S.map[0]=['fight','fight','event'];A.go('0');
ok(S.screen==='combat'&&C&&C.hand.length===5&&C.energy===3&&alive().length>=1,'a fight: 5 cards in hand, 3 energy');
ok(!bad(els.app.innerHTML)&&/结束回合/.test(els.app.innerHTML),'the arena renders');
const e0=alive()[0],hp0=e0.hp,strike=C.hand.find(c=>c.id==='strike');
if(strike){A.play(String(strike.uid));ok(e0.hp<hp0||e0.block>0,'a strike hurts the enemy ('+hp0+' → '+e0.hp+')')}
// statuses, powers and intents explain themselves in a tooltip
C.p.fumes=2;C.p.weak=1;e0.next={a:6,n:2,po:3};render();
ok(/class="chip pow" data-tip="毒气 2 · 能力&#10;每回合开始时，所有敌人获得 2 层中毒"/.test(els.app.innerHTML),'a power shows as a power, with what it does');
ok(/data-tip="虚弱 1 · 负面&#10;/.test(els.app.innerHTML)&&/data-tip="下回合的行动&#10;攻击：造成 \\d+ 点伤害，共 2 次&#10;下毒：让你获得 3 层中毒"/.test(els.app.innerHTML),'a debuff and an intent have tooltips');
C.p.fumes=0;C.p.weak=0;
const php=S.hp;A.end();await flush();
ok(C&&C.turn===2&&C.hand.length===5&&C.energy===3,'the enemies act and a new turn begins');
// win the fight outright
alive().forEach(e=>e.hp=1);const s=C.hand.find(c=>CARDS[c.id].t==='atk')||C.hand[0];C.energy=9;
alive().forEach(e=>e.hp=0);checkWin();await flush();
ok(S.screen==='reward'&&S.reward&&S.reward.cards.length===3,'victory: a reward with three cards to choose from');
const n=S.deck.length;A.rcard(S.reward.cards[0]);ok(S.deck.length===n+1,'a card taken into the deck');
const g=S.gold;A.next();ok(S.floor===1&&S.screen==='map'&&S.gold>g,'on to the next floor, with the gold');
// the other rooms
S.map[1]=['rest','shop','event'];A.go('0');ok(S.screen==='rest'&&/篝火/.test(els.app.innerHTML),'a campfire');
S.hp=40;A.rheal();ok(S.hp>40&&S.rest.done,'resting heals');A.next();
S.map[2]=['shop','shop','shop'];A.go('0');ok(S.screen==='shop'&&S.shop.cards.length===5&&!bad(els.app.innerHTML),'a shop with five cards');
S.gold=999;A.buy('0');ok(S.shop.cards[0].sold,'buying a card');A.next();
S.map[3]=['event','event','event'];A.go('0');ok(S.screen==='event'&&!bad(els.app.innerHTML),'an event: '+EVENTS[S.event.k].n);
// saving and loading
save();const keep=JSON.stringify(S);S=null;render();ok(/继续冒险/.test(els.app.innerHTML),'the title screen offers to continue');
A.cont();ok(S&&JSON.stringify(S)===keep,'and continuing restores the run');
// dying
A.next();S.map[4]=['fight','fight','fight'];A.go('0');S.hp=1;C.p.block=0;alive().forEach(e=>e.next={a:50});A.end();await flush();
ok(S.screen==='dead'&&/冒险结束/.test(els.app.innerHTML),'losing all HP ends the run');
`);
