// Club history charts in the honours room: league position and points per match by season, with tooltips and a
// table; seasons now keep their goals for and against.
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());UI.guide=null;UI.tab='honours';render();
ok(/踢满两个赛季后/.test(els.app.innerHTML),'before two seasons: a note instead of charts');
S.round=rounds();newSeason();const h=S.history[0];
ok(typeof h.p==='number'&&typeof h.gf==='number'&&typeof h.ga==='number','a season on record keeps matches, goals for and against');
S.history.push({season:2,div:1,rank:3,pts:40,p:22,gf:35,ga:20,club:my().name},{season:3,div:0,rank:1,pts:44,club:my().name});
UI.tab='honours';render();const x=els.app.innerHTML;
ok((x.match(/class="hchart"/g)||[]).length===2&&!bad(x),'two charts: position and points per match');
ok((x.match(/class="hdot"/g)||[]).length===3&&(x.match(/class="hbar"/g)||[]).length===3,'a dot and a bar for each season');
ok(/data-tip="第 3 季 · [^"]*甲级第 1 名 · 44 分（场均 2\\.44）"/.test(x),'tooltips name the season (an old record without its match count uses the division\\u2019s rounds)');
ok(/甲级第 1<\\/text>/.test(x)&&/>2\\.44<\\/text>/.test(x),'the latest season is labelled on both');
ok((x.match(/<tr><td>S\\d+<\\/td>/g)||[]).length===3&&/—<\\/td>/.test(x),'and a table (goals shown where they were kept)');
`);
