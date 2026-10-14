/* ---------- FX ---------- */
function fx(target,text,cls){FX.push({id:Math.random(),t:performance.now(),target,text,cls});clearTimeout(fx.c);fx.c=setTimeout(()=>{const n=performance.now();FX=FX.filter(f=>n-f.t<950);if(S&&S.screen==='combat')render()},1000)}
function fxHtml(target){const n=performance.now();return FX.filter(f=>f.target===target&&n-f.t<950).map((f,i)=>`<span class="fx ${f.cls}" style="animation-delay:-${Math.round(n-f.t)}ms;margin-top:${-i*22}px">${f.text}</span>`).join('')}
function hitCls(target){const t=HIT[target];if(!t)return '';const d=performance.now()-t;return d<350?`hit" style="animation-delay:-${Math.round(d)}ms`:''}

/* ---------- render ---------- */
function cardHtml(c,o={}){
  const d=CARDS[c.id],cost=costOf(c);
  return `<button class="card t-${d.t} r-${d.r} ${c.up?'up':''} ${o.cls||''}" ${o.act?`data-act="${o.act}" data-arg="${o.arg!==undefined?o.arg:c.uid}"`:''} ${o.dis?'disabled':''} aria-label="${d.n}${c.up?'+':''}，费用 ${cost}">
  <span class="cost">${cost}</span><span class="cname">${d.n}${c.up?'+':''}</span>
  <span class="art">${d.e}</span><span class="ctype">${TYPE[d.t]}</span><span class="cdesc"><span>${d.d(c.up,c)}</span></span></button>`;
}
function topbar(){
  return `<header class="bar"><div class="wrap">
  <span class="stat">❤️ <b>${S.hp}</b>/${S.maxHp}</span>
  <span class="stat">💰 <b>${S.gold}</b></span>
  <span class="stat">🗼 第 <b>${S.loop+1}</b> 轮 第 <b>${Math.min(S.floor+1,13)}</b> 层</span>
  <span class="grow"></span>
  <span class="relics">${S.relics.map(k=>`<button class="relic" data-act="relic" data-arg="${k}" title="${RELICS[k].n}：${RELICS[k].d}">${RELICS[k].e}</button>`).join('')}</span>
  <button class="btn sm" data-act="deck">牌组 ${S.deck.length}</button>
  </div></header>`;
}
function render(){
  const app=document.getElementById('app');
  if(!S){app.innerHTML=vTitle();renderOver();return}
  const v={map:vMap,combat:vCombat,reward:vReward,shop:vShop,rest:vRest,event:vEvent,dead:vDead}[S.screen];
  app.innerHTML=(S.screen==='dead'?'':topbar())+v();
  renderOver();
}
function vTitle(){
  const sv=load(),b=getBest();
  return `<div class="title"><div><div class="tower">🗼</div><h1 class="disp">深渊之塔</h1>
  <p class="sub">用一副牌爬上 13 层，打倒塔顶的首领。<br>打赢之后，塔会变得更高、更危险。</p>
  <div class="row">${sv?`<button class="btn primary" data-act="cont">继续冒险（第 ${sv.loop+1} 轮第 ${Math.min(sv.floor+1,13)} 层）</button><button class="btn" data-act="new">重新开始</button>`:`<button class="btn primary" data-act="new">开始冒险</button>`}</div>
  ${b?`<p class="muted" style="margin-top:22px;font-size:14px">最佳纪录：第 ${b.loop+1} 轮第 ${Math.min(b.floor+1,13)} 层</p>`:''}
  <p class="muted" style="font-size:13px;max-width:420px;margin:18px auto 0">玩法：点卡牌出牌，点敌人切换目标。敌人头顶的图标会告诉你它下一步要做什么。</p></div></div>`;
}
function vMap(){
  return `<div class="wrap"><h2 class="disp" style="text-align:center;font-size:28px;margin:4px 0">选择下一站</h2>
  <p class="muted" style="text-align:center;margin:0 0 6px;font-size:14px">塔顶的首领在等着你。往上走，每层只能选一个。</p>
  <div class="mapgrid">${S.map.map((row,f)=>{
    const cls=f<S.floor?'done':f===S.floor?'now':'';
    return `<div class="floor ${cls}"><span class="fl">${f+1}F</span><div class="nodes">${row.map((t,i)=>{
      const tag=f===S.floor?`button data-act="go" data-arg="${i}"`:'div';
      return `<${tag} class="node ${f<S.floor&&S.path[f]===i?'took':''}"><span class="ni">${NODE[t][0]}</span>${NODE[t][1]}</${tag.split(' ')[0]}>`}).join('')}</div></div>`}).join('')}
  </div></div>`;
}
function intentHtml(e){
  const m=e.next,p=[],tip=[];
  if(m.a){p.push(`⚔️ <b>${eDmg(e,m.a)}</b>${m.n>1?'×'+m.n:''}`);tip.push('攻击')}
  if(m.b){p.push('🛡️');tip.push('防御')}
  if(m.s){p.push('💪');tip.push('增强力量')}
  if(m.w||m.vu){p.push('🌀');tip.push('施加负面状态')}
  if(m.po){p.push('☠️');tip.push('施加中毒')}
  return `<div class="intent" title="下回合：${tip.join('、')}">${p.join(' ')}</div>`;
}
function chips(o){
  const a=[];if(o.str)a.push(`💪${o.str}`);if(o.weak)a.push(`虚弱 ${o.weak}`);if(o.vuln)a.push(`易伤 ${o.vuln}`);if(o.poison)a.push(`☠️${o.poison}`);
  if(o.metal)a.push(`金属化 ${o.metal}`);if(o.demon)a.push(`恶魔 ${o.demon}`);if(o.fumes)a.push(`毒气 ${o.fumes}`);if(o.barricade)a.push('壁垒');if(o.inspire)a.push(`灵感 ${o.inspire}`);
  return `<div class="chips">${a.map(x=>`<span class="chip">${x}</span>`).join('')}</div>`;
}
function vCombat(){
  if(!C)return '';
  const tgt=curTarget();
  const foes=C.enemies.filter(e=>e.hp>0).map(e=>{const d=EN[e.k];return `<button class="enemy ${d.elite?'elite':''} ${d.boss?'boss':''} ${tgt&&tgt.uid===e.uid&&alive().length>1?'tgt':''} ${hitCls('e'+e.uid)}" data-act="target" data-arg="${e.uid}" aria-label="${e.name}，生命 ${e.hp}">
    ${intentHtml(e)}<div class="token">${d.e}</div><div class="ename disp">${e.name}</div>
    <div class="hpbar ${e.block?'shield':''}"><i style="width:${e.hp/e.max*100}%"></i><span>${e.hp}/${e.max}</span>${e.block?`<em class="bk">🛡${e.block}</em>`:''}</div>
    ${chips(e)}${fxHtml('e'+e.uid)}</button>`}).join('');
  const maxE=3+(has('core')?1:0);
  return `<main class="arena"><div class="foes">${foes}</div>
  <div class="me">
   <div class="hero ${hitCls('p')}"><div class="token">🧝</div><div class="info">
    <div class="hpbar ${C.p.block?'shield':''}"><i style="width:${S.hp/S.maxHp*100}%"></i><span>${S.hp}/${S.maxHp}</span>${C.p.block?`<em class="bk">🛡${C.p.block}</em>`:''}</div>
    ${chips(C.p)}</div>${fxHtml('p')}</div>
   <div class="orb ${C.energy?'':'empty'}"><div><b>${C.energy}</b><small>/${maxE}</small></div></div>
   <div class="piles"><span>抽牌 ${C.draw.length}</span><span>弃牌 ${C.discard.length}</span>${C.exhaust.length?`<span>消耗 ${C.exhaust.length}</span>`:''}</div>
   <button class="endturn" data-act="end" ${C.busy?'disabled':''}>${C.busy?'敌人行动中…':'结束回合'}</button>
  </div>
  <div class="hand">${C.hand.map(c=>cardHtml(c,{act:'play',cls:costOf(c)>C.energy||C.busy?'nope':''})).join('')||'<p style="opacity:.6;align-self:center">手牌已用完</p>'}</div></main>`;
}
function vReward(){
  const r=S.reward,boss=!!r.boss;
  return `<div class="wrap"><section class="panel"><h2 class="disp">${boss?'首领倒下了！':'战斗胜利'}</h2>
  <button class="reward" data-act="rgold" ${r.goldTaken?'disabled':''}><span class="ri">💰</span>${r.goldTaken?'已拿取':''} ${r.gold} 金币</button>
  ${r.relic?`<button class="reward" data-act="rrelic" ${r.relicTaken?'disabled':''}><span class="ri">${RELICS[r.relic].e}</span><span><b>${RELICS[r.relic].n}</b><br><span class="muted" style="font-size:13px">${RELICS[r.relic].d}</span></span></button>`:''}
  ${boss?`<h3 class="disp" style="font-size:20px;margin:16px 0 4px">选一件首领遗物</h3>${r.bossTaken?'<p class="muted">已选择。</p>':r.boss.map(k=>`<button class="reward" data-act="rboss" data-arg="${k}"><span class="ri">${RELICS[k].e}</span><span><b>${RELICS[k].n}</b><br><span class="muted" style="font-size:13px">${RELICS[k].d}</span></span></button>`).join('')}`:''}
  <h3 class="disp" style="font-size:20px;margin:16px 0 0">选一张牌加入牌组</h3>
  ${r.cardTaken?'<p class="muted">已选择。</p>':`<div class="cardrow">${r.cards.map(id=>cardHtml({id,up:false},{act:'rcard',arg:id})).join('')}</div>`}
  <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px">
  <button class="btn primary" data-act="${boss?'nextloop':'next'}">${boss?`登上第 ${S.loop+2} 轮的塔`:r.cardTaken?'继续前进':'跳过，继续前进'}</button></div>
  ${boss?'<p class="muted" style="font-size:13px;text-align:right;margin:8px 0 0">下一轮敌人会更强，但你的牌组和遗物都会保留，生命也会回满。</p>':''}
  </section></div>`;
}
function vShop(){
  const s=S.shop;
  return `<div class="wrap"><section class="panel"><h2 class="disp">🛒 地下商店</h2><p class="muted" style="margin:0">「随便看看，金币说话。」</p>
  <div class="cardrow">${s.cards.map((x,i)=>`<div class="shopitem ${x.sold?'sold':''}">${cardHtml({id:x.id,up:false},{act:x.sold?'':'buy',arg:i,dis:x.sold})}<span class="price">${x.sold?'已售出':'💰 '+x.price}</span></div>`).join('')}</div>
  ${s.relic?`<button class="reward" data-act="buyrelic" ${s.relic.sold||S.gold<s.relic.price?'disabled':''}><span class="ri">${RELICS[s.relic.k].e}</span><span style="flex:1"><b>${RELICS[s.relic.k].n}</b><br><span class="muted" style="font-size:13px">${RELICS[s.relic.k].d}</span></span><span class="price">${s.relic.sold?'已售出':'💰 '+s.relic.price}</span></button>`:''}
  <button class="reward" data-act="shopremove" ${s.removed||S.gold<S.removeCost?'disabled':''}><span class="ri">🗑️</span><span style="flex:1"><b>删牌服务</b><br><span class="muted" style="font-size:13px">从牌组里永久移除一张牌，让好牌更容易抽到</span></span><span class="price">${s.removed?'已使用':'💰 '+S.removeCost}</span></button>
  <div style="text-align:right;margin-top:12px"><button class="btn primary" data-act="next">离开商店</button></div></section></div>`;
}
function vRest(){
  const r=S.rest,h=Math.round(S.maxHp*.3);
  return `<div class="wrap"><section class="panel"><h2 class="disp">🔥 篝火</h2><p class="muted" style="margin:0 0 10px">火光让人安心。你只有时间做一件事。</p>
  ${r.done?`<p>${r.msg}</p><div style="text-align:right"><button class="btn primary" data-act="next">继续前进</button></div>`:
  `<button class="reward" data-act="rheal"><span class="ri">💤</span><span><b>休息</b><br><span class="muted" style="font-size:13px">回复 ${h} 点生命（现在 ${S.hp}/${S.maxHp}）</span></span></button>
   <button class="reward" data-act="rup" ${S.deck.some(c=>!c.up)?'':'disabled'}><span class="ri">⚒️</span><span><b>锻造</b><br><span class="muted" style="font-size:13px">升级一张牌，让它变得更强</span></span></button>`}</section></div>`;
}
function vEvent(){
  const ev=EVENTS[S.event.k];
  return `<div class="wrap"><section class="panel"><div style="font-size:56px;line-height:1">${ev.e}</div><h2 class="disp">${ev.n}</h2><p>${ev.t}</p>
  ${S.event.res!=null?`<p><b>${S.event.res}</b></p><div style="text-align:right"><button class="btn primary" data-act="next">继续前进</button></div>`:
  ev.opts().map(([l,o])=>`<button class="btn choice" data-act="ev" data-arg="${o}">${l}</button>`).join('')}</section></div>`;
}
function vDead(){
  return `<div class="wrap"><div class="bigmsg"><div class="ico">🪦</div><h2 class="disp">冒险结束</h2>
  <p>你倒在了第 ${S.loop+1} 轮的第 ${S.floor+1} 层。</p>
  <p class="muted" style="font-size:14px">牌组 ${S.deck.length} 张，遗物 ${S.relics.length} 件。</p>
  <div style="display:flex;gap:10px;justify-content:center;margin-top:16px"><button class="btn primary" data-act="new">再来一次</button><button class="btn" data-act="home">回到标题</button></div></div>
  <section class="panel"><h3 class="disp" style="margin:0 0 6px;font-size:20px">你最后的牌组</h3><div class="cardrow">${sortDeck(S.deck).map(c=>cardHtml(c,{dis:1})).join('')}</div></section></div>`;
}
const sortDeck=d=>[...d].sort((a,b)=>({pow:0,atk:1,skl:2})[CARDS[a.id].t]-({pow:0,atk:1,skl:2})[CARDS[b.id].t]||a.id.localeCompare(b.id));
function renderOver(){
  const el=document.getElementById('ov'),o=UI.over;
  if(!o||!S){el.innerHTML='';return}
  const title={deck:'你的牌组',upgrade:'选一张牌升级',remove:'选一张牌删除'}[o.mode];
  const list=sortDeck(S.deck).filter(c=>o.mode!=='upgrade'||!c.up);
  const can=o.mode==='deck'||o.from!=='event';
  el.innerHTML=`<div class="over" role="dialog" aria-label="${title}"><div class="box"><div class="head"><h2 class="disp" style="margin:0">${title}</h2>
  ${can?`<button class="btn sm" data-act="close">${o.mode==='deck'?'关闭':'取消'}</button>`:''}</div>
  ${o.mode==='upgrade'?'<p class="muted" style="margin:0;font-size:14px">升级后名字会变绿，数值更高，部分牌费用会降低。</p>':''}
  <div class="cardrow">${list.map(c=>cardHtml(o.mode==='upgrade'?{...c,up:true}:c,{act:o.mode==='deck'?'':'pick',arg:c.uid,dis:o.mode==='deck'})).join('')}</div></div></div>`;
}

