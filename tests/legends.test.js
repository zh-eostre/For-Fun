// Club legends: a long servant (8+ seasons, 200+ matches), or a key man of a great time (5+ seasons, 120+ matches
// and a 甲级 title, a cup, the 冠军杯 or a promotion he shared, with 5+ appearances that season); retiring with us.
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===1),teamNames());
const [a,b,c,d,e,g]=my().players;
// season record: we win 乙级 (a title and a promotion); a, b and e played enough, c sat on the bench, d played 4
a.apps=20;b.apps=12;c.apps=0;d.apps=4;e.apps=3;g.apps=0;
recordSeason(my().div,1);
ok(S.club[a.id].seasons===1&&S.club[a.id].titles.length===1&&S.club[a.id].ups.length===1,'a shares the title and the promotion (20 apps): '+S.club[a.id].titles[0]+' / '+S.club[a.id].ups[0]);
ok(!S.club[c.id].ups&&S.club[d.id].titles.length===0&&!S.club[e.id].ups,'c (0 apps), d (4) and e (3) do not share them');
// the bar
const L=(seasons,apps,titles,ups)=>isLegend({seasons,apps,titles,ups});
ok(L(5,120,[],['第 1 季升入甲级'])&&L(5,120,['第 2 季甲级冠军'],[])&&L(5,120,['第 2 季'+CUP_NAME+'冠军'],[]),'5 seasons, 120 matches and a promotion, a 甲级 title or a cup: legend');
ok(!L(4,200,['第 2 季甲级冠军'],[])&&!L(5,119,['第 2 季甲级冠军'],[]),'too few seasons or matches: not yet');
ok(!L(6,150,['第 2 季丙级冠军'],[]),'a lower division title alone (no promotion recorded) is not enough');
ok(L(8,200,[],[])&&!L(8,199,[],[])&&!L(9,81,[],[]),'8 seasons and 200 matches with nothing won: legend; a bench player of 9 seasons is not');
// retiring through a real season change: a has the numbers, b does not
S.club[a.id].seasons=5;S.club[a.id].apps=140;S.club[b.id].seasons=5;S.club[b.id].apps=60;
[a,b].forEach(p=>{p.age=39;p.ovr=50;p.apps=0});
const n=S.legends.length;S.round=rounds();newSeason();
const names=S.legends.slice(n).map(l=>l.name);
ok(names.includes(a.name)&&!names.includes(b.name),'a retires a legend; b (60 matches) does not');
const la=S.legends.find(l=>l.name===a.name);ok(la.titles.length>=1&&la.ups>=1,'the record keeps his trophies and promotions');
UI.tab='honours';render();ok(/传奇退役/.test(els.app.innerHTML)&&/🏆 [^<]*冠军/.test(els.app.innerHTML)&&/⬆ 升级/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'honours room shows trophies and promotions');
// player page shows seasons with the club, promotions and when he qualifies
const f=my().players[0];S.club[f.id]={name:f.name,pos:f.pos,goals:3,apps:210,seasons:8,titles:['第 1 季甲级冠军'],ups:['第 1 季升入甲级']};
ACT.player(String(f.id));ok(/效力赛季/.test(els.app.innerHTML)&&/⬆ 第 1 季升入甲级/.test(els.app.innerHTML)&&/已达到传奇标准/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'player page: seasons, trophies, promotions, legend status');UI.modal=null;
// v11 save: seasons estimated from ability history
const old=JSON.parse(JSON.stringify(S));old.v=11;const p0=old.teams[old.my].players[1];old.club[p0.id]={name:p0.name,pos:p0.pos,goals:0,apps:30};p0.hist=[{s:1,o:60},{s:2,o:62},{s:3,o:63}];
store[KEY]=JSON.stringify(old);const up=load();ok(up.v===SAVE_V&&up.club[p0.id].seasons===3,'v11 save: seasons estimated from history (3)');
// v23 save: promotions from the seasons he finished with us
const o2=JSON.parse(JSON.stringify(S));o2.v=23;const p1=o2.teams[o2.my].players[2];o2.club[p1.id]={name:p1.name,pos:p1.pos,goals:0,apps:50,seasons:2,titles:[]};
p1.hist=[{s:1,o:60}];o2.history=[{season:1,div:1,rank:2,club:'x'},{season:2,div:1,rank:5,club:'x'}];store[KEY]=JSON.stringify(o2);
const u2=load();ok(u2.club[p1.id].ups&&u2.club[p1.id].ups[0]==='第 1 季升入甲级','v23 save: his promotion in season 1 is credited');
`);
