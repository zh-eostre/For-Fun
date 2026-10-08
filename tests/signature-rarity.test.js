// Signature moves are rare: only the league's top few percent, at most two per club, learned at big moments.
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());
const all=()=>S.teams.flatMap(t=>t.players);
ok(S.sigBar>=SIG_FLOOR&&all().filter(p=>p.ovr>=S.sigBar).length<=Math.ceil(all().length*SIG_TOP)+5,'the bar ('+S.sigBar+') lets in only the top few percent');
ok(S.teams.every(t=>sigCount(t)<=SIG_CAP)&&all().every(p=>!p.sig||p.ovr>=S.sigBar),'at most '+SIG_CAP+' per club, all above the bar ('+all().filter(p=>p.sig).length+' in the league)');
// a player below the bar can't learn one, however big the moment
const p=my().players[0];p.sig=null;p.ovr=S.sigBar-1;let got=0;for(let k=0;k<50;k++)if(learnSig(p,1))got++;ok(!got,'below the bar: no move');
p.ovr=S.sigBar+1;my().players.forEach(q=>{if(q!==p)q.sig=null});ok(learnSig(p,1)&&p.sig,'above the bar at a big moment: learns '+p.sig);
const q=my().players[1],r=my().players[2];q.ovr=r.ovr=S.sigBar+2;learnSig(q,1);ok(!learnSig(r,1),'a third one at the same club is refused');
// an old save: everybody at 75+ had a move; it is trimmed to each club's best near the bar
const d=JSON.parse(JSON.stringify(S));d.v=16;d.teams.forEach(t=>t.players.forEach(x=>{if(x.ovr>=75)x.sig='旧·招式';else delete x.sig}));
const before=d.teams.flatMap(t=>t.players).filter(x=>x.sig).length;store[KEY]=JSON.stringify(d);S=load();
const after=all().filter(x=>x.sig).length;ok(after<before&&S.teams.every(t=>sigCount(t)<=SIG_CAP),'old save: '+before+' moves trimmed to '+after);
`);
