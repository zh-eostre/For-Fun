/* ================= 输入与主循环 ================= */
const ACT={
  speed:a=>{UI.speed=+a;renderTop()},
  tool:a=>{if(a!=='select'&&a!=='demolish'&&S.rank<B[a].rank){toast(`小镇升级为「${RANKS[B[a].rank].n}」后解锁`);return}setTool(a)},
  tax:a=>{S.tax=+a;save();renderSide()},
  trade:a=>{const t=TRADE[+a];if(!canPay(t.g))return;pay(t.g);gain(t.r);buildSig='';save();renderUI()},
  confirm:()=>{if(UI.pending!=null){const [x,y]=XY(UI.pending);place(UI.tool,x,y)}},
  clear:()=>{const [x,y]=XY(UI.sel);clearTile(x,y)},
  pause:()=>{const b=S.b[UI.sel];if(!b)return;b.paused=!b.paused;recompute();save();renderUI()},
  del:()=>{if(UI.confirmDel===UI.sel)demolish(UI.sel);else{UI.confirmDel=UI.sel;renderInfo()}},
  newgame:()=>{if(UI.confirmNew){UI.confirmNew=false;newGame()}else{UI.confirmNew=true;renderSide();setTimeout(()=>{if(UI.confirmNew){UI.confirmNew=false;if(S)renderSide()}},3000)}},
  newgame2:()=>newGame(),
  cont:()=>{S=load();W=S.W||24;H=S.H||16;recompute();dirty=true;mount()},
  ssize:a=>{SETUP.size=+a;rollSetup()},
  skind:a=>{SETUP.kind=a;rollSetup()},
  reroll:()=>rollSetup(),
  startgame:()=>startGame(),
  back:()=>{W=S.W||24;H=S.H||16;dirty=true;mount()},
  choice:a=>{const c=MODAL.choices[+a];MODAL=null;renderModal();if(c&&c.fn)c.fn();save();renderUI()}
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b||b.disabled)return;const f=ACT[b.dataset.act];if(f)f(b.dataset.arg)});
document.addEventListener('keydown',e=>{
  if(!S||MODAL||UI.screen!=='game')return;
  if(e.key==='Escape')setTool('select');
  if(e.key===' '&&!['BUTTON','INPUT'].includes(document.activeElement.tagName)){e.preventDefault();UI.speed=UI.speed?0:1;renderTop()}
});

let last=performance.now();
function frame(now){
  const dt=Math.min(100,now-last);last=now;
  if(S&&cv&&UI.screen==='game'){
    if(!MODAL&&UI.speed>0&&!document.hidden){acc+=dt*UI.speed;let n=0;while(acc>=DAY_MS&&n<3){acc-=DAY_MS;dayTick();renderUI();n++}}
    const db=document.getElementById('dbar');if(db)db.style.width=(acc/DAY_MS*100)+'%';
    updateWalkers(MODAL||!UI.speed?0:dt);
    draw(now);
  }
  requestAnimationFrame(frame);
}
makeIcons();
document.getElementById('app').innerHTML=vTitle();
requestAnimationFrame(frame);
