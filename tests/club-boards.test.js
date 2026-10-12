// All-time club boards (scorers, assists, rating) and what happens to club records when we change clubs.
require('./harness').run(`
newGame(12,teamNames());
const play=()=>{if(S.event)ACT.event('0');if(S.offer)ACT.offerNo();ffToMatch();S.lineup=autoPick(my(),S.formation);startMatch();skipMatch();M=null;UI.view='main'};
while(S.round<rounds()-1)play();  // before the season-end screen takes over
UI.tab='honours';
for(const k of ['goals','ast','rating']){ACT.hlb(k);const h=els.app.innerHTML;
  ok(new RegExp('队史'+{goals:'射手',ast:'助攻',rating:'评分'}[k]+'榜').test(h)&&/class="res"/.test(h)&&!bad(h),'all-time '+k+' board lists players');}
ok(/tag2 now/.test(els.app.innerHTML),'players still at the club are marked 现役');
const top=clubCareer().filter(c=>c.rn>=CAREER_RATED).sort((a,b)=>b.rs/b.rn-a.rs/a.rn)[0];
ok(top&&els.app.innerHTML.includes(top.name),'rating board is led by the best average over '+CAREER_RATED+'+ rated matches');
// a season later the banked numbers still count
while(S.round<rounds())play();
const before=clubCareer().find(c=>c.id===top.id);
S.jobOffers=[];ACT.newSeason();const after=clubCareer().find(c=>c.id===top.id);
ok(after&&after.rn===before.rn&&Math.abs(after.rs-before.rs)<1e-9,'ratings are banked at season end');
// change clubs: records start afresh, but our old club's awards stay in the honours room
const oldClub=S.my,oldName=my().name;
S.records[S.records.length-1].awards[my().div]={mvp:{name:'旧将',pos:'MF',team:oldName,tid:oldClub,stat:'7.50'}};
while(S.round<rounds())play();
const dest=S.teams.find(t=>t.id!==S.my&&t.div===my().div);S.jobOffers=[{club:dest.id,budget:200}];
const b={dataset:{},textContent:'',isConnected:true};ACT.takeJob(String(dest.id),b);ACT.takeJob(String(dest.id),b);
ok(S.my===dest.id&&!Object.keys(S.club).length,'at the new club the all-time records start empty');
UI.tab='honours';ACT.hlb('goals');const h=els.app.innerHTML;
ok(h.includes('最佳球员：旧将'),'the old club\\'s award is still in the honours room');
ok(!clubCareer().some(c=>!dest.players.some(p=>p.id===c.id)),'the all-time boards only hold players of the new club');
// sold mid-season and bought back: the goals before the sale are counted once, not twice
{newGame(TEAMS.findIndex(t=>t.div===2),teamNames());S.club={};const p=my().players.find(x=>x.pos==='FW');
  p.goals=5;p.apps=8;bankPlayer(p);  // sold: his season so far goes on record
  ok(S.club[p.id].goals===5,'sold with 5 goals: 5 on record');
  p.goals=7;p.apps=11;  // bought back, two more
  ok(clubCareer().find(c=>c.id===p.id).goals===7&&careerApps(p)===11,'back with us: the all-time board shows 7, not 12');
  recordSeason(my().div,1);ok(S.club[p.id].goals===7&&S.club[p.id].apps===11,'the season banked at its end: 7 goals, 11 matches');
  S.round=rounds();newSeason();ok(!p.bk&&p.goals===0&&clubCareer().find(c=>c.id===p.id).goals===7,'a new season starts clean');}
`);
