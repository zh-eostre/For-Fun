// Signature moves for midfielders (a pass that makes a sure goal) and defenders (a block of a sure goal).
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());
let pass=0,block=0,gk=0,goals=0,n=0,blkRate=[];
for(let k=0;k<60;k++){
  if(S.round>=rounds())break;
  if(S.event)ACT.event('0');if(S.offer)ACT.offerNo();ACT.ff();S.event=null;S.offer=null;S.lineup=autoPick(my(),S.formation);
  // give our midfielders and defenders signature moves
  my().players.forEach(p=>{if(p.pos==='MF'||p.pos==='DF')p.sig=p.sig||'测试·奥义'});
  startMatch();if(!M)continue;skipMatch();n++;
  pass+=M.feed.filter(e=>/穿透一切的直塞/.test(e.t)&&e.cls.includes('mine')).length;
  block+=M.feed.filter(e=>/血肉之躯/.test(e.t)).length;goals+=mySide()==='h'?M.hg:M.ag;
  const r=(mySide()==='h'?M.rh:M.ra).filter(x=>(M.ev[x.p.id]||{}).blk);r.forEach(x=>blkRate.push(x.r));
  ACT.matchDone()}
console.log('  '+n+' matches: signature passes (ours) '+pass+', blocks '+block+', our goals '+goals);
ok(pass>0&&block>0,'midfield signature passes and defensive signature blocks happen');
ok(pass<goals*.2,'signature passes are a small share of our goals ('+Math.round(pass/goals*100)+'%)');
ok(blkRate.length===0||blkRate.every(r=>r>=6),'a defender who makes a signature block rates well');
`);
