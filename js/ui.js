/* ================= UI ================= */
function mount(){
  UI.screen='game';
  const app=document.getElementById('app');
  app.innerHTML=`<header class="top" id="top"></header>
  <main class="layout"><section>
    <div class="mapframe" id="frame"><canvas id="cv" width="${W*T}" height="${H*T}" aria-label="小镇地图"></canvas></div>
    <nav class="build" id="build" aria-label="建造"></nav>
    <p class="hint" id="hint"></p>
  </section><aside class="side" id="side"></aside></main>`;
  cv=document.getElementById('cv');ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;
  off=document.createElement('canvas');off.width=W*T;off.height=H*T;octx=off.getContext('2d');
  bindCanvas();fitCanvas();dirty=true;renderUI();
  const fr=document.getElementById('frame'),[hx,hy]=XY(S.hall);
  fr.scrollLeft=hx*T*UI.scale-fr.clientWidth/2;fr.scrollTop=hy*T*UI.scale-fr.clientHeight/2;
}
function fitCanvas(){
  const fr=document.getElementById('frame');if(!fr||!cv)return;
  const avail=fr.parentElement.clientWidth;
  UI.scale=clamp(Math.floor(avail/(W*T)),2,4);
  cv.style.width=W*T*UI.scale+'px';cv.style.height=H*T*UI.scale+'px';
}
function tileAt(e){const r=cv.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)/r.width*W),y=Math.floor((e.clientY-r.top)/r.height*H);return inb(x,y)?I(x,y):null}
function bindCanvas(){
  cv.addEventListener('pointermove',e=>{const t=tileAt(e);if(e.pointerType==='mouse'&&t!==UI.hover){UI.hover=t;if(UI.tool!=='select')renderInfo()}if(UI.drag&&e.pointerType==='mouse'&&t!=null)applyTool(t,true)});
  cv.addEventListener('pointerleave',()=>{UI.hover=null;if(UI.tool!=='select')renderInfo()});
  cv.addEventListener('pointerdown',e=>{UI.ptype=e.pointerType;if(e.pointerType!=='mouse'||e.button!==0)return;const t=tileAt(e);if(t==null)return;UI.drag=true;applyTool(t,false)});
  cv.addEventListener('click',e=>{if(UI.ptype==='mouse')return;const t=tileAt(e);if(t!=null)applyTool(t,false,true)});
  cv.addEventListener('contextmenu',e=>{e.preventDefault();setTool('select')});
}
window.addEventListener('pointerup',()=>UI.drag=false);
window.addEventListener('resize',()=>fitCanvas());

function renderUI(){if(!S||!cv)return;renderTop();renderBuild();renderSide()}
function renderTop(){
  const c=storeCap(),pop=popTotal(),cp=popCap(),s=season();
  const chip=(k,v,extra,warn)=>`<div class="rc ${warn?'warn':''}" title="${RN[k]||''}"><span class="ic">${RI[k]}</span><b>${Math.floor(v)}</b>${extra||''}<i class="${S.delta[k]>=0?'up':'dn'}">${S.delta[k]>=0?'+':''}${fmt(S.delta[k])}</i></div>`;
  document.getElementById('top').innerHTML=`<span class="brand hd">晴川小镇</span>
  <div class="clock"><span class="season">${SICON[s]} 第${yearN()}年 ${SN[s]} ${dayIn()}日</span><span class="dbar"><i id="dbar"></i></span></div>
  <div class="speeds" role="group" aria-label="速度">${[[0,'Ⅱ'],[1,'▶'],[2,'▶▶'],[4,'▶▶▶']].map(([v,l])=>`<button data-act="speed" data-arg="${v}" aria-pressed="${UI.speed===v}" title="${v?v+' 倍速':'暂停（空格）'}" style="${v===4?'width:44px':''}">${l}</button>`).join('')}</div>
  <div class="res">
   ${chip('coins',S.res.coins)}
   ${chip('wood',S.res.wood,`<small>/${c}</small>`,s===3&&S.short.heat)}
   ${chip('stone',S.res.stone,`<small>/${c}</small>`)}
   ${chip('food',S.res.food,`<small>/${c}</small>`,S.short.food)}
   <div class="rc" title="人口 / 住房上限（空闲劳动力）"><span class="ic">👥</span><b>${pop}</b><small>/${cp}</small><small>　闲 ${S.idle||0}</small></div>
   <div class="rc ${S.happy<35?'warn':''}" title="幸福度"><span class="ic">${S.happy>=70?'😄':S.happy>=45?'🙂':S.happy>=30?'😐':'😠'}</span><b>${Math.round(S.happy)}</b></div>
  </div>`;
}
let buildSig='';
function renderBuild(){
  const sig=UI.tool+'|'+S.rank+'|'+ORDER.map(k=>canPay(B[k].cost)?1:0).join('')+'|'+JSON.stringify(S.res,(k,v)=>typeof v==='number'?Math.floor(v):v);
  if(sig===buildSig)return;buildSig=sig;
  let last=-1,h=`<button class="tool ${UI.tool==='select'?'on':''}" data-act="tool" data-arg="select" title="查看格子（Esc）"><span class="emo">👆</span><span class="tn">查看</span><span class="tc">点格子看详情</span></button>
  <button class="tool ${UI.tool==='demolish'?'on':''}" data-act="tool" data-arg="demolish"><span class="emo">⛏️</span><span class="tn">拆除</span><span class="tc">砍树 凿石 拆建筑</span></button>`;
  for(const k of ORDER){
    const d=B[k],locked=S.rank<d.rank;
    if(d.cat!==last){h+='<span class="sep"></span>';last=d.cat}
    const cost=Object.entries(d.cost).map(([r,v])=>`<span class="${S.res[r]<v?'short':''}">${RI[r]}${v}</span>`).join(' ');
    h+=`<button class="tool ${UI.tool===k?'on':''} ${locked?'locked':''}" data-act="tool" data-arg="${k}" ${locked?'aria-disabled="true"':''} title="${d.n}：${d.desc}">
      <img src="${ICON[k]}" alt=""><span class="tn">${d.n}</span><span class="tc">${locked?`「${RANKS[d.rank].n}」解锁`:cost}</span></button>`;
  }
  document.getElementById('build').innerHTML=h;
  document.getElementById('hint').textContent=UI.tool==='select'?'选一个建筑，然后在地图上点击放置。':'已选「'+(UI.tool==='demolish'?'拆除':B[UI.tool].n)+'」：可以连续放置。再点一次按钮、按 Esc 或右键结束。';
}
function renderSide(){
  const s=season(),pop=popTotal();
  const r=S.rank,nx=RANKS[r+1];
  const qs=QUESTS.filter((q,i)=>i>=S.q&&!q.bg).slice(0,3),bgq=QUESTS.filter((q,i)=>q.bg&&!bgDone().includes(i));
  const hp=happyParts(S.short.food>0,S.short.heat>0);
  let winter='';
  if(s===2||(s===1&&dayIn()>=SEASON_DAYS-2)||s===3){
    const daysLeft=s===3?SEASON_DAYS-dayIn()+1:SEASON_DAYS;
    const needF=Math.ceil(pop*.25*daysLeft),needW=Math.ceil(houses().reduce((a,b)=>a+(b.res?HHEAT[b.lv-1]:0),0)*daysLeft);
    winter=`<section class="box winter"><h3 class="hd">${s===3?'❄️ 冬天还剩 '+daysLeft+' 天':'❄️ 过冬准备'}</h3>
    <p>${s===3?'剩下的冬天':'整个冬天'}大约需要：</p>
    <dl class="kv"><dt>🌾 粮食</dt><dd class="${S.res.food>=needF?'ok':'bad'}">${needF}（现有 ${Math.floor(S.res.food)}${s===3?'，渔屋还在产':''}）</dd>
    <dt>🪵 取暖木材</dt><dd class="${S.res.wood>=needW?'ok':'bad'}">${needW}（现有 ${Math.floor(S.res.wood)}）</dd></dl>
    ${needF>storeCap()?'<p class="bad">需要的粮食超过了仓储上限，建一座仓库吧。</p>':''}</section>`;
  }
  const mk=hasMarket();
  const trade=mk?`<section class="box"><h3 class="hd">⚖️ 市集交易</h3><p class="muted">有市场在运作，就能在这里买卖材料。</p>
   <div class="trade">${TRADE.map((t,i)=>`<button class="btn sm" data-act="trade" data-arg="${i}" ${canPay(t.g)?'':'disabled'}>${rTxt(t.g)} → ${rTxt(t.r)}</button>`).join('')}</div></section>`:'';
  const lg=S.log.slice(0,8).map(l=>`<li class="${l.c}"><span class="d">${l.d}</span>${l.t}</li>`).join('');
  document.getElementById('side').innerHTML=`
  <section class="box" id="info">${vInfo()}</section>
  ${winter}${trade}
  <section class="box"><h3 class="hd">🏘️ ${RANKS[r].n}</h3>
   ${nx?`<div class="prog"><i style="width:${Math.min(100,pop/nx.pop*100)}%"></i></div>
   <p class="muted">人口 ${pop}/${nx.pop} 升级为「${nx.n}」，解锁：${ORDER.filter(k=>B[k].rank===r+1).map(k=>B[k].n).join('、')||'荣誉'}</p>`:'<p class="ok">已经是最高等级了！</p>'}
  </section>
  <section class="box"><h3 class="hd">📜 任务</h3>
   ${qs.length?qs.map((q,i)=>`<div class="quest ${i?'next':'cur'}"><span>${i?'':'▸ '}<b>${q.t}</b>${q.p&&!i?` <span class="muted">${q.p()}</span>`:''}</span><span class="rw">${rTxt(q.r)}</span></div>`).join(''):''}${bgq.map(q=>`<div class="quest cur"><span>⏳ <b>${q.t}</b> <span class="muted">${q.p()}</span></span><span class="rw">${rTxt(q.r)}</span></div>`).join('')}${qs.length||bgq.length?'':'<p class="ok">所有任务都完成了！</p>'}
  </section>
  <section class="box"><h3 class="hd">😊 幸福度 ${Math.round(S.happy)} <span class="muted" style="font-size:13px">→ ${Math.round(hp.t)}</span></h3>
   <ul class="parts">${hp.parts.map(([l,v])=>`<li><span>${l}</span><span class="${v>0&&l!=='基础'?'ok':v<0?'bad':''}">${l==='基础'?'':v>0?'+':''}${v}</span></li>`).join('')}</ul>
   <p style="margin-top:10px">税率（每天税收 💰${fmt(taxIncome())}）</p>
   <div class="seg">${['低','中','高'].map((l,i)=>`<button data-act="tax" data-arg="${i}" aria-pressed="${S.tax===i}">${l}</button>`).join('')}</div>
  </section>
  <section class="box"><h3 class="hd">📰 小镇动态</h3><ul class="log">${lg}</ul></section>
  <div style="text-align:right"><button class="btn sm danger" data-act="newgame">${UI.confirmNew?'确定？会清掉现在的小镇':'重新开始'}</button></div>`;
}
function renderInfo(){const el=document.getElementById('info');if(el)el.innerHTML=vInfo()}
function preview(type,x,y){
  if(type==='lumber'){const n=countR(x,y,2,'t');return `，附近 ${n} 棵树，满员每天 ${fmt(Math.min(3.5,.5*n))} 木材`}
  if(type==='fish'){const n=countR(x,y,2,'w');return `，附近 ${n} 格水面，满员每天 ${fmt(Math.min(3,.5*n))} 粮食`}
  if(type==='quarry'){const n=count8(x,y,'r');return `，周围 ${n} 块岩石，满员每天 ${fmt(Math.min(3,n))} 石头`}
  if(type==='farm')return adj4(x,y,'w')?'，紧挨着水，产量 +1':'，没挨着水（挨着水产量 +1）';
  if(B[type].r){let n=0;for(const [i,b] of ent()){if(b.type!=='house')continue;const [hx,hy]=XY(i);if((hx-x)**2+(hy-y)**2<=B[type].r**2)n++}return `，能覆盖 ${n} 栋民居`}
  return '';
}
function vInfo(){
  if(UI.tool==='demolish')return `<h3 class="hd">⛏️ 拆除</h3><p>点树木砍伐：花 💰1，得 🪵3。<br>点岩石开采：花 💰2，得 🪨2。<br>点建筑要再点一次确认，退还一半材料。</p>`;
  if(UI.tool!=='select'){
    const d=B[UI.tool],t=UI.pending??UI.hover;
    let h=`<h3 class="hd"><img src="${ICON[UI.tool]}" alt="" style="width:24px;height:24px;image-rendering:pixelated;vertical-align:-5px"> ${d.n}</h3><p class="muted">${d.desc}</p>
    <p>花费 ${rTxt(d.cost)}${d.workers?`，需要 ${d.workers} 个工人`:''}${d.upkeep?`，每天维护 💰${d.upkeep}`:''}</p>`;
    if(t!=null){const [x,y]=XY(t),v=canPlace(UI.tool,x,y);
      h+=v.ok?`<p class="ok">✓ 可以建在这里${preview(UI.tool,x,y)}</p>`:`<p class="bad">✗ ${v.msg}</p>`;
      if(UI.pending!=null&&v.ok)h+=`<button class="btn primary" data-act="confirm">在这里建造</button>`;
    }else h+=`<p class="muted">${UI.ptype==='mouse'?'把鼠标移到地图上预览位置，点击建造。':'点地图选位置，再点一次（或按按钮）确认。'}</p>`;
    return h;
  }
  if(UI.sel==null)return `<h3 class="hd">欢迎来到晴川小镇</h3><p>点地图上的格子查看详情。建筑头上的红色「!」表示还没用道路连到市政厅，黄色「!」表示缺工人。</p>`;
  const i=UI.sel,[x,y]=XY(i),b=S.b[i],t=S.t[i];
  if(!b){
    if(t==='t')return `<h3 class="hd">🌳 树木</h3><p>伐木场附近的树越多，木材产量越高。</p><button class="btn" data-act="clear">砍掉（💰1 → 🪵3）</button>`;
    if(t==='r')return `<h3 class="hd">🪨 岩石</h3><p>采石场必须建在岩石旁边。</p><button class="btn" data-act="clear">凿掉（💰2 → 🪨2）</button>`;
    if(t==='w')return `<h3 class="hd">💧 水面</h3><p>紧挨着水的农场产量更高，渔屋只能建在水边。冬天会结冰。想过河就建一座桥。</p>`;
    return `<h3 class="hd">空地</h3><p class="muted">可以在这里建造。</p>`;
  }
  const d=B[b.type],o=prodOf(b,i);
  const out=Object.entries(o).filter(([k,v])=>Math.abs(v)>.01).map(([k,v])=>`${RI[k]}${v>0?'+':''}${fmt(v)}`).join(' ');
  let h='';
  if(b.type==='house'){
    const req=houseReq(b),c=b.cov||{};
    h=`<h3 class="hd"><img src="${b.lv===1?ICON.house:ICON['house'+b.lv]}" alt="" style="width:24px;height:24px;image-rendering:pixelated;vertical-align:-5px"> ${HN[b.lv-1]}（${b.lv} 级）</h3>
    <dl class="kv"><dt>居民</dt><dd>${b.res}/${HCAP[b.lv-1]}</dd><dt>每人交税</dt><dd>💰${HTAX[b.lv-1]}/天</dd>
    <dt>覆盖服务</dt><dd>${['water','park','school','temple'].filter(k=>c[k]).map(k=>({water:'水井',park:'公园',school:'学校',temple:'神庙'})[k]).join('、')||'无'}</dd></dl>`;
    if(!b.conn)h+='<p class="bad">没有连到道路，居民不会搬进来，住着的也会离开。</p>';
    if(req)h+=`<p><b>升级成${HN[b.lv]}还需要：</b></p><ul class="reqs">${req.map(([l,ok])=>`<li class="${ok?'y':''}">${l}</li>`).join('')}</ul>${req.every(r=>r[1])?'<p class="ok">条件都满足了，很快就会升级。</p>':''}`;
    if(req){const c=HUP[b.lv-1],ok=req.slice(0,-1).every(r=>r[1]);h+=`<p class="muted">也可以花钱立刻升级，不用等住满，但其他条件要先满足。</p><button class="btn sm" data-act="upgrade" ${ok&&canPay(c)?'':'disabled'}>花 ${rTxt(c)} 升级成${HN[b.lv]}</button> `}
    else h+='<p class="ok">已经是最高级的宅院了。</p>';
    if(b.lv>1&&!houseKeep(b))h+=`<p class="bad">现在缺少维持${HN[b.lv-1]}的服务，再这样几天会退化。</p>`;
  }else{
    h=`<h3 class="hd"><img src="${ICON[b.type]}" alt="" style="width:24px;height:24px;image-rendering:pixelated;vertical-align:-5px"> ${d.n}</h3><p class="muted">${d.desc}</p><dl class="kv">`;
    if(d.workers)h+=`<dt>工人</dt><dd>${b.workers||0}/${d.workers}${b.paused?'（已停工）':''}</dd>`;
    if(out)h+=`<dt>每天</dt><dd>${out}</dd>`;
    if(d.svc){let n=0;for(const [j,hb] of ent()){if(hb.type==='house'&&hb.cov&&hb.cov[d.svc])n++}h+=`<dt>覆盖</dt><dd>${n} 栋民居</dd>`}
    if(b.type==='farm'&&season()===3)h+='<dt>状态</dt><dd>冬天停产</dd>';
    h+='</dl>';
    if(!b.conn&&b.type!=='hall')h+='<p class="bad">没有连到道路，无法运作。</p>';
    else if(d.workers&&!b.paused&&b.eff<1)h+=`<p class="bad">缺工人。多建民居增加人口，或者让别的建筑停工把人让出来。</p>`;
    if(d.workers)h+=`<button class="btn sm" data-act="pause">${b.paused?'恢复生产':'停工（让出工人）'}</button> `;
  }
  if(b.type!=='hall')h+=`<button class="btn sm danger" data-act="del">${UI.confirmDel===i?'再点一次确认拆除':'拆除'}</button>`;
  return h;
}
function vTitle(){
  const sv=load();
  return `<div class="title"><div>
   <div class="strip">${['house','house2','house3','farm','market','well','temple','tower'].map(k=>`<img src="${ICON[k]}" alt="">`).join('')}</div>
   <h1 class="hd">晴川小镇</h1>
   <p>在一片河谷里，从一座市政厅开始，建成一座热闹的小城。</p>
   <div class="row">${sv?`<button class="btn primary" data-act="cont">继续经营（${KINDS[sv.kind||'valley'].n}${SIZES.find(z=>z.w===(sv.W||24))?.n||''}图，第 ${Math.floor(sv.day/(SEASON_DAYS*4))+1} 年，${(()=>{let n=0;for(const b of Object.values(sv.b))if(b.type==='house')n+=b.res;return n})()} 位居民）</button><button class="btn" data-act="newgame2">建一座新小镇</button>`:`<button class="btn primary" data-act="newgame2">开始建造</button>`}</div>
   <div class="box how"><b>怎么玩</b><ul>
    <li>民居和需要工人的建筑，要用道路连到市政厅才会运作。水井、公园、仓库不用连路。</li>
    <li>居民住进民居后会去农场、伐木场上班。人手不够，产量就会下降。</li>
    <li>民居附近有水井、镇上有市场，就会升级成砖房，再加上学校和公园就能升级成宅院，住更多人、交更多税。</li>
    <li>冬天农场停产，民居还要烧木材取暖，秋天记得囤货。</li>
   </ul></div></div></div>`;
}
function openModal(m){MODAL=m;renderModal()}
function renderModal(){
  const el=document.getElementById('modal');
  if(!MODAL){el.innerHTML='';return}
  el.innerHTML=`<div class="over" role="dialog" aria-modal="true"><div class="box modal"><div class="ico">${MODAL.icon}</div><h2 class="hd">${MODAL.title}</h2><p>${MODAL.text}</p>
  ${MODAL.icons&&MODAL.icons.length?`<div class="icons">${MODAL.icons.map(k=>`<span title="${B[k].n}"><img src="${ICON[k]}" alt="${B[k].n}"></span>`).join('')}</div><p class="muted">${MODAL.icons.map(k=>B[k].n).join('、')}</p>`:''}
  <div class="choices">${MODAL.choices.map((c,i)=>`<button class="btn ${c.primary?'primary':''}" data-act="choice" data-arg="${i}" ${c.dis?'disabled':''}>${c.label}${c.dis?'（不够）':''}</button>`).join('')}</div></div></div>`;
  const b=el.querySelector('.btn:not(:disabled)');if(b)b.focus();
}
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>el.hidden=true,2400)}
