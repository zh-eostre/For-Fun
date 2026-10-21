/* ---------- 天穹杯: single-leg knockout for every club ----------
   when the clubs don't make a power of two, the weakest (by 底蕴) play a qualifying round first and the rest get a
   bye into the main draw (last 16, or last 32 for the 36-club pyramid). the format (stage names, timing, prizes) is stored on the cup, so an older save's cup finishes as it began */
const cupFmt=(C=S.cup)=>C.fmt||CUP_LEGACY;
const stageName=(k,C=S.cup)=>cupFmt(C).names[k];
const cupDay=k=>(S.pre||0)+7*cupFmt().at[k]+2;
const pairUp=ids=>{const t=[];for(let i=0;i+1<ids.length;i+=2)t.push([ids[i],ids[i+1]]);return t};
// every round is drawn afresh: the balls come out one by one and are paired in that order, the first of a pair at
// home. the draw is kept on the cup (C.draw: the stage and the balls in order) for the ceremony on the club page
function cupDraw(C,stage,pool){const picks=shuffle(pool);C.draw={stage,picks};return pairUp(picks)}
function newCup(){
  // the main draw is the biggest power of two that fits (16 or 32); the clubs over it play a qualifying round
  const home=S.teams.filter(t=>!t.foreign),n=home.length,base=n>=32?32:16,extra=Math.max(0,n-base);
  if(!extra){const C={fmt:CUP_LEGACY,stage:0,byes:[],rounds:[],winner:null};C.ties=cupDraw(C,0,home.map(t=>t.id));return C}
  const order=[...home].sort((a,b)=>(a.rep||0)-(b.rep||0)).map(t=>t.id);
  const C={fmt:base===32?(S.cal>=4?CUP_FORMAT32_C4:CUP_FORMAT32):CUP_FORMAT,stage:0,byes:order.slice(extra*2),rounds:[],winner:null};
  C.ties=cupDraw(C,0,order.slice(0,extra*2));return C;
}
// with every round drawn afresh, the bracket on the cup page is put together afterwards: from the newest draw back to
// the last 16, each round's results are reordered so the two ties whose winners were drawn together sit side by side
function alignBracket(C){
  const start=Math.max(0,cupFmt(C).names.indexOf('十六强'));
  for(let k=C.stage-1;k>=start;k--){
    const next=k+1===C.stage?C.ties:C.rounds[k+1].map(r=>[r.h,r.a]),byW=new Map(C.rounds[k].map(r=>[r.w,r]));
    if(next.flat().every(id=>byW.has(id)))C.rounds[k]=next.flat().map(id=>byW.get(id));
  }
}
// a draw with us in it gets a ceremony on the club page (S.drawQ: the draws still to be shown), and a line in the news
function queueDraw(kind){
  const D=kind==='cup'?S.cup.draw:S.intl&&S.intl.draw;if(!D)return;
  const ids=kind==='cup'?D.picks:D.picks.map(p=>p.id);if(!ids.includes(S.my))return;
  (S.drawQ=S.drawQ||[]).push({kind,stage:kind==='cup'?D.stage:0,season:S.season});
  if(kind==='cup'){const t=S.cup.ties.find(x=>x.includes(S.my)),o=S.teams[t[0]===S.my?t[1]:t[0]];
    news(`🎱 ${CUP_NAME}${stageName(D.stage)}抽签！命运的签球落定——${t[0]===S.my?`我们将坐镇主场，迎战 ${o.name}`:`我们将远征 ${o.name} 的主场`}。`)}
  else{const I=S.intl,g=I.groups.findIndex(x=>x.includes(S.my));
    news(`🎱 ${INTL_NAME}抽签！我们落入 ${'ABCDEFGH'[g]} 组，同组的是 ${I.groups[g].filter(id=>id!==S.my).map(id=>S.teams[id].name).join('、')}。大陆的舞台，等待我们登场！`)}
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
  // kicks: every kick in order ({s: 'h'/'a', ok, sv: saved by the keeper, line}) so a live match can reveal them one at a time
  const kicks=[],kick=(t,list,k,i,side)=>{
    const p=list[i%list.length],ok=rng()<.76,sv=!ok&&!!k&&rng()<.6,line=ok?LINE.penIn(p.name,t.short):LINE.penMiss(p.name,sv?k.name:null);
    if(log)log(line);kicks.push({s:side,ok,sv,line});return ok;
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
// a cup final: the result on the club page for a week, and in the news when it wasn't ours
function cupHeadline(cup,r){
  const w=S.teams[r.w],l=S.teams[r.w===r.h?r.a:r.h],sc=`${r.hg}:${r.ag}${r.hp!=null?`（点球 ${r.hp}:${r.ap}）`:''}`;
  S.headline={season:S.season,day:S.day,cup,h:r.h,a:r.a,score:sc,winner:r.w};
  if(r.w!==S.my&&r.h!==S.my&&r.a!==S.my)news(`🏆 加冕时刻！${w.name} 夺得${cup}冠军，在决赛中以 ${S.teams[r.h].short} ${sc} ${S.teams[r.a].short} 让 ${l.name} 饮恨。`);
}
function playCupStage(myRes){
  const C=S.cup,k=C.stage;
  const res=C.ties.map(([h,a])=>{
    const r=myRes&&(h===S.my||a===S.my)?myRes:quickSim(h,a,'cup');
    if(r.hg===r.ag&&r.hp===undefined)Object.assign(r,shootout(S.teams[h],autoPick(S.teams[h],'4-4-2'),S.teams[a],autoPick(S.teams[a],'4-4-2')));
    r.w=tieWinner(r);return r;
  });
  C.rounds.push(res);
  const win=res.map(r=>r.w);
  C.stage++;C.ties=[];
  if(C.stage<cupFmt(C).names.length){
    // the next round is drawn afresh (qualifiers join the clubs that had a bye)
    const pool=(C.byes||[]).concat(win);C.byes=[];
    C.ties=cupDraw(C,C.stage,pool);alignBracket(C);queueDraw('cup');
  }else{C.winner=win[0];cupHeadline(CUP_NAME,res[0])}
  const mine=res.find(r=>r.h===S.my||r.a===S.my);
  if(mine){
    const opp=S.teams[mine.h===S.my?mine.a:mine.h];
    if(mine.w===S.my){
      if(my().div>opp.div)unlock('giant');
      const P=cupFmt(C).prize;
      if(C.winner===S.my){C.owed=P[k+1];news(`捧起${CUP_NAME}！`);unlock('cup')}
      else news(`${CUP_NAME}晋级${stageName(C.stage)}！`);
    }else{
      const P=cupFmt(C).prize;C.owed=P[k];
      news(`${CUP_NAME}止步${stageName(k)}，被 ${opp.name} 淘汰。${P[k]?`奖金 ${money(P[k])} 在决赛后发放。`:''}`);
    }
  }
  if(C.winner!==null&&C.winner!==S.my)news(`${CUP_NAME}冠军：${S.teams[C.winner].name}。`);
  if(C.winner!==null){payCup(C,CUP_NAME);updateCupRecords('cup')}
}
// a cup's prize money is paid when its final has been played: what we earned on the way (C.owed), all at once
function payCup(C,name){
  if(!C.owed)return;
  S.budget+=C.owed;news(`💰 ${name}落幕，本队奖金 ${money(C.owed)} 入账。`);C.owed=0;
}
