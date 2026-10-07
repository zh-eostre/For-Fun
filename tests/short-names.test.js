// Short names on the pitch, stamina list and ratings are unique within a club.
require('./harness').run(`
let dup=0,teams=0;for(let k=0;k<6;k++){newGame(k*3%20,teamNames());S.teams.forEach(t=>{teams++;const l=t.players.map(pName);if(new Set(l).size!==l.length)dup++})}
ok(!dup,'no club has two players with the same label ('+teams+' clubs)');
const t=S.teams[0],[a,b,c]=t.players;a.name='阿米尔·阿末';b.name='阿米尔·拉曼';c.name='阿米尔·阿都拉';
ok(pName(b)==='阿米尔·拉'&&pName(a)==='阿米尔·阿末'&&pName(c)==='阿米尔·阿都拉','阿米尔·拉 stands out by initial; the two 阿米尔·阿 get their full names');
`);
