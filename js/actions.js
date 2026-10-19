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
  else S.b[I(x,y)]={type,id:S.nid++,lv:1,res:0};
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
function setTool(t){UI.tool=t;UI.pending=null;UI.confirmDel=null;if(t!=='select')UI.sel=null;renderUI()}
