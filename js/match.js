/* ---------- live match ---------- */
function startMatch(){
  const iss=lineupIssues();if(iss.length){toast(iss[0]);UI.tab='squad';render();return}
  if(S.event&&!S.live){toast('有一件事等着你做决定');UI.tab='home';render();return}
  if(!S.live&&!isMatchDay()){toast('今天不是比赛日');return}
  const pre=JSON.stringify(S);  // kept in memory for the cheat card's "重踢一场"
  // fresh dice at every kickoff: a match cut short by a reload starts again from 0:0 and can go differently.
  // S.live only marks that a match is under way (the save holds the state from before kickoff)
  S.live={seed:Math.floor(Math.random()*2**31)};save();
  rng=seeded(S.live.seed);indexNames();
  const f=nextFix(),opp=S.teams[f.opp];aiRecover(opp);
  M={h:f.h,a:f.a,cup:f.cup,derby:f.derby,friendly:!!f.friendly,fIdx:f.idx,stage:f.cup?S.cup.stage:null,hg:0,ag:0,min:0,feed:[],paused:false,ht:false,done:false,
    flash:null,injuries:[],yc:{},goals:{},on:{},off:{},subs:0,oppSubs:0,sel:null,aiTac:'bal',tac:S.tactic,subMode:false,lastAuto:{h:-9,a:-9},talk:null,trailed:false,despair:false};  // tac: our tactic for this match only
  // the opponent picks its best formation, and a tactic from how it rates against our XI
  const os=bestForm(opp,!f.home),mr=rating(strength(my(),S.lineup,S.tactic,f.home,S.boost>0?BOOST:0,S.formation));
  M.aiTac=tacFor(os.r,mr);
  M.hXI=f.h===S.my?[...S.lineup]:[...os.ids];
  M.aXI=f.a===S.my?[...S.lineup]:[...os.ids];
  // players on the pitch; a red card removes one, a substitution swaps one. the XI lists grow with subs
  M.hIds=[...M.hXI];M.aIds=[...M.aXI];M.pre=pre;
  // each side's formation decides the role of every slot
  M.hForm=f.h===S.my?S.formation:os.form;M.aForm=f.a===S.my?S.formation:os.form;
  // for ratings and stats: each player's role, his events, who only played part of the match, shots per side
  M.role={...roleMap(M.hXI,M.hForm),...roleMap(M.aXI,M.aForm)};M.line={...lineMap(M.hXI,M.hForm),...lineMap(M.aXI,M.aForm)};M.ev={};M.st={h:{sh:0,on:0},a:{sh:0,on:0}};
  M.poss=possession(S.teams[M.h],M.hIds,M.hForm,M.h===S.my?M.tac:M.aiTac,S.teams[M.a],M.aIds,M.aForm,M.a===S.my?M.tac:M.aiTac);
  const hn=S.teams[M.h].name,an=S.teams[M.a].name;
  M.feed.unshift({min:0,cls:'sys',t:f.friendly?LINE.friendlyKick(hn,an):f.cup?LINE.cupKick(hn,an,stageName(M.stage)):f.derby?LINE.derbyKick(hn,an):LINE.kickoff(hn,an)});
  M.feed.unshift({min:0,cls:'sys',t:`${opp.short}开场打法：${TACT[M.aiTac]}。`});
  UI.view='match';render();M.timer=setTimeout(loop,600);
}
const mySide=()=>M.h===S.my?'h':'a';
// an important moment in live play: a card at the top and a short hold (nothing while skipping to the result)
function flag(kind,title,sub,ms){if(M.skip)return;M.hold=Math.max(M.hold||0,Date.now()+ms);notice(kind,title,sub);announce(`${title}，${sub}`)}
// our side's extras this minute: the halftime talk (second half), 绝境爆发 when behind from the 75th minute,
// and the manager's aura from the 75th (more with reputation). AI sides get none of these
function myBoost(){
  const b={atk:0,def:0},add=f=>{b.atk+=f.atk;b.def+=f.def};
  if(M.min>45&&M.talk)add(TALK_FX[M.talk==='roar'?(M.talkOK?'roarOk':'roarBad'):M.talk]);
  const home=M.h===S.my,myG=home?M.hg:M.ag,opG=home?M.ag:M.hg;
  if(M.min>=75&&myG<opG){b.atk+=home?DESPAIR.home:DESPAIR.away;
    if(!M.despair){M.despair=true;M.feed.unshift({min:M.min,cls:'sys',t:`绝境之中，${my().short}的血液沸腾了——全员压上，誓要扳回！`});flag('hot','🔥 绝境爆发',`落后之下全员压上，进攻 +${home?DESPAIR.home:DESPAIR.away}`,600)}}
  if(M.min>=75)b.atk+=aura();
  return b;
}
const aura=()=>Math.round(((S.mgr&&S.mgr.rep)||0)*AURA_PER_REP*10)/10;
// the page is redrawn every tick; while a finger or mouse button is down the match waits, so the button under it
// isn't replaced between press and release (which would swallow the click)
let pressing=false;
document.addEventListener('pointerdown',()=>{pressing=true},true);
for(const ev of ['pointerup','pointercancel'])document.addEventListener(ev,()=>{pressing=false},true);
// after a goal the match holds for a moment (ours 1.5s, theirs 0.8s) so it can sink in before play goes on
function loop(){if(!M||M.done||M.paused)return;if(pressing){M.timer=setTimeout(loop,40);return}
  if(M.hold&&Date.now()<M.hold){M.timer=setTimeout(loop,M.hold-Date.now());return}
  const n=M.feed.length;tick(false);render();
  const [,base,perLine]=PACE[S.pace]||PACE.normal;
  if(!M.done&&!M.paused)M.timer=setTimeout(loop,base+perLine*Math.min(3,M.feed.length-n))}
function tick(skipping){
  M.min++;M.flash=null;
  const ht=M.h===S.my?M.tac:M.aiTac,at=M.a===S.my?M.tac:M.aiTac,b=S.boost>0?BOOST:0;
  const sh=strength(S.teams[M.h],M.hIds,ht,true,M.h===S.my?b:0,M.hForm),sa=strength(S.teams[M.a],M.aIds,at,false,M.a===S.my?b:0,M.aForm);
  sh.atk+=counter(ht,at);sa.atk+=counter(at,ht);
  const mb=myBoost(),ms=M.h===S.my?sh:sa;ms.atk+=mb.atk;ms.def+=mb.def;
  side('h',xgMin(sh,sa));side('a',xgMin(sa,sh));
  const myG=M.h===S.my?M.hg:M.ag,opG=M.h===S.my?M.ag:M.hg;if(myG<opG)M.trailed=true;
  if(!M.done){flair('h');flair('a')}
  for(const s of ['h','a']){
    const team=S.teams[s==='h'?M.h:M.a],tac=s==='h'?ht:at,mine=team.id===S.my;
    const lines=slotLines(M[s+'Form']);onPitch(team,M[s+'Ids']).forEach((p,j)=>p&&drain(p,tac,lines[j]));
    if((mine&&S.autoSub===false)||M.min-M.lastAuto[s]<5)continue;
    const sw=tiredSwap(team,M[s+'Ids'],M[s+'XI'],M[s+'Form'],mine?M.subs:M.oppSubs,M.min);
    if(sw&&substitute(sw[0].id,sw[1].id,s,LINE.tiredSub(sw[0].name,sw[1].name),'tired'))M.lastAuto[s]=M.min;
  }
  if(M.min===75&&aura()>=1)M.feed.unshift({min:75,cls:'sys',t:`场边的主教练站了起来。名帅的气场笼罩全场，${my().short}的球员们眼神变了（进攻 +${aura()}）。`});
  if(M.min===45){
    const myG=M.h===S.my?M.hg:M.ag,opG=M.h===S.my?M.ag:M.hg;
    const was=M.aiTac;M.aiTac=opG<myG?'att':opG>myG?'def':'bal';
    M.feed.unshift({min:45,cls:'sys',t:LINE.half(M.hg,M.ag)});announce(LINE.half(M.hg,M.ag));
    if(M.aiTac!==was)M.feed.unshift({min:45,cls:'sys',t:`${S.teams[M.h===S.my?M.a:M.h].short}下半场改打${TACT[M.aiTac]}！`});
    // a perk for our side only: the halftime talk and a drink win back a little of the stamina lost
    const ours=onPitch(my(),M[mySide()+'Ids']).filter(Boolean);let got=0;
    ours.forEach(p=>{const g=Math.min(100-p.cond,Math.max(2,Math.round((100-p.cond)*HT_REST)));p.cond+=g;got+=g});
    if(got)M.feed.unshift({min:45,cls:'sys',t:`更衣室里补水调整，${my().short}的球员们缓过一口气（体能平均 +${Math.round(got/ours.length)}）。`});
    if(!skipping){M.paused=true;M.ht=true;M.stop=(M.stop||0)+1}
  }
  if(M.min>=90){
    M.feed.unshift({min:90,cls:'sys',t:LINE.full(M.hg,M.ag)});announce(LINE.full(M.hg,M.ag));
    if(M.cup&&M.hg===M.ag){
      const H=S.teams[M.h],A=S.teams[M.a];
      M.feed.unshift({min:'PK',cls:'sys',t:LINE.pensStart});
      const r=shootout(H,M.hIds,A,M.aIds,t=>M.feed.unshift({min:'PK',cls:'',t}));
      M.hp=r.hp;M.ap=r.ap;
      M.feed.unshift({min:'PK',cls:'sys',t:LINE.pensEnd(r.hp,r.ap,(r.hp>r.ap?H:A).name)});
    }
    finish();
  }
}
function side(s,p){
  const team=S.teams[s==='h'?M.h:M.a],ids=s==='h'?M.hIds:M.aIds,form=M[s+'Form'],mine=team.id===S.my,r=rng();
  const opp=S.teams[s==='h'?M.a:M.h],gk=keeper(opp,s==='h'?M.aIds:M.hIds);
  const ev=id=>M.ev[id]||(M.ev[id]={}),st=M.st[s];
  // a signature move that decides something: a cut-in banner first, and the match holds for it
  const sigShow=(p,t)=>{if(M.skip)return false;M.hold=Math.max(M.hold||0,Date.now()+1400);cutIn(p.name,p.sig,t.color);return true};
  // goal: sig marks a signature goal; by = a midfielder whose signature pass made it (he gets the assist)
  const goal=(sc,t,sig,by)=>{
    // goals and assists in friendlies show in the match but don't count toward season tallies
    if(!M.friendly)sc.goals++;
    M.goals[sc.id]=(M.goals[sc.id]||0)+1;ev(sc.id).g=(ev(sc.id).g||0)+1;if(sig)ev(sc.id).sig=(ev(sc.id).sig||0)+1;st.sh++;st.on++;
    const a=by||assister(team,ids,form,sc);if(a){ev(a.id).a=(ev(a.id).a||0)+1;if(!M.friendly)a.ast=(a.ast||0)+1}
    if(by)ev(by.id).sig=(ev(by.id).sig||0)+1;
    if(s==='h')M.hg++;else M.ag++;
    M.flash=s;M.feed.unshift({min:M.min,cls:'goal '+(mine?'mine':'theirs'),t:`进球！${t}（${team.short}${a?` · 助攻 ${a.name}`:''}）`});
    const star=by||(sig?sc:null);  // a signature move behind it: its cut-in plays first
    if(!M.skip)M.hold=Date.now()+(mine?2600:800)+(star?1300:0);
    if(!mine&&!M.skip)notice('against',`失球 ${M.min}'　${M.hg} : ${M.ag}`,`${sc.name}（${team.short}）${a?` · 助攻 ${a.name}`:''}`);
    const n=M.goals[sc.id],cel=()=>celebrate('GOAL!',`${sc.name}${n===2?' · 梅开二度':n===3?' · 帽子戏法':n>3?` · 大四喜`:''}　${M.hg} : ${M.ag}`,n>=2?'brace':'goal');
    if(!M.skip){if(star)cutIn(star.name,star.sig,team.color,mine?cel:null);else if(mine)cel()}
    announce(`${M.min} 分钟，${team.short}进球，比分 ${M.hg} 比 ${M.ag}`);
  };
  const oppIds=s==='h'?M.aIds:M.hIds,blocker=sigOn(opp,oppIds,'DF');
  if(r<p){
    const sc=scorer(team,ids,form);
    // a defender with a signature move can throw himself in front of a sure goal; a keeper with one can deny it
    if(blocker&&rng()<.05){M.feed.unshift({min:M.min,cls:'save',t:LINE.sigBlock(blocker.name,blocker.sig,sc.name)});ev(blocker.id).blk=(ev(blocker.id).blk||0)+1;st.sh++;sigShow(blocker,opp)}
    else if(gk&&gk.sig&&rng()<.08){M.feed.unshift({min:M.min,cls:'save',t:LINE.sigSave(gk.name,gk.sig,sc.name)});ev(gk.id).sv=(ev(gk.id).sv||0)+1;st.sh++;st.on++;sigShow(gk,opp)}
    else{const sig=sc.sig&&rng()<.4;goal(sc,sig?LINE.sigGoal(sc.name,sc.sig):pick(GOAL)(sc.name),sig)}
  }else if(r<p*2.2){
    const sc=scorer(team,ids,form),maker=sigOn(team,ids,'MF',sc);
    // a shooter with a signature move can occasionally turn a chance into a goal
    if(sc.sig&&rng()<.12*(mine&&M.min>=75?1+((S.mgr&&S.mgr.rep)||0)/100:1))goal(sc,LINE.sigGoal(sc.name,sc.sig),true);
    // or a midfielder with one plays the pass that makes it a sure thing
    else if(maker&&rng()<.04)goal(sc,LINE.sigPass(maker.name,maker.sig,sc.name),false,maker);
    // otherwise half of the near-misses are saves, credited to the opposing keeper if he's still on the pitch
    else if(gk&&rng()<.5){M.feed.unshift({min:M.min,cls:'',t:gk.sig&&rng()<.5?LINE.sigSave(gk.name,gk.sig,sc.name):pick(SAVE)(sc.name,gk.name)});ev(gk.id).sv=(ev(gk.id).sv||0)+1;st.sh++;st.on++}
    else{M.feed.unshift({min:M.min,cls:'',t:pick(MISS)(sc.name)});ev(sc.id).miss=(ev(sc.id).miss||0)+1;st.sh++}
  }else if(rng()<p*3.5)st.sh++;  // speculative efforts that never make the commentary
  if(!M.friendly&&rng()<CARD){
    const b=booking(team,ids,M.yc);
    if(b){ev(b.p.id)[b.red?'red':'yc']=1;if(b.red){M.off[b.p.id]=M.min;flag('red',`🟥 红牌 ${M.min}'`,`${b.p.name}（${team.short}）两黄变一红，被罚下`,1200)}}
    if(b)M.feed.unshift(b.red
      ?(announce(LINE.red(b.p.name,team.short)),{min:M.min,cls:'red',t:LINE.red(b.p.name,team.short)})
      :{min:M.min,cls:'',t:LINE.yellow(b.p.name,team.short)+(b.banned?LINE.ban:'')});
  }
  // each minute one random player on the pitch is at risk; the risk grows as his stamina drops
  // and our physio room lowers it. from physio level 4 some of our knocks can be played through
  const pl=team.players.find(x=>x.id===pickOn(ids));
  if(pl&&rng()<injRisk(pl)*(mine?physioRisk():1)*(M.friendly?.5:1)){
    if(mine&&rng()<knockChance()){pl.cond=Math.max(30,pl.cond-10);M.feed.unshift({min:M.min,cls:'',t:LINE.knock(pl.name)});flag('inj',`🩹 碰撞 ${M.min}'`,`${pl.name} 受了点小伤，坚持比赛`,700)}
    else if(!M.injuries.includes(pl)){
      M.injuries.push(pl);pl.cond=Math.max(30,pl.cond-30);
      M.feed.unshift({min:M.min,cls:'',t:LINE.injury(pl.name)});
      if(mine)flag('inj',`🚑 受伤 ${M.min}'`,`${pl.name} 倒地不起`,900);
      // an injured player is carried off if a substitution is left: best fresh player for his slot's role, else anyone
      const xi=M[s+'XI'],role=slotRoles(form)[ids.indexOf(pl.id)],bench=team.players.filter(x=>!xi.includes(x.id)&&!unavail(x)).sort((a,b)=>eff(b)-eff(a));
      const sub=bench.find(x=>x.pos===role)||standIn(bench,role);
      if(!(sub&&substitute(pl.id,sub.id,s,LINE.injSub(pl.name,sub.name),'inj')))M.feed.unshift({min:M.min,cls:'sys',t:LINE.injStay(pl.name)});
    }
  }
}
// the best man on the pitch for a side, in the given role, who has a signature move (not `but`)
function sigOn(team,ids,role,but){
  return onPitch(team,ids).filter(p=>p&&p!==but&&p.sig&&M.role[p.id]===role).sort((a,b)=>b.ovr-a.ovr)[0]||null;
}
// out must be on the pitch, in must not have played yet. s = 'h'/'a', defaults to our side
// why: 'tired' / 'inj' for automatic changes, empty for ours by hand; every change is kept in M.subLog
function substitute(outId,inId,s=mySide(),line,why){
  const team=S.teams[s==='h'?M.h:M.a],key=team.id===S.my?'subs':'oppSubs',ids=M[s+'Ids'],xi=M[s+'XI'];
  const po=team.players.find(x=>x.id===outId),pi=team.players.find(x=>x.id===inId);
  if(M[key]>=SUBS||!po||!pi||!ids.includes(outId)||xi.includes(inId)||unavail(pi))return false;
  const slot=ids.indexOf(outId);ids[slot]=inId;xi.push(inId);M[key]++;if(key==='subs')M.sel=null;
  M.off[outId]=M.min;M.on[inId]=M.min;
  M.role[inId]=slotRoles(M[s+'Form'])[slot];M.line[inId]=slotLines(M[s+'Form'])[slot];
  const feed={min:M.min,cls:'sys',t:line||LINE.sub(po.name,pi.name)};M.feed.unshift(feed);
  // stop: which halftime / pause it was made in (changes made while play runs have none)
  (M.subLog||(M.subLog=[])).push({s,min:M.min,out:outId,in:inId,why,feed,stop:M.paused?M.stop:null});
  if(key==='subs'&&!M.paused)flag('sub',`🔄 换人 ${M.min}'`,`↓ ${po.name}${why==='inj'?'（受伤）':why==='tired'?'（体能）':''}　↑ ${pi.name}`,1000);
  return true;
}
// during a stop our players can change places: swap two slots, or move into a slot left empty by a red card
function placeOnPitch(id,slot,s=mySide()){M.role[id]=slotRoles(M[s+'Form'])[slot];M.line[id]=slotLines(M[s+'Form'])[slot]}
function swapSlots(a,b,s=mySide()){
  const ids=M[s+'Ids'];[ids[a],ids[b]]=[ids[b],ids[a]];[a,b].forEach(i=>{if(ids[i]!=null)placeOnPitch(ids[i],i,s)});
}
// a new shape mid-match: the men on the pitch are rearranged for it (a sent-off player's place stays empty)
function changeMatchForm(f,s=mySide()){
  const on=M[s+'Ids'].filter(x=>x!=null).map(findP).filter(Boolean).sort((a,b)=>eff(b)-eff(a));
  M[s+'Form']=f;M[s+'Ids']=arrange(on,f);M[s+'Ids'].forEach((id,i)=>{if(id!=null)placeOnPitch(id,i,s)});
  M.feed.unshift({min:M.min,cls:'sys',t:`${my().short}调整阵型为 ${f}。`});
}
// a change made in the current stop (halftime or a pause) can still be redone until play resumes:
// taking off the man who just came on puts someone else on in his place without using another substitution,
// and bringing back the man he replaced cancels the change. returns null if outId didn't come on in this stop
const pendingSub=(id,key='in',s=mySide())=>M.paused?(M.subLog||[]).find(x=>x.s===s&&x[key]===id&&x.stop===M.stop):null;
function resub(outId,inId,s=mySide()){
  const e=pendingSub(outId,'in',s);if(!e)return null;
  const team=S.teams[s==='h'?M.h:M.a],ids=M[s+'Ids'],xi=M[s+'XI'],slot=ids.indexOf(outId),pi=team.players.find(x=>x.id===inId);
  if(!pi||slot<0)return false;
  xi.splice(xi.indexOf(outId),1);delete M.on[outId];
  if(inId===e.out){  // back to how it was
    ids[slot]=e.out;delete M.off[e.out];M[team.id===S.my?'subs':'oppSubs']--;
    M.subLog.splice(M.subLog.indexOf(e),1);M.feed.splice(M.feed.indexOf(e.feed),1);
  }else{
    if(xi.includes(inId)||unavail(pi)){xi.push(outId);M.on[outId]=e.min;return false}
    ids[slot]=inId;xi.push(inId);M.on[inId]=e.min;e.in=inId;
    M.role[inId]=slotRoles(M[s+'Form'])[slot];M.line[inId]=slotLines(M[s+'Form'])[slot];
    e.feed.t=LINE.sub(team.players.find(x=>x.id===e.out).name,pi.name);
  }
  M.sel=null;return true;
}
// both sides' numbers for the live match: minutes from who came on and off, possession, shots, and how the sides compared
// now and then a tackle, interception, dribble or killer pass makes the commentary. the side on the ball dribbles and
// passes, the other defends; the player is picked with the same position weights as the match numbers and credited
// with it (matchActs keeps at least what was described)
function flair(s){
  if(rng()>=.045)return;
  const team=S.teams[s==='h'?M.h:M.a],ps=onPitch(team,M[s+'Ids']).filter(Boolean),onBall=(s==='h'?M.poss:100-M.poss)/100;
  const k=rng()<onBall?(rng()<.5?'drb':'kp'):(rng()<.55?'tkl':'int'),wt=ACT_W[{tkl:'def',int:'def',drb:'drb',kp:'kp'}[k]];
  const w=ps.map(p=>wt[M.line[p.id]||p.pos]),tot=w.reduce((a,b)=>a+b,0);if(!tot)return;
  let r=rng()*tot,i=0;while(i<ps.length-1&&r>=w[i])r-=w[i++];
  const p=ps[i],live=M.live||(M.live={}),l=live[p.id]||(live[p.id]={});l[k]=(l[k]||0)+1;
  M.feed.unshift({min:M.min,cls:'',t:`${pick(FLAIR[k])(p.name)}（${team.short}）`});
}
function matchActs(){
  const mins={};[...M.hXI,...M.aXI].forEach(id=>{if(id!=null)mins[id]=(M.off[id]??90)-(M.on[id]??0)});
  M.mins=mins;
  const H=S.teams[M.h],A=S.teams[M.a],edge=rating(strength(H,M.hIds,'bal',true,0,M.hForm))-rating(strength(A,M.aIds,'bal',false,0,M.aForm));
  M.act={...matchActions(H,M.hXI,M.line,mins,M.poss/100,edge,M.st.h.sh),...matchActions(A,M.aXI,M.line,mins,1-M.poss/100,-edge,M.st.a.sh)};
  for(const id in M.live||{}){const a=M.act[id];if(a)for(const k in M.live[id])a[k]=Math.max(a[k],M.live[id][k])}
}
function finish(){
  M.done=true;M.paused=false;clearTimeout(M.timer);
  if(M.friendly)return finishFriendly();
  if(M.cup)NEWS_TAG=`${CUP_NAME}${stageName(M.stage)}`;
  const res={h:M.h,a:M.a,hg:M.hg,ag:M.ag},home=M.h===S.my,myXI=home?M.hXI:M.aXI,oppId=home?M.a:M.h,oppXI=home?M.aXI:M.hXI;
  if(M.cup){if(M.hp!==undefined){res.hp=M.hp;res.ap=M.ap}}
  else{const d=my().div;S.results[d].push(S.fixtures[d][S.round].map(([h,a])=>(h===S.my||a===S.my)?res:quickSim(h,a)))}
  afterMatch(S.teams[oppId],oppXI,false);
  const {grown,awoken}=afterMatch(my(),myXI,true);
  S.lastMatchDay=S.day;
  M.injuries.forEach(p=>{p.inj=pick(INJ_DAYS);if(findP(p.id)&&rng()<quickHeal())p.inj=Math.max(1,Math.round(p.inj/2))});
  const hurt=M.injuries.filter(p=>findP(p.id));M.myInjuries=hurt;
  const banned=my().players.filter(p=>p.ban>0&&myXI.includes(p.id));
  const mg=home?M.hg:M.ag,og=home?M.ag:M.hg,mp=home?M.hp:M.ap,op=home?M.ap:M.hp;
  const pens=M.cup&&mg===og,w=mg>og||(pens&&mp>op)?'胜':mg<og||pens?'负':'平';
  const income=Math.round((4+(home?18*stadiumMult():0)+(w==='胜'?10:w==='平'?4:0))*DIV_INCOME[my().div]*(M.derby?2:1));
  S.budget+=income;
  if(S.boost>0)S.boost--;
  if(M.derby&&w==='胜'){S.boost=2;unlock('derby')}
  S.streak=w==='胜'?(S.streak||0)+1:0;
  // ratings for both sides; the man of the match is the best of everyone
  matchActs();
  M.rh=rateSide(S.teams[M.h],M.hXI,M.role,M.ev,M.hg,M.ag,M.mins,false,M.act);M.ra=rateSide(S.teams[M.a],M.aXI,M.role,M.ev,M.ag,M.hg,M.mins,false,M.act);
  M.mvp=[...M.rh,...M.ra].sort((a,b)=>b.r-a.r)[0];
  // a hat-trick or a game of 8.5+, in a season he's been playing well, is the kind of night a player finds a move in
  [...M.rh,...M.ra].forEach(x=>{if((((M.ev[x.p.id]||{}).g||0)>=3||x.r>=8.5)&&inForm(x.p)){if(learnSig(x.p,.3)){
    const ours=my().players.includes(x.p);M.feed.unshift({min:90,cls:'sys',t:`${x.p.name} 在这场比赛中领悟了必杀技「${x.p.sig}」！`});if(ours)news(`${x.p.name} 在比赛中领悟了必杀技「${x.p.sig}」！`)}}});
  M.summary={w,mg,og,mp,op,pens,income,grown,awoken,banned};
  news(`${w} ${mg}:${og}${pens?`（点球 ${mp}:${op}）`:''} 对阵${S.teams[oppId].name}${M.derby?'（宿敌之战）':''}。比赛收入 ${money(income)}。`);
  hurt.forEach(p=>news(`${p.name} 受伤，预计伤停 ${p.inj} 天。`));
  if(banned.length)news(`${banned.map(p=>p.name).join('、')} 下一轮停赛。`);
  if(grown.length)news(`在比赛中成长：${grown.map(p=>`${p.name}（${p.ovr}）`).join('、')}。`);
  awoken.forEach(p=>news(`${LINE.awaken(p.name)}能力升至 ${p.ovr}，潜力 ${p.pot}${p.sig?`，领悟必杀技「${p.sig}」`:''}。`));
  if(awoken.length)unlock('awaken');
  if(Object.entries(M.goals).some(([id,n])=>n>=3&&findP(+id)))unlock('hat');
  if(my().players.some(p=>p.youth&&p.ovr>=75))unlock('academy');
  if(S.streak>=5)unlock('streak');
  if(mg-og>=5)unlock('rout');
  if(pens&&w==='胜')unlock('pens');
  if(w==='胜'&&M.trailed){unlock('comeback');news('逆转！落后的情况下拿下了比赛。')}
  if(M.cup)playCupStage(res);else{loanRound();S.round++;if(S.round>=rounds())careerSeasonEnd()}
  // a title or promotion settled by this match: confetti
  const party=M.cup&&S.cup.winner===S.my?`${CUP_NAME}冠军！`:S.round>=rounds()&&!M.cup?(myRank()===1?`${DIVS[my().div]}冠军！`:zone(my().div,myRank())==='up'?'升级成功！':''):'';
  if(party)celebrate(party,my().name,'party');
  NEWS_TAG=null;
  rollEvent();
  fixLineup();
  delete S.live;rng=Math.random;
  save();
}
// a preseason friendly: stamina, growth and injuries count, but no table, cards, appearances or season ratings
function finishFriendly(){
  const home=M.h===S.my,myXI=home?M.hXI:M.aXI,oppXI=home?M.aXI:M.hXI,opp=S.teams[home?M.a:M.h];
  afterMatch(opp,oppXI,false,true);
  const {grown,awoken}=afterMatch(my(),myXI,true,true);
  S.lastMatchDay=S.day;
  M.injuries.forEach(p=>{p.inj=pick(INJ_DAYS);if(findP(p.id)&&rng()<quickHeal())p.inj=Math.max(1,Math.round(p.inj/2))});
  M.myInjuries=M.injuries.filter(p=>findP(p.id));
  const mg=home?M.hg:M.ag,og=home?M.ag:M.hg,w=mg>og?'胜':mg<og?'负':'平';
  matchActs();
  M.rh=rateSide(S.teams[M.h],M.hXI,M.role,M.ev,M.hg,M.ag,M.mins,true,M.act);M.ra=rateSide(S.teams[M.a],M.aXI,M.role,M.ev,M.ag,M.hg,M.mins,true,M.act);
  M.mvp=[...M.rh,...M.ra].sort((a,b)=>b.r-a.r)[0];
  M.summary={w,mg,og,income:0,grown,awoken,banned:[],pens:false};
  S.friendlies[M.fIdx].res={hg:M.hg,ag:M.ag};
  news(`季前友谊赛：${w} ${mg}:${og} 对阵${opp.name}。`);
  M.myInjuries.forEach(p=>news(`${p.name} 在友谊赛中受伤，预计伤停 ${p.inj} 天。`));
  fixLineup();
  delete S.live;rng=Math.random;
  save();
}
function skipMatch(){if(!M||M.done)return;clearTimeout(M.timer);M.paused=false;M.ht=false;M.skip=true;while(!M.done)tick(true);render()}
