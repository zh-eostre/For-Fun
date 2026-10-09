// A cup shootout is revealed kick by kick in a live match; season totals of yellow and red cards.
require('./harness').run(`
// shootouts: every kick listed in order, the first five end early once one side can't be caught
let ok5=true;
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());
const T=S.teams,ids=t=>autoPick(t,'4-4-2');
for(let k=0;k<300;k++){const r=shootout(T[0],ids(T[0]),T[1],ids(T[1]),null);
  const h=r.kicks.filter(x=>x.s==='h'),a=r.kicks.filter(x=>x.s==='a');
  if(h.filter(x=>x.ok).length!==r.hp||a.filter(x=>x.ok).length!==r.ap||r.hp===r.ap||h.length-a.length>1||a.length>h.length)ok5=false}
ok(ok5,'300 shootouts: the kicks add up to the score, no draw, home always kicks first');
// a live cup tie that ends level goes to a shootout that is revealed one kick at a time
while(!(S.cup.ties.some(t=>t.includes(S.my))&&cupDue())&&S.round<rounds()){if(S.event)ACT.event('0');if(S.offer)ACT.offerNo();ACT.ff();S.event=null;S.offer=null;startMatch();skipMatch();ACT.matchDone()}
if(cupDue()&&inCup()){ACT.ff();S.event=null;S.offer=null;startMatch();clearTimeout(M.timer);while(M.min<89)tick(true);M.skip=false;M.hg=M.ag=1;tick(false);
  ok(M.pk&&!M.done&&M.pk.i===0,'level at 90: a shootout begins, nothing revealed yet');
  render();ok(/点球大战/.test(els.app.innerHTML)&&(els.app.innerHTML.match(/class="todo"/g)||[]).length===10,'the shootout panel shows 5 + 5 kicks to come');
  pkStep();pkStep();ok(M.pk&&M.pk.i===2&&!M.done,'two kicks revealed');render();ok((els.app.innerHTML.match(/class="(in|miss)"/g)||[]).length===2,'shown on the panel');
  skipMatch();ok(M.done&&M.hp!==M.ap&&M.feed.some(e=>/点球大战结束|点球/.test(e.t)),'skipping reveals the rest: '+M.hp+':'+M.ap);
  ACT.matchDone();}else ok(true,'(no cup tie reached in this run)');
// cards: season totals
const p=my().players[2],q=my().players[3],yc={};p.ycs=0;p.rcs=0;
const ids2=[p.id,q.id];let n=0;while(!(yc[p.id])&&n++<200)booking({players:[p]},[p.id],yc);
ok(p.ycs===1,'a yellow counts in the season total');booking({players:[p]},[p.id],yc);ok(p.ycs===2&&p.rcs===1,'a second yellow: one more yellow and a red');
UI.modal={type:'player',id:p.id};render();ok(/黄牌/.test(els.app.innerHTML)&&/红牌/.test(els.app.innerHTML),'the player dialog shows them');UI.modal=null;
S.round=0;UI.tab='table';render();ok(/data-arg="\\d+:cards"/.test(els.app.innerHTML),'the table page has a 红黄牌 board');
// a third yellow of the season: he plays on, and the ban starts after the match
{newGame(TEAMS.findIndex(t=>t.div===2),teamNames());S.lineup=autoPick(my(),S.formation);
  while(nextFix().friendly){ACT.ff();S.event=null;S.offer=null;startMatch();skipMatch();ACT.matchDone()}
  ACT.ff();S.event=null;S.offer=null;S.lineup=autoPick(my(),S.formation);startMatch();clearTimeout(M.timer);
  const s=mySide(),pid=M[s+'Ids'][5],pl=findP(pid);pl.yc=YC_BAN-1;
  let tries=0;while(!M.yc[pid]&&tries++<500)booking(my(),M[s+'Ids'],M.yc);
  ok(M.yc[pid]&&pl.yc===0&&!pl.ban&&pl.banNext===1&&M[s+'Ids'].includes(pid)&&!unavail(pl),'third yellow mid-match: still on the pitch and not suspended yet');
  M.paused=true;M.subMode=true;M.stop=(M.stop||0)+1;const bench=my().players.find(p=>!M[s+'XI'].includes(p.id)&&!unavail(p));
  ok(substitute(pid,bench.id),'he can be taken off');render();ok(els.app.innerHTML.includes('data-arg="'+pid+'"'),'and is still on the list during the stop, so the change can be undone');
  ok(resub(bench.id,pid)===true&&M[s+'Ids'].includes(pid),'undone: he is back on');
  M.paused=false;M.subMode=false;skipMatch();
  ok(pl.ban===1&&!pl.banNext&&unavail(pl)&&M.summary.banned.includes(pl),'after the final whistle: banned for the next match, shown in the summary');
  ACT.matchDone();ok(!S.lineup.includes(pid),'and left out of the next lineup');}
`);
