/* ================= map ================= */
function genMap(kind){
  const t=new Array(W*H).fill('g'),f=W*H/384,hx=W>>1,hy=H>>1;
  const blob=(cx,cy,r,v,dens=1,only='g')=>{for(let y=Math.floor(cy-r-1);y<=cy+r+1;y++)for(let x=Math.floor(cx-r-1);x<=cx+r+1;x++){if(!inb(x,y))continue;const d=Math.hypot(x-cx,y-cy)+Math.random()*1.2-.6;if(d<=r&&Math.random()<dens&&(only==null||t[I(x,y)]===only))t[I(x,y)]=v}};
  const river=(wide)=>{let x=Math.random()<.5?R(1,Math.floor(W*.28)):R(Math.ceil(W*.72),W-2),y=0;
    while(y<H){t[I(x,y)]='w';if(Math.random()<wide&&inb(x+1,y))t[I(x+1,y)]='w';const r=Math.random();if(r<.22)x=clamp(x-1,0,W-1);else if(r<.44)x=clamp(x+1,0,W-1);else y++}};
  const many=(n,fn)=>{for(let i=0;i<Math.round(n);i++)fn()};
  const away=()=>{let x,y,g=0;do{x=R(1,W-2);y=R(1,H-2)}while(Math.hypot(x-hx,y-hy)<5&&g++<30);return [x,y]};
  if(kind==='lakes'){
    many(2+f,()=>{const [x,y]=away();blob(x,y,R(2,4),'w',1,null)});
    many(4*f,()=>blob(R(1,W-2),R(1,H-2),R(1,3),'t',.75));
    many(2*f,()=>blob(R(1,W-2),R(1,H-2),R(1,2),'r',.7));
  }else if(kind==='forest'){
    river(.15);
    many(12*f,()=>blob(R(0,W-1),R(0,H-1),R(2,4),'t',.85));
    many(3*f,()=>blob(R(1,W-2),R(1,H-2),R(1,2),'r',.7));
    blob(hx+pick([-6,6]),hy+pick([-3,3]),1.5,'w',1,null);
  }else if(kind==='hills'){
    many(9*f,()=>blob(R(0,W-1),R(0,H-1),R(1,3),'r',.75));
    many(3*f,()=>blob(R(1,W-2),R(1,H-2),R(1,2),'t',.75));
    blob(hx+pick([-6,-5,5,6]),hy+pick([-3,3]),1.6,'w',1,null);
    many(f*.6,()=>{const [x,y]=away();blob(x,y,R(1,2),'w',1,null)});
  }else{
    river(.4);
    many(1+f*.5,()=>blob(R(4,W-5),pick([2,H-3,R(2,H-3)]),R(2,3),'w',1,null));
    many(6*f,()=>blob(R(1,W-2),R(1,H-2),R(1,3),'t',.75));
    many(4*f,()=>blob(R(1,W-2),R(1,H-2),R(1,2),'r',.7));
  }
  blob(hx+pick([-5,5]),hy+pick([-3,3]),2,'t',.8);
  blob(hx+pick([-7,7]),hy+pick([-2,2,4]),1,'r',.9);
  const cr=kind==='forest'?3.3:2.6;
  for(let yy=0;yy<H;yy++)for(let xx=0;xx<W;xx++)if(Math.hypot(xx-hx,yy-hy)<=cr)t[I(xx,yy)]='g';
  return t;
}
function newState(kind){
  const hx=W>>1,hy=H>>1;
  const st={v:1,W,H,kind,day:0,t:genMap(kind),b:{},nid:1,res:{coins:120,wood:45,stone:15,food:40,silk:0,cloth:0,wine:0,porcelain:0},delta:{coins:0,wood:0,stone:0,food:0,silk:0,cloth:0,wine:0,porcelain:0},
     happy:60,tax:1,rank:0,q:0,bgDone:[],pol:{},tech:{},research:null,ev:{harvest:0,blizzard:0,fest:0},nextEvent:12,log:[],short:{food:0,heat:0,cloth:0},hall:I(hx,hy),won:false};
  st.b[st.hall]={type:'hall',id:0};
  [[hx-2,hy],[hx-1,hy],[hx+1,hy],[hx+2,hy]].forEach(([x,y])=>st.b[I(x,y)]={type:'road',id:st.nid++});
  return st;
}
