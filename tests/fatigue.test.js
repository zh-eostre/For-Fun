// In-match fatigue, AI recovery on the calendar, tired-legs substitutions, counter-attacks, pausing to substitute.
require('./harness').run(`
newGame(2,teamNames());
// stamina spent over a match, by tactic
const byRole=r=>{let t=0;for(let k=0;k<200;k++){const p={cond:100,age:25};for(let m=0;m<90;m++)drain(p,'bal',r);t+=100-p.cond}return Math.round(t/200)};
ok(byRole('GK')<=8&&byRole('MF')>byRole('DF')&&byRole('DF')>byRole('GK'),'stamina spent in 90 minutes by role: 门将 '+byRole('GK')+'，后卫 '+byRole('DF')+'，中场 '+byRole('MF')+'，前锋 '+byRole('FW'));
const spend=tac=>{let t=0;for(let k=0;k<200;k++){const p={cond:100,age:25};for(let m=0;m<90;m++)drain(p,tac);t+=100-p.cond}return Math.round(t/200)};
const att=spend('att'),bal=spend('bal'),def=spend('def');
ok(bal>=26&&bal<=33&&att>bal&&def<bal,'stamina per 90 min: 全力进攻 -'+att+'，平衡 -'+bal+'，防守反击 -'+def);
// AI recovery: a rest day then training days, like ours
const day0=S.day,t=S.teams.find(x=>x.id!==S.my);t.players.forEach(p=>p.cond=70);t.lastDay=t.condDay=S.day;S.day+=1;aiRecover(t);
ok(t.players[0].cond===80,'AI day after a match: +10 (now '+t.players[0].cond+')');
S.day+=3;aiRecover(t);ok(t.players[0].cond===92,'then +4 per training day (now '+t.players[0].cond+')');
aiRecover(t);ok(t.players[0].cond===92,'recovering twice on the same day changes nothing');
// tired strong teams drop points to weak ones
const top=S.teams.filter(x=>x.id!==S.my&&x.div===0).sort((a,b)=>b.rep-a.rep),strong=top[0],weak=top[top.length-1];
const trial=c=>{let w=0;for(let k=0;k<300;k++){strong.players.forEach(p=>{p.cond=c;p.inj=0;p.ban=0});weak.players.forEach(p=>{p.cond=95;p.inj=0;p.ban=0});
  strong.condDay=weak.condDay=S.day;const r=quickSim(weak.id,strong.id);if(r.hg>=r.ag)w++}return Math.round(w/3)};
const fresh=trial(100),tired=trial(55);
ok(tired>fresh+10,'甲级 bottom side avoids defeat vs a giant: '+fresh+'% when the giant is fresh, '+tired+'% when it is tired');
// counter-attack bonus
ok(counter('def','att')===2&&counter('att','def')===0&&counter('def','def')===0,'防守反击 gets +2 attack against 全力进攻');
S.day=day0;  // the recovery checks above moved the date by hand; put it back before playing
// live match: our tired players come off automatically; pausing opens the substitution panel
ffToMatch();S.event=null;S.offer=null;S.autoSub=true;my().players.forEach(p=>p.cond=60);
startMatch();while(M.min<45)tick(false);ACT.resume();clearTimeout(M.timer);while(M.min<85)tick(true);  // halftime gives some stamina back, so later than before
ok(M.subs>=1&&M.feed.some(e=>/体力透支/.test(e.t)),'auto-sub took off '+M.subs+' tired player(s)');
ACT.pauseSub();render();ok(M.paused&&M.subMode&&/暂停·调整/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'pause opens the adjust panel');
ACT.resume();ok(!M.paused&&!M.subMode,'resume continues the match');render();ok(/场上体能/.test(els.app.innerHTML),'live stamina panel shows during play');
skipMatch();ok(my().players.every(p=>Number.isInteger(p.cond)),'stamina is whole numbers again after the match');M=null;UI.view='main';
// auto-subs off: none of ours (except injuries)
ffToMatch();S.event=null;S.offer=null;S.autoSub=false;my().players.forEach(p=>{p.cond=55;p.inj=0;p.ban=0});ACT.auto();
startMatch();skipMatch();ok(!M.feed.some(e=>/体力透支/.test(e.t)&&S.teams[M.h===S.my?M.h:M.a].players.some(p=>e.t.startsWith(p.name))),'with auto-subs off, ours are not swapped for tiredness');
// a spent star (under SPENT) comes off even when the bench is much weaker; at 55 he stays if the sub is no match
{newGame(TEAMS.findIndex(t=>t.div===2),teamNames());const T=my(),f=S.formation,ids=autoPick(T,f,true),xi=[...ids],roles=slotRoles(f);
  const i=roles.indexOf('MF'),star=T.players.find(p=>p.id===ids[i]);star.ovr=92;
  T.players.filter(p=>!ids.includes(p.id)).forEach(p=>{p.ovr=Math.min(p.ovr,55);p.cond=100});T.players.filter(p=>ids.includes(p.id)).forEach(p=>p.cond=90);
  star.cond=55;ok(!tiredSwap(T,ids,xi,f,0,70),'92 at 55 stamina against a 55 bench: he plays on');
  star.cond=SPENT-1;const sw=tiredSwap(T,ids,xi,f,0,70);ok(sw&&sw[0]===star&&sw[1].pos==='MF','92 at '+(SPENT-1)+' stamina: off he comes, for a midfielder');
  ok(!tiredSwap(T,ids,xi,f,SUBS-1,70),'but not with the last change held back before 80 minutes');}
`);
