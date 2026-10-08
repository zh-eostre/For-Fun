// Signature moves follow ability and age: learned the moment ability reaches 88, gone in the summer a player turns 34.
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());
const all=()=>S.teams.flatMap(t=>t.players);
ok(all().every(p=>!!p.sig===(p.ovr>=SIG_OVR&&p.age<SIG_FADE)),'a new game: exactly the 88+ players under 34 have one ('+all().filter(p=>p.sig).length+')');
const p=my().players[3];p.sig=null;p.age=26;p.ovr=SIG_OVR-1;p.pot=95;ok(!learnSig(p),'87: none');
p.ovr=SIG_OVR;ok(learnSig(p)&&p.sig,'88: learns '+p.sig);
// no limit per club: an all-star XI can hold them all
my().players.slice(0,11).forEach(x=>{x.sig=null;x.age=27;x.ovr=SIG_OVR+1;learnSig(x)});ok(sigCount(my())>=11,'no cap per club ('+sigCount(my())+' in our squad)');
// training past 87 brings it
const q=my().players[12];q.sig=null;q.age=22;q.ovr=SIG_OVR-1;q.pot=95;S.training='hard';let g=0;while(q.ovr<SIG_OVR&&g++<300){if(isMatchDay()){S.event=null;S.offer=null;startMatch();skipMatch();ACT.matchDone()}else ACT.nextDay()}
ok(q.ovr<SIG_OVR||q.sig,'improving to '+q.ovr+' through training and matches: '+(q.sig||'—'));
// the summer he turns 34 it fades
while(S.round<rounds()){if(S.event)ACT.event('0');if(S.offer)ACT.offerNo();ACT.ff();S.event=null;S.offer=null;startMatch();skipMatch();ACT.matchDone()}
const v=my().players.find(x=>x.sig);v.age=SIG_FADE-1;const vid=v.id;ACT.newSeason();const v2=my().players.find(x=>x.id===vid);
ok(!v2||(v2.age===SIG_FADE&&!v2.sig),'turning 34: the move fades');
// an old save is brought in line
const d=JSON.parse(JSON.stringify(S));d.v=17;d.teams.forEach(t=>t.players.forEach(x=>{x.sig=x.ovr>=75?'旧·招式':undefined}));store[KEY]=JSON.stringify(d);S=load();
ok(all().every(x=>!!x.sig===(x.ovr>=SIG_OVR&&x.age<SIG_FADE)),'an older save: only 88+ under 34 keep or gain one');
`);
