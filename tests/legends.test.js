// Club legends: 3+ seasons with a trophy (5+ appearances that season), or 8+ seasons, and retiring with us.
require('./harness').run(`
newGame(2,teamNames());
const [a,b,c,d,e]=my().players;
// season record: we "win" the league; a, b and e played enough, c sat on the bench, d played 4
a.apps=20;b.apps=12;c.apps=0;d.apps=4;e.apps=3;
recordSeason(my().div,1);
ok(S.club[a.id].seasons===1&&S.club[a.id].titles.length===1,'a shares the title (20 apps): '+S.club[a.id].titles[0]);
ok(S.club[c.id].titles.length===0&&S.club[d.id].titles.length===0&&S.club[e.id].titles.length===0,'c (0 apps), d (4) and e (3) do not share it');
// give them more seasons with the club
S.club[a.id].seasons=3;S.club[b.id].seasons=2;S.club[c.id].seasons=8;S.club[d.id].seasons=5;S.club[e.id].seasons=7;
ok(isLegend(S.club[a.id]),'3 seasons + title: legend');
ok(!isLegend(S.club[b.id]),'2 seasons + title: not yet');
ok(isLegend(S.club[c.id]),'8 seasons, no title: legend');
ok(!isLegend(S.club[d.id]),'5 seasons, no title: not a legend');
ok(!isLegend(S.club[e.id]),'7 seasons, no title: not yet');
// retiring through a real season change (which adds that season): b reaches 3 seasons with his title, e reaches 8
[a,b,c,d,e].forEach(p=>{p.age=39;p.ovr=50});
const n=S.legends.length;S.round=ROUNDS;newSeason();
const names=S.legends.slice(n).map(l=>l.name);
ok(names.length===4&&[a,b,c,e].every(p=>names.includes(p.name))&&!names.includes(d.name),'legends: a, b, c, e retired as legends; d (6 seasons, no title) did not');
const la=S.legends.find(l=>l.name===a.name);ok(la.seasons>=3&&la.titles.length>=1,'record keeps seasons ('+la.seasons+') and trophies ('+la.titles.length+')');
UI.tab='honours';render();ok(/传奇退役/.test(els.app.innerHTML)&&/座冠军/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'honours room shows seasons and trophies');
// player page shows seasons with the club and when he qualifies
const f=my().players[0];S.club[f.id]={name:f.name,pos:f.pos,goals:3,apps:40,seasons:8,titles:['第 1 季甲级冠军']};
ACT.player(String(f.id));ok(/效力赛季/.test(els.app.innerHTML)&&/已达到传奇标准/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'player page: seasons, trophies, legend status');
// v11 save: seasons estimated from ability history
const old=JSON.parse(JSON.stringify(S));old.v=11;const p0=old.teams[old.my].players[1];old.club[p0.id]={name:p0.name,pos:p0.pos,goals:0,apps:30};p0.hist=[{s:1,o:60},{s:2,o:62},{s:3,o:63}];
store[KEY]=JSON.stringify(old);const up=load();ok(up.v===SAVE_V&&up.club[p0.id].seasons===3,'v11 save: seasons estimated from history (3)');
`);
