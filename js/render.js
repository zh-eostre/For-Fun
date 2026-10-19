/* ================= canvas ================= */
let cv,ctx,off,octx;
function drawStatic(g=octx){
  const p=PAL[season()];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const i=I(x,y),t=S.t[i],b=S.b[i];
    if(t==='w')sWater(g,x,y,p);else sGround(g,x,y,p);
    if(b&&b.type==='road')sRoad(g,x,y,p);
    if(b&&b.type==='bridge')sBridge(g,x,y,p);
  }
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const i=I(x,y),t=S.t[i],b=S.b[i],ox=x*T,oy=y*T;
    if(b&&!isRoad(b))drawBld(g,b.type,ox,oy,p,b);
    else if(t==='t')sTree(g,ox,oy,p,hash(x,y,5));
    else if(t==='r')sRock(g,ox,oy,p);
  }
}
const SHIRTS=['#D24B3C','#3F6FA8','#E2B93B','#7CC24E','#8E5AB5','#E07A3A','#2F8A86','#F2EEE6'];
const HAIRS=['#2E2219','#5B3A1E','#8C5A3C','#1A1A1A','#C9A15A'];
function updateWalkers(dt){
  const roads=[...connSet];
  const target=Math.min(60,Math.floor(popTotal()/3),roads.length*2);
  while(walkers.length<target&&roads.length){const [x,y]=XY(pick(roads));walkers.push({x,y,tx:x,ty:y,px:-1,py:-1,c:pick(SHIRTS),h:pick(HAIRS),ox:R(-3,3),oy:R(-3,2),sp:.0011+Math.random()*.0006,ph:Math.random()*1000})}
  if(walkers.length>target)walkers.length=target;
  for(const w of walkers){
    if(!connSet.has(I(Math.round(w.tx),Math.round(w.ty)))&&roads.length){const [x,y]=XY(pick(roads));Object.assign(w,{x,y,tx:x,ty:y})}
    const dx=w.tx-w.x,dy=w.ty-w.y,d=Math.hypot(dx,dy),st=w.sp*dt;
    if(d<=st){w.x=w.tx;w.y=w.ty;
      const nb=N4.map(([a,b])=>[w.tx+a,w.ty+b]).filter(([x,y])=>inb(x,y)&&connSet.has(I(x,y)));
      let ch=nb.filter(([x,y])=>!(x===w.px&&y===w.py));if(!ch.length)ch=nb;
      if(ch.length){const [nx,ny]=pick(ch);w.px=w.tx;w.py=w.ty;w.tx=nx;w.ty=ny}
    }else{w.x+=dx/d*st;w.y+=dy/d*st}
  }
}
function bubble(ox,oy,col,ch){
  P(ctx,ox+10,oy-1,6,7,'#2E2219');P(ctx,ox+11,oy,4,5,col);
  if(ch==='!'){P(ctx,ox+12,oy,2,3,'#fff');P(ctx,ox+12,oy+4,2,1,'#fff')}
  else{P(ctx,ox+12,oy+1,2,1,'#fff');P(ctx,ox+12,oy+3,2,1,'#fff')}
}
function draw(now){
  if(dirty){drawStatic();dirty=false}
  ctx.drawImage(off,0,0);
  const s=season(),p=PAL[s];
  if(s!==3)for(let i=0;i<W*H;i++){if(S.t[i]!=='w')continue;const [x,y]=XY(i),ph=Math.floor(now/500+hash(x,y,9)%7)%7;if(ph<3){const h=hash(x,y,ph+50);P(ctx,x*T+3+h%8,y*T+4+(h>>>5)%8,2,1,'rgba(255,255,255,.55)')}}
  for(const [i,b] of ent()){
    const [x,y]=XY(i),ox=x*T,oy=y*T;
    let sx=-1,sy=0;
    if(b.type==='workshop'&&b.eff>0){sx=ox+10;sy=oy+1}
    else if(s===3&&b.type==='house'&&b.res>0&&b.lv>1){sx=ox+(b.lv===2?11:12);sy=oy}
    if(sx>=0)for(let k=0;k<3;k++){const t=((now/1100)+k/3+(hash(x,y,3)%10)/10)%1;P(ctx,Math.round(sx+Math.sin(t*6+k)*1.5),Math.round(sy-t*9),2,2,`rgba(225,225,225,${(.7*(1-t)).toFixed(2)})`)}
  }
  for(const w of walkers){
    const x=Math.round(w.x*T+6+w.ox),y=Math.round(w.y*T+5+w.oy),f=Math.floor((now+w.ph)/220)%2;
    P(ctx,x,y,3,1,w.h);P(ctx,x,y+1,3,1,'#F1C9A0');P(ctx,x,y+2,3,2,w.c);P(ctx,x+(f?0:2),y+4,1,1,'#3A2A1E');
  }
  for(const [i,b] of ent()){
    if(isRoad(b)||b.type==='hall')continue;
    const [x,y]=XY(i),ox=x*T,oy=y*T;
    if(!b.conn){if(Math.floor(now/450)%2)bubble(ox,oy,'#D24B3C','!')}
    else if(b.paused)bubble(ox,oy,'#7A7F86','=');
    else if(B[b.type].workers&&b.eff<1)bubble(ox,oy,'#E2A21B','!');
  }
  const t=UI.pending??UI.hover;
  if(UI.tool!=='select'&&UI.tool!=='demolish'&&t!=null){
    const [x,y]=XY(t),d=B[UI.tool],v=canPlace(UI.tool,x,y);
    if(d.r){for(let yy=y-d.r;yy<=y+d.r;yy++)for(let xx=x-d.r;xx<=x+d.r;xx++)if(inb(xx,yy)&&(xx-x)**2+(yy-y)**2<=d.r*d.r)P(ctx,xx*T,yy*T,T,T,'rgba(255,226,120,.22)')}
    if(UI.tool==='lumber')hl(x,y,2,'t');if(UI.tool==='quarry')hlr(x,y);
    ctx.globalAlpha=.75;if(UI.tool==='road')P(ctx,x*T+3,y*T+3,10,10,p.road);else drawBld(ctx,UI.tool,x*T,y*T,p,{lv:1});ctx.globalAlpha=1;
    P(ctx,x*T,y*T,T,T,v.ok?'rgba(80,200,120,.28)':'rgba(220,60,40,.35)');outline(x,y,v.ok?'#7CFF9E':'#FF6B57');
  }else if(UI.tool==='demolish'&&t!=null){const [x,y]=XY(t);P(ctx,x*T,y*T,T,T,UI.confirmDel===t?'rgba(220,60,40,.55)':'rgba(220,60,40,.28)');outline(x,y,'#FF6B57')}
  else if(UI.tool==='select'){
    if(UI.hover!=null&&UI.hover!==UI.sel){const [x,y]=XY(UI.hover);outline(x,y,'rgba(255,255,255,.7)')}
    if(UI.sel!=null){const [x,y]=XY(UI.sel),b=S.b[UI.sel];
      if(b&&B[b.type].r){const r=B[b.type].r;for(let yy=y-r;yy<=y+r;yy++)for(let xx=x-r;xx<=x+r;xx++)if(inb(xx,yy)&&(xx-x)**2+(yy-y)**2<=r*r)P(ctx,xx*T,yy*T,T,T,'rgba(255,226,120,.2)')}
      if(b&&b.type==='lumber')hl(x,y,2,'t');if(b&&b.type==='quarry')hlr(x,y);
      outline(x,y,'#F2C14E')}
  }
}
function outline(x,y,c){ctx.strokeStyle=c;ctx.lineWidth=1;ctx.strokeRect(x*T+.5,y*T+.5,T-1,T-1)}
function hl(x,y,r,v){for(let yy=y-r;yy<=y+r;yy++)for(let xx=x-r;xx<=x+r;xx++)if(inb(xx,yy)&&(xx-x)**2+(yy-y)**2<=r*r&&S.t[I(xx,yy)]===v&&!S.b[I(xx,yy)])outline(xx,yy,'#9BFF7A')}
function hlr(x,y){for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if((dx||dy)&&terr(x+dx,y+dy)==='r')outline(x+dx,y+dy,'#9BFF7A')}
