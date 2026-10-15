// The boss relics with a price, and that a boss offers three to choose from for many rounds.
require('./harness').run(`
const fight=(...rel)=>{A.new('knight');S.relics.push(...rel);S.map[0]=['fight','fight','fight'];A.go('0');C.enemies.forEach(e=>e.next={a:1})};
fight('horn');ok(S.hp===77&&C.energy===4,'魔王之角: an energy more, 3 HP at the start of each fight');
A.new('knight');S.relics.push('horn');S.hp=2;S.map[0]=['fight','fight','fight'];A.go('0');ok(S.hp===1&&S.screen==='combat','but it never kills');
fight('hourglass');ok(C.hand.length===7,'沙漏: three more cards, but never more than seven');
fight('obsidian');C.enemies=[makeEnemy('cultist')];C.enemies[0].next={a:1};C.p.block=11;A.end();await flush();ok(C.p.block===6,'黑曜盾: 3 block at the end of each turn, and half the block is kept into the next');
fight('dragonscale');ok(C.p.block===10,'龙鳞: 10 block on the first turn');
A.new('knight');S.relics.push('stone');addCard('twin');ok(S.deck.at(-1).up,'贤者之石: new cards come upgraded');
A.new('knight');const g0=S.gold;gainRelic('contract');ok(S.gold===g0+300,'商人契约: 300 gold at once');S.map[0]=['shop','shop','shop'];A.go('0');ok(S.shop.cards.every(x=>x.price<=80)&&removePrice()===38,'商人契约: the shop at half price');
A.next();S.map[1]=['fight','fight','fight'];A.go('0');alive().forEach(e=>e.hp=0);checkWin();await flush();ok(S.reward.gold===0&&!/rgold/.test(els.app.innerHTML),'and fights drop no gold');
A.next();S.map[2]=['fight','fight','fight'];A.go('0');C.type='boss';alive().forEach(e=>e.hp=0);checkWin();await flush();ok(S.reward.gold===300&&/300 金币/.test(els.app.innerHTML),'but a boss pays 300');
const bossRelics=Object.keys(RELICS).filter(k=>RELICS[k].boss);ok(bossRelics.length===9,'nine boss relics');
A.new('knight');S.relics.push('core','crown','horn','hourglass');ok(freeRelics(true).length===5,'after four bosses there are still five to choose from');
`);
