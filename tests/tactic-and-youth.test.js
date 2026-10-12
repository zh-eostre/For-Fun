// Halftime tactic only lasts the match; academy kids debut after 5 matches or one season.
require('./harness').run(`

// halftime tactic stays in the match
newGame(2,teamNames());S.tactic='def';ffToMatch();S.event=null;startMatch();
ok(M.tac==='def','match starts with the club tactic (防守反击)');
while(M.min<45)tick(false);ACT.tac('att');render();
ok(M.tac==='att'&&S.tactic==='def'&&/只影响本场/.test(els.app.innerHTML),'halftime switch to 全力进攻 changes only this match');
ACT.resume();skipMatch();ACT.matchDone();
ok(S.tactic==='def'&&nextFix()&&!/undefined/.test(els.app.innerHTML),'back at the club the tactic is still 防守反击');
UI.tab='squad';ACT.tac('bal');ok(S.tactic==='bal','squad page still sets the default (平衡)');
// youth debut: 5 apps or one season
const kid=S.academy.intake[0];ACT.ysign(String(kid.id));const k=findP(kid.id);
ok(unproven(k)&&k.joined===S.season,'signed this season: unproven, sells for '+sellPrice(k));
k.apps=3;ok(unproven(k),'3 apps: still unproven');
k.apps=5;ok(!unproven(k),'5 apps (subs count): debuted, sells for '+sellPrice(k));
k.apps=0;
while(!seasonDone()){ffToMatch();S.event=null;S.offer=null;S.lineup=autoPick(my(),S.formation);startMatch();skipMatch();M=null;UI.view='main'}
const appsBefore=careerApps(k);newSeason();
ok(!unproven(k),'next season he has debuted even with '+appsBefore+' apps; sells for '+sellPrice(k));
const auto=my().players.find(p=>p.youth&&p.joined===S.season);
if(auto)ok(unproven(auto),'auto-promoted youth this season is unproven');
// old youth without joined field
delete k.joined;k.apps=0;S.club[k.id]={name:k.name,pos:k.pos,goals:0,apps:0};ok(unproven(k),'old-save youth (no joined) counts from the current season');
`);
