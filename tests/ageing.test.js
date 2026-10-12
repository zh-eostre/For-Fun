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
while(!seasonDone()){if(S.event)ACT.event('0');if(S.offer)ACT.offerNo();ACT.ff();S.event=null;S.offer=null;startMatch();skipMatch();ACT.matchDone()}
const vets=my().players.filter(p=>p.age>=33);vets.forEach(p=>{p.age=34;p.pot=p.ovr+10});const ids=vets.map(p=>p.id);
ACT.newSeason();const after=my().players.filter(p=>ids.includes(p.id));
ok(after.length===0||after.every(p=>p.pot===p.ovr),'after the summer every 33+ player has potential = ability ('+after.length+' checked)');
// a star above 92 keeps his level into the new season (the cap is 95, the same as potential)
{newGame(TEAMS.findIndex(t=>t.div===2),teamNames());const st=my().players.find(p=>p.pos!=='GK');st.age=26;st.pot=95;st.ovr=94;
  S.round=rounds();newSeason();ok(st.ovr>=93,'a 94 at 26 is still 93-95 next season ('+st.ovr+')')}
`);
