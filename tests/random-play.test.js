// Random play: hundreds of random actions (lineups, formations, transfers, loans, facilities, academy, cheats,
// save and reload, live matches with pauses, substitutions redone and undone, club moves), checking after every
// step that the save stays consistent (no player twice, valid lineup, stamina in range, no NaN) and views render.
// For a longer run: node tests/random-play.test.js <seed> <seasons>
const [,,argSeed,argSeasons]=process.argv;
const runs=argSeed?[[+argSeed,+argSeasons||3]]:[[7,1],[21,1]];
for(const [SEED,SEASONS] of runs)require('./harness').run(`
let seed=${SEED};const R=()=>(seed=(seed*16807)%2147483647)/2147483647,pk=a=>a[Math.floor(R()*a.length)];
const btn=()=>({dataset:{},textContent:'',isConnected:true}),twice=(k,a)=>{const b=btn();ACT[k](a,b);ACT[k](a,b)};
const fails=[];let step=0,where='';
function walk(o,path,seen=new Set()){if(o&&typeof o==='object'){if(seen.has(o))return;seen.add(o);for(const k in o)walk(o[k],path+'.'+k,seen)}else if(typeof o==='number'&&!isFinite(o))fails.push(where+' non-finite '+path)}
function check(){
  try{JSON.stringify(S)}catch(e){fails.push(where+' stringify '+e.message)}
  walk(S,'S');
  const all=S.teams.flatMap(t=>t.players.map(p=>[t.id,p])),ids=new Map();
  all.forEach(([t,p])=>{if(ids.has(p.id))fails.push(where+' player '+p.id+' on teams '+ids.get(p.id)+' and '+t);ids.set(p.id,t);
    if(!(p.cond>=30&&p.cond<=100))fails.push(where+' cond '+p.cond+' '+p.name);if(!(p.ovr>=1&&p.ovr<=99))fails.push(where+' ovr '+p.ovr);});
  (S.market||[]).forEach(p=>{if(ids.has(p.id))fails.push(where+' market player also on a team '+p.id)});
  if(S.lineup.length!==slotRoles(S.formation).length)fails.push(where+' lineup length '+S.lineup.length);
  const li=S.lineup.filter(x=>x!=null);if(new Set(li).size!==li.length)fails.push(where+' duplicate in lineup');
  li.forEach(id=>{if(!my().players.some(p=>p.id===id))fails.push(where+' lineup has non-squad '+id)});
  if(squadSize()>SQUAD_MAX)fails.push(where+' squad '+squadSize());
  if(M&&!M.done){for(const s of ['h','a']){const on=M[s+'Ids'].filter(x=>x!=null);if(new Set(on).size!==on.length)fails.push(where+' dup on pitch');
      on.forEach(id=>{if(!M[s+'XI'].includes(id))fails.push(where+' on pitch not in XI '+id)})}
    if(M.subs>SUBS||M.oppSubs>SUBS)fails.push(where+' subs '+M.subs+'/'+M.oppSubs)}
}
function views(){
  const keep=UI.tab;
  for(const t of ['home','squad','table','cup','market','academy','facilities','honours']){UI.tab=t;try{render();if(bad(els.app.innerHTML))fails.push(where+' bad view '+t)}catch(e){fails.push(where+' render '+t+' '+e.message)}}
  const p=pk(my().players);if(p){UI.modal={type:'player',id:p.id};try{render();if(bad(els.app.innerHTML))fails.push(where+' bad player modal')}catch(e){fails.push(where+' modal '+e.message)}}
  if(S.round<rounds()&&!S.live){UI.modal={type:'opp'};try{render();if(bad(els.app.innerHTML))fails.push(where+' bad opp modal')}catch(e){fails.push(where+' opp modal '+e.message)}}
  UI.modal=null;UI.tab=keep;
}
function liveMatch(){
  startMatch();if(!M||M.done)return;clearTimeout(M.timer);
  while(!M.done){
    where='match '+M.min;
    if(M.paused){
      // random substitutions, redo and undo, tactic changes, then resume
      for(let k=0,n=Math.floor(R()*5);k<n;k++){
        const s=mySide(),on=M[s+'Ids'].filter(x=>x!=null),cand=my().players.filter(p=>!M[s+'XI'].includes(p.id)||pendingSub(p.id,'out'));
        if(!on.length||!cand.length)break;ACT.subOut(String(pk(on)));ACT.subIn(String(pk(cand).id));check();
      }
      if(R()<.3)ACT.tac(pk(['att','bal','def']));if(R()<.2)ACT.autoSub();
      try{render();if(bad(els.app.innerHTML))fails.push(where+' bad pause view')}catch(e){fails.push(where+' pause render '+e.message)}
      ACT.resume();clearTimeout(M.timer);continue;
    }
    tick(false);check();
    if(!M.done&&R()<.02){ACT.pauseSub()}
    if(!M.done&&R()<.004){skipMatch();break}
  }
  where='full time';try{render();if(bad(els.app.innerHTML))fails.push(where+' bad FT view')}catch(e){fails.push('FT render '+e.message)}
  if(!S.cheatUsed&&R()<.08&&M.pre){twice('cheat','redo');if(M&&!M.done){clearTimeout(M.timer);skipMatch()}}
  ACT.matchDone();
}
const team=pk(TEAMS.map((t,i)=>[t,i]).filter(([t])=>t.div===DIVS.length-1))[1];
ACT.start(String(team));
let seasons=0,guard=0;
while(seasons<${SEASONS}&&guard++<20000){
  step++;where='S'+S.season+' d'+S.day+' r'+S.round+' step '+step;
  try{
    if(S.event){const n=EVENTS[S.event.k].opts.length;ACT.event(String(Math.floor(R()*n)));for(let i=0;S.event&&i<n;i++)ACT.event(String(i));if(S.event)fails.push(where+' event cannot be resolved '+S.event.k);check();continue}
    if((S.offers||[]).length&&R()<.5){const o=S.offers[0];R()<.3?twice('offerYes',String(o.pid)):ACT.offerNo(String(o.pid));check();continue}
    if(S.round>=rounds()){
      views();
      const offers=S.jobOffers||[];if(offers.length&&R()<.6)twice('takeJob',String(pk(offers).club));else ACT.newSeason();
      seasons++;check();continue;
    }
    const r=R();
    if(r<.04)ACT.form(pk(Object.keys(FORMS)));
    else if(r<.07)ACT.tac(pk(['att','bal','def']));
    else if(r<.09)ACT.train(pk(['rest','normal','hard']));
    else if(r<.13){const i=Math.floor(R()*11),j=Math.floor(R()*11);ACT.slot(String(i));ACT.slot(String(j))}
    else if(r<.16){const p=pk(my().players);if(p)ACT.toggle(String(p.id))}
    else if(r<.18){const p=pk(my().players);if(p)ACT.bench(String(p.id))}
    else if(r<.21&&S.market.length){ACT.buy(String(pk(S.market).id))}
    else if(r<.23){const p=pk(my().players);if(p)twice('sell',String(p.id))}
    else if(r<.245){const p=pk(my().players.filter(x=>x.age<=LOAN_AGE&&!x.loan));if(p)twice('loan',String(p.id))}
    else if(r<.255){const p=pk(my().players.filter(x=>x.loan));if(p)ACT.recall(String(p.id))}
    else if(r<.265){const o=pk(S.teams.filter(t=>t.id!==S.my));const p=pk(o.players);if(p){ACT.bid(String(p.id));const k=Math.floor(Math.random()*3);twice('offer',p.id+':'+k);UI.modal=null}}
    else if(r<.275)twice('fup',pk(['scout','physio','ground','stadium']));
    else if(r<.285&&S.academy.intake.length){R()<.6?ACT.ysign(String(pk(S.academy.intake).id)):twice('yrel',String(pk(S.academy.intake).id))}
    else if(r<.29)twice('aup');
    else if(r<.30)ACT.scout();
    else if(r<.305&&!S.cheatUsed)twice('cheat',pk(['heal','scout','cash']));
    else if(r<.33){// save and reload, compare
      save();const before=JSON.stringify(S);S=load();if(JSON.stringify(S)!==before)fails.push(where+' save/load changed state');}
    else if(r<.36)views();
    else if(r<.37)ACT.auto();
    else if(isMatchDay()){if(S.round===rounds()-1&&R()<.6&&S.mgr)S.mgr.rep=85;if(lineupIssues().length)ACT.auto();if(lineupIssues().length){fails.push(where+' cannot field a lineup: '+lineupIssues()[0]);ACT.auto()}liveMatch()}
    else if(r<.9)ACT.nextDay();else ffToMatch();
    UI.reveal=null;check();
  }catch(e){fails.push(where+' EXCEPTION '+e.message+' '+(e.stack||'').split('\\n').slice(1,3).join(' '));break}
}
ok(!fails.length,'random play, seed ${SEED}: '+step+' actions over '+seasons+' season(s)'+(fails.length?' — '+[...new Set(fails)].slice(0,5).join(' | '):''));
`);
