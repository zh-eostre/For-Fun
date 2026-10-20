/* ================= actions ================= */
function canPlace(type,x,y){
  const d=B[type],i=I(x,y);
  if(!inb(x,y))return {ok:false,msg:'超出地图'};
  if(S.rank<d.rank)return {ok:false,msg:`小镇升级为「${RANKS[d.rank].n}」后解锁`};
  if(S.b[i])return {ok:false,msg:'这里已经有建筑了'};
  const t=S.t[i];
  if(type==='bridge'){if(t!=='w')return {ok:false,msg:'桥只能建在水上'};return canPay(d.cost)?{ok:true}:{ok:false,msg:'材料不够：需要 '+rTxt(d.cost)}}
  if(t==='w')return {ok:false,msg:'不能建在水上，可以先建桥'};
  if(t==='t')return {ok:false,msg:type==='plant'?'这里已经有树了':'先用「拆除」把树砍掉'};
  if(t==='r')return {ok:false,msg:'先用「拆除」把岩石凿掉'};
  if(d.unique&&cnt(type))return {ok:false,msg:'只能建一座'};
  if(d.need==='rock'&&!count8(x,y,'r'))return {ok:false,msg:'必须紧挨着岩石'};
  if(d.need==='water'&&!adj4(x,y,'w'))return {ok:false,msg:'必须紧挨着水'};
  if(!canPay(d.cost))return {ok:false,msg:'材料不够：需要 '+rTxt(d.cost)};
  return {ok:true};
}
function place(type,x,y,quiet){
  const v=canPlace(type,x,y);
  if(!v.ok){if(!quiet)toast(v.msg);return false}
  pay(B[type].cost);
  if(type==='plant')S.t[I(x,y)]='t';
  else S.b[I(x,y)]={type,id:S.nid++,lv:1,res:0,...(B[type].stages?{stage:0,prog:0,paid:false,built:false}:{})};
  UI.pending=null;recompute();checkQuests();dirty=true;save();renderUI();
  return true;
}
function clearTile(x,y){
  const i=I(x,y),t=S.t[i];
  if(t==='t'){if(S.res.coins<1){toast('需要 1 金币');return}S.res.coins-=1;S.t[i]='g';gain({wood:3})}
  else if(t==='r'){if(S.res.coins<2){toast('需要 2 金币');return}S.res.coins-=2;S.t[i]='g';gain({stone:2})}
  else return;
  dirty=true;save();renderUI();
}
function demolish(i){
  const b=S.b[i];if(!b||b.type==='hall')return;
  const ref={};for(const [k,v] of Object.entries(B[b.type].cost))ref[k]=Math.floor(v/2);
  if(isUp(b))for(const [k,v] of Object.entries(B[b.type].up.cost))ref[k]=(ref[k]||0)+Math.floor(v/2);
  delete S.b[i];gain(ref);
  if(UI.sel===i)UI.sel=null;
  UI.confirmDel=null;recompute();dirty=true;save();renderUI();toast(`拆除了${B[b.type].n}`);
}
function applyTool(t,dragging,touch){
  const [x,y]=XY(t),tool=UI.tool;
  if(tool==='select'){UI.sel=t;UI.confirmDel=null;renderUI();return}
  if(tool==='demolish'){
    const b=S.b[t];
    if(b){if(dragging)return;if(b.type==='hall'){toast('市政厅不能拆');return}
      if(UI.confirmDel===t){demolish(t)}else{UI.confirmDel=t;toast(`再点一次确认拆除${B[b.type].n}`)}return}
    clearTile(x,y);return;
  }
  const multi=tool==='road'||tool==='plant'||tool==='bridge';
  if(dragging&&!multi)return;
  if(touch&&!multi&&UI.pending!==t){UI.pending=t;renderInfo();return}
  place(tool,x,y,dragging);
}
// buying skips the "住满" condition, the others still have to hold or the house would just slide back
function upgradeHouse(i){
  const b=S.b[i];if(!b||b.type!=='house'||b.lv>=4)return;
  const c=HUP[b.lv-1];
  if(!houseReq(b).slice(0,-1).every(r=>r[1])){toast('还有升级条件没满足');return}
  if(!canPay(c)){toast('材料不够：需要 '+rTxt(c));return}
  pay(c);b.lv++;b.up=0;b.down=0;log(`花钱把一栋民居升级成了${HN[b.lv-1]}。`,'good');
  recompute();checkQuests();dirty=true;save();renderUI();
}
function upgradeBld(i){
  const b=S.b[i];if(!b)return;
  if(b.type==='house')return upgradeHouse(i);
  const u=B[b.type].up;if(!u||isUp(b))return;
  if(S.rank<UP_RANK){toast(`小镇升级为「${RANKS[UP_RANK].n}」后才能升级建筑`);return}
  if(!canPay(u.cost)){toast('材料不够：需要 '+rTxt(u.cost));return}
  pay(u.cost);b.lv=2;log(`${B[b.type].n}升级了：${u.d}。`,'good');
  recompute();dirty=true;save();renderUI();
}
function fundStage(i){
  const b=S.b[i];if(!b||!isMega(b)||b.built||b.paid)return;
  const st=B[b.type].stages[b.stage];
  if(!canPay(st.cost)){toast('材料不够：需要 '+rTxt(st.cost));return}
  pay(st.cost);b.paid=true;log(`${B[b.type].n}第 ${b.stage+1} 期开工。`);
  recompute();save();renderUI();
}
function startResearch(k){
  const t=TECHS[k];if(!t||S.tech[k]||S.research)return;
  if(S.rank<t.rank){toast(`小镇升级为「${RANKS[t.rank].n}」后才能研究`);return}
  if(S.res.coins<t.cost){toast(`金币不够：需要 💰${t.cost}`);return}
  S.res.coins-=t.cost;S.research={k,prog:0};log(`研究所开始研究「${t.n}」。`);save();renderUI();
}
function setTool(t){UI.tool=t;UI.pending=null;UI.confirmDel=null;if(t!=='select')UI.sel=null;renderUI()}
