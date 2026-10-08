// A reload replays the match only for the same plan; during a stop players can swap places, fill a red card's
// gap, and the shape can change.
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());
while(nextFix().friendly){ACT.ff();S.event=null;S.offer=null;startMatch();skipMatch();ACT.matchDone()}
ACT.ff();S.event=null;S.offer=null;
const story=()=>M.feed.filter(e=>/进球|红牌|罚下/.test(e.t)).map(e=>e.min+e.t).join('|')+' '+M.hg+':'+M.ag;
startMatch();clearTimeout(M.timer);const saved=store[KEY];skipMatch();const first=story();
// "refresh": back to the save made at kickoff, same plan
store[KEY]=saved;S=load();M=null;startMatch();clearTimeout(M.timer);skipMatch();ok(story()===first,'same plan after a reload: the same match ('+first.slice(-5)+')');
// same match day, another tactic: a different match
let differ=0;for(const t of ['def','att']){store[KEY]=saved;S=load();M=null;S.tactic=t;startMatch();clearTimeout(M.timer);skipMatch();if(story()!==first)differ++}
ok(differ===2,'changing the tactic before kickoff gives a different match');
// a stop: swap two men, fill a red card's gap, change shape
store[KEY]=saved;S=load();M=null;S.autoSub=false;startMatch();clearTimeout(M.timer);while(M.min<30)tick(false);ACT.pauseSub();
const s=mySide(),ids=M[s+'Ids'],roles=()=>slotRoles(M[s+'Form']);
const df=ids.find(id=>M.role[id]==='DF'),fw=ids.find(id=>M.role[id]==='FW'),iD=ids.indexOf(df),iF=ids.indexOf(fw);
ACT.subOut(String(df));ACT.subOut(String(fw));
ok(M[s+'Ids'][iD]===fw&&M[s+'Ids'][iF]===df&&M.role[fw]==='DF'&&M.role[df]==='FW'&&M.sel==null,'tapping two men swaps their places');
M[s+'Ids'][iD]=null;  // the man in that defensive place is sent off
render();ok(!/data-act="toSlot"/.test(els.app.innerHTML),'an empty place is only a target once someone is selected');
const mf=M[s+'Ids'].find(id=>id!=null&&M.role[id]==='MF'),iM=M[s+'Ids'].indexOf(mf);
ACT.subOut(String(mf));render();ok(/data-act="toSlot"/.test(els.app.innerHTML)&&/移到这里/.test(els.app.innerHTML),'with a man selected the gap says 移到这里');
ACT.toSlot(String(iD));ok(M[s+'Ids'][iD]===mf&&M[s+'Ids'][iM]==null&&M.role[mf]==='DF','he moves into the gap; his old place is now the empty one');
const n=M[s+'Ids'].filter(x=>x!=null).length;ACT.mform('5-3-1');ACT.mform('5-4-1');
ok(M[s+'Form']==='5-4-1'&&M[s+'Ids'].filter(x=>x!=null).length===n&&M[s+'Ids'].every((id,i)=>id==null||M.role[id]===roles()[i]),'a new shape mid-match rearranges the ten men');
render();ok(/data-act="mform"/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'the pause panel offers the shapes');
ACT.resume();clearTimeout(M.timer);skipMatch();ok(M.done,'the match plays on and finishes');
`);
