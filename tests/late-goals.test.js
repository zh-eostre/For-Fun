// 绝杀 / 绝平: a goal from the 85th minute that wins or levels the match is only a question when it goes in; at the
// final whistle, if it was the last goal, it's called a 绝杀 or 绝平 (feed, celebration, summary, news, title).
require('./harness').run(`
const setup=()=>{newGame(TEAMS.findIndex(t=>t.div===2),teamNames());S.friendlies.forEach(f=>f.res={hg:0,ag:0});
  ACT.ff();S.event=null;S.offer=null;S.lineup=autoPick(my(),S.formation);startMatch();clearTimeout(M.timer);M.skip=false};
// a goal for side s this minute (side() can still be stopped by a keeper's or defender's move: try again)
const score=s=>{const k=s==='h'?'hg':'ag',n=M[k];for(let i=0;i<50&&M[k]===n;i++)side(s,1)};
// play out to the final whistle with no more goals
const quietEnd=()=>{M.min=89;const keep=rng;let n=0;rng=()=>n++<60?.999:keep();tick(false);rng=keep;while(M.pk)pkStep()};
const me=()=>mySide(),them=()=>mySide()==='h'?'a':'h';

// our late winner, and nothing after it
setup();M.min=86;M.hg=M.ag=1;score(me());
ok(M.lastGoal&&M.lastGoal.kind==='win'&&M.feed.some(e=>/这会是绝杀吗/.test(e.t)),'86th-minute go-ahead goal: the commentary asks if it is the winner');
ok(!M.late,'nothing is called a 绝杀 yet');
quietEnd();
ok(M.done&&M.late&&M.late.kind==='win'&&M.late.mine&&M.late.min===86,'final whistle: it was the last goal, so it is a 绝杀');
ok(M.feed.some(e=>/成为绝杀/.test(e.t))&&M.summary.late&&S.news.some(n=>/⚡.*绝杀/.test(n.t))&&S.ach.late,'commentary, full-time summary, news and the 读秒杀手 title');
render();ok(/⚡ .* 86' 绝杀/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'the full-time panel shows it');ACT.matchDone();

// a late goal that is answered: no 绝杀
setup();M.min=87;M.hg=M.ag=0;score(me());M.min=88;score(them());
ok(M.lastGoal.kind==='level',"their reply is a late equaliser in waiting");
quietEnd();ok(M.late&&M.late.kind==='level'&&!M.late.mine&&!S.ach.late,'final whistle: our goal was not the last one; theirs is a 绝平 against us');
ok(M.feed.some(e=>/绝平/.test(e.t))&&S.news.some(n=>/被.*绝平/.test(n.t)),'commentary and news say we were pegged back');ACT.matchDone();

// an early goal, or a late one that only adds to a lead, is no 绝杀
setup();M.min=40;M.hg=M.ag=0;score(me());quietEnd();ok(!M.late,'a 40th-minute winner is just a winner');ACT.matchDone();
setup();M.min=88;M.hg=M.ag=0;if(me()==='h')M.hg=1;else M.ag=1;score(me());ok(M.lastGoal.kind===null,'an 88th-minute goal to go 2-0 up: no question asked');
quietEnd();ok(!M.late,'and no 绝杀 at the end');ACT.matchDone();
`);
