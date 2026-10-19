// the ball strip in a live match: shown while play goes on, moving with play (to their goal on a chance, into the net
// on a goal); it uses Math.random, so the same match plays out the same whatever the strip does
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===1),teamNames());UI.guide=null;S.friendlies.forEach(f=>f.res={hg:0,ag:0});ffToMatch();S.event=null;S.offers=[];
S.lineup=autoPick(my(),S.formation);const keep=JSON.stringify(S),real=Math.random,kick=()=>{Math.random=()=>.5;startMatch();clearTimeout(M.timer);Math.random=real};  // the same seed each time
kick();
ok(/class="bstrip/.test(els.app.innerHTML)&&/bs-ball/.test(els.app.innerHTML),'the strip is on the match screen');
const seen=new Set();let goalBall=null;for(let i=0;i<90&&!M.done;i++){const g=M.hg+M.ag;tick(false);seen.add(Math.round(M.ball/10));if(M.hg+M.ag>g)goalBall=M.ball}
ok(seen.size>=4,'the ball moves about ('+seen.size+' zones)');
ok(goalBall==null||goalBall===99||goalBall===1,'a goal puts it in the net');
while(M.pk)pkStep();const score=M.hg+':'+M.ag;render();ok(!/class="bstrip/.test(els.app.innerHTML),'gone at full time');
// the same match again, with the strip's randomness different: the same score
S=JSON.parse(keep);kick();Math.random=()=>.123;for(let i=0;i<90&&!M.done;i++)tick(false);while(M.pk)pkStep();Math.random=real;
ok(M.hg+':'+M.ag===score,'the strip leaves the match itself alone ('+score+' both times)');
`);
