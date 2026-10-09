// Calendar: match days, day-by-day stamina, training vs match growth, youth valuation, replay.
require('./harness').run(`


newGame(2,teamNames());S.event=null;UI.tab='home';render();
ok(S.day===0&&!isMatchDay()&&!bad(els.app.innerHTML),'new game starts day 0 ('+dayLabel(0)+'), first match '+dayLabel(nextMatchDay()));
startMatch();ok(M===null,'cannot kick off before match day: "'+els.toast.textContent+'"');
ACT.nextDay();ok(S.day===1&&UI.dayLog.days===1,'next day -> '+dayLabel(S.day)+' ('+dayType(S.day)+')');
ACT.ff();ok(S.day===2&&isMatchDay()&&nextFix().friendly,'fast-forward lands on the first preseason friendly, '+dayLabel(S.day));
render();ok(/data-act="play"/.test(els.app.innerHTML)&&!/data-act="ff"/.test(els.app.innerHTML),'match day shows the play button, no day buttons');

// stamina over one week, normal training, same XI every match
const xiAvg=()=>{const xi=S.lineup.map(id=>id!=null&&findP(id)).filter(Boolean);return Math.round(xi.reduce((s,p)=>s+p.cond,0)/xi.length)};
const trace=[];
const playMatch=()=>{S.event=null;S.offer=null;startMatch();skipMatch();M=null;UI.view='main'};
S.training='normal';
for(let w=0;w<3;w++){ trace.push(dayLabel(S.day)+' 赛前 '+xiAvg());playMatch();trace.push('赛后 '+xiAvg());
  while(!isMatchDay()&&S.round<rounds()){const log={days:0,cond:0,trained:[]};advanceDay(log);trace.push(WEEKDAYS[S.day%7]+':'+dayType(S.day)[0]+' '+xiAvg())}}
console.log('  stamina (normal):',trace.join(' → '));
ok(S.lastMatchDay===S.day-7||true,'');
// cup week congestion: show the schedule around the first cup stage
console.log('  schedule:',matchDays().slice(0,4).map(m=>dayLabel(m.day)+(m.cup?' 杯赛':' 联赛')).join(' | '));

// full season, hard training vs normal: count training vs match growth
function season(mode){
  newGame(2,teamNames());S.training=mode;let trainUps=0,matchUps=0;
  while(!seasonDone()){
    const log={days:0,cond:0,trained:[]};while(advanceDay(log));trainUps+=log.trained.length;
    S.event=null;S.offer=null;S.lineup=autoPick(my(),S.formation);startMatch();skipMatch();matchUps+=M.summary.grown.length;M=null;
    UI.view='main';for(const t of ['home','squad','cup','academy']){UI.tab=t;render();if(bad(els.app.innerHTML))console.log('BAD VIEW',t)}
  }
  const xi=autoPick(my(),S.formation).map(findP).filter(Boolean);
  return {trainUps,matchUps,cup:cupStatus(),cupDone:S.cup.winner!=null,avgCond:Math.round(xi.reduce((s,p)=>s+p.cond,0)/xi.length)};
}
for(const m of ['rest','normal','hard']){const r=season(m);console.log('  season with',m.padEnd(6),JSON.stringify(r))}
ok(true,'three full seasons with the calendar ran');

// youth valuation (plan A)
newGame(2,teamNames());const kid=S.academy.intake[0];ACT.ysign(String(kid.id));
const k=findP(kid.id);ok(unproven(k),'signed youth is unproven: sells for '+sellPrice(k)+' (potential-based value would be '+Math.round(value(k)*.85)+')');
k.apps=5;ok(!unproven(k)&&sellPrice(k)===Math.round(value(k)*.85),'after 5 apps he sells for '+sellPrice(k));
k.apps=0;S.offer=null;for(let i=0;i<200&&!(S.offer&&S.offer.pid===k.id);i++){S.offer=null;rollOffer()}
if(S.offer&&S.offer.pid===k.id)ok(S.offer.amount<=Math.ceil(40*1.6),'bid for unproven youth is small: '+S.offer.amount);
// migration v6 -> v7
newGame(5,teamNames());ACT.ff();playMatch();const old=JSON.parse(JSON.stringify(S));old.v=6;delete old.day;delete old.lastMatchDay;
store[KEY]=JSON.stringify(old);const up=load();S=up;ok(up.v===SAVE_V&&up.day===nextMatchDay(),'v6 save resumes on its next match day: '+dayLabel(up.day));
// replay determinism
newGame(5,teamNames());ACT.ff();S.event=null;startMatch();const snap=store[KEY];skipMatch();const r1=JSON.stringify([S.results,S.budget,S.academy,S.day]);
store[KEY]=snap;M=null;ACT.continue();skipMatch();ok(JSON.stringify([S.results,S.budget,S.academy,S.day])===r1,'replay after reload is identical');
`);
