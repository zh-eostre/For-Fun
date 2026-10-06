/* ---------- views ---------- */
const reducedMotion=()=>window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function render(){
  const app=document.getElementById('app'),a=document.activeElement;
  // the whole page is rebuilt each time, so put keyboard focus back on the same control afterwards
  const keep=a&&app.contains(a)&&a.dataset.act?[a.dataset.act,a.dataset.arg,a.classList[0]]:null;
  // elements with data-flip glide from their old spot to the new one (players moving on the pitch)
  const before={};app.querySelectorAll('[data-flip]').forEach(el=>before[el.dataset.flip]=el.getBoundingClientRect());
  app.innerHTML=view();
  // folding panels keep whatever open/closed state the player last chose
  app.querySelectorAll('details[data-fold]').forEach(d=>{const k=d.dataset.fold;if(UI.folds&&k in UI.folds)d.open=UI.folds[k]});
  if(keep){const el=[...app.querySelectorAll('[data-act]')].find(e=>e.dataset.act===keep[0]&&e.dataset.arg===keep[1]&&e.classList[0]===keep[2]);if(el)el.focus({preventScroll:true})}
  // dialog focus goes after the general restore so it wins: into the dialog on open, back to the opener on close
  const dlg=app.querySelector('.modal');
  document.body.style.overflow=dlg?'hidden':'';
  if(dlg&&UI.modalFocus){dlg.querySelector('.mclose').focus({preventScroll:true});UI.modalFocus=false}
  if(!dlg&&UI.returnFocus!=null){const el=app.querySelector(`[data-act="player"][data-arg="${UI.returnFocus}"]`);if(el)el.focus({preventScroll:true});UI.returnFocus=null}
  if(!reducedMotion())app.querySelectorAll('[data-flip]').forEach(el=>{
    const b=before[el.dataset.flip];if(!b||!el.animate)return;
    const r=el.getBoundingClientRect(),dx=b.left-r.left,dy=b.top-r.top;
    if(Math.abs(dx)+Math.abs(dy)>1)el.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'none'}],{duration:420,easing:'cubic-bezier(.2,.8,.2,1)'});
  });
}
function view(){
  const main=mainView();
  return S&&UI.modal&&!(UI.view==='match'&&M)?main+vModal():main;
}
function mainView(){
  if(!S)return vStart();
  if(UI.view==='match'&&M)return vMatch();
  if(S.round>=ROUNDS)return vHeader()+`<div class="wrap">${vSeasonEnd()}</div>`;
  const tabs=[['home','俱乐部',vHome],['squad','阵容',vSquad],['table','积分榜',()=>vTable()],['cup',CUP_NAME,vCup],['market','转会市场',vMarket],['fac','设施',vAcademy],['honours','荣誉室',vHonours]];
  const pg=UI.pages&&UI.pages[UI.pages.length-1];
  if(pg)return vHeader()+`<div class="wrap"><button class="btn small" data-act="back" style="margin-bottom:12px">← 返回</button>${vTeamPage(pg.id)}</div>`;
  const cur=tabs.find(t=>t[0]===UI.tab)||tabs[0];
  return vHeader()+`<div class="wrap"><nav class="tabs">${tabs.map(([k,l])=>`<button data-act="tab" data-arg="${k}" ${cur[0]===k?'aria-current="page"':''}>${l}</button>`).join('')}</nav>${cur[2]()}</div>`;
}
function vStart(){
  const saved=load();
  if(!UI.draft)UI.draft=teamNames();
  return `<div class="wrap"><div class="start-hero"><h1 class="disp">绿茵经理</h1>
  <p>挑一支球队，带它打完一个又一个赛季。</p></div>
  ${saved?`<div class="panel"><b>有一份存档：</b>${saved.teams[saved.my].name}（${DIVS[saved.teams[saved.my].div]}），第 ${saved.season} 赛季第 ${Math.min(saved.round+1,ROUNDS)} 轮${saved.live?'（比赛进行中）':''}。
  <div class="go" style="justify-content:flex-start"><button class="btn primary" data-act="continue">继续存档</button></div></div>
  <h2>或者重新开始</h2><p class="muted" style="margin-top:-6px;font-size:14px">选新球队会覆盖旧存档。</p>`:`<h2>选择你的球队</h2>`}
  <p style="margin:-4px 0 0;display:flex;gap:8px;flex-wrap:wrap"><button class="btn small" data-act="reroll">换一批队名</button>${canPickDir()?'<button class="btn small" data-act="listSaves">从存档文件夹读取</button>':''}<button class="btn small" data-act="importSave">从文件读取存档</button></p>
  ${UI.saveFiles?vSaveList():''}
  ${DIVS.map((dn,div)=>`<h3>${dn}联赛${div?'<span class="muted" style="font-weight:400;font-size:14px">，从低级别打起，前 '+SWAP+' 名升级</span>':''}</h3>
  <div class="teams" style="margin-top:8px">${TEAMS.map((t,i)=>{
    if(t.div!==div)return '';
    const diff=div?'冲击升级':t.str>=69?'简单':t.str>=62?'普通':'困难';
    return `<button class="team-pick" style="--c:${t.color}" data-act="start" data-arg="${i}"><b class="disp">${UI.draft[i].name}</b>
    <span>实力 ${t.str}，${div?'目标':'难度'}${diff}，预算 ${money(startBudget(t))}</span></button>`}).join('')}</div>`).join('')}
  <p class="muted" style="font-size:13px;margin-top:20px">甲级和乙级各 8 支球队双循环，每季 ${ROUNDS} 轮。赛季结束后甲级最后 ${SWAP} 名降级，乙级前 ${SWAP} 名升级。球队都是虚构的。</p></div>`;
}
function vHeader(){
  const t=my();
  return `<header class="club" style="--team:${t.color}"><div class="wrap">
  <div class="crest disp">${t.short[0]}</div>
  <div><div class="club-name disp">${t.name}</div>
  <div class="club-meta">${DIVS[t.div]}联赛，第 ${S.season} 赛季，${S.round<ROUNDS?`${dayLabel(S.day)}，第 ${S.round+1}/${ROUNDS} 轮`:'赛季结束'}，排名第 ${myRank()}${S.boost>0?' <span class="tag2 boost">士气高涨</span>':''}</div></div>
  <div class="cash"><div class="club-meta">俱乐部资金</div><div class="num" style="color:${S.budget<0?'var(--red)':'inherit'}">${money(S.budget)}</div></div>
  </div></header>`;
}
// the next ten days, what happened over the last days skipped, and how fresh the starting XI is
function vCalendar(){
  const days=matchDays(),T=TRAIN[S.training][0],today=dayType(S.day,days);
  const cell=d=>{
    const t=dayType(d,days),m=days.find(x=>x.day===d);
    let what='',sub='';
    if(t==='match'){
      const fx=m.cup?S.cup.ties.find(x=>x.includes(S.my)):S.fixtures[my().div][m.r].find(x=>x.includes(S.my));
      const opp=S.teams[fx[0]===S.my?fx[1]:fx[0]];
      what=m.cup?CUP_NAME:'联赛';sub=`${fx[0]===S.my?'主':'客'} ${opp.short}`;
    }else if(t==='rest'){what='休息';sub=`体能 +${restAmt()}`}
    else{what='训练';sub=T}
    return `<div class="day ${t} ${d===S.day?'today':''}"><span class="wd">${WEEKDAYS[d%7]}</span><b>${what}</b><small>${sub}</small></div>`;
  };
  const strip=Array.from({length:10},(_,i)=>S.day+i).filter(d=>d<=leagueDay(ROUNDS-1)).map(cell).join('');
  const xi=S.lineup.map(id=>id!=null&&findP(id)).filter(Boolean),avg=xi.length?Math.round(xi.reduce((s,p)=>s+p.cond,0)/xi.length):0;
  const tired=xi.filter(p=>p.cond<80).sort((a,b)=>a.cond-b.cond).slice(0,3);
  const L=UI.dayLog,left=nextMatchDay()-S.day;
  return `<section class="panel"><h2>日程 <span class="muted" style="font-weight:400;font-size:14px">${dayLabel(S.day)}，今天${today==='match'?'是比赛日':today==='rest'?'休息':`训练（${T}）`}</span></h2>
  <div class="days">${strip}</div>
  ${L?`<p class="daylog">过了 ${L.days} 天：全队体能共 ${L.cond>=0?'+':''}${L.cond}${L.trained.length?`；训练中进步：${L.trained.map(p=>`${p.name}（${p.ovr}）`).join('、')}`:'；训练中没有人进步'}${L.healed.length?`；伤愈复出：${L.healed.map(p=>p.name).join('、')}`:''}。</p>`:''}
  ${L&&L.surprises?L.surprises.map(t=>`<p class="surprise">✨ ${t}</p>`).join(''):''}
  <p class="muted" style="margin:8px 0 0;font-size:14px">首发平均体能 <b>${avg}</b>${tired.length?`，偏低：${tired.map(p=>`${p.name} ${p.cond}`).join('、')}`:'，全员状态良好'}。</p>
  <div class="cal-train"><span class="muted">训练</span><div class="seg sm">${Object.entries(TRAIN).map(([k,v])=>`<button data-act="train" data-arg="${k}" aria-pressed="${S.training===k}" title="${v[1]}">${v[0]}</button>`).join('')}</div><span class="muted cal-hint">${TRAIN[S.training][1]}</span></div>
  ${today==='match'?'':`<div class="go" style="justify-content:flex-start;margin-top:10px"><button class="btn" data-act="nextDay">进入下一天</button><button class="btn primary" data-act="ff">快进到比赛日（${left} 天）</button></div>`}</section>`;
}
function vHome(){
  const f=nextFix(),opp=S.teams[f.opp],ob=bestForm(opp,!f.home);
  const ms=strength(my(),S.lineup,S.tactic,f.home,S.boost>0?BOOST:0,S.formation);
  const os=strength(opp,ob.ids,tacFor(ob.r,rating(ms)),!f.home,0,ob.form);
  const H=S.teams[f.h],A=S.teams[f.a],iss=lineupIssues();
  const hs=f.home?rating(ms):rating(os),as=f.home?rating(os):rating(ms);
  // events and bids need an answer: first thing on a phone, top of the right column on a wide screen
  const ask=vEvent()+vOffer();
  return `${ask?`<div class="narrow-only">${ask}</div>`:''}<div class="cols"><div class="col">${vCalendar()}<section class="panel ${f.cup?'cupmatch':''}"><h2>下一场：${fixLabel(f)}，${f.home?'主场':'客场'}${f.derby?' <span class="tag2 derby">宿敌之战</span>':''}</h2>
  ${f.derby?`<p class="muted" style="margin:-6px 0 8px;font-size:13px">收入翻倍，赢了全队士气高涨 2 场。</p>`:''}${f.cup?`<p class="muted" style="margin:-6px 0 8px;font-size:13px">一场定胜负，平局直接点球大战。</p>`:''}
  <div class="fixture"><div><div class="t disp" style="color:${H.color}">${H.name}</div><div class="str">综合实力 <span class="num">${hs}</span></div></div>
  <div class="vs num">VS</div>
  <div><div class="t disp" style="color:${A.color}">${A.name}</div><div class="str">综合实力 <span class="num">${as}</span></div></div></div>
  ${vOppReport(opp,ob,tacFor(ob.r,rating(ms)))}
  <div class="go"><span class="muted" style="font-size:14px">阵型 ${S.formation}，战术${TACT[S.tactic]}</span>
  <button class="btn" data-act="tab" data-arg="squad">调整阵容</button>
  ${isMatchDay()?'<button class="btn primary" data-act="play">开始比赛</button>':`<span class="muted" style="font-size:14px">${nextMatchDay()-S.day} 天后开赛</span>`}</div>
  ${iss.length?`<p class="warn" style="text-align:center">${iss.join('；')}，请先去阵容页调整。</p>`:''}</section>
  ${vBoard()}</div>
  <div class="col">${ask?`<div class="wide-only">${ask}</div>`:''}
  <section class="panel"><h2>俱乐部动态</h2><ul class="news">${S.news.map(n=>`<li><span class="tag">${n.r.replace(/^S\d+ /,'')}</span><span>${n.t}</span></li>`).join('')}</ul></section>
  ${vCheat()}
  ${vSavePanel()}</div></div>`;
}
// this season's board objectives and how we're tracking
function vBoard(){
  const g=S.goal,st=goalStatus();if(!g)return '';
  const c=cupReached(),cupTxt=g.cup<0?'':st.cup?'已达成':c<g.cup&&!inCup()?'未达成（已出局）':`进行中（目前${CUP_STAGES[Math.min(c,CUP_STAGES.length-1)]}）`;
  return `<section class="panel"><h2>董事会目标</h2>
  <div class="cheat-row"><span class="${st.league?'goal-ok':'goal-no'}">${st.league?'✓':'·'}</span>联赛第 ${g.rank} 名以内（目前第 ${myRank()}）<span class="muted">奖金 ${money(GOAL_BONUS.league[my().div])}</span></div>
  ${g.cup<0?'':`<div class="cheat-row"><span class="${st.cup?'goal-ok':'goal-no'}">${st.cup?'✓':'·'}</span>${CUP_NAME}进入${CUP_STAGES[g.cup]}：${cupTxt}<span class="muted">奖金 ${money(GOAL_BONUS.cup)}</span></div>`}</section>`;
}
// another club's squad: tap a name for details, or buy straight away at their asking price
function vTeamPage(tid){
  const t=S.teams[tid],rk=table(t.div).findIndex(r=>r.id===tid)+1,b=bestForm(t,true);
  const rows=PO.map(pos=>`<div class="group-h">${POS[pos]}</div><div class="mlist">`+t.players.filter(p=>p.pos===pos).sort((a,b)=>b.ovr-a.ovr).map(p=>{
    const why=buyBlock(p,t);
    return `<div class="mrow"><div style="min-width:0"><div class="pname"><button class="link" data-act="player" data-arg="${p.id}">${p.name}</button>${p.sig?` <span class="sig" style="display:inline">「${p.sig}」</span>`:''}</div>
      <div class="price">${p.age} 岁，${p.apps} 场 ${p.goals} 球${p.rn?`，评分 ${avgRating(p).toFixed(1)}`:''}${unavail(p)?'，伤停中':''}</div></div>
      <div><div class="ovr num">${p.ovr}</div><div class="potl">${p.age>23?`潜力 ${p.pot}`:'潜力 ?'}</div></div>
      <button class="btn small primary" data-act="bid" data-arg="${p.id}" ${why?`disabled title="${why}"`:''}>${money(askPrice(p,t))}</button></div>`}).join('')+'</div>').join('');
  return `<section class="panel" style="border-left:6px solid ${t.color}"><h2>${t.name}</h2>
  <p class="muted" style="margin:-4px 0 0;font-size:14px">${DIVS[t.div]}第 ${rk} 名 · 常用阵型 ${b.form} · ${t.players.length} 人${tid===S.rival?' · 宿敌（要价贵 30%）':''}</p></section>
  <section class="panel" style="padding:4px 10px"><p class="muted" style="font-size:13px;margin:8px 0">按钮上是对方要价：主力和核心球员要价更高。阵容不足 16 人或门将只剩 2 个时对方不卖。</p>${rows}</section>`;
}
// one player in detail, ours or another club's
// the player dialog: clicking the dimmed backdrop closes it; the dialog itself swallows clicks (data-act="noop")
function vModal(){
  return `<div class="modal-bg" data-act="closeModal"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="mtitle" data-act="noop">${vPlayer(UI.modal.id)}</div></div>`;
}
function vPlayer(id){
  const f=findAny(id);if(!f)return '<p class="muted">这名球员已经不在联赛里了。</p>';
  const {p,t}=f,mine=t.id===S.my,c=S.club[p.id]||{},hist=(p.hist||[]).concat([{s:S.season,o:p.ovr}]);
  const cell=(l,v)=>`<div class="pcell"><small>${l}</small><b>${v}</b></div>`;
  const status=[p.inj?`伤停 ${p.inj} 天`:'',p.ban?`停赛 ${p.ban} 轮`:'',p.away?'探亲中':'',p.loan?`租借至${loanLabel(p)}（${p.lapps||0} 场）`:'',unproven(p)?`未出道 ${careerApps(p)}/${YOUTH_PROVEN}`:''].filter(Boolean).join('，');
  const actions=mine
    ?`${p.loan?`<button class="btn small" data-act="recall" data-arg="${p.id}">召回</button>`:p.age<=LOAN_AGE?`<button class="btn small" data-act="loan" data-arg="${p.id}">外租（赛季结束回归）</button>`:''}
      <button class="btn small danger" data-act="sell" data-arg="${p.id}">出售 ${money(sellPrice(p))}</button>`
    :(()=>{const why=buyBlock(p,t);return `<button class="btn small primary" data-act="bid" data-arg="${p.id}" ${why?'disabled':''}>以 ${money(askPrice(p,t))} 签下</button>${why?`<span class="muted" style="font-size:13px">${why}</span>`:''}`})();
  return `<section class="panel"><div class="mhead"><h2 id="mtitle">${p.name}${p.youth?' <span class="tag2 youth">青训</span>':''}</h2><button class="btn small mclose" data-act="closeModal" aria-label="关闭">✕</button></div>
  <p class="muted" style="margin:-4px 0 10px;font-size:14px">${POS[p.pos]}，${p.age} 岁，${t.name}${status?`。${status}`:''}</p>
  ${p.sig?`<p class="sig" style="margin:0 0 10px">必杀技「${p.sig}」</p>`:''}
  <div class="pgrid">${cell('能力',p.ovr)}${cell('潜力',mine||p.age>23?p.pot:'?')}${cell('体能',p.cond)}${cell('身价',money(mine?marketValue(p):value(p)))}</div>
  <h3>本赛季</h3><div class="pgrid">${cell('出场',p.apps)}${cell('进球',p.goals)}${cell('平均评分',p.rn?avgRating(p).toFixed(2):'—')}${cell('黄牌',p.yc||0)}</div>
  ${mine?`<h3>在队生涯</h3><div class="pgrid">${cell('效力赛季',(c.seasons||0)+1)}${cell('出场',(c.apps||0)+p.apps)}${cell('进球',(c.goals||0)+p.goals)}${cell('租借出场',(c.lapps||0)+(p.lapps||0))}</div>
  ${(c.titles||[]).length?`<p style="margin:4px 0 0;font-size:13px">🏆 ${c.titles.join('、')}</p>`:''}${isLegend(c)?'<p class="sig" style="margin:4px 0 0">已达到传奇标准：在队退役就会载入史册</p>':''}
  <h3>能力变化</h3><p style="margin:0;font-size:14px">${hist.map(h=>`第 ${h.s} 季 <b class="num" style="font-size:18px">${h.o}</b>`).join(' → ')}</p>`:''}
  <div class="go" style="justify-content:flex-start">${actions}</div></section>`;
}
// export / load: straight into a chosen folder where the browser allows it, otherwise download / file picker
function vSavePanel(){
  const dirOK=canPickDir(),F=UI.saveFiles;
  return `<details class="panel fold" data-fold="${F?'saves-list':'saves'}" ${F?'open':''}><summary><h2>存档文件</h2></summary>
  <p class="muted" style="margin:0 0 10px;font-size:14px">${dirOK
    ?`已自动保存在这个浏览器里。导出会写进你选的存档文件夹${UI.dirName?`（现在是「${UI.dirName}」）`:'（第一次导出时选一次，例如项目里的 saves 文件夹）'}。`
    :'已自动保存在这个浏览器里。这个浏览器只能把导出文件下载到默认的下载文件夹（Chrome 或 Edge 可以直接存进指定文件夹）。'}</p>
  <div class="go" style="justify-content:flex-start;margin-top:0">
    <button class="btn" data-act="exportSave">${dirOK?'导出到存档文件夹':'导出存档文件'}</button>
    ${dirOK?'<button class="btn" data-act="listSaves">从存档文件夹读取</button><button class="btn small" data-act="pickDir">更换文件夹</button>':''}
    <button class="btn${dirOK?' small':''}" data-act="importSave">从其他位置选择文件</button></div>
  ${F?vSaveList():''}</details>`;
}
function vSaveList(){
  const F=UI.saveFiles,time=t=>new Date(t).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
  return `<div class="savelist">${F.length?F.map(f=>`<div class="cheat-row"><button class="btn small" data-act="loadDir" data-arg="${f.name}">读取</button><span>${f.name}</span><span class="muted" style="font-size:12px">${time(f.time)}</span></div>`).join(''):'<p class="muted" style="margin:0">这个文件夹里还没有存档。</p>'}</div>`;
}
function vEvent(){
  if(!S.event)return '';
  const E=EVENTS[S.event.k],p=eventPlayer();
  if(E.who&&!p)return '';
  return `<section class="panel event" role="status"><h2>突发事件</h2><p style="margin:-4px 0 10px">${E.text(p)}</p>
  ${E.opts.map((o,i)=>`<div class="cheat-row"><button class="btn small ${i?'':'primary'}" data-act="event" data-arg="${i}" ${o[3]&&!o[3]()?'disabled':''}>${o[0]}</button><span class="muted">${o[1]}</span></div>`).join('')}</section>`;
}
function vOffer(){
  const o=S.offer,p=o&&findP(o.pid);
  if(!p)return '';
  return `<section class="panel offer"><h2>转会报价</h2>
  <p style="margin:-4px 0 10px">${S.teams[o.club].name}（${DIVS[S.teams[o.club].div]}）带着 <b>${money(o.amount)}</b> 的契约书前来，想要带走 <b>${p.name}</b>（${POS[p.pos]}，能力 ${p.ovr}，${p.age} 岁）。
  <span class="muted">他的身价约 ${money(marketValue(p))}。报价下一场比赛后失效。</span></p>
  <div class="go" style="justify-content:flex-start;margin-top:0"><button class="btn primary" data-act="offerYes">接受</button><button class="btn" data-act="offerNo">拒绝</button></div></section>`;
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
    <button class="btn small" data-act="recall" data-arg="${p.id}" ${squadFull()?'disabled title="一线队已满 22 人"':''}>召回</button></div>`}).join('')}
  <p class="muted" style="margin:8px 0 0;font-size:12px">赛季结束时自动回归。召回需要一线队有空位。</p></section>`;
}
function vSquad(){
  const t=my(),on=new Set(S.lineup),iss=lineupIssues();
  const rows=PO.map(pos=>{
    const ps=t.players.filter(p=>p.pos===pos&&!p.loan).sort((a,b)=>b.ovr-a.ovr);
    return `<div class="group-h">${POS[pos]}（${ps.length}）</div>`+ps.map(p=>`
    <div class="prow ${on.has(p.id)?'on':''} ${unavail(p)?'inj':''}" data-act="toggle" data-arg="${p.id}" role="button" tabindex="0" aria-pressed="${on.has(p.id)}">
      <span class="tick">${on.has(p.id)?'✓':''}</span>
      <div style="min-width:0"><div class="pname"><button class="link" data-act="player" data-arg="${p.id}">${p.name}</button>${gem(p)}${p.youth?' <span class="tag2 youth">青训</span>':''}${unproven(p)?` <span class="muted" style="font-size:11px;font-weight:400" title="出场满 ${YOUTH_PROVEN} 场或下赛季开始时出道，之前买家只按当前能力出价">未出道 ${careerApps(p)}/${YOUTH_PROVEN}</span>`:''}</div>
      <div class="pmeta">${p.sig?`<span class="sig" style="display:inline">★</span> `:''}${p.age} 岁，${p.apps} 场 ${p.goals} 球${p.rn?`，评分 ${avgRating(p).toFixed(1)}`:''}${p.yc?`，黄牌 ${p.yc}`:''}${p.inj?` <span class="injtag">伤停 ${p.inj} 天</span>`:''}${p.ban?` <span class="injtag">停赛 ${p.ban} 轮</span>`:''}${p.away?` <span class="injtag">探亲 ${p.away} 轮</span>`:''}${p.loan?` <span class="loantag">租借至${p.loan.club} · ${p.lapps||0} 场</span>`:''}${!unavail(p)&&p.cond<60?' <span class="risktag">伤病风险高</span>':''}${retireChance({...p,age:p.age+1})>=.3?` <span class="muted" style="font-size:11px" title="赛季结束时有 ${Math.round(retireChance({...p,age:p.age+1})*100)}% 机会退役">可能退役</span>`:''}</div>
</div>
      <div><div class="ovr num">${p.ovr}${gainTag(p)}</div><div class="potl">潜力 ${p.pot}</div></div>
      <div><div class="bar ${p.cond<60?'low':''}"><i style="width:${p.cond}%"></i></div><div class="barlbl">体能 ${p.cond}</div></div>
      <div class="act"><button class="btn small danger" data-act="sell" data-arg="${p.id}">出售 ${money(sellPrice(p))}</button></div>
    </div>`).join('');
  }).join('');
  return `<section class="panel"><div class="toolbar">
  <div><label>阵型</label><div class="seg">${Object.keys(FORMS).map(f=>`<button data-act="form" data-arg="${f}" aria-pressed="${S.formation===f}">${f}</button>`).join('')}</div></div>
  <div><label>战术</label><div class="seg">${Object.entries(TACT).map(([k,v])=>`<button data-act="tac" data-arg="${k}" aria-pressed="${S.tactic===k}">${v}</button>`).join('')}</div></div>
  </div>
  <div class="toolbar" style="align-items:center;margin:0">
  <div class="count">首发 <span class="num">${lineupCount()}</span>/11</div>
  <button class="btn" data-act="auto">按 ${S.formation} 自动选人</button>
  ${iss.length?`<span class="warn">${iss[0]}</span>`:'<span class="muted" style="font-size:14px">阵型决定 11 个位置，球场上按位置排</span>'}
  </div></section>
  <div class="cols squad"><div class="col">${vPitch()}</div>
  <div class="col"><section class="panel" style="padding:4px 6px"><h2 style="margin:10px 10px 0">一线队 <span class="muted" style="font-weight:400;font-size:14px">${squadSize()}/22 · 点名字看详情</span></h2>${rows}</section>
  ${vLoans()}</div></div>`;
}
// the XI drawn on a pitch, attacking upwards. every slot of the formation gets a spot, so the shape always matches
// the formation; the tactic pushes the outfield lines up or down; wide slots in back/mid lines of 4+ sit a bit higher
const shortName=n=>n.split('·')[0];
const PITCH_Y={FW:17,MF:42,DF:66,GK:89};
function pitchSpots(ids,form){
  const tac=M&&!M.done?M.tac:S.tactic,roles=slotRoles(form),shift=tac==='att'?-5:tac==='def'?5:0,spots=[];
  PO.forEach(pos=>{
    const idx=roles.map((r,i)=>r===pos?i:-1).filter(i=>i>=0),n=idx.length;
    const gap=n<=2?28:Math.min(24,80/(n-1));
    idx.forEach((slot,k)=>{
      const x=50+(k-(n-1)/2)*gap,w=(x-50)/40;
      const y=PITCH_Y[pos]+(pos==='GK'?0:shift)-(n>=4&&(pos==='DF'||pos==='MF')?6*w*w:0);
      spots.push({slot,role:pos,p:ids[slot]!=null?findP(ids[slot]):null,x,y});
    });
  });
  return spots;
}
// o: style, act + arg (default: toggle this player), cls, marks (extra badges after the name), role (the slot's role)
function tok(p,o={}){
  const oop=o.role&&p.pos!==o.role;
  return `<button class="tok ${unavail(p)?'out':''} ${oop?'oop':''} ${o.cls||''}" style="${o.style||''}" data-act="${o.act||'toggle'}" data-arg="${o.arg??p.id}" data-flip="p${p.id}" title="${p.name}${oop?`（本职${POS[p.pos]}，打${POS[o.role]}）`:''}">
    <span class="tc num ${p.cond<60?'low':''}">${p.ovr}</span><span class="tn">${oop?`<b class="mk oopk">${POS[p.pos][0]}</b>`:''}${shortName(p.name)}${p.sig?'<i>★</i>':''}${o.marks||''}</span>
    <span class="tb"><i style="width:${p.cond}%"></i></span></button>`;
}
const emptySlot=(s,act,sel)=>`<button class="tok empty ${sel?'sel':''}" style="left:${s.x}%;top:${s.y}%" data-act="${act}" data-arg="${s.slot}" title="空位：${POS[s.role]}"><span class="tc">${POS[s.role][0]}</span><span class="tn">空位</span></button>`;
const pitchBox=(inner,label,form)=>`<div class="pitch" style="--team:${my().color}" aria-label="${label}">
    <div class="pl half"></div><div class="pl circle"></div><div class="pl box top"></div><div class="pl box bot"></div>
    ${inner}<span class="pitch-note">${form} · ${TACT[M&&!M.done?M.tac:S.tactic]}</span></div>`;
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
  <div class="bench">${bench.map(p=>`<div class="bslot"><small>${POS[p.pos]}${p.inj?' · 伤':p.ban?' · 停赛':p.away?' · 探亲':p.loan?' · 租借':''}</small>${tok(p,{act:'bench'})}</div>`).join('')||'<span class="muted">没有替补</span>'}</div></section>`;
}
// switcher: show the division picker (the 积分榜 tab); without it the given division is shown as-is (season end)
function vTable(div,switcher=true){
  if(div===undefined)div=UI.div??my().div;
  const T=table(div),res=S.results[div];
  const last=res[res.length-1];
  const sc=S.teams.filter(t=>t.div===div).flatMap(t=>t.players.filter(p=>p.goals>0).map(p=>({p,t}))).sort((a,b)=>b.p.goals-a.p.goals).slice(0,5);
  const RL_MIN=Math.max(1,Math.floor(res.length/2)),rl=S.teams.filter(t=>t.div===div).flatMap(t=>t.players.filter(p=>p.rn>=RL_MIN).map(p=>({p,t}))).sort((a,b)=>avgRating(b.p)-avgRating(a.p)).slice(0,5);
  const pickDiv=switcher?`<div class="seg sm" style="margin-bottom:10px">${DIVS.map((dn,d)=>`<button data-act="div" data-arg="${d}" aria-pressed="${d===div}">${dn}${d===my().div?'（本队）':''}</button>`).join('')}</div>`:'';
  const legend=[div>0?`<span class="zl up">前 ${SWAP} 名升级</span>`:'',div<DIVS.length-1?`<span class="zl down">后 ${SWAP} 名降级</span>`:''].join('');
  return `<div class="cols"><div class="col"><section class="panel"><h2>${DIVS[div]}积分榜</h2>${pickDiv}<div class="tw"><table>
  <thead><tr><th>#</th><th>球队</th><th>场</th><th>胜</th><th>平</th><th>负</th><th>进/失</th><th>积分</th></tr></thead>
  <tbody>${T.map((r,i)=>`<tr class="${r.id===S.my?'me':''} ${zone(div,i+1)}"><td>${i+1}</td><td><span class="dot" style="background:${r.color}"></span>${r.id===S.my?r.name:`<button class="link" data-act="team" data-arg="${r.id}">${r.name}</button>`}${r.id===S.rival?' <span class="tag2 derby">宿敌</span>':''}</td>
  <td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf}:${r.ga}</td><td class="pts">${r.pts}</td></tr>`).join('')}</tbody></table></div><p class="legend">${legend}</p></section></div><div class="col">
  ${last?`<section class="panel"><h2>上一轮赛果</h2>${last.map(r=>`<div class="res"><span>${S.teams[r.h].name}</span><span class="num">${r.hg} : ${r.ag}</span><span>${S.teams[r.a].name}</span></div>`).join('')}</section>`:''}
  ${sc.length?`<section class="panel"><h2>射手榜</h2>${sc.map((x,i)=>`<div class="res" style="grid-template-columns:24px 1fr auto"><span class="muted">${i+1}</span><span style="text-align:left">${x.p.name} <span class="muted">${x.t.name}</span></span><span class="num" style="min-width:0">${x.p.goals}</span></div>`).join('')}</section>`:''}
  ${rl.length?`<section class="panel"><h2>评分榜 <span class="muted" style="font-weight:400;font-size:13px">出场 ${RL_MIN} 场以上</span></h2>${rl.map((x,i)=>`<div class="res" style="grid-template-columns:24px 1fr auto"><span class="muted">${i+1}</span><span style="text-align:left">${x.p.name} <span class="muted">${POS[x.p.pos]}，${x.t.name}</span></span>${rtag(avgRating(x.p))}</div>`).join('')}</section>`:''}</div></div>`;
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
    return `<div class="fac"><div class="fh"><b>${f.name}</b><span class="tag2" style="background:var(--pitch);color:#fff">${L} 级</span></div>
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
  const weak=avg.filter(a=>a.pos!=='GK').sort((a,b)=>a.v-b.v)[0],star=xi.filter(Boolean).sort((a,b)=>b.ovr-a.ovr)[0];
  const hurt=opp.players.filter(unavail).length;
  return `<div class="oppr"><b>球探情报：${opp.name}</b>（预计 ${ob.form}，${TACT[tac]}）
  <div class="lines">${avg.map(a=>`<span class="${a===weak?'weak':''}">${POS[a.pos]} <b class="num">${a.v}</b></span>`).join('')}</div>
  <span>最薄弱：${POS[weak.pos]}线。王牌：${star.name}（${POS[star.pos]}，${star.ovr}${star.sig?`，必杀「${star.sig}」`:''}）。${hurt?`对方 ${hurt} 人伤停。`:''}</span></div>`;
}
function vAcademy(){
  const A=S.academy,lv=A.lv,max=lv>=ACADEMY_COST.length,cost=ACADEMY_COST[lv];
  const grads=my().players.filter(p=>p.youth).sort((a,b)=>b.ovr-a.ovr);
  const conf={high:'把握高',mid:'把握一般',low:'把握很低'};
  return vReveal()+`${vFacilities()}<section class="panel"><h2>青训营 <span class="tag2" style="background:var(--pitch);color:#fff">${lv} 级</span></h2>
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
  ${squadFull()?'<p class="warn">一线队已满 22 人，先卖掉一些人才能签入。</p>':''}</section>
  </div><div class="col"><section class="panel"><h2>青训出品</h2>${grads.length?grads.map(p=>`<div class="res" style="grid-template-columns:1fr auto"><span style="text-align:left">${p.name} <span class="muted">${POS[p.pos]}，${p.age} 岁，${p.apps} 场 ${p.goals} 球</span></span><span class="num">${p.ovr}<span class="muted" style="font-size:13px">/${p.pot}</span></span></div>`).join(''):'<p class="muted" style="margin:0">一线队里还没有青训出身的球员。</p>'}</section></div></div>`;
}
function vMarket(){
  const F=UI.mf;
  let list=S.market.filter(p=>(F.pos==='all'||p.pos===F.pos)&&(F.age==='all'||(F.age==='y'?p.age<=21:F.age==='m'?p.age>=22&&p.age<=28:p.age>=29)));
  list.sort((a,b)=>F.sort==='pot'?shownPot(b)-shownPot(a):F.sort==='price'?a.price-b.price:b.ovr-a.ovr);
  const seg=(key,opts)=>`<div class="seg sm">${opts.map(([v,l])=>`<button data-act="mf" data-arg="${key}:${v}" aria-pressed="${F[key]===v}">${l}</button>`).join('')}</div>`;
  return vReveal()+`<section class="panel"><h2>转会市场</h2>
  <p class="muted" style="margin-top:-4px;font-size:14px">每场比赛后刷新 · 一线队 ${squadSize()}/22${my().players.length>squadSize()?`（另有 ${my().players.length-squadSize()} 人租借在外）`:''} · 绿条是能力，金条是球探估计的潜力 · 想买其他球队的人，在积分榜点球队名</p>
  <div class="filters">
   <div><label>位置</label>${seg('pos',[['all','全部'],['GK','门将'],['DF','后卫'],['MF','中场'],['FW','前锋']])}</div>
   <div><label>年龄</label>${seg('age',[['all','全部'],['y','21 岁以下'],['m','22 到 28'],['o','29 岁以上']])}</div>
   <div><label>排序</label>${seg('sort',[['ovr','能力'],['pot','潜力'],['price','价格']])}</div>
  </div>
  <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:6px">
   <button class="btn small" data-act="scout" ${S.budget<scoutCost()?'disabled':''}>派球探刷新名单（${money(scoutCost())}）</button>
   <span class="muted" style="font-size:13px">显示 ${list.length}/${S.market.length} 人</span></div>
  ${list.length?'<div class="mlist">'+list.map(p=>`<div class="mrow"><div style="min-width:0"><div class="pname">${p.name}${gem(p)} ${p.sale?'<span class="tag2 sale">急售半价</span>':''} <span class="muted" style="font-weight:400">${POS[p.pos]}，${p.age} 岁</span></div>
  ${p.sig?`<div class="sig">必杀「${p.sig}」</div>`:''}
  <div class="pbar" aria-hidden="true"><i class="p" style="width:${pctR(p.scout?p.scout.hi:p.pot)}%"></i><i class="o" style="width:${pctR(p.ovr)}%"></i></div>
  <div class="price">转会费 ${money(p.price)}${p.scout&&p.scout.conf!=='high'?`<span class="conf">，球探把握${p.scout.conf==='mid'?'一般':'很低'}</span>`:''}</div></div>
  <div><div class="ovr num">${p.ovr}</div><div class="potl">${potText(p)}</div></div>
  <button class="btn small primary" data-act="buy" data-arg="${p.id}" ${S.budget<p.price||squadFull()?'disabled':''}>签下</button></div>`).join('')+'</div>'
  :`<p class="muted">${S.market.length?'没有符合条件的球员，换个筛选试试。':'这一轮的球员都被签走了，打完下一场再来看看。'}</p>`}</section>`;
}
const rcls=r=>r>=8?'r-hi':r>=7?'r-ok':r<6?'r-lo':'';
const rtag=r=>`<span class="rating ${rcls(r)}">${r.toFixed(1)}</span>`;
// full-time box: shots / on target / possession, man of the match, and our players' ratings
function vMatchStats(){
  const H=S.teams[M.h],A=S.teams[M.a],mine=mySide()==='h'?M.rh:M.ra;
  const row=(l,h,a)=>`<div class="srow2"><span class="num">${h}</span><span>${l}</span><span class="num">${a}</span></div>`;
  return `<div class="mstats">
    <div class="srow2 head"><span>${H.short}</span><span></span><span>${A.short}</span></div>
    ${row('射门',M.st.h.sh,M.st.a.sh)}${row('射正',M.st.h.on,M.st.a.on)}${row('控球',M.poss+'%',(100-M.poss)+'%')}</div>
  ${M.mvp?`<p class="mvp">全场最佳：<b>${M.mvp.p.name}</b>（${S.teams.find(t=>t.players.includes(M.mvp.p)).short}，${POS[M.mvp.role]}）${rtag(M.mvp.r)}</p>`:''}
  <div class="ratings">${mine.map(x=>`<span class="rt">${POS[x.role][0]} ${shortName(x.p.name)} ${rtag(x.r)}</span>`).join('')}</div>`;
}
function vMatch(){
  const H=S.teams[M.h],A=S.teams[M.a];
  const clock=M.done?'FT':M.min>=45&&M.ht?'HT':`${M.min}'`;
  let ctl='';
  if(M.done){
    const s=M.summary;
    ctl=`<div class="ht" style="border-color:var(--pitch)"><div class="verdict disp" style="color:${s.w==='胜'?'var(--pitch)':s.w==='负'?'var(--red)':'var(--ink)'}">${s.w==='胜'?LINE.win:s.w==='负'?LINE.lose:LINE.draw}</div>
    <p style="margin:0 0 10px;font-size:14px">${s.pens?`点球大战 ${s.mp}:${s.op}。`:''}比赛收入 ${money(s.income)}${M.derby?'（宿敌之战，翻倍）':''}。${M.myInjuries.length?`伤病：${M.myInjuries.map(p=>p.name).join('、')}。`:''}${s.banned.length?`下轮停赛：${s.banned.map(p=>p.name).join('、')}。`:''}${s.grown.length?`比赛中成长：${s.grown.map(p=>p.name).join('、')}。`:''}</p>
    ${s.awoken.map(p=>`<p class="awake">${LINE.awaken(p.name)}能力 ${p.ovr}，潜力 ${p.pot}${p.sig?`，领悟必杀技「${p.sig}」`:''}</p>`).join('')}
    ${vMatchStats()}
    <div class="go" style="justify-content:flex-start;margin-top:0"><button class="btn primary" data-act="matchDone">回到俱乐部</button>
    ${S.cheatUsed?'':`${cheatBtn('redo')}<span class="muted" style="font-size:13px">${CHEAT_CARD}：${CHEAT_INFO.redo[1]}</span>`}</div></div>`;
  }else if(M.ht){
    const s=mySide(),xi=M[s+'XI'],full=M.subs>=SUBS;
    const bench=my().players.filter(p=>!xi.includes(p.id)&&!unavail(p)).sort((a,b)=>PO.indexOf(a.pos)-PO.indexOf(b.pos)||b.ovr-a.ovr);
    const marks=p=>(M.injuries.includes(p)?'<b class="mk hurt">伤</b>':'')+(M.yc[p.id]?'<b class="mk yc"></b>':'');
    const field=pitchSpots(M[s+'Ids'],M[s+'Form']).map(x=>x.p
      ?tok(x.p,{style:`left:${x.x}%;top:${x.y}%`,act:'subOut',role:x.role,cls:M.sel===x.p.id?'sel':'',marks:marks(x.p)})
      :`<span class="tok empty gone" style="left:${x.x}%;top:${x.y}%"><span class="tc">✕</span><span class="tn">罚下</span></span>`).join('');
    ctl=`<div class="ht"><b>中场·作战会议</b><p style="margin:4px 0 10px;font-size:14px">下半场，要改变命运的走向吗？</p>
    <div class="seg" style="margin-bottom:4px">${Object.entries(TACT).map(([k,v])=>`<button data-act="tac" data-arg="${k}" aria-pressed="${M.tac===k}">${v}</button>`).join('')}</div>
    <p class="muted" style="margin:0 0 12px;font-size:12px">只影响本场。</p>
    <div class="subh">换人 ${M.subs}/${SUBS}${full?'，名额已用完':M.sel!=null?`：换下 ${findP(M.sel).name}，请在右边选替补`:'：先点球场上要换下的人，再点右边的替补'}</div>
    <div class="htgrid">${pitchBox(field,'场上球员',M[s+'Form'])}
    <div class="sublist"><div class="subh" style="margin-bottom:6px">替补席</div>
    ${bench.length?bench.map(p=>`<button class="srow" data-act="subIn" data-arg="${p.id}" data-flip="p${p.id}" ${full?'disabled':''}>
      <span class="spos">${POS[p.pos]}</span><span class="sname">${p.name}${p.sig?'<i>★</i>':''}</span><span class="num sovr">${p.ovr}</span>
      <span class="tb"><i style="width:${p.cond}%"></i></span></button>`).join(''):'<span class="muted" style="font-size:13px">没有可用的替补</span>'}</div></div>
    <button class="btn primary" data-act="resume" style="margin-top:12px">再战，下半场！</button></div>`;
  }else{
    ctl=`<div class="mctl"><button class="btn" data-act="speed">${M.speed===1?'加速':'正常速度'}</button><button class="btn" data-act="skip">直接看结果</button></div>`;
  }
  const tag=M.cup?`${CUP_NAME}·${CUP_STAGES[M.stage]}`:M.derby?'宿敌之战':'';
  return `<div class="matchwrap">${tag?`<div class="mtag">${tag}</div>`:''}<div class="board">
  <div class="side disp">${H.name}<small>主队</small></div>
  <div class="score"><span class="${M.flash==='h'?'flash':''}">${M.hg}</span><span class="colon">:</span><span class="${M.flash==='a'?'flash':''}">${M.ag}</span></div>
  <div class="side disp">${A.name}<small>客队</small></div>
  <div class="clock">${clock}${M.hp!==undefined?` <span class="pk">点球 ${M.hp}:${M.ap}</span>`:''}<small>你的战术：${TACT[M.tac]}${S.boost>0?'，士气高涨':''}</small></div></div>
  ${ctl}
  <ul class="feed">${M.feed.map(e=>`<li class="${e.cls}"><span class="m">${e.min==='PK'?'PK':e.min+"'"}</span><span>${e.t}</span></li>`).join('')}</ul></div>`;
}
function vSeasonEnd(){
  const div=my().div,rank=myRank(),exp=expectedRank(),prize=prizeFor(div,rank),z=zone(div,rank),dn=DIVS[div];
  const board=rank<=exp-2?'远远超出预期，董事会非常满意。':rank<=exp?'大致符合预期，董事会对你的工作表示认可。':'成绩低于预期，董事会希望你下赛季能有起色。';
  const msg=z==='up'?(rank===1?`${dn}冠军，成功升级！`:`拿下第 ${rank}，成功升级！`)+`下赛季将在${DIVS[div-1]}和强队过招。`
    :z==='down'?`降级了。下赛季要在${DIVS[div+1]}重新开始，董事会希望尽快打回来。`
    :rank===1?'冠军！整个城市都在为你们庆祝，董事会激动得说不出话。'
    :board+(div>0?'下赛季继续冲击升级。':'');
  const top=S.teams.filter(t=>t.div===div).flatMap(t=>t.players.map(p=>({p,t}))).sort((a,b)=>b.p.goals-a.p.goals)[0];
  return `<section class="panel"><h2 class="disp" style="font-size:34px;line-height:1.2">第 ${S.season} 赛季结束，${dn}第 ${rank}</h2>
  <p>${msg}赛季奖金 ${money(prize)}。</p>
  ${top&&top.p.goals?`<p class="muted" style="font-size:14px">${dn}金靴：${top.p.name}（${top.t.name}），${top.p.goals} 球。</p>`:''}
  <p class="muted" style="font-size:14px">${CUP_NAME}：${cupStatus()}</p>
  ${(()=>{const g=goalStatus();if(!g)return '';const b=(g.league?GOAL_BONUS.league[div]:0)+(g.cup?GOAL_BONUS.cup:0);
    return `<p style="font-size:14px">董事会目标：联赛第 ${S.goal.rank} 名以内${g.league?' ✓':' ✗'}${g.cup===null?'':`，杯赛进入${CUP_STAGES[S.goal.cup]}${g.cup?' ✓':' ✗'}`}${b?`，奖金 ${money(b)}`:''}。</p>`})()}
  ${DIVS.map((dn,d)=>{const a=seasonAwards(d);return `<div class="awards"><b>${dn}个人奖项</b>${Object.entries(AWARDS).map(([k,l])=>a[k]?`<span class="${a[k].tid===S.my?'mine':''}">${l}：${a[k].name}（${a[k].team}，${a[k].stat}）</span>`:'').join('')}</div>`}).join('')}
  ${S.history.length?`<p class="muted" style="font-size:14px">往季排名${S.history.length>6?'（最近 6 季，完整记录在荣誉室）':''}：${S.history.slice(-6).map(h=>`第 ${h.season} 季${DIVS[h.div||0]}第 ${h.rank}`).join('，')}</p>`:''}
  <div class="go" style="justify-content:flex-start"><button class="btn primary" data-act="newSeason">开始第 ${S.season+1} 赛季</button></div>
  <p class="muted" style="font-size:13px;margin-bottom:0">新赛季球员长一岁，33 岁以上的老将可能退役（能力越高越能坚持），黄牌和停赛清零。</p></section>
  ${DIVS.map((_,d)=>vTable(d,false)).join('')}`;
}

/* ---------- cup & honours ---------- */
// one line on how our cup run is going
function cupStatus(){
  const C=S.cup;
  if(C.skipped)return '本赛季未参加，下赛季开始。';
  if(C.winner===S.my)return '冠军！';
  const k=C.rounds.findIndex(rd=>rd.some(r=>(r.h===S.my||r.a===S.my)&&r.w!==S.my));
  if(k>=0)return `止步${CUP_STAGES[k]}。`;
  if(C.winner!=null)return '已结束。';
  return `仍在争夺，下一场是${CUP_STAGES[C.stage]}（联赛第 ${CUP_AT[C.stage]} 轮之后）。`;
}
function vCup(){
  const C=S.cup,nm=id=>S.teams[id].name;
  const row=r=>{
    const me=r.h===S.my||r.a===S.my,cls=id=>id===r.w?'w':'l';
    return `<div class="res cupres ${me?'me':''}"><span class="${cls(r.h)}">${nm(r.h)}</span><span class="num">${r.hg} : ${r.ag}${r.hp!==undefined?`<small>点球 ${r.hp}:${r.ap}</small>`:''}</span><span class="${cls(r.a)}">${nm(r.a)}</span></div>`;
  };
  const pending=C.ties.length?`<section class="panel"><h2>${CUP_STAGES[C.stage]}<span class="muted" style="font-weight:400;font-size:14px">，联赛第 ${CUP_AT[C.stage]} 轮之后进行</span></h2>
    ${C.ties.map(([h,a])=>`<div class="res cupres ${h===S.my||a===S.my?'me':''}"><span>${nm(h)}</span><span class="muted">VS</span><span>${nm(a)}</span></div>`).join('')}</section>`:'';
  return `<section class="panel"><h2>${CUP_NAME}</h2>
  <p class="muted" style="margin:-4px 0 0;font-size:14px">甲乙级 16 队一起抽签，单场淘汰，平局直接点球大战。奖金：八强 ${CUP_PRIZE[1]} 万，四强 ${CUP_PRIZE[2]} 万，亚军 ${CUP_PRIZE[3]} 万，冠军 ${CUP_PRIZE[4]} 万。</p>
  <p style="margin:10px 0 0"><b>本队：</b>${cupStatus()}</p>
  ${C.winner!=null?`<p class="disp" style="font-size:24px;margin:10px 0 0;color:var(--amber)">🏆 ${nm(C.winner)}</p>`:''}</section>
  ${pending}
  <div class="grid2">${C.rounds.map((rd,k)=>`<section class="panel"><h2>${CUP_STAGES[k]}</h2>${rd.map(row).join('')}</section>`).reverse().join('')}</div>`;
}
function vHonours(){
  const H=S.history,R=S.records;
  const count=(f)=>H.filter(f).length;
  const cups=R.filter(r=>r.cup===my().name).length+(S.cup.winner===S.my?1:0);
  const trophies=[['甲级冠军',count(h=>h.div===0&&h.rank===1)],['乙级冠军',count(h=>h.div===1&&h.rank===1)],[`${CUP_NAME}`,cups],['升级',count(h=>h.div===1&&h.rank<=SWAP)],['青训出身（现役）',my().players.filter(p=>p.youth).length]];
  const sc=clubScorers();
  return `<div class="cols"><div class="col"><section class="panel"><h2>奖杯柜</h2><div class="trophies">${trophies.map(([l,n])=>`<div class="trophy ${n?'got':''}"><div class="num">${n}</div><div>${l}</div></div>`).join('')}</div></section>
  <section class="panel"><h2>称号 <span class="muted" style="font-weight:400;font-size:14px">${Object.keys(S.ach).length}/${Object.keys(ACH).length}</span></h2>
  <div class="achs">${Object.entries(ACH).map(([k,[n,d]])=>S.ach[k]
    ?`<div class="ach got"><b>「${n}」</b><span>${d}</span><small>第 ${S.ach[k]} 赛季解锁</small></div>`
    :`<div class="ach"><b>「？？？」</b><span>${d}</span></div>`).join('')}</div></section>
  </div><div class="col">
  ${(()=>{const won=R.flatMap(r=>(r.awards||[]).flatMap((a,d)=>Object.entries(a).filter(([k,w])=>w&&w.tid===S.my).map(([k,w])=>({r,d,k,w}))));
    return `<section class="panel"><h2>个人奖项${won.length?` <span class="muted" style="font-weight:400;font-size:13px">${won.length} 项</span>`:''}</h2>${won.length?'<div class="scrollbox">'+won.reverse().map(x=>`<div class="res" style="grid-template-columns:1fr auto"><span style="text-align:left">第 ${x.r.season} 季${DIVS[x.d]}${AWARDS[x.k]}：${x.w.name}</span><span class="muted">${x.w.stat}</span></div>`).join('')+'</div>':'<p class="muted" style="margin:0">还没有球员拿过个人奖项。</p>'}</section>`})()}
  <section class="panel"><h2>队史射手榜</h2>${sc.length?sc.map((c,i)=>`<div class="res" style="grid-template-columns:24px 1fr auto"><span class="muted">${i+1}</span><span style="text-align:left">${c.name} <span class="muted">${POS[c.pos]}，${c.apps} 场</span></span><span class="num" style="min-width:0">${c.goals}</span></div>`).join(''):'<p class="muted" style="margin:0">还没有人为球队进球。</p>'}</section>
  <section class="panel"><h2>传奇退役${S.legends.length?` <span class="muted" style="font-weight:400;font-size:13px">${S.legends.length} 人</span>`:''}</h2>${S.legends.length?'<div class="scrollbox">'+[...S.legends].reverse().map(l=>`<div class="res" style="grid-template-columns:1fr auto"><span style="text-align:left">${l.name} <span class="muted">${POS[l.pos]}，第 ${l.season} 季退役${l.seasons?`，效力 ${l.seasons} 季`:''}${l.titles&&l.titles.length?`，${l.titles.length} 座冠军`:''}</span></span><span class="muted">${l.apps} 场 ${l.goals} 球</span></div>`).join('')+'</div>':`<p class="muted" style="margin:0">在队效力 ${LEGEND_TITLE_SEASONS} 季以上并帮球队夺冠，或效力 ${LEGEND_SEASONS} 季以上的球员，在队退役后会记在这里。</p>`}</section>
  <section class="panel"><h2>历届冠军</h2>${R.length?`<div class="tw scrollbox"><table class="sticky-head"><thead><tr><th>季</th><th>甲级</th><th>乙级</th><th>${CUP_NAME}</th><th>本队</th></tr></thead>
  <tbody>${R.slice().reverse().map(r=>`<tr><td>${r.season}</td><td>${r.champs[0]||'—'}</td><td>${r.champs[1]||'—'}</td><td>${r.cup||'—'}</td><td>${DIVS[r.div]}第 ${r.rank}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted" style="margin:0">打完第一个赛季后，这里会记录每季的冠军。</p>'}</section></div></div>`;
}
