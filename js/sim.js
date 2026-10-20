/* ================= simulation ================= */
function recompute(){
  connSet=new Set();
  const [hx,hy]=XY(S.hall),q=[];
  N4.forEach(([dx,dy])=>{const b=bAt(hx+dx,hy+dy);if(isRoad(b)){const j=I(hx+dx,hy+dy);connSet.add(j);q.push(j)}});
  while(q.length){const [x,y]=XY(q.shift());N4.forEach(([dx,dy])=>{const b=bAt(x+dx,y+dy),j=I(x+dx,y+dy);if(isRoad(b)&&!connSet.has(j)){connSet.add(j);q.push(j)}})}
  for(const [i,b] of ent()){
    const [x,y]=XY(i);
    b.conn=b.type==='hall'?true:isRoad(b)?connSet.has(i):!needRoad(b.type)?true:N4.some(([dx,dy])=>{const j=I(x+dx,y+dy);return inb(x+dx,y+dy)&&(connSet.has(j)||j===S.hall)});
    if(!isRoad(b)&&b.type!=='hall'){const d=faceDir(x,y,b.dir,b.type);if(d!==b.dir){b.dir=d;dirty=true}}
  }
  let free=popTotal();
  const order=['farm','fish','lumber','quarry','market','school','temple','bakery','tea','mulberry','weave','workshop'];
  const wp=ent().filter(([i,b])=>B[b.type].workers).sort((a,c)=>order.indexOf(a[1].type)-order.indexOf(c[1].type)||a[1].id-c[1].id);
  for(const [i,b] of wp){const need=workersOf(b);b.workers=(b.conn&&!b.paused)?Math.min(need,free):0;free-=b.workers;b.eff=b.workers/need}
  S.idle=free;
  const svcs=ent().filter(([i,b])=>B[b.type].svc&&b.conn&&(!B[b.type].workers||b.eff>0));
  for(const [i,b] of ent()){
    if(b.type!=='house')continue;
    const [x,y]=XY(i);b.cov={};
    for(const [j,s] of svcs){const [sx,sy]=XY(j),r=radiusOf(s);if((sx-x)**2+(sy-y)**2<=r*r)b.cov[B[s.type].svc]=1}
    [b.noise,b.noiseBy]=noiseAt(x,y);
  }
}
function prodOf(b,i){
  const o={},[x,y]=XY(i),s=season(),e=b.eff||0,m=isUp(b)?1.5:1;
  switch(b.type){
    case 'farm':if(e){let f=(3+(adj4(x,y,'w')||nearWell(x,y)?1:0))*[1,1.2,1.5,0][s]*e;if(S.ev.harvest)f*=2;o.food=f*m}break;
    case 'fish':if(e)o.food=Math.min(3,.5*fishWater(x,y)[0])*(s===3?.6:1)*e*m;break;
    case 'lumber':if(e)o.wood=Math.min(3.5,.5*countR(x,y,2,'t'))*e*m;break;
    case 'quarry':if(e)o.stone=Math.min(3,count8(x,y,'r'))*e*m;break;
    case 'market':if(e)o.coins=3*e;break;
    case 'bakery':if(e)o.food=-2*e;break;
    case 'tea':if(e)o.coins=2*e;break;
    case 'mulberry':if(e)o.silk=2*[1,1.25,1,0][s]*e;break;
    case 'weave':if(e){o.silk=-2*e;o.cloth=2*e}break;
    case 'workshop':if(e){const k=isUp(b)?2:1;o.wood=-e*k;o.stone=-e*k;o.coins=6*e*k}break;
    case 'hall':o.coins=2;break;
  }
  const up=B[b.type].upkeep;if(up&&b.conn)o.coins=(o.coins||0)-up;
  return o;
}
const working=t=>ent().some(([i,b])=>b.type===t&&b.conn&&b.eff>0);
const hasMarket=()=>working('market');
function taxIncome(){return houses().reduce((s,b)=>s+b.res*HTAX[b.lv-1],0)*[.6,1,1.5][S.tax]}
function heatNeed(){let h=houses().reduce((s,b)=>s+(b.res?HHEAT[b.lv-1]:0),0);if(S.ev.blizzard)h*=2;return h}
function happyParts(foodShort,heatShort){
  const parts=[['基础',50]],pop=popTotal();
  if(pop)parts.push(foodShort?['粮食短缺',-25]:['粮食充足',10]);
  if(pop&&working('farm')&&working('fish'))parts.push(['饮食多样',5]);
  // each working bakery feeds bread to 40 residents; none while food has run out
  const bread=pop&&!foodShort?Math.round(5*Math.min(1,ent().reduce((s,[i,b])=>s+(b.type==='bakery'&&b.conn?40*(b.eff||0):0),0)/pop)):0;
  if(bread)parts.push(['面包',bread]);
  if(heatShort)parts.push(['冬天缺柴',-20]);
  parts.push(['税率'+['低','中','高'][S.tax],[8,0,-12][S.tax]]);
  let sv=0,nt=0,nz=0,n=0;const m=hasMarket();houses().forEach(b=>{if(!b.res)return;const c=b.cov||{};sv+=b.res*((c.water?4:0)+(m?4:0)+(c.park?8:0)+(c.tea?6:0)+(c.temple?12:0));if(inNet(c))nt+=b.res*5;nz+=b.res*(b.noise||0);n+=b.res});
  if(n)parts.push(['公共服务',Math.round(sv/n)]);
  if(n&&Math.round(nt/n))parts.push(['幸福网',Math.round(nt/n)]);
  if(n&&Math.round(nz/n))parts.push(['工业噪音',-Math.round(nz/n)]);
  if(cnt('tower')&&ent().some(([i,b])=>b.type==='tower'&&b.conn))parts.push(['钟楼',10]);
  if(S.ev.fest)parts.push(['庙会',15]);
  return {parts,t:clamp(parts.reduce((s,p)=>s+p[1],0),0,100)};
}
function houseReq(b){
  const c=b.cov||{},m=hasMarket(),cap=HCAP[b.lv-1],need=Math.ceil(cap*.75);
  if(b.lv===1)return [['连上道路',b.conn],['水井覆盖',!!c.water],['镇上有市场',m],['幸福度 50 以上',S.happy>=50],[`住满 ${need} 人`,b.res>=need]];
  if(b.lv===2)return [['连上道路',b.conn],['水井覆盖',!!c.water],['镇上有市场',m],['学校覆盖',!!c.school],['公园或神庙覆盖',!!(c.park||c.temple)],['幸福度 65 以上',S.happy>=65],[`住满 ${need} 人`,b.res>=need]];
  if(b.lv===3)return [[`小镇达到「${RANKS[LV4_RANK].n}」`,S.rank>=LV4_RANK],['连上道路',b.conn],['水井覆盖',!!c.water],['镇上有市场',m],['学校覆盖',!!c.school],['公园或神庙覆盖',!!(c.park||c.temple)],['镇上有布',S.res.cloth>=1&&!S.short.cloth],['幸福度 75 以上',S.happy>=75],[`住满 ${need} 人`,b.res>=need]];
  return null;
}
function houseKeep(b){const c=b.cov||{},m=hasMarket();if(b.lv===2)return b.conn&&c.water&&m&&S.happy>=40;if(b.lv===3)return b.conn&&c.water&&m&&c.school&&(c.park||c.temple)&&S.happy>=55;if(b.lv===4)return b.conn&&c.water&&m&&c.school&&(c.park||c.temple)&&!S.short.cloth&&S.happy>=65;return true}

function dayTick(){
  recompute();
  const s=season(),before={...S.res},pop=popTotal();
  for(const [i,b] of ent()){
    if(b.type==='workshop'&&(S.res.wood<(isUp(b)?2:1)||S.res.stone<(isUp(b)?2:1)))continue;
    if(b.type==='bakery'&&S.res.food<2)continue;
    if(b.type==='weave'&&S.res.silk<2)continue;
    const o=prodOf(b,i);for(const k in o)S.res[k]+=o[k];
  }
  S.res.coins+=taxIncome();
  S.res.food-=pop*.25;
  if(s===3)S.res.wood-=heatNeed();
  const clothNeed=houses().reduce((t,b)=>t+(b.lv===4?b.res*CLOTH_PER:0),0);S.res.cloth-=clothNeed;
  S.short.cloth=clothNeed>0&&S.res.cloth<0?S.short.cloth+1:0;
  const foodShort=pop>0&&S.res.food<0,heatShort=s===3&&S.res.wood<0;
  S.short.food=foodShort?S.short.food+1:0;S.short.heat=heatShort?S.short.heat+1:0;
  const cap=storeCap();for(const k of STORED)S.res[k]=clamp(S.res[k],0,cap);S.res.coins=Math.max(0,S.res.coins);
  for(const k in S.res)S.delta[k]=S.res[k]-before[k];
  if(S.short.food===1)log('粮食吃完了！居民在挨饿，幸福度会快速下降。多建农场或渔屋。','bad');
  if(S.short.heat===1)log('木材烧完了，民居没法取暖。','bad');
  if(S.short.cloth===1)log('布用完了，府邸的居民不满意。再缺几天，府邸会退化成宅院。','bad');
  const hp=happyParts(foodShort,heatShort);S.happy+=(hp.t-S.happy)*.3;

  for(const b of houses()){
    const req=houseReq(b);
    if(req&&req.every(r=>r[1])){b.up=(b.up||0)+1;if(b.up>=2){b.lv++;b.up=0;b.down=0;log(`一栋民居升级成了${HN[b.lv-1]}！`,'good');dirty=true}}else b.up=0;
    if(b.lv>1&&!houseKeep(b)){b.down=(b.down||0)+1;if(b.down>=4){b.lv--;b.down=0;b.res=Math.min(b.res,HCAP[b.lv-1]);log(`一栋${HN[b.lv]}因为缺少服务退化成了${HN[b.lv-1]}。`,'bad');dirty=true}}else b.down=0;
    if(!b.conn&&b.res>0)b.res--;
  }
  if(S.happy>=35&&!foodShort){
    let quota=Math.max(2,Math.ceil(pop*.08));
    for(const b of shuffle(houses().filter(b=>b.conn&&b.res<HCAP[b.lv-1]))){if(quota<=0)break;const k=Math.min(quota,HCAP[b.lv-1]-b.res,2);b.res+=k;quota-=k}
  }
  if((S.happy<25||S.short.food>=2)&&pop>0){
    let leave=Math.max(1,Math.floor(pop*.06));
    for(const b of shuffle(houses().filter(b=>b.res>0))){if(leave<=0)break;const k=Math.min(b.res,leave);b.res-=k;leave-=k}
    if(S.day%3===0)log('有居民失望地搬走了。','bad');
  }
  for(const k in S.ev)if(S.ev[k]>0)S.ev[k]--;
  S.day++;
  const ns=season();
  if(dayIn()===1){
    const msg=['春天到了，农场恢复生产。','夏天到了，作物长得更快。','秋天是收获的季节，农场产量最高。趁现在囤够过冬的粮食和木材！','冬天来了：农场停产，河面结冰，民居每天要烧木材取暖。'][ns];
    log(msg,ns===3?'bad':'');
  }
  if(ns===2&&dayIn()===SEASON_DAYS-1)log('还有 2 天入冬。看看右边的「过冬准备」够不够。','bad');
  recompute();checkRank();checkQuests();maybeEvent();
  dirty=true;save();
}
function checkRank(){
  const pop=popTotal();
  while(S.rank<RANKS.length-1&&pop>=RANKS[S.rank+1].pop){
    S.rank++;const r=RANKS[S.rank];gain(r.reward);
    const un=ORDER.filter(k=>B[k].rank===S.rank);
    log(`小镇升级为「${r.n}」！奖励 ${rTxt(r.reward)}`,'good');
    openModal({icon:'🎉',title:`升级为「${r.n}」`,text:`人口达到 ${r.pop}，奖励 ${rTxt(r.reward)}。${S.rank===UP_RANK?'现在可以升级农场、仓库等建筑了。':''}${un.length?'解锁了新建筑：':''}`,icons:un,
      choices:[{label:S.rank===RANKS.length-1?'太好了，继续经营':'继续',primary:1,fn:()=>{}}]});
    if(S.rank===RANKS.length-1&&!S.won){S.won=true;log(`晴川小镇成为了${r.n}！你可以继续经营下去。`,'good')}
  }
}
// bg quests run alongside the chain and finish whenever their condition holds; the chain skips over them
// (saves from before bg quests count any bg quest the chain already passed as done)
function bgDone(){if(!S.bgDone)S.bgDone=QUESTS.flatMap((q,i)=>q.bg&&i<S.q?[i]:[]);return S.bgDone}
function checkQuests(){
  const done=q=>{gain(q.r);log(`完成任务「${q.t}」，奖励 ${rTxt(q.r)}`,'good');toast(`任务完成：${q.t}　${rTxt(q.r)}`)};
  QUESTS.forEach((q,i)=>{if(q.bg&&!bgDone().includes(i)&&q.c()){bgDone().push(i);done(q)}});
  let n=0;
  while(S.q<QUESTS.length&&n<5){const q=QUESTS[S.q];if(!q.bg){if(!q.c())break;done(q);n++}S.q++}
}
function canPay(c){return Object.entries(c).every(([k,v])=>S.res[k]>=v)}
function pay(c){for(const k in c)S.res[k]-=c[k]}
function maybeEvent(){
  if(S.day<S.nextEvent)return;
  S.nextEvent=S.day+R(9,15);
  const s=season(),pop=popTotal(),opts=['merchant','merchant','coins'];
  if(s===1||s===2)opts.push('harvest');
  if(s===3)opts.push('blizzard','blizzard');
  if(pop>=6&&popCap()-pop>=4)opts.push('immig');
  if(pop>=15)opts.push('fest');
  const k=pick(opts);
  if(k==='merchant'){
    const tr=shuffle([...TRADES]).slice(0,2);
    openModal({icon:'🐫',title:'旅行商人路过',text:'「好东西不等人。要换点什么吗？」',choices:[
      ...tr.map(t=>({label:`用 ${rTxt(t.g)} 换 ${rTxt(t.r)}`,dis:!canPay(t.g),fn:()=>{pay(t.g);gain(t.r);log(`和商人交易：${rTxt(t.g)} → ${rTxt(t.r)}`)}})),
      {label:'不用了',fn:()=>{}}]});
  }else if(k==='fest'){
    openModal({icon:'🏮',title:'居民想办庙会',text:'大家想热闹一下。花 40 金币办庙会，接下来 5 天幸福度 +15。',choices:[
      {label:'办！花 💰40',primary:1,dis:S.res.coins<40,fn:()=>{S.res.coins-=40;S.ev.fest=5;log('庙会开始了，镇上热闹非凡。','good')}},
      {label:'今年就算了',fn:()=>{}}]});
  }else if(k==='harvest'){S.ev.harvest=3;log('风调雨顺！接下来 3 天农场产量翻倍。','good');toast('🌾 大丰收：农场产量翻倍 3 天')}
  else if(k==='blizzard'){S.ev.blizzard=3;log('暴风雪来了！接下来 3 天取暖用的木材翻倍。','bad');toast('🌨️ 暴风雪：取暖木材翻倍 3 天')}
  else if(k==='immig'){let n=6;for(const b of shuffle(houses().filter(b=>b.conn))){const k2=Math.min(n,HCAP[b.lv-1]-b.res);b.res+=k2;n-=k2;if(n<=0)break}log('一队移民听说了晴川小镇，搬了进来。','good');toast('🧳 新移民搬进了小镇')}
  else{const g=R(20,40);S.res.coins+=g;log(`居民在河边捡到一袋金币，交给了镇上：+${g} 金币。`,'good')}
}
