/* ---------- actions ---------- */
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,2200)}
const A={
  new:()=>{UI.over=null;newRun()},
  cont:()=>{S=load();if(S.screen==='combat')S.screen='map';render()},
  home:()=>{S=null;render()},
  go:i=>enterNode(+i),
  deck:()=>{UI.over={mode:'deck'};renderOver()},
  close:()=>{UI.over=null;renderOver()},
  relic:k=>toast(`${RELICS[k].n}：${RELICS[k].d}`),
  target:u=>{if(C){C.target=+u;render()}},
  play:u=>playCard(+u),
  end:()=>endTurn(),
  rgold:()=>{const r=S.reward;if(r.goldTaken)return;r.goldTaken=true;S.gold+=r.gold;save();render()},
  rrelic:()=>{const r=S.reward;if(r.relicTaken)return;r.relicTaken=true;gainRelic(r.relic);toast(`获得「${RELICS[r.relic].n}」`);save();render()},
  rboss:k=>{const r=S.reward;if(r.bossTaken)return;r.bossTaken=true;gainRelic(k);toast(`获得「${RELICS[k].n}」`);save();render()},
  rcard:id=>{const r=S.reward;if(r.cardTaken)return;r.cardTaken=true;addCard(id);toast(`「${CARDS[id].n}」加入了牌组`);save();render()},
  next:()=>{const r=S.reward;if(r&&!r.goldTaken){S.gold+=r.gold}nextFloor()},
  nextloop:()=>{const r=S.reward;if(!r.goldTaken)S.gold+=r.gold;S.loop++;S.floor=-1;S.path=[];S.map=genMap();S.hp=S.maxHp;setBest();nextFloor()},
  buy:i=>{const x=S.shop.cards[+i];if(!x||x.sold)return;if(S.gold<x.price){toast('金币不够');return}S.gold-=x.price;x.sold=true;addCard(x.id);toast(`买下「${CARDS[x.id].n}」`);save();render()},
  buyrelic:()=>{const x=S.shop.relic;if(!x||x.sold||S.gold<x.price)return;S.gold-=x.price;x.sold=true;gainRelic(x.k);toast(`获得「${RELICS[x.k].n}」`);save();render()},
  shopremove:()=>{if(S.shop.removed||S.gold<S.removeCost)return;UI.over={mode:'remove',from:'shop'};renderOver()},
  rheal:()=>{const h=Math.round(S.maxHp*.3);heal(h);S.rest={done:true,msg:`你睡了一觉，回复了生命，现在 ${S.hp}/${S.maxHp}。`};save();render()},
  rup:()=>{UI.over={mode:'upgrade',from:'rest'};renderOver()},
  ev:o=>{const res=EVENTS[S.event.k].run(o);if(res===false){toast('金币不够');return}if(res!==null)S.event.res=res;save();render()},
  pick:u=>{
    const o=UI.over,c=S.deck.find(x=>x.uid===+u);if(!c)return;
    if(o.mode==='upgrade'){c.up=true;S.rest={done:true,msg:`「${CARDS[c.id].n}」升级成了「${CARDS[c.id].n}+」。`}}
    else if(o.mode==='remove'){
      if(S.deck.length<=5){toast('牌组至少要留 5 张');return}
      S.deck=S.deck.filter(x=>x!==c);
      if(o.from==='shop'){S.gold-=S.removeCost;S.removeCost+=25;S.shop.removed=true}
      else S.event.res=`你洗去了「${CARDS[c.id].n}${c.up?'+':''}」，感觉轻松了许多。`;
      toast(`删除了「${CARDS[c.id].n}」`);
    }
    UI.over=null;save();render();
  }
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b||b.disabled)return;const f=A[b.dataset.act];if(f)f(b.dataset.arg)});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&UI.over&&(UI.over.mode==='deck'||UI.over.from!=='event')){UI.over=null;renderOver()}
  if(S&&S.screen==='combat'&&C&&!UI.over){
    if(e.key==='e'||e.key==='E')endTurn();
    const n=parseInt(e.key,10);if(n>=1&&n<=9&&C.hand[n-1])playCard(C.hand[n-1].uid);
  }
});
render();
