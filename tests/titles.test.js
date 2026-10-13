// 称号: the new ones unlock when they should, and the honours room shows the unlocked ones and folds the rest away
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());UI.guide=null;
ok(Object.keys(ACH).length>=34,'there are '+Object.keys(ACH).length+' titles');
UI.tab='honours';render();
ok(/还没有解锁任何称号/.test(els.app.innerHTML)&&/data-fold="ach"[^>]*>[^]*未解锁[^]*>[0-9]+ 个/.test(els.app.innerHTML),'a new game: nothing unlocked, every title folded under 未解锁');
// how things stand
S.budget=ACH_RICH;my().players[0].ovr=90;Object.keys(FAC).forEach(k=>S.fac[k]=5);achCheck();
ok(S.ach.rich&&S.ach.star90&&S.ach.builder&&!S.ach.vet10,'富可敌国, 神之领域, 基建狂魔 (not yet 活着的传说)');
// a season with no defeats in the league, and the golden boot
S.results[my().div]=[[{h:S.my,a:table()[1].id,hg:3,ag:0}]];
const fw=my().players.find(p=>p.pos==='FW');fw.goals=99;fw.apps=20;
recordSeason(my().div,1);ok(S.ach.unbeaten&&S.ach.boot,'无敌之师 and 王者之靴');
// three 甲级 titles in a row with the same club
S.records=[1,2,3].map(s=>({season:s,div:0,rank:1,my:S.my,champs:[],awards:[],xi:[]}));recordSeason(0,1);
ok(S.ach.dynasty,'王朝');
// a legend retires
const old=my().players[1];S.club[old.id]={name:old.name,pos:old.pos,goals:1,apps:300,seasons:9,titles:[]};retireLegend(old);ok(S.ach.legend,'传奇缔造者');
render();ok(/<div class="achs"><div class="ach got">/.test(els.app.innerHTML)&&!/「？？？」[^]*<\\/details>[^]*class="ach got"/.test(els.app.innerHTML),'unlocked titles shown, the locked ones folded below');
// a match: six goals, a red card, a clean sheet
S.friendlies.forEach(f=>f.res={hg:0,ag:0});ffToMatch();S.event=null;S.lineup=autoPick(my(),S.formation);startMatch();clearTimeout(M.timer);M.skip=false;
const mine=mySide();M[mine==='h'?'hg':'ag']=6;M[mine==='h'?'ag':'hg']=0;M.ev[S.lineup[5]]={red:1};S.clean=2;
M.min=89;const keep=rng;let n=0;rng=()=>n++<60?.999:keep();tick(false);rng=keep;  // the last minute, quietly
ok(M.done,'full time');ACT.matchDone();ok(S.ach.fest&&S.ach.tenmen&&S.ach.clean,'火力全开, 残阵之魂, 铁壁·不落之城');
`);
