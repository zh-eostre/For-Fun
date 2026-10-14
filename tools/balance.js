// Balance testing: a bot that plays sensibly (in a fight it tries every card on every target and keeps the play that
// leaves the best position) climbs the tower many times, and reports how far runs get, what each fight costs, and
// how much each card and relic is worth: a run that starts with it, against runs that start without.
//   node tools/balance.js [runs per test, default 300] [overall|fights|cards|relics ...]
const N=+process.argv[2]||300,parts=process.argv.slice(3).filter(x=>isNaN(x));
const want=p=>!parts.length||parts.includes(p);
const out=[];
require('../tests/harness').run(`
render=()=>{};renderOver=()=>{};fx=()=>{};toast=()=>{};
// how much the bot wants a card in its deck (its own judgement: it only steers picks, shops and upgrades)
const TIER={strike:0,defend:0,bash:3,twin:5,cleave:6,jab:4,sunder:5,venom:5,slam:3,anger:4,shrug:6,shout:5,scare:4,haze:6,
  heavy:5,rampage:6,entrench:3,adren:6,catal:4,shock:6,whirl:6,inflame:7,metal:6,fumes:6,frenzy:7,execute:4,demon:8,
  barricade:4,inspire:7,offering:6,limit:4,darts:6,ironfist:6,rupture:4,thorns:5,embers:5,toxin:5,devour:4,hellfire:6};
const tier=id=>TIER[id]??5;
const incoming=()=>alive().reduce((s,e)=>s+(e.next&&e.next.a?eDmg(e,e.next.a)*(e.next.n||1):0),0);
function worth(hp0){
  const inc=incoming();let v=0;
  for(const e of C.enemies){
    v+=e.max-e.hp;if(e.hp<=0){v+=25;continue}
    v+=Math.min(e.hp,e.poison*(e.poison+1)/2)*.7+e.weak*(e.next.a?2:.5)+e.vuln*2.5-e.block*.5;
  }
  const p=C.p,lethal=inc-p.block>=S.hp;
  v+=Math.min(p.block,inc)*(lethal?3:1.1)+Math.max(0,p.block-inc)*(p.barricade?.6:.05);
  v+=p.str*5+p.metal*3+p.demon*9+p.fumes*6+p.barricade*10+p.inspire*7+p.thorns*2.5+p.embers*2+p.devour*5+p.toxin*6;
  v+=C.hand.length*1.5+C.energy*.5-(hp0-S.hp)*1.5-p.weak*2-p.vuln*2;
  return v;
}
function bestPlay(){
  const hp0=S.hp,base=worth(hp0);let best=null;
  for(const c of C.hand){
    if(costOf(c)>C.energy)continue;
    const d=CARDS[c.id],targets=d.t==='atk'||['catal','rupture'].includes(c.id)?alive():[curTarget()];
    for(const t of targets){
      const snap=JSON.stringify(C),hp=S.hp,uid=S.uid,tl=timers.length;
      C.target=t.uid;playCard(c.uid);const g=worth(hp0)-base;
      C=JSON.parse(snap);S.hp=hp;S.uid=uid;timers.length=tl;
      if(!best||g>best.g)best={g,uid:c.uid,t:t.uid};
    }
  }
  return best&&best.g>0?best:null;
}
async function fight(){
  for(let turns=0;C&&turns<60;turns++){
    for(let k=0;k<15&&C&&!C.busy;k++){const b=bestPlay();if(!b)break;C.target=b.t;playCard(b.uid)}
    if(C&&!C.busy)endTurn();
    await flush();
    if(S.screen!=='combat')return turns+1;
  }
  return 60;
}
const rnd=()=>Math.random();
function chooseNode(){
  const r=S.hp/S.maxHp,row=S.map[S.floor];
  const score=t=>({fight:3,elite:r>.75?5:-5,rest:r<.5?8:S.deck.some(c=>!c.up)?2:0,shop:S.gold>=120?5:1,event:2.5,boss:9})[t]+rnd();
  let bi=0;row.forEach((t,i)=>{if(score(t)>score(row[bi]))bi=i});return bi;
}
const deckWorth=()=>S.deck.reduce((s,c)=>s+tier(c.id),0)/S.deck.length;
function pickCard(ids){const b=ids.reduce((a,x)=>tier(x)>tier(a)?x:a,ids[0]);return tier(b)+rnd()>deckWorth()+1?b:null}
function upgradeTarget(){return S.deck.filter(c=>!c.up).sort((a,b)=>tier(b.id)-tier(a.id)+(b.id==='bash')-(a.id==='bash'))[0]}
async function play(start){
  A.new();start(S);const log={fights:[],floor:0,loop:0};
  for(let guard=0;guard<500&&S.screen!=='dead'&&S.loop<3;guard++){
    if(UI.over){
      if(UI.over.mode==='upgrade'){const c=upgradeTarget();if(!UI.over.sel&&c)A.pick(String(c.uid));else if(UI.over.sel)A.upgrade();else A.close();continue}
      if(UI.over.mode==='remove'){const c=S.deck.slice().sort((a,b)=>tier(a.id)-tier(b.id))[0];A.pick(String(c.uid));if(UI.over)A.close();continue}
      A.close();continue}
    if(S.screen==='map'){
      const i=chooseNode(),type=S.map[S.floor][i],hp=S.hp;A.go(String(i));
      if(S.screen==='combat'){const group=C.enemies.map(e=>e.k).sort().join('+'),floor=S.floor,loop=S.loop;const turns=await fight();
        log.fights.push({group,type,floor,loop,lost:hp-Math.max(S.hp,0),turns,died:S.screen==='dead'})}
      continue}
    if(S.screen==='reward'){const R=S.reward;if(R.boss&&!R.bossTaken)A.rboss(R.boss[Math.floor(rnd()*R.boss.length)]);
      const id=pickCard(R.cards);if(id)A.rcard(id);if(R.boss)A.nextloop();else A.next();continue}
    if(S.screen==='rest'){if(!S.rest.done){if(S.hp<S.maxHp*.55||!S.deck.some(c=>!c.up))A.rheal();else A.rup()}if(!UI.over)A.next();continue}
    if(S.screen==='shop'){
      if(S.shop.relic&&S.gold>=S.shop.relic.price)A.buyrelic();
      S.shop.cards.map((x,i)=>[x,i]).sort((a,b)=>tier(b[0].id)-tier(a[0].id)).forEach(([x,i])=>{if(!x.sold&&S.gold>=x.price&&tier(x.id)>deckWorth()+1.5)A.buy(String(i))});
      if(!S.shop.removed&&S.gold>=S.removeCost&&S.deck.length>8)A.shopremove();
      if(!UI.over)A.next();continue}
    if(S.screen==='event'){
      if(S.event.res==null){const k=S.event.k,r=S.hp/S.maxHp;
        const o={altar:S.hp>40?'a':'x',chest:'a',spring:r<.7?'a':'b',smith:S.gold>=40?'b':'a',gambler:'x'}[k];A.ev(o)}
      if(!UI.over&&S.event.res!=null)A.next();continue}
  }
  log.floor=S.loop*13+Math.min(S.floor,12)+(S.screen==='dead'?0:1);log.loop=S.loop;log.deck=S.deck.map(c=>c.id);
  return log;
}
const runs=async(n,start=()=>{})=>{const a=[];for(let i=0;i<n;i++)a.push(await play(start));return a};
const depth=a=>a.reduce((s,l)=>s+l.floor,0)/a.length;
const pct=(a,f)=>Math.round(100*a.filter(f).length/a.length);
const T0=Date.now();
const base=await runs(${N});
report('overall',{runs:base.length,depth:depth(base),boss1:pct(base,l=>l.floor>=13),boss2:pct(base,l=>l.floor>=26),boss3:pct(base,l=>l.floor>=39),
  deaths:Object.entries(base.reduce((m,l)=>{if(l.floor<39){const k=l.loop+1+'轮'+(l.floor%13+1)+'层';m[k]=(m[k]||0)+1}return m},{})).sort((a,b)=>b[1]-a[1]).slice(0,12),secs:(Date.now()-T0)/1000});
if(${JSON.stringify(want('fights'))}){
  const g={};base.forEach(l=>l.fights.forEach(f=>{const k=f.type+' '+f.group+(f.loop?' · 第'+(f.loop+1)+'轮':'');const x=g[k]||(g[k]={n:0,lost:0,died:0,turns:0,floor:0});x.n++;x.lost+=f.lost;x.died+=f.died;x.turns+=f.turns;x.floor+=f.floor+13*f.loop}));
  report('fights',Object.entries(g).map(([k,x])=>({k,n:x.n,lost:x.lost/x.n,died:100*x.died/x.n,turns:x.turns/x.n,floor:x.floor/x.n})));
}
if(${JSON.stringify(want('cards'))}){
  const r={};for(const id of Object.keys(CARDS)){if(CARDS[id].r==='basic')continue;
    const a=await runs(${N},S=>{S.deck[S.deck.findIndex(c=>c.id==='strike')]={uid:nid(),id,up:false}});
    r[id]={depth:depth(a),boss1:pct(a,l=>l.floor>=13)}}
  report('cards',r);
}
if(${JSON.stringify(want('relics'))}){
  const r={};for(const k of Object.keys(RELICS)){if(k==='blood')continue;const a=await runs(${N},S=>gainRelic(k));r[k]={depth:depth(a),boss1:pct(a,l=>l.floor>=13)}}
  report('relics',r);
}
`,{report:(k,v)=>out.push([k,v])});
process.on('exit',()=>{
  for(const [k,v] of out){
    if(k==='overall'){console.log(`\n== 总体（${v.runs} 局，${v.secs.toFixed(0)} 秒）==\n平均爬到 ${v.depth.toFixed(1)} 层；打倒第 1 轮首领 ${v.boss1}%，第 2 轮 ${v.boss2}%，第 3 轮 ${v.boss3}%`);
      console.log('最常死在：'+v.deaths.map(([f,n])=>f+' '+n).join('，'))}
    if(k==='fights'){console.log('\n== 遭遇（平均掉血、死亡率、回合数、平均层数）==');
      v.sort((a,b)=>a.k.localeCompare(b.k)).forEach(x=>console.log(`${x.k.padEnd(30)} ${String(x.n).padStart(5)} 场  掉血 ${x.lost.toFixed(1).padStart(5)}  死亡 ${x.died.toFixed(1).padStart(4)}%  ${x.turns.toFixed(1)} 回合  ${x.floor.toFixed(1)} 层`))}
    if(k==='cards'||k==='relics'){const base=out.find(o=>o[0]==='overall')[1].depth;
      console.log(`\n== ${k==='cards'?'卡牌：开局牌组换掉一张打击，加入这张':'遗物：开局就带着'}（基准 ${base.toFixed(1)} 层）==`);
      Object.entries(v).sort((a,b)=>b[1].depth-a[1].depth).forEach(([id,x])=>console.log(`${(k==='cards'?CARDS_N[id]:RELICS_N[id]).padEnd(8,'　')} ${(x.depth-base>=0?'+':'')+(x.depth-base).toFixed(1).padStart(5)} 层   首领 ${x.boss1}%`))}
  }
});
const CARDS_N={},RELICS_N={};
{const vm=require('vm'),fs=require('fs'),path=require('path'),ctx={};vm.createContext(ctx);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/data.js'),'utf8')+';this.C2=CARDS;this.R2=RELICS',ctx);
 for(const k in ctx.C2)CARDS_N[k]=ctx.C2[k].n;for(const k in ctx.R2)RELICS_N[k]=ctx.R2[k].n}
