/* ---------- 天穹杯: single-leg knockout for every club ----------
   when the clubs don't make a power of two, the weakest (by 底蕴) play a qualifying round first and the rest get a
   bye into the main draw (last 16, or last 32 for the 36-club pyramid). the format (stage names, timing, prizes) is stored on the cup, so an older save's cup finishes as it began */
const cupFmt=(C=S.cup)=>C.fmt||CUP_LEGACY;
const stageName=(k,C=S.cup)=>cupFmt(C).names[k];
const cupDay=k=>(S.pre||0)+7*cupFmt().at[k]+2;
const pairUp=ids=>{const t=[];for(let i=0;i+1<ids.length;i+=2)t.push([ids[i],ids[i+1]]);return t};
function newCup(){
  // the main draw is the biggest power of two that fits (16 or 32); the clubs over it play a qualifying round
  const home=S.teams.filter(t=>!t.foreign),n=home.length,base=n>=32?32:16,extra=Math.max(0,n-base);
  if(!extra)return {fmt:CUP_LEGACY,stage:0,ties:pairUp(shuffle(home.map(t=>t.id))),byes:[],rounds:[],winner:null};
  const order=[...home].sort((a,b)=>(a.rep||0)-(b.rep||0)).map(t=>t.id);
  return {fmt:base===32?CUP_FORMAT32:CUP_FORMAT,stage:0,ties:pairUp(shuffle(order.slice(0,extra*2))),byes:order.slice(extra*2),rounds:[],winner:null};
}
// the next cup stage comes before our next league match (by date: lower divisions also play midweek rounds)
const cupDue=()=>S.cup.stage<cupFmt().names.length&&cupDay(S.cup.stage)<leagueDay(S.round);
const inCup=()=>S.cup.ties.some(t=>t.includes(S.my));
// still in the competition: not knocked out yet (a bye in the qualifying round counts as still in)
const cupAlive=()=>{const C=S.cup;if(C.skipped)return false;if(C.winner!=null)return C.winner===S.my;
  return !C.rounds.some(rd=>rd.some(r=>(r.h===S.my||r.a===S.my)&&r.w!==S.my))};

// penalties: best of five, then sudden death. log (optional) receives a commentary line per kick
function shootout(H,hi,A,ai,log){
  const takers=(t,ids)=>ids.map(id=>t.players.find(p=>p.id===id)).filter(Boolean).sort((x,y)=>y.ovr-x.ovr);
  const ht=takers(H,hi),at=takers(A,ai),hk=keeper(H,hi),ak=keeper(A,ai);
  // kicks: every kick in order ({s: 'h'/'a', ok, line}) so a live match can reveal them one at a time
  const kicks=[],kick=(t,list,k,i,side)=>{
    const p=list[i%list.length],ok=rng()<.76,line=ok?LINE.penIn(p.name,t.short):LINE.penMiss(p.name,k&&rng()<.6?k.name:null);
    if(log)log(line);kicks.push({s:side,ok,line});return ok;
  };
  let hp=0,ap=0;
  for(let i=0;i<30;i++){
    if(kick(H,ht,ak,i,'h'))hp++;
    // the second team doesn't kick when the first five can no longer be caught
    if(i<5&&(hp-ap>5-i||ap-hp>4-i))break;
    if(kick(A,at,hk,i,'a'))ap++;
    const left=4-i;  // pairs still to come within the first five
    if(left>0?Math.abs(hp-ap)>left:hp!==ap)break;
  }
  return {hp,ap,kicks};
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
  if(C.stage<cupFmt(C).names.length){
    // qualifiers join the clubs that had a bye, and the last 16 is drawn afresh
    const pool=C.byes&&C.byes.length?shuffle(C.byes.concat(win)):win;C.byes=[];
    C.ties=pairUp(pool);
  }else C.winner=win[0];
  const mine=res.find(r=>r.h===S.my||r.a===S.my);
  if(mine){
    const opp=S.teams[mine.h===S.my?mine.a:mine.h];
    if(mine.w===S.my){
      if(my().div>opp.div)unlock('giant');
      const P=cupFmt(C).prize;
      if(C.winner===S.my){S.budget+=P[k+1];news(`捧起${CUP_NAME}！奖金 ${money(P[k+1])}。`);unlock('cup')}
      else news(`${CUP_NAME}晋级${stageName(C.stage)}！`);
    }else{
      const P=cupFmt(C).prize;S.budget+=P[k];
      news(`${CUP_NAME}止步${stageName(k)}，被 ${opp.name} 淘汰。${P[k]?`奖金 ${money(P[k])}。`:''}`);
    }
  }
  if(C.winner!==null&&C.winner!==S.my)news(`${CUP_NAME}冠军：${S.teams[C.winner].name}。`);
}
