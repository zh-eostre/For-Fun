/* ================= pixel art ================= */
const P=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
const rows=(g,ox,oy,arr,c)=>arr.forEach(([x,w,y])=>P(g,ox+x,oy+y,w,1,c));
const BASEP={w:'#3E86C9',wh:'#7DB9EC',sand:'#D9C68C',road:'#B88A55',road2:'#9E7243',road3:'#CDA273',rock:'#8C9198',rockh:'#B9BEC4',rockd:'#5F646B',ice:0};
const PAL=[
  {...BASEP,g:'#7BC15D',g1:'#69AF4E',g2:'#8ED06F',t:'#3F8F3E',th:'#62B456',td:'#2B6A30',crop:'#93D86F',crop2:'#6FBF52',lawn:'#8ED06F'},
  {...BASEP,g:'#6AB04E',g1:'#5A9E41',g2:'#7EC05F',t:'#2E7E35',th:'#4CA046',td:'#205B27',crop:'#4FA83E',crop2:'#3E8C30',lawn:'#7EC05F'},
  {...BASEP,g:'#B9B25B',g1:'#A69E4A',g2:'#CBC46D',t:'#D3802C',th:'#F0AB48',td:'#A3551D',crop:'#E2B93B',crop2:'#C99A26',lawn:'#C2BD66'},
  {...BASEP,g:'#E8EEF2',g1:'#D2DCE4',g2:'#F7FAFC',t:'#3D6A4C',th:'#FFFFFF',td:'#2A4D36',w:'#B7DBF0',wh:'#E8F5FD',sand:'#DCE3E8',road:'#C8B7A1',road2:'#B19F89',road3:'#D9CBB8',rockh:'#FFFFFF',crop:null,lawn:'#F1F5F8',ice:1}
];
const SH='rgba(0,0,0,.2)',WIN='#F5DE8C',DOOR='#5B3A1E',TIM='#7A5233';

function sGround(g,x,y,p){const ox=x*T,oy=y*T;P(g,ox,oy,T,T,p.g);for(let k=0;k<6;k++){const h=hash(x,y,k);P(g,ox+h%16,oy+(h>>>4)%16,1,1,k%2?p.g1:p.g2)}}
function sWater(g,x,y,p){
  const ox=x*T,oy=y*T;P(g,ox,oy,T,T,p.w);
  for(let k=0;k<2;k++){const h=hash(x,y,k+20);P(g,ox+2+h%10,oy+3+(h>>>4)%10,3,1,p.wh)}
  if(p.ice){const h=hash(x,y,31);P(g,ox+3+h%6,oy+5+(h>>>3)%6,4,1,'#FFFFFF')}
  const land=(dx,dy)=>inb(x+dx,y+dy)&&S.t[I(x+dx,y+dy)]!=='w';
  if(land(0,-1))P(g,ox,oy,T,2,p.sand);if(land(0,1))P(g,ox,oy+14,T,2,p.sand);
  if(land(-1,0))P(g,ox,oy,2,T,p.sand);if(land(1,0))P(g,ox+14,oy,2,T,p.sand);
}
function sTree(g,ox,oy,p,v){
  ox+=(v%3)-1;
  P(g,ox+3,oy+14,10,1,SH);P(g,ox+7,oy+11,2,4,'#6B4423');
  rows(g,ox,oy,[[5,6,3],[4,8,4],[3,10,5],[3,10,6],[3,10,7],[3,10,8],[4,8,9],[5,6,10]],p.t);
  P(g,ox+5,oy+4,3,1,p.th);P(g,ox+4,oy+5,3,1,p.th);P(g,ox+4,oy+6,1,1,p.th);
  P(g,ox+10,oy+8,2,1,p.td);P(g,ox+6,oy+10,4,1,p.td);P(g,ox+11,oy+6,1,2,p.td);
}
function sRock(g,ox,oy,p){
  P(g,ox+2,oy+13,12,1,SH);
  rows(g,ox,oy,[[5,5,6],[4,7,7],[3,8,8],[3,8,9],[3,8,10],[3,8,11],[4,6,12]],p.rock);
  P(g,ox+5,oy+7,3,1,p.rockh);P(g,ox+4,oy+8,2,2,p.rockh);P(g,ox+8,oy+11,3,1,p.rockd);P(g,ox+10,oy+9,1,2,p.rockd);
  rows(g,ox,oy,[[11,3,10],[10,5,11],[10,5,12],[11,3,13]],p.rock);P(g,ox+11,oy+11,1,1,p.rockh);P(g,ox+13,oy+12,1,1,p.rockd);
}
function sRoad(g,x,y,p){
  const ox=x*T,oy=y*T,isR=(dx,dy)=>linkTo(x,y,dx,dy);
  P(g,ox+3,oy+3,10,10,p.road);
  if(isR(0,-1))P(g,ox+3,oy,10,3,p.road);if(isR(0,1))P(g,ox+3,oy+13,10,3,p.road);
  if(isR(-1,0))P(g,ox,oy+3,3,10,p.road);if(isR(1,0))P(g,ox+13,oy+3,3,10,p.road);
  for(let k=0;k<4;k++){const h=hash(x,y,k+40);P(g,ox+4+h%8,oy+4+(h>>>4)%8,1,1,k%2?p.road2:p.road3)}
}
function sBridge(g,x,y,p){
  const ox=x*T,oy=y*T,h=linkTo(x,y,-1,0)||linkTo(x,y,1,0)||(terr(x-1,y)!=='w'&&terr(x-1,y)!=null)||(terr(x+1,y)!=='w'&&terr(x+1,y)!=null);
  const v=linkTo(x,y,0,-1)||linkTo(x,y,0,1);
  if(h&&!(v&&!linkTo(x,y,-1,0)&&!linkTo(x,y,1,0))){P(g,ox,oy+3,T,10,'#A87C49');for(let k=1;k<16;k+=3)P(g,ox+k,oy+3,1,10,'#86592F');P(g,ox,oy+2,T,1,'#6B4423');P(g,ox,oy+13,T,1,'#6B4423');P(g,ox,oy+14,T,1,'rgba(0,0,0,.2)')}
  else{P(g,ox+3,oy,10,T,'#A87C49');for(let k=1;k<16;k+=3)P(g,ox+3,oy+k,10,1,'#86592F');P(g,ox+2,oy,1,T,'#6B4423');P(g,ox+13,oy,1,T,'#6B4423');P(g,ox+14,oy,1,T,'rgba(0,0,0,.2)')}
  if(p.ice)P(g,ox+4,oy+4,3,1,'#fff');
}
const SPR={
  house(g,ox,oy,p,b){
    // houses face down (door toward the viewer) or up (the back, no door)
    const lv=b?b.lv:1,f=b&&b.dir===0?'back':'front';
    if(lv===1){
      P(g,ox+2,oy+14,13,1,SH);P(g,ox+3,oy+8,10,6,'#C99A62');P(g,ox+3,oy+10,10,1,'#A87C49');P(g,ox+3,oy+12,10,1,'#A87C49');
      rows(g,ox,oy,[[7,2,2],[6,4,3],[5,6,4],[4,8,5],[3,10,6],[2,12,7]],'#B5463A');P(g,ox+2,oy+7,12,1,'#8E3229');
      if(p.ice){P(g,ox+6,oy+3,4,1,'#fff');P(g,ox+5,oy+4,6,1,'#fff')}
      if(f==='front'){P(g,ox+7,oy+10,2,4,DOOR);P(g,ox+4,oy+9,2,2,WIN);P(g,ox+10,oy+9,2,2,WIN)}
      else{P(g,ox+5,oy+9,2,2,WIN);P(g,ox+9,oy+9,2,2,WIN)}
    }else if(lv===2){
      P(g,ox+1,oy+14,14,1,SH);P(g,ox+2,oy+7,12,7,'#E8D8B5');
      P(g,ox+2,oy+7,1,7,TIM);P(g,ox+13,oy+7,1,7,TIM);P(g,ox+2,oy+10,12,1,TIM);
      rows(g,ox,oy,[[6,4,1],[4,8,2],[3,10,3],[2,12,4],[1,14,5],[1,14,6]],'#3F6FA8');P(g,ox+1,oy+6,14,1,'#2E5384');
      P(g,ox+11,oy+0,2,3,'#8C5A3C');
      if(p.ice){P(g,ox+5,oy+2,6,1,'#fff');P(g,ox+3,oy+3,10,1,'#fff')}
      P(g,ox+4,oy+8,2,2,WIN);P(g,ox+10,oy+8,2,2,WIN);
      if(f==='front'){P(g,ox+10,oy+11,2,2,WIN);P(g,ox+9,oy+13,4,1,'#D9506E');P(g,ox+6,oy+11,2,3,DOOR);P(g,ox+3,oy+11,2,2,WIN)}
      else{P(g,ox+4,oy+11,2,2,WIN);P(g,ox+10,oy+11,2,2,WIN)}
    }else{
      P(g,ox+0,oy+15,16,1,SH);P(g,ox+2,oy+5,12,10,'#F0E4C9');P(g,ox+2,oy+14,12,1,'#8F877C');
      P(g,ox+2,oy+9,12,1,TIM);P(g,ox+2,oy+5,1,10,TIM);P(g,ox+13,oy+5,1,10,TIM);
      rows(g,ox,oy,[[7,2,0],[5,6,1],[3,10,2],[2,12,3],[1,14,4]],'#2F8A86');P(g,ox+1,oy+4,14,1,'#1F625F');
      P(g,ox+12,oy+0,2,3,'#8C5A3C');
      if(p.ice){P(g,ox+5,oy+1,6,1,'#fff');P(g,ox+3,oy+2,9,1,'#fff')}
      P(g,ox+4,oy+6,2,2,WIN);P(g,ox+7,oy+6,2,2,WIN);P(g,ox+10,oy+6,2,2,WIN);
      if(f==='front'){P(g,ox+4,oy+10,2,2,WIN);P(g,ox+10,oy+10,2,2,WIN);P(g,ox+7,oy+10,2,4,DOOR);P(g,ox+3,oy+12,3,1,'#D9506E');P(g,ox+10,oy+12,3,1,'#E2B93B');P(g,ox+0,oy+11,2,4,p.t)}
      else{P(g,ox+4,oy+10,2,2,WIN);P(g,ox+7,oy+10,2,2,WIN);P(g,ox+10,oy+10,2,2,WIN);P(g,ox+0,oy+11,2,4,p.t)}
      P(g,ox+14,oy+11,2,4,p.t);
    }
  },
  farm(g,ox,oy,p){
    P(g,ox+1,oy+3,14,12,p.ice?'#CFC3B8':'#8A5A33');
    for(const y of [4,7,10,13]){
      P(g,ox+1,oy+y+1,14,1,p.ice?'#BDB0A4':'#734A2A');
      if(p.crop){P(g,ox+2,oy+y,12,1,p.crop);for(let x=2;x<14;x+=2)P(g,ox+x,oy+y-1,1,1,p.crop2)}
    }
    if(p.ice){P(g,ox+3,oy+5,5,1,'#fff');P(g,ox+8,oy+9,5,1,'#fff');P(g,ox+2,oy+12,4,1,'#fff')}
    P(g,ox+0,oy+3,16,1,'#A07A4A');for(const x of [0,5,10,15])P(g,ox+x,oy+2,1,2,'#A07A4A');
    P(g,ox+12,oy+4,1,5,'#6B4423');P(g,ox+11,oy+5,3,1,'#6B4423');P(g,ox+12,oy+3,1,1,'#E2B93B');
  },
  lumber(g,ox,oy,p){
    P(g,ox+1,oy+14,14,1,SH);P(g,ox+1,oy+7,9,7,'#9C6B3E');P(g,ox+1,oy+9,9,1,'#86592F');P(g,ox+1,oy+12,9,1,'#86592F');
    P(g,ox+0,oy+5,11,2,'#6E4528');if(p.ice)P(g,ox+0,oy+5,11,1,'#fff');P(g,ox+4,oy+10,3,4,'#4A2E18');
    P(g,ox+10,oy+11,6,4,'#8A5A33');P(g,ox+10,oy+11,2,2,'#E0BC85');P(g,ox+12,oy+13,2,2,'#E0BC85');P(g,ox+14,oy+11,2,2,'#E0BC85');
    P(g,ox+11,oy+9,4,2,'#8A5A33');P(g,ox+11,oy+9,2,2,'#E0BC85');P(g,ox+13,oy+9,2,2,'#D0A86E');
  },
  quarry(g,ox,oy,p){
    P(g,ox+1,oy+4,14,11,'#6F737A');P(g,ox+2,oy+5,12,9,'#55595F');P(g,ox+2,oy+5,12,1,'#8C9198');P(g,ox+3,oy+8,10,1,'#7C8187');
    P(g,ox+3,oy+10,3,3,'#C3C7CC');P(g,ox+7,oy+11,3,2,'#C3C7CC');P(g,ox+11,oy+10,2,3,'#B0B5BA');
    P(g,ox+9,oy+6,5,2,'#8A5A33');P(g,ox+9,oy+8,1,1,'#2E2E2E');P(g,ox+13,oy+8,1,1,'#2E2E2E');
    if(p.ice)P(g,ox+1,oy+4,14,1,'#fff');
  },
  well(g,ox,oy,p){
    P(g,ox+2,oy+14,12,1,SH);P(g,ox+4,oy+5,1,5,TIM);P(g,ox+11,oy+5,1,5,TIM);
    P(g,ox+5,oy+2,6,1,'#B5463A');P(g,ox+3,oy+3,10,2,'#B5463A');if(p.ice)P(g,ox+3,oy+3,10,1,'#fff');
    P(g,ox+8,oy+5,1,2,'#DDD');P(g,ox+7,oy+7,2,2,'#8A5A33');
    P(g,ox+3,oy+10,10,4,'#9AA0A6');P(g,ox+4,oy+10,8,1,p.ice?'#B7DBF0':'#2E62A0');P(g,ox+3,oy+12,10,1,'#7E848A');P(g,ox+6,oy+11,1,1,'#7E848A');P(g,ox+10,oy+13,1,1,'#7E848A');
  },
  store(g,ox,oy,p){
    P(g,ox+0,oy+15,16,1,SH);P(g,ox+1,oy+6,14,9,'#A8382E');
    rows(g,ox,oy,[[5,6,2],[3,10,3],[2,12,4],[1,14,5]],'#6B2420');if(p.ice){P(g,ox+5,oy+2,6,1,'#fff');P(g,ox+3,oy+3,10,1,'#fff')}
    P(g,ox+4,oy+9,8,6,'#F2EEE6');P(g,ox+5,oy+10,6,5,'#8A2A22');
    for(let k=0;k<5;k++){P(g,ox+5+k+(k>2?1:0),oy+10+k,1,1,'#F2EEE6');P(g,ox+10-k-(k>2?1:0),oy+10+k,1,1,'#F2EEE6')}
    P(g,ox+7,oy+6,2,2,'#E2B93B');
  },
  plant(g,ox,oy,p){sTree(g,ox,oy,p,1)},
  fish(g,ox,oy,p){
    P(g,ox+1,oy+14,10,1,SH);P(g,ox+2,oy+7,8,7,'#B98A5A');P(g,ox+2,oy+10,8,1,'#9C7046');
    rows(g,ox,oy,[[4,4,4],[3,6,5],[1,10,6]],'#2F6E8C');if(p.ice)P(g,ox+4,oy+4,4,1,'#fff');
    P(g,ox+5,oy+10,2,4,DOOR);P(g,ox+3,oy+8,2,1,WIN);
    P(g,ox+11,oy+8,1,6,TIM);P(g,ox+15,oy+8,1,6,TIM);P(g,ox+11,oy+8,5,1,TIM);
    P(g,ox+12,oy+9,1,3,'#9FB7C9');P(g,ox+14,oy+9,1,3,'#9FB7C9');P(g,ox+12,oy+12,1,1,'#7A93A6');
  },
  market(g,ox,oy,p){
    P(g,ox+1,oy+14,14,1,SH);P(g,ox+2,oy+6,1,5,TIM);P(g,ox+13,oy+6,1,5,TIM);
    for(let x=1;x<15;x+=2)P(g,ox+x,oy+3,2,3,(x>>1)%2?'#F2EEE6':'#D24B3C');
    for(let x=1;x<15;x+=2)P(g,ox+x,oy+6,1,1,(x>>1)%2?'#F2EEE6':'#D24B3C');
    if(p.ice)P(g,ox+1,oy+3,14,1,'#fff');
    P(g,ox+2,oy+10,12,4,'#A0703F');P(g,ox+2,oy+13,12,1,TIM);
    P(g,ox+3,oy+9,2,1,'#E04A3A');P(g,ox+6,oy+9,2,1,'#F0A030');P(g,ox+9,oy+9,2,1,'#7CC24E');P(g,ox+12,oy+9,1,1,'#E2B93B');
  },
  bakery(g,ox,oy,p){
    P(g,ox+1,oy+14,14,1,SH);P(g,ox+2,oy+7,12,7,'#E8C99A');P(g,ox+2,oy+13,12,1,'#C9A97A');
    P(g,ox+11,oy+1,2,4,'#8C5A3C');rows(g,ox,oy,[[3,10,4],[2,12,5],[1,14,6]],'#9C5B3C');P(g,ox+2,oy+7,12,1,'#7A4530');
    if(p.ice)P(g,ox+3,oy+4,10,1,'#fff');
    P(g,ox+3,oy+9,3,3,WIN);P(g,ox+3,oy+10,3,1,'#C98A3A');P(g,ox+7,oy+10,2,4,DOOR);
    P(g,ox+10,oy+9,3,2,'#D9A35A');P(g,ox+10,oy+9,3,1,'#F0C27A');
  },
  tea(g,ox,oy,p){
    P(g,ox+1,oy+14,14,1,SH);P(g,ox+2,oy+8,12,6,'#C9A06A');P(g,ox+2,oy+8,1,6,'#B5463A');P(g,ox+13,oy+8,1,6,'#B5463A');
    rows(g,ox,oy,[[4,8,3],[3,10,4],[1,14,5],[0,16,6]],'#4A6B5A');P(g,ox+0,oy+5,1,1,'#4A6B5A');P(g,ox+15,oy+5,1,1,'#4A6B5A');P(g,ox+1,oy+7,14,1,'#2F4A3E');
    if(p.ice){P(g,ox+4,oy+3,8,1,'#fff');P(g,ox+3,oy+4,10,1,'#fff')}
    P(g,ox+4,oy+8,2,2,'#E04A3A');P(g,ox+10,oy+8,2,2,'#E04A3A');P(g,ox+4,oy+10,2,1,'#F0A030');P(g,ox+10,oy+10,2,1,'#F0A030');
    P(g,ox+6,oy+10,4,4,'#5B3A1E');P(g,ox+6,oy+10,4,1,'#3F6FA8');
    P(g,ox+14,oy+0,1,6,'#5B3A1E');P(g,ox+12,oy+0,2,3,'#F2EEE6');P(g,ox+12,oy+1,2,1,'#2E2219');
  },
  park(g,ox,oy,p){
    P(g,ox+1,oy+1,14,14,p.lawn);P(g,ox+7,oy+1,2,14,p.sand);P(g,ox+1,oy+7,14,2,p.sand);
    P(g,ox+5,oy+5,6,6,'#B6BBC1');P(g,ox+6,oy+6,4,4,p.ice?'#E8F5FD':'#6FB0E8');P(g,ox+7,oy+7,2,2,'#fff');
    if(!p.ice){for(const [x,y,c] of [[2,2,'#F06292'],[4,3,'#FFD54F'],[12,2,'#F06292'],[13,4,'#FFD54F'],[3,12,'#FFD54F'],[12,13,'#F06292']])P(g,ox+x,oy+y,1,1,c)}
    P(g,ox+2,oy+10,3,3,p.t);P(g,ox+11,oy+10,3,3,p.t);P(g,ox+2,oy+10,1,1,p.th);P(g,ox+11,oy+10,1,1,p.th);
  },
  school(g,ox,oy,p){
    P(g,ox+0,oy+15,16,1,SH);P(g,ox+1,oy+7,14,8,'#B9533D');P(g,ox+1,oy+9,14,1,'#9C4231');P(g,ox+1,oy+12,14,1,'#9C4231');
    P(g,ox+0,oy+5,16,2,'#4A4A55');if(p.ice)P(g,ox+0,oy+5,16,1,'#fff');
    P(g,ox+6,oy+1,4,5,'#E8DCC4');P(g,ox+5,oy+0,6,1,'#4A4A55');P(g,ox+7,oy+2,2,2,'#E2B93B');
    P(g,ox+7,oy+11,2,4,DOOR);P(g,ox+3,oy+10,2,2,'#CFE6F5');P(g,ox+11,oy+10,2,2,'#CFE6F5');
  },
  workshop(g,ox,oy,p){
    P(g,ox+1,oy+14,14,1,SH);P(g,ox+2,oy+7,10,8,'#8C9198');P(g,ox+2,oy+10,10,1,'#6F737A');P(g,ox+2,oy+13,10,1,'#6F737A');
    P(g,ox+10,oy+1,2,5,'#6F737A');P(g,ox+1,oy+5,12,2,'#5E636A');if(p.ice)P(g,ox+1,oy+5,12,1,'#fff');
    P(g,ox+4,oy+10,3,5,'#4A2E18');P(g,ox+9,oy+9,2,2,'#F0A030');
    P(g,ox+12,oy+12,4,1,'#3A3D42');P(g,ox+13,oy+13,2,2,'#3A3D42');
  },
  temple(g,ox,oy,p){
    P(g,ox+1,oy+13,14,2,'#CFC8BA');P(g,ox+2,oy+7,12,6,'#F2EEE6');
    for(const x of [3,6,9,12])P(g,ox+x,oy+7,1,6,'#D4CCBC');P(g,ox+7,oy+9,2,4,TIM);
    rows(g,ox,oy,[[7,2,1],[5,6,2],[3,10,3],[1,14,4],[1,14,5]],'#E2B93B');P(g,ox+2,oy+6,12,1,'#B88A1E');P(g,ox+7,oy+0,2,1,'#E2B93B');
    if(p.ice){P(g,ox+5,oy+2,6,1,'#fff');P(g,ox+3,oy+3,10,1,'#fff')}
  },
  tower(g,ox,oy,p){
    P(g,ox+2,oy+15,12,1,SH);P(g,ox+4,oy+3,8,12,'#D9CDB5');P(g,ox+4,oy+7,8,1,'#BDB09A');P(g,ox+4,oy+11,8,1,'#BDB09A');
    P(g,ox+3,oy+2,10,2,'#A9A39A');rows(g,ox,oy,[[7,2,0],[6,4,1]],'#E2B93B');
    P(g,ox+5,oy+4,6,5,'#5B4A3A');P(g,ox+6,oy+4,4,4,'#F2EEE6');P(g,ox+8,oy+5,1,2,'#2E2219');P(g,ox+8,oy+6,2,1,'#2E2219');
    P(g,ox+7,oy+12,2,3,DOOR);P(g,ox+3,oy+14,10,1,'#8F877C');
  },
  hall(g,ox,oy,p){
    P(g,ox+0,oy+15,16,1,SH);P(g,ox+1,oy+6,14,9,'#E8D8B5');P(g,ox+1,oy+13,14,2,'#A9A39A');
    rows(g,ox,oy,[[6,4,1],[4,8,2],[2,12,3],[0,16,4],[0,16,5]],'#3F6FA8');P(g,ox+0,oy+5,16,1,'#2E5384');
    if(p.ice){P(g,ox+4,oy+2,8,1,'#fff');P(g,ox+2,oy+3,12,1,'#fff')}
    P(g,ox+6,oy+2,4,3,'#F2EEE6');P(g,ox+8,oy+3,1,1,'#2E2219');P(g,ox+7,oy+3,1,1,'#2E2219');
    P(g,ox+3,oy+7,1,6,'#CFC3A4');P(g,ox+12,oy+7,1,6,'#CFC3A4');
    P(g,ox+6,oy+9,4,6,DOOR);P(g,ox+7,oy+8,2,1,DOOR);P(g,ox+4,oy+8,1,2,WIN);P(g,ox+11,oy+8,1,2,WIN);
    P(g,ox+14,oy+0,1,5,'#555');P(g,ox+15,oy+0,1,2,'#D24B3C');P(g,ox+12,oy+0,2,2,'#D24B3C');
  }
};
// extra details painted over an upgraded building
const UPA={
  farm(g,ox,oy,p){
    P(g,ox+1,oy+3,5,5,'#B5463A');P(g,ox+1,oy+2,5,1,'#8E3229');P(g,ox+2,oy+1,3,1,'#8E3229');P(g,ox+2,oy+5,3,3,'#6B2420');P(g,ox+1,oy+8,5,1,SH);
    if(p.ice)P(g,ox+2,oy+1,3,1,'#fff');
  },
  fish(g,ox,oy,p){
    P(g,ox+9,oy+1,1,4,'#5B3A1E');P(g,ox+10,oy+1,3,2,'#E2B93B');P(g,ox+13,oy+9,1,3,'#9FB7C9');
    P(g,ox+10,oy+14,6,1,'#8A5A33');P(g,ox+11,oy+15,4,1,'#5B3A1E');
  },
  lumber(g,ox,oy,p){
    P(g,ox+12,oy+7,4,2,'#8A5A33');P(g,ox+12,oy+7,2,2,'#E0BC85');P(g,ox+14,oy+7,2,2,'#D0A86E');
    P(g,ox+7,oy+10,2,2,'#C3C7CC');P(g,ox+7,oy+10,1,1,'#8C9198');
  },
  quarry(g,ox,oy,p){
    P(g,ox+2,oy+0,1,6,TIM);P(g,ox+2,oy+0,6,1,TIM);P(g,ox+7,oy+1,1,3,'#DDD');P(g,ox+6,oy+4,3,2,'#6B4423');
  },
  workshop(g,ox,oy,p){
    P(g,ox+4,oy+2,2,3,'#6F737A');P(g,ox+4,oy+2,2,1,'#5E636A');
    P(g,ox+13,oy+8,3,3,'#A0703F');P(g,ox+13,oy+9,3,1,TIM);
  },
  store(g,ox,oy,p){
    P(g,ox+7,oy+0,1,2,'#3A3D42');P(g,ox+6,oy+0,3,1,'#E2B93B');
    P(g,ox+12,oy+12,4,3,p.ice?'#E8EEF2':'#E2B93B');P(g,ox+12,oy+13,4,1,p.ice?'#D2DCE4':'#C99A26');
  },
  well(g,ox,oy,p){
    P(g,ox+5,oy+2,6,1,'#3F6FA8');P(g,ox+3,oy+3,10,2,'#3F6FA8');P(g,ox+3,oy+4,10,1,'#2E5384');if(p.ice)P(g,ox+3,oy+3,10,1,'#fff');
    P(g,ox+13,oy+11,3,3,'#8A5A33');P(g,ox+13,oy+11,3,1,p.ice?'#E8F5FD':'#6FB0E8');
  },
  park(g,ox,oy,p){
    for(const x of [3,12]){P(g,ox+x,oy+3,1,3,'#3A3D42');P(g,ox+x-1,oy+2,3,1,'#F5DE8C')}
    P(g,ox+2,oy+14,4,1,'#8A5A33');P(g,ox+10,oy+14,4,1,'#8A5A33');
  }
};
function drawBld(g,type,ox,oy,p,b){if(SPR[type])SPR[type](g,ox,oy,p,b);if(b&&b.lv>1&&B[type].up&&UPA[type])UPA[type](g,ox,oy,p)}

const ICON={};
function makeIcons(){
  const p=PAL[0];
  for(const k of [...ORDER,'hall']){
    const c=document.createElement('canvas');c.width=16;c.height=16;const g=c.getContext('2d');
    if(k==='road'){P(g,0,3,16,10,p.road);P(g,4,6,1,1,p.road2);P(g,11,9,1,1,p.road3)}
    else if(k==='bridge'){P(g,0,0,16,16,p.w);P(g,0,3,16,10,'#A87C49');for(let q=1;q<16;q+=3)P(g,q,3,1,10,'#86592F');P(g,0,2,16,1,'#6B4423');P(g,0,13,16,1,'#6B4423')}
    else drawBld(g,k,0,0,p,{lv:1});
    ICON[k]=c.toDataURL();
  }
  const c=document.createElement('canvas');c.width=16;c.height=16;const g=c.getContext('2d');
  SPR.house(g,0,0,p,{lv:2});ICON.house2=c.toDataURL();g.clearRect(0,0,16,16);SPR.house(g,0,0,p,{lv:3});ICON.house3=c.toDataURL();
}
