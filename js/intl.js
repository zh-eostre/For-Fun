/* ---------- 天际冠军杯: the international cup ----------
   32 clubs: our four entrants (甲级's top three and the 天穹杯 winner) and 28 from abroad. eight groups of four play
   home and away (six Wednesdays), the top two of each go to single-match rounds: the last 16, quarter-finals,
   semi-finals and a final (a draw goes to penalties). a cup begun as four groups (an older save) has no last 16. the clubs from abroad live in S.teams so the match engine can use them, marked foreign with
   div -1, and take no part in anything else (league, 天穹杯, transfers, job offers) */
const domestic=()=>S.teams.filter(t=>!t.foreign);
// the clubs from abroad: any of FOREIGN not yet in the game join it (a save from before the pool grew gets the new
// ones); base: the standing a club started with, which it drifts back toward in the years it isn't in the cup
function ensureForeign(){
  const have=new Map(S.teams.filter(t=>t.foreign).map(t=>[t.name,t]));
  FOREIGN.forEach(([name,short,color,rep])=>{
    const old=have.get(name);if(old){if(old.base==null)old.base=rep;return}
    const t={id:S.teams.length,name,short,color,rep,base:rep,str:strFromRep(rep),div:-1,foreign:true,players:[]};
    S.teams.push(t);t.players=makeSquad(t.str+diff().ai);t.players.forEach(p=>{learnSig(p,true);joinClub(p,t,p.age<=21)});
  });
}
// after a 冠军杯 (I): each club abroad's standing moves by how far it went (FOREIGN_FORM); those not in it drift back
function foreignForm(I){
  if(!I||I.winner==null)return;
  const went={};
  I.groups.forEach((g,gi)=>intlTable(gi).forEach((r,i)=>went[r.id]=i===3?0:i===2?1:2));  // group 4th, 3rd, through
  const K=intlKO(I);I.ko.forEach((rd,j)=>rd.forEach(r=>went[r.w]=Math.max(2,5-(K-1-j))));  // won a knockout round: the final is 5
  S.teams.filter(t=>t.foreign).forEach(t=>{
    const off=t.rep-(t.base??t.rep),back=-Math.sign(off);
    const d=went[t.id]!=null?FOREIGN_FORM[went[t.id]]+(Math.abs(off)>FOREIGN_PULL?back:0):back;
    t.rep=clamp(t.rep+d,...FOREIGN_REP);t.str=strFromRep(t.rep);
  });
}
// the clubs from abroad for a 冠军杯, drawn by standing: the stronger a club, the likelier it's in
function drawAbroad(n){
  const pool=S.teams.filter(t=>t.foreign),out=[];
  while(out.length<n&&pool.length){
    const w=pool.map(t=>Math.max(1,t.rep-50)**1.5),sum=w.reduce((a,b)=>a+b,0);let r=rng()*sum,i=0;
    while(i<pool.length-1&&(r-=w[i])>0)i++;
    out.push(pool.splice(i,1)[0]);
  }
  return out;
}
// clubs from abroad only play a handful of matches here, so they don't develop like ours. each summer they renew
// instead: veterans who have slipped below the club's level make way for signings at it. and like our AI clubs they
// are held to their level, though more loosely (the 冠军杯 is the top stage): one far above it (more than 6 over)
// sees its best player leave for leagues beyond our world (one a summer), otherwise stars arriving from our league would pile up abroad year after year
function freshenForeign(){
  S.teams.filter(t=>t.foreign).forEach(t=>{
    for(let n=0;n<8&&aiGap(t)>1;n++){
      const old=t.players.filter(p=>p.ovr<t.str-4).sort((a,b)=>b.age-a.age||a.ovr-b.ovr)[0];if(!old)break;
      const np=makePlayer(old.pos,t.str,ri(23,28));joinClub(np,t,false);t.players[t.players.indexOf(old)]=np;
    }
    for(let n=0;n<1&&aiGap(t)<-6;n++){
      const star=[...t.players].sort((a,b)=>b.ovr-a.ovr)[0];
      const np=makePlayer(star.pos,t.str,ri(23,28));joinClub(np,t,false);t.players[t.players.indexOf(star)]=np;
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
  const ids=top.slice(0,INTL_LEAGUE_PLACES);
  ids.push(cupWinner!=null&&!ids.includes(cupWinner)&&!S.teams[cupWinner].foreign?cupWinner:top[INTL_LEAGUE_PLACES]);
  return ids;
}
// the draw: our clubs go to groups that can't meet before the quarter-finals (A, C, E, G); the rest from abroad fill
// the smallest group first, strongest first
function newIntl(home){
  if(S.intl)foreignForm(S.intl);  // last season's cup moves the clubs abroad up or down
  ensureForeign();freshenForeign();
  const away=drawAbroad(4*INTL_GROUPS-home.length).sort((a,b)=>b.rep-a.rep).map(t=>t.id);
  const groups=Array.from({length:INTL_GROUPS},()=>[]);home.forEach((id,i)=>groups[i*INTL_GROUPS/4].push(id));
  away.forEach(id=>{const g=groups.map((x,i)=>[x.length,i]).sort((a,b)=>a[0]-b[0]||a[1]-b[1])[0][1];groups[g].push(id)});
  news(`${INTL_NAME}抽签：${home.map(id=>S.teams[id].name).join('、')}代表本国出战。`);
  return {season:S.season,weeks:INTL_WEEKS,home,groups,fix:groups.map(g=>genFixtures(g)),res:groups.map(()=>[]),stage:0,ties:[],ko:[],winner:null};
}
// the cup's stages: six group rounds, then the knockout rounds (four after eight groups, three after four)
const intlKO=(I=S.intl)=>I&&I.groups.length>=8?4:3;
const intlStageNames=(I=S.intl)=>[...Array.from({length:INTL_GROUP_ROUNDS},(_,i)=>`小组赛第 ${i+1} 轮`),...INTL_KO_NAMES.slice(-intlKO(I))];
const intlStage=k=>intlStageNames()[k];
const intlStages=()=>intlStageNames().length;
const intlKoPrize=j=>INTL_PRIZE.ko.slice(-intlKO())[j];  // for reaching knockout round j (0: the first)
// a group's table from its results so far: points, then goal difference, then goals
function intlTable(gi){
  const I=S.intl,rows=I.groups[gi].map(id=>({id,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0})),by={};rows.forEach(r=>by[r.id]=r);
  I.res[gi].flat().forEach(m=>{const h=by[m.h],a=by[m.a];h.p++;a.p++;h.gf+=m.hg;h.ga+=m.ag;a.gf+=m.ag;a.ga+=m.hg;
    if(m.hg>m.ag){h.w++;h.pts+=3;a.l++}else if(m.hg<m.ag){a.w++;a.pts+=3;h.l++}else{h.d++;a.d++;h.pts++;a.pts++}});
  return rows.sort((x,y)=>y.pts-x.pts||(y.gf-y.ga)-(x.gf-x.ga)||y.gf-x.gf);
}
// this stage's matches: a group round across all the groups, or the knockout ties
const intlMatches=()=>{const I=S.intl;return I.stage<INTL_GROUP_ROUNDS?I.fix.flatMap(f=>f[I.stage]):I.ties};
// we're still in it and have a match in the current stage
const intlMine=()=>!!(S.intl&&S.intl.stage<intlStages()&&intlMatches().some(m=>m.includes(S.my)));
// the current stage comes before our next league match
const intlDue=()=>!!(S.intl&&S.intl.stage<intlStages()&&intlDay(S.intl.stage)<leagueDay(S.round));
const intlIn=()=>!!(S.intl&&S.intl.groups.flat().includes(S.my));
// plays the current stage (myRes: our live result, or null when we have no match in it)
function playIntl(myRes){
  const I=S.intl,k=I.stage,ko=k>=INTL_GROUP_ROUNDS;
  intlMatches().flat().forEach(id=>abroadForm(S.teams[id]));
  const res=intlMatches().map(([h,a])=>{
    const r=myRes&&(h===S.my||a===S.my)?myRes:quickSim(h,a,'intl');
    if(ko&&r.hg===r.ag&&r.hp===undefined)Object.assign(r,shootout(S.teams[h],autoPick(S.teams[h],'4-4-2'),S.teams[a],autoPick(S.teams[a],'4-4-2')));
    if(ko)r.w=tieWinner(r);return r;
  });
  const mine=res.find(r=>r.h===S.my||r.a===S.my);
  if(!ko){
    I.groups.forEach((g,gi)=>I.res[gi].push(res.filter(r=>g.includes(r.h))));
    if(mine){const f=mine.h===S.my?mine.hg:mine.ag,o=mine.h===S.my?mine.ag:mine.hg,p=f>o?INTL_PRIZE.win:f===o?INTL_PRIZE.draw:0;if(p)I.owed=(I.owed||0)+p}
  }else I.ko.push(res);
  I.stage++;
  if(I.stage===INTL_GROUP_ROUNDS){
    // the top two of each group, paired group by group: A1-B2, B1-A2, C1-D2, D1-C2, …
    const t=I.groups.map((_,gi)=>intlTable(gi));I.ties=[];
    for(let g=0;g<t.length;g+=2)I.ties.push([t[g][0].id,t[g+1][1].id],[t[g+1][0].id,t[g][1].id]);
    if(intlIn()){const through=I.ties.flat().includes(S.my),p=intlKoPrize(0);
      if(through){I.owed=(I.owed||0)+p;news(`${INTL_NAME}小组出线，挺进${intlStage(INTL_GROUP_ROUNDS)}！`)}
      else if(my()&&I.groups.flat().includes(S.my))news(`${INTL_NAME}小组赛出局。`)}
  }else if(ko){
    const w=res.map(r=>r.w);
    // winners meet the winner from the other half of the round's list, so a group's two never meet again early
    if(I.stage<intlStages()){const h=w.length/2;I.ties=w.slice(0,h).map((x,i)=>[x,w[i+h]]);
      if(mine&&mine.w===S.my){I.owed=(I.owed||0)+intlKoPrize(I.stage-INTL_GROUP_ROUNDS);news(`${INTL_NAME}晋级${intlStage(I.stage)}！`)}}
    else{I.ties=[];I.winner=w[0];cupHeadline(INTL_NAME,res[0]);
      if(I.winner===S.my){I.owed=(I.owed||0)+INTL_PRIZE.champion;news(`捧起${INTL_NAME}！大陆之巅！`);unlock('intl')}
      payCup(I,INTL_NAME);updateCupRecords('intl');
}
    if(mine&&mine.w!==S.my)news(`${INTL_NAME}止步${intlStage(k)}，被 ${S.teams[mine.h===S.my?mine.a:mine.h].name} 淘汰。`);
  }
}
// whatever is left once the season is over (the final, after the league, when we're not in it; any stage a test or
// an old save skipped): played now, ours included, so the season's record has a winner
function finishIntl(){while(S.intl&&S.intl.stage<intlStages())playIntl(null)}
// AI-only stages are played on their own Wednesdays as the days go by
function intlCatchUp(){while(S.intl&&S.intl.stage<intlStages()&&!intlMine()&&S.day>=intlDay(S.intl.stage))playIntl(null)}
