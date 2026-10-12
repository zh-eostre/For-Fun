// Lineups as formation slots: pitch matches the formation, tap-to-swap, bench fill, out-of-position cost, migration.
require('./harness').run(`

newGame(1,teamNames());UI.tab='squad';
// 1. pitch matches formation for every formation, even after injuries
for(const f of Object.keys(FORMS)){
  ACT.form(f);
  const sp=pitchSpots(S.lineup,f),cnt={};sp.forEach(s=>cnt[s.role]=(cnt[s.role]||0)+1);
  ok(PO.every(p=>cnt[p]===FORMS[f][p])&&sp.length===11,'pitch slots match '+f+' '+JSON.stringify(cnt));
}
ACT.form('5-3-2');
const df=S.lineup.map(findP).filter(p=>p&&p.pos==='DF');df[0].inj=2;df[1].inj=2;  // two defenders hurt
fixLineup();
const roles=slotRoles('5-3-2'),oop=outOfPos();
ok(lineupCount()===11,'after 2 DF injuries lineup refilled to 11 (DF in squad: '+my().players.filter(p=>p.pos==='DF'&&!unavail(p)).length+')');
ok(pitchSpots(S.lineup,'5-3-2').filter(s=>s.role==='DF').length===5,'pitch still shows 5 DF slots; out of position: '+oop.map(p=>p.name+'('+POS[p.pos]+')').join(','));
df[0].inj=0;df[1].inj=0;
// 2. slot interactions
ACT.form('4-4-2');const L0=[...S.lineup];
ACT.slot('1');ACT.slot('5');ok(S.lineup[1]===L0[5]&&S.lineup[5]===L0[1],'tap slot 1 then slot 5 swaps them');
ACT.slot('5');ACT.slot('5');ok(S.lineup[5]===null&&lineupCount()===10,'tap same slot twice empties it');
const b=my().players.find(p=>!S.lineup.includes(p.id)&&!unavail(p));ACT.bench(String(b.id));ok(S.lineup.includes(b.id)&&lineupCount()===11,'bench tap fills the empty slot');
const b2=my().players.find(p=>!S.lineup.includes(p.id)&&!unavail(p));ACT.slot('3');const was=S.lineup[3];ACT.bench(String(b2.id));ok(S.lineup[3]===b2.id&&!S.lineup.includes(was),'select slot then bench replaces that player');
ACT.slot('0');ACT.slot('0');ok(lineupIssues().some(x=>x.includes('门将')),'empty GK slot is flagged: '+lineupIssues().join('；'));
ACT.auto();ok(lineupIssues().length===0,'auto pick gives a valid XI');
// 3. out of position costs strength
const base=strength(my(),S.lineup,'bal',true,0,'4-4-2');const swapped=[...S.lineup];[swapped[1],swapped[9]]=[swapped[9],swapped[1]];
const sw=strength(my(),swapped,'bal',true,0,'4-4-2');ok(sw.atk<base.atk&&sw.def<base.def,'swapping a DF and FW lowers attack '+base.atk.toFixed(1)+'→'+sw.atk.toFixed(1)+' and defence '+base.def.toFixed(1)+'→'+sw.def.toFixed(1));
// 4. render squad + match views, sub at HT, red card leaves empty slot
render();ok(!/undefined|NaN/.test(els.app.innerHTML)&&(els.app.innerHTML.match(/data-act="slot"/g)||[]).length===11,'squad page renders 11 slot buttons');
S.event=null;ffToMatch();startMatch();while(M.min<45)tick(false);
const s=mySide(),outP=findP(M[s+'Ids'][2]),inP=my().players.find(p=>!M[s+'XI'].includes(p.id)&&!unavail(p));
ACT.subOut(String(outP.id));ACT.subIn(String(inP.id));ok(M[s+'Ids'][2]===inP.id,'HT sub keeps the slot (slot 2 now '+inP.name+')');
M[s+'Ids'][4]=null;render();ok(/罚下/.test(els.app.innerHTML)&&!/undefined|NaN/.test(els.app.innerHTML),'HT pitch shows a sent-off gap');
ACT.resume();skipMatch();M=null;
// 5. v5 -> v6 migration (old lineup = unordered list)
newGame(4,teamNames());const old=JSON.parse(JSON.stringify(S));old.v=5;old.lineup=shuffle(S.lineup.filter(x=>x!=null));
store[KEY]=JSON.stringify(old);const up=load();
ok(up.v===SAVE_V&&up.lineup.length===11&&up.lineup[0]!=null&&new Set(up.lineup).size===11,'v5 save migrates to slot lineup');
// 6. fatigue drives injuries: same squads, all at 40 vs all at 95 stamina
const trial=c=>{let n=0;for(let k=0;k<400;k++){S.teams.forEach(t=>t.players.forEach(p=>{p.cond=c;p.inj=0}));const r=quickSim(0,1);n+=S.teams[0].players.concat(S.teams[1].players).filter(p=>p.inj>0).length}return n/400};
const tired=trial(40),fresh=trial(95);ok(tired>fresh*2,'injuries per match — tired: '+tired.toFixed(3)+', fresh: '+fresh.toFixed(3));
`);
