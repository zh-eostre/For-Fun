/* ---------- run ---------- */
const nid=()=>S.uid++;
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function load(){try{const t=localStorage.getItem(KEY);if(t){const d=JSON.parse(t);if(d&&d.v===1)return d}}catch(e){}return null}
function clearSave(){try{localStorage.removeItem(KEY)}catch(e){}}
function getBest(){try{return JSON.parse(localStorage.getItem(BEST))||null}catch(e){return null}}
function setBest(){const b=getBest(),sc=S.loop*13+S.floor;if(!b||sc>b.sc){try{localStorage.setItem(BEST,JSON.stringify({sc,loop:S.loop,floor:S.floor}))}catch(e){}}}

function genMap(){
  const m=[];
  for(let f=0;f<12;f++){
    if(f===0){m.push(['fight','fight','event']);continue}
    if(f===11){m.push(['rest','shop']);continue}
    const w=[['fight',45],['elite',f>=3?16:0],['rest',f>=4?12:0],['shop',f>=2?12:0],['event',15]],row=[];
    while(row.length<3){let x=Math.random()*w.reduce((s,a)=>s+a[1],0);for(const [k,v] of w){x-=v;if(x<0){row.push(k);break}}}
    if(row.every(r=>r===row[0]))row[2]=row[0]==='fight'?'event':'fight';
    m.push(row);
  }
  m.push(['boss']);
  return m;
}
function newRun(){
  S={v:1,uid:1,hp:80,maxHp:80,gold:99,relics:['blood'],loop:0,floor:0,removeCost:75,path:[],screen:'map'};
  S.deck=[...Array(5).fill('strike'),...Array(4).fill('defend'),'bash'].map(id=>({uid:nid(),id,up:false}));
  S.map=genMap();save();render();
}
const NODE={fight:'战斗',elite:'精英',rest:'篝火',shop:'商店',event:'事件',boss:'首领'};

function enterNode(i){
  const type=S.map[S.floor][i];S.path[S.floor]=i;
  if(type==='fight'||type==='elite'||type==='boss')startCombat(type);
  else if(type==='rest'){S.screen='rest';S.rest={done:false};save();render()}
  else if(type==='shop'){S.screen='shop';S.shop=genShop();save();render()}
  else{S.screen='event';S.event={k:pick(Object.keys(EVENTS).filter(k=>!EVENTS[k].req||EVENTS[k].req())),res:null};save();render()}
}
function nextFloor(){
  S.floor++;S.screen='map';S.reward=S.shop=S.event=S.rest=null;save();render();window.scrollTo(0,0);
}

/* ---------- combat ---------- */
function startCombat(type){
  let group=type==='boss'?[pick(['dragon','titan'])]:type==='elite'?pick(ELITES):S.floor<=2&&S.loop===0?pick(EASY):pick(NORMAL);
  C={type,enemies:group.map(makeEnemy),draw:shuffle(S.deck.map(c=>({...c}))),hand:[],discard:[],exhaust:[],energy:0,turn:0,
     p:{block:0,str:0,weak:0,vuln:0,poison:0,metal:0,fumes:0,demon:0,barricade:0,inspire:0},atkCount:0,target:null,busy:false};
  C.enemies.forEach(e=>{e.next=EN[e.k].ai(e,0)});
  if(has('whet'))C.p.str+=1;
  if(has('sac'))C.enemies.forEach(e=>e.poison+=3);
  S.screen='combat';FX=[];HIT={};
  startTurn();
}
function alive(){return C.enemies.filter(e=>e.hp>0)}
function curTarget(){let t=C.enemies.find(e=>e.uid===C.target&&e.hp>0);if(!t){t=alive()[0];if(t)C.target=t.uid}return t}
function pDmg(base,e,mul=1){let d=base+C.p.str*mul;if(C.p.weak>0)d*=.75;if(e&&e.vuln>0)d*=1.5;return Math.max(0,Math.floor(d))}
function eDmg(e,a){let d=Math.round(a*e.dm)+e.str;if(e.weak>0)d*=.75;if(C.p.vuln>0)d*=1.5;return Math.max(0,Math.floor(d))}
function hitEnemy(e,base,mul=1){
  if(!e||e.hp<=0)return;
  let d=pDmg(base,e,mul);const b=Math.min(e.block,d);e.block-=b;d-=b;e.hp-=d;
  fx('e'+e.uid,d>0?'-'+d:'格挡',d>0?'dmg':'blk');HIT['e'+e.uid]=performance.now();
  if(e.hp<=0){e.hp=0;if(has('fang'))heal(4)}
}
function atk(base,n=1,mul=1){for(let i=0;i<n;i++){const t=curTarget();if(!t)break;hitEnemy(t,base,mul)}}
function atkAll(base,n=1){for(let i=0;i<n;i++)alive().forEach(e=>hitEnemy(e,base))}
function gainBlock(n){if(n<=0)return;C.p.block+=n;fx('p','+'+n+' 格挡','blk')}
const LBL={weak:'虚弱',vuln:'易伤',poison:'中毒',str:'力量'};
function applyE(e,k,n){if(!e||n<=0)return;e[k]=(e[k]||0)+n;fx('e'+e.uid,`${LBL[k]} +${n}`,'st')}
function draw(n){for(let i=0;i<n;i++){if(C.hand.length>=10)break;if(!C.draw.length){if(!C.discard.length)break;C.draw=shuffle(C.discard);C.discard=[]}C.hand.push(C.draw.pop())}}
function heal(n){const h=Math.min(n,S.maxHp-S.hp);if(h>0){S.hp+=h;if(C)fx('p','+'+h,'heal')}}
function loseHp(n){S.hp-=n;if(C){fx('p','-'+n,'dmg');HIT.p=performance.now()}}
function hitPlayer(d){const b=Math.min(C.p.block,d);C.p.block-=b;d-=b;S.hp-=d;fx('p',d>0?'-'+d:'格挡',d>0?'dmg':'blk');HIT.p=performance.now()}

function startTurn(){
  C.turn++;C.atkCount=0;
  if(!C.p.barricade)C.p.block=0;
  if(C.p.poison>0){loseHp(C.p.poison);C.p.poison--;if(S.hp<=0)return die()}
  C.energy=3+(has('core')?1:0)+(C.turn===1&&has('lantern')?1:0);
  if(C.turn===1&&has('anchor'))gainBlock(10);
  if(C.p.demon){C.p.str+=C.p.demon;fx('p',`力量 +${C.p.demon}`,'st')}
  if(C.p.fumes)alive().forEach(e=>e.poison+=C.p.fumes);
  draw(5+C.p.inspire+(has('crown')?1:0)+(C.turn===1&&has('ring')?2:0));
  C.busy=false;render();
}
function playCard(uid){
  if(!C||C.busy)return;
  const i=C.hand.findIndex(c=>c.uid===uid);if(i<0)return;
  const c=C.hand[i],d=CARDS[c.id],cost=costOf(c);
  if(cost>C.energy){toast('能量不足');return}
  if(d.t==='atk'&&!curTarget())return;
  C.energy-=cost;C.hand.splice(i,1);
  d.f(c.up,c);
  if(d.t==='atk'){C.atkCount++;if(C.atkCount===3&&has('drum')){C.p.str++;fx('p','力量 +1','st')}}
  if(d.t!=='pow'){if(exOf(c))C.exhaust.push(c);else C.discard.push(c)}
  if(S.hp<=0)return die();
  render();checkWin();
}
function checkWin(){
  if(alive().length)return;
  C.busy=true;
  setTimeout(()=>{
    if(has('blood'))heal(8);
    const elite=C.type==='elite',boss=C.type==='boss';
    let gold=boss?R(95,110):elite?R(30,40):R(14,24);if(has('purse'))gold=Math.round(gold*1.5);
    S.reward={gold,goldTaken:false,cards:rollCards(3,elite||boss),cardTaken:false,
      relic:elite?pick(freeRelics(false))||null:null,relicTaken:false,
      boss:boss?shuffle(freeRelics(true)).slice(0,3):null,bossTaken:false};
    C=null;S.screen='reward';save();render();window.scrollTo(0,0);
  },650);
}
async function endTurn(){
  if(!C||C.busy)return;
  C.busy=true;
  C.discard.push(...C.hand);C.hand=[];
  if(C.p.metal)gainBlock(C.p.metal);
  if(has('ori')&&C.p.block===0)gainBlock(6);
  render();
  for(const e of C.enemies){
    if(e.hp<=0)continue;
    await sleep(430);if(!C)return;
    e.block=0;
    if(e.poison>0){e.hp-=e.poison;fx('e'+e.uid,'-'+e.poison,'dmg');HIT['e'+e.uid]=performance.now();e.poison--;
      if(e.hp<=0){e.hp=0;if(has('fang'))heal(4);render();continue}}
    const m=e.next;
    if(m.b){e.block+=Math.round(m.b*e.bm);fx('e'+e.uid,'+格挡','blk')}
    if(m.s){e.str+=m.s;fx('e'+e.uid,`力量 +${m.s}`,'st')}
    if(m.a){for(let i=0;i<(m.n||1);i++)hitPlayer(eDmg(e,m.a))}
    if(m.w)C.p.weak+=m.w;if(m.vu)C.p.vuln+=m.vu;if(m.po)C.p.poison+=m.po;
    if(m.w||m.vu||m.po)fx('p',[m.w&&'虚弱',m.vu&&'易伤',m.po&&'中毒'].filter(Boolean).join(' '),'st');
    e.t++;e.next=EN[e.k].ai(e,e.t);
    if(e.weak>0)e.weak--;if(e.vuln>0)e.vuln--;
    render();
    if(S.hp<=0)return die();
  }
  if(!alive().length){render();checkWin();return}
  if(C.p.weak>0)C.p.weak--;if(C.p.vuln>0)C.p.vuln--;
  await sleep(300);if(!C)return;
  startTurn();
}
function die(){S.hp=0;C&&(C.busy=true);setBest();setTimeout(()=>{C=null;S.screen='dead';clearSave();render();window.scrollTo(0,0)},700)}

/* ---------- shop / events ---------- */
function genShop(){
  const ids=[...rollPool('com',2),...rollPool('unc',2),...rollPool('rare',1)];
  const price={com:[45,55],unc:[68,82],rare:[135,160]};
  return {cards:ids.map(id=>({id,price:R(...price[CARDS[id].r]),sold:false})),
    relic:(()=>{const k=pick(freeRelics(false));return k?{k,price:R(140,170),sold:false}:null})(),removed:false};
}
function rollPool(r,n){return shuffle(POOL(r)).slice(0,n)}
const EVENTS={
  altar:{n:'神秘祭坛',t:'石台上刻着古老的文字：献出鲜血者，将得到力量。',
    opts:()=>[['献上鲜血：失去 8 点生命，获得一张稀有卡','a'],['转身离开','x']],
    run:o=>{if(o==='a'){S.hp=Math.max(1,S.hp-8);const id=pick(POOL('rare'));addCard(id);return `你感到一阵晕眩。手中多了一张「${CARDS[id].n}」。`}return '你没有碰那座祭坛。'}},
  chest:{n:'古老宝箱',t:'宝箱上布满了奇怪的符文，旁边还散落着一些金币。',
    opts:()=>[['打开宝箱：获得一件随机遗物，最大生命 -5','a'],['只捡金币：获得 60 金币','b']],
    run:o=>{if(o==='a'){const k=pick(freeRelics(false));S.maxHp-=5;S.hp=Math.min(S.hp,S.maxHp);if(k){gainRelic(k);return `你得到了「${RELICS[k].n}」：${RELICS[k].d}。`}return '宝箱是空的。'}S.gold+=60;return '你捡起了 60 金币。'}},
  spring:{n:'治愈之泉',t:'清澈的泉水闪着微光。',
    opts:()=>[['喝下泉水：回复 25 点生命','a'],['洗净自己：删除一张牌','b']],
    run:o=>{if(o==='a'){heal(25);return '伤口慢慢愈合了。'}UI.over={mode:'remove',from:'event'};return null}},
  smith:{n:'流浪铁匠',t:'一个背着铁砧的老人向你招手。',
    opts:()=>[['请他帮忙：随机升级 1 张牌','a'],[S.gold>=40?'加钱加急：花 40 金币，随机升级 3 张牌':'加钱加急（金币不够）','b']],
    run:o=>{if(o==='b'&&S.gold<40)return false;if(o==='b')S.gold-=40;const n=o==='a'?1:3;const c=shuffle(S.deck.filter(x=>!x.up)).slice(0,n);c.forEach(x=>x.up=true);
      return c.length?`升级了：${c.map(x=>CARDS[x.id].n+'+').join('、')}。`:'你的牌都已经升级过了。'}},
  gambler:{n:'地下赌徒',t:'「敢不敢赌一把？赢了翻倍，输了归我。」',req:()=>S.gold>=50,
    opts:()=>[['赌 50 金币','a'],['不赌','x']],
    run:o=>{if(o==='a'){if(Math.random()<.5){S.gold+=50;return '你赢了！金币 +50。'}S.gold-=50;return '你输了 50 金币。赌徒笑着走开了。'}return '你摇摇头离开了。'}}
};
function addCard(id,up=false){S.deck.push({uid:nid(),id,up})}

