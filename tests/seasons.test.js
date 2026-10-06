// Six seasons with every system in play: subs, youth, injuries, views render cleanly, replay after reload is identical.
require('./harness').run(`
let badViews=[];
const allTabs=()=>{UI.view='main';for(const t of ['home','squad','table','cup','market','academy','honours']){UI.tab=t;render();if(bad(els.app.innerHTML))badViews.push(t)}};
const btn=()=>({dataset:{},textContent:'',isConnected:true});
const twice=(k,a)=>{const b=btn();ACT[k](a,b);ACT[k](a,b)};

// v4 -> v5 migration
newGame(9,teamNames());const v4=JSON.parse(JSON.stringify(S));v4.v=4;delete v4.academy;
store[KEY]=JSON.stringify(v4);const up=load();console.log('v4 save migrated to v',up.v,'academy',JSON.stringify(up.academy));

newGame(3,teamNames());allTabs();
console.log('first intake:',S.academy.intake.map(p=>POS[p.pos]+' '+p.age+'岁 '+p.ovr+' 报告'+p.scout.lo+'~'+p.scout.hi+' 真'+p.pot+(p.chosen?' [天选]':'')).join(' | '));
const st={myInj:0,injSubs:0,injStay:0,youthSigned:0,lv:[],subs:0,htViews:0};
function playOne(){
  if(S.event)ACT.event('0');
  if(S.offer)ACT.offerNo();
  if(S.academy.intake.length){const p=S.academy.intake[0];const n=my().players.length;ACT.ysign(String(p.id));if(my().players.length>n)st.youthSigned++;UI.reveal=null}
  if(S.budget>600)twice('aup');
  ACT.ff();S.lineup=autoPick(my(),S.formation);
  startMatch();
  while(!M.done&&M.min<45)tick(false);
  if(M.ht){
    render();st.htViews++;if(bad(els.app.innerHTML))badViews.push('ht');
    if(!/class="pitch"/.test(els.app.innerHTML)||!/class="scard/.test(els.app.innerHTML))badViews.push('ht-layout');
    const s=mySide();for(let i=0;i<5;i++){const on=M[s+'Ids'].map(findP).filter(Boolean).sort((a,b)=>a.cond-b.cond)[0];
      const b=my().players.find(p=>!M[s+'XI'].includes(p.id)&&!unavail(p)&&p.pos===on.pos);if(on&&b){ACT.subOut(String(on.id));ACT.subIn(String(b.id))}}
    st.subs+=M.subs;ACT.resume();
  }
  skipMatch();
  st.myInj+=M.myInjuries.length;st.injSubs+=M.feed.filter(e=>e.t.includes('担架')).length;st.injStay+=M.feed.filter(e=>e.t.includes('咬牙坚持')).length;
  render();if(bad(els.app.innerHTML))badViews.push('result');
  M=null;allTabs();
}
// count every new injury on every team
const injCount={};let injTotal=0;const seen=new Set();
const tally=()=>S.teams.forEach(t=>t.players.forEach(p=>{if(p.inj>0&&!p._hurt){p._hurt=1;injCount[t.id]=(injCount[t.id]||0)+1}if(!p.inj)p._hurt=0}));
for(let s=0;s<4;s++){
  while(S.round<ROUNDS){playOne();tally()}
  allTabs();render();if(bad(els.app.innerHTML))badViews.push('seasonEnd');
  st.lv.push(S.academy.lv);
  newSeason();
}
const mine=injCount[S.my]||0,ai=S.teams.filter(t=>t.id!==S.my).map(t=>injCount[t.id]||0);
console.log('injuries over 4 seasons — mine:',mine,'| AI avg:',(ai.reduce((a,b)=>a+b,0)/ai.length).toFixed(1),'| AI each:',ai.join(','));
console.log(JSON.stringify(st));
console.log('youth in squad:',my().players.filter(p=>p.youth).map(p=>p.name+' '+p.age+'岁 '+p.ovr+'/'+p.pot).join(' | '));
console.log('latest intake (lv '+S.academy.lv+'):',S.academy.intake.map(p=>POS[p.pos]+' '+p.ovr+' 报告'+p.scout.lo+'~'+p.scout.hi+' 真'+p.pot+(p.chosen?' [天选]':'')).join(' | '));
console.log('achievements:',Object.keys(S.ach).map(k=>ACH[k][0]).join(' '));
const names=S.teams.flatMap(t=>t.players).map(p=>p.name).concat(S.academy.intake.map(p=>p.name));ok(names.length===new Set(names).size,'no duplicate player names');
ok(!badViews.length,'all views render cleanly'+(badViews.length?': '+[...new Set(badViews)]:''));
S.event=null;ACT.ff();startMatch();const snap=localStorage.getItem(KEY);skipMatch();const r1=JSON.stringify([S.results,S.cup,S.offer,S.event,S.budget,S.academy]);
localStorage.setItem(KEY,snap);M=null;ACT.continue();skipMatch();ok(JSON.stringify([S.results,S.cup,S.offer,S.event,S.budget,S.academy])===r1,'replay after reload is identical');
`);
