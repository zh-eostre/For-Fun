// Signature moves are earned by playing well: each summer the best-rated players of every division may learn one, and
// in-form players can find one on a big night; at most two per club. Older saves are trimmed.
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());
const all=()=>S.teams.flatMap(t=>t.players);
ok(all().filter(p=>p.sig).length<=10&&S.teams.every(t=>sigCount(t)<=SIG_CAP),'a new game starts with a handful of stars ('+all().filter(p=>p.sig).length+')');
// a big night only counts for a player in form
const p=my().players[3];p.sig=null;my().players.forEach(q=>{if(q!==p)q.sig=null});
p.rn=6;p.rs=6*6.5;ok(!inForm(p),'averaging 6.5: not in form');p.rs=6*7.4;ok(inForm(p),'averaging 7.4 over 6 matches: in form');
let tries=0;while(!p.sig&&tries++<100)learnSig(p,.3);ok(p.sig&&tries<100,'in form, a big night can bring a move: '+p.sig);
const q=my().players[4],r=my().players[5];learnSig(q,1);ok(!learnSig(r,1),'a third one at the same club is refused');
// the summer: the best-rated three of a division are the candidates
my().players.forEach(x=>x.sig=null);const d=my().div,pool=S.teams.filter(t=>t.div===d).flatMap(t=>t.players);
pool.forEach(x=>{x.sig=null;x.rn=10;x.rs=10*6.3});const stars=pool.slice(0,3);stars.forEach(x=>x.rs=10*7.8);
let got=0;for(let k=0;k<30;k++){stars.forEach(x=>x.sig=null);seasonSigs();got+=stars.filter(x=>x.sig).length}
ok(got>15&&pool.filter(x=>!stars.includes(x)).every(x=>!x.sig),'each summer the three best-rated may learn one ('+got+' of 90 tries), nobody else');
// an old save: everybody at 75+ had a move; it is trimmed
const old=JSON.parse(JSON.stringify(S));old.v=16;old.teams.forEach(t=>t.players.forEach(x=>{if(x.ovr>=75)x.sig='旧·招式';else delete x.sig}));
const before=old.teams.flatMap(t=>t.players).filter(x=>x.sig).length;store[KEY]=JSON.stringify(old);S=load();
ok(all().filter(x=>x.sig).length<before&&S.teams.every(t=>sigCount(t)<=SIG_CAP),'old save: '+before+' moves trimmed to '+all().filter(x=>x.sig).length);
`);
