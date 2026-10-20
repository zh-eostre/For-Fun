/* ================= state & helpers ================= */
let S=null,SETUP={size:0,kind:'valley',cand:null},UI={screen:'title',tool:'select',sel:null,hover:null,pending:null,speed:1,scale:2,drag:false,ptype:'mouse',confirmDel:null,confirmNew:false};
let MODAL=null,dirty=true,walkers=[],connSet=new Set(),acc=0;
const R=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const I=(x,y)=>y*W+x;
const XY=i=>[i%W,Math.floor(i/W)];
const inb=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
const hash=(x,y,k)=>{let h=Math.imul(x+1,374761393)^Math.imul(y+7,668265263)^Math.imul(k+3,1274126177);h=Math.imul(h^(h>>>13),1274126177);return (h^(h>>>16))>>>0};
const season=()=>Math.floor((S.day%(SEASON_DAYS*4))/SEASON_DAYS);
const yearN=()=>Math.floor(S.day/(SEASON_DAYS*4))+1;
const dayIn=()=>S.day%SEASON_DAYS+1;
const fmt=v=>{const a=Math.abs(v);return a>=10?String(Math.round(v)):(Math.round(v*10)/10).toString()};
const ent=()=>Object.entries(S.b).map(([i,b])=>[+i,b]);
const houses=()=>Object.values(S.b).filter(b=>b.type==='house');
const cnt=t=>Object.values(S.b).filter(b=>b.type===t).length;
const connCnt=t=>Object.values(S.b).filter(b=>b.type===t&&b.conn).length;
const lvCnt=l=>houses().filter(b=>b.lv>=l).length;
const popTotal=()=>houses().reduce((s,b)=>s+b.res,0);
const popCap=()=>houses().filter(b=>b.conn).reduce((s,b)=>s+HCAP[b.lv-1],0);
const storeCap=()=>150+Object.values(S.b).reduce((s,b)=>s+(b.type==='store'?(isUp(b)?300:150):0),0);
const terr=(x,y)=>inb(x,y)?S.t[I(x,y)]:null;
const bAt=(x,y)=>inb(x,y)?S.b[I(x,y)]:null;
// water a fishing hut at (x,y) can fish: each water tile within 2 tiles is shared evenly by the working huts that reach it;
// adding counts one more hut there (for previewing a hut that isn't built yet). Returns [tiles, shared tiles]
function fishWater(x,y,adding){
  const huts=ent().filter(([i,b])=>b.type==='fish'&&b.conn&&b.eff>0).map(([i])=>XY(i));
  let n=0,sh=0;
  for(let yy=y-2;yy<=y+2;yy++)for(let xx=x-2;xx<=x+2;xx++){
    if(!inb(xx,yy)||(xx-x)**2+(yy-y)**2>4||S.t[I(xx,yy)]!=='w'||S.b[I(xx,yy)])continue;
    const k=Math.max(1,huts.filter(([hx,hy])=>(hx-xx)**2+(hy-yy)**2<=4).length+(adding?1:0));
    n+=1/k;if(k>1)sh++;
  }
  return [n,sh];
}
const nearWell=(x,y)=>ent().some(([i,b])=>{if(b.type!=='well')return false;const [wx,wy]=XY(i);return (wx-x)**2+(wy-y)**2<=4});
// the loudest working industry within NOISE_R of (x,y): [penalty, type]
function noiseAt(x,y){let n=0,by=null;for(const [i,b] of ent()){if(!B[b.type].noise||!b.conn||!(b.eff>0))continue;const [sx,sy]=XY(i);if((sx-x)**2+(sy-y)**2<=NOISE_R*NOISE_R&&B[b.type].noise>n){n=B[b.type].noise;by=b.type}}return [n,by]}
// a house covered by two of park / teahouse / temple is in the 幸福网
const inNet=c=>(c.park?1:0)+(c.tea?1:0)+(c.temple?1:0)>=2;
function countR(x,y,r,v){let n=0;for(let yy=y-r;yy<=y+r;yy++)for(let xx=x-r;xx<=x+r;xx++){if(!inb(xx,yy)||(xx-x)**2+(yy-y)**2>r*r)continue;if(S.t[I(xx,yy)]===v&&!S.b[I(xx,yy)])n++}return n}
function count8(x,y,v){let n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if((dx||dy)&&terr(x+dx,y+dy)===v)n++}return n}
// upgraded buildings (not houses, which have their own levels) use the numbers in B[type].up
const isUp=b=>b.lv>1&&!!B[b.type].up;
const workersOf=b=>isUp(b)&&B[b.type].up.workers||B[b.type].workers;
const radiusOf=b=>isUp(b)&&B[b.type].up.r||B[b.type].r;
const needRoad=t=>t==='house'||!!B[t].workers;
const isRoad=b=>!!b&&(b.type==='road'||b.type==='bridge');
const adj4=(x,y,v)=>N4.some(([dx,dy])=>terr(x+dx,y+dy)===v);
// door direction (index into N4): face a neighbouring road, preferring ones linked to the hall; keep the current side while it still works
// houses only face up or down
function faceDir(x,y,cur,type){
  const nb=d=>{const [dx,dy]=N4[d];return inb(x+dx,y+dy)?I(x+dx,y+dy):-1};
  const allowed=type==='house'?[2,0]:[2,1,3,0],sides=allowed.filter(d=>{const j=nb(d);return j>=0&&(isRoad(S.b[j])||j===S.hall)});
  const linked=sides.filter(d=>{const j=nb(d);return connSet.has(j)||j===S.hall}),pool=linked.length?linked:sides;
  return pool.length?(pool.includes(cur)?cur:pool[0]):(allowed.includes(cur)?cur:2);
}
// does whatever is at (x+dx,y+dy) open onto the road at (x,y)? roads and the hall link on every side, other buildings only at their door
const linkTo=(x,y,dx,dy)=>{const b=bAt(x+dx,y+dy);return !!b&&(isRoad(b)||b.type==='hall'||N4[b.dir??2][0]===-dx&&N4[b.dir??2][1]===-dy)};
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
// fill in fields added after a save was made
function migrate(d){for(const k of Object.keys(RI)){d.res[k]??=0;d.delta[k]??=0}d.short.cloth??=0;return d}
function load(){try{const t=localStorage.getItem(KEY);if(t){const d=JSON.parse(t);if(d&&d.v===1)return migrate(d)}}catch(e){}return null}
function log(t,c=''){S.log.unshift({d:`${yearN()}年${SN[season()]}${dayIn()}日`,t,c});S.log=S.log.slice(0,40)}
function gain(r){for(const k in r)S.res[k]=(S.res[k]||0)+r[k];const c=storeCap();for(const k of STORED)S.res[k]=Math.min(c,S.res[k])}
const rTxt=r=>Object.entries(r).map(([k,v])=>`${RI[k]}${v}`).join(' ');
