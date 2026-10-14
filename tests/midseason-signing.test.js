// a player signed mid-season keeps his season's figures (they're his), but only what he does for us goes into our
// club's records and counts toward sharing our trophies
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===1),teamNames());UI.guide=null;
const t=S.teams.find(x=>x.id!==S.my&&!x.foreign&&x.div===my().div),p=t.players.find(x=>!buyBlock(x,t))||t.players[0];
p.apps=12;p.goals=7;p.ast=2;
t.players=t.players.filter(x=>x!==p);my().players.push(p);joinClub(p,my(),false);
ok(p.goals===7&&p.apps===12,'his season so far stays his: 12 matches, 7 goals');
ok(careerApps(p)===0&&unbanked(p,'goals')===0,'his career with us starts at nothing');
p.apps+=3;p.goals+=1;  // three matches and a goal for us
recordSeason(my().div,1);
const c=S.club[p.id];ok(c.apps===3&&c.goals===1,'our records: 3 matches, 1 goal ('+c.apps+', '+c.goals+')');
ok(!(c.titles||[]).length,'3 matches for us is not enough to share our title (12 elsewhere don\\u2019t count)');
`);
