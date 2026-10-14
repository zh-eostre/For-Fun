// The monsters: every one appears in some fight, and a healer mends its allies (never past their maximum).
require('./harness').run(`
const used=new Set([...EASY,...NORMAL,...ELITES].flat().concat(BOSSES));
const lost=Object.keys(EN).filter(k=>!used.has(k));ok(!lost.length,'every monster can be met'+(lost.length?' (never: '+lost+')':''));
A.new();S.map[0]=['fight','fight','fight'];A.go('0');
C.enemies=['goblin','priest'].map(makeEnemy);const [g,p]=C.enemies;g.hp=g.max-10;p.hp=p.max-3;g.next={};p.next={h:8};render();
ok(/治疗：所有敌人回复 8 点生命/.test(els.app.innerHTML),'a healer shows its intent');
A.end();await flush();ok(g.hp===g.max-2&&p.hp===p.max,'healing mends every ally, up to its maximum');
for(const k of BOSSES){S.floor=12;startCombat('boss');}
ok(C.enemies.length===1&&BOSSES.includes(C.enemies[0].k),'a boss fight draws one of the bosses');
`);
