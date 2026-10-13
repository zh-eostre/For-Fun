// before a big match a retired legend of the club speaks in the dressing room (feed, news, a card on screen);
// the club's other pages show a rival's strength beside ours
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());UI.guide=null;
S.friendlies.forEach(f=>f.res={hg:0,ag:0});ffToMatch();S.event=null;S.offers=[];
const f=nextFix(),opp=S.teams[f.opp];
ok(legendTalk({...f,derby:true},opp)===null,'no legends yet: nobody comes');
S.legends.push({name:'老炮甲',pos:'FW',goals:120,apps:300,seasons:11,titles:[],season:1,club:my().name,oneClub:true},{name:'别队的',pos:'DF',goals:1,apps:200,seasons:9,titles:[],season:1,club:'某某队'});
ok(legendTalk({...f,derby:false,friendly:true},opp)===null,'a friendly: nobody comes');
const t=legendTalk({...f,derby:true},opp);ok(t&&t.name==='老炮甲'&&/一人一城 老炮甲/.test(t.who)&&t.say.length>5,'a 宿敌之战: our legend comes (not another club\\u2019s): '+(t&&t.say));
ok(keyMatch({...f,derby:false})===null,'an ordinary early league match is not a big one');
// the last rounds, level with the leader: a title fight
S.round=rounds()-2;const T=table(my().div);ok(['title','promo','drop',null].includes(keyMatch({...f,derby:false})),'late in the season the table decides: '+keyMatch({...f,derby:false}));
S.round=0;
// in a real match: S.rival is the next opponent, so it is a 宿敌之战
S.rival=f.opp;const g=nextFix();S.lineup=autoPick(my(),S.formation);startMatch();clearTimeout(M.timer);
ok(g.derby&&M.feed.some(e=>e.cls==='legend'&&/老炮甲/.test(e.t))&&S.news.some(n=>/📣.*老炮甲/.test(n.t)),'kick-off: his words in the feed and the news');
skipMatch();ACT.matchDone();
// a rival's page: its XI's average and lines, beside ours
const other=S.teams.find(x=>x.id!==S.my&&!x.foreign);ACT.team(String(other.id));
ok(/首发平均能力 <b class="num">[0-9]+<\\/b><span class="muted">（我方 [0-9]+）/.test(els.app.innerHTML)&&/前锋 [0-9]+ · 中场 [0-9]+ · 后卫 [0-9]+ · 门将 [0-9]+/.test(els.app.innerHTML),'a club page shows its XI average and each line');
`);
