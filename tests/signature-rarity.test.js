// Signature moves are earned by playing well: each summer the best-rated players of every division may learn one, and
// in-form players can find one on a big night; at most two per club, with succession and fading. Older saves are trimmed.
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());
const all=()=>S.teams.flatMap(t=>t.players);
ok(all().filter(p=>p.sig).length<=10&&S.teams.every(t=>sigCount(t)<=SIG_CAP),'a new game starts with a handful of stars ('+all().filter(p=>p.sig).length+')');
// a big night only counts for a player in form
const p=my().players[3];p.sig=null;my().players.forEach(x=>x.ovr=Math.max(x.ovr,SIG_OVR+2));my().players.forEach(q=>{if(q!==p)q.sig=null});
p.rn=6;p.rs=6*6.5;ok(!inForm(p),'averaging 6.5: not in form');p.rs=6*7.4;ok(inForm(p),'averaging 7.4 over 6 matches: in form');
const low=my().players[6];low.sig=null;low.ovr=SIG_OVR-1;low.rn=6;low.rs=6*8;ok(!learnSig(low,1),'below '+SIG_OVR+' ability: no move, however good the form');
let tries=0;while(!p.sig&&tries++<100)learnSig(p,.3);ok(p.sig&&tries<100,'in form, a big night can bring a move: '+p.sig);
const q=my().players[4],r=my().players[5];learnSig(q,1);ok(!learnSig(r,1),'a third one at the same club is refused');
// the summer: the best-rated three of a division are the candidates
my().players.forEach(x=>x.sig=null);const d=my().div,pool=S.teams.filter(t=>t.div===d).flatMap(t=>t.players);
pool.forEach(x=>{x.sig=null;x.age=25;x.ovr=Math.max(x.ovr,SIG_OVR+2);x.rn=10;x.rs=10*6.7});const nTop=SIG_TOPN[d],stars=pool.slice(0,nTop);stars.forEach(x=>x.rs=10*7.8);
let got=0;for(let k=0;k<40;k++){stars.forEach(x=>x.sig=null);seasonSigs();got+=stars.filter(x=>x.sig).length}
ok(got>nTop*40*.2&&pool.filter(x=>!stars.includes(x)).every(x=>!x.sig),'each summer the best-rated '+nTop+' of '+DIVS[d]+' may learn one ('+got+' of '+nTop*40+' tries), nobody else');
// holders who already have one don't use up a place: the next best is the candidate
stars.forEach(x=>{x.sig='已有·招式'});const next=pool[nTop];next.rs=10*7.5;let nx=0;for(let k=0;k<40;k++){next.sig=null;S.teams.forEach(t=>{if(t.players.includes(next))t.players.filter(x=>x.sig&&x!==next&&!stars.includes(x)).forEach(x=>x.sig=null)});seasonSigs();if(next.sig)nx++}
ok(nx>0,'with the top men already holding moves, the next best gets the chance ('+nx+'/40)');
// fading: a veteran in poor form, or anyone with a poor season, loses his
const vet=pool[nTop+1],slump=pool[nTop+2];vet.sig='老将·招式';vet.age=34;vet.rn=10;vet.rs=10*6.6;slump.sig='低迷·招式';slump.age=26;slump.rn=10;slump.rs=10*6.3;
seasonSigs();ok(!vet.sig&&!slump.sig,'a 34-year-old at 6.6 and a 26-year-old at 6.3 both lose theirs');
// succession: a full club makes room for a clearly better newcomer
const club=my(),[a1,a2,nw]=club.players;club.players.forEach(x=>x.sig=null);a1.sig='甲';a2.sig='乙';a1.rn=a2.rn=nw.rn=10;a1.rs=10*6.6;a2.rs=10*7.4;nw.rs=10*7.6;
ok(learnSig(nw,1)&&nw.sig&&!a1.sig&&a2.sig,'a full club: the newcomer takes over from the holder in worse form');
// an old save: everybody at 75+ had a move; it is trimmed
const old=JSON.parse(JSON.stringify(S));old.v=16;old.teams.forEach(t=>t.players.forEach(x=>{if(x.ovr>=75)x.sig='旧·招式';else delete x.sig}));
const before=old.teams.flatMap(t=>t.players).filter(x=>x.sig).length;store[KEY]=JSON.stringify(old);S=load();
ok(all().filter(x=>x.sig).length<before&&S.teams.every(t=>sigCount(t)<=SIG_CAP),'old save: '+before+' moves trimmed to '+all().filter(x=>x.sig).length);
`);
