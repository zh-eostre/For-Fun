/* ---------- 天穹杯: single-leg knockout for all 16 clubs ---------- */
function newCup(){
  const ids=shuffle(S.teams.map(t=>t.id)),ties=[];
  for(let i=0;i<ids.length;i+=2)ties.push([ids[i],ids[i+1]]);
  return {stage:0,ties,rounds:[],winner:null};
}
const cupDue=()=>S.cup.stage<CUP_STAGES.length&&S.round>=CUP_AT[S.cup.stage];
const inCup=()=>S.cup.ties.some(t=>t.includes(S.my));

// penalties: best of five, then sudden death. log (optional) receives a commentary line per kick
function shootout(H,hi,A,ai,log){
  const takers=(t,ids)=>ids.map(id=>t.players.find(p=>p.id===id)).filter(Boolean).sort((x,y)=>y.ovr-x.ovr);
  const ht=takers(H,hi),at=takers(A,ai),hk=keeper(H,hi),ak=keeper(A,ai);
  const kick=(t,list,k,i)=>{
    const p=list[i%list.length],ok=rng()<.76;
    if(log)log(ok?LINE.penIn(p.name,t.short):LINE.penMiss(p.name,k&&rng()<.6?k.name:null));
    return ok;
  };
  let hp=0,ap=0;
  for(let i=0;i<30;i++){
    if(kick(H,ht,ak,i))hp++;
    if(kick(A,at,hk,i))ap++;
    const left=4-i;  // pairs still to come within the first five
    if(left>0?Math.abs(hp-ap)>left:hp!==ap)break;
  }
  return {hp,ap};
}
const tieWinner=r=>r.hg>r.ag||(r.hg===r.ag&&r.hp>r.ap)?r.h:r.a;

// plays out the current stage; myRes is our live result (null when we're already out)
function playCupStage(myRes){
  const C=S.cup,k=C.stage;
  const res=C.ties.map(([h,a])=>{
    const r=myRes&&(h===S.my||a===S.my)?myRes:quickSim(h,a);
    if(r.hg===r.ag&&r.hp===undefined)Object.assign(r,shootout(S.teams[h],autoPick(S.teams[h],'4-4-2'),S.teams[a],autoPick(S.teams[a],'4-4-2')));
    r.w=tieWinner(r);return r;
  });
  C.rounds.push(res);
  const win=res.map(r=>r.w);
  C.stage++;C.ties=[];
  if(C.stage<CUP_STAGES.length)for(let i=0;i<win.length;i+=2)C.ties.push([win[i],win[i+1]]);
  else C.winner=win[0];
  const mine=res.find(r=>r.h===S.my||r.a===S.my);
  if(mine){
    const opp=S.teams[mine.h===S.my?mine.a:mine.h];
    if(mine.w===S.my){
      if(my().div>opp.div)unlock('giant');
      if(C.winner===S.my){S.budget+=CUP_PRIZE[k+1];news(`捧起${CUP_NAME}！奖金 ${money(CUP_PRIZE[k+1])}。`);unlock('cup')}
      else news(`${CUP_NAME}晋级${CUP_STAGES[C.stage]}！`);
    }else{
      S.budget+=CUP_PRIZE[k];
      news(`${CUP_NAME}止步${CUP_STAGES[k]}，被 ${opp.name} 淘汰。${CUP_PRIZE[k]?`奖金 ${money(CUP_PRIZE[k])}。`:''}`);
    }
  }
  if(C.winner!==null&&C.winner!==S.my)news(`${CUP_NAME}冠军：${S.teams[C.winner].name}。`);
}
