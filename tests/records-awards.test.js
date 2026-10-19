// league records per division (set quietly in a division's first season, then broken with a line in the news; ours
// passing one mid-season makes the news at once) and the national awards ceremony at the season's end
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===1),teamNames());UI.guide=null;
UI.tab='table';UI.div=my().div;render();ok(/联赛纪录/.test(els.app.innerHTML)&&/本季结束后建立/.test(els.app.innerHTML),'the table page has the records panel, empty at first');
// a mid-season record by one of ours
S.lrec={[my().div]:{goals:{v:2,name:'某人',tid:S.teams.find(t=>t.id!==S.my&&t.div===my().div).id,team:'某队',season:0}}};
const p=my().players.find(x=>x.pos==='FW');p.goals=3;liveRecords();
ok(S.news[0].t.includes(p.name)&&/打破了/.test(S.news[0].t),'one of ours passes the goals record: the news at once');
const n0=S.news.length;liveRecords();ok(S.news.length===n0,'only once a season');
p.goals=0;S.lrec={};
// a whole season
let k=0;while(!seasonDone()&&k++<80){if(S.event)ACT.event('0');S.offers=[];ffToMatch();S.event=null;if(!isMatchDay())break;S.lineup=autoPick(my(),S.formation);startMatch();skipMatch();ACT.matchDone()}
finishIntl();render();
const A=nationalAwards();
ok(A.length>=4&&A.every(([k,l,n])=>n.length>=1&&n.length<=3),'the national awards: '+A.map(a=>a[1]).join('、'));
ok(/全国年度颁奖典礼/.test(els.app.innerHTML)&&(els.app.innerHTML.match(/class="cer /g)||[]).length===A.length&&/？？？/.test(els.app.innerHTML),'the ceremony on the season-end screen, winners hidden');
ACT.cer();ok(new RegExp(A[0][2][0].name).test(els.app.innerHTML.split('class="cer ')[1])&&/揭晓「/.test(els.app.innerHTML),'揭晓: the first award\\u2019s winner is shown');
ACT.cerAll();ok(!/？？？/.test(els.app.innerHTML)&&!/data-act="cer"/.test(els.app.innerHTML),'全部揭晓: all of them');
const div=my().div,bests=seasonBests(div);
ok(LREC.every(([k])=>k==='margin'||bests[k]),'this season\\u2019s bests: '+LREC.map(([k,l])=>l+' '+(bests[k]?bests[k].v:'-')).join('，'));
// a record from before, beaten this season: in the news
S.lrec={[div]:{pts:{v:1,name:'旧日王者',tid:S.my,team:'旧日王者',season:0}}};const broken=updateRecords();
ok(broken.some(b=>b.k==='pts')&&S.news.some(n=>/📜/.test(n.t)&&/单季积分/.test(n.t)),'a record broken makes the news: '+S.news.find(n=>/📜/.test(n.t)).t);
S.lrec={};
newSeason();
ok(DIVS.every((_,d)=>!divSize(d)||Object.keys(S.lrec[d]||{}).length>=6)&&!S.news.some(n=>/📜/.test(n.t)&&/第 1 季/.test(n.t)),'the first season sets every division\\u2019s records quietly');
const rec=S.records[S.records.length-1];ok(rec.nat&&rec.nat.length===A.length,'the awards are kept with the season');
UI.tab='honours';render();ok(/全国年度大奖/.test(els.app.innerHTML)&&els.app.innerHTML.includes(rec.nat[0].name),'and listed in the honours room');
UI.tab='table';render();ok(!/本季结束后建立/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'the records panel now shows them');
`);
