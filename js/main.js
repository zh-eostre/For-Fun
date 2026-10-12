/* ---------- actions ---------- */
// read out key match moments (goals, red cards, half and full time) for screen readers
function announce(t){const el=document.getElementById('sr');if(el)el.textContent=t}
// the toast is a popover so it shows above an open <dialog> (both live in the browser's top layer)
// a big moment over the page (goal, brace, title). it lives outside #app, so the per-minute redraw doesn't restart it
// a signature move's cut-in: a slanted banner with the move and the player, in the club's colour; then (optional) next()
// learn: the longer, golden version for a move just learned (see playSigQueue)
function cutIn(name,sig,color,next,learn){
  const el=document.getElementById('fx');if(!el||!el.classList){if(next)next();return}
  el.className='';el.innerHTML=`<div class="cut" style="--c:${color}"><small>${learn?'必杀技觉醒':'必杀技发动'}</small><b class="disp">「${sig}」</b><span>${name}</span></div>`;
  void el.offsetWidth;el.className='show sig'+(learn?' learn':'');sfx(learn?'fanfare':'sig');
  clearTimeout(celebrate.t);celebrate.t=setTimeout(()=>{if(next)next();else{el.className='';el.innerHTML=''}},learn?2600:1300);
}
// moves our players have learned since the last look: one cut-in each, in turn, once the match screen is closed
function playSigQueue(){
  const q=UI.sigQueue;if(!q||!q.length||playSigQueue.on||(UI.view==='match'&&M))return;
  const s=q.shift();playSigQueue.on=true;
  cutIn(s.name,s.sig,my().color,()=>{playSigQueue.on=false;
    if(q.length)playSigQueue();else{const el=document.getElementById('fx');if(el&&el.classList){el.className='';el.innerHTML=''}}},true);
}
function celebrate(big,small,kind){
  const el=document.getElementById('fx');if(!el||!el.classList)return;
  const bits=kind==='party'?Array.from({length:70},(_,i)=>`<i style="left:${Math.random()*100}%;animation-delay:${(Math.random()*1.2).toFixed(2)}s;background:${['#F5B841','#4FA36F','#C6402F','#3567A6','#fff'][i%5]}"></i>`).join(''):'';
  el.className='';el.innerHTML=`<div class="fx-box"><b class="disp">${big}</b>${small?`<span>${small}</span>`:''}</div>${bits}`;
  void el.offsetWidth;el.className='show '+kind;if(kind==='party')sfx('roar');
  clearTimeout(celebrate.t);celebrate.t=setTimeout(()=>{el.className='';el.innerHTML=''},kind==='party'?4500:2800);
}
// a short card at the top for something that matters during a match (a change, an injury, a red card, a goal
// against); several stack. the match holds for a moment (see M.hold in match.js)
function notice(kind,title,sub){
  const box=document.getElementById('banner');if(!box||!box.appendChild)return;
  const el=document.createElement('div');el.className='bn '+kind;el.innerHTML=`<b>${title}</b>${sub?`<span>${sub}</span>`:''}`;
  while(box.children.length>=3)box.firstChild.remove();  // at most three at a time: the oldest goes
  box.appendChild(el);setTimeout(()=>el.classList.add('out'),2400);setTimeout(()=>el.remove(),2800);
}
function toast(t){
  const el=document.getElementById('toast');el.textContent=t;el.hidden=false;
  if(el.showPopover){try{el.hidePopover()}catch(e){}el.showPopover()}
  clearTimeout(toast.t);toast.t=setTimeout(()=>{if(el.hidePopover)try{el.hidePopover()}catch(e){}el.hidden=true},2400);
}
function arm(b,label){if(b.dataset.armed)return true;b.dataset.armed='1';const o=b.textContent;b.textContent=label;setTimeout(()=>{if(b.isConnected){delete b.dataset.armed;b.textContent=o}},2500);return false}
function enterGame(){
  M=null;UI={tab:'home',view:'main',mf:{...MF0}};indexNames();
  if(S.live){startMatch();toast('上次的比赛没打完，从开球重新进行')}else render();
}

/* ---------- save files ---------- */
// Chrome / Edge can write straight into a folder the player picks once (e.g. the project's saves folder).
// the folder handle is remembered in IndexedDB (handles can't go in localStorage); other browsers download instead
const canPickDir=()=>typeof window!=='undefined'&&'showDirectoryPicker' in window;
function idb(mode,fn){
  return new Promise((res,rej)=>{
    const r=indexedDB.open('lvyin-fm',1);
    r.onupgradeneeded=()=>r.result.createObjectStore('kv');
    r.onerror=()=>rej(r.error);
    r.onsuccess=()=>{const tx=r.result.transaction('kv',mode),q=fn(tx.objectStore('kv'));tx.oncomplete=()=>res(q&&q.result);tx.onerror=()=>rej(tx.error)};
  });
}
async function saveDir(pickNew){
  let h=null;
  if(!pickNew)try{h=await idb('readonly',st=>st.get('dir'))}catch(e){}
  if(!h){h=await window.showDirectoryPicker({id:'lvyin-saves',mode:'readwrite'});try{await idb('readwrite',st=>st.put(h,'dir'))}catch(e){}}
  if(await h.queryPermission({mode:'readwrite'})!=='granted'&&await h.requestPermission({mode:'readwrite'})!=='granted')throw new Error('denied');
  UI.dirName=h.name;
  return h;
}
const saveName=()=>`绿茵经理-${my().short}-第${S.season}季第${Math.min(S.round+1,rounds())}轮.json`;
function downloadSave(){
  const url=URL.createObjectURL(new Blob([JSON.stringify(S)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=saveName();
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  toast('存档文件已下载');
}
async function exportSave(pickNew){
  if(!canPickDir()){downloadSave();return}
  try{
    const dir=await saveDir(pickNew),fh=await dir.getFileHandle(saveName(),{create:true}),w=await fh.createWritable();
    await w.write(JSON.stringify(S));await w.close();
    toast(`已存到「${dir.name}」：${saveName()}`);  // toast uses textContent, so names are safe hereUI.saveFiles=null;render();
  }catch(e){if(e.name!=='AbortError')toast('没能写进文件夹，请重新选择存档文件夹')}
}
function loadSaveText(t){
  let d=null;try{d=upgrade(JSON.parse(t))}catch(e){}
  if(!d){toast('这不是有效的存档文件');return}
  S=d;save();UI.saveFiles=null;toast('存档已读取');enterGame();
}
// lists the save files in the chosen folder, newest first, for the save panel to show
async function listSaves(){
  try{
    const dir=await saveDir(false),files=[];
    for await(const [name,h] of dir.entries())if(h.kind==='file'&&name.endsWith('.json'))files.push({name,time:(await h.getFile()).lastModified});
    UI.saveFiles=files.sort((a,b)=>b.time-a.time);render();
  }catch(e){if(e.name!=='AbortError')toast('没能打开存档文件夹')}
}
async function loadFromDir(name){
  try{const dir=await saveDir(false),f=await (await dir.getFileHandle(name)).getFile();loadSaveText(await f.text())}
  catch(e){toast('读取失败：'+name)}
}
function importSave(){
  const inp=document.createElement('input');inp.type='file';inp.accept='.json,application/json';
  inp.onchange=()=>{const f=inp.files[0];if(f)f.text().then(loadSaveText)};
  inp.click();
}

const dayLog=()=>UI.dayLog||{days:0,cond:0,trained:[],healed:[]};
const trainNews=l=>{if(l.length)news(`训练成果：${l.map(p=>`${p.name}（${p.ovr}）`).join('、')} 有所进步。`)};
/* ---------- cheat card: one use per season ---------- */
const cheatNews=k=>news(`发动了${CHEAT_CARD}「${CHEAT_INFO[k][0]}」。`);
const CHEATS={
  // rewind to the pre-kickoff state with a fresh seed, so the match is played again with a new outcome
  redo:()=>{S=JSON.parse(M.pre);delete S.live;S.cheatUsed=true;cheatNews('redo');unlock('cheat');save();M=null;startMatch();toast('时间之河倒流……命运的齿轮重新转动！')},
  heal:()=>{my().players.forEach(p=>{p.cond=100;p.inj=0;p.bans={}});toast('不死鸟于烈焰中重生，全员恢复巅峰！')},
  scout:()=>{
    S.market.forEach(p=>{const price=p.price;scoutReport(p,{conf:'high',est:p.pot});p.price=price});
    UI.tab='market';toast('真理之瞳已开启，一切潜力无所遁形！');
  },
  cash:()=>{S.budget+=CHEAT_CASH;toast(`契约成立。${money(CHEAT_CASH)} 已注入俱乐部金库`)}
};
function useCheat(kind,b){
  if(S.cheatUsed){toast(`${CHEAT_CARD}的力量已耗尽，等待下个赛季的觉醒`);return}
  if(kind==='redo'&&!(M&&M.done&&M.pre))return;
  if(kind==='scout'&&!S.market.length){toast('市场空无一人，真理之瞳无处可看，打完下一场再用');return}
  if(!arm(b,'再点一次，解放封印'))return;
  if(kind==='redo'){CHEATS.redo();return}
  S.cheatUsed=true;CHEATS[kind]();cheatNews(kind);unlock('cheat');save();render();
}

function canStart(p){
  if(p.inj){toast(`${p.name} 还在伤停`);return false}
  if(banned(p)){toast(`${p.name} 在${COMPS[ourComp()]||'这项赛事'}停赛中`);return false}
  if(p.away){toast(`${p.name} 回家探亲了`);return false}
  return true;
}
const ACT={
  cheat:(a,b)=>useCheat(a,b),
  start:a=>{if(TEAMS[+a]&&TEAMS[+a].div===DIVS.length-1)newGame(+a,UI.draft,UI.diff)},
  diff:a=>{if(DIFF[a]){UI.diff=a;render()}},  // new managers start in the bottom division
  reroll:()=>{UI.draft=teamNames();render()},
  continue:()=>{S=load();if(S)enterGame()},
  exportSave:()=>exportSave(false),
  pickDir:()=>exportSave(true),
  listSaves:()=>listSaves(),
  loadDir:(a,b)=>{if((S||load())&&!arm(b,'再点一次读取（会覆盖当前进度）'))return;loadFromDir(a)},
  importSave:(a,b)=>{if((S||load())&&!arm(b,'再点一次确认（会覆盖当前进度）'))return;importSave()},
  tab:a=>{UI.tab=a;UI.selSlot=null;UI.pages=[];UI.modal=null;render();window.scrollTo(0,0)},
  team:a=>{(UI.pages=UI.pages||[]).push({type:'team',id:+a});render();window.scrollTo(0,0)},
  player:a=>{UI.modal={type:'player',id:+a};render()},
  // the next opponent's expected lineup; bring their stamina up to date first
  oppXI:()=>{aiRecover(S.teams[nextFix().opp]);UI.modal={type:'opp'};render()},
  rules:()=>{UI.modal={type:'rules'};render()},
  closeModal:()=>closeModal(),
  back:()=>{UI.pages.pop();render()},
  bid:(a,b)=>{if(!arm(b,'再点一次确认签下'))return;buyFrom(+a);if(UI.modal&&UI.modal.id===+a&&findP(+a))UI.modal=null;save();render()},
  loan:(a,b)=>{if(!arm(b,'再点一次确认租借'))return;loanOut(+a);save();render()},
  recall:a=>{recallLoan(+a);save();render()},
  div:a=>{UI.div=+a;render()},
  seDiv:a=>{UI.seDiv=+a;render()},
  lb:a=>{const [d,k]=a.split(':');UI.lb={...(UI.lb&&typeof UI.lb==='object'?UI.lb:{}),[d]:k};render()},
  hlb:a=>{UI.hlb=a;render()},
  cupv:a=>{UI.cupv=a;render()},
  mf:a=>{const [k,v]=a.split(':');UI.mf[k]=v;UI.mpage=0;render()},
  closeReveal:()=>{UI.reveal=null;render()},
  scout:()=>{const c=scoutCost();if(S.budget<c){toast('资金不够');return}S.budget-=c;addToMarket(4);save();toast('球探带回了 4 名新球员');render()},
  mpage:a=>{UI.mpage=Math.max(0,+a);render()},
  fup:(a,b)=>{if(!arm(b,'再点一次确认升级'))return;upgradeFac(a);save();render()},
  train:a=>{S.training=a;save();render()},
  form:a=>{S.formation=a;S.lineup=autoPick(my(),a);S.autoXI=true;UI.selSlot=null;save();toast(`已按 ${a} 重新选好首发`);render()},
  // in a match only that match's tactic changes; otherwise it's the club's default for coming matches
  tac:a=>{if(M&&!M.done)M.tac=a;else{S.tactic=a;save()}render()},
  auto:()=>{S.lineup=autoPick(my(),S.formation);S.autoXI=true;UI.selSlot=null;fixLineup();save();render()},
  taker:a=>{const [k,id]=a.split(':');S.takers=S.takers||{};S.takers[k]=S.takers[k]===+id?null:+id;save();render()},
  guide:a=>{
    if(a==='again'){UI.modal=null;UI.pages=[];UI.guide=0}
    else if(a==='next'&&UI.guide<GUIDE.length-1)UI.guide++;
    else if(a==='back'&&UI.guide>0)UI.guide--;
    else{UI.guide=null;try{localStorage.setItem(GUIDE_KEY,'1')}catch(e){}}
    if(UI.guide!=null){UI.tab=GUIDE[UI.guide][0];UI.pages=[]}
    render();window.scrollTo(0,0);
  },
  sound:()=>{setSound(!soundOn());if(soundOn())sfx('card');render()},
  rotate:()=>{S.rotate=S.rotate===false;if(S.autoXI!==false)fixLineup();save();render()},
  // player list rows: add to / remove from the XI
  toggle:a=>{
    const id=+a,p=findP(id);if(!p)return;
    S.autoXI=false;  // arranged by hand from now on
    if(S.lineup.includes(id)){dropFromLineup(id);save();render();return}
    if(!canStart(p))return;
    if(!placeInLineup(p)){toast('首发已满，先在球场上移出一个人');return}
    save();render();
  },
  // pitch slot: tap to select; tap another slot to swap the two; tap the selected one again to empty it
  slot:a=>{
    const i=+a,sel=UI.selSlot;
    if(sel==null){UI.selSlot=i}
    else if(sel===i){if(S.lineup[i]!=null){dropFromLineup(S.lineup[i]);S.autoXI=false;save()}UI.selSlot=null}
    else{[S.lineup[sel],S.lineup[i]]=[S.lineup[i],S.lineup[sel]];S.autoXI=false;UI.selSlot=null;save()}
    render();
  },
  // bench player: goes into the selected slot (replacing whoever is there), else the best empty slot
  bench:a=>{
    const p=findP(+a);if(!p||!canStart(p))return;
    S.autoXI=false;
    const at=S.lineup.indexOf(p.id);
    // already starting (e.g. a quick second tap): swap him with the selected slot rather than list him twice
    if(at>=0){if(UI.selSlot!=null&&UI.selSlot!==at)[S.lineup[UI.selSlot],S.lineup[at]]=[S.lineup[at],S.lineup[UI.selSlot]];UI.selSlot=null;save();render();return}
    if(UI.selSlot!=null){S.lineup[UI.selSlot]=p.id;UI.selSlot=null}
    else if(!placeInLineup(p)){toast('首发已满：先点球场上的一个位置，再点替补换上');return}
    save();render();
  },
  sell:(a,b)=>{
    if(!windowOpen()){toast(windowShut());return}
    const p=findP(+a);if(!p)return;
    if(!p.loan&&squadSize()<=14){toast('一线队至少要保留 14 人');return}
    if(!arm(b,'再点一次确认'))return;
    const price=sellPrice(p);S.budget+=price;bankPlayer(p);
    my().players=my().players.filter(x=>x.id!==p.id);dropFromLineup(p.id);
    news(`以 ${money(price)} 出售了 ${p.name}。`);if(UI.modal&&UI.modal.id===p.id)UI.modal=null;save();toast(`${p.name} 已出售`);render();
  },
  buy:a=>{
    if(!windowOpen()){toast(windowShut());return}
    const p=S.market.find(x=>x.id===+a);if(!p)return;
    if(S.budget<p.price){toast('资金不够');return}
    if(squadFull()){toast(`一线队已满 ${SQUAD_MAX} 人`);return}
    S.budget-=p.price;S.market=S.market.filter(x=>x!==p);const price=p.price,est=shownPot(p);
    delete p.price;delete p.scout;delete p.sale;delete p.ex;my().players.push(p);
    const diff=p.pot-est;
    news(`以 ${money(price)} 签下 ${p.name}（${POS[p.pos]}，能力 ${p.ovr}，真实潜力 ${p.pot}）。${diff>=6?'球探严重低估了他！':''}`);
    if(p.age<=23)UI.reveal={name:p.name,pot:p.pot,est,diff};else toast(`签下 ${p.name}，记得去阵容页安排他`);
    save();render();window.scrollTo(0,0);
  },
  play:()=>startMatch(),
  // calendar: one day, or straight to the next match day; the log sums up what happened on the way
  // the log under the calendar adds up every day since our last match; each day's training gains also go to the news
  nextDay:()=>{const log=dayLog(),t=log.trained.length,su=(log.surprises||[]).length;
    if(advanceDay(log)){UI.dayLog=log;trainNews(log.trained.slice(t));save()}render();if((log.surprises||[]).length>su)toast('✨ '+log.surprises[su])},
  ff:()=>{const log=dayLog(),t=log.trained.length,su=(log.surprises||[]).length;while(advanceDay(log));UI.dayLog=log;
    trainNews(log.trained.slice(t));save();render();
    if((log.surprises||[]).length>su)toast('✨ '+log.surprises[log.surprises.length-1])},
  // match pace, kept for later matches (a setting, so it can be saved even mid-match)
  pace:a=>{if(!PACE[a])return;S.pace=a;try{const d=JSON.parse(localStorage.getItem(KEY));if(d){d.pace=a;localStorage.setItem(KEY,JSON.stringify(d))}}catch(e){}render()},
  // halftime team talk, once a match; a roar works more often for a manager with a name
  talk:a=>{if(!M||!M.ht||M.talk||!TALK[a])return;M.talk=a;
    if(a==='roar')M.talkOK=rng()<.45+((S.mgr&&S.mgr.rep)||0)/200;
    const fx=TALK_FX[a==='roar'?(M.talkOK?'roarOk':'roarBad'):a];
    M.feed.unshift({min:45,cls:'sys',t:`更衣室训话「${TALK[a][0]}」：${TALK[a][1]}${a==='roar'?(M.talkOK?'——全队被点燃了！':'——球员们面面相觑，气氛有些僵硬……'):''}`});
    toast(`${TALK[a][0]}：下半场进攻 ${fx.atk>=0?'+':''}${fx.atk}、防守 ${fx.def>=0?'+':''}${fx.def}`);render()},
  skip:()=>skipMatch(),
  resume:()=>{M.ht=false;M.subMode=false;M.paused=false;M.sel=null;render();M.timer=setTimeout(loop,300)},
  // pause the match to make changes; the same panel as halftime
  pauseSub:()=>{if(!M||M.done)return;clearTimeout(M.timer);M.paused=true;M.subMode=true;M.stop=(M.stop||0)+1;render()},
  // a setting, saved with the club after the match (saving mid-match would store this match's goals)
  autoSub:()=>{S.autoSub=S.autoSub===false;if(!M)save();render()},
  // a man on the pitch: select him; with another already selected, the two swap places
  subOut:a=>{const id=+a,ids=M[mySide()+'Ids'];
    if(M.sel!=null&&M.sel!==id&&ids.includes(M.sel)&&ids.includes(id)){const x=findP(M.sel),y=findP(id);swapSlots(ids.indexOf(M.sel),ids.indexOf(id));M.sel=null;toast(`${x.name} 和 ${y.name} 互换位置`);render();return}
    M.sel=M.sel===id?null:id;render()},
  // an empty place (a red card): the selected man moves into it
  toSlot:a=>{const ids=M[mySide()+'Ids'],from=ids.indexOf(M.sel),to=+a;if(M.sel==null||from<0||ids[to]!=null)return;
    ids[to]=M.sel;ids[from]=null;placeOnPitch(M.sel,to);toast(`${findP(M.sel).name} 移到${POS[slotRoles(M[mySide()+'Form'])[to]]}位置`);M.sel=null;render()},
  mform:a=>{if(!M||M.done||!M.paused||!FORMS[a]||M[mySide()+'Form']===a)return;M.sel=null;changeMatchForm(a);render()},
  subIn:a=>{
    if(M.sel==null){toast('先点选要换下的场上球员');return}
    const r=resub(M.sel,+a),back=pendingSub(+a,'out');
    if(r===false)toast('这名球员不能上场');
    else if(r===null){
      if(back)toast(`${findP(+a).name} 已被换下，只能换回 ${findP(back.in).name} 的位置`);
      else if(!substitute(M.sel,+a))toast(`本场最多换 ${SUBS} 人`);
    }
    render();
  },
  offerYes:(a,b)=>{if(!arm(b,'再点一次，签下契约'))return;acceptOffer();save();render()},
  offerNo:()=>{rejectOffer();save();render()},
  event:a=>{resolveEvent(+a);fixLineup();save();render()},
  ysign:a=>{signYouth(+a);save();render()},
  yrel:(a,b)=>{if(!arm(b,'确定放走？'))return;releaseYouth(+a);save();render()},
  aup:(a,b)=>{if(!arm(b,'再点一次确认升级'))return;upgradeAcademy();save();render()},
  matchDone:()=>{M=null;UI.view='main';UI.tab='home';UI.dayLog=null;UI.pages=[];UI.modal=null;render();window.scrollTo(0,0)},
  newSeason:()=>{UI.modal=null;newSeason()},
  takeJob:(a,b)=>{if(!arm(b,'再点一次，接受邀请'))return;UI.modal=null;newSeason(+a)}
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;
  const f=ACT[b.dataset.act];if(f)f(b.dataset.arg,b)});
// remember which folding panels are open across re-renders ('toggle' doesn't bubble, so listen while capturing)
document.addEventListener('toggle',e=>{const d=e.target;if(d.dataset&&d.dataset.fold){(UI.folds=UI.folds||{})[d.dataset.fold]=d.open;if(d.open)scrollFixtures(d)}},true);
function closeModal(){if(!UI.modal)return;const t=UI.modal.type;UI.returnFocus=t==='opp'?{act:'oppXI'}:t==='rules'?{act:'rules'}:{act:'player',arg:UI.modal.id};UI.modal=null;render()}
// Escape on the dialog: let our state close it (and re-render) rather than the browser alone
document.addEventListener('cancel',e=>{if(e.target.matches&&e.target.matches('dialog.modal')){e.preventDefault();closeModal()}},true);
// a click on the dialog's backdrop lands on the <dialog> itself; only close if the press also started there,
// so a text selection dragged out of the dialog doesn't close it
let downOn=null;
document.addEventListener('pointerdown',e=>{downOn=e.target},true);
document.addEventListener('click',e=>{if(e.target.matches&&e.target.matches('dialog.modal')&&downOn===e.target)closeModal()});
// some panels (event / offer) sit in a different column on wide screens, so re-render when the width crosses over
if(window.matchMedia){const mq=window.matchMedia(WIDE);(mq.addEventListener?mq.addEventListener('change',()=>render()):mq.addListener(()=>render()))}

// always open on the start screen, so the player can continue or restart
render();

// chart tooltips: any mark with data-tip shows it on hover or keyboard focus, just above the mark
(()=>{
  let tip=null;
  const show=el=>{if(!el||!el.dataset||!el.dataset.tip)return;
    if(!tip){tip=document.createElement('div');tip.id='chart-tip';tip.setAttribute('role','tooltip');document.body.appendChild(tip)}
    tip.textContent=el.dataset.tip;tip.hidden=false;
    const r=el.getBoundingClientRect(),w=tip.offsetWidth;
    tip.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2))+'px';tip.style.top=Math.max(8,r.top-tip.offsetHeight-8)+'px'};
  const hide=()=>{if(tip)tip.hidden=true};
  document.addEventListener('pointerover',e=>{const el=e.target.closest&&e.target.closest('[data-tip]');if(el)show(el);else hide()});
  document.addEventListener('focusin',e=>{const el=e.target.closest&&e.target.closest('[data-tip]');if(el)show(el);else hide()});
  document.addEventListener('scroll',hide,true);
})();
