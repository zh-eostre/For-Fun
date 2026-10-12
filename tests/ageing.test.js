// Veterans don't train back what age takes: growth fades with age and stops at 33, and a decline past 33 is for good.
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());
ok([20,25,29,32,33,36].map(a=>AGE_GROW(a)).join()==='1.3,1,0.6,0.3,0,0','growth by age: 21- fast, 22-27 normal, 28-30 slower, 31-32 slow, 33+ none');
const vet=my().players[5],kid=my().players[6];
vet.age=34;vet.ovr=70;vet.pot=82;kid.age=24;kid.ovr=60;kid.pot=85;S.training='hard';
const v0=vet.ovr,k0=kid.ovr;let g=0;while(S.round<10&&g++<600){if(isMatchDay()){S.event=null;S.offer=null;startMatch();skipMatch();ACT.matchDone()}else ACT.nextDay()}
ok(vet.ovr===v0,'a 34-year-old with room below his old potential stays at '+vet.ovr+' through training and matches');
ok(kid.ovr>k0,'a 24-year-old improves meanwhile: '+k0+' → '+kid.ovr);
// season end: decline past 33 lowers the potential with it
while(!seasonDone()){if(S.event)ACT.event('0');if(S.offer)ACT.offerNo();ffToMatch();S.event=null;S.offer=null;startMatch();skipMatch();ACT.matchDone()}
const vets=my().players.filter(p=>p.age>=33);vets.forEach(p=>{p.age=34;p.pot=p.ovr+10});const ids=vets.map(p=>p.id);
ACT.newSeason();const after=my().players.filter(p=>ids.includes(p.id));
ok(after.length===0||after.every(p=>p.pot===p.ovr),'after the summer every 33+ player has potential = ability ('+after.length+' checked)');
// a star above 92 keeps his level into the new season (the cap is 95, the same as potential)
{newGame(TEAMS.findIndex(t=>t.div===2),teamNames());const st=my().players.find(p=>p.pos!=='GK');st.age=26;st.pot=95;st.ovr=94;
  S.round=rounds();newSeason();ok(st.ovr>=93,'a 94 at 26 is still 93-95 next season ('+st.ovr+')')}
// retirement: by age, then ability in 5-point steps, then his place at the club
{const at=(age,ovr,lvl)=>retireChance({age,ovr},lvl);
  ok(at(35,88,80)<at(35,82,80)&&at(35,82,80)<at(35,77,80)&&at(35,77,80)<at(35,72,80)&&at(35,72,80)<at(35,67,80)&&at(35,67,80)<at(35,62,80)&&at(35,62,80)<at(35,57,80),'at 35, the better the player the less likely he stops');
  ok(at(35,70,68)<at(35,70,72)&&at(35,70,72)<at(35,70,77)&&at(35,70,77)<at(35,70,82),'the further below his club\u2019s level, the more likely ('+[68,72,77,82].map(l=>Math.round(at(35,70,l)*100)+'%').join(' ')+')');
  ok(at(32,90,70)===0&&at(40,90,70)===1,'nobody stops before 33; everyone at 40');
  newGame(TEAMS.findIndex(t=>t.div===2),teamNames());UI.guide=null;const v=my().players[0];v.age=37;v.ovr=50;UI.tab='squad';render();
  ok(/赛季结束时有 [0-9]+% 机会退役/.test(els.app.innerHTML),'the squad list warns about a likely retirement');}
`);
