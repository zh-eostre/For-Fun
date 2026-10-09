/* ---------- 天际冠军杯: the international cup ----------
   16 clubs: our three entrants (甲级's top two and the 天穹杯 winner) and 13 from abroad. four groups of four play home
   and away (six Wednesdays), the top two of each go to single-match quarter-finals, semi-finals and a final (a draw
   goes to penalties). the clubs from abroad live in S.teams so the match engine can use them, marked foreign with
   div -1, and take no part in anything else (league, 天穹杯, transfers, job offers) */
const domestic=()=>S.teams.filter(t=>!t.foreign);
function ensureForeign(){
  if(S.teams.some(t=>t.foreign))return;
  FOREIGN.forEach(([name,short,color,rep])=>{
    const t={id:S.teams.length,name,short,color,rep,str:strFromRep(rep),div:-1,foreign:true,players:[]};
    S.teams.push(t);t.players=makeSquad(t.str);t.players.forEach(p=>learnSig(p,true));
  });
}
// clubs from abroad only play a handful of matches here, so they don't develop like ours. each summer they renew
// instead: veterans who have slipped below the club's level make way for signings at it
function freshenForeign(){
  S.teams.filter(t=>t.foreign).forEach(t=>{
    for(let n=0;n<8&&aiGap(t)>1;n++){
      const old=t.players.filter(p=>p.ovr<t.str-4).sort((a,b)=>b.age-a.age||a.ovr-b.ovr)[0];if(!old)break;
      t.players[t.players.indexOf(old)]=makePlayer(old.pos,t.str,ri(23,28));
    }
  });
}
// clubs from abroad play their own league at the weekends, which isn't simulated here. on a 冠军杯 day their squad
// is as worn as the 甲级 clubs' first choices are on average (the whole squad, or they'd just field the fresh bench),
// so a home club isn't facing a side fresh every time
function abroadForm(t){
  if(!t.foreign)return;
  aiRecover(t);
  const xiCond=u=>{const ps=onPitch(u,bestForm(u,true).ids).filter(Boolean);return ps.reduce((s,p)=>s+p.cond,0)/ps.length};
  const top=S.teams.filter(u=>u.div===0&&u.id!==S.my);top.forEach(aiRecover);
  const avg=top.reduce((s,u)=>s+xiCond(u),0)/top.length;
  t.players.forEach(p=>p.cond=Math.min(p.cond,Math.round(clamp(avg+ri(-5,5),40,100))));
}
const intlDay=k=>(S.pre||0)+7*(S.intl.weeks||INTL_WEEKS_V1)[k]+2;
// our entrants from a final 甲级 table (ids, best first) and the cup winner
function intlEntrants(top,cupWinner){
  const ids=top.slice(0,2);
  ids.push(cupWinner!=null&&!ids.includes(cupWinner)&&!S.teams[cupWinner].foreign?cupWinner:top[2]);
  return ids;
}
// the draw: our clubs go to different groups; the 13 from abroad fill the smallest group first, strongest first
function newIntl(home){
  ensureForeign();freshenForeign();
  const away=shuffle(S.teams.filter(t=>t.foreign)).slice(0,13).sort((a,b)=>b.rep-a.rep).map(t=>t.id);
  const groups=[[],[],[],[]];home.forEach((id,i)=>groups[i].push(id));
  away.forEach(id=>{const g=groups.map((x,i)=>[x.length,i]).sort((a,b)=>a[0]-b[0]||a[1]-b[1])[0][1];groups[g].push(id)});
  news(`${INTL_NAME}抽签：${home.map(id=>S.teams[id].name).join('、')}代表本国出战。`);
  return {season:S.season,weeks:INTL_WEEKS,home,groups,fix:groups.map(g=>genFixtures(g)),res:groups.map(()=>[]),stage:0,ties:[],ko:[],winner:null};
}
const intlStages=()=>INTL_STAGES.length;
// a group's table from its results so far: points, then goal difference, then goals
function intlTable(gi){
  const I=S.intl,rows=I.groups[gi].map(id=>({id,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0})),by={};rows.forEach(r=>by[r.id]=r);
  I.res[gi].flat().forEach(m=>{const h=by[m.h],a=by[m.a];h.p++;a.p++;h.gf+=m.hg;h.ga+=m.ag;a.gf+=m.ag;a.ga+=m.hg;
    if(m.hg>m.ag){h.w++;h.pts+=3;a.l++}else if(m.hg<m.ag){a.w++;a.pts+=3;h.l++}else{h.d++;a.d++;h.pts++;a.pts++}});
  return rows.sort((x,y)=>y.pts-x.pts||(y.gf-y.ga)-(x.gf-x.ga)||y.gf-x.gf);
}
// this stage's matches: a group round across all four groups, or the knockout ties
const intlMatches=()=>{const I=S.intl;return I.stage<6?I.fix.flatMap(f=>f[I.stage]):I.ties};
// we're still in it and have a match in the current stage
const intlMine=()=>!!(S.intl&&S.intl.stage<intlStages()&&intlMatches().some(m=>m.includes(S.my)));
// the current stage comes before our next league match
const intlDue=()=>!!(S.intl&&S.intl.stage<intlStages()&&intlDay(S.intl.stage)<leagueDay(S.round));
const intlIn=()=>!!(S.intl&&S.intl.groups.flat().includes(S.my));
// plays the current stage (myRes: our live result, or null when we have no match in it)
function playIntl(myRes){
  const I=S.intl,k=I.stage,ko=k>=6;
  intlMatches().flat().forEach(id=>abroadForm(S.teams[id]));
  const res=intlMatches().map(([h,a])=>{
    const r=myRes&&(h===S.my||a===S.my)?myRes:quickSim(h,a);
    if(ko&&r.hg===r.ag&&r.hp===undefined)Object.assign(r,shootout(S.teams[h],autoPick(S.teams[h],'4-4-2'),S.teams[a],autoPick(S.teams[a],'4-4-2')));
    if(ko)r.w=tieWinner(r);return r;
  });
  const mine=res.find(r=>r.h===S.my||r.a===S.my);
  if(!ko){
    I.groups.forEach((g,gi)=>I.res[gi].push(res.filter(r=>g.includes(r.h))));
    if(mine){const f=mine.h===S.my?mine.hg:mine.ag,o=mine.h===S.my?mine.ag:mine.hg,p=f>o?INTL_PRIZE.win:f===o?INTL_PRIZE.draw:0;if(p)S.budget+=p}
  }else I.ko.push(res);
  I.stage++;
  if(I.stage===6){
    // the top two of each group: A1-B2, B1-A2, C1-D2, D1-C2
    const t=[0,1,2,3].map(intlTable);
    I.ties=[[t[0][0].id,t[1][1].id],[t[1][0].id,t[0][1].id],[t[2][0].id,t[3][1].id],[t[3][0].id,t[2][1].id]];
    if(intlIn()){const through=I.ties.flat().includes(S.my);
      if(through){S.budget+=INTL_PRIZE.ko[0];news(`${INTL_NAME}小组出线，挺进八强！奖金 ${money(INTL_PRIZE.ko[0])}。`)}
      else if(my()&&I.groups.flat().includes(S.my))news(`${INTL_NAME}小组赛出局。`)}
  }else if(ko){
    const w=res.map(r=>r.w);
    if(I.stage<intlStages()){I.ties=I.stage===7?[[w[0],w[2]],[w[1],w[3]]]:[[w[0],w[1]]];
      if(mine&&mine.w===S.my){const p=INTL_PRIZE.ko[I.stage-6];S.budget+=p;news(`${INTL_NAME}晋级${INTL_STAGES[I.stage]}！奖金 ${money(p)}。`)}}
    else{I.ties=[];I.winner=w[0];
      if(I.winner===S.my){S.budget+=INTL_PRIZE.champion;news(`捧起${INTL_NAME}！大陆之巅，奖金 ${money(INTL_PRIZE.champion)}。`);unlock('intl')}
      else news(`${INTL_NAME}冠军：${S.teams[I.winner].name}。`)}
    if(mine&&mine.w!==S.my)news(`${INTL_NAME}止步${INTL_STAGES[k]}，被 ${S.teams[mine.h===S.my?mine.a:mine.h].name} 淘汰。`);
  }
}
// whatever is left once the season is over (the final, after the league, when we're not in it; any stage a test or
// an old save skipped): played now, ours included, so the season's record has a winner
function finishIntl(){while(S.intl&&S.intl.stage<intlStages())playIntl(null)}
// AI-only stages are played on their own Wednesdays as the days go by
function intlCatchUp(){while(S.intl&&S.intl.stage<intlStages()&&!intlMine()&&S.day>=intlDay(S.intl.stage))playIntl(null)}
