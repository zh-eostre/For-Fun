// cup records: set quietly by each cup's first edition, broken later with a line in the news; one of ours passing the
// goals record mid-cup makes the news at once; the cup page lists them
require('./harness').run(`
newGame(TEAMS.map((t,i)=>[t,i]).filter(([t])=>t.div===0).sort((a,b)=>b[0].rep-a[0].rep)[0][1],teamNames());UI.guide=null;
UI.tab='cup';UI.cupv='dom';render();ok(/天穹杯纪录/.test(els.app.innerHTML)&&/第一届决赛后建立/.test(els.app.innerHTML),'the cup page has its records panel, empty at first');
// the first edition: quiet
while(S.cup.winner==null)playCupStage(null);
const R=S.crec.cup;ok(R&&R.goals&&R.margin&&R.streak&&R.streak.v===1&&!S.news.some(n=>/📜 天穹杯纪录/.test(n.t)),'the first 天穹杯 sets its records quietly: '+CREC.filter(c=>!c[3]).map(([k,l])=>l+' '+(R[k]?R[k].v:'-')).join('，'));
finishIntl();const I=S.crec.intl;ok(I&&I.home&&HOME_RUN.includes(I.home.label),'the 冠军杯 too, with our best club\\u2019s run: '+(I.home&&I.home.label));
UI.cupv='intl';render();ok(/天际冠军杯纪录/.test(els.app.innerHTML)&&/本国最好成绩/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'listed on the 冠军杯 page');
// a record broken: in the news
S.crec.cup.margin.v=0;S.crec.cup.goals.v=0;updateCupRecords('cup');
ok(S.news.some(n=>/📜 天穹杯纪录被改写！「单场最大胜分差」/.test(n.t))&&S.news.some(n=>/「单届最多进球」/.test(n.t)),'records broken make the news');
// a second title in a row: a streak of 2
S.records.push({season:S.season,cup:S.teams[S.cup.winner].name,champs:[],awards:[],xi:[],div:0,rank:1,my:S.my});S.season++;
const w=S.cup.winner;S.crec.cup.streak={v:1,name:'x',tid:w,season:0,team:'x'};updateCupRecords('cup');
ok(S.crec.cup.streak.v===2&&S.crec.cup.streak.name===S.teams[w].name,'two in a row: the 连冠 record');S.season--;S.records.pop();
// ours passing the goals record mid-cup
S.crec.cup.goals={v:1,name:'某人',tid:w,team:'某队',season:0};const p=my().players.find(x=>x.pos==='FW');p.cupG={cup:2};p.goals=2;
liveCupRecords('cup');ok(S.news.some(n=>n.t.includes(p.name)&&/超越了「单届最多进球」/.test(n.t)),'one of ours passes the goals record: the news at once');
const n0=S.news.length;liveCupRecords('cup');ok(S.news.length===n0,'only once');
`);
