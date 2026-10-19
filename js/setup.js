/* ================= 开局：选地图 ================= */
function newGame(){UI.screen='setup';UI.confirmNew=false;rollSetup()}
function rollSetup(){const z=SIZES[SETUP.size];W=z.w;H=z.h;SETUP.cand=newState(SETUP.kind);renderSetup()}
function startGame(){
  S=SETUP.cand;SETUP.cand=null;W=S.W;H=S.H;
  log(`你带着几个伙伴来到这片${KINDS[S.kind].n}。先建民居和农场，再用道路把它们连到市政厅。`);
  UI={...UI,tool:'select',sel:null,pending:null,speed:1,confirmNew:false};walkers=[];acc=0;
  recompute();dirty=true;save();mount();
}
function renderSetup(){
  const c=SETUP.cand,app=document.getElementById('app');
  let tr=0,rk=0,wt=0;for(const v of c.t){if(v==='t')tr++;else if(v==='r')rk++;else if(v==='w')wt++}
  app.innerHTML=`<div class="setup"><h1 class="hd">选择地图</h1>
  <div class="opts"><div><p class="lbl">大小</p><div class="seg">${SIZES.map((z,i)=>`<button data-act="ssize" data-arg="${i}" aria-pressed="${SETUP.size===i}">${z.n}　<span class="px">${z.w}×${z.h}</span></button>`).join('')}</div></div>
  <div><p class="lbl">地形</p><div class="kinds">${Object.entries(KINDS).map(([k,v])=>`<button class="kind ${SETUP.kind===k?'on':''}" data-act="skind" data-arg="${k}" aria-pressed="${SETUP.kind===k}"><b>${v.e} ${v.n}</b><span>${v.d}</span></button>`).join('')}</div></div></div>
  <div class="pvwrap box"><canvas id="pv" width="${W*T}" height="${H*T}" aria-label="地图预览"></canvas></div>
  <p class="muted stats">🌳 ${tr} 棵树　🪨 ${rk} 块岩石　💧 ${wt} 格水面　·　可用空地约 ${W*H-tr-rk-wt} 格</p>
  <div class="row"><button class="btn" data-act="reroll">🎲 换一张</button><button class="btn primary" data-act="startgame">就这张，开始建造</button>${S?'<button class="btn" data-act="back">返回现在的小镇</button>':''}</div>
  ${SETUP.size>0?'<p class="muted" style="text-align:center;font-size:13px">大地图可以在地图框里滚动，手机上用手指拖动。</p>':''}</div>`;
  const pv=document.getElementById('pv'),g=pv.getContext('2d'),prev=S;
  S=c;drawStatic(g);S=prev;
}
