// The training chosen today counts when we move on to the next day, so the eve of a match counts too;
// the day we played adds nothing, and the day after is a rest day.
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());
rollSurprise=()=>{};  // no random visitor (a yoga master restores everyone's stamina)
while(S.day+1<nextMatchDay())ACT.nextDay();  // the eve of the first match
const p=my().players[0];p.cond=60;p.inj=0;S.training='rest';ACT.nextDay();
ok(S.day===nextMatchDay()&&p.cond===60+TRAIN_DAY.rest.cond,'recovery training chosen on the eve counts: 60 → '+p.cond);
S.event=null;S.offer=null;startMatch();skipMatch();ACT.matchDone();
const q=my().players[1];q.cond=70;q.inj=0;const day=S.day;ACT.nextDay();ok(q.cond===70,'leaving the day we played: nothing more ('+q.cond+')');
ACT.nextDay();ok(q.cond===70+restAmt(),'leaving the rest day: +'+restAmt()+' ('+q.cond+')');
// an injured man mends on a match day too (he didn't play): a 2-day knock is gone two days after
{newGame(TEAMS.findIndex(t=>t.div===2),teamNames());rollSurprise=()=>{};
  while(S.day<nextMatchDay())ACT.nextDay();
  const p=my().players.find(x=>x.pos!=='GK');p.inj=2;S.lineup=autoPick(my(),S.formation);
  startMatch();skipMatch();ACT.matchDone();const d=S.day;
  ACT.nextDay();ok(S.day===d+1&&p.inj===1,'the day of the match counts: 2 → '+p.inj);
  if(S.day<nextMatchDay()){ACT.nextDay();ok(p.inj===0,'and the day after: fit again')}else ok(true,'(next match straight away)');}
`);
