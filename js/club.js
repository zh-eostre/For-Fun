/* ---------- rival ---------- */
function pickRival(){return pick(S.teams.filter(t=>t.div===my().div&&t.id!==S.my)).id}

/* ---------- achievements ---------- */
function unlock(k){
  if(S.ach[k])return;
  S.ach[k]=S.season;
  news(`解锁称号「${ACH[k][0]}」：${ACH[k][1]}。`);
  toast(`称号解锁：「${ACH[k][0]}」`);
}

/* ---------- AI bids for your players ---------- */
// a pending bid lasts until the next match; then it lapses and a new one may arrive
function rollOffer(){
  if(S.offer){news(`${S.teams[S.offer.club].name} 的报价已过期。`);S.offer=null}
  if(rng()>=OFFER_CHANCE)return;
  const p=pick(my().players.filter(x=>!unavail(x)));
  const clubs=p&&S.teams.filter(t=>t.id!==S.my&&t.str+10>=p.ovr);
  if(!clubs||!clubs.length)return;
  const club=pick(clubs);
  S.offer={pid:p.id,club:club.id,amount:Math.max(5,Math.round(marketValue(p)*rnd(1.05,1.6)))};
  news(`${club.name} 带着 ${money(S.offer.amount)} 的契约书前来，想要带走 ${p.name}。`);
}
// moving a player to an AI club keeps his career at our club on record
function bankPlayer(p){
  const c=S.club[p.id]||(S.club[p.id]={name:p.name,pos:p.pos,goals:0,apps:0});
  c.goals+=p.goals;c.apps+=p.apps;c.lapps=(c.lapps||0)+(p.lapps||0);
}
function acceptOffer(){
  const o=S.offer,p=findP(o.pid),club=S.teams[o.club];
  if(!p){S.offer=null;return}
  if(squadSize()<=14){toast('一线队至少要保留 14 人');return}
  bankPlayer(p);  // his season goals stay with him so the golden boot race is unaffected
  my().players=my().players.filter(x=>x!==p);dropFromLineup(p.id);
  club.players.push(p);
  if(club.players.length>20){
    const drop=club.players.filter(x=>x.pos===p.pos&&x!==p).sort((x,y)=>x.ovr-y.ovr||y.age-x.age)[0];
    if(drop)club.players=club.players.filter(x=>x!==drop);
  }
  S.budget+=o.amount;S.offer=null;
  news(`契约成立：${p.name} 以 ${money(o.amount)} 转投 ${club.name}。`);
  if(o.amount>=200)unlock('deal');
  toast(`${p.name} 已转会，进账 ${money(o.amount)}`);
}
function rejectOffer(){
  news(`拒绝了 ${S.teams[S.offer.club].name} 对 ${(findP(S.offer.pid)||{}).name} 的报价。`);
  S.offer=null;toast('报价已拒绝');
}

/* ---------- random events ---------- */
const teamCond=d=>my().players.forEach(p=>p.cond=clamp(p.cond+d,30,100));
const raiseMorale=()=>S.boost=Math.max(S.boost,1);
// each option: [button, what happens, effect(p), optional availability check]
const EVENTS={
  fans:{text:()=>'一群狂热球迷聚集在训练场外，高举横幅：「让我们见证奇迹！」',opts:[
    ['开放训练','全队体能 -10，下一场士气高涨',()=>{teamCond(-10);raiseMorale()}],
    ['闭门谢客','什么都不会发生',()=>{}]]},
  investor:{text:()=>'一位戴着银色面具的神秘人留下一只手提箱：「这是给强者的馈赠。」',opts:[
    ['收下','资金 +100 万，但箱子似乎被诅咒了：全队体能 -15',()=>{S.budget+=100;teamCond(-15)}],
    ['原封退回','什么都不会发生',()=>{}]]},
  homesick:{who:()=>pick(S.lineup.map(findP).filter(p=>p&&!unavail(p))),
    text:p=>`${p.name} 收到一封家书，想回家探亲一轮。`,opts:[
    ['准假','他缺席下一场，回来后能力 +2',p=>{p.away=1;p.ovr=Math.min(95,p.ovr+2);p.pot=Math.max(p.pot,p.ovr);giveSig(p)}],
    ['留下','他会留队，但心不在焉：体能 -20',p=>{p.cond=Math.max(30,p.cond-20)}]]},
  master:{who:()=>my().players.filter(p=>p.age<=23&&p.pot-p.ovr>=4).sort((a,b)=>b.pot-a.pot)[0],
    text:p=>`隐居山中的传奇教练路过，说 ${p.name} 身上有「龙的气息」，愿意指点一番，只收 40 万。`,opts:[
    ['拜师','花 40 万，他的能力 +2、潜力 +4',p=>{S.budget-=40;p.pot=Math.min(95,p.pot+4);p.ovr=Math.min(p.pot,p.ovr+2);giveSig(p)},()=>S.budget>=40],
    ['婉拒','什么都不会发生',()=>{}]]},
  storm:{text:()=>'一场暴风雨摧毁了训练场，草皮被掀得一片狼藉。',opts:[
    ['花 30 万抢修','资金 -30 万',()=>{S.budget-=30},()=>S.budget>=30],
    ['将就着练','全队体能 -15',()=>teamCond(-15)]]},
  tv:{text:()=>`电视台想拍一部纪录片：《${my().name}：深渊与荣光》。`,opts:[
    ['同意拍摄','资金 +50 万，镜头干扰训练：全队体能 -5',()=>{S.budget+=50;teamCond(-5)}],
    ['拒绝','什么都不会发生',()=>{}]]},
  oracle:{text:()=>'一位占卜师拦住了球队大巴：「下一战，星辰站在你们这边……只要你相信。」',opts:[
    ['相信她','下一场士气高涨',raiseMorale],
    ['请她让开','什么都不会发生',()=>{}]]}
};
function rollEvent(){
  if(S.event||rng()>=EVENT_CHANCE)return;
  const k=pick(Object.keys(EVENTS)),E=EVENTS[k],p=E.who?E.who():null;
  if(E.who&&!p)return;
  S.event={k,pid:p?p.id:null};
}
const eventPlayer=()=>S.event.pid!=null?findP(S.event.pid):null;
function resolveEvent(i){
  const E=EVENTS[S.event.k],o=E.opts[i],p=eventPlayer();
  if(E.who&&!p){S.event=null;return}  // the player left in the meantime
  if(o[3]&&!o[3]()){toast('资金不够');return}
  o[2](p);news(`${E.text(p)}——${o[0]}。`);S.event=null;
}

/* ---------- season awards ---------- */
const AWARDS={mvp:'最佳球员',young:'最佳新秀',gk:'最佳门将',boot:'金靴'};
// per division: best average rating (8+ matches), best 21-and-under, best keeper, top scorer
function seasonAwards(div){
  const ps=S.teams.filter(t=>t.div===div).flatMap(t=>t.players.map(p=>({p,t})));
  const q=ps.filter(x=>x.p.rn>=8),best=f=>q.filter(f).sort((a,b)=>avgRating(b.p)-avgRating(a.p))[0];
  const boot=ps.filter(x=>x.p.goals>0).sort((a,b)=>b.p.goals-a.p.goals)[0];
  const out=(x,stat)=>x&&{name:x.p.name,pos:x.p.pos,team:x.t.name,tid:x.t.id,stat};
  return {mvp:out(best(()=>true),q.length&&avgRating(best(()=>true).p).toFixed(2)),young:out(best(x=>x.p.age<=21),best(x=>x.p.age<=21)&&avgRating(best(x=>x.p.age<=21).p).toFixed(2)),
    gk:out(best(x=>x.p.pos==='GK'),best(x=>x.p.pos==='GK')&&avgRating(best(x=>x.p.pos==='GK').p).toFixed(2)),boot:out(boot,boot&&boot.p.goals+' 球')};
}

/* ---------- club history ---------- */
function recordSeason(div,rank){
  const champ=d=>{const t=table(d)[0];return t&&t.name};
  const awards=DIVS.map((_,d)=>seasonAwards(d));
  S.records.push({season:S.season,champs:DIVS.map((_,d)=>champ(d)),cup:S.cup.winner!=null?S.teams[S.cup.winner].name:null,div,rank,awards});
  awards.forEach((a,d)=>Object.entries(a).forEach(([k,w])=>{if(w&&w.tid===S.my)news(`${w.name} 获得${DIVS[d]}${AWARDS[k]}（${w.stat}）！`)}));
  // trophies won this season; a player shares in one if he made TITLE_APPS appearances
  const won=[rank===1?`第 ${S.season} 季${DIVS[div]}冠军`:'',S.cup.winner===S.my?`第 ${S.season} 季${CUP_NAME}冠军`:''].filter(Boolean);
  my().players.forEach(p=>{
    const apps=p.apps;bankPlayer(p);
    const c=S.club[p.id];c.seasons=(c.seasons||0)+1;c.titles=c.titles||[];
    if(apps>=TITLE_APPS)c.titles=c.titles.concat(won);
  });
  if(div===0&&rank===1){unlock('champ');if(S.cup.winner===S.my)unlock('double')}
}
// club legends retire with us after LEGEND_TITLE_SEASONS seasons and at least one trophy, or after LEGEND_SEASONS seasons.
// called after recordSeason has banked the season, so the totals are complete
const TITLE_APPS=5,LEGEND_TITLE_SEASONS=3,LEGEND_SEASONS=8;
const isLegend=c=>!!c&&((c.seasons||0)>=LEGEND_SEASONS||((c.seasons||0)>=LEGEND_TITLE_SEASONS&&(c.titles||[]).length>0));
function retireLegend(p){
  const c=S.club[p.id];
  if(isLegend(c))S.legends.push({name:p.name,pos:p.pos,goals:c.goals,apps:c.apps,seasons:c.seasons,titles:c.titles||[],season:S.season});
}
// all-time scorers for our club: banked seasons plus the current one
function clubScorers(){
  const m={};
  Object.entries(S.club).forEach(([id,c])=>m[id]={...c});
  my().players.forEach(p=>{const c=m[p.id]||(m[p.id]={name:p.name,pos:p.pos,goals:0,apps:0});c.goals+=p.goals;c.apps+=p.apps});
  return Object.values(m).filter(c=>c.goals>0).sort((a,b)=>b.goals-a.goals||a.apps-b.apps).slice(0,10);
}

/* ---------- youth academy ---------- */
// each season the academy sends 3 (4 from level 3) prospects with scout reports; better levels mean
// better kids and more accurate reports, and now and then a "chosen one" whose report badly undersells him
function scoutYouth(p,lv){
  const r=rng(),conf=r<.12*lv?'high':r<.12*lv+.45?'mid':'low';
  const est=conf==='high'?p.pot:p.pot+ri(conf==='mid'?-4:-8,conf==='mid'?4:8);
  scoutReport(p,{conf,est});delete p.price;
}
function newIntake(){
  const lv=S.academy.lv,n=lv>=3?4:3,kids=[];
  for(let i=0;i<n;i++){
    const p=makePlayer(pick(['GK','DF','DF','MF','MF','MF','FW','FW']),38+lv*3,ri(16,18));
    p.pot=clamp(p.ovr+ri(10,20)+lv*2,p.ovr,93);p.youth=true;
    if(rng()<.04*lv){p.pot=ri(90,95);p.chosen=true;scoutYouth(p,1)}else scoutYouth(p,lv);
    kids.push(p);
  }
  S.academy.intake=kids;
  news(`青训营送来了 ${n} 名少年${kids.some(k=>k.chosen)?'，其中一人身上散发着异样的气息……':''}。去「设施」页的青训营看看吧。`);
}
function signYouth(id){
  const p=S.academy.intake.find(x=>x.id===id);if(!p)return;
  if(squadFull()){toast('一线队已满 22 人');return}
  const est=p.scout.est;delete p.scout;delete p.chosen;
  S.academy.intake=S.academy.intake.filter(x=>x!==p);p.joined=S.season;my().players.push(p);
  UI.reveal={name:p.name,pot:p.pot,est,diff:p.pot-est};
  news(`青训少年 ${p.name}（${POS[p.pos]}，${p.age} 岁，能力 ${p.ovr}，真实潜力 ${p.pot}）升入一线队。`);
}
function releaseYouth(id){S.academy.intake=S.academy.intake.filter(x=>x.id!==id)}
function upgradeAcademy(){
  const lv=S.academy.lv,c=ACADEMY_COST[lv];
  if(lv>=ACADEMY_COST.length){toast('青训营已是最高等级');return}
  if(S.budget<c){toast('资金不够');return}
  S.budget-=c;S.academy.lv++;
  news(`青训营升级到 ${S.academy.lv} 级，花费 ${money(c)}。`);toast(`青训营升到 ${S.academy.lv} 级！`);
}

/* ---------- facilities: scout department, physio room, training ground (levels 1-5) ---------- */
const facLv=k=>(S.fac&&S.fac[k])||1;
// scout department: more accurate reports, a bigger market, more hidden gems, cheaper refreshes, opponent reports from level 3
const scoutShare=()=>{const L=facLv('scout');return {high:.25+.1*(L-1),low:Math.max(0,.25-.0625*(L-1))}};
const scoutErr=()=>{const L=facLv('scout');return {mid:Math.round(4-.5*(L-1)),low:8-(L-1)}};
const marketSize=()=>12+facLv('scout')-1;
const gemChance=()=>.35+.05*(facLv('scout')-1);
const scoutCost=()=>20-2.5*(facLv('scout')-1);
// physio room: fewer injuries, shorter ones, faster recovery, and from level 4 some knocks can be played through
const physioRisk=()=>1-.075*(facLv('physio')-1);
const quickHeal=()=>.165*(facLv('physio')-1);  // chance an injury's length is halved
const restAmt=()=>DAY_REST+facLv('physio')-1;
const knockChance=()=>({4:.35,5:.5})[facLv('physio')]||0;
// training ground: faster growth on training days
const groundMult=()=>1+.15*(facLv('ground')-1);
const pct=x=>Math.round(x*100)+'%';
// what a facility does at level L, for the facilities page
const FAC={
  scout:{name:'球探部',fx:L=>`市场 ${12+L-1} 人 · 报告准确率 ${pct(.25+.1*(L-1))} · 刷新 ${money(20-2.5*(L-1))}${L>=3?' · 对手情报':''}`},
  physio:{name:'理疗室',fx:L=>`受伤风险 ${pct(1-.075*(L-1))} · 休息日体能 +${DAY_REST+L-1}${L>=4?' · 部分伤病可带伤再战':''}`},
  ground:{name:'训练场',fx:L=>`训练成长 ×${(1+.15*(L-1)).toFixed(2)}`},
  stadium:{name:'球场',cost:[0,100,200,350,550],fx:L=>`主场门票收入 ×${(1+.25*(L-1)).toFixed(2)}`}
};
const facCost=k=>FAC[k].cost||FAC_COST;
const stadiumMult=()=>1+.25*(facLv('stadium')-1);
function upgradeFac(k){
  const L=facLv(k),c=facCost(k)[L];
  if(L>=facCost(k).length){toast(`${FAC[k].name}已是最高等级`);return}
  if(S.budget<c){toast('资金不够');return}
  S.budget-=c;S.fac[k]=L+1;
  news(`${FAC[k].name}升级到 ${L+1} 级，花费 ${money(c)}。`);toast(`${FAC[k].name}升到 ${L+1} 级！`);
}

/* ---------- buying from other clubs ---------- */
const findAny=id=>{for(const t of S.teams){const p=t.players.find(x=>x.id===id);if(p)return {p,t}}return null};
// asking price: his value, marked up for how much the club relies on him (top-3 player 1.8x, starter 1.4x,
// squad player 1.05x), and another 30% if the seller is our rival
function askPrice(p,t){
  const top=[...t.players].sort((a,b)=>b.ovr-a.ovr).slice(0,3),xi=bestForm(t,true).ids;
  const imp=top.includes(p)?1.8:xi.includes(p.id)?1.4:1.05;
  return Math.round(value(p)*imp*(t.id===S.rival?1.3:1));
}
// why a club won't sell (or we can't buy) right now; '' when the deal can go ahead
function buyBlock(p,t){
  if(t.players.length<=15)return '对方阵容人数不足，不愿出售';
  if(p.pos==='GK'&&t.players.filter(x=>x.pos==='GK').length<=2)return '对方门将不够，不愿出售';
  if(squadFull())return '你的一线队已满 22 人';
  if(S.budget<askPrice(p,t))return '资金不够';
  return '';
}
function buyFrom(id){
  const f=findAny(id);if(!f||f.t.id===S.my)return;
  const {p,t}=f,why=buyBlock(p,t);if(why){toast(why);return}
  const price=askPrice(p,t);S.budget-=price;
  t.players=t.players.filter(x=>x!==p);my().players.push(p);
  news(`以 ${money(price)} 从 ${t.name} 签下 ${p.name}（${POS[p.pos]}，能力 ${p.ovr}）。`);
  toast(`签下 ${p.name}，记得去阵容页安排他`);
}

/* ---------- loans ---------- */
// a loaned player goes to a club outside our two divisions (丙级 or another region below 50 ability,
// another region or abroad from 50): each of our league rounds he gets a match there (counting toward his
// debut as an academy kid) with the usual match growth chance. as in real football he doesn't take up one of our
// 22 registered places while away; recalling him needs a free place. loans end with the season
const LOAN_AGE=23;
const firstTeam=()=>my().players.filter(p=>!p.loan);  // registered first-team players
const squadSize=()=>firstTeam().length;
const squadFull=()=>squadSize()>=22;
function loanOut(id){
  const p=findP(id);if(!p||p.loan||p.age>LOAN_AGE)return;
  p.loan={...loanHost(p),ovr0:p.ovr};dropFromLineup(p.id);
  news(`${p.name} 租借至${loanLabel(p)}，赛季结束后回归。`);toast(`${p.name} 已租借至${p.loan.club}`);
}
function loanHost(p){
  const [league,clubs]=LOAN_LEAGUES[pick(p.ovr<50?['low','away']:['away','abroad'])];
  return {league,club:pick(clubs)};
}
const loanLabel=p=>`${p.loan.league}的${p.loan.club}`;
function recallLoan(id){const p=findP(id);if(!p||!p.loan)return;if(squadFull()){toast('一线队已满 22 人，先卖掉一人才能召回');return}news(`${p.name} 从${p.loan.club}提前召回。`);p.loan=null;toast(`${p.name} 已召回`)}
function loanRound(){
  my().players.filter(p=>p.loan).forEach(p=>{
    p.lapps=(p.lapps||0)+1;
    if(p.ovr<p.pot&&rng()<MATCH_GROW*growF(p)){p.ovr++;p.gain=(p.gain||0)+1;giveSig(p)}
  });
}
function endLoans(){
  const back=my().players.filter(p=>p.loan);
  back.forEach(p=>p.loan=null);
  if(back.length)news(`租借结束：${back.map(p=>`${p.name}（${p.lapps||0} 场）`).join('、')} 回到球队。${squadSize()>22?`一线队现在有 ${squadSize()} 人，超过 22 人上限，卖掉多余的人之前不能再签新人。`:''}`);
}

/* ---------- board objectives ---------- */
// each season: finish at or above the expected position, and in 甲级 also reach the cup quarter-finals
const GOAL_BONUS={league:[120,70],cup:60};
function setGoals(){S.goal={rank:expectedRank(),cup:my().div===0?1:-1}}
// how far we got in the cup: index of the stage we went out in, 4 if we won it, -1 if we didn't take part
function cupReached(){
  const C=S.cup;if(C.skipped)return -1;
  if(C.winner===S.my)return CUP_STAGES.length;
  const k=C.rounds.findIndex(rd=>rd.some(r=>(r.h===S.my||r.a===S.my)&&r.w!==S.my));
  return k>=0?k:C.stage;
}
function goalStatus(){
  const g=S.goal;if(!g)return null;
  return {league:myRank()<=g.rank,cup:g.cup<0?null:cupReached()>=g.cup};
}
// pays out at season end; returns what was earned
function payGoals(div){
  const st=goalStatus();if(!st)return 0;
  let bonus=0;
  if(st.league)bonus+=GOAL_BONUS.league[div];
  if(st.cup)bonus+=GOAL_BONUS.cup;
  S.budget+=bonus;
  news(`董事会目标：联赛${st.league?'达成':'未达成'}${st.cup===null?'':`，杯赛${st.cup?'达成':'未达成'}`}。${bonus?`奖金 ${money(bonus)}。`:''}`);
  return bonus;
}

/* ---------- surprises: rare good news that just happens, no decision needed ---------- */
// each day on the calendar has SURPRISE_CHANCE of one; w = relative weight, ok = can it happen right now,
// run applies it and returns the line for the news and the day log
const SURPRISE_CHANCE=.035;
const SURPRISES=[
  {w:3,run:()=>{const m=my().div?ri(40,80):ri(80,150);S.budget+=m;return `赞助商对球队的表现非常满意，决定追加投资 ${money(m)}！`}},
  {w:3,run:()=>{
    const young=firstTeam().filter(p=>p.age<=25&&p.ovr<95),all=firstTeam().filter(p=>p.ovr<95);
    const p=pick(young.length&&rng()<.7?young:all),old=p.ovr;
    p.ovr=Math.min(95,p.ovr+ri(2,3));p.pot=Math.max(p.pot,p.ovr);const a=p.ovr-old;p.gain=(p.gain||0)+a;giveSig(p);
    return `${p.name} 在训练中突然顿悟，能力 +${a}，现在是 ${p.ovr}！`}},
  {w:2,run:(log={cond:0})=>{firstTeam().forEach(p=>{log.cond+=100-p.cond;p.cond=100});return '一位瑜伽大师路过训练场，带全队冥想了一整天。全队体能完全恢复！'}},
  {w:2,ok:()=>firstTeam().some(p=>p.inj>0),run:(log={})=>{
    const p=firstTeam().filter(x=>x.inj>0).sort((a,b)=>b.inj-a.inj)[0];p.inj=0;(log.healed||(log.healed=[])).push(p);
    return `一位神秘的老中医为 ${p.name} 推拿了一整晚……伤势痊愈了！`}},
  {w:2,run:()=>{const m=ri(20,50);S.budget+=m;return `球迷自发众筹，为球队送来 ${money(m)}！`}},
  {w:2,run:()=>{raiseMorale();return '一位退役的传奇前辈回到训练场为全队打气，下一场士气高涨！'}},
  {w:1,ok:()=>S.market.length>0,run:()=>{
    const g=makeGem();S.market[ri(0,S.market.length-1)]=g;
    return `一位老球探寄来密信：转会市场上有一颗被埋没的明珠，${g.name}（${POS[g.pos]}，${g.age} 岁）……`}},
  {w:1,ok:()=>!!S.academy,run:()=>{
    const p=makePlayer(pick(['DF','MF','FW']),40+S.academy.lv*3,ri(16,17));p.pot=ri(85,92);p.youth=true;scoutYouth(p,S.academy.lv);
    S.academy.intake.push(p);
    return `一位天赋异禀的少年 ${p.name} 敲开了青训营的大门，去「设施」页看看吧！`}},
];
function rollSurprise(log){
  if(rng()>=SURPRISE_CHANCE)return;
  const pool=SURPRISES.filter(s=>!s.ok||s.ok());
  let r=rng()*pool.reduce((t,s)=>t+s.w,0);
  const s=pool.find(x=>(r-=x.w)<0)||pool[0],t=s.run(log);
  news('✨ '+t);(log.surprises||(log.surprises=[])).push(t);
}
