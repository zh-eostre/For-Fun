/* ---------- actions ---------- */
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,2200)}
const A={
  new:k=>{UI.over=null;if(k&&HEROES[k]){UI.pick=false;newRun(k)}else{UI.pick=true;S=null;render()}},
  start:k=>A.new(k),
  cont:()=>{S=load();if(S.screen==='combat')S.screen='map';render()},
  home:()=>{S=null;UI.pick=false;render()},
  go:i=>enterNode(+i),
  deck:()=>{UI.over={mode:'deck'};renderOver()},
  close:()=>{UI.over=null;renderOver()},
  relic:k=>{const n=relicCount(k);toast(`${RELICS[k].n}${n>1?` ×${n}`:''}：${RELICS[k].d}`)},
  target:u=>{if(C){C.target=+u;render()}},
  // on touch, a crowded hand's cards overlap: the first tap lifts a card to read it, a second tap plays it
  play:u=>{if(UI.touch&&handCrowded()&&UI.lift!==+u){UI.lift=+u;render();return}UI.lift=null;playCard(+u)},
  end:()=>{UI.lift=null;endTurn()},
  rgold:()=>{const r=S.reward;if(r.goldTaken)return;r.goldTaken=true;S.gold+=r.gold;save();render()},
  rrelic:()=>{const r=S.reward;if(r.relicTaken)return;r.relicTaken=true;gainRelic(r.relic);toast(`获得「${RELICS[r.relic].n}」`);save();render()},
  rboss:k=>{const r=S.reward;if(r.bossTaken)return;r.bossTaken=true;gainRelic(k);toast(`获得「${RELICS[k].n}」`);save();render()},
  rcard:id=>{const r=S.reward;if(r.cardTaken)return;r.cardTaken=true;addCard(id);toast(`「${CARDS[id].n}」加入了牌组`);save();render()},
  // leaving a reward still collects the gold and the relic (they have no downside); only the card can be skipped
  next:()=>{const r=S.reward;if(r){if(!r.goldTaken)S.gold+=r.gold;if(r.relic&&!r.relicTaken){r.relicTaken=true;gainRelic(r.relic);toast(`获得「${RELICS[r.relic].n}」`)}}nextFloor()},
  nextloop:()=>{const r=S.reward;if(!r.bossTaken){toast('先选一件首领遗物');return}if(!r.goldTaken)S.gold+=r.gold;S.loop++;S.floor=-1;S.path=[];S.map=genMap();S.hp=S.maxHp;setBest();nextFloor()},
  buy:i=>{const x=S.shop.cards[+i];if(!x||x.sold)return;if(S.gold<x.price){toast('金币不够');return}S.gold-=x.price;x.sold=true;addCard(x.id);toast(`买下「${CARDS[x.id].n}」`);save();render()},
  buyrelic:()=>{const x=S.shop.relic;if(!x||x.sold||S.gold<x.price)return;S.gold-=x.price;x.sold=true;gainRelic(x.k);toast(`获得「${RELICS[x.k].n}」`);save();render()},
  shopremove:()=>{if(S.shop.removed||S.gold<removePrice())return;UI.over={mode:'remove',from:'shop'};renderOver()},
  rheal:()=>{const h=Math.round(S.maxHp*.3);heal(h);S.rest={done:true,msg:`你睡了一觉，回复了生命，现在 ${S.hp}/${S.maxHp}。`};save();render()},
  rup:()=>{UI.over={mode:'upgrade',from:'rest'};renderOver()},
  ev:o=>{const res=EVENTS[S.event.k].run(o);if(res===false){toast('金币不够');return}if(res!==null)S.event.res=res;save();render()},
  unsel:()=>{if(UI.over){UI.over.sel=null;renderOver()}},
  upgrade:()=>{
    const c=UI.over&&S.deck.find(x=>x.uid===UI.over.sel);if(!c)return;
    c.up=true;S.rest={done:true,msg:`「${CARDS[c.id].n}」升级成了「${CARDS[c.id].n}+」。`};toast(`「${CARDS[c.id].n}」升级了`);
    UI.over=null;save();render();
  },
  pick:u=>{
    const o=UI.over,c=S.deck.find(x=>x.uid===+u);if(!c)return;
    if(o.mode==='upgrade'){o.sel=c.uid;renderOver();return}
    if(o.mode==='remove'){
      if(S.deck.length<=5){toast('牌组至少要留 5 张');return}
      S.deck=S.deck.filter(x=>x!==c);
      if(o.from==='shop'){S.gold-=removePrice();S.removeCost+=25;S.shop.removed=true}
      else S.event.res=`你洗去了「${CARDS[c.id].n}${c.up?'+':''}」，感觉轻松了许多。`;
      toast(`删除了「${CARDS[c.id].n}」`);
    }
    UI.over=null;save();render();
  }
};
/* ---------- tooltips: hover with a mouse, long-press on touch ---------- */
const TIP={el:null,x:-1,y:-1,sx:0,sy:0,timer:0,swallow:false};
function showTip(el){
  const t=document.getElementById('tip'),[h,...b]=el.dataset.tip.split('\n');
  t.innerHTML=`<b>${h}</b>${b.map(x=>`<span>${x}</span>`).join('')}`;t.hidden=false;
  const r=el.getBoundingClientRect(),w=t.offsetWidth,th=t.offsetHeight;
  t.style.left=clamp(r.left+r.width/2-w/2,8,innerWidth-w-8)+'px';
  t.style.top=(r.top-th-8>=8?r.top-th-8:r.bottom+8)+'px';
  TIP.el=el;
}
function hideTip(){const t=document.getElementById('tip');if(t)t.hidden=true;TIP.el=null}
const tipAt=(x,y)=>{const el=document.elementFromPoint(x,y);return el&&el.closest('[data-tip]')};
// the page re-renders under a still mouse (the enemies acting, numbers floating up): follow what is under it now
function syncTip(){if(TIP.x<0)return;const d=tipAt(TIP.x,TIP.y);d&&!d.matches('.card')?showTip(d):hideTip()}
document.addEventListener('pointermove',e=>{
  if(e.pointerType==='mouse'){TIP.x=e.clientX;TIP.y=e.clientY;const d=e.target.closest('[data-tip]:not(.card)');if(d!==TIP.el)d?showTip(d):hideTip()}
  else if(Math.hypot(e.clientX-TIP.sx,e.clientY-TIP.sy)>10)clearTimeout(TIP.timer);
});
document.addEventListener('pointerout',e=>{if(!e.relatedTarget){TIP.x=-1;hideTip()}});
// crowded: neighbouring cards show less than half of each other
function handCrowded(){const c=document.querySelectorAll('.hand .card');if(c.length<2)return false;const a=c[0].getBoundingClientRect(),b=c[1].getBoundingClientRect();return b.left+b.right-a.left-a.right<c[0].offsetWidth}
document.addEventListener('pointerdown',e=>{
  UI.touch=e.pointerType!=='mouse';
  if(e.pointerType==='mouse')return;
  hideTip();clearTimeout(TIP.timer);TIP.swallow=false;
  if(!e.target.closest('[data-tip]'))return;
  TIP.sx=e.clientX;TIP.sy=e.clientY;
  TIP.timer=setTimeout(()=>{const d=tipAt(TIP.sx,TIP.sy);if(d){showTip(d);TIP.swallow=true}},450);
});
['pointerup','pointercancel'].forEach(t=>document.addEventListener(t,()=>clearTimeout(TIP.timer)));
// a long press only shows the tip: it doesn't also pick the enemy or play anything
document.addEventListener('click',e=>{if(TIP.swallow){TIP.swallow=false;e.stopPropagation();e.preventDefault()}},true);
document.addEventListener('contextmenu',e=>{if(e.target.closest('[data-tip]'))e.preventDefault()});
document.addEventListener('scroll',hideTip,true);

document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b||b.disabled)return;const f=A[b.dataset.act];if(f)f(b.dataset.arg)});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&UI.over){if(UI.over.sel)A.unsel();else if(UI.over.mode==='deck'||UI.over.from!=='event'){UI.over=null;renderOver()}}
  if(S&&S.screen==='combat'&&C&&!UI.over){
    if(e.key==='e'||e.key==='E')endTurn();
    const n=parseInt(e.key,10);if(n>=1&&n<=9&&C.hand[n-1])playCard(C.hand[n-1].uid);
  }
});
render();
