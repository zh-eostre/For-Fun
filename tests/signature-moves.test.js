// Signature moves for midfielders (a pass that makes a sure goal) and defenders (a block of a sure goal).
// Driven directly: 400 attacks each way with signature moves on our midfield and defence.
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());ACT.ff();S.event=null;S.offer=null;startMatch();clearTimeout(M.timer);M.skip=true;
const s=mySide(),o=s==='h'?'a':'h';
onPitch(my(),M[s+'Ids']).forEach(p=>{if(p&&(M.role[p.id]==='MF'||M.role[p.id]==='DF'))p.sig='测试·奥义'});
for(let k=0;k<400;k++){side(s,.45);side(o,.45)}
const passes=M.feed.filter(e=>/穿透一切的直塞/.test(e.t)).length,blocks=M.feed.filter(e=>/血肉之躯/.test(e.t)).length;
console.log('  400 attacks each way: signature passes '+passes+', blocks '+blocks);
ok(passes>=3&&passes<=25,'our midfielders play signature passes now and then ('+passes+')');
ok(blocks>=3&&blocks<=25,'our defenders block sure goals now and then ('+blocks+')');
const b=Object.entries(M.ev).find(([id,e])=>e.blk&&findP(+id));
const avg=e=>{let t=0;for(let k=0;k<50;k++)t+=rate(findP(+b[0]),'DF',e,0,1,90,null);return t/50};
ok(b&&avg(b[1])>avg({})+.15,'a block lifts the defender\\'s rating');
`);
