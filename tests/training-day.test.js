// The training chosen today counts when we move on to the next day, so the eve of a match counts too;
// the day we played adds nothing, and the day after is a rest day.
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());
while(S.day+1<nextMatchDay())ACT.nextDay();  // the eve of the first match
const p=my().players[0];p.cond=60;p.inj=0;S.training='rest';ACT.nextDay();
ok(S.day===nextMatchDay()&&p.cond===60+TRAIN_DAY.rest.cond,'recovery training chosen on the eve counts: 60 → '+p.cond);
S.event=null;S.offer=null;startMatch();skipMatch();ACT.matchDone();
const q=my().players[1];q.cond=70;q.inj=0;const day=S.day;ACT.nextDay();ok(q.cond===70,'leaving the day we played: nothing more ('+q.cond+')');
ACT.nextDay();ok(q.cond===70+restAmt(),'leaving the rest day: +'+restAmt()+' ('+q.cond+')');
`);
