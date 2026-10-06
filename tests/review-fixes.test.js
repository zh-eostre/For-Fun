// Fixes from the code review: save sanitising, escaping, squad tick button, single event panel, surprise details,
// trophy backfill for old saves.
require('./harness').run(`
// 1. a crafted save can't put markup into the page
newGame(2,teamNames());
const evil=JSON.parse(JSON.stringify(S));
evil.teams[evil.my].name='<img src=x onerror="alert(1)">坏人队';evil.teams[evil.my].players[0].name='"><script>x()</script>';
loadSaveText(JSON.stringify(evil));
ok(!/[<>"]/.test(my().name)&&!/[<>"]/.test(my().players[0].name),'markup characters stripped on load: '+my().name);
UI.tab='home';render();ok(!/<img|<script|onerror="/.test(els.app.innerHTML),'nothing executable reaches the page');
UI.saveFiles=[{name:'a"><img src=x onerror=alert(1)>.json',time:0}];const list=vSaveList();
ok(!/<img/.test(list)&&/&lt;img/.test(list),'save file names are escaped');UI.saveFiles=null;
// 5. squad rows: the tick is a labelled button; rows are no longer role=button
UI.tab='squad';render();const h=els.app.innerHTML;
ok(/<button class="tick"[^>]*aria-label="(加入|移出)首发：/.test(h)&&!/class="prow[^"]*"[^>]*role="button"/.test(h),'tick is a real labelled button');
// 6. event / offer panels appear once
S.event={k:'oracle',pid:null};UI.tab='home';render();ok((els.app.innerHTML.match(/突发事件/g)||[]).length===1,'event panel rendered once');S.event=null;
// 7. epiphany near the cap reports the real gain
my().players.forEach(p=>{p.ovr=94;p.pot=94;p.gain=0});const t=SURPRISES[1].run();const up=my().players.find(p=>p.gain);
ok(up.ovr===95&&up.gain===1&&/能力 \\+1/.test(t),'capped epiphany says +1: '+t);
// 8. yoga and healer feed the day log
my().players.forEach(p=>{p.cond=60;p.inj=0});const log={days:1,cond:0,trained:[],healed:[]};SURPRISES[2].run(log);
ok(log.cond===60*0+40*firstTeam().length,'yoga adds its stamina to the log (+'+log.cond+')');
firstTeam()[2].inj=9;SURPRISES[3].run(log);ok(log.healed.includes(firstTeam()[2]),'healer adds the player to 伤愈复出');
// 10. one gem maker
const g=makeGem();ok(g.pot>=88&&g.scout.conf==='low'&&g.scout.est<=77,'makeGem: hidden gem');
// 9. v12 save: trophies rebuilt from records for players who were with us that season
newGame(2,teamNames());const old=JSON.parse(JSON.stringify(S));old.v=12;
const vet=old.teams[old.my].players[0],kid=old.teams[old.my].players[1];
vet.hist=[{s:1,o:60},{s:2,o:61}];kid.hist=[{s:2,o:50}];
old.club[vet.id]={name:vet.name,pos:vet.pos,goals:0,apps:40,seasons:2,titles:[]};old.club[kid.id]={name:kid.name,pos:kid.pos,goals:0,apps:5,seasons:1,titles:[]};
old.records=[{season:1,champs:[],cup:old.teams[old.my].name,div:0,rank:3,awards:[]},{season:2,champs:[],cup:null,div:0,rank:1,awards:[]}];
store[KEY]=JSON.stringify(old);const u=load();
ok(u.v===SAVE_V&&u.club[vet.id].titles.length===2&&u.club[kid.id].titles.length===1,'old trophies rebuilt: vet '+u.club[vet.id].titles.join('、')+'；kid '+u.club[kid.id].titles.join('、'));
`);
