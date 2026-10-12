/* ---------- saves ---------- */
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
// older saves are upgraded one step at a time: MIGRATE[n] turns a v(n) save into v(n+1)
const MIGRATE={
  1:d=>d.teams.forEach(t=>t.players.forEach(p=>{p.yc=0;p.ban=0})),
  // v3 adds 乙级: the old league becomes 甲级, and a new 乙级 is created and caught up to the current round
  2:d=>{
    const prev=S;S=d;indexNames();
    d.teams.forEach(t=>t.div=0);
    const slots=TEAMS.filter(t=>t.div===1).slice(0,8),names=teamNames(slots,d.teams);
    slots.forEach((t,i)=>d.teams.push({...t,...names[i],id:d.teams.length,players:makeSquad(t.str)}));
    d.fixtures=[d.fixtures,genFixtures(d.teams.filter(t=>t.div===1).map(t=>t.id))];
    d.results=[d.results,d.fixtures[1].slice(0,d.round).map(rd=>rd.map(([h,a])=>quickSim(h,a)))];
    d.history.forEach(h=>h.div=0);
    S=prev;
  },
  // v4 adds the cup, rival, achievements, club history, signature moves; the cup starts next season
  3:d=>{
    const prev=S;S=d;
    Object.assign(d,{cup:{fmt:CUP_LEGACY,stage:CUP_LEGACY.names.length,ties:[],rounds:[],winner:null,skipped:true},
      ach:{},streak:0,boost:0,records:[],club:{},legends:[],offer:null,event:null});
    d.teams.forEach(t=>t.players.forEach(p=>{p.away=0}));
    d.rival=pickRival();
    S=prev;
  },
  // v5 adds the youth academy; the first intake arrives next season
  4:d=>{d.academy={lv:1,intake:[]}},
  // v6 turns the lineup into formation slots, keeping the same players where they fit
  5:d=>{
    const team=d.teams[d.my],ps=d.lineup.map(id=>team.players.find(p=>p.id===id)).filter(Boolean);
    d.lineup=arrange(ps,d.formation);
  },
  // v7 adds the calendar: an old save resumes on its next match day
  6:d=>{const prev=S;S=d;d.day=nextMatchDay();d.lastMatchDay=-9;S=prev},
  // v8 adds the scout department, physio room and training ground
  7:d=>{d.fac={scout:1,physio:1,ground:1}},
  // v9 counts injuries in days (an old injury of n matches becomes n weeks)
  8:d=>d.teams.forEach(t=>t.players.forEach(p=>p.inj=(p.inj||0)*7)),
  // v10 adds board objectives (loans, ratings and the stadium need no conversion)
  9:d=>{const prev=S;S=d;setGoals();S=prev},
  // v11 sends players on loan to clubs outside our divisions instead of a 乙级 club
  10:d=>d.teams[d.my].players.forEach(p=>{if(p.loan&&typeof p.loan.club==='number')p.loan={...loanHost(p),ovr0:p.loan.ovr0??p.ovr}}),
  // v12 tracks seasons and trophies per player for the legends rule; past seasons are estimated from ability history
  11:d=>d.teams[d.my].players.forEach(p=>{const c=d.club[p.id];if(c&&c.seasons==null){c.seasons=(p.hist||[]).length;c.titles=[]}}),
  // v13 gives back trophies the v12 step couldn't: a title season counts for anyone who was with us at its end
  // (his ability history has that season). appearances that season weren't recorded, so they're assumed
  12:d=>{
    const me=d.teams[d.my],won=r=>[r.rank===1?`第 ${r.season} 季${DIVS[r.div||0]}冠军`:'',r.cup===me.name?`第 ${r.season} 季${CUP_NAME}冠军`:''].filter(Boolean);
    me.players.forEach(p=>{
      const c=d.club[p.id];if(!c)return;
      const was=new Set((p.hist||[]).map(h=>h.s)),got=new Set(c.titles||[]);
      (d.records||[]).forEach(r=>{if(was.has(r.season))won(r).forEach(t=>got.add(t))});
      c.titles=[...got];
    });
  },
  // v14: clubs get 底蕴 (estimated from their base strength); the running cup keeps its 16-club format. the league
  // grows to 10 clubs per division at the next season change
  13:d=>{
    d.teams.forEach(t=>{if(t.rep==null)t.rep=clamp(Math.round((t.str-48)/.27),5,98)});
    if(d.cup&&!d.cup.fmt)d.cup.fmt=CUP_LEGACY;
  },
  // v15: manager reputation, estimated from the record so far; past seasons are credited to the current club
  14:d=>{
    const titles=(d.history||[]).filter(h=>h.rank===1).length,ups=(d.history||[]).filter(h=>h.div===1&&h.rank<=SWAP).length;
    d.mgr={rep:clamp(15+(d.history||[]).length*3+titles*10+ups*6,10,85),last:0};
    (d.history||[]).forEach(h=>{if(!h.club)h.club=d.teams[d.my].name});
  },
  // v15 -> v16: the three-division pyramid. a save from the 2 x 10 format finishes its season as it is (the new
  // 丙级 stays empty) and grows at the next season start (growLeague in club.js)
  15:d=>{while(d.fixtures.length<DIVS.length)d.fixtures.push([]);while(d.results.length<DIVS.length)d.results.push([])},
  // v16 -> v17: signature moves became rare. each club keeps them only for its best two holders among the league's
  // most able (top few percent); everyone else's move is gone
  16:d=>{const o=d.teams.flatMap(t=>t.players.map(p=>p.ovr)).sort((a,b)=>b-a),bar=Math.max(75,o[Math.floor(o.length*.03)]||75);d.teams.forEach(t=>{const keep=t.players.filter(p=>p.sig&&p.ovr>=bar-2).sort((a,b)=>b.ovr-a.ovr).slice(0,2);
      t.players.forEach(p=>{if(p.sig&&!keep.includes(p))delete p.sig})})},
  // v17 -> v18: signature moves simply follow ability (88+) and age (gone at 34)
  17:d=>d.teams.forEach(t=>t.players.forEach(p=>{if(p.ovr<88||p.age>=34)delete p.sig;else if(!p.sig)p.sig=pick(SIG_A)+'·'+pick(SIG_B)})),
  // v18 -> v19: the international cup (天际冠军杯) starts with the next season; nothing to change now
  18:d=>{},
  // v20: yellow-card counts and bans by competition (what there was counts for the league)
  19:d=>d.teams.forEach(t=>t.players.forEach(p=>{p.ycc=p.yc?{lg:p.yc}:{};p.bans=p.ban?{lg:p.ban}:{};delete p.yc;delete p.ban;delete p.banNext})),
  // v21: offers for several players at once
  20:d=>{d.offers=d.offer?[d.offer]:[];delete d.offer}
};
// a save can come from anywhere (a shared file, an edited one), and its text ends up in the page's HTML, so
// every string in it loses the characters that could form markup before the game touches it
const UNSAFE=/[<>&"'`]/g;
function sanitize(x){
  if(typeof x==='string')return x.replace(UNSAFE,'');
  if(Array.isArray(x))return x.map(sanitize);
  if(x&&typeof x==='object'){for(const k of Object.keys(x))x[k]=sanitize(x[k]);return x}
  return x;
}
function upgrade(d){
  if(!d||!Array.isArray(d.teams)||typeof d.my!=='number'||!(d.v>=1&&d.v<=SAVE_V))return null;
  sanitize(d);
  while(d.v<SAVE_V){MIGRATE[d.v](d);d.v++}
  return d;
}
function load(){try{const t=localStorage.getItem(KEY);if(t)return upgrade(JSON.parse(t))}catch(e){}return null}

/* ---------- players & league ---------- */
// CN_SUR is ordered by frequency, so the curve makes 王, 李 and 陈 turn up far more often than 葛
function cnName(){
  const sur=rng()<.03?pick(CN_COMP):CN_SUR[Math.floor(CN_SUR.length*rng()**1.6)],r=rng();
  return sur+(r<.1?pick(CN_GIV1):r<.3?pick(GIV):pick(CN_GIV2));
}
function rawName(){
  const r=rng();
  if(r<.4)return cnName();
  if(r<.78)return pick(MALAY_F)+'·'+pick(MALAY_L);
  if(r<.88)return pick(INDIAN_F)+'·'+pick(INDIAN_L);
  if(r<.96)return pick(WEST_F)+'·'+pick(EU_SUR);
  return rng()<.5?pick(JP_SUR)+pick(JP_GIV):pick(KR_SUR)+pick(KR_GIV);
}
// retries until the name is new to the league (gives up after a while rather than loop forever)
function genName(){
  let n=rawName();
  for(let i=0;i<30&&usedNames.has(n);i++)n=rawName();
  usedNames.add(n);return n;
}
function indexNames(){usedNames=new Set([...S.teams.flatMap(t=>t.players),...(S.market||[]),...(S.academy?S.academy.intake:[])].map(p=>p.name))}
// one random name per slot, skipping cities and nicknames already used by the clubs in `taken`
function teamNames(slots=TEAMS,taken=[]){
  const c=shuffle(CITY.filter(x=>!taken.some(t=>t.name.startsWith(x)))),n=shuffle(NICK.filter(x=>!taken.some(t=>t.short===x)));
  return slots.map((t,i)=>({name:c[i]+n[i],short:n[i]}));
}
const startBudget=t=>Math.max(150,t.div?150+(66-t.str)*25:250+(82-t.str)*25);
function makePlayer(pos,base,age){
  age=age||ri(18,33);
  const ovr=clamp(Math.round(base+rnd(-6,6)),38,92);
  const pot=age<24?clamp(ovr+ri(3,14),ovr,92):ovr;
  return {id:S.pid++,name:genName(),pos,ovr,age,pot,cond:100,inj:0,bans:{},away:0,ycc:{},goals:0,apps:0};
}
const sigCount=t=>t.players.filter(p=>p.sig).length;
// a player learns a signature move once his ability reaches SIG_OVR (and he's younger than SIG_FADE); returns true when he does
// quiet: no news or cut-in (the squads drawn up for a new game)
function learnSig(p,quiet){
  if(p.sig||p.ovr<SIG_OVR||p.age>=SIG_FADE)return false;
  p.sig=pick(SIG_A)+'·'+pick(SIG_B);
  if(!quiet&&findP(p.id)===p)sigLearned(p);
  return true;
}
// one of ours has learned a move, however it happened (training, a match, an event, the new season): it's in the
// news, and its cut-in plays once we're off the match screen (see playSigQueue in main.js)
function sigLearned(p){
  news(`✨ ${p.name}（${POS[p.pos]}，能力 ${p.ovr}）觉醒了必杀技「${p.sig}」！`);
  (UI.sigQueue||(UI.sigQueue=[])).push({name:p.name,sig:p.sig});
}
function awaken(p){
  const a=ri(2,4);p.pot=Math.min(95,p.pot+ri(4,8));p.ovr=Math.min(p.pot,p.ovr+a);p.gain=(p.gain||0)+a;learnSig(p);
}
function value(p){const f=p.age<=23?1.3:p.age<=30?1:p.age<=32?.7:.45,r=p.age<=23?p.ovr*.6+p.pot*.4:p.ovr;return Math.max(5,Math.round(((r-35)**2)/6*f))}
// what buyers pay: academy kids who haven't proven themselves in the first team are valued on ability alone
// first-team matches for us plus loan matches elsewhere, this season and banked from earlier ones
const careerApps=p=>{const c=S.club&&S.club[p.id]||{};return unbanked(p,'apps')+unbanked(p,'lapps')+(c.apps||0)+(c.lapps||0)};
// joined = the season he entered the first team; saves from before this field count from the current season
const unproven=p=>p.youth&&careerApps(p)<YOUTH_PROVEN&&(p.joined??S.season)>=S.season;
const marketValue=p=>unproven(p)?clamp(Math.round((p.ovr-35)*1.2),5,40):value(p);
const sellPrice=p=>Math.round(marketValue(p)*.85);
function makeSquad(str){
  const arr=[],starters={GK:1,DF:4,MF:4,FW:2},n={GK:2,DF:5,MF:5,FW:4};
  PO.forEach(pos=>{for(let i=0;i<n[pos];i++)arr.push(makePlayer(pos,str+(i<starters[pos]?2:-5)))});
  return arr;
}
// double round robin for one division's team ids
function genFixtures(teamIds){
  const ids=shuffle(teamIds),n=ids.length,rounds=[];
  for(let r=0;r<n-1;r++){
    const m=[];
    for(let i=0;i<n/2;i++){let a=ids[i],b=ids[n-1-i];if((r+i)%2)[a,b]=[b,a];m.push([a,b])}
    rounds.push(m);ids.splice(1,0,ids.pop());
  }
  return rounds.concat(rounds.map(rd=>rd.map(([a,b])=>[b,a])));
}
const my=()=>S.teams[S.my];
const findP=id=>my().players.find(p=>p.id===id);
// ability on the day: fresh legs (70+) cost at most 6%, below 70 every point of stamina costs more:
// 100 → 100%, 70 → 94%, 55 → 85%, 40 → 76%
// stamina above 80 barely matters; below it a player fades fast (70: about 89%, 60: about 81% of his ability)
const eff=p=>p.ovr*(p.cond>=80?.97+.03*(p.cond-80)/20:.97-(80-p.cond)*.008);
// inj = days until fit again; ban / away = matches still to sit out
// the competition being played right now (set while a match is simulated or played live); outside a match, the
// competition of our next match, so lineups and previews leave out the right suspended players
let COMP=null;
const compOf=f=>f.friendly?'fr':f.cup?'cup':f.intl?'intl':'lg';
function ourComp(){
  if(!S||!S.fixtures||!S.teams||seasonDone())return 'lg';
  const k=[S.day,S.round,S.cup&&S.cup.stage,S.intl&&S.intl.stage,(S.friendlies||[]).filter(f=>f.res).length,S.my].join();
  // (between seasons, after promotion and relegation but before the new fixtures, there is no next match: league)
  if(ourComp.k!==k){ourComp.k=k;try{ourComp.v=compOf(nextFix())}catch(e){ourComp.v='lg'}}
  return ourComp.v;
}
// suspended for this competition (a friendly takes nobody's suspension into account)
const banned=(p,c=COMP||ourComp())=>c!=='fr'&&!!p.bans&&p.bans[c]>0;
const unavail=p=>p.inj>0||p.away>0||!!p.loan||banned(p);
/* ---------- lineups are 11 formation slots ----------
   a lineup is an array with one entry per slot of the formation (GK first, then DF, MF, FW); an entry is a
   player id, or null when the slot is empty or its player was sent off. the slot decides the role he plays */
const slotRoles=form=>PO.flatMap(pos=>Array(FORMS[form][pos]).fill(pos));
// each slot's line: like slotRoles, but midfield slots are split into holding (DM), central (MF) and attacking (AM)
const slotLines=form=>{const f=FORMS[form],roles=slotRoles(form),m0=roles.indexOf('MF');
  return roles.map((r,i)=>r!=='MF'?r:i-m0<(f.dm||0)?'DM':i-m0>=f.MF-(f.am||0)?'AM':'MF')};
// a holding midfielder trades a little attack for defence, an attacking one the reverse (zero-sum: a style, not an edge)
const LINE_TILT={DM:-.8,AM:.8};
// how well a player suits a role: own position 1, another outfield line .85, keeper <-> outfield .5
const fit=(p,role)=>p.pos===role?1:p.pos==='GK'||role==='GK'?.5:OOP;
const onPitch=(team,ids)=>ids.map(id=>id==null?null:team.players.find(p=>p.id===id)||null);
const pickOn=ids=>pick(ids.filter(id=>id!=null));
const keeper=(team,ids)=>ids[0]==null?null:team.players.find(x=>x.id===ids[0]);
// distance between lines (DF-MF 1, DF-FW 2): a stand-in comes from the nearest line
const lineGap=(a,b)=>Math.abs(PO.indexOf(a)-PO.indexOf(b));
// best stand-in for an outfield role from players listed in order of preference
const standIn=(list,role)=>list.filter(p=>p.pos!=='GK').sort((a,b)=>lineGap(a.pos,role)-lineGap(b.pos,role))[0];
// fills the formation's slots from players in order of preference: own position first, then the nearest line.
// with no keeper available, the best remaining outfield player goes in goal rather than leaving it empty
function arrange(players,form){
  const roles=slotRoles(form),slots=Array(roles.length).fill(null),left=[...players];
  roles.forEach((r,i)=>{const k=left.findIndex(p=>p.pos===r);if(k>=0)slots[i]=left.splice(k,1)[0].id});
  roles.forEach((r,i)=>{if(slots[i]!=null||r==='GK')return;const p=standIn(left,r);if(p){left.splice(left.indexOf(p),1);slots[i]=p.id}});
  if(slots[0]==null&&left.length)slots[0]=left.splice(0,1)[0].id;
  roles.forEach((r,i)=>{if(slots[i]==null&&left.length)slots[i]=left.splice(0,1)[0].id});  // last resort: a spare keeper outfield
  // short of players and no keeper: someone has to go in goal, so move an outfield player back (a forward first)
  if(slots[0]==null){const i=[...roles.keys()].reverse().find(i=>i>0&&slots[i]!=null);if(i!=null){slots[0]=slots[i];slots[i]=null}}
  return slots;
}
// the best available XI for a formation; byAbility ignores today's stamina (a post-match pick for a match days away)
function autoPick(team,form,byAbility){return arrange(team.players.filter(p=>!unavail(p)).sort(byAbility?(a,b)=>b.ovr-a.ovr:(a,b)=>eff(b)-eff(a)),form)}

function strength(team,ids,tac,home,bonus=0,form='4-4-2'){
  const roles=slotRoles(form),lines=slotLines(form),g={GK:[],DF:[],MF:[],FW:[]};let n=0,tilt=0;
  onPitch(team,ids).forEach((p,i)=>{if(p){n++;g[roles[i]].push(eff(p)*fit(p,roles[i]));tilt+=LINE_TILT[lines[i]]||0}});
  const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:30;
  const gk=g.GK.length?g.GK[0]:25,d=avg(g.DF),m=avg(g.MF),f=avg(g.FW);
  let atk=f*.5+m*.4+d*.1+(g.FW.length-2)*2+(g.MF.length-4)*.8+tilt;
  let def=d*.5+gk*.3+m*.2+(g.DF.length-4)*2+(g.MF.length-4)*.8-tilt;
  // all out gains a little more going forward than it gives away at the back, so it pays when you're the better side
  if(tac==='att'){atk+=6;def-=4}else if(tac==='def'){atk-=4;def+=4}
  if(home){atk+=1.5;def+=1}
  const miss=11-n;atk-=miss*6-bonus;def-=miss*6-bonus;
  return {atk,def};
}
// goals per minute from attack against defence (about 2.6 a match over a season); the /18.5 keeps upsets possible:
// a much bigger club drops points to a much smaller one about a third of the time, more when it is tired
const xgMin=(A,B)=>clamp(1.18*Math.exp((A.atk-B.def)/18.5),.2,3.5)/90;
const rating=s=>Math.round((s.atk+s.def)/2);

// who scores depends on the role he's playing, not his natural position
function scorer(team,ids,form='4-4-2'){
  const w={FW:5.5,AM:3.3,MF:2,DM:.8,DF:.6,GK:.02},lines=slotLines(form);
  const ps=onPitch(team,ids).map((p,i)=>p&&{p,w:w[lines[i]]*p.ovr}).filter(Boolean);
  let r=rng()*ps.reduce((s,x)=>s+x.w,0);
  for(const x of ps){r-=x.w;if(r<=0)return x.p}
  return ps[0].p;
}
// set pieces. our takers are an order of up to TAKER_MAX players per kind (an older save has a single id): the first
// of them on the pitch takes it. otherwise, and for other clubs, the best man for it on the pitch (penalties: forwards
// first; free kicks: midfielders first; a signature move counts in his favour)
const TAKER_MAX=3;
const takerList=k=>{const v=S.takers&&S.takers[k];return (Array.isArray(v)?v:v!=null?[v]:[]).filter(id=>findP(id))};
function taker(team,ids,kind){
  const on=onPitch(team,ids).filter(p=>p&&p.pos!=='GK');if(!on.length)return onPitch(team,ids).find(Boolean)||null;
  if(team.id===S.my)for(const id of takerList(kind)){const p=on.find(x=>x.id===id);if(p)return p}
  const pref=kind==='pen'?{FW:4,MF:2,DF:0}:{MF:4,FW:2,DF:0};
  return on.sort((a,b)=>(b.ovr+pref[b.pos]+(b.sig?3:0))-(a.ovr+pref[a.pos]+(a.sig?3:0)))[0];
}
// how likely a penalty / a direct free kick goes in: the taker against the keeper (no keeper: nearly always)
const penOdds=(t,gk)=>!gk?.97:clamp(.76+(t.ovr-gk.ovr)*.006+(t.sig?.08:0)-(gk.sig?.06:0),.55,.93);
const fkOdds=(t,gk)=>clamp(.12+(t.ovr-75)*.004+(t.sig?.06:0)-(gk&&gk.sig?.03:0),.04,.25);
// who set the goal up: about 86% of open-play goals have an assist; midfielders most often, then forwards, defenders now
// and then, keepers almost never; better players more often. never the scorer himself
function assister(team,ids,form,sc){
  if(rng()>=.86)return null;  // open play; with set pieces (no assist) about 77% of all goals
  const w={AM:4.2,MF:3,DM:2.2,FW:4.5,DF:1.1,GK:.05},lines=slotLines(form);  // roughly 45% midfield, 35% forwards, 20% defence
  const ps=onPitch(team,ids).map((p,i)=>p&&p!==sc&&{p,w:w[lines[i]]*p.ovr}).filter(Boolean);
  let r=rng()*ps.reduce((s,x)=>s+x.w,0);
  for(const x of ps){r-=x.w;if(r<=0)return x.p}
  return ps.length?ps[0].p:null;
}
/* ---------- match ratings ---------- */
// a 3.0-10.0 rating: starts from ability and the result, then what he did (ev: g goals, sig signature goals,
// sv saves, miss, yc, red) and, for the back line, goals conceded. part-timers (subbed on or off) drift less from 6
// a player's match in numbers, shared out from team totals by role, minutes and quality:
// passes (and how many found a man), key passes (one per chance created), tackles won, interceptions, dribbles.
// mins: minutes each player was on; poss: our share of the ball (0-1); edge: our strength minus theirs; shots: ours
// by line (lineOf: player id -> GK/DF/DM/MF/AM/FW)
const ACT_W={pas:{GK:.4,DF:1.1,DM:1.5,MF:1.4,AM:1.2,FW:.7},def:{GK:.1,DF:1.4,DM:1.3,MF:.8,AM:.4,FW:.3},
  kp:{GK:.02,DF:.5,DM:.8,MF:1.6,AM:1.9,FW:1},drb:{GK:0,DF:.3,DM:.5,MF:1,AM:1.4,FW:1.5}};
function matchActions(team,xi,lineOf,mins,poss,edge,shots){
  const ps=xi.map(id=>{const p=id!=null&&team.players.find(x=>x.id===id);return p&&{p,role:lineOf[id]||p.pos,m:Math.max(1,mins[id]??90)/90}}).filter(Boolean);
  const share=(k,total,q)=>{const ws=ps.map(x=>ACT_W[k][x.role]*x.m*(.6+rng()*.8)*(q?x.p.ovr/70:1)),sum=ws.reduce((a,b)=>a+b,0)||1;return ws.map(w=>total*w/sum)};
  const pas=share('pas',poss*560),def=share('def',(1-poss)*70),kp=share('kp',shots*.75,true),drb=share('drb',poss*22,true),out={};
  ps.forEach((x,i)=>{
    // ability, not stamina at the final whistle: the numbers cover the whole match
    const q=x.p.ovr-65,pa=Math.round(pas[i]),pct=clamp(.74+q*.008+edge*.004+(rng()-.5)*.06,.5,.95);
    const tk=def[i]*.6,it=Math.round(def[i]*.4),dr=drb[i];
    out[x.p.id]={pas:pa,ok:Math.round(pa*pct),kp:Math.round(kp[i]),tkl:Math.round(tk*clamp(.55+q*.01,.3,.85)),int:it,drb:Math.round(dr*clamp(.45+q*.01,.2,.8))};
  });
  return out;
}
// what the numbers are worth in a rating: accurate passing (15+ passes), chances created, winning the ball, beating a man
function actScore(a){
  if(!a)return 0;
  return (a.pas>=15?(a.ok/a.pas-.78)*3:0)+a.kp*.18+a.tkl*.15+a.int*.12+a.drb*.08;
}
function rate(p,role,ev={},gf,ga,mins=90,act){
  // the base: ability, the result, his share of the passing and tackling, and for the back line the goals against
  let base=5.9+(p.ovr-65)/25+(gf>ga?.4:gf<ga?-.4:0)+(rng()-.5)*.6+actScore(act);
  if(role==='GK')base+=.3+(ga?-.25*ga:1);else if(role==='DF')base+=ga?-.15*ga:.5;else if(role==='MF'&&!ga)base+=.1;
  // the base needs time to show: on for 10 minutes it moves the rating about 30% as far from 6 as over an hour or more.
  // what he did himself (goals, assists, saves, misses, cards) counts in full however long he played
  const f=Math.min(1,.15+.85*mins/60);
  const r=6+(base-6)*f+(ev.g||0)*(role==='FW'?1.25:1.1)+(ev.a||0)*.6+(ev.sig||0)*.2+(ev.sv||0)*.3+(ev.blk||0)*.4-(ev.miss||0)*.15-(ev.yc||0)*.3-(ev.red||0)*1.5;
  // squeezed to the spread of real match ratings (average about 6.75, 8+ for roughly one starter in 17, 9+ about 1%,
  // under 6 about one in 10). the poor side is squeezed hardest; the very top less, so a man of the match is ~8.2.
  // the order of players within a match doesn't change
  const d=r-6.8,out=6.65+(d<0?d*.55:d*.62+.3*Math.max(0,r-8));
  return Math.round(clamp(out,3,10)*10)/10;
}
// rates everyone who played for one side, adds it to their season totals (rs sum, rn count), best first
// act: matchActions for this side; season totals of those numbers go in p.ss
// mins: minutes each player was on (90 if missing)
function rateSide(team,played,roleOf,ev,gf,ga,mins={},noTotals,act={}){
  return played.map(id=>{
    const p=id!=null&&team.players.find(x=>x.id===id);if(!p)return null;
    const role=roleOf[id]||p.pos,a=act[id],r=rate(p,role,ev[id],gf,ga,mins[id]??90,a);
    if(!noTotals){p.rs=(p.rs||0)+r;p.rn=(p.rn||0)+1;if(a){const t=p.ss||(p.ss={pas:0,ok:0,kp:0,tkl:0,int:0,drb:0});for(const k of ['pas','ok','kp','tkl','int','drb'])t[k]+=a[k];t.sv=(t.sv||0)+((ev[id]||{}).sv||0)}}
    return {p,r,role,a};
  }).filter(Boolean).sort((a,b)=>b.r-a.r);
}
const roleMap=(ids,form,of=slotRoles)=>{const roles=of(form),m={};ids.forEach((id,i)=>{if(id!=null)m[id]=roles[i]});return m};
const lineMap=(ids,form)=>roleMap(ids,form,slotLines);
const avgRating=p=>p.rn?p.rs/p.rn:0;
// ball possession share for the home side, from midfield control and tactics
function possession(H,hi,hf,ht,A,ai,af,at){
  const MID={MF:1,DM:.9,AM:.8};
  const mid=(t,ids,f)=>{const roles=slotRoles(f),lines=slotLines(f);return onPitch(t,ids).reduce((s,p,i)=>s+(p?eff(p)*fit(p,roles[i])*(MID[lines[i]]||.3):0),0)};
  const mh=mid(H,hi,hf),ma=mid(A,ai,af),tb=t=>t==='att'?3:t==='def'?-3:0;
  return Math.round(clamp(50+(mh-ma)/(mh+ma)*150+tb(ht)-tb(at),30,70));
}

// injury chance for one player this minute: tired legs break more easily
const injRisk=p=>INJ_RATE*(p.cond>=75?.45:p.cond>=60?.7:p.cond>=45?1.4:2.2);
// books a random player on the pitch; yc tracks yellows within this match.
// a second yellow sends him off (his slot becomes null) and YC_BAN yellows over the season earn a ban. either ban
// starts once the match is over (p.banNext, applied in afterMatch): a man on his third yellow plays on, and nobody
// counts as suspended while the match is still being played. both in one match (his third yellow, then a second
// yellow of the game) add up to two matches out
function booking(team,ids,yc){
  const id=pickOn(ids),p=team.players.find(x=>x.id===id);if(!p)return null;  // one man on the pitch, at random
  // season totals: ycs yellows, rcs reds (a second yellow counts as both); p.ycc[competition] counts toward the next ban
  if(yc[p.id]){ids[ids.indexOf(p.id)]=null;p.banNext=(p.banNext||0)+1;p.ycs=(p.ycs||0)+1;p.rcs=(p.rcs||0)+1;return {p,red:true}}
  const c=COMP||'lg',n=p.ycc||(p.ycc={});
  yc[p.id]=1;n[c]=(n[c]||0)+1;p.ycs=(p.ycs||0)+1;
  if(n[c]>=YC_BAN){n[c]=0;p.banNext=(p.banNext||0)+1;return {p,banned:true}}
  return {p};
}
// growth multiplier: young players and those far below their potential improve faster
// how fast a player improves (training and matches): young and far below potential is fastest; it fades with age
// and stops at 33 (veterans only hold their level, they don't train back what age takes)
const AGE_GROW=a=>a<=21?1.3:a<=27?1:a<=30?.6:a<=32?.3:0;
const growF=p=>AGE_GROW(p.age)*clamp((p.pot-p.ovr)/8,.5,2);
// xi = everyone who played this match; anyone banned or away who sat it out has now served a match.
// our squad only takes the match itself here (fatigue, match growth); rest and training happen day by day.
// AI clubs have no calendar, so their recovery and training are folded into each match
function afterMatch(team,xi,isMy,friendly){
  const grown=[],awoken=[];
  // AI clubs develop players according to where they stand against their 底蕴: below their level faster,
  // above it slower. this anchors each club near its tier instead of the whole league drifting upward
  // an AI club well above its 底蕴's level stops developing until it falls back, so the league can't drift upward
  const g=isMy?0:aiGap(team),aiGrow=isMy?0:.17*(.7+(team.rep||50)/100*.7)*(g>2?1.5:g>0?1:g>-2?.4:0);
  if(isMy)team.players.forEach(p=>p.gain=0);
  team.players.forEach(p=>{
    const played=xi.includes(p.id);
    if(played&&!friendly)p.apps++;
    p.cond=clamp(Math.round(p.cond),30,100);  // stamina was spent minute by minute during the match
    if(!isMy&&p.inj>0)p.inj=Math.max(0,p.inj-7);  // our injuries heal day by day in advanceDay
    // bans are served (and earned) in the competition being played; a friendly does neither
    const c=COMP||'lg',b=p.bans||(p.bans={});
    if(!friendly&&b[c]>0&&!played)b[c]--;
    if(p.banNext){b[c]=Math.max(b[c]||0,p.banNext);delete p.banNext}  // a ban earned in this match: the next one in it
    if(!friendly&&p.away>0&&!played)p.away--;
    if(p.ovr<p.pot){
      const ch=isMy?(played?MATCH_GROW:0):aiGrow;
      if(ch&&rng()<ch*growF(p)){p.ovr++;learnSig(p);if(isMy){grown.push(p);p.gain=(p.gain||0)+1}}
    }
    if(p.age<=23&&p.pot<95&&rng()<AWAKEN){awaken(p);if(isMy)awoken.push(p)}
  });
  if(!isMy)team.lastDay=team.condDay=S.day;
  return {grown,awoken};
}
// AI clubs recover on the same calendar as ours: the day after a match is a rest day, then training days.
// applied lazily just before they play, from the last day their stamina was brought up to date
function aiRecover(t){
  if(t.id===S.my)return;
  if(t.condDay==null){t.condDay=S.day;return}
  for(let d=t.condDay+1;d<=S.day;d++){
    const gain=d===t.lastDay+1?DAY_REST:TRAIN_DAY.normal.cond;
    t.players.forEach(p=>p.cond=Math.min(100,p.cond+(p.inj?DAY_REST:gain)));
  }
  t.condDay=S.day;
}
// stamina spent by one player in one minute on the pitch: about 27 over 90 minutes for a forward, 30 for a midfielder,
// more when attacking all out, less when sitting deep, a little more for players over 30. by role, as in distance
// covered: midfielders run the most, keepers hardly at all. enough that fresh legs from the bench matter by the hour
const DRAIN_ROLE={GK:.22,DF:.95,DM:1.1,MF:1.1,AM:1.05,FW:1};
function drain(p,tac,role){
  p.cond=Math.max(30,p.cond-.33*(DRAIN_ROLE[role]??1)*(tac==='att'?1.08:tac==='def'?.95:1)*(p.age>=31?1.15:1)*(.8+rng()*.4));
}
// tired legs: from the hour a side swaps its most exhausted outfield player (below TIRED stamina) for a fresh one of
// the same role (one change every 5 minutes, keeping the last substitution for injuries until the 80th). [out, in] or null
const TIRED=72,SPENT=50;  // SPENT: below this a man comes off whoever is on the bench
function tiredSwap(team,ids,xi,form,used,min){
  if(min<60||min>88||used>=SUBS-(min<80?1:0))return null;
  const roles=slotRoles(form),bench=team.players.filter(x=>!xi.includes(x.id)&&!unavail(x)).sort((a,b)=>eff(b)-eff(a));
  const tired=ids.map((id,i)=>({p:id!=null&&team.players.find(x=>x.id===id),i})).filter(x=>x.p&&roles[x.i]!=='GK'&&x.p.cond<TIRED).sort((a,b)=>a.p.cond-b.p.cond);
  // only when the sub would do better than the tired man (if not, try the next most tired). a man under 60 is
  // flagging and injury-prone, so he goes off for anyone nearly as good (up to 3 points worse on the day); under
  // SPENT he is finished, star or not, and goes off for the best man there is for his place
  for(const t of tired){
    const role=roles[t.i],fresh=bench.find(x=>x.pos===role)||standIn(bench,role);
    if(fresh&&(t.p.cond<SPENT||eff(fresh)*fit(fresh,role)>eff(t.p)*fit(t.p,role)-(t.p.cond<60?3:0)))return [t.p,fresh];
  }
  return null;
}
// a side sitting deep against a side attacking all out gets a counter-attack bonus
const counter=(mine,theirs)=>mine==='def'&&theirs==='att'?2:0;
// a side's weakest outfield line by its starters' average ability (GK left out)
function weakLine(team,ids,form){
  const roles=slotRoles(form),sum={},n={};
  onPitch(team,ids).forEach((p,i)=>{const r=roles[i];if(p&&r!=='GK'){sum[r]=(sum[r]||0)+p.ovr;n[r]=(n[r]||0)+1}});
  return ['DF','MF','FW'].filter(r=>n[r]).sort((a,b)=>sum[a]/n[a]-sum[b]/n[b])[0]||null;
}
// does our shape / tactic go at that line?
function targets(weak,form,tac){
  const f=FORMS[form];if(!weak||!f)return false;
  return weak==='DF'?f.FW>=3||tac==='att':weak==='FW'?tac==='att'||f.DF<=3:f.MF>=5;
}
// AI clubs line up in a formation that rates best with the players they have. any within half a point of the best
// will do, and each club has its own order of favourites among those, so the league isn't all 4-4-2.
// deterministic, so the opponent preview shows the formation the match will use
function bestForm(team,home){
  const keys=Object.keys(FORMS),all=keys.map(form=>{const ids=autoPick(team,form),s=strength(team,ids,'bal',home,0,form);
    return {form,ids,v:(s.atk+s.def)/2,r:rating(s)}});
  const top=Math.max(...all.map(x=>x.v)),fav=f=>(keys.indexOf(f)+team.id*3)%keys.length;
  return all.filter(x=>x.v>=top-.5).sort((a,b)=>fav(a.form)-fav(b.form))[0];
}
// and pick a tactic from how they compare: clearly stronger go for it, clearly weaker sit deep
const tacFor=(mine,theirs)=>mine>theirs+3?'att':mine<theirs-3?'def':'bal';
// comp: the competition ('lg', 'cup', 'intl'), for bookings and bans
function quickSim(h,a,comp='lg'){
  const prev=COMP;COMP=comp;
  try{return simMatch(h,a)}finally{COMP=prev}
}
function simMatch(h,a){
  aiRecover(S.teams[h]);aiRecover(S.teams[a]);
  const H=S.teams[h],A=S.teams[a],bh=bestForm(H,true),ba=bestForm(A,false),th=tacFor(bh.r,ba.r),ta=tacFor(ba.r,bh.r);
  const hx=[...bh.ids],ax=[...ba.ids],hi=[...hx],ai=[...ax],yc={},ev={},used={h:0,a:0},on={},off={},shots={h:0,a:0};
  let minute=0;
  const e=id=>ev[id]||(ev[id]={}),book=b=>{if(b){e(b.p.id)[b.red?'red':'yc']=1;if(b.red)off[b.p.id]=minute}};
  const poss=possession(H,hi,bh.form,th,A,ai,ba.form,ta)/100;
  let hg=0,ag=0;const hurt=[];
  const injure=(t,ids)=>{const id=pickOn(ids),p=t.players.find(x=>x.id===id);if(p&&!hurt.includes(p)&&rng()<injRisk(p))hurt.push(p)};
  let edge=0;
  for(let i=0;i<90;i++){
    minute=i;
    const sh=strength(H,hi,th,true,0,bh.form),sa=strength(A,ai,ta,false,0,ba.form);
    sh.atk+=counter(th,ta);sa.atk+=counter(ta,th);edge=rating(sh)-rating(sa);
    const ph=xgMin(sh,sa),pa=xgMin(sa,sh);
    // about as many saves as the live match credits to a keeper
    const stop=(T,ids)=>{const k=keeper(T,ids);if(k)e(k.id).sv=(e(k.id).sv||0)+1};
    const assist=(T,ids,form,p)=>{const a=assister(T,ids,form,p);if(a){a.ast=(a.ast||0)+1;e(a.id).a=(e(a.id).a||0)+1}};
    // a goal chance (a tenth of them a penalty), else maybe a save or a shot; now and then a free kick in range
    const score=(T,ids,form,p,k,solo)=>{if(k==='h')hg++;else ag++;shots[k]++;p.goals++;e(p.id).g=(e(p.id).g||0)+1;if(!solo)assist(T,ids,form,p)};
    const chance=(T,ids,form,O,oids,k,pr)=>{
      if(rng()<pr){
        if(rng()<PEN_SHARE){const t=taker(T,ids,'pen'),gk=keeper(O,oids);if(rng()<penOdds(t,gk))score(T,ids,form,t,k,true);else{shots[k]++;if(gk&&rng()<.6)stop(O,oids)}}
        else score(T,ids,form,scorer(T,ids,form),k,false);
      }else{const r=rng();if(r<pr*.6){shots[k]++;stop(O,oids)}else if(r<pr*4.7)shots[k]++}
      if(rng()<pr*1.2*FK_SHARE){const t=taker(T,ids,'fk');shots[k]++;if(rng()<fkOdds(t,keeper(O,oids)))score(T,ids,form,t,k,true)}
    };
    chance(H,hi,bh.form,A,ai,'h',ph);chance(A,ai,ba.form,H,hi,'a',pa);
    if(rng()<CARD)book(booking(H,hi,yc));
    if(rng()<CARD)book(booking(A,ai,yc));
    injure(H,hi);injure(A,ai);
    const rH=slotLines(bh.form),rA=slotLines(ba.form);
    onPitch(H,hi).forEach((p,j)=>p&&drain(p,th,rH[j]));onPitch(A,ai).forEach((p,j)=>p&&drain(p,ta,rA[j]));
    for(const [T,ids,xi,form,k] of [[H,hi,hx,bh.form,'h'],[A,ai,ax,ba.form,'a']]){
      // up to two changes at once when a second man is spent too
      for(let n=0;n<2&&i%5===0;n++){const sw=tiredSwap(T,ids,xi,form,used[k],i);if(!sw||n&&sw[0].cond>=60)break;
        ids[ids.indexOf(sw[0].id)]=sw[1].id;xi.push(sw[1].id);used[k]++;off[sw[0].id]=i;on[sw[1].id]=i}
    }
  }
  afterMatch(H,hx,false);afterMatch(A,ax,false);
  hurt.forEach(p=>p.inj=pick(INJ_DAYS));
  const mins={};[...hx,...ax].forEach(id=>{if(id!=null)mins[id]=(off[id]??90)-(on[id]??0)});
  const rh=roleMap(hx,bh.form),ra=roleMap(ax,ba.form);
  rateSide(H,hx,rh,ev,hg,ag,mins,false,matchActions(H,hx,lineMap(hx,bh.form),mins,poss,edge,shots.h));
  rateSide(A,ax,ra,ev,ag,hg,mins,false,matchActions(A,ax,lineMap(ax,ba.form),mins,1-poss,-edge,shots.a));
  return {h,a,hg,ag};
}

/* ---------- transfer market ---------- */
// over-23s are always read right; for younger players the scout department's level sets how often the report is
// confident and how far off it can be. force = {conf, est} sets the report directly (hidden gems, academy kids)
function scoutReport(p,force){
  let conf='high',est=p.pot,w=0;
  if(force){conf=force.conf;est=force.est;w=conf==='high'?0:conf==='mid'?3:6}
  else if(p.age<=23){
    const sh=scoutShare(),e=scoutErr(),r=rng();
    conf=r<sh.high?'high':r<1-sh.low?'mid':'low';
    if(conf!=='high'){const m=e[conf];est=p.pot+ri(-m,m);w=Math.max(1,m-(conf==='mid'?1:2))}
  }
  est=clamp(est,p.ovr,94);
  p.scout={conf,est,lo:Math.max(p.ovr,est-w),hi:Math.min(95,est+w)};
  p.price=Math.round(value({...p,pot:est})*1.15);
}
// a hidden gem: a teenager with 88-93 potential whose scout report badly undersells it
function makeGem(){
  const g=makePlayer(pick(['DF','MF','FW']),ri(50,58),ri(17,19));
  g.pot=ri(88,93);scoutReport(g,{conf:'low',est:ri(72,77)});return g;
}
// how far the top division has moved above its starting level (average best XI of 75), 0-14.
// the market and the academy follow it, so there is always something worth buying as the league gets stronger
const BASE_LEVEL=75;
function leagueShift(){
  const top=S.teams.filter(t=>t.div===0&&t.id!==S.my);
  const avg=top.reduce((s,t)=>s+onPitch(t,bestForm(t,true).ids).filter(Boolean).reduce((a,p)=>a+p.ovr,0)/11,0)/top.length;
  return clamp(Math.round(avg-BASE_LEVEL),0,14);
}
// the season's transfer list, generated at the start of the season (n players; the scouts can add more later)
function refreshMarket(){S.market=[];addToMarket(marketSize(),true)}
function addToMarket(n,season){
  const sh=Math.round(leagueShift()/2),start=S.market.length;  // half the league's rise, so the market doesn't feed it
  for(let i=0;i<n;i++){
    const pos=pick(['GK','DF','DF','DF','MF','MF','MF','FW','FW','FW']);
    let p;
    if(i%4===0){p=makePlayer(pos,ri(50,64)+sh*.5,ri(17,20));p.pot=Math.min(95,(rng()<diff().talent?ri(84,92):ri(72,83))+Math.round(sh*.3))}  // a quarter are prospects, some of them real talents
    else if(season&&i<3*Math.max(1,sh>>2)&&sh>=4)p=makePlayer(pos,ri(78,84)+sh*.6,ri(24,30));  // once the league has grown: marquee names
    else p=makePlayer(pos,ri(52,80)+sh,ri(18,33));
    scoutReport(p);S.market.push(p);
  }
  const at=()=>start+ri(0,n-1);
  for(let g=0;g<(season?3:1);g++)if(rng()<gemChance())S.market[at()]=makeGem();
  for(let g=0;g<(season?3:1);g++)if(rng()<.45){
    const c=S.market.slice(start).filter(p=>p.scout.conf!=='low'&&p.age>=22&&!p.sale);
    if(c.length){const x=pick(c);x.price=Math.round(x.price*.5);x.sale=true}
  }
}
// AI clubs shop too: starting from their weakest starter, sign a clearly better market player at that position.
// the str+6 ceiling keeps each club near its own level so the league doesn't inflate over seasons
function aiSign(t){
  const xi=onPitch(t,autoPick(t,'4-4-2')).filter(Boolean).sort((x,y)=>x.ovr-y.ovr);
  for(const w of xi){
    const c=S.market.filter(p=>p.pos===w.pos&&p.ovr>=w.ovr+3&&p.ovr<=aiCeiling(t)).sort((x,y)=>y.ovr-x.ovr)[0];
    if(!c)continue;
    S.market=S.market.filter(x=>x!==c);delete c.price;delete c.scout;delete c.sale;delete c.ex;delete c.eyed;
    t.players.push(c);
    if(t.players.length>20){
      const drop=t.players.filter(p=>p.pos===c.pos&&p!==c).sort((x,y)=>x.ovr-y.ovr||y.age-x.age)[0];
      if(drop)t.players=t.players.filter(p=>p!==drop);
    }
    return `${t.name}签下${c.name}（${POS[c.pos]}，能力 ${c.ovr}）`;
  }
  return null;
}
function aiWindow(chance){
  // clubs well below the level their 底蕴 expects try harder; clubs above it hardly bother
  const want=t=>{const g=aiGap(t);return chance*(g>4?3:g>1?1.5:g<-3?.3:1)};
  const done=domestic().filter(t=>t.id!==S.my&&(t.winBuys||0)<2&&rng()<want(t)).map(t=>{const r=aiSign(t);if(r)t.winBuys=(t.winBuys||0)+1;return r}).filter(Boolean);
  if(done.length)news(`其他球队转会动态：${done.join('；')}。`);
}
let NEWS_TAG=null;  // set while a cup match is being wrapped up, so its news is labelled with the cup stage
function news(t){S.news.unshift({r:`S${S.season} ${NEWS_TAG||`第${Math.min(S.round+1,rounds())}轮`}`,t});S.news=S.news.slice(0,30)}

// rounds in the current season for a division (ours by default), and the season's league weeks (by calendar)
const rounds=d=>S.fixtures[d??my().div].length;
const weeks=()=>S.cal>=3?SEASON_WEEKS:S.cal>=2?Math.max(...S.fixtures.map(f=>f.length)):S.fixtures[0].length;
// spreads n picks evenly over a list
const spread=(a,n)=>n<=0?[]:n>=a.length?[...a]:Array.from({length:n},(_,i)=>a[Math.round(i*(a.length-1)/Math.max(1,n-1))]);
// a division's league match days this season. every week has a Saturday round, except that a division with fewer
// rounds than weeks sits some weekends out: 甲级 on its 冠军杯 weeks first, then any division on 天穹杯 weeks, then
// spread through the season. a division with more rounds than weeks (calendar 3: 丙级) plays the extra ones on
// Tuesdays of weeks without a cup tie. the first and last weeks are always played, so every division ends the same day
function seasonDays(d=my().div){
  if(!(S.cal>=2))return seasonDaysV1(d);
  const W=weeks(),R=S.fixtures[d].length,pre=S.pre||0;
  let off=W-R;const out=new Set(),mid=w=>w>0&&w<W-1&&!out.has(w);
  const intlW=d===0?(S.intl&&S.intl.weeks)||(S.cal>=3?INTL_WEEKS:INTL_WEEKS_V2):[],cupW=S.cup&&!S.cup.skipped?cupFmt().at:[];
  for(const pool of [intlW,cupW,Array.from({length:W},(_,w)=>w)]){
    const take=spread(pool.filter(mid),off);take.forEach(w=>out.add(w));off-=take.length;
  }
  const days=[];for(let w=0;w<W;w++)if(!out.has(w))days.push(pre+7*w+5);
  if(R>W)spread(Array.from({length:W},(_,w)=>w).filter(w=>w>0&&w<W-1&&!cupW.includes(w)),R-W).forEach(w=>days.push(pre+7*w+1));
  return days.sort((a,b)=>a-b);
}
// the calendar before version 2: the top flight every Saturday, a bigger division's extra rounds on Tuesdays
function seasonDaysV1(d){
  const W=weeks(),R=S.fixtures[d].length,pre=S.pre||0,days=[];
  for(let w=0;w<Math.min(W,R);w++)days.push(pre+7*w+5);
  const extra=R-W;
  if(extra>0){
    const cupW=new Set(S.cup&&!S.cup.skipped?cupFmt().at:[]),cand=[];
    for(let w=1;w<W-1;w++)if(!cupW.has(w))cand.push(w);
    for(let i=0;i<extra;i++)days.push(pre+7*cand[Math.round(i*(cand.length-1)/Math.max(1,extra-1))]+1);
  }
  return days.sort((a,b)=>a-b);
}
const leagueDay=(r,d)=>{const s=seasonDays(d);return r<s.length?s[r]:s[s.length-1]+7*(r-s.length+1)};
// divisions other than ours play their rounds on their own match days (ours is played along with our match)
function playOtherDivisions(){
  S.fixtures.forEach((fx,d)=>{
    if(d===my().div)return;
    while(S.results[d].length<fx.length&&leagueDay(S.results[d].length,d)<=S.day)S.results[d].push(fx[S.results[d].length].map(([h,a])=>quickSim(h,a)));
  });
}
const divIds=div=>S.teams.filter(t=>t.div===div).map(t=>t.id);
const newFixtures=()=>DIVS.map((_,div)=>genFixtures(divIds(div)));
function newGame(id,names,difficulty='normal'){
  S={v:SAVE_V,diff:DIFF[difficulty]?difficulty:'normal',cal:CAL_V,pid:1,season:1,round:0,my:id,formation:'4-4-2',tactic:'bal',training:'normal',news:[],history:[],
    mgr:{rep:15,last:0},ach:{},streak:0,boost:0,records:[],club:{},legends:[],offers:[],event:null,academy:{lv:1,intake:[]},day:0,lastMatchDay:-9,fac:{scout:1,physio:1,ground:1}};
  usedNames=new Set();
  S.teams=TEAMS.map((t,i)=>({...t,...names[i],id:i,players:makeSquad(t.str+(i===id?0:diff().ai))}));
  S.fixtures=newFixtures();S.results=DIVS.map(()=>[]);S.cup=newCup();S.rival=pickRival();
  S.teams.forEach(t=>t.players.forEach(p=>learnSig(p,true)));
  S.intl=newIntl(S.teams.filter(t=>t.div===0).sort((a,b)=>b.rep-a.rep).slice(0,3).map(t=>t.id));
  S.budget=Math.round(startBudget(TEAMS[id])*diff().budget);
  S.lineup=autoPick(my(),S.formation);S.autoXI=true;
  S.pre=PRESEASON;refreshMarket();planFriendlies();
  news(`你正式成为${my().name}的主教练。董事会给了你 ${money(S.budget)} 的预算。季前一周转会窗口开放，还有两场友谊赛。`);
  news(`宿敌：${S.teams[S.rival].name}。与他们的对决，收入翻倍，赢了全队士气高涨。`);
  newIntake();setGoals();
  save();UI={tab:'home',view:'main',mf:{...MF0}};
  try{if(!localStorage.getItem(GUIDE_KEY))UI.guide=0}catch(e){}  // first game on this device: the guide
  render();
}

function table(div=my().div){
  const T=S.teams.filter(t=>t.div===div).map(t=>({id:t.id,name:t.name,color:t.color,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0})),by={};
  T.forEach(r=>by[r.id]=r);
  S.results[div].flat().forEach(r=>{
    const h=by[r.h],a=by[r.a];h.p++;a.p++;h.gf+=r.hg;h.ga+=r.ag;a.gf+=r.ag;a.ga+=r.hg;
    if(r.hg>r.ag){h.w++;a.l++;h.pts+=3}else if(r.hg<r.ag){a.w++;h.l++;a.pts+=3}else{h.d++;a.d++;h.pts++;a.pts++}
  });
  return T.sort((x,y)=>y.pts-x.pts||(y.gf-y.ga)-(x.gf-x.ga)||y.gf-x.gf);
}
const myRank=()=>table().findIndex(t=>t.id===S.my)+1;
// 'up', 'down' or '' for a finishing position in a division
const zone=(div,rank)=>div>0&&rank<=SWAP?'up':div<DIVS.length-1&&rank>divSize(div)-SWAP?'down':'';
// the next match: a cup tie when one is due and we're still in it, otherwise the league round
function nextFix(){
  const fr=nextFriendly();
  if(fr){const h=fr.home?S.my:fr.opp,a=fr.home?fr.opp:S.my;return {h,a,home:fr.home,opp:fr.opp,cup:false,derby:false,friendly:true,warm:!!fr.warm,idx:S.friendlies.indexOf(fr)}}
  let cup=cupDue()&&inCup(),intl=intlDue()&&intlMine();
  if(cup&&intl){if(cupDay(S.cup.stage)<intlDay(S.intl.stage))intl=false;else cup=false}
  const m=cup?S.cup.ties.find(t=>t.includes(S.my)):intl?intlMatches().find(t=>t.includes(S.my)):S.fixtures[my().div][S.round].find(m=>m.includes(S.my));
  const opp=m[0]===S.my?m[1]:m[0];
  return {h:m[0],a:m[1],home:m[0]===S.my,opp,cup,intl,derby:!intl&&opp===S.rival};
}
const divName=t=>t.foreign?'海外':DIVS[t.div];
const fixLabel=f=>f.friendly?(f.warm?`热身赛（对手${divName(S.teams[f.opp])}）`:`季前友谊赛 ${f.idx+1}/2（对手${divName(S.teams[f.opp])}）`):f.cup?`${CUP_NAME}·${stageName(S.cup.stage)}`:f.intl?`${INTL_NAME}·${INTL_STAGES[S.intl.stage]}`:`联赛第 ${S.round+1} 轮`;
function lineupIssues(){
  const ps=S.lineup.map(id=>id==null?null:findP(id)),n=ps.filter(Boolean).length,iss=[];
  // fewer than 11 is only allowed when nobody else is fit to play, and never below the 7 the rules require
  const spare=my().players.some(p=>!unavail(p)&&!S.lineup.includes(p.id));
  if(n<7)iss.push(`可上场的球员不足 7 人，比赛无法进行`);
  else if(n<11&&spare)iss.push(`首发需要 11 人，现在是 ${n} 人`);
  if(ps.some(p=>p&&unavail(p)))iss.push('首发里有受伤、停赛或请假的球员');
  if(!ps[0])iss.push('门将位置空着');
  return iss;
}
const lineupCount=()=>S.lineup.filter(id=>id!=null&&findP(id)).length;
// players in our lineup playing outside their own position
const outOfPos=()=>{const roles=slotRoles(S.formation);return S.lineup.map((id,i)=>{const p=id!=null&&findP(id);return p&&p.pos!==roles[i]?p:null}).filter(Boolean)};
// after a match: empty the slots of anyone now unavailable, and if the XI was full, refill those slots
// after a match or an event: a lineup we haven't arranged by hand is simply picked afresh (so a star back from
// injury walks straight back into his place); one we arranged keeps our choices and only has its gaps filled
// a player's stamina at the next kickoff: today's and each following day's rest or training still to come
function kickoffCond(p){
  let c=p.cond;const days=matchDays(),end=nextMatchDay();
  for(let d=S.day;d<end;d++){const t=S.lastMatchDay===d?'match':dayType(d,days);c+=t==='match'?0:t==='rest'?restAmt():TRAIN_DAY[S.training].cond}
  return Math.min(100,c);
}
// the auto XI with rotation (on unless switched off): the most worn starters (by their stamina at kickoff) first,
// each swapped for the best man of his position who qualifies
function rotate(ids,form){
  if(S.rotate===false||seasonDone())return ids;
  const roles=slotRoles(form),out=[...ids],kc=new Map(my().players.map(p=>[p.id,kickoffCond(p)]));
  const worn=out.map((id,i)=>({p:id!=null&&findP(id),i})).filter(x=>x.p&&kc.get(x.p.id)<ROTATE_AT).sort((a,b)=>kc.get(a.p.id)-kc.get(b.p.id));
  for(const {p,i} of worn){
    const sub=my().players.filter(q=>q.pos===roles[i]&&!unavail(q)&&!out.includes(q.id)&&kc.get(q.id)>=kc.get(p.id)+ROTATE_FRESH&&q.ovr>=p.ovr-ROTATE_GAP)
      .sort((a,b)=>b.ovr-a.ovr)[0];
    if(sub)out[i]=sub.id;
  }
  return out;
}
function fixLineup(){
  if(S.autoXI!==false){S.lineup=rotate(autoPick(my(),S.formation,true),S.formation);return}
  const full=lineupCount()===11;
  S.lineup=S.lineup.map(id=>{const p=id!=null&&findP(id);return p&&!unavail(p)?id:null});
  if(full)fillSlots();
}
// puts the best free players into empty slots: own position first, then any outfield slot
function fillSlots(){
  const roles=slotRoles(S.formation),free=()=>my().players.filter(p=>!unavail(p)&&!S.lineup.includes(p.id)).sort((a,b)=>eff(b)-eff(a));
  roles.forEach((r,i)=>{if(S.lineup[i]==null){const p=free().find(x=>x.pos===r);if(p)S.lineup[i]=p.id}});
  roles.forEach((r,i)=>{if(S.lineup[i]==null&&r!=='GK'){const p=standIn(free(),r);if(p)S.lineup[i]=p.id}});
  if(S.lineup[0]==null){const p=free()[0];if(p)S.lineup[0]=p.id}  // emergency keeper
  roles.forEach((r,i)=>{if(S.lineup[i]==null){const p=free()[0];if(p)S.lineup[i]=p.id}});  // last resort: a spare keeper outfield
}
// a player joins the XI: into the given slot, else an empty slot of his position, else any empty outfield slot
function placeInLineup(p,slot){
  const roles=slotRoles(S.formation);
  if(slot==null)slot=roles.findIndex((r,i)=>S.lineup[i]==null&&r===p.pos);
  if(slot<0)slot=roles.findIndex((r,i)=>S.lineup[i]==null&&(r!=='GK'||p.pos==='GK'));
  if(slot<0)return false;
  S.lineup[slot]=p.id;return true;
}
const dropFromLineup=id=>S.lineup=S.lineup.map(x=>x===id?null:x);

/* ---------- season ---------- */
// the chance by age (RETIRE_AGE), scaled by ability (good players keep going longer, in 5-point steps) and by
// where he stands at his club: a regular carries on longer than a veteran stuck well below the side's level.
// lvl: the club's first-choice level (the average of its best XI)
const RETIRE_ABILITY=o=>o>=85?.25:o>=80?.4:o>=75?.55:o>=70?.75:o>=65?1:o>=60?1.2:1.5;
const RETIRE_PLACE=d=>d>=0?.8:d>-5?1:d>-10?1.2:1.4;  // his ability minus the club's level
function retireChance(p,lvl=p.ovr){
  if(p.age>=40)return 1;
  return Math.min(1,(RETIRE_AGE[p.age]||0)*RETIRE_ABILITY(p.ovr)*RETIRE_PLACE(p.ovr-lvl));
}
const xiLevel=t=>{const ps=onPitch(t,bestForm(t,true).ids).filter(Boolean);return ps.reduce((s,p)=>s+p.ovr,0)/(ps.length||1)};
function expectedRank(){return S.teams.filter(t=>t.div===my().div).sort((a,b)=>b.str-a.str).findIndex(t=>t.id===S.my)+1}
const prizeFor=(div,rank)=>PRIZES[div][Math.min(rank,PRIZES[div].length)-1];
// moveTo: the id of a club whose offer we accept (otherwise we stay)
function newSeason(moveTo){
  finishIntl();
  const move=moveTo!=null&&(S.jobOffers||[]).find(o=>o.club===moveTo);
  const div=my().div,rank=myRank(),prize=prizeFor(div,rank);
  {const r=table()[rank-1];S.history.push({season:S.season,div,rank,pts:r.pts,p:r.p,gf:r.gf,ga:r.ga,club:my().name})}
  S.budget+=prize;
  recordSeason(div,rank);
  payGoals(div);
  endLoans();
  // 底蕴 from the final tables, then promotion and relegation between neighbouring divisions
  const finals=DIVS.map((_,d)=>table(d)),prestigeNotes=updatePrestige(finals);
  const intlHome=intlEntrants(finals[0].map(r=>r.id),S.cup.winner);  // next season's 天际冠军杯 entrants
  const moves=[];
  finals.forEach((T,d)=>T.forEach((r,i)=>{const z=zone(d,i+1);if(z)moves.push({t:S.teams[r.id],z})}));
  moves.forEach(({t,z})=>{t.div+=z==='up'?-1:1});
  if(DIV_SIZES.some((n,d)=>divSize(d)<n))growLeague();
  const names=z=>moves.filter(m=>m.z===z).map(m=>m.t.name).join('、');
  const retired=[];
  S.teams.forEach(t=>{
    t.players.forEach(p=>{
      if(t.id===S.my)(p.hist=p.hist||[]).push({s:S.season,o:p.ovr});
      const old=p.ovr;p.age++;
      if(p.age<=23)p.ovr=Math.min(p.pot,p.ovr+ri(1,clamp(Math.round((p.pot-p.ovr)/3),2,6)));
      else if(p.age<=32)p.ovr+=ri(-1,1);  // peak years: holds steady until 33
      else if(p.age<=34)p.ovr-=ri(1,3);
      else p.ovr-=ri(2,5);
      p.ovr=clamp(p.ovr,35,95);p.pot=p.age>=33?p.ovr:Math.max(p.pot,p.ovr);  // 95 is potential's ceiling too; past 33 the decline is for good
      t.condDay=0;t.lastDay=-9;p.cond=100;p.inj=0;p.bans={};p.away=0;p.ycc={};p.ycs=0;p.rcs=0;p.goals=0;p.ast=0;p.ss=null;p.apps=0;p.lapps=0;p.rs=0;p.rn=0;delete p.bk;p.gain=p.ovr-old;
      if(p.sig&&p.age>=SIG_FADE){if(t.id===S.my)news(`${p.name} 年满 ${p.age} 岁，必杀技「${p.sig}」渐渐生疏了。`);delete p.sig}
      else learnSig(p);
    });
    const lvl=xiLevel(t),out=t.players.filter(p=>rng()<retireChance(p,lvl));
    if(t.id===S.my)out.forEach(p=>{retired.push(p.name);retireLegend(p)});
    t.players=t.players.filter(p=>!out.includes(p));
    const minN=t.id===S.my?15:16;
    while(t.players.length<minN){
      const counts={GK:0,DF:0,MF:0,FW:0};t.players.forEach(p=>counts[p.pos]++);
      const pos=counts.GK<2?'GK':counts.DF<5?'DF':counts.MF<5?'MF':'FW';
      const y=makePlayer(pos,t.str-10,ri(17,19));y.pot=clamp(y.ovr+ri(10,22),y.ovr,90);if(t.id===S.my){y.youth=true;y.joined=S.season+1}t.players.push(y);
      if(t.id===S.my)news(`青训球员 ${y.name}（${POS[pos]}，${y.age} 岁）升入一线队。`);
    }
  });
  S.season++;S.cal=CAL_V;S.round=0;S.results=DIVS.map(()=>[]);S.fixtures=newFixtures();S.cheatUsed=false;S.cup=newCup();S.day=0;S.lastMatchDay=-9;
  const left=move?my():null;
  if(move)switchClub(move);
  S.jobOffers=null;
  if(S.teams[S.rival].div!==my().div){S.rival=pickRival();news(`新的宿敌出现了：${S.teams[S.rival].name}。`)}
  // summer window: bigger clubs poach stars from clubs playing above their level, every AI club gets one shot
  // at the market, then the player sees a fresh list
  S.pre=PRESEASON;S.day=0;aiPoach();refreshMarket();planFriendlies();
  if(left)releaseSurplus(left);
  S.intl=newIntl(intlHome);
  S.lineup=autoPick(my(),S.formation);S.autoXI=true;
  news(`升级：${names('up')}。降级：${names('down')}。`);
  prestigeNotes.forEach(t=>news(t+'。'));
  const mz=moves.find(m=>m.t.id===S.my);
  news(`新赛季开始！上赛季${DIVS[div]}第 ${rank}，获得奖金 ${money(prize)}。${mz?mz.z==='up'?`球队升入${DIVS[my().div]}！`:`球队降入${DIVS[my().div]}。`:''}`);
  if(retired.length)news(`退役：${retired.join('、')}。`);
  setGoals();
  if(S.academy.intake.length)news(`上一批没有签下的 ${S.academy.intake.length} 名青训少年离开了。`);
  newIntake();
  if(my().players.some(p=>p.youth&&p.ovr>=75))unlock('academy');
  if(mz&&mz.z==='up')unlock('promo');
  if(S.history.length>=5)unlock('vet');
  save();UI.tab='home';render();
}

/* ---------- calendar ---------- */
// our known upcoming matches: the remaining league rounds, plus the current cup tie if we're still in
function matchDays(){
  const list=[];
  (S.friendlies||[]).forEach((f,i)=>{if(!f.res)list.push({day:f.day,friendly:true,i,opp:f.opp,home:f.home})});
  for(let r=S.round;r<rounds();r++)list.push({day:leagueDay(r),cup:false,r});
  if(inCup()&&S.cup.stage<cupFmt().names.length)list.push({day:cupDay(S.cup.stage),cup:true,k:S.cup.stage});
  if(intlMine())list.push({day:intlDay(S.intl.stage),intl:true,k:S.intl.stage});
  return list.sort((a,b)=>a.day-b.day);
}
// the last day of our season: the last league round, or a later 冠军杯 final we're in
const seasonEndDay=()=>Math.max(leagueDay(rounds()-1),...matchDays().map(m=>m.day));
const nextMatchDay=()=>{const fr=nextFriendly();if(fr)return fr.day;const c=[leagueDay(S.round)];if(cupDue()&&inCup())c.push(cupDay(S.cup.stage));if(intlDue()&&intlMine())c.push(intlDay(S.intl.stage));return Math.min(...c)};
// the season is over once the league is done and we have no 冠军杯 match left (the final comes after the league)
const seasonDone=()=>S.round>=rounds()&&!(intlMine()&&S.intl.stage<intlStages());
const isMatchDay=()=>!seasonDone()&&S.day===nextMatchDay();
// 'match', 'rest' (the day after one of our matches) or 'train'
function dayType(d,days=matchDays()){
  if(days.some(m=>m.day===d))return 'match';
  if(S.lastMatchDay===d-1||days.some(m=>m.day===d-1))return 'rest';
  return 'train';
}
const dayLabel=d=>`第 ${Math.floor(d/7)+1} 周${WEEKDAYS[d%7]}`;
// moves one day forward: a rest day restores stamina; a training day follows the training setting.
// injured players rest instead of training. cup ties we're not part of are played on their own date
function advanceDay(log){
  if(seasonDone()||S.day>=nextMatchDay())return false;
  // today's programme counts as we move on: the training chosen today (so the eve of a match counts too), a rest day
  // the day after one of our matches, nothing more on a day we played. injuries mend every day, match days included
  const today=S.day,type=S.lastMatchDay===today?'match':dayType(today),mode=type==='rest'?{cond:restAmt(),grow:0}:TRAIN_DAY[S.training];
  S.day++;
  playOtherDivisions();
  if(type==='match')my().players.forEach(p=>{if(p.inj>0&&--p.inj===0)(log.healed||(log.healed=[])).push(p)});
  else my().players.forEach(p=>{
    const before=p.cond;
    const wasHurt=p.inj>0;
    p.cond=clamp(p.cond+(wasHurt?restAmt():mode.cond),30,100);
    if(wasHurt&&--p.inj===0)(log.healed||(log.healed=[])).push(p);
    log.cond+=p.cond-before;
    if(mode.grow&&!p.inj&&!p.away&&p.ovr<p.pot&&rng()<mode.grow*dayScale()*growF(p)*groundMult()){p.ovr++;p.gain=(p.gain||0)+1;learnSig(p);log.trained.push(p)}
  });
  log.days++;
  windowDay();
  rollSurprise(log);
  while(cupDue()&&!inCup()&&S.day>=cupDay(S.cup.stage))playCupStage(null);
  intlCatchUp();
  planWarmups();
  if(S.autoXI!==false)fixLineup();  // the auto XI follows the stamina day by day
  return true;
}
