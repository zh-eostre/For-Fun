// Penalties and direct free kicks in a match: who takes them (ours as chosen, else the best man on the pitch), how
// often they come and go in, no assist on them, and the controls for choosing the takers.
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());S.friendlies.forEach(f=>f.res={hg:0,ag:0});
ACT.ff();S.event=null;S.offer=null;S.lineup=autoPick(my(),S.formation);startMatch();clearTimeout(M.timer);M.skip=true;
const s=mySide(),o=s==='h'?'a':'h',on=onPitch(my(),M[s+'Ids']).filter(Boolean);
// automatic takers, with everyone equally good: penalties a forward, free kicks a midfielder
const keepOvr=on.map(p=>p.ovr);on.forEach(p=>{p.ovr=70;delete p.sig});
ok(taker(my(),M[s+'Ids'],'pen').pos==='FW'&&taker(my(),M[s+'Ids'],'fk').pos==='MF','automatic: a forward on penalties, a midfielder on free kicks');
on.forEach((p,i)=>p.ovr=keepOvr[i]);
// ours as chosen (a defender, to be sure it's our choice)
const df=on.find(p=>p.pos==='DF');S.takers={pen:df.id,fk:df.id};
ok(taker(my(),M[s+'Ids'],'pen')===df&&taker(my(),M[s+'Ids'],'fk')===df,'our choice takes them while he is on the pitch');
const opp=S.teams[s==='h'?M.a:M.h];
ok(penOdds(df,{ovr:df.ovr,sig:null})>.7&&penOdds(df,{ovr:df.ovr,sig:null})<.8&&penOdds(df,null)>.95,'a penalty goes in about three times in four (nearly always with no keeper)');
ok(fkOdds({ovr:75})>.1&&fkOdds({ovr:75})<.14&&fkOdds({ovr:90,sig:'x'})>fkOdds({ovr:75}),'a direct free kick about one in eight, better for better takers');
// many attacks each way (as a friendly, so no one is sent off along the way)
M.friendly=true;for(let k=0;k<800;k++){side(s,.45);side(o,.45)}M.friendly=false;
const L=M.feed.map(e=>e.t),pens=L.filter(t=>/点球！/.test(t)).length,fks=L.filter(t=>/获得任意球/.test(t)).length;
console.log('  800 attacks each way: penalties '+pens+', free kicks in range '+fks);
ok(pens>=45&&pens<=120,'penalties now and then ('+pens+')');
ok(fks>=35&&fks<=110,'free kicks in range now and then ('+fks+')');
const penGoals=M.feed.filter(e=>/十二码/.test(e.t)),fkGoals=M.feed.filter(e=>/任意球破门/.test(e.t));
ok(penGoals.length>0&&penGoals.every(e=>!/助攻/.test(e.t)),'penalty goals: '+penGoals.length+', none with an assist');
ok(fkGoals.every(e=>!/助攻/.test(e.t)),'free-kick goals: '+fkGoals.length+', none with an assist');
ok(L.some(t=>t.includes(df.name+' 站上十二码')||t.includes(df.name+' 主罚点球'))||M.injuries.includes(df),'our chosen taker stepped up (unless he was hurt early on)');
skipMatch();ACT.matchDone();
// the controls: the player dialog sets and clears a taker; the squad page names them
const fw=my().players.find(p=>p.pos==='FW');S.takers={};
ACT.player(String(fw.id));ok(/data-act="taker" data-arg="pen:/.test(els.app.innerHTML),'the player dialog offers 设为点球手');
ACT.taker('pen:'+fw.id);ok(S.takers.pen===fw.id,'set as penalty taker');
UI.modal=null;UI.pages=[];UI.tab='squad';render();ok(/点球 <button class="link"/.test(els.app.innerHTML)&&/任意球 <span class="muted">自动/.test(els.app.innerHTML),'the squad page names him (free kicks: 自动)');
ACT.taker('pen:'+fw.id);ok(S.takers.pen==null,'pressed again: back to automatic');
`);
