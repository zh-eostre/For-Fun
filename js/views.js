/* ---------- views ---------- */
// matches the two-column breakpoint in style.css; main.js re-renders when the window crosses it
const WIDE='(min-width:960px)',isWide=()=>!!(window.matchMedia&&window.matchMedia(WIDE).matches);
// small label for an AI club's standing; giants and strong clubs stand out, the rest stay quiet
const tierTag=t=>{const n=tierOf(t.rep);return n==='豪门'||n==='强队'?` <span class="tier t-${n==='豪门'?'big':'strong'}">${n}</span>`:''};
const reducedMotion=()=>window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function render(){
  const app=document.getElementById('app'),a=document.activeElement;
  // the whole page is rebuilt each time, so put keyboard focus back on the same control afterwards
  const keep=a&&app.contains(a)&&a.dataset.act?[a.dataset.act,a.dataset.arg,a.classList[0]]:null;
  // elements with data-flip glide from their old spot to the new one (players moving on the pitch)
  const before={};app.querySelectorAll('[data-flip]').forEach(el=>before[el.dataset.flip]=el.getBoundingClientRect());
  // a dialog that stays open through the redraw (a click inside it) keeps its scroll positions and doesn't pop in again
  const open=app.querySelector('dialog.modal[open]'),modalKey=UI.modal?UI.modal.type+':'+(UI.modal.id??''):null,same=open&&open.dataset.key===modalKey;
  const scrolls={};if(same){scrolls['']=open.scrollTop;open.querySelectorAll('[data-scroll]').forEach(el=>scrolls[el.dataset.scroll]=el.scrollTop)}
  app.innerHTML=view();
  if(S)playSigQueue();
  // folding panels keep whatever open/closed state the player last chose
  app.querySelectorAll('details[data-fold]').forEach(d=>{const k=d.dataset.fold;if(UI.folds&&k in UI.folds)d.open=UI.folds[k]});
  scrollFixtures(app);
  // with the dialog open, focus is restored inside it (the page behind can hold a twin of the same button)
  const dlg=app.querySelector('dialog.modal'),scope=dlg||app;
  if(dlg)dlg.dataset.key=modalKey;
  if(dlg&&same)dlg.classList.add('again');
  if(dlg&&dlg.showModal&&!dlg.open){
    dlg.showModal();
    if(same){dlg.scrollTop=scrolls[''];dlg.querySelectorAll('[data-scroll]').forEach(el=>{if(el.dataset.scroll in scrolls)el.scrollTop=scrolls[el.dataset.scroll]})}
    // a toast raised just before this render must come back above the freshly opened dialog
    const t=document.getElementById('toast');if(t&&t.matches&&t.matches(':popover-open')){t.hidePopover();t.showPopover()}
  }
  document.body.style.overflow=dlg?'hidden':'';
  const twin=keep&&[...scope.querySelectorAll('[data-act]')].find(e=>e.dataset.act===keep[0]&&e.dataset.arg===keep[1]&&e.classList[0]===keep[2]);
  if(twin)twin.focus({preventScroll:true});
  else if(dlg){const c=dlg.querySelector('.mclose');if(c)c.focus({preventScroll:true})}
  // after closing, back to the name that opened it
  if(!dlg&&UI.returnFocus){const r=UI.returnFocus,el=app.querySelector(`[data-act="${r.act}"]${r.arg!=null?`[data-arg="${r.arg}"]`:''}`);if(el)el.focus({preventScroll:true});UI.returnFocus=null}
  if(!reducedMotion())app.querySelectorAll('[data-flip]').forEach(el=>{
    const b=before[el.dataset.flip];if(!b||!el.animate)return;
    const r=el.getBoundingClientRect(),dx=b.left-r.left,dy=b.top-r.top;
    if(Math.abs(dx)+Math.abs(dy)>1)el.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'none'}],{duration:420,easing:'cubic-bezier(.2,.8,.2,1)'});
  });
}
// the season's fixture list opens at the next match, with the last result just above it
function scrollFixtures(root){
  const nx=root.querySelector&&root.querySelector('.fx-list .next');if(!nx)return;
  const prev=nx.previousElementSibling;nx.parentNode.scrollTop=(prev||nx).offsetTop;
}
function view(){
  const main=mainView();
  return S&&UI.modal&&!(UI.view==='match'&&M)?main+vModal():main;
}
// the guide card: one step at a time, over the page it describes
function vGuide(){
  if(UI.guide==null||UI.view==='match')return '';
  const k=UI.guide,[,title,text]=GUIDE[k],last=k===GUIDE.length-1;
  return `<div class="guide" role="dialog" aria-labelledby="gtitle"><div class="guide-in">
  <div class="guide-head"><b id="gtitle">${title}</b><span class="muted num">${k+1}/${GUIDE.length}</span></div><p>${text}</p>
  <div class="go" style="justify-content:flex-end;margin:0">${last?'':'<button class="btn small" data-act="guide" data-arg="skip">跳过</button>'}
  ${k?'<button class="btn small" data-act="guide" data-arg="back">上一步</button>':''}<button class="btn small primary" data-act="guide" data-arg="next">${last?'开始执教':'下一步'}</button></div></div></div>`;
}
function mainView(){
  if(!S)return vStart();
  if(UI.view==='match'&&M)return vMatch();
  if(seasonDone())return vHeader()+`<div class="wrap">${vSeasonEnd()}</div>`;
  const tabs=[['home','俱乐部',vHome],['squad','阵容',vSquad],['table','积分榜',()=>vTable()],['cup','杯赛',vCup],['market','转会市场',vMarket],['fac','设施',vAcademy],['honours','荣誉室',vHonours]];
  const pg=UI.pages&&UI.pages[UI.pages.length-1];
  if(pg)return vHeader()+`<div class="wrap"><button class="btn small" data-act="back" style="margin-bottom:12px">← 返回</button>${vTeamPage(pg.id)}</div>`;
  const cur=tabs.find(t=>t[0]===UI.tab)||tabs[0];
  return vHeader()+`<div class="wrap"><nav class="tabs">${tabs.map(([k,l])=>`<button data-act="tab" data-arg="${k}" ${cur[0]===k?'aria-current="page"':''}>${l}</button>`).join('')}</nav>${cur[2]()}</div>${vGuide()}`;
}
function vStart(){
  const saved=load();
  if(!UI.draft)UI.draft=teamNames();
  return `<div class="wrap"><div class="start-hero"><h1 class="disp">绿茵经理</h1>
  <p>挑一支球队，带它打完一个又一个赛季。</p></div>
  ${saved?`<div class="panel"><b>有一份存档：</b>${saved.teams[saved.my].name}（${DIVS[saved.teams[saved.my].div]}），第 ${saved.season} 赛季第 ${Math.min(saved.round+1,saved.fixtures[saved.teams[saved.my].div].length)} 轮${saved.live?'（比赛进行中）':''}。
  <div class="go" style="justify-content:flex-start"><button class="btn primary" data-act="continue">继续存档</button></div></div>
  <h2>或者重新开始</h2><p class="muted" style="margin-top:-6px;font-size:14px">选新球队会覆盖旧存档。</p>`:`<h2>选择你的球队</h2><p class="muted" style="margin-top:-6px;font-size:14px">你是一位没有履历的新教练，只有丙级球队愿意给你机会。</p>`}
  <p style="margin:-4px 0 0;display:flex;gap:8px;flex-wrap:wrap"><button class="btn small" data-act="reroll">换一批队名</button>${canPickDir()?'<button class="btn small" data-act="listSaves">从存档文件夹读取</button>':''}<button class="btn small" data-act="importSave">从文件读取存档</button></p>
  ${UI.saveFiles?vSaveList():''}
  ${(()=>{
    // a new manager with no record only gets offers from the bottom division; the higher ones are shown for orientation
    const low=DIVS.length-1,pick=div=>{const list=TEAMS.map((t,i)=>({t,i})).filter(x=>x.t.div===div),reps=list.map(x=>x.t.rep).sort((a,b)=>b-a);
      return `<div class="teams ${div===low?'':'locked-list'}" style="margin-top:8px">${list.map(({t,i})=>{const tier=tierOf(t.rep);
        if(div!==low)return `<div class="team-pick locked" style="--c:${t.color}" aria-disabled="true"><b class="disp">${UI.draft[i].name}</b><span>${tier} · 实力 ${t.str}</span></div>`;
        const k=reps.indexOf(t.rep)/reps.length,goal=k<1/3?'冲击升级':k<2/3?'站稳脚跟':'艰难起步';
        return `<button class="team-pick" style="--c:${t.color}" data-act="start" data-arg="${i}"><b class="disp">${UI.draft[i].name}</b>
        <span>${tier} · 实力 ${t.str}，目标${goal}，预算 ${money(Math.round(startBudget(t)*(DIFF[UI.diff]||DIFF.normal).budget))}</span></button>`}).join('')}</div>`};
    const d=DIFF[UI.diff]?UI.diff:'normal';
    return `<div class="diff-pick"><h3 style="margin:0">难度</h3><div class="seg">${Object.entries(DIFF).map(([k,v])=>`<button data-act="diff" data-arg="${k}" aria-pressed="${k===d}">${v.name}</button>`).join('')}</div><span class="muted">${DIFF[d].note}（开局后不能更改）</span></div>
    <h3>${DIVS[low]}联赛<span class="muted" style="font-weight:400;font-size:14px">，新教练从这里起步，前 ${SWAP} 名升级</span></h3>${pick(low)}
    <details class="fold" style="margin-top:14px"><summary><h3 style="margin:0">更高级别 <span class="muted" style="font-weight:400;font-size:14px">需要执教履历，暂不可选</span></h3></summary>
    ${DIVS.map((dn,d)=>d===low?'':`<h3>${dn}联赛</h3>${pick(d)}`).reverse().join('')}</details>`})()}
  <p class="muted" style="font-size:13px;margin-top:20px">联赛分三级：${DIVS.map((dn,d)=>`${dn} ${DIV_SIZES[d]} 队（每季 ${2*(DIV_SIZES[d]-1)} 轮）`).join('、')}，越往上球队越少。每级前 ${SWAP} 名升级、后 ${SWAP} 名降级。球队都是虚构的。</p></div>`;
}
function vHeader(){
  const t=my();
  return `<header class="club" style="--team:${t.color}"><div class="wrap">
  <div class="crest disp">${t.short[0]}</div>
  <div><div class="club-name disp">${t.name}</div>
  <div class="club-meta">${DIVS[t.div]}联赛，第 ${S.season} 赛季，${S.round<rounds()?`${dayLabel(S.day)}，第 ${S.round+1}/${rounds()} 轮`:seasonDone()?'赛季结束':`${dayLabel(S.day)}，联赛已结束`}，排名第 ${myRank()}${S.boost>0?' <span class="tag2 boost">士气高涨</span>':''}${(S.streak||0)>=3?` <span class="tag2 fire">🔥 ${S.streak} 连胜</span>`:''}</div></div>
  <button class="btn small rules-btn" data-act="sound" aria-label="音效：${soundOn()?'开':'关'}" title="音效">${soundOn()?'🔊':'🔇'}</button>
  <button class="btn small rules-btn" data-act="rules" aria-label="规则说明">规则</button>
  <div class="cash"><div class="club-meta">俱乐部资金</div><div class="num" style="color:${S.budget<0?'var(--red)':'inherit'}">${money(S.budget)}</div></div>
  </div></header>`;
}
// the next ten days, what happened over the last days skipped, and how fresh the starting XI is
// the whole season in one list: friendlies, every league round, our cup ties, the windows and the last day.
// played ones show the score, the next one is marked; the summary line says how far in we are and when it ends
function vFixtures(){
  const div=my().div,rows=[],end=seasonEndDay(),res=(h,a,hg,ag)=>{const me=h===S.my,f=me?hg:ag,o=me?ag:hg;return {f,o,w:f>o?'胜':f<o?'负':'平'}};
  (S.friendlies||[]).forEach(f=>rows.push({day:f.day,kind:`${f.warm?'热身赛':'友谊赛'} · ${divName(S.teams[f.opp])}`,opp:f.opp,home:f.home,r:f.res&&res(f.home?S.my:f.opp,f.home?f.opp:S.my,f.res.hg,f.res.ag)}));
  (S.fixtures[div]||[]).forEach((rd,r)=>{const fx=rd.find(x=>x.includes(S.my));if(!fx)return;
    const done=(S.results[div][r]||[]).find(x=>x.h===S.my||x.a===S.my);
    rows.push({day:leagueDay(r),kind:`第 ${r+1} 轮`,opp:fx[0]===S.my?fx[1]:fx[0],home:fx[0]===S.my,r:done&&res(done.h,done.a,done.hg,done.ag)})});
  const C=S.cup;(C.rounds||[]).forEach((rd,k)=>{const x=rd.find(r=>r.h===S.my||r.a===S.my);if(x)rows.push({day:cupDay(k),kind:`${CUP_NAME}·${stageName(k)}`,opp:x.h===S.my?x.a:x.h,home:x.h===S.my,r:{...res(x.h,x.a,x.hg,x.ag),w:x.w===S.my?'胜':'负',pens:x.hp!=null?`点球 ${x.h===S.my?x.hp:x.ap}:${x.h===S.my?x.ap:x.hp}`:''}})});
  if(cupAlive()&&C.stage<cupFmt().names.length)for(let k=C.stage;k<cupFmt().names.length;k++){const t=k===C.stage&&C.ties.find(x=>x.includes(S.my));
    if(k===C.stage&&!t)continue;rows.push({day:cupDay(k),kind:`${CUP_NAME}·${stageName(k)}`,opp:t?(t[0]===S.my?t[1]:t[0]):null,home:t?t[0]===S.my:null})}
  if(intlIn())rows.push(...intlRows(res));
  rows.push(...cupAfterExit().map(x=>({day:x.day,kind:x.kind,note:x.note})));
  if(S.pre!=null)rows.push({day:winterStart(),kind:'冬季转会窗开启',note:`${WINTER} 天`});
  rows.push({day:end+1,kind:'赛季结束',note:'颁奖、升降级'});
  rows.sort((a,b)=>a.day-b.day);const next=rows.find(x=>x.opp!=null&&!x.r&&x.day>=S.day);
  const played=S.round,left=rounds()-S.round;
  const sum=`第 ${Math.min(played+1,rounds())}/${rounds()} 轮 · 还剩 ${left} 轮联赛 · 赛季在${dayLabel(end)}结束（还有 ${Math.max(0,end-S.day)} 天）`;
  return `<details class="fold fixtures" data-fold="fixtures"><summary><span><b>全赛季赛程</b> <span class="muted">${sum}</span></span></summary>
  <div class="fx-prog" aria-hidden="true"><i style="width:${Math.round(played/rounds()*100)}%"></i></div>
  <div class="fx-list">${rows.map(x=>`<div class="fx-row ${x===next?'next':''} ${x.r?'done':''} ${x.opp==null?'evt':''}"><span class="fx-d">${dayLabel(x.day)}</span><span class="fx-k">${x.kind}</span>
    <span class="fx-o">${x.opp!=null?`${x.home?'主':'客'} ${S.teams[x.opp].name}`:x.note?x.note:x.kind.startsWith(CUP_NAME)||x.kind.startsWith(INTL_NAME)?'对手待定':''}</span>
    <span class="fx-r">${x.r?`<b class="wdl ${x.r.w==='胜'?'w':x.r.w==='负'?'l':'d'}">${x.r.w}</b> ${x.r.f}:${x.r.o}${x.r.pens?` <small>${x.r.pens}</small>`:''}`:x===next?'<b class="nexttag">下一场</b>':''}</span></div>`).join('')}</div></details>`;
}
// our 天际冠军杯 matches for the season list: group games played and to come, knockout ties played, the next tie,
// and the later rounds while we're still in it
function intlRows(res){
  const I=S.intl,rows=[],gi=I.groups.findIndex(g=>g.includes(S.my)),kind=k=>`${INTL_NAME}·${INTL_STAGES[k]}`;
  I.fix[gi].forEach((rd,k)=>{const fx=rd.find(x=>x.includes(S.my)),done=(I.res[gi][k]||[]).find(x=>x.h===S.my||x.a===S.my);
    rows.push({day:intlDay(k),kind:kind(k),opp:fx[0]===S.my?fx[1]:fx[0],home:fx[0]===S.my,r:done&&res(done.h,done.a,done.hg,done.ag)})});
  I.ko.forEach((rd,j)=>{const x=rd.find(r=>r.h===S.my||r.a===S.my);if(x)rows.push({day:intlDay(6+j),kind:kind(6+j),opp:x.h===S.my?x.a:x.h,home:x.h===S.my,
    r:{...res(x.h,x.a,x.hg,x.ag),w:x.w===S.my?'胜':'负',pens:x.hp!=null?`点球 ${x.h===S.my?x.hp:x.ap}:${x.h===S.my?x.ap:x.hp}`:''}})});
  const alive=I.stage<6||I.ties.some(t=>t.includes(S.my));
  if(alive)for(let k=Math.max(6,I.stage);k<intlStages();k++){const t=k===I.stage&&I.ties.find(x=>x.includes(S.my));
    rows.push({day:intlDay(k),kind:kind(k),opp:t?(t[0]===S.my?t[1]:t[0]):null,home:t?t[0]===S.my:null})}
  return rows;
}
function vCalendar(){
  const days=matchDays(),T=TRAIN[S.training][0],played=S.lastMatchDay===S.day,today=played?'match':dayType(S.day,days);
  const after=Object.fromEntries(cupAfterExit().map(x=>[x.day,x.mark]));
  const cell=d=>{
    const t=d===S.lastMatchDay?'match':dayType(d,days),m=days.find(x=>x.day===d);
    let what='',sub='';
    if(d===S.lastMatchDay){what='比赛';sub='已结束'}
    else if(t==='match'&&m.friendly){what=S.friendlies[m.i].warm?'热身赛':'友谊赛';sub=`${m.home?'主':'客'} ${S.teams[m.opp].short}·${divName(S.teams[m.opp])}`}
    else if(t==='match'){
      const fx=m.cup?S.cup.ties.find(x=>x.includes(S.my)):m.intl?intlMatches().find(x=>x.includes(S.my)):S.fixtures[my().div][m.r].find(x=>x.includes(S.my));
      const opp=S.teams[fx[0]===S.my?fx[1]:fx[0]];
      what=m.cup?CUP_NAME:m.intl?'冠军杯':'联赛';sub=`${fx[0]===S.my?'主':'客'} ${opp.short}`;
    }else if(t==='rest'){what='休息';sub=`体能 +${restAmt()}`}
    else{what='训练';sub=S.cal>=2&&d%7===5&&d>=(S.pre||0)?'联赛轮空':T}
    // marks for the transfer windows and the last round
    const mark=d===winterStart()?'冬窗开启':S.pre!=null&&d===winterStart()+WINTER?'冬窗关闭':S.pre!=null&&d===S.pre?'转会窗关闭':m&&m.r!=null&&m.r===rounds()-1?'最后一轮':after[d]||'';
    return `<div class="day ${t} ${m&&m.intl?'intl':''} ${d===S.day?'today':''}"><span class="wd">${d%7===0||d===S.day?`<i>第${Math.floor(d/7)+1}周</i>`:''}${WEEKDAYS[d%7]}</span><b>${what}</b><small>${sub}</small>${mark?`<em>${mark}</em>`:''}</div>`;
  };
  // four weeks ahead (swipe sideways), up to the last round
  const strip=Array.from({length:28},(_,i)=>S.day+i).filter(d=>d<=seasonEndDay()).map(cell).join('');
  const xi=S.lineup.map(id=>id!=null&&findP(id)).filter(Boolean),avg=xi.length?Math.round(xi.reduce((s,p)=>s+p.cond,0)/xi.length):0;
  const tired=xi.filter(p=>p.cond<80).sort((a,b)=>a.cond-b.cond).slice(0,3);
  const L=UI.dayLog,left=nextMatchDay()-S.day;
  return `<section class="panel"><h2>日程 <span class="muted" style="font-weight:400;font-size:14px">${dayLabel(S.day)}，今天${played?'的比赛已结束（进入下一天开始休息）':today==='match'?'是比赛日':today==='rest'?'休息（进入下一天时恢复）':`训练（${T}，进入下一天时生效）`}</span></h2>
  <div class="days" tabindex="0" aria-label="接下来四周的日程，可以左右滑动">${strip}</div>
  ${vFixtures()}
  ${L?`<p class="daylog">过了 ${L.days} 天：全队体能共 ${L.cond>=0?'+':''}${L.cond}${L.trained.length?`；训练中进步：${[...new Set(L.trained)].map(p=>{const n=L.trained.filter(x=>x===p).length;return `${p.name}（${p.ovr}${n>1?`，+${n}`:''}）`}).join('、')}`:'；训练中没有人进步'}${L.healed.length?`；伤愈复出：${L.healed.map(p=>p.name).join('、')}`:''}。</p>`:''}
  ${L&&L.surprises?L.surprises.map(t=>`<p class="surprise">✨ ${t}</p>`).join(''):''}
  <p class="muted" style="margin:8px 0 0;font-size:14px">首发平均体能 <b>${avg}</b>${tired.length?`，偏低：${tired.map(p=>`${p.name} ${p.cond}`).join('、')}`:'，全员状态良好'}。</p>
  ${windowOpen()&&S.pre!=null?`<p class="window open" style="margin:8px 0 0">${windowName()}开放中，还剩 ${windowLeft()} 天</p>`:''}
  <div class="cal-train"><span class="muted">训练</span><div class="seg sm">${Object.entries(TRAIN).map(([k,v])=>`<button data-act="train" data-arg="${k}" aria-pressed="${S.training===k}" title="${v[1]}">${v[0]}</button>`).join('')}</div><span class="muted cal-hint">${TRAIN[S.training][1]}</span></div>
  ${today==='match'&&!played?'':`<div class="go" style="justify-content:flex-start;margin-top:10px"><button class="btn" data-act="nextDay">进入下一天</button><button class="btn primary" data-act="ff">快进到比赛日（${left} 天）</button></div>`}</section>`;
}
// a cup final in the last week: who won, at the top of the club page
function vHeadline(){
  const H=S.headline;if(!H||H.season!==S.season||S.day-H.day>7)return '';
  const mine=H.winner===S.my;
  return `<section class="headline ${mine?'mine':''}"><span class="hl-cup">🏆 ${H.cup}决赛</span>
  <b>${S.teams[H.h].name} ${H.score} ${S.teams[H.a].name}</b><span class="hl-win">${mine?'我们夺冠了！':`${S.teams[H.winner].name} 夺冠`}</span></section>`;
}
// the rounds of a cup still to come (or played) after we went out: kind, day and a note (the final names its winner)
function cupAfterExit(){
  const rows=[],C=S.cup,F=cupFmt(C);
  const outK=(C.rounds||[]).findIndex(rd=>rd.some(r=>(r.h===S.my||r.a===S.my)&&r.w!==S.my));
  if(!C.skipped&&outK>=0)for(let k=outK+1;k<F.names.length;k++)
    rows.push({day:cupDay(k),kind:`${CUP_NAME}·${stageName(k)}`,mark:`${CUP_NAME}${stageName(k)}`,note:k===F.names.length-1&&C.winner!=null?`冠军：${S.teams[C.winner].name}`:k<C.stage?'已赛':'本队已出局'});
  const I=S.intl;
  if(I&&intlIn()){
    // out in a knockout round: the rounds after it; out in the groups: the whole knockout
    const outJ=I.ko.findIndex(rd=>rd.some(r=>(r.h===S.my||r.a===S.my)&&r.w!==S.my));
    const qf=I.ko.length?I.ko[0].flatMap(r=>[r.h,r.a]):I.stage>=6?I.ties.flat():null,groupOut=!!qf&&!qf.includes(S.my);
    const from=outJ>=0?6+outJ+1:groupOut?6:null;
    if(from!=null)for(let k=from;k<intlStages();k++)
      rows.push({day:intlDay(k),kind:`${INTL_NAME}·${INTL_STAGES[k]}`,mark:`冠军杯${INTL_STAGES[k]}`,note:k===intlStages()-1&&I.winner!=null?`冠军：${S.teams[I.winner].name}`:k<I.stage?'已赛':'本队已出局'});
  }
  return rows;
}
function vHome(){
  const f=nextFix(),opp=S.teams[f.opp],ob=bestForm(opp,!f.home);
  const ms=strength(my(),S.lineup,S.tactic,f.home,S.boost>0?BOOST:0,S.formation);
  const os=strength(opp,ob.ids,tacFor(ob.r,rating(ms)),!f.home,0,ob.form);
  const H=S.teams[f.h],A=S.teams[f.a],iss=lineupIssues();
  const hs=f.home?rating(ms):rating(os),as=f.home?rating(os):rating(ms);
  // events and bids need an answer: first thing on a phone, top of the right column on a wide screen
  const ask=vEvent()+vOffer(),wide=isWide();
  return `${vHeadline()}${ask&&!wide?ask:''}<div class="cols"><div class="col">${vCalendar()}<section class="panel ${f.cup?'cupmatch':f.intl?'cupmatch intlmatch':''}"><h2>下一场：${fixLabel(f)}，${f.home?'主场':'客场'}${f.derby?' <span class="tag2 derby">宿敌之战</span>':''}</h2>
  ${f.derby?`<p class="muted" style="margin:-6px 0 8px;font-size:13px">收入翻倍，赢了全队士气高涨 2 场。</p>`:''}${f.cup||f.intl&&S.intl.stage>=6?`<p class="muted" style="margin:-6px 0 8px;font-size:13px">一场定胜负，平局直接点球大战。</p>`:f.intl?`<p class="muted" style="margin:-6px 0 8px;font-size:13px">小组赛：胜 ${money(INTL_PRIZE.win)}，平 ${money(INTL_PRIZE.draw)}，小组前两名进八强。比赛收入 1.5 倍。</p>`:''}
  <div class="fixture"><div><div class="t disp" style="--tc:${H.color}">${H.name}</div><div class="str">综合实力 <span class="num">${hs}</span></div></div>
  <div class="vs num">VS</div>
  <div><div class="t disp" style="--tc:${A.color}">${A.name}</div><div class="str">综合实力 <span class="num">${as}</span></div></div></div>
  ${(()=>{const t=tacFor(ob.r,rating(ms));return `<p class="opptac-line">对手预计打法 <b class="opptac">${TACT[t]}</b>${t==='att'&&S.tactic!=='def'?'<span class="muted"> · 他们会压上进攻，防守反击能多守住一些，还有反击加成</span>':t==='def'&&S.tactic==='def'?'<span class="muted"> · 双方都缩在后面，可能是一场闷战</span>':''}</p>`})()}
  ${vOppReport(opp,ob,tacFor(ob.r,rating(ms)))}
  <div class="go"><span class="muted" style="font-size:14px">阵型 ${S.formation}，战术${TACT[S.tactic]}</span>
  <button class="btn" data-act="oppXI">查看对手阵容</button><button class="btn" data-act="tab" data-arg="squad">调整阵容</button>
  ${isMatchDay()?'<button class="btn primary" data-act="play">开始比赛</button>':`<span class="muted" style="font-size:14px">${nextMatchDay()-S.day} 天后开赛</span>`}</div>
  ${iss.length?`<p class="warn" style="text-align:center">${iss.join('；')}，请先去阵容页调整。</p>`:''}</section>
  ${vBoard()}</div>
  <div class="col">${ask&&wide?ask:''}
  <section class="panel"><h2>俱乐部动态</h2><ul class="news">${S.news.map(n=>`<li><span class="tag">${n.r.replace(/^S\d+ /,'')}</span><span>${n.t}</span></li>`).join('')}</ul></section>
  ${vCheat()}
  ${vSavePanel()}</div></div>`;
}
// this season's board objectives and how we're tracking
function vBoard(){
  const g=S.goal,st=goalStatus();if(!g)return '';
  const c=cupReached(),cupTxt=g.cup<0?'':st.cup?'已达成':c<g.cup&&!cupAlive()?'未达成（已出局）':`进行中（目前${stageName(Math.min(c,cupFmt().names.length-1))}）`;
  return `<section class="panel"><h2>董事会目标 <span class="muted" style="font-weight:400;font-size:13px">教练声望 ${S.mgr?S.mgr.rep:0}（${mgrTitle(S.mgr?S.mgr.rep:0)}）</span></h2>
  <div class="cheat-row"><span class="${st.league?'goal-ok':'goal-no'}">${st.league?'✓':'·'}</span>联赛第 ${g.rank} 名以内（目前第 ${myRank()}）<span class="muted">奖金 ${money(GOAL_BONUS.league[my().div])}</span></div>
  ${g.cup<0?'':`<div class="cheat-row"><span class="${st.cup?'goal-ok':'goal-no'}">${st.cup?'✓':'·'}</span>${CUP_NAME}进入${stageName(g.cup)}：${cupTxt}<span class="muted">奖金 ${money(GOAL_BONUS.cup)}</span></div>`}</section>`;
}
// another club's squad: tap a name for details, or buy straight away at their asking price
function vTeamPage(tid){
  const t=S.teams[tid],rk=t.foreign?0:table(t.div).findIndex(r=>r.id===tid)+1,b=bestForm(t,true);
  const rows=PO.map(pos=>`<div class="group-h">${POS[pos]}</div><div class="mlist">`+t.players.filter(p=>p.pos===pos).sort((a,b)=>b.ovr-a.ovr).map(p=>{
    const why=buyBlock(p,t);
    return `<div class="mrow"><div style="min-width:0"><div class="pname"><button class="link" data-act="player" data-arg="${p.id}">${p.name}</button>${oneClub(p,t)?' <span class="tag2 oneclub" title="青训出身、只为这支球队效力的传奇，不会转会">一人一城</span>':loyal(p,t)?' <span class="tag2 loyal" title="这支球队青训出身，效力多年，不会转会">忠诚</span>':''}${p.sig?` <span class="sig" style="display:inline">「${p.sig}」</span>`:''}</div>
      <div class="price">${p.age} 岁，${p.apps} 场 ${p.goals} 球 ${p.ast||0} 助${p.rn?`，评分 ${avgRating(p).toFixed(1)}`:''}${unavail(p)?'，伤停中':''}</div></div>
      <div><div class="ovr num">${p.ovr}</div><div class="potl">${p.age>23?`潜力 ${p.pot}`:'潜力 ?'}</div></div>
      <button class="btn small primary" data-act="bid" data-arg="${p.id}" ${why?`disabled title="${why}"`:''}>${money(askPrice(p,t))}</button></div>`}).join('')+'</div>').join('');
  return `<section class="panel" style="border-left:6px solid ${t.color}"><h2>${t.name}</h2>
  <p class="muted" style="margin:-4px 0 0;font-size:14px">${t.foreign?`海外俱乐部 · ${INTL_NAME}`:`${DIVS[t.div]}第 ${rk} 名`} · 底蕴 ${t.rep}（${tierOf(t.rep)}）· 常用阵型 ${b.form} · ${t.players.length} 人${tid===S.rival?' · 宿敌（要价贵 30%）':''}</p></section>
  <section class="panel" style="padding:4px 10px"><p class="muted" style="font-size:13px;margin:8px 0">按钮上是对方要价：主力和核心球员要价更高。阵容不足 16 人或门将只剩 2 个时对方不卖。</p>${rows}</section>`;
}
// one player in detail, ours or another club's
// the player dialog is a native <dialog> opened with showModal() after each render: the browser keeps focus
// inside it, makes the page behind inert and handles Escape (see the 'cancel' listener in main.js)
function vModal(){
  const t=UI.modal.type;
  return `<dialog class="modal ${t==='opp'||t==='rules'||t==='takers'?'wide':''}" aria-labelledby="mtitle">${t==='opp'?vOppXI():t==='rules'?vRules():t==='takers'?vTakersModal():vPlayer(UI.modal.id)}</dialog>`;
}
// how the game works, in plain words; the numbers come from the game's own settings
function vRules(){
  const sec=(h,items)=>`<section class="rule"><h3>${h}</h3><ul>${items.map(i=>`<li>${i}</li>`).join('')}</ul></section>`;
  return `<section class="panel"><div class="mhead"><h2 id="mtitle">规则说明</h2><button class="btn small mclose" data-act="closeModal" aria-label="关闭">✕</button></div>
  <div class="rules">
  <p style="margin:0 0 10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn small" data-act="guide" data-arg="again">重看新手引导</button><button class="btn small" data-act="sound">音效：${soundOn()?'开':'关'}</button></p>
  <p class="muted" style="font-size:12px;margin:0 0 10px">音效：进球与夺冠的欢呼声来自 Gregor Quendel《Free Crowd Cheering Sounds》（CC BY 4.0，已剪辑），失球时全场的「噢——」来自 itmightgetloud 在圣保利 Millerntor 球场的录音（Sound Of Sankt Pauli，CC0）。</p>
  <p class="rule-diff">本档难度：<b>${diff().name}</b>（${diff().note}）。开局预算 ×${diff().budget}，比赛收入 ×${diff().income}，AI 球队水平 ${diff().ai>0?'+':''}${diff().ai}，我方伤病几率 ×${diff().inj}。</p>
  ${sec('赛季与日程',[`联赛是金字塔：${DIVS.map((dn,d)=>`${dn} ${DIV_SIZES[d]} 队`).join('、')}，各自主客场双循环（${DIVS.map((dn,d)=>`${dn} ${2*(DIV_SIZES[d]-1)} 轮`).join('、')}）。每级前 ${SWAP} 名升级、后 ${SWAP} 名降级。`,
    `一个赛季 ${weeks()} 周，联赛在周六进行，三个级别在同一天结束。甲级只有 18 轮，有 4 个周末轮空（在${INTL_NAME}周）；乙级每周六一轮；丙级 26 轮，有 4 轮放在周二（避开杯赛周）。`,
    `${CUP_NAME}决赛在联赛最后一轮的前一周，${INTL_NAME}决赛在联赛最后一轮的后一周（进了决赛，赛季就踢到决赛为止）。`,
    `哪一周你没有正式比赛（联赛轮空、杯赛已出局），那周六会自动安排一场热身赛，对手是海外球队，不计成绩、不吃牌。`,
    `季前一周：转会窗口开放，还有两场友谊赛（对手是本国其他级别的球队，不计成绩、不吃牌）。赛季过半后开 ${WINTER} 天冬窗，其余时间不能买卖球员。AI 球队大多在窗口最后几天才出手，所以想要的人最好早点下手；冬窗只是小修补，出手的球队不多。窗口结束前 3 天，会传出豪门盯上了哪位年轻天才，窗口最后一天他可能被签走（${diff().name}难度：${Math.round(diff().grab*100)}%）。`,
    `${CUP_NAME}是单场淘汰，平局直接点球大战。杯赛在周中，3 天后就是下一轮联赛。`,
    `${INTL_NAME}：16 队参加，本国派出甲级前两名和${CUP_NAME}冠军（冠军已在前两名时由甲级第三名替补），其余 13 队来自海外（每季从 ${FOREIGN.length} 支海外俱乐部里按实力抽签，强队更常出现；它们的底蕴会随冠军杯成绩升降）。4 个小组主客场双循环，前两名进八强，之后单场淘汰。比赛在周三，收入 1.5 倍；小组赛胜 ${money(INTL_PRIZE.win)}、平 ${money(INTL_PRIZE.draw)}，进八强 ${money(INTL_PRIZE.ko[0])}、四强 ${money(INTL_PRIZE.ko[1])}、决赛 ${money(INTL_PRIZE.ko[2])}，冠军 ${money(INTL_PRIZE.champion)}。海外球队不参加联赛和${CUP_NAME}，也不买卖球员。`])}
  ${sec('比赛怎么踢',['每分钟按双方「进攻对防守」的差距决定进球机会。实力强的一方机会更多，但强队也会输球，强队累了时弱队更有机会。',
    '进攻主要看前锋和中场，防守主要看后卫、门将和中场；主场略占优势。',
    `球员打非本职位置，能力打 ${Math.round(OOP*100)} 折；外场球员当门将（或门将踢外场）只剩一半。`,
    `能力达到 ${SIG_OVR} 的球员会领悟必杀技（名字旁的 ★），满 ${SIG_FADE} 岁的那个赛季会渐渐生疏。射手把射偏的机会变成进球，中场送出必进的直塞，后卫用身体挡下必进之球，门将扑出必进之球。`])}
  ${sec('战术与阵型',['全力进攻：进攻加成比防守代价大，实力占优时最能拿分，但更累。防守反击：防守更强、进攻更弱，对上全力进攻的对手还有反击加成，实力处于下风时最划算。平衡：波动最小。',
    'AI 实力明显占优时会全力进攻，处于下风时会防守反击；中场落后会改打全力进攻，领先会收缩。对手当前的打法在赛前和比赛中都看得到。',
    '后腰偏防守、多抢断；前腰偏进攻、更容易进球和助攻。阵型改变的是打法，不改变总实力。'])}
  ${sec('只属于你的加成',['中场可以训话一次：鼓舞（下半场进攻 +3）、冷静（防守 +3），或者怒吼赌一把（成功进攻 +5、防守 +2，失败攻防各 −2；教练声望越高越容易成功）。',
    `比赛第 75 分钟后落后，会触发「绝境爆发」：进攻提升（主场 +${DESPAIR.home}、客场 +${DESPAIR.away}）。`,
    `球探部 3 级以上，赛前情报会指出对方最薄弱的一线。阵型或战术针对它的话，进攻会有加成（比分板会亮出「针对弱点」）；怎么针对要自己琢磨，球探部升到 4、5 级后情报会说得更清楚。`,
    '第 75 分钟后还有「名帅光环」：教练声望越高，进攻加成越大，必杀技也越容易打出来。落后逆转取胜可以解锁「逆转之王」。'])}
  ${sec('体能与换人',['比赛中会消耗体能：中场跑得最多，前锋、后卫其次，门将几乎不累。体能 80 以上基本不影响发挥，越低越弱（70 约九折，60 约八折）。',
    `比赛中会有点球和禁区前的直接任意球。在阵容页或球员详情的「定位球设置」里，点球和任意球各可以排 ${TAKER_MAX} 个人选：由排在前面、而且在场上的人主罚；都不在场时，由场上最合适的人主罚（点球优先前锋，任意球优先中场，有必杀技的更优先）。`,
    `忠诚与一人一城：青训出身（开局时的年轻球员也算）、一直留在队里满 ${ONE_CLUB} 季的球员是「忠诚」球员，一半的球队挖角会被他们回绝。忠诚球员能力达到 ${ONE_CLUB_OVR} 即成为「一人一城」，称号终身保留：他们在主场上场时全队士气小幅提升（每人 +${ONE_CLUB_AURA}，最多 +${ONE_CLUB_AURA_MAX}），卖掉他们会让教练声望 -${ONE_CLUB_SALE_REP}。买来的球员不管多年轻都不算。AI 球队青训出身的球员里约三分之一会成为忠诚或一人一城，他们不会被挖走，你也买不到。`,
    `转会：直接出售只拿到身价的 85%；AI 球队主动报价通常是身价的 1.05–1.6 倍，但看中谁是随机的，大多在窗口的头几天，报价只保留到第二天（快进时收到报价会停下来）。在球员详情里「挂牌出售」，窗口期间就会常有球队专门为他报价（约身价的 ${LIST_RANGE[0]}–${LIST_RANGE[1]} 倍）。`,
    `首发设为自动时，阵容每天按体能更新；打开「自动轮换」，体能低于 ${ROTATE_AT} 的首发会让给同位置、能力最多低 ${ROTATE_GAP}、体能好得多的替补。`,
    `中场休息时，我方球员会恢复一点体能。每场最多换 ${SUBS} 人；自动换人从第 60 分钟起，把体能低于 ${TIRED}、而且替补更强的人换下；体能跌破 ${SPENT} 的球员不管能力多高都会被换下（受伤风险太大）。可以关掉自己来换。`,
    '同一次暂停里的换人在继续比赛前都可以改或撤销。',
    `赛后第一天是休息日（体能 +${DAY_REST}）；之后看训练安排：恢复训练 +${TRAIN_DAY.rest.cond}，常规训练 +${TRAIN_DAY.normal.cond}，高强度加练 +${TRAIN_DAY.hard.cond}（进步最快，但更容易受伤）。`])}
  ${sec('伤病与红黄牌',['越疲劳越容易受伤；理疗室能降低受伤风险、加快恢复。伤停按天计算，日程里会倒数。',
    `联赛、${CUP_NAME}、${INTL_NAME}的黄牌分开累计：同一项赛事累计 ${YC_BAN} 张黄牌，停赛该赛事的下一场（吃到第 ${YC_BAN} 张的那场照常踢完）。红牌停赛也只停同一项赛事，友谊赛和热身赛不受停赛影响。一场比赛吃到两张黄牌会当场被罚下，下一场也停赛；同一场里既集满累计黄牌又被罚下，停赛两场。友谊赛不出牌。`])}
  ${sec('评分与奖项',['评分 3–10 分，平均约 6.7：看能力、比赛结果、个人数据（传球、关键传球、抢断、拦截、过人、扑救），加上进球和助攻。',
    '上场不到 60 分钟，基础表现按时间折算；进球、助攻、扑救、红黄牌不管上场多久都全额计入。',
    '赛季末颁发最佳球员、最佳新秀、最佳门将、金靴、助攻王，并选出年度最佳阵容。最佳球员按「比同位置的人好多少」来评，所以各个位置都有机会。'])}
  ${sec('成长与老化',['训练和比赛都会让球员进步，越年轻、离潜力越远进步越快；训练场等级越高进步越快。',
    '33 岁起能力可能下滑，也可能退役（能力越高越能坚持），40 岁一定退役。在队效力够久或帮球队夺冠的退役球员会进入传奇名单。'])}
  ${sec('转会与俱乐部',[`一线队最多 ${SQUAD_MAX} 人，至少保留 14 人；${LOAN_AGE} 岁及以下的球员可以外租（新赛季长一岁后再算），租借期间不占名额。`,
    '球探部、理疗室、训练场、球场可以升级；青训营每个赛季会送来一批少年。董事会目标完成有奖金，教练声望够高会收到其他球队的执教邀请。',
    `每个赛季可以发动一次${CHEAT_CARD}。`])}
  </div></section>`;
}
// the next opponent's expected XI on a pitch, with their bench and who is missing. tactics and the weak spot
// come from the scout report (scout department level 3+)
function vOppXI(){
  const f=nextFix(),opp=S.teams[f.opp],ob=bestForm(opp,!f.home),xi=onPitch(opp,ob.ids).filter(Boolean);
  const ms=strength(my(),S.lineup,S.tactic,f.home,S.boost>0?BOOST:0,S.formation),tac=tacFor(ob.r,rating(ms));
  const field=pitchSpots(ob.ids,ob.form,opp).map(x=>x.p?tok(x.p,{style:`left:${x.x}%;top:${x.y}%`,role:x.role,static:true}):'').join('');
  const bench=opp.players.filter(p=>!ob.ids.includes(p.id)&&!unavail(p)).sort((a,b)=>b.ovr-a.ovr),out=opp.players.filter(unavail);
  const avg=Math.round(xi.reduce((s,p)=>s+p.ovr,0)/xi.length),cond=Math.round(xi.reduce((s,p)=>s+p.cond,0)/xi.length);
  return `<section class="panel"><div class="mhead"><h2 id="mtitle">${opp.name} 预计阵容</h2><button class="btn small mclose" data-act="closeModal" aria-label="关闭">✕</button></div>
  <p class="muted" style="margin:0 0 10px;font-size:13px">${fixLabel(f)}，${f.home?'我们主场':'我们客场'} · ${tierOf(opp.rep)} · 首发平均能力 ${avg} · 平均体能 ${cond} · 预计战术：${TACT[tac]}</p>
  <div class="oppgrid">${pitchBox(field,'对手预计首发',ob.form,{color:opp.color,note:`${ob.form} · ${TACT[tac]}`})}
  <div><div class="subh" style="margin-bottom:6px">替补</div>${bench.map(p=>`<div class="oprow"><span class="spos">${POS[p.pos]}</span><span>${p.name}${p.sig?' <i class="sig" style="font-style:normal">★</i>':''}</span><b class="num">${p.ovr}</b></div>`).join('')||'<span class="muted">没有替补</span>'}
  ${out.length?`<div class="subh" style="margin:10px 0 6px">缺阵</div>${out.map(p=>`<div class="oprow out"><span class="spos">${POS[p.pos]}</span><span>${p.name}</span><span class="muted">${p.inj?`伤停 ${p.inj} 天`:banned(p)?'停赛':'请假'}</span></div>`).join('')}`:''}
  ${facLv('scout')>=3?'':'<p class="muted" style="font-size:12px;margin:10px 0 0">球探部升到 3 级，赛前还能看到对手最薄弱的一线和王牌球员（4、5 级说得更详细）。</p>'}</div></div></section>`;
}
// a player's yellow cards toward a ban, by competition: 联赛 2/3 · 天穹杯 1/3
const ycNote=p=>Object.entries(p.ycc||{}).filter(([,n])=>n>0).map(([c,n])=>`${COMPS[c]} ${n}/${YC_BAN}`).join(' · ');
function vPlayer(id){
  const f=findAny(id);
  if(!f)return `<section class="panel"><div class="mhead"><h2 id="mtitle">球员详情</h2><button class="btn small mclose" data-act="closeModal" aria-label="关闭">✕</button></div><p class="muted" style="margin:0">这名球员已经不在联赛里了。</p></section>`;
  const {p,t}=f,mine=t.id===S.my,c=S.club[p.id]||{},hist=(p.hist||[]).concat([{s:S.season,o:p.ovr}]);
  const cell=(l,v)=>`<div class="pcell"><small>${l}</small><b>${v}</b></div>`;
  const status=[mine&&p.home===S.my?(oneClub(p,my())?`一人一城 · 效力第 ${seasonsAt(p)} 季`:loyal(p,my())?`忠诚 · 效力第 ${seasonsAt(p)} 季，能力达到 ${ONE_CLUB_OVR} 即成为一人一城`:`青训出身，在队第 ${seasonsAt(p)} 季，再 ${ONE_CLUB-seasonsAt(p)} 季成为忠诚`):'',p.inj?`伤停 ${p.inj} 天`:'',...Object.entries(p.bans||{}).filter(([,n])=>n>0).map(([c,n])=>`${COMPS[c]}停赛 ${n} 场`),p.away?'探亲中':'',p.loan?`租借至${loanLabel(p)}（${p.lapps||0} 场）`:'',unproven(p)?`未出道 ${careerApps(p)}/${YOUTH_PROVEN}`:''].filter(Boolean).join('，');
  const tk=k=>takerList(k).indexOf(p.id),TK={pen:'点球',fk:'任意球'};
  const actions=mine
    ?`${Object.entries(TK).map(([k,l])=>`<button class="btn small" data-act="taker" data-arg="${k}:${p.id}" aria-pressed="${tk(k)>=0}">${tk(k)>=0?`✓ ${l}第 ${tk(k)+1} 顺位（点击移出）`:`加入${l}人选`}</button>`).join('')}<button class="btn small" data-act="takers">定位球设置</button>
      ${p.loan?`<button class="btn small" data-act="recall" data-arg="${p.id}">召回</button>`:p.age<=LOAN_AGE?`<button class="btn small" data-act="loan" data-arg="${p.id}">外租（赛季结束回归）</button>`:`<button class="btn small" disabled title="只有 ${LOAN_AGE} 岁及以下的球员可以外租">外租（${LOAN_AGE} 岁及以下）</button>`}
      <button class="btn small" data-act="list" data-arg="${p.id}" aria-pressed="${!!p.listed}" title="挂牌后，转会窗口期间球队会专门为他报价（约身价的 ${LIST_RANGE[0]}–${LIST_RANGE[1]} 倍）">${p.listed?'✓ 挂牌中（点击撤下）':'挂牌出售'}</button>
      <button class="btn small danger" data-act="sell" data-arg="${p.id}" ${windowOpen()?'':`disabled title="${windowShut()}"`}>直接出售 ${money(sellPrice(p))}</button>`
    :(()=>{const why=buyBlock(p,t);return `<button class="btn small primary" data-act="bid" data-arg="${p.id}" ${why?'disabled':''}>以 ${money(askPrice(p,t))} 签下</button>${why?`<span class="muted" style="font-size:13px">${why}</span>`:''}`})();
  return `<section class="panel"><div class="mhead"><h2 id="mtitle">${p.name}${p.youth?' <span class="tag2 youth">青训</span>':''}</h2><button class="btn small mclose" data-act="closeModal" aria-label="关闭">✕</button></div>
  <p class="muted" style="margin:-4px 0 10px;font-size:14px">${POS[p.pos]}，${p.age} 岁，${t.name}${status?`。${status}`:''}</p>
  ${p.sig?`<p class="sig" style="margin:0 0 10px">必杀技「${p.sig}」</p>`:''}
  <div class="pgrid">${cell('能力',p.ovr)}${cell('潜力',mine||p.age>23?p.pot:'?')}${cell('体能',p.cond)}${cell('身价',money(mine?marketValue(p):value(p)))}</div>
  <h3>本赛季</h3><div class="pgrid">${cell('出场',p.apps)}${cell('进球',p.goals)}${cell('助攻',p.ast||0)}${cell('平均评分',p.rn?avgRating(p).toFixed(2):'—')}${cell('黄牌',`${p.ycs||0}${ycNote(p)?` <small class="muted">（停赛累计：${ycNote(p)}）</small>`:''}`)}${cell('红牌',p.rcs||0)}</div>
  ${p.ss&&p.rn?`<div class="pgrid">${cell('传球成功率',p.ss.pas?Math.round(p.ss.ok/p.ss.pas*100)+'%':'—')}${p.pos==='GK'?cell('场均扑救',((p.ss.sv||0)/p.rn).toFixed(1)):cell('场均关键传球',(p.ss.kp/p.rn).toFixed(1))+cell('场均抢断+拦截',((p.ss.tkl+p.ss.int)/p.rn).toFixed(1))+cell('场均过人',(p.ss.drb/p.rn).toFixed(1))}</div>`:''}
  ${mine?`<h3>在队生涯</h3><div class="pgrid">${cell('效力赛季',(c.seasons||0)+1)}${cell('出场',(c.apps||0)+unbanked(p,'apps'))}${cell('进球',(c.goals||0)+unbanked(p,'goals'))}${cell('助攻',(c.ast||0)+unbanked(p,'ast'))}${cell('租借出场',(c.lapps||0)+unbanked(p,'lapps'))}${cell('红黄牌',`${(c.ycs||0)+unbanked(p,'ycs')} 黄 ${(c.rcs||0)+unbanked(p,'rcs')} 红`)}</div>
  ${(c.titles||[]).length?`<p style="margin:4px 0 0;font-size:13px">🏆 ${c.titles.join('、')}</p>`:''}${isLegend(c)?'<p class="sig" style="margin:4px 0 0">已达到传奇标准：在队退役就会载入史册</p>':''}
  <h3>能力变化</h3><p style="margin:0;font-size:14px">${hist.map(h=>`第 ${h.s} 季 <b class="num" style="font-size:18px">${h.o}</b>`).join(' → ')}</p>`:''}
  <div class="go" style="justify-content:flex-start">${actions}</div></section>`;
}
// export / load: straight into a chosen folder where the browser allows it, otherwise download / file picker
function vSavePanel(){
  const dirOK=canPickDir(),F=UI.saveFiles;
  return `<details class="panel fold" data-fold="${F?'saves-list':'saves'}" ${F?'open':''}><summary><h2>存档文件</h2></summary>
  <p class="muted" style="margin:0 0 10px;font-size:14px">${dirOK
    ?`已自动保存在这个浏览器里。导出会写进你选的存档文件夹${UI.dirName?`（现在是「${esc(UI.dirName)}」）`:'（第一次导出时选一次，例如项目里的 saves 文件夹）'}。`
    :'已自动保存在这个浏览器里。这个浏览器只能把导出文件下载到默认的下载文件夹（Chrome 或 Edge 可以直接存进指定文件夹）。'}</p>
  <div class="go" style="justify-content:flex-start;margin-top:0">
    <button class="btn" data-act="exportSave">${dirOK?'导出到存档文件夹':'导出存档文件'}</button>
    ${dirOK?'<button class="btn" data-act="listSaves">从存档文件夹读取</button><button class="btn small" data-act="pickDir">更换文件夹</button>':''}
    <button class="btn${dirOK?' small':''}" data-act="importSave">从其他位置选择文件</button></div>
  ${F?vSaveList():''}</details>`;
}
// escapes text that comes from outside the game (file and folder names) before it goes into HTML
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
function vSaveList(){
  const F=UI.saveFiles,time=t=>new Date(t).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
  return `<div class="savelist">${F.length?F.map(f=>`<div class="cheat-row"><button class="btn small" data-act="loadDir" data-arg="${esc(f.name)}">读取</button><span>${esc(f.name)}</span><span class="muted" style="font-size:12px">${time(f.time)}</span></div>`).join(''):'<p class="muted" style="margin:0">这个文件夹里还没有存档。</p>'}</div>`;
}
function vEvent(){
  if(!S.event)return '';
  const E=EVENTS[S.event.k],p=eventPlayer();
  if(E.who&&!p)return '';
  return `<section class="panel event" role="status"><h2>突发事件</h2><p style="margin:-4px 0 10px">${E.text(p)}</p>
  ${E.opts.map((o,i)=>`<div class="cheat-row"><button class="btn small ${i?'':'primary'}" data-act="event" data-arg="${i}" ${o[3]&&!o[3]()?'disabled':''}>${o[0]}</button><span class="muted">${o[1]}</span></div>`).join('')}</section>`;
}
function vOffer(){
  const list=(S.offers||[]).map(o=>({o,p:findP(o.pid)})).filter(x=>x.p);
  if(!list.length)return '';
  return `<section class="panel offer"><h2>转会报价${list.length>1?` <span class="muted" style="font-weight:400;font-size:14px">${list.length} 份</span>`:''}</h2>
  ${list.map(({o,p})=>`<div class="offer-one"><p style="margin:0 0 8px">${offerClub(o).name}（${o.club>=0?divName(S.teams[o.club]):'海外联赛'}）带着 <b>${money(o.amount)}</b> 的契约书前来，想要带走 <b>${p.name}</b>（${POS[p.pos]}，能力 ${p.ovr}，${p.age} 岁）。
  <span class="muted">他的身价约 ${money(marketValue(p))}${o.listed?'（挂牌出售中）':''}。</span></p>
  <div class="go" style="justify-content:flex-start;margin-top:0"><button class="btn primary" data-act="offerYes" data-arg="${p.id}">接受</button><button class="btn" data-act="offerNo" data-arg="${p.id}">拒绝</button></div></div>`).join('')}
  <p class="muted" style="font-size:13px;margin:8px 0 0">报价只保留到明天。</p></section>`;
}
const cheatBtn=k=>`<button class="btn small" data-act="cheat" data-arg="${k}">「${CHEAT_INFO[k][0]}」</button>`;
function vCheat(){
  if(S.cheatUsed)return `<section class="panel cheat used fold-sum"><h2>${CHEAT_CARD} <span class="muted" style="font-weight:400;font-size:13px">封印已解，下个赛季再度觉醒</span></h2></section>`;
  return `<details class="panel cheat fold" data-fold="cheat"><summary><h2>${CHEAT_CARD} <span class="tag2" style="background:var(--amber);color:#3a2a00">本赛季可发动 1 次</span></h2></summary>
  ${['heal','scout','cash'].map(k=>`<div class="cheat-row">${cheatBtn(k)}<span class="muted">${CHEAT_INFO[k][1]}</span></div>`).join('')}
  <div class="cheat-row"><span class="btn small" aria-disabled="true" style="opacity:.5;cursor:default">「${CHEAT_INFO.redo[0]}」</span><span class="muted">${CHEAT_INFO.redo[1]}（终场时发动）</span></div></details>`;
}
// players out on loan: not in the 22, listed on their own with how the loan is going
function vLoans(){
  const L=my().players.filter(p=>p.loan);
  if(!L.length)return '';
  return `<section class="panel"><h2>租借在外 <span class="muted" style="font-weight:400;font-size:14px">${L.length} 人，不占一线队名额</span></h2>
  ${L.map(p=>{const d=p.ovr-(p.loan.ovr0??p.ovr);return `<div class="mrow"><div style="min-width:0"><div class="pname"><button class="link" data-act="player" data-arg="${p.id}">${p.name}</button> <span class="muted" style="font-weight:400">${POS[p.pos]}，${p.age} 岁</span></div>
    <div class="price">租借至${loanLabel(p)} · 本季出场 ${p.lapps||0} 场${d?` · 租借以来能力 ${d>0?'+':''}${d}`:''}</div></div>
    <div><div class="ovr num">${p.ovr}</div><div class="potl">潜力 ${p.pot}</div></div>
    <button class="btn small" data-act="recall" data-arg="${p.id}" ${squadFull()?`disabled title="一线队已满 ${SQUAD_MAX} 人"`:''}>召回</button></div>`}).join('')}
  <p class="muted" style="margin:8px 0 0;font-size:12px">赛季结束时自动回归。召回需要一线队有空位。</p></section>`;
}
// what the chosen formation's midfield does, for the ones with holding or attacking midfielders
function formNote(form){
  const f=FORMS[form],bits=[f.dm&&`${f.dm} 名后腰偏防守、多抢断`,f.am&&`${f.am} 名前腰更容易进球和助攻`].filter(Boolean);
  return bits.length?`中场里 ${bits.join('，')}（由中场球员担任）`:'阵型决定 11 个位置，球场上按位置排';
}
// the set-piece dialog: for penalties and free kicks, an order of up to TAKER_MAX; every first-team player with his
// chances (a penalty against an average keeper, a direct free kick), best first
function vTakersModal(){
  const avgGK={ovr:70},pct=v=>Math.round(v*100)+'%';
  const kinds=[['pen','点球','对上普通门将的命中率',p=>penOdds(p,avgGK)],['fk','直接任意球','直接破门率',p=>fkOdds(p,null)]];
  const squad=my().players.filter(p=>!p.loan&&p.pos!=='GK');
  return `<section class="panel"><div class="mhead"><h2 id="mtitle">定位球主罚</h2><button class="btn small mclose" data-act="closeModal" aria-label="关闭">✕</button></div>
  <p class="muted" style="margin:-4px 0 10px;font-size:13px">每种最多排 ${TAKER_MAX} 个人选：比赛中由排在前面、而且在场上的人主罚；都不在场时，由场上最合适的人主罚（点球优先前锋，任意球优先中场，有必杀技的更优先）。点球员加入或移出。</p>
  <div class="tk-cols">${kinds.map(([k,l,note,odds])=>{const L=takerList(k),list=[...squad].sort((a,b)=>odds(b)-odds(a));
    return `<div class="tk-col"><div class="tk-head"><h3>${l}</h3>${L.length?`<button class="btn small" data-act="takerClear" data-arg="${k}">清空（改回自动）</button>`:'<span class="muted" style="font-size:13px">现在：自动</span>'}</div>
    <ol class="tk-order">${Array.from({length:TAKER_MAX},(_,i)=>{const p=L[i]!=null&&findP(L[i]);return `<li>${p?`<b>${p.name}</b> <span class="muted">${POS[p.pos]} ${p.ovr}</span>`:'<span class="muted">—</span>'}</li>`}).join('')}</ol>
    <div class="tk-list" data-scroll="tk-${k}"><div class="tk-row tk-th"><span>球员</span><span>${note}</span></div>${list.map(p=>{const i=L.indexOf(p.id);
      return `<button class="tk-row ${i>=0?'on':''}" data-act="taker" data-arg="${k}:${p.id}" aria-pressed="${i>=0}"><span>${i>=0?`<b class="tk-n">${i+1}</b>`:''}${p.name} <span class="muted">${POS[p.pos]} ${p.ovr}${p.sig?' ★':''}${unavail(p)?' · 缺阵':''}</span></span><span class="num">${pct(odds(p))}</span></button>`}).join('')}</div></div>`}).join('')}</div></section>`;
}
function vSquad(){
  UI.xiLvl=xiLevel(my());  // for the retirement hints in the list
  const t=my(),on=new Set(S.lineup),iss=lineupIssues();
  const rows=PO.map(pos=>{
    const ps=t.players.filter(p=>p.pos===pos&&!p.loan).sort((a,b)=>b.ovr-a.ovr);
    return `<div class="group-h">${POS[pos]}（${ps.length}）</div>`+ps.map(p=>`
    <div class="prow ${on.has(p.id)?'on':''} ${unavail(p)?'inj':''}" data-act="toggle" data-arg="${p.id}">
      <button class="tick" data-act="toggle" data-arg="${p.id}" aria-pressed="${on.has(p.id)}" aria-label="${on.has(p.id)?'移出首发':'加入首发'}：${p.name}">${on.has(p.id)?'✓':''}</button>
      <div style="min-width:0"><div class="pname"><button class="link" data-act="player" data-arg="${p.id}">${p.name}</button>${gem(p)}${oneClub(p,my())?'<span class="tag2 oneclub" title="青训出身，只为本队效力满 '+ONE_CLUB+' 季，能力达到 '+ONE_CLUB_OVR+'">一人一城</span>':loyal(p,my())?'<span class="tag2 loyal" title="青训出身，只为本队效力满 '+ONE_CLUB+' 季；能力达到 '+ONE_CLUB_OVR+' 即成为一人一城">忠诚</span>':''}${p.youth?' <span class="tag2 youth">青训</span>':''}${unproven(p)?` <span class="muted" style="font-size:11px;font-weight:400" title="出场满 ${YOUTH_PROVEN} 场或下赛季开始时出道，之前买家只按当前能力出价">未出道 ${careerApps(p)}/${YOUTH_PROVEN}</span>`:''}</div>
      <div class="pmeta">${p.sig?`<span class="sig" style="display:inline">★</span> `:''}${p.age} 岁，${p.apps} 场 ${p.goals} 球 ${p.ast||0} 助${p.rn?`，评分 ${avgRating(p).toFixed(1)}`:''}${(()=>{const [c,n]=Object.entries(p.ycc||{}).sort((a,b)=>b[1]-a[1])[0]||[];return n?`，<span class="${n>=YC_BAN-1?'ycwarn':''}" title="${COMPS[c]}再吃 ${YC_BAN-n} 张黄牌停赛一场">${COMPS[c]}黄牌 ${n}/${YC_BAN}</span>`:''})()}${p.listed?' <span class="tag2 listed">挂牌</span>':''}${p.inj?` <span class="injtag">伤停 ${p.inj} 天</span>`:''}${banned(p)?` <span class="injtag">停赛 ${p.bans[ourComp()]} 场</span>`:''}${p.away?` <span class="injtag">探亲 ${p.away} 轮</span>`:''}${p.loan?` <span class="loantag">租借至${p.loan.club} · ${p.lapps||0} 场</span>`:''}${!unavail(p)&&p.cond<60?' <span class="risktag">伤病风险高</span>':''}${retireChance({...p,age:p.age+1},UI.xiLvl)>=.3?` <span class="muted" style="font-size:11px" title="赛季结束时有 ${Math.round(retireChance({...p,age:p.age+1},UI.xiLvl)*100)}% 机会退役">可能退役</span>`:''}</div>
</div>
      <div><div class="ovr num">${p.ovr}${gainTag(p)}</div><div class="potl">潜力 ${p.pot}</div></div>
      <div><div class="bar ${p.cond<TIRED?'low':''}"><i style="width:${p.cond}%"></i></div><div class="barlbl">体能 ${p.cond}</div></div>
      <div class="act"><button class="btn small danger" data-act="sell" data-arg="${p.id}" ${windowOpen()?'':`disabled title="${windowShut()}"`}>出售 ${money(sellPrice(p))}</button></div>
    </div>`).join('');
  }).join('');
  return `<section class="panel"><div class="toolbar">
  <div><label>阵型</label><div class="seg">${Object.keys(FORMS).map(f=>`<button data-act="form" data-arg="${f}" aria-pressed="${S.formation===f}">${f}</button>`).join('')}</div></div>
  <div><label>战术</label><div class="seg">${Object.entries(TACT).map(([k,v])=>`<button data-act="tac" data-arg="${k}" aria-pressed="${S.tactic===k}">${v}</button>`).join('')}</div></div>
  </div>
  <div class="toolbar" style="align-items:center;margin:0">
  <div class="count">首发 <span class="num">${lineupCount()}</span>/11</div>
  <button class="btn" data-act="auto">按 ${S.formation} 自动选人</button>
  <span class="xi-mode ${S.autoXI!==false?'auto':''}" title="${S.autoXI!==false?'每场赛后都按最佳阵容重新安排，伤愈的主力会自动回到首发':'保留你的安排，只在有人缺阵时自动补位；点「自动选人」恢复自动'}">${S.autoXI!==false?'首发：自动':'首发：手动'}</span>
  <button class="btn small" data-act="rotate" aria-pressed="${S.rotate!==false}" title="自动首发时：体能低于 ${ROTATE_AT} 的首发，换上同位置、能力最多低 ${ROTATE_GAP}、体能更好的替补">自动轮换：${S.rotate!==false?'开':'关'}</button>
  <button class="btn small" data-act="takers" title="点球和任意球由谁主罚">定位球设置</button>
  ${iss.length?`<span class="warn">${iss[0]}</span>`:`<span class="muted" style="font-size:14px">${formNote(S.formation)}</span>`}
  </div></section>
  <div class="cols squad"><div class="col">${vPitch()}</div>
  <div class="col"><section class="panel" style="padding:4px 6px"><h2 style="margin:10px 10px 0">一线队 <span class="muted" style="font-weight:400;font-size:14px">${squadSize()}/${SQUAD_MAX} · 点名字看详情</span></h2>${rows}</section>
  ${vLoans()}</div></div>`;
}
// the XI drawn on a pitch, attacking upwards. every slot of the formation gets a spot, so the shape always matches
// the formation; the tactic pushes the outfield lines up or down; wide slots in back/mid lines of 4+ sit a bit higher
// Malay and Indian players go by their given name, Western ones by their surname (like 「席尔瓦」 on a shirt)
const EU_SET=new Set(EU_SUR);
const shortName=n=>{const [a,b]=n.split('·');return b&&EU_SET.has(b)?b:a};
// the short name, unique within his club: with two 阿米尔 in the squad they show as 阿米尔·阿 and 阿米尔·拉
// (two Western players with the same surname get their first name's initial: 卡·席尔瓦); still the same: full name
function pName(p){
  const s=shortName(p.name),t=S.teams.find(t=>t.players.includes(p));
  const twins=t?t.players.filter(q=>q!==p&&shortName(q.name)===s):[];if(!twins.length)return s;
  const longer=n=>{const [a,b]=n.split('·');return !b?n:EU_SET.has(b)?a[0]+'·'+b:a+'·'+b[0]};
  return twins.some(q=>longer(q.name)===longer(p.name))?p.name:longer(p.name);
}
const PITCH_Y={FW:16,AM:29,MF:43,DM:53,DF:68,GK:89};
// one row per line, holding and attacking midfielders on rows of their own
function pitchSpots(ids,form,team){
  const find=team?id=>team.players.find(p=>p.id===id):findP;
  const tac=M&&!M.done?M.tac:S.tactic,roles=slotRoles(form),lines=slotLines(form),shift=tac==='att'?-5:tac==='def'?5:0,spots=[];
  Object.keys(PITCH_Y).reverse().forEach(line=>{
    const idx=lines.map((r,i)=>r===line?i:-1).filter(i=>i>=0),n=idx.length;
    const gap=n<=2?28:Math.min(24,80/(n-1));
    idx.forEach((slot,k)=>{
      const x=50+(k-(n-1)/2)*gap,w=(x-50)/40;
      const y=PITCH_Y[line]+(line==='GK'?0:shift)-(n>=4&&(line==='DF'||line==='MF')?6*w*w:0);
      spots.push({slot,role:roles[slot],line,p:ids[slot]!=null?find(ids[slot]):null,x,y});
    });
  });
  return spots;
}
// o: style, act + arg (default: toggle this player), cls, marks (extra badges after the name), role (the slot's role)
function tok(p,o={}){
  const oop=o.role&&p.pos!==o.role;
  if(o.static)return `<span class="tok ${unavail(p)?'out':''}" style="${o.style||''}" title="${p.name}"><span class="tc num ${p.cond<TIRED?'low':''}">${p.ovr}</span><span class="tn">${pName(p)}${p.sig?'<i>★</i>':''}</span><span class="tb"><i style="width:${p.cond}%"></i></span><small class="tcond">${Math.round(p.cond)}</small></span>`;
  return `<button class="tok ${unavail(p)?'out':''} ${oop?'oop':''} ${o.cls||''}" style="${o.style||''}" data-act="${o.act||'toggle'}" data-arg="${o.arg??p.id}" data-flip="p${p.id}" title="${p.name}${oop?`（本职${POS[p.pos]}，打${POS[o.role]}）`:''}">
    <span class="tc num ${p.cond<TIRED?'low':''}">${p.ovr}</span><span class="tn">${oop?`<b class="mk oopk">${POS[p.pos][0]}</b>`:''}${pName(p)}${p.sig?'<i>★</i>':''}${o.marks||''}</span>
    <span class="tb"><i style="width:${p.cond}%"></i></span>${o.cond?`<small class="tcond">${Math.round(p.cond)}</small>`:''}</button>`;
}
const emptySlot=(s,act,sel)=>`<button class="tok empty ${sel?'sel':''}" style="left:${s.x}%;top:${s.y}%" data-act="${act}" data-arg="${s.slot}" title="空位：${LINE_NAME[s.line]||POS[s.role]}"><span class="tc">${(LINE_NAME[s.line]||POS[s.role])[0]}</span><span class="tn">空位</span></button>`;
// o.color: the club whose shirts are drawn (default ours); o.note: the corner label (default formation · our tactic)
const pitchBox=(inner,label,form,o={})=>`<div class="pitch" style="--team:${o.color||my().color}" aria-label="${label}">
    <div class="pl half"></div><div class="pl circle"></div><div class="pl box top"></div><div class="pl box bot"></div>
    ${inner}<span class="pitch-note">${o.note??`${form} · ${TACT[M&&!M.done?M.tac:S.tactic]}`}</span></div>`;
function vPitch(){
  const bench=my().players.filter(p=>!S.lineup.includes(p.id)&&!p.loan).sort((a,b)=>unavail(a)-unavail(b)||PO.indexOf(a.pos)-PO.indexOf(b.pos)||b.ovr-a.ovr);
  const sel=UI.selSlot,roles=slotRoles(S.formation),selP=sel!=null&&S.lineup[sel]!=null?findP(S.lineup[sel]):null;
  const inner=pitchSpots(S.lineup,S.formation).map(s=>s.p
    ?tok(s.p,{style:`left:${s.x}%;top:${s.y}%`,act:'slot',arg:s.slot,role:s.role,cls:sel===s.slot?'sel':''})
    :emptySlot(s,'slot',sel===s.slot)).join('');
  const hint=sel==null?'点位置选中，再点另一个位置互换，或点替补换上。'
    :selP?`已选中 ${selP.name}：点另一个位置互换、点替补换上，再点他一次移出首发。`
    :`已选中${POS[roles[sel]]}空位：点替补换上。`;
  const oop=outOfPos();
  return `<section class="panel"><p class="muted" style="margin:0 0 10px;font-size:13px">${hint}</p>${pitchBox(inner,'首发阵容',S.formation)}
  ${(()=>{const gk=S.lineup[0]!=null&&findP(S.lineup[0]),emg=gk&&gk.pos!=='GK'?gk:null,rest=oop.filter(p=>p!==emg);
    return (emg?`<p class="oopnote">没有可用的门将，${emg.name} 临时客串门将，能力只有 50%。可以召回租借在外的门将，或从市场签一个。</p>`:'')
      +(rest.length?`<p class="oopnote">${rest.map(p=>p.name).join('、')} 打非本职位置，能力打 ${Math.round(OOP*100)}% 折扣。</p>`:'')})()}
  <h3 style="margin:14px 0 8px">替补席</h3>
  <div class="bench">${bench.map(p=>`<div class="bslot"><small>${POS[p.pos]}${p.inj?' · 伤':banned(p)?' · 停赛':p.away?' · 探亲':p.loan?' · 租借':''}</small>${tok(p,{act:'bench'})}</div>`).join('')||'<span class="muted">没有替补</span>'}</div></section>`;
}
// switcher: show the division picker (the 积分榜 tab); without it the given division is shown as-is (season end)
// a leaderboard: medals for the top three, the club's colour, and a bar against the leader (scale maps a value to
// what the bar measures, e.g. rating above 5). names open the player dialog
// several leaderboards in one panel with a switch (the choice is remembered per division in UI.lb)
function vBoards(div,boards){
  const pick=UI.lb&&typeof UI.lb==='object'?UI.lb[div]:null,cur=boards.find(b=>b[0]===pick)||boards[0];
  const sw=`<div class="seg sm lb-switch">${boards.map(([k,l])=>`<button data-act="lb" data-arg="${div}:${k}" aria-pressed="${k===cur[0]}">${l}</button>`).join('')}</div>`;
  return cur[2]().replace('</h2>','</h2>'+sw)||`<section class="panel">${sw}<p class="muted" style="margin:0">还没有数据。</p></section>`;
}
function vLeaders(title,note,rows,scale){
  if(!rows.length)return '';
  const top=Math.max(...rows.map(r=>scale(r.v)),.01);
  return `<section class="panel lb"><h2>${title}${note?` <span class="muted" style="font-weight:400;font-size:13px">${note}</span>`:''}</h2><ol class="lb-list">
  ${rows.map((r,i)=>`<li class="lb-row ${i<3?'m'+(i+1):''} ${r.t.id===S.my?'mine':''}" style="--c:${r.t.color}">
    <span class="lb-rank num">${i+1}</span>
    <div class="lb-who"><div class="lb-name"><button class="link" data-act="player" data-arg="${r.p.id}">${r.p.name}</button></div>
      <small>${r.t.short} · ${POS[r.p.pos]} · ${r.sub}</small>
      <span class="lb-bar" aria-hidden="true"><i style="width:${Math.max(4,Math.round(scale(r.v)/top*100))}%"></i></span></div>
    <b class="lb-val num">${r.label}</b></li>`).join('')}</ol></section>`;
}
// a division's table with the promotion / relegation places marked
// 甲级's places in next season's 天际冠军杯: the top two, and the 天穹杯 winner, or 3rd when the cup winner is already
// in the top two (until the cup is decided, 3rd is marked as a maybe)
function intlPlaces(T){
  const top=T.map(r=>r.id),cw=S.cup&&S.cup.winner,sure=new Set(top.slice(0,2));let maybe=null,cup=null;
  if(cw==null)maybe=top[2];
  else{const e=intlEntrants(top,cw);e.forEach(id=>sure.add(id));if(e[2]===cw&&!top.slice(0,2).includes(cw))cup=cw}
  return {sure,maybe,cup};
}
function standings(div){
  const T=table(div),Q=div===0?intlPlaces(T):null,cupW=Q&&Q.cup!=null?S.teams[Q.cup]:null;
  const legend=[Q?`<span class="zl intl">前 2 名获得下赛季${INTL_NAME}资格</span>`:'',
    Q&&Q.maybe!=null?`<span class="zl maybe">第 3 名：${CUP_NAME}冠军已在前两名时递补</span>`:'',
    cupW&&cupW.div!==0?`<span class="zl intl">${CUP_NAME}冠军 ${cupW.name} 也获得资格</span>`:'',
    div>0?`<span class="zl up">前 ${SWAP} 名升级</span>`:'',div<DIVS.length-1?`<span class="zl down">后 ${SWAP} 名降级</span>`:''].join('');
  const qcls=id=>!Q?'':Q.sure.has(id)?'intl':Q.maybe===id?'intl-maybe':'';
  const qtag=id=>Q&&Q.cup===id?` <span class="tag2 intlq" title="${CUP_NAME}冠军，获得${INTL_NAME}资格">杯赛冠军</span>`:'';
  return `<div class="tw"><table>
  <thead><tr><th>#</th><th>球队</th><th>场</th><th>胜</th><th>平</th><th>负</th><th>进/失</th><th>积分</th></tr></thead>
  <tbody>${T.map((r,i)=>`<tr class="${r.id===S.my?'me':''} ${zone(div,i+1)} ${qcls(r.id)}"><td>${i+1}</td><td><span class="dot" style="background:${r.color}"></span>${r.id===S.my?r.name:`<button class="link" data-act="team" data-arg="${r.id}">${r.name}</button>${tierTag(S.teams[r.id])}`}${qtag(r.id)}${r.id===S.rival?' <span class="tag2 derby">宿敌</span>':''}</td>
  <td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf}:${r.ga}</td><td class="pts">${r.pts}</td></tr>`).join('')}</tbody></table></div><p class="legend">${legend}</p>`;
}
function vTable(div,switcher=true){
  if(div===undefined)div=UI.div??my().div;
  const res=S.results[div],last=res[res.length-1];
  const sc=S.teams.filter(t=>t.div===div).flatMap(t=>t.players.filter(p=>p.goals>0).map(p=>({p,t}))).sort((a,b)=>b.p.goals-a.p.goals||a.p.apps-b.p.apps).slice(0,8);
  const as=S.teams.filter(t=>t.div===div).flatMap(t=>t.players.filter(p=>p.ast>0).map(p=>({p,t}))).sort((a,b)=>b.p.ast-a.p.ast||b.p.goals-a.p.goals).slice(0,8);
  const cd=S.teams.filter(t=>t.div===div).flatMap(t=>t.players.filter(p=>p.ycs||p.rcs).map(p=>({p,t}))).sort((a,b)=>((b.p.rcs||0)*3+(b.p.ycs||0))-((a.p.rcs||0)*3+(a.p.ycs||0))).slice(0,8);
  const RL_MIN=Math.max(1,Math.floor(res.length/2)),rl=S.teams.filter(t=>t.div===div).flatMap(t=>t.players.filter(p=>p.rn>=RL_MIN).map(p=>({p,t}))).sort((a,b)=>avgRating(b.p)-avgRating(a.p)).slice(0,8);
  const pickDiv=switcher?`<div class="seg sm" style="margin-bottom:10px">${DIVS.map((dn,d)=>!divSize(d)?'':`<button data-act="div" data-arg="${d}" aria-pressed="${d===div}">${dn}${d===my().div?'（本队）':''}</button>`).join('')}</div>`:'';
  return `<div class="cols"><div class="col"><section class="panel"><h2>${DIVS[div]}积分榜</h2>${pickDiv}${standings(div)}</section>
  ${last?`<section class="panel"><h2>上一轮赛果</h2>${last.map(r=>`<div class="res"><span>${S.teams[r.h].name}</span><span class="num">${r.hg} : ${r.ag}</span><span>${S.teams[r.a].name}</span></div>`).join('')}</section>`:''}</div><div class="col">
  ${vBoards(div,[['goals','射手',()=>vLeaders('射手榜','',sc.map(x=>({p:x.p,t:x.t,v:x.p.goals,label:String(x.p.goals),sub:`${x.p.apps} 场`})),v=>v)],['ast','助攻',()=>vLeaders('助攻榜','',as.map(x=>({p:x.p,t:x.t,v:x.p.ast,label:String(x.p.ast),sub:`${x.p.goals} 球 · ${x.p.apps} 场`})),v=>v)],['rating','评分',()=>vLeaders('评分榜',`出场 ${RL_MIN} 场以上`,rl.map(x=>({p:x.p,t:x.t,v:avgRating(x.p),label:avgRating(x.p).toFixed(2),sub:`${x.p.rn} 场`})),v=>v-5)],['cards','红黄牌',()=>vLeaders('红黄牌榜','红牌算 3 分',cd.map(x=>({p:x.p,t:x.t,v:(x.p.rcs||0)*3+(x.p.ycs||0),label:`${x.p.ycs||0}黄${x.p.rcs?` ${x.p.rcs}红`:''}`,sub:`${x.p.apps} 场`})),v=>v)]])}</div></div>`;
}
const gainTag=p=>p.gain>0?`<span class="gain">+${p.gain}</span>`:p.gain<0?`<span class="gain neg">${p.gain}</span>`:'';
const shownPot=p=>p.scout?p.scout.est:p.pot;
const gem=p=>p.age<=21&&shownPot(p)>=84?'<span class="gem">天才</span>':'';
const potText=p=>!p.scout||p.scout.conf==='high'?`潜力 ${p.pot}`:`潜力 ${p.scout.lo}~${p.scout.hi}`;
const pctR=v=>clamp((v-35)/(95-35)*100,0,100);
// the "medical" popup after signing a young player, revealing his true potential
function vReveal(){
  const rv=UI.reveal;if(!rv)return '';
  return `<div class="reveal ${rv.diff<=-4?'bad':''}" role="status"><div class="big pop">${rv.pot}</div>
   <h3>${rv.diff>=10?'天选之子降临！':rv.diff>=6?'捡到宝了！':rv.diff>=3?'比预想的好':rv.diff<=-4?'球探看走眼了':'和报告差不多'}</h3>
   <p>${rv.name} 体检完成，真实潜力 ${rv.pot}（球探估计 ${rv.est}${rv.diff?`，${rv.diff>0?'高出':'低了'} ${Math.abs(rv.diff)} 点`:''}）。</p>
   <div><button class="btn small" data-act="closeReveal">知道了</button></div></div>`;
}
// one card per facility: level, what it does now, what the next level adds, and the upgrade button
function vFacilities(){
  return `<section class="panel"><h2>设施</h2>
  <div class="facs">${Object.entries(FAC).map(([k,f])=>{
    const L=facLv(k),max=L>=facCost(k).length,c=facCost(k)[L];
    return `<div class="fac"><div class="fh"><b>${f.name}</b><span class="tag2" style="background:var(--accent);color:#fff">${L} 级</span></div>
    <p class="fx">${f.fx(L)}</p>
    ${max?'<p class="muted" style="margin:0;font-size:12px">已是最高等级</p>':`<p class="fx next">升到 ${L+1} 级：${f.fx(L+1)}</p>
    <button class="btn small" data-act="fup" data-arg="${k}" ${S.budget<c?'disabled':''}>升级（${money(c)}）</button>`}</div>`}).join('')}</div></section>`;
}
// scout department level 3+: what our scouts say about the next opponent
function vOppReport(opp,ob,tac){
  if(facLv('scout')<3)return '';
  const xi=onPitch(opp,ob.ids),roles=slotRoles(ob.form),line={};
  xi.forEach((p,i)=>{if(p)(line[roles[i]]=line[roles[i]]||[]).push(p.ovr)});
  const avg=PO.map(pos=>({pos,v:line[pos]?Math.round(line[pos].reduce((a,b)=>a+b,0)/line[pos].length):0}));
  const wl=weakLine(opp,ob.ids,ob.form),weak=avg.find(a=>a.pos===wl),star=xi.filter(Boolean).sort((a,b)=>b.ovr-a.ovr)[0];
  // the better the scouts, the more they spell out: 3 the weak line, 4 how to go at it, 5 whether we already do
  const hurt=opp.players.filter(unavail).length,on=targets(wl,S.formation,S.tactic),lv=facLv('scout');
  return `<div class="oppr"><b>球探情报：${opp.name}</b>（预计 ${ob.form}，${TACT[tac]}）
  <div class="lines">${avg.map(a=>`<span class="${a===weak?'weak':''}">${POS[a.pos]} <b class="num">${a.v}</b></span>`).join('')}</div>
  ${wl?`<div class="target ${lv>=5&&on?'on':''}"><b>${TARGET[wl][0]}</b>（平均 ${weak.v}）${lv>=4?`：${TARGET[wl][1]}，进攻 +${TARGET_BONUS}。`:'。'}${lv>=5?`<span>${on?'✓ 你目前的安排已针对':'· 你目前的安排未针对'}</span>`:''}</div>`:''}
  <span>王牌：${star.name}（${POS[star.pos]}，${star.ovr}${star.sig?`，必杀「${star.sig}」`:''}）。${hurt?`对方 ${hurt} 人伤停。`:''}</span></div>`;
}
function vAcademy(){
  const A=S.academy,lv=A.lv,max=lv>=ACADEMY_COST.length,cost=ACADEMY_COST[lv];
  const grads=my().players.filter(p=>p.youth).sort((a,b)=>b.ovr-a.ovr);
  const conf={high:'把握高',mid:'把握一般',low:'把握很低'};
  return vReveal()+`${vFacilities()}<section class="panel"><h2>青训营 <span class="tag2" style="background:var(--accent);color:#fff">${lv} 级</span></h2>
  <p class="muted" style="margin:-4px 0 10px;font-size:14px">每季送来 ${lv>=3?4:3} 名少年，签入免费，没签的赛季结束后离开。</p>
  <div class="cheat-row">${max?'<span class="muted">已是最高等级</span>':`<button class="btn small" data-act="aup" ${S.budget<cost?'disabled':''}>升到 ${lv+1} 级（${money(cost)}）</button>
  <span class="muted">${lv+1>=3&&lv<3?'3 级起每季多送 1 人，':''}少年能力和潜力更高，报告更准</span>`}</div></section>
  <div class="cols"><div class="col"><section class="panel"><h2>本季青训少年</h2>
  ${A.intake.length?A.intake.map(p=>`<div class="mrow"><div style="min-width:0"><div class="pname">${p.name}${p.chosen?' <span class="tag2" style="background:#6B3F7A;color:#fff">气息异常</span>':''} <span class="muted" style="font-weight:400">${POS[p.pos]}，${p.age} 岁</span></div>
    <div class="pbar" aria-hidden="true"><i class="p" style="width:${pctR(p.scout.hi)}%"></i><i class="o" style="width:${pctR(p.ovr)}%"></i></div>
    <div class="price">球探${conf[p.scout.conf]}</div></div>
    <div><div class="ovr num">${p.ovr}</div><div class="potl">${potText(p)}</div></div>
    <div style="display:flex;flex-direction:column;gap:4px"><button class="btn small primary" data-act="ysign" data-arg="${p.id}" ${squadFull()?'disabled':''}>签入</button><button class="btn small" data-act="yrel" data-arg="${p.id}">放走</button></div></div>`).join('')
  :'<p class="muted" style="margin:0">这一批少年都处理完了，下个赛季会有新人。</p>'}
  ${squadFull()?`<p class="warn">一线队已满 ${SQUAD_MAX} 人，先卖掉一些人才能签入。</p>`:''}</section>
  </div><div class="col"><section class="panel"><h2>青训出品</h2>${grads.length?grads.map(p=>`<div class="res" style="grid-template-columns:1fr auto"><span style="text-align:left">${p.name} <span class="muted">${POS[p.pos]}，${p.age} 岁，${p.apps} 场 ${p.goals} 球</span></span><span class="num">${p.ovr}<span class="muted" style="font-size:13px">/${p.pot}</span></span></div>`).join(''):'<p class="muted" style="margin:0">一线队里还没有青训出身的球员。</p>'}</section></div></div>`;
}
function vMarket(){
  const F=UI.mf;
  let list=S.market.filter(p=>(F.pos==='all'||p.pos===F.pos)&&(F.age==='all'||(F.age==='y'?p.age<=21:F.age==='m'?p.age>=22&&p.age<=28:p.age>=29)));
  list.sort((a,b)=>F.sort==='pot'?shownPot(b)-shownPot(a):F.sort==='price'?a.price-b.price:b.ovr-a.ovr);
  const PER=12,pages=Math.max(1,Math.ceil(list.length/PER)),pg=Math.min(UI.mpage||0,pages-1),shown=list.slice(pg*PER,pg*PER+PER),open=windowOpen();
  const pager=pages>1?`<div class="pager"><button class="btn small" data-act="mpage" data-arg="${pg-1}" ${pg?'':'disabled'} aria-label="上一页">‹</button><span>第 ${pg+1}/${pages} 页</span><button class="btn small" data-act="mpage" data-arg="${pg+1}" ${pg<pages-1?'':'disabled'} aria-label="下一页">›</button></div>`:'';
  const seg=(key,opts)=>`<div class="seg sm">${opts.map(([v,l])=>`<button data-act="mf" data-arg="${key}:${v}" aria-pressed="${F[key]===v}">${l}</button>`).join('')}</div>`;
  return vReveal()+`<section class="panel"><h2>转会市场</h2>
  <p class="window ${open?'open':'shut'}">${open?(windowLeft()==null?'转会窗口开放中':`${windowName()}开放中，还剩 ${windowLeft()} 天`):windowShut()+'。名单可以先看，球探也可以先派。'}</p>
  <p class="muted" style="margin-top:6px;font-size:14px">本赛季名单 · 一线队 ${squadSize()}/${SQUAD_MAX}${my().players.length>squadSize()?`（另有 ${my().players.length-squadSize()} 人租借在外）`:''} · 绿条是能力，金条是球探估计的潜力 · 想买其他球队的人，在积分榜点球队名</p>
  ${(()=>{const ex=S.market.filter(p=>p.ex);return ex.length?`<p class="muted" style="margin-top:4px;font-size:14px">${ex[0].ex}挂牌的老部下：${ex.map(p=>`${p.name}（${POS[p.pos]} ${p.ovr}）`).join('、')}</p>`:''})()}
  <div class="filters">
   <div><label>位置</label>${seg('pos',[['all','全部'],['GK','门将'],['DF','后卫'],['MF','中场'],['FW','前锋']])}</div>
   <div><label>年龄</label>${seg('age',[['all','全部'],['y','21 岁以下'],['m','22 到 28'],['o','29 岁以上']])}</div>
   <div><label>排序</label>${seg('sort',[['ovr','能力'],['pot','潜力'],['price','价格']])}</div>
  </div>
  <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:6px">
   <button class="btn small" data-act="scout" ${S.budget<scoutCost()?'disabled':''}>加派球探，名单多 4 人（${money(scoutCost())}）</button>
   <span class="muted" style="font-size:13px">符合条件 ${list.length}/${S.market.length} 人</span>${pager}</div>
  ${list.length?'<div class="mlist">'+shown.map(p=>`<div class="mrow"><div style="min-width:0"><div class="pname">${p.name}${gem(p)} ${p.sale?'<span class="tag2 sale">急售半价</span>':''}${p.fresh===S.season?'<span class="tag2 fresh" title="冬窗新到">新到</span>':''}${p.eyed!=null?`<span class="tag2 eyed" title="${S.teams[p.eyed].name} 盯上了他，窗口最后一天可能被签走">豪门盯上</span>`:''}${p.ex?`<span class="tag2 fresh" title="从${p.ex}放出">老部下</span>`:''} <span class="muted" style="font-weight:400">${POS[p.pos]}，${p.age} 岁</span></div>
  ${p.sig?`<div class="sig">必杀「${p.sig}」</div>`:''}
  <div class="pbar" aria-hidden="true"><i class="p" style="width:${pctR(p.scout?p.scout.hi:p.pot)}%"></i><i class="o" style="width:${pctR(p.ovr)}%"></i></div>
  <div class="price">转会费 ${money(p.price)}${p.scout&&p.scout.conf!=='high'?`<span class="conf">，球探把握${p.scout.conf==='mid'?'一般':'很低'}</span>`:''}</div></div>
  <div><div class="ovr num">${p.ovr}</div><div class="potl">${potText(p)}</div></div>
  <button class="btn small primary" data-act="buy" data-arg="${p.id}" ${!open||S.budget<p.price||squadFull()?'disabled':''}>签下</button></div>`).join('')+'</div>'+pager
  :`<p class="muted">${S.market.length?'没有符合条件的球员，换个筛选试试。':'这一轮的球员都被签走了，打完下一场再来看看。'}</p>`}</section>`;
}
// what made a performance: goals and assists first, then whatever stood out
function standout(x){
  const a=x.a||{},e=(M.ev||{})[x.p.id]||{},bits=[];
  if(e.g)bits.push(`${e.g} 球`);if(e.a)bits.push(`${e.a} 次助攻`);if(e.sv>=3)bits.push(`${e.sv} 次扑救`);
  if(a.kp>=2)bits.push(`${a.kp} 次关键传球`);if(a.tkl+a.int>=5)bits.push(`${a.tkl} 抢断 ${a.int} 拦截`);
  if(a.drb>=3)bits.push(`${a.drb} 次过人`);if(a.pas>=30&&a.ok/a.pas>=.88)bits.push(`传球成功率 ${Math.round(a.ok/a.pas*100)}%`);
  return bits.slice(0,3).join('，');
}
// our players' numbers for the match
function statTable(list){
  const pct=a=>a.pas?Math.round(a.ok/a.pas*100)+'%':'—';
  return `<div class="tw"><table class="stat-t"><thead><tr><th>球员</th><th>评分</th><th>传球</th><th>关键传球</th><th>抢断</th><th>拦截</th><th>过人</th><th>扑救</th><th>进/助</th></tr></thead>
  <tbody>${list.map(x=>{const a=x.a||{pas:0,ok:0,kp:0,tkl:0,int:0,drb:0},e=(M.ev||{})[x.p.id]||{};
    return `<tr><td>${POS[x.role][0]} ${pName(x.p)}${subMark(x.p.id)}</td><td>${rtag(x.r)}</td><td>${a.ok}/${a.pas} <small class="muted">${pct(a)}</small></td><td>${a.kp}</td><td>${a.tkl}</td><td>${a.int}</td><td>${a.drb}</td><td>${x.role==='GK'?e.sv||0:'—'}</td><td>${e.g||0}/${e.a||0}</td></tr>`}).join('')}</tbody></table></div>`;
}
const rcls=r=>r>=8?'r-hi':r>=7?'r-ok':r<6?'r-lo':'';
const rtag=r=>`<span class="rating ${rcls(r)}">${r.toFixed(1)}</span>`;
// who came on (↑) or went off (↓) and when; a sending-off shows as a red card
function subMark(id){
  if(M.on&&M.on[id]!=null)return ` <small class="subm on" title="第 ${M.on[id]} 分钟替补上场">↑${M.on[id]}'</small>`;
  if(M.off&&M.off[id]!=null)return ((M.ev||{})[id]||{}).red?` <small class="subm red" title="第 ${M.off[id]} 分钟被罚下">红牌 ${M.off[id]}'</small>`
    :` <small class="subm off" title="第 ${M.off[id]} 分钟被换下">↓${M.off[id]}'</small>`;
  return '';
}
// our changes in order: minute, who went off and why, who came on
function vSubLog(){
  const l=(M.subLog||[]).filter(x=>x.s===mySide());if(!l.length)return '<p class="sublog muted">本场没有换人。</p>';
  const why={tired:'体能',inj:'受伤'};
  return `<div class="subh" style="margin:12px 0 6px">换人 ${l.length}/${SUBS}</div><div class="subline">${l.map(x=>`<div class="subev"><span class="submin num">${x.min}'</span>
    <span class="subwho"><span><span class="subm off">↓</span>${findP(x.out)?.name||'?'}${why[x.why]?`<small>${why[x.why]}</small>`:''}</span><span><span class="subm on">↑</span>${findP(x.in)?.name||'?'}</span></span></div>`).join('')}</div>`;
}
// full-time box: shots / on target / possession, man of the match, and our players' ratings
function vMatchStats(){
  const H=S.teams[M.h],A=S.teams[M.a],mine=mySide()==='h'?M.rh:M.ra;
  // each stat with a bar split between the two sides in their colours
  // ours in our colour, theirs in grey, so the two can't be confused when the clubs' colours are alike
  const hc=M.h===S.my?H.color:'#8A96A3',ac=M.a===S.my?A.color:'#8A96A3';
  const row=(l,h,a,hs=h,as=a)=>{const t=(+hs)+(+as)||1,hp=Math.round(hs/t*100);
    return `<div class="cmp"><b class="num">${h}</b><div><span>${l}</span><div class="cmp-bar"><i style="width:${hp}%;background:${hc}"></i><i style="width:${100-hp}%;background:${ac}"></i></div></div><b class="num">${a}</b></div>`};
  const mv=M.mvp,mvT=mv&&S.teams.find(t=>t.players.includes(mv.p));
  return `<div class="ft-grid"><div class="mstats">
    <div class="cmp-head"><span><i style="background:${hc}"></i>${H.short}</span><span>${A.short}<i style="background:${ac}"></i></span></div>
    ${row('射门',M.st.h.sh,M.st.a.sh)}${row('射正',M.st.h.on,M.st.a.on)}${row('控球',M.poss+'%',(100-M.poss)+'%',M.poss,100-M.poss)}</div>
  ${mv?`<div class="motm ${mvT.id===S.my?'mine':''}" style="--c:${mvT.color}"><small>全场最佳</small><div class="motm-r num">${mv.r.toFixed(1)}</div>
    <b>${mv.p.name}</b><span>${mvT.short} · ${POS[mv.role]}</span>${standout(mv)?`<em>${standout(mv)}</em>`:''}</div>`:''}</div>
  <div class="subh" style="margin:12px 0 6px">我方评分</div>
  <div class="rgrid">${mine.map(x=>`<div class="rrow ${x===mv?'best':''}"><span class="rpos pos-${x.role}">${POS[x.role][0]}</span><span class="rname">${pName(x.p)}${subMark(x.p.id)}</span>${rtag(x.r)}</div>`).join('')}</div>
  ${vSubLog()}
  <details class="fold mstat-fold" data-fold="mstats"><summary><b>详细数据</b></summary>${statTable(mine)}</details>`;
}
// the team of the season on a pitch (1-4-3-3): each man's average rating in his club's colours, ours in gold;
// tap a name for his details. older records without ids or colours still show
function xiPitch(xi){
  const inner=['FW','MF','DF','GK'].map(pos=>{const l=xi.filter(w=>w.pos===pos),n=l.length,gap=n<=2?28:Math.min(24,80/(n-1));
    return l.map((w,k)=>{const x=50+(k-(n-1)/2)*gap,c=(x-50)/40,y=PITCH_Y[pos]-(n>=4?6*c*c:0),mine=w.tid===S.my,live=w.id!=null&&findAny(w.id);
      return `<${live?'button':'span'} class="tok xi-tok ${mine?'mine':''}" style="left:${x}%;top:${y}%;--team:${w.color||'#2C6E49'}" ${live?`data-act="player" data-arg="${w.id}"`:''} title="${w.name}（${w.team}），场均 ${w.stat}">
        <span class="tc num">${Number(w.stat).toFixed(1)}</span><span class="tn">${shortName(w.name)}</span><small class="tt">${w.team}</small></${live?'button':'span'}>`}).join('')}).join('');
  return pitchBox(inner,'年度最佳阵容','4-3-3',{color:'#2C6E49',note:'4-3-3 · 赛季平均评分'});
}
// a shootout in progress: each side's kicks so far (● in, ✕ missed, ○ still to take of the first five)
function vShootout(){
  const P=M.pk,shown=P.kicks.slice(0,P.i),row=(s,t)=>{const k=shown.filter(x=>x.s===s);
    return `<div class="pk-row"><b>${t.short}</b><span>${k.map(x=>`<i class="${x.ok?'in':'miss'}">${x.ok?'●':'✕'}</i>`).join('')}${'<i class="todo">○</i>'.repeat(Math.max(0,5-k.length))}</span><b class="num">${s==='h'?P.hp:P.ap}</b></div>`};
  return `<div class="pk"><div class="subh">点球大战</div>${row('h',S.teams[M.h])}${row('a',S.teams[M.a])}
    <div class="mctl" style="margin-top:8px"><button class="btn" data-act="skip">直接看结果</button></div></div>`;
}
// the opponent's current tactic and average stamina
const oppLine=()=>`对手 <b class="opptac">${TACT[M.aiTac]}</b> · 平均体能 ${oppAvgCond()}`;
// stamina while the match runs: our players on the pitch (lowest first) and the opponents' average
const oppAvgCond=()=>{const s=mySide()==='h'?'a':'h',ps=onPitch(S.teams[s==='h'?M.h:M.a],M[s+'Ids']).filter(Boolean);return Math.round(ps.reduce((t,p)=>t+p.cond,0)/ps.length)};
const autoSubBtn=()=>`<button class="btn small" data-act="autoSub" aria-pressed="${S.autoSub!==false}">自动换下体力不支的球员：${S.autoSub!==false?'开':'关'}</button>`;
function vLiveStamina(){
  const s=mySide(),roles=slotRoles(M[s+'Form']);
  const ps=M[s+'Ids'].map((id,i)=>{const p=id!=null&&findP(id);return p&&{p,r:roles[i]}}).filter(Boolean).sort((a,b)=>a.p.cond-b.p.cond);
  return `<div class="livecond"><div class="lc-head"><b>场上体能</b><span class="muted">${oppLine()}</span></div>
  <div class="lc-list">${ps.map(({p,r})=>{const c=Math.round(p.cond);return `<span class="lc ${c<60?'bad':c<TIRED?'warn':''}"><span class="lc-n">${POS[r][0]} ${pName(p)}</span><span class="lc-bar"><i style="width:${c}%"></i></span><b class="num">${c}</b></span>`}).join('')}
</div></div>`;
}
// our players who played and are no longer on the pitch (taken off or sent off), in the order they left
const offPitch=()=>{const s=mySide();return M[s+'XI'].filter(id=>id!=null&&!M[s+'Ids'].includes(id)&&!pendingSub(id,'out')).map(findP).filter(Boolean).sort((a,b)=>(M.off[a.id]??0)-(M.off[b.id]??0))};
// our extras that are on right now (team talk, 绝境爆发, the manager's aura)
function boostChips(){
  if(M.done)return '';
  const c=[],home=M.h===S.my,behind=(home?M.hg:M.ag)<(home?M.ag:M.hg);
  if(M.talk&&M.min>45)c.push(`<span class="bchip ${M.talk==='roar'&&!M.talkOK?'bad':''}">训话·${TALK[M.talk][0]}</span>`);
  if(M.min>=75&&behind)c.push('<span class="bchip hot">绝境爆发</span>');
  if(totem()>0)c.push(`<span class="bchip">主场图腾 +${totem()}</span>`);
  if(M.min>=75&&aura()>=1)c.push(`<span class="bchip">名帅光环 +${aura()}</span>`);
  if(targets(M.weak,M[mySide()+'Form'],M.tac))c.push(`<span class="bchip">针对弱点 +${TARGET_BONUS}</span>`);
  return c.length?`<div class="bchips">${c.join('')}</div>`:'';
}
function vMatch(){
  const H=S.teams[M.h],A=S.teams[M.a];
  const clock=M.done?'FT':M.min>=45&&M.ht?'HT':`${M.min}'`;
  let ctl='';
  if(M.done){
    const s=M.summary;
    const wcls=s.w==='胜'?'win':s.w==='负'?'loss':'draw',chip=(cls,t)=>`<span class="ft-chip ${cls}">${t}</span>`;
    ctl=`<div class="ht ft ${wcls}"><div class="ft-head"><div class="verdict disp">${s.w==='胜'?LINE.win:s.w==='负'?LINE.lose:LINE.draw}</div>
      <span class="ft-score num">${s.mg} : ${s.og}${s.pens?` <small>点球 ${s.mp}:${s.op}</small>`:''}</span></div>
    <div class="ft-chips">${M.friendly?chip('','友谊赛不计成绩'):chip('money',`💰 收入 ${money(s.income)}${M.derby?'（宿敌之战翻倍）':''}`)}
      ${s.late?chip(s.late.mine?'late':'hurt',s.late.mine?`⚡ ${s.late.name} ${s.late.min}' ${s.late.kind==='win'?'绝杀':'绝平'}`:`💔 ${s.late.min}' 被${s.late.kind==='win'?'绝杀':'绝平'}`):''}
      ${s.grown.map(p=>chip('grow',`↑ ${p.name} ${p.ovr}`)).join('')}
      ${M.myInjuries.map(p=>chip('hurt',`🚑 ${p.name} 伤停 ${p.inj} 天`)).join('')}
      ${s.banned.map(p=>{const n=p.bans[s.banComp];return chip('ban',`⛔ ${p.name} ${COMPS[s.banComp]}停赛${n>1?` ${n} 场`:'一场'}`)}).join('')}</div>
    ${s.awoken.map(p=>`<p class="awake">${LINE.awaken(p.name)}能力 ${p.ovr}，潜力 ${p.pot}${p.sig?`，领悟必杀技「${p.sig}」`:''}</p>`).join('')}
    ${vMatchStats()}
    <div class="go" style="justify-content:flex-start;margin-top:0"><button class="btn primary" data-act="matchDone">回到俱乐部</button>
    ${S.cheatUsed?'':`${cheatBtn('redo')}<span class="muted" style="font-size:13px">${CHEAT_CARD}：${CHEAT_INFO.redo[1]}</span>`}</div></div>`;
  }else if(M.ht||M.subMode){
    const s=mySide(),xi=M[s+'XI'],full=M.subs>=SUBS;
    // players taken off in this stop stay on the bench list, so the change can be undone
    const bench=my().players.filter(p=>(!xi.includes(p.id)||pendingSub(p.id,'out'))&&!unavail(p)).sort((a,b)=>PO.indexOf(a.pos)-PO.indexOf(b.pos)||b.ovr-a.ovr);
    const redo=M.sel!=null&&pendingSub(M.sel);
    const marks=p=>(M.injuries.includes(p)?'<b class="mk hurt">伤</b>':'')+(M.yc[p.id]?'<b class="mk yc"></b>':'');
    const field=pitchSpots(M[s+'Ids'],M[s+'Form']).map(x=>x.p
      ?tok(x.p,{style:`left:${x.x}%;top:${x.y}%`,act:'subOut',role:x.role,cls:M.sel===x.p.id?'sel':'',marks:marks(x.p),cond:true})
      :M.sel!=null?`<button class="tok empty gone movehere" style="left:${x.x}%;top:${x.y}%" data-act="toSlot" data-arg="${x.slot}"><span class="tc">＋</span><span class="tn">移到这里</span></button>`
      :`<span class="tok empty gone" style="left:${x.x}%;top:${x.y}%"><span class="tc">✕</span><span class="tn">罚下</span></span>`).join('');
    ctl=`<div class="ht">${M.ht?'<b>中场·作战会议</b><p style="margin:4px 0 10px;font-size:14px">下半场，要改变命运的走向吗？</p>':`<b>暂停·调整（${M.min}'）</b><p style="margin:4px 0 10px;font-size:14px">换人或改变战术，然后继续比赛。</p>`}
    <p style="margin:0 0 10px;font-size:13px">${autoSubBtn()} <span class="muted">${oppLine()}</span></p>
    ${M.aiTac==='att'&&M.tac!=='def'?'<p class="muted" style="margin:-4px 0 10px;font-size:12px">对手全力进攻，防守反击能多守住一些，还有反击加成。</p>':''}
    ${M.ht?(M.talk?`<p class="talk-done">训话「${TALK[M.talk][0]}」${M.talk==='roar'?(M.talkOK?'奏效了！进攻 +5、防守 +2':'适得其反，攻防各 −2'):`：${TALK[M.talk][2]}`}</p>`
      :`<div class="talk"><div class="subh">更衣室训话 <span class="muted" style="font-weight:400">（每场一次）</span></div>${Object.entries(TALK).map(([k,[n,line,fx]])=>`<button class="talk-opt" data-act="talk" data-arg="${k}"><b>${n}</b><span>${line}</span><small>${fx}</small></button>`).join('')}</div>`):''}
    <div class="seg" style="margin-bottom:4px">${Object.entries(TACT).map(([k,v])=>`<button data-act="tac" data-arg="${k}" aria-pressed="${M.tac===k}">${v}</button>`).join('')}</div>
    <p class="muted" style="margin:0 0 12px;font-size:12px">只影响本场。</p>
    <details class="fold mform" data-fold="mform"><summary><span>阵型 <b>${M[s+'Form']}</b> <span class="muted">· 更换</span></span></summary><div class="seg sm">${Object.keys(FORMS).map(f=>`<button data-act="mform" data-arg="${f}" aria-pressed="${M[s+'Form']===f}">${f}</button>`).join('')}</div></details>
    <div class="subh">换人 ${M.subs}/${SUBS}${redo?`：${findP(M.sel).name} 刚换上，改选其他替补不另算名额，点「换回」撤销这次换人`:full?'，名额已用完（还可以点两名场上球员互换位置）':M.sel!=null?`：换下 ${findP(M.sel).name}——点右边的替补换上，或点场上另一人互换位置${M[s+'Ids'].includes(null)?'、点空位让他补位':''}`:'：先点球场上的人，再点右边的替补换上；点两名场上球员可以互换位置'}</div>
    ${(M.subLog||[]).some(x=>x.s===s&&x.stop===M.stop)?'<p class="muted" style="margin:2px 0 0;font-size:12px">这次暂停里的换人在继续比赛前都可以改。</p>':''}
    <div class="htgrid">${pitchBox(field,'场上球员',M[s+'Form'])}
    <div class="sublist"><div class="subh">替补席 <span class="muted" style="font-weight:400">${bench.length} 人可用</span></div>
    ${bench.length?bench.map(p=>{
      // with a player picked on the pitch: same-position subs stand out, and each shows the stamina he'd bring
      const out=M.sel!=null&&findP(M.sel),same=out&&p.pos===(M.role[out.id]||out.pos),gain=out?Math.round(p.cond-out.cond):0;
      const back=pendingSub(p.id,'out');
      return `<button class="scard ${same?'fit':out?'dim':''} ${back?'back':''}" data-act="subIn" data-arg="${p.id}" data-flip="p${p.id}" ${full&&!redo||back&&!(redo&&redo.out===p.id)?'disabled':''} title="${p.name}，${POS[p.pos]}，能力 ${p.ovr}，体能 ${Math.round(p.cond)}">
      <span class="sc-ovr num pos-${p.pos}">${p.ovr}</span>
      <span class="sc-main"><span class="sc-name">${p.name}${p.sig?'<i>★</i>':''}</span>
      <span class="sc-meta">${POS[p.pos]} · 体能 ${Math.round(p.cond)}${out&&gain>0?` <b class="sc-gain">+${gain}</b>`:''}</span></span>${back?'<b class="sc-fit sc-back">换回</b>':same?'<b class="sc-fit">同位置</b>':''}
      <span class="tb ${p.cond<TIRED?'low':''}"><i style="width:${p.cond}%"></i></span></button>`}).join(''):'<span class="muted" style="font-size:13px">没有可用的替补</span>'}
    ${offPitch().length?`<div class="gone-row"><span class="muted">已下场</span>${offPitch().map(p=>`<span>${pName(p)}${subMark(p.id)}${(M.ev[p.id]||{}).red?'':` <span class="muted num">${Math.round(p.cond)}</span>`}</span>`).join('')}</div>`:''}</div></div>
    <button class="btn primary" data-act="resume" style="margin-top:12px">再战，下半场！</button></div>`;
  }else{
    ctl=M.pk?vShootout():`<div class="mctl"><button class="btn small" data-act="sound" aria-label="音效：${soundOn()?'开':'关'}" title="音效">${soundOn()?'🔊':'🔇'}</button><div class="seg sm pace" role="group" aria-label="比赛速度">${Object.entries(PACE).map(([k,[l]])=>`<button data-act="pace" data-arg="${k}" aria-pressed="${(S.pace||'normal')===k}">${l}</button>`).join('')}</div><button class="btn primary" data-act="pauseSub">换人 / 调整</button><button class="btn" data-act="skip">直接看结果</button>${autoSubBtn()}</div>${vLiveStamina()}`;
  }
  const tag=M.friendly?`${M.warm?'热身赛':'季前友谊赛'} · 对手${divName(S.teams[M.h===S.my?M.a:M.h])}`:M.cup?`${CUP_NAME}·${stageName(M.stage)}`:M.intl?`${INTL_NAME}·${INTL_STAGES[M.stage]}`:M.derby?'宿敌之战':'';
  return `<div class="matchwrap">${tag?`<div class="mtag">${tag}</div>`:''}<div class="board">
  <div class="side disp">${H.name}<small>主队</small></div>
  <div class="score"><span class="${M.flash==='h'?'flash':''}">${M.hg}</span><span class="colon">:</span><span class="${M.flash==='a'?'flash':''}">${M.ag}</span></div>
  <div class="side disp">${A.name}<small>客队</small></div>
  <div class="clock">${clock}${M.hp!==undefined?` <span class="pk">点球 ${M.hp}:${M.ap}</span>`:''}<small>你的战术：${TACT[M.tac]}${S.boost>0?'，士气高涨':''}</small>${boostChips()}</div></div>
  ${ctl}
  <ul class="feed">${M.feed.map(e=>`<li class="${e.cls}"><span class="m">${e.min==='PK'?'PK':e.min+"'"}</span><span>${e.t}</span></li>`).join('')}</ul></div>`;
}
// season end: how our reputation moved, and any clubs that want us
function vCareerEnd(){
  if(!S.mgr)return '';
  const O=S.jobOffers||[],d=S.mgr.last||0;
  return `<div class="career"><p style="margin:0 0 6px"><b>${S.mgr.rep}</b>（${mgrTitle(S.mgr.rep)}）<span class="${d>=0?'goal-ok':'goal-no'}" style="width:auto;margin-left:6px">${d>=0?'+':''}${d}</span></p>
  ${O.length?`<p class="muted" style="margin:0 0 8px;font-size:13px">这些俱乐部想请你执教。接受后，下赛季带领新球队，资金、设施和青训营都换成新俱乐部的。</p>
  ${O.map(o=>{const t=S.teams[o.club],rk=table(t.div).findIndex(r=>r.id===t.id)+1;
    return `<div class="offer-card" style="--c:${t.color}"><div><b class="disp">${t.name}</b><small>${DIVS[t.div]}第 ${rk} 名 · ${tierOf(t.rep)} · 实力 ${t.str} · 预算 ${money(o.budget)}</small></div>
    <button class="btn small primary" data-act="takeJob" data-arg="${o.club}">接受邀请</button></div>`}).join('')}`
  :`<p class="muted" style="margin:0;font-size:13px">${S.mgr.rep<40?'暂时没有俱乐部来邀请你，继续带出成绩吧。':'这个夏天没有更大的俱乐部来邀请你。'}</p>`}</div>`;
}
// honours room: every season of the career, at whichever club
function vCareer(){
  const H=S.history||[];if(!H.length||!S.mgr)return '';
  return `<section class="panel"><h2>执教生涯 <span class="muted" style="font-weight:400;font-size:13px">教练声望 ${S.mgr.rep}（${mgrTitle(S.mgr.rep)}）</span></h2>
  <div class="tw scrollbox"><table class="sticky-head"><thead><tr><th>季</th><th>球队</th><th>联赛</th><th>名次</th></tr></thead>
  <tbody>${H.slice().reverse().map(h=>`<tr><td>${h.season}</td><td>${h.club||'—'}</td><td>${DIVS[h.div||0]}</td><td>${h.rank===1?'🏆 ':''}第 ${h.rank}</td></tr>`).join('')}</tbody></table></div></section>`;
}
function vSeasonEnd(){
  const div=my().div,rank=myRank(),exp=expectedRank(),prize=prizeFor(div,rank),z=zone(div,rank),dn=DIVS[div];
  const board=rank<=exp-2?'远远超出预期，董事会非常满意。':rank<=exp?'大致符合预期，董事会对你的工作表示认可。':'成绩低于预期，董事会希望你下赛季能有起色。';
  const msg=z==='up'?(rank===1?`${dn}冠军，成功升级！`:`拿下第 ${rank}，成功升级！`)+`下赛季将在${DIVS[div-1]}和强队过招。`
    :z==='down'?`降级了。下赛季要在${DIVS[div+1]}重新开始，董事会希望尽快打回来。`
    :rank===1?'冠军！整个城市都在为你们庆祝，董事会激动得说不出话。'
    :board+(div>0?'下赛季继续冲击升级。':'');
  const me=table(div).find(r=>r.id===S.my),g=goalStatus(),bonus=g?(g.league?GOAL_BONUS.league[div]:0)+(g.cup?GOAL_BONUS.cup:0):0;
  const glory=[rank===1?`${dn}冠军`:'',z==='up'?`升级${DIVS[div-1]}`:'',S.cup.winner===S.my?`${CUP_NAME}冠军`:'',S.intl&&S.intl.winner===S.my?`${INTL_NAME}冠军`:''].filter(Boolean);
  const next=`<button class="btn primary" data-act="newSeason">${(S.jobOffers||[]).length?`留在 ${my().name}，`:''}开始第 ${S.season+1} 赛季</button>`;
  const stat=(v,l)=>`<div class="se-stat"><b class="num">${v}</b><small>${l}</small></div>`;
  // our season's standouts: top scorer, top assister, best average rating
  const ps=my().players,best=f=>[...ps].sort((a,b)=>f(b)-f(a))[0],sc=best(p=>p.goals),as=best(p=>p.ast||0),rt=best(p=>p.rn>=Math.max(3,rounds()/3)?avgRating(p):0);
  const star=(l,p,v)=>p&&v?`<div class="se-star"><small>${l}</small><b>${p.name}</b><span class="num">${v}</span></div>`:'';
  // awards and team of the season for any division (ours first)
  const ad=UI.seDiv!=null&&divSize(UI.seDiv)?UI.seDiv:div,a=seasonAwards(ad),xi=seasonXI(ad);
  const awardCards=Object.entries(AWARDS).map(([k,l])=>a[k]?`<div class="aw ${a[k].tid===S.my?'mine':''}"><small>${l}</small><b>${a[k].name}</b><span>${a[k].team} · ${a[k].stat}</span></div>`:'').join('');
  const divSw=act=>`<div class="seg sm" style="margin-bottom:10px">${DIVS.map((n,d)=>!divSize(d)?'':`<button data-act="${act}" data-arg="${d}" aria-pressed="${d===ad}">${n}${d===div?'（本队）':''}</button>`).join('')}</div>`;
  return `${glory.length?`<section class="glory"><div class="cup">🏆</div><div class="disp">${glory.join(' · ')}</div><small>${my().name} · 第 ${S.season} 赛季</small></section>`:''}
  <section class="panel se-hero ${z}" style="--team:${my().color}">
    <div class="se-top"><div class="se-place"><small>第 ${S.season} 赛季 · ${dn}</small><b class="disp">第 ${rank}</b></div><p>${msg}</p></div>
    <div class="se-stats">${stat(`${me.w}-${me.d}-${me.l}`,'胜-平-负')}${stat(me.pts,'积分')}${stat(`${me.gf}:${me.ga}`,'进:失')}${stat(money(prize+bonus),bonus?`奖金（含董事会 ${money(bonus)}）`:'赛季奖金')}</div>
    <div class="go" style="justify-content:flex-start;margin:12px 0 0">${next}</div>
  </section>
  <div class="cols"><div class="col">
    <section class="panel"><h2>赛季总结</h2>
      ${g?`<div class="se-goal ${g.league?'ok':'no'}"><span>${g.league?'✓':'✗'}</span>联赛第 ${S.goal.rank} 名以内（实际第 ${rank}）</div>${g.cup===null?'':`<div class="se-goal ${g.cup?'ok':'no'}"><span>${g.cup?'✓':'✗'}</span>${CUP_NAME}进入${stageName(S.goal.cup)}</div>`}`:''}
      <p class="muted" style="font-size:13px;margin:8px 0 0">${CUP_NAME}：${cupStatus()}</p>
      ${S.intl&&S.intl.winner!=null?`<p class="muted" style="font-size:13px;margin:4px 0 0">${INTL_NAME}：${intlIn()?intlStatus():`冠军 ${S.teams[S.intl.winner].name}`}</p>`:''}
      ${S.history.length?`<div class="se-hist">${S.history.slice(-6).map(h=>`<span class="${h.rank===1?'gold':''}">S${h.season} ${DIVS[h.div||0]}<b>${h.rank}</b></span>`).join('')}<span class="now">S${S.season} ${dn}<b>${rank}</b></span></div>`:''}
    </section>
    <section class="panel"><h2>教练声望</h2>${vCareerEnd()}</section>
  </div><div class="col">
    ${sc&&sc.goals||as&&as.ast||rt&&rt.rn?`<section class="panel"><h2>本队之星</h2><div class="se-stars">${star('射手',sc,sc&&sc.goals?sc.goals+' 球':'')}${star('助攻',as,as&&as.ast?as.ast+' 次':'')}${star('评分',rt,rt&&rt.rn>=Math.max(3,rounds()/3)?avgRating(rt).toFixed(2):'')}</div></section>`:''}
    <section class="panel"><h2>个人奖项与最佳阵容</h2>${divSw('seDiv')}<div class="aws">${awardCards}</div>
      ${xi.length?`<h3>${DIVS[ad]}年度最佳阵容</h3>${xiPitch(xi)}`:''}
    </section>
  </div></div>
  <h2 class="se-sec">联赛数据</h2>
  ${vTable(UI.div!=null&&divSize(UI.div)?UI.div:div)}
  <div class="go" style="justify-content:flex-start">${next}</div>
  <p class="muted" style="font-size:13px">新赛季球员长一岁，33 岁以上的老将可能退役（能力越高越能坚持），黄牌和停赛清零。</p>`;
}

/* ---------- cup & honours ---------- */
// one line on how our cup run is going
function cupStatus(){
  const C=S.cup;
  if(C.skipped)return '本赛季未参加，下赛季开始。';
  if(C.winner===S.my)return '冠军！';
  const k=C.rounds.findIndex(rd=>rd.some(r=>(r.h===S.my||r.a===S.my)&&r.w!==S.my));
  if(k>=0)return `止步${stageName(k)}。`;
  if(C.winner!=null)return '已结束。';
  if((C.byes||[]).includes(S.my))return `首轮轮空，直接进入${stageName(C.stage+1)}（${dayLabel(cupDay(C.stage+1))}）。`;
  return `仍在争夺，下一场是${stageName(C.stage)}（${dayLabel(cupDay(C.stage))}）。`;
}
// one line on our 天际冠军杯
function intlStatus(){
  const I=S.intl;
  if(!intlIn())return `本队没有参赛。甲级前两名和${CUP_NAME}冠军获得下赛季的参赛资格。`;
  if(I.winner===S.my)return '🏆 夺得冠军！';
  if(intlMine())return `仍在争夺，下一场是${INTL_STAGES[I.stage]}（${dayLabel(intlDay(I.stage))}）。`;
  const out=I.ko.findIndex(rd=>rd.some(r=>(r.h===S.my||r.a===S.my)&&r.w!==S.my));
  return out===2?'获得亚军。':out>=0?`止步${INTL_STAGES[6+out]}。`:'小组赛出局。';
}
// seasons as short runs, latest first: S9、S6–S7、S2 (at most four runs, then 等; the full list is in the tooltip)
function seasonRuns(seasons){
  const xs=[...new Set(seasons)].sort((a,b)=>b-a),runs=[];
  for(const x of xs){const r=runs[runs.length-1];if(r&&r[0]===x+1)r[0]=x;else runs.push([x,x])}
  const txt=runs.map(([a,b])=>a===b?`S${a}`:`S${a}–S${b}`);
  return txt.slice(0,4).join('、')+(txt.length>4?' 等':'');
}
// a cup's roll of honour: every club that has won it, most titles first (then the most recent), with the seasons.
// key: 'cup' or 'intl' in the season records; this season's winner counts as soon as the final is played
function cupHonours(key,title){
  const won={},add=(name,season)=>{(won[name]||(won[name]={name,seasons:[]})).seasons.push(season)};
  (S.records||[]).forEach(r=>{if(r[key])add(r[key],r.season)});
  const C=key==='cup'?S.cup:S.intl,recorded=(S.records||[]).some(r=>r.season===S.season);
  if(C&&C.winner!=null&&!recorded)add(S.teams[C.winner].name,S.season);
  const list=Object.values(won).sort((a,b)=>b.seasons.length-a.seasons.length||Math.max(...b.seasons)-Math.max(...a.seasons));
  return `<section class="panel"><h2>${title}历届冠军</h2>${list.length?`<div class="honours-list">${list.map((c,i)=>`<div class="hrow ${c.name===my().name?'me':''}">
    <span class="hr-n">${i+1}</span><span class="hr-club"><b>${c.name}</b><small title="${c.seasons.map(x=>'第 '+x+' 季').join('、')}">${seasonRuns(c.seasons)}</small></span><span class="hr-count"><b>${c.seasons.length}</b> 冠</span></div>`).join('')}</div>`
    :'<p class="muted" style="margin:0">还没有决出过冠军。</p>'}</section>`;
}
// the cup pages share their pieces: a result row, a fixture row, a folding round, our road through the rounds
const cupNm=id=>S.teams[id].name;
function cupRow(r){
  const me=r.h===S.my||r.a===S.my,cls=id=>r.w==null?'':id===r.w?'w':'l';
  return `<div class="res cupres ${me?'me':''}"><span class="${cls(r.h)}">${cupNm(r.h)}</span><span class="num">${r.hg} : ${r.ag}${r.hp!=null?`<small>点球 ${r.hp}:${r.ap}</small>`:''}</span><span class="${cls(r.a)}">${cupNm(r.a)}</span></div>`;
}
const cupTie=([h,a])=>`<div class="res cupres ${h===S.my||a===S.my?'me':''}"><span>${cupNm(h)}</span><span class="muted">VS</span><span>${cupNm(a)}</span></div>`;
// a round already played, folded (the latest one open); its summary says how we did in it
function cupRound(name,res,open,key){
  const ours=res.find(r=>r.h===S.my||r.a===S.my);
  return `<details class="fold cup-round" data-fold="${key}" ${open?'open':''}><summary><span><b>${name}</b> <span class="muted">${res.length} 场</span>${ours?` ${ourTag(ours)}`:''}</span></summary>${res.map(cupRow).join('')}</details>`;
}
// our result in a tie, from our side: ✓ 2:0 / ✗ 1:2 (with penalties) / a group game's score
function ourTag(r){
  const home=r.h===S.my,f=home?r.hg:r.ag,o=home?r.ag:r.hg,pens=r.hp!=null?`（点球 ${home?r.hp:r.ap}:${home?r.ap:r.hp}）`:'';
  const won=r.w!=null?r.w===S.my:f>o;
  return `<span class="cp-res ${won?'won':r.w!=null||f<o?'lost':'drew'}">${won?'✓':r.w!=null||f<o?'✗':'＝'} ${f}:${o}${pens}</span>`;
}
// our road: one step per round, each with how it went, the round to come lit up with its date
function cupPath(steps){
  return `<ol class="cup-path">${steps.map(s=>`<li class="cp-step ${s.cls}"><b>${s.name}</b><span>${s.text}</span></li>`).join('')}</ol>`;
}
// the cup tab: 天穹杯 and, when there is one, 天际冠军杯 (a switch between them). on a wide screen the roll of
// honour and the prize money sit in a column on the right; on a phone the roll follows the summary and the prize
// money comes last
function vCup(){
  const k=S.intl&&UI.cupv==='intl'?'intl':'dom',page=k==='intl'?vIntl():vDomCup();
  const sw=S.intl?`<div class="seg cup-switch" role="group" aria-label="杯赛">${[['dom',CUP_NAME],['intl',INTL_NAME]].map(([v,l])=>`<button data-act="cupv" data-arg="${v}" aria-pressed="${k===v}">${l}</button>`).join('')}</div>`:'';
  return sw+(isWide()?`<div class="cols"><div class="col">${page.head}${page.main}</div><div class="col">${page.honours}${page.prize}</div></div>`:page.head+page.honours+page.main+page.prize);
}
function vDomCup(){
  const C=S.cup,F=cupFmt(C),n=domestic().length,last=F.names.length-1;
  const q=F.names[0]==='资格赛'?2*(n-(F.names[1]==='三十二强'?32:16)):0;
  const outK=C.rounds.findIndex(rd=>rd.some(r=>(r.h===S.my||r.a===S.my)&&r.w!==S.my));
  const steps=F.names.map((name,k)=>{
    const r=C.rounds[k]&&C.rounds[k].find(x=>x.h===S.my||x.a===S.my);
    if(r)return {name:stageName(k),cls:r.w===S.my?(k===last?'champ':'won'):'lost',text:ourTag(r)+(r.w===S.my&&k===last?' 🏆':'')};
    if(k<C.stage)return {name:stageName(k),cls:outK>=0&&k>outK?'gone':'bye',text:outK>=0&&k>outK?'':'轮空'};
    if(outK>=0||C.skipped)return {name:stageName(k),cls:'gone',text:''};
    return {name:stageName(k),cls:k===C.stage?'now':'next',text:dayLabel(cupDay(k)).replace(/^第 (\d+) 周/,'第$1周')};
  });
  const head=`<section class="panel cup-head"><div class="cup-title"><h2>${CUP_NAME}</h2><span class="muted">第 ${S.season} 赛季</span></div>
  <p class="muted cup-meta">全国 ${n} 队 · 单场淘汰，平局点球决胜${q?` · 底蕴最低的 ${q} 队先打资格赛`:''}</p>
  ${C.skipped?'':cupPath(steps)}<p class="cup-status"><b>本队：</b>${cupStatus()}</p>
  ${C.winner!=null?`<p class="cup-champ disp">🏆 ${cupNm(C.winner)}</p>`:''}</section>`;
  const byes=(C.byes||[]).length?`<details class="fold byes"><summary><span class="muted">${C.byes.length} 队轮空，直接进入${stageName(C.stage+1)}${C.byes.includes(S.my)?'（包括本队）':''}</span></summary><p style="margin:6px 0 0;font-size:13px">${C.byes.map(id=>id===S.my?`<b>${cupNm(id)}</b>`:cupNm(id)).join('、')}</p></details>`:'';
  const pending=C.ties.length?`<section class="panel"><h2>${stageName(C.stage)} <span class="muted" style="font-weight:400;font-size:14px">${dayLabel(cupDay(C.stage))}</span></h2>${C.ties.map(cupTie).join('')}${byes}</section>`:'';
  const rounds=C.rounds.length?`<section class="panel"><h2>已赛轮次</h2>${C.rounds.map((rd,k)=>cupRound(stageName(k),rd,k===C.rounds.length-1,'cupr'+k)).reverse().join('')}</section>`:'';
  const P=F.prize,prize=`<section class="panel"><h2>奖金</h2><div class="prize-list">${F.names.map((name,k)=>P[k]?`<div><span>止步${stageName(k)}</span><b>${money(P[k])}</b></div>`:'').join('')}<div><span>夺冠</span><b>${money(P[F.names.length])}</b></div></div></section>`;
  return {head,main:pending+rounds,honours:cupHonours('cup',CUP_NAME),prize};
}
function vIntl(){
  const I=S.intl,gi=I.groups.findIndex(g=>g.includes(S.my)),me=id=>id===S.my?'me':'';
  const tbl=g=>{const rows=intlTable(g);
    return `<div class="itable"><div class="ith"><span></span><span>球队</span><span>赛</span><span>胜平负</span><span>净</span><span>分</span></div>
    ${rows.map((r,i)=>`<div class="itr ${me(r.id)} ${i<2&&I.stage>=6?'thru':''}"><span class="num">${i+1}</span><span class="itn"><i style="background:${S.teams[r.id].color}"></i>${S.teams[r.id].foreign?'':'<b class="home-flag" title="本国俱乐部">本国</b>'}<button class="link" data-act="team" data-arg="${r.id}">${cupNm(r.id)}</button></span><span class="num">${r.p}</span><span class="num">${r.w}-${r.d}-${r.l}</span><span class="num">${r.gf-r.ga>0?'+':''}${r.gf-r.ga}</span><span class="num"><b>${r.pts}</b></span></div>`).join('')}</div>`};
  // our road: the group stage as one step (where we stand), then the knockout rounds
  const steps=[];
  if(gi>=0){
    const pos=intlTable(gi).findIndex(r=>r.id===S.my)+1,done=I.stage>=6;
    steps.push({name:'小组赛',cls:done?(pos<=2?'won':'lost'):'now',text:done?`小组第 ${pos}${pos<=2?'，出线':'，出局'}`:`第 ${Math.min(I.stage+1,6)}/6 轮 · 暂列第 ${pos}`});
    const outJ=I.ko.findIndex(rd=>rd.some(r=>(r.h===S.my||r.a===S.my)&&r.w!==S.my)),groupOut=done&&pos>2;
    for(let j=0;j<3;j++){const k=6+j,r=I.ko[j]&&I.ko[j].find(x=>x.h===S.my||x.a===S.my);
      if(r)steps.push({name:INTL_STAGES[k],cls:r.w===S.my?(j===2?'champ':'won'):'lost',text:ourTag(r)+(r.w===S.my&&j===2?' 🏆':'')});
      else if(groupOut||outJ>=0)steps.push({name:INTL_STAGES[k],cls:'gone',text:''});
      else steps.push({name:INTL_STAGES[k],cls:I.stage===k?'now':'next',text:dayLabel(intlDay(k)).replace(/^第 (\d+) 周/,'第$1周')});}
  }
  const head=`<section class="panel cup-head"><div class="cup-title"><h2>${INTL_NAME}</h2><span class="muted">第 ${I.season} 赛季</span></div>
  <p class="muted cup-meta">16 队 · 4 个小组主客场双循环，前两名进八强，之后单场淘汰 · 本国代表：${I.home.map(id=>id===S.my?`<b>${cupNm(id)}</b>`:cupNm(id)).join('、')}</p>
  ${gi>=0?cupPath(steps):''}<p class="cup-status"><b>本队：</b>${intlStatus()}</p>
  ${I.winner!=null?`<p class="cup-champ disp">🏆 ${cupNm(I.winner)}</p>`:''}</section>`;
  const pending=I.stage<intlStages()?`<section class="panel"><h2>${INTL_STAGES[I.stage]} <span class="muted" style="font-weight:400;font-size:14px">${dayLabel(intlDay(I.stage))}</span></h2>${(I.stage<6?intlMatches():I.ties).map(cupTie).join('')}</section>`:'';
  const ko=I.ko.length?`<section class="panel"><h2>淘汰赛</h2>${I.ko.map((rd,j)=>cupRound(INTL_STAGES[6+j],rd,j===I.ko.length-1,'intlko'+j)).reverse().join('')}</section>`:'';
  const order=gi>=0?[gi,...[0,1,2,3].filter(x=>x!==gi)]:[0,1,2,3];
  const groups=`<section class="panel"><h2>${gi>=0?`本队小组：${'ABCD'[gi]} 组`:'小组'}</h2>${tbl(order[0])}
  <details class="fold" data-fold="intl-groups" ${gi<0?'open':''}><summary><span><b>其他小组</b></span></summary>${order.slice(1).map(g=>`<h3 class="grp-h">${'ABCD'[g]} 组</h3>${tbl(g)}`).join('')}</details></section>`;
  const prize=`<section class="panel"><h2>奖金</h2><div class="prize-list"><div><span>小组赛每胜 / 平</span><b>${money(INTL_PRIZE.win)} / ${money(INTL_PRIZE.draw)}</b></div><div><span>进八强</span><b>${money(INTL_PRIZE.ko[0])}</b></div><div><span>进四强</span><b>${money(INTL_PRIZE.ko[1])}</b></div><div><span>进决赛</span><b>${money(INTL_PRIZE.ko[2])}</b></div><div><span>夺冠</span><b>${money(INTL_PRIZE.champion)}</b></div></div></section>`;
  return {head,main:pending+ko+groups,honours:cupHonours('intl',INTL_NAME),prize};
}
// our club's all-time boards: scorers, assists, average rating (players still here are marked)
function vClubBoards(){
  const all=clubCareer(),k=['goals','ast','rating'].includes(UI.hlb)?UI.hlb:'goals';
  const B={goals:['射手',c=>c.goals,c=>c.goals,c=>`${c.apps} 场`],ast:['助攻',c=>c.ast||0,c=>c.ast||0,c=>`${c.goals} 球 · ${c.apps} 场`],
    rating:['评分',c=>(c.rn||0)>=CAREER_RATED?c.rs/c.rn:0,c=>(c.rs/c.rn).toFixed(2),c=>`${c.rn} 场`]};
  const [,val,label,sub]=B[k],list=all.filter(c=>val(c)>0).sort((a,b)=>val(b)-val(a)||a.apps-b.apps).slice(0,10);
  const sw=`<div class="seg sm lb-switch">${Object.entries(B).map(([key,[l]])=>`<button data-act="hlb" data-arg="${key}" aria-pressed="${key===k}">${l}</button>`).join('')}</div>`;
  return `<section class="panel"><h2>队史${B[k][0]}榜</h2>${sw}${list.length?list.map((c,i)=>`<div class="res" style="grid-template-columns:24px 1fr auto"><span class="muted">${i+1}</span><span style="text-align:left">${c.name}${c.now?' <span class="tag2 now">现役</span>':''} <span class="muted">${POS[c.pos]}，${sub(c)}</span></span><span class="num" style="min-width:0">${label(c)}</span></div>`).join('')
    :`<p class="muted" style="margin:0">${k==='rating'?`在队有评分的比赛满 ${CAREER_RATED} 场的球员会列在这里（从这个版本起开始累计）。`:k==='ast'?'还没有人为球队助攻。':'还没有人为球队进球。'}</p>`}</section>`;
}
// our seasons as two charts: where we finished in the whole pyramid (1 = top of 甲级; bands mark the divisions) and
// points per match (divisions play different numbers of rounds). hover or focus a mark for its season; a table below
function vHistoryCharts(){
  const H=S.history;
  if(H.length<2)return `<section class="panel"><h2>队史走势</h2><p class="muted" style="margin:0">踢满两个赛季后，这里会画出历年的联赛位置和成绩。</p></section>`;
  const above=d=>DIV_SIZES.slice(0,d).reduce((a,b)=>a+b,0),total=above(DIVS.length),pos=h=>above(h.div||0)+h.rank;
  const played=h=>h.p||2*(DIV_SIZES[h.div||0]-1),  // records from before matches were kept: the division's rounds
   ppm=h=>h.pts/played(h);
  // drawn at about the width it's shown at, so the labels keep their size on a phone
  const W=Math.round(clamp(((typeof window!=='undefined'&&window.innerWidth)||600)-72,300,600)),L=46,R=14,T=12,B=26,n=H.length,step=(W-L-R)/n,x=i=>L+step*(i+.5);
  // season labels: every one while they fit, else every k-th and the last
  const xl=(h,i)=>{const k=Math.ceil(n/Math.max(4,Math.floor(W/50)));return i%k===0||i===n-1?`<text x="${x(i)}" y="${CH-6}" class="ax" text-anchor="middle">S${h.season}</text>`:''};
  const tip=h=>`第 ${h.season} 季 · ${h.club||my().name} · ${DIVS[h.div||0]}第 ${h.rank} 名 · ${h.pts} 分（场均 ${ppm(h).toFixed(2)}）`;
  // 1. position
  const CH=230,y=v=>T+(v-.5)/total*(CH-T-B);
  const bands=DIVS.map((dn,d)=>`<rect x="${L}" y="${y(above(d)+.5)}" width="${W-L-R}" height="${y(above(d+1)+.5)-y(above(d)+.5)}" class="band${d%2}"/><text x="${L-6}" y="${(y(above(d)+.5)+y(above(d+1)+.5))/2+4}" class="ax" text-anchor="end">${dn}</text>`).join('');
  const pts=H.map((h,i)=>[x(i),y(pos(h))]),last=H[n-1];
  const chart1=`<svg viewBox="0 0 ${W} ${CH}" class="hchart" role="img" aria-label="历年联赛位置">${bands}
    <path d="${pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join('')}" class="hline"/>
    ${H.map((h,i)=>`<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="5" class="hdot" tabindex="0" data-tip="${tip(h)}"/><circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="14" class="hhit" data-tip="${tip(h)}"/>`).join('')}
    <text x="${Math.min(pts[n-1][0],W-R-4)}" y="${pts[n-1][1]-12}" class="hlab" text-anchor="${pts[n-1][0]>W-80?'end':'middle'}">${DIVS[last.div||0]}第 ${last.rank}</text>
    ${H.map(xl).join('')}</svg>`;
  // 2. points per match
  const top=3,y2=v=>CH-B-v/top*(CH-T-B),bw=clamp(step-2,4,28),grid=[1,2,3].map(v=>`<line x1="${L}" x2="${W-R}" y1="${y2(v)}" y2="${y2(v)}" class="grid"/><text x="${L-6}" y="${y2(v)+4}" class="ax" text-anchor="end">${v}</text>`).join('');
  const bar=(h,i)=>{const v=Math.min(top,ppm(h)),x0=x(i)-bw/2,y0=y2(v),hgt=CH-B-y0,r=Math.min(4,bw/2,hgt);
    return `<path d="M${x0} ${CH-B}V${y0+r}Q${x0} ${y0} ${x0+r} ${y0}H${x0+bw-r}Q${x0+bw} ${y0} ${x0+bw} ${y0+r}V${CH-B}Z" class="hbar" tabindex="0" data-tip="${tip(h)}"/>`};
  const chart2=`<svg viewBox="0 0 ${W} ${CH}" class="hchart" role="img" aria-label="历年每场平均积分">${grid}<line x1="${L}" x2="${W-R}" y1="${CH-B}" y2="${CH-B}" class="axis"/>
    ${H.map(bar).join('')}<text x="${x(n-1)}" y="${y2(Math.min(top,ppm(last)))-6}" class="hlab" text-anchor="middle">${ppm(last).toFixed(2)}</text>${H.map(xl).join('')}</svg>`;
  const rows=[...H].reverse().map(h=>`<tr><td>S${h.season}</td><td style="text-align:left">${h.club||my().name}</td><td>${DIVS[h.div||0]}</td><td>${h.rank}</td><td>${h.pts}</td><td>${ppm(h).toFixed(2)}</td><td>${h.gf!=null?`${h.gf}:${h.ga}`:'—'}</td></tr>`).join('');
  return `<section class="panel"><h2>队史走势</h2>
  <h3 class="hc-title">历年联赛位置 <span class="muted">（越高越好）</span></h3>${chart1}
  <h3 class="hc-title">每场平均积分</h3>${chart2}
  <details class="fold"><summary>表格</summary><div class="tw"><table><thead><tr><th>赛季</th><th>球队</th><th>级别</th><th>名次</th><th>积分</th><th>场均</th><th>进/失</th></tr></thead><tbody>${rows}</tbody></table></div></details></section>`;
}
// 一人一城: our players who came up here and stayed (with how far they are from the name), and those who retired as one.
// ★ a 一人一城, 🛡 loyal but not yet good enough, · a few seasons to go
function vOneClub(){
  const now=my().players.filter(p=>p.home===S.my&&seasonsAt(p)>=ONE_CLUB-2).sort((a,b)=>seasonsAt(b)-seasonsAt(a)),gone=S.legends.filter(l=>l.oneClub);
  return `<section class="panel"><h2>一人一城</h2>${now.length||gone.length?`${now.map(p=>`<div class="hrow"><span class="hr-n">${oneClub(p,my())?'★':loyal(p,my())?'🛡':'·'}</span><span class="hr-club"><b>${p.name}</b><small>${POS[p.pos]}，${oneClub(p,my())?'现役':loyal(p,my())?`忠诚，能力 ${p.ovr}/${ONE_CLUB_OVR}`:`再 ${ONE_CLUB-seasonsAt(p)} 季`}</small></span><span class="hr-count"><b>${seasonsAt(p)}</b> 季</span></div>`).join('')}${gone.map(l=>`<div class="hrow"><span class="hr-n">🏟</span><span class="hr-club"><b>${l.name}</b><small>${POS[l.pos]}，第 ${l.season} 季退役</small></span><span class="hr-count"><b>${l.seasons}</b> 季</span></div>`).join('')}`
    :`<p class="muted" style="margin:0">青训出身、一直留在队里满 ${ONE_CLUB} 季的球员是「忠诚」球员；能力达到 ${ONE_CLUB_OVR}，就是「一人一城」。</p>`}</section>`;
}
function vHonours(){
  const H=S.history,R=S.records;
  const count=(f)=>H.filter(f).length;
  const cups=R.filter(r=>r.cup===my().name).length+(S.cup.winner===S.my?1:0);
  const intls=R.filter(r=>r.intl===my().name).length+(S.intl&&S.intl.winner===S.my&&!R.some(r=>r.season===S.season)?1:0);
  const trophies=[...DIVS.map((dn,d)=>[`${dn}冠军`,count(h=>(h.div||0)===d&&h.rank===1)]),[`${CUP_NAME}`,cups],[INTL_NAME,intls],['升级',count(h=>(h.div||0)>0&&h.rank<=SWAP)],['青训出身（现役）',my().players.filter(p=>p.youth).length]];
  return `<div class="cols"><div class="col">${vHistoryCharts()}<section class="panel"><h2>奖杯柜</h2><div class="trophies">${trophies.map(([l,n])=>`<div class="trophy ${n?'got':''}"><div class="num">${n}</div><div>${l}</div></div>`).join('')}</div></section>
  <section class="panel"><h2>称号 <span class="muted" style="font-weight:400;font-size:14px">${Object.keys(S.ach).length}/${Object.keys(ACH).length}</span></h2>
  <div class="achs">${Object.entries(ACH).map(([k,[n,d]])=>S.ach[k]
    ?`<div class="ach got"><b>「${n}」</b><span>${d}</span><small>第 ${S.ach[k]} 赛季解锁</small></div>`
    :`<div class="ach"><b>「？？？」</b><span>${d}</span></div>`).join('')}</div></section>
  </div><div class="col">
  ${(()=>{const won=R.flatMap(r=>(r.awards||[]).flatMap((a,d)=>Object.entries(a).filter(([k,w])=>w&&w.tid===(r.my??S.my)).map(([k,w])=>({r,d,k,w})))
      .concat((r.xi||[]).flatMap((l,d)=>l.filter(w=>w.tid===(r.my??S.my)).map(w=>({r,d,k:'xi',w})))));
    return `<section class="panel"><h2>个人奖项${won.length?` <span class="muted" style="font-weight:400;font-size:13px">${won.length} 项</span>`:''}</h2>${won.length?'<div class="scrollbox">'+won.reverse().map(x=>`<div class="res" style="grid-template-columns:1fr auto"><span style="text-align:left">第 ${x.r.season} 季${DIVS[x.d]}${AWARDS[x.k]||'最佳阵容'}：${x.w.name}</span><span class="muted">${x.w.stat}</span></div>`).join('')+'</div>':'<p class="muted" style="margin:0">还没有球员拿过个人奖项。</p>'}</section>`})()}
  ${vClubBoards()}
  ${vOneClub()}
  <section class="panel"><h2>传奇退役${S.legends.length?` <span class="muted" style="font-weight:400;font-size:13px">${S.legends.length} 人</span>`:''}</h2>${S.legends.length?'<div class="scrollbox">'+[...S.legends].reverse().map(l=>`<div class="res" style="grid-template-columns:1fr auto"><span style="text-align:left">${l.name}${l.oneClub?' <span class="tag2 oneclub">一人一城</span>':''} <span class="muted">${POS[l.pos]}，第 ${l.season} 季${l.club&&l.club!==my().name?`于${l.club}`:''}退役${l.seasons?`，效力 ${l.seasons} 季`:''}${l.titles&&l.titles.length?`，${l.titles.length} 座冠军`:''}</span></span><span class="muted">${l.apps} 场 ${l.goals} 球</span></div>`).join('')+'</div>':`<p class="muted" style="margin:0">在队效力 ${LEGEND_TITLE_SEASONS} 季以上并帮球队夺冠，或效力 ${LEGEND_SEASONS} 季以上的球员，在队退役后会记在这里。</p>`}</section>
  ${vCareer()}
  <section class="panel"><h2>历届冠军</h2>${R.length?`<div class="tw scrollbox"><table class="sticky-head"><thead><tr><th>季</th>${DIVS.map(dn=>`<th>${dn}</th>`).join('')}<th>${CUP_NAME}</th><th>本队</th></tr></thead>
  <tbody>${R.slice().reverse().map(r=>`<tr><td>${r.season}</td>${DIVS.map((_,d)=>`<td>${r.champs[d]||'—'}</td>`).join('')}<td>${r.cup||'—'}</td><td>${DIVS[r.div]}第 ${r.rank}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted" style="margin:0">打完第一个赛季后，这里会记录每季的冠军。</p>'}</section></div></div>`;
}
