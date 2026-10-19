// facility upkeep each Monday, stadium expansions built over weeks, downgrades; players weighing whether to join us;
// the news filter
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());UI.guide=null;
ok(upkeep()===0,'everything at level 1: no upkeep');
S.fac.scout=3;S.fac.physio=2;S.academy.lv=2;ok(upkeep()===UPKEEP[3]+UPKEEP[2]+UPKEEP[2],'upkeep by level: '+money(upkeep())+' a week');
// a Monday comes round in the days' advance
S.friendlies.forEach(f=>f.res={hg:0,ag:0});S.day=6;const b0=S.budget,u=upkeep();const went=advanceDay(dayLog());
ok(went&&S.day===7&&S.budget===b0-u,'Monday: the upkeep is paid ('+money(u)+')');
// running out of money
S.budget=1;weekly();ok(S.budget<0&&S.news.some(n=>/资金告急/.test(n.t)),'going into the red brings a warning');
// downgrading saves upkeep
const u0=upkeep();downgradeFac('scout');ok(S.fac.scout===2&&upkeep()===u0-(UPKEEP[3]-UPKEEP[2]),'a level down saves its upkeep');
// the stadium: past level 5 an expansion, built over weeks
S.fac.stadium=5;S.budget=99999;upgradeFac('stadium');
ok(S.build&&S.build.lv===6&&facLv('stadium')===5&&S.news[0].t.includes('扩建动工'),'level 6 is an expansion: work starts, the stadium stays at 5 for now');
upgradeFac('stadium');ok(S.build.lv===6,'no second expansion while one is being built');
UI.tab='fac';render();ok(/扩建到 6 级中/.test(els.app.innerHTML)&&/每周维护费合计/.test(els.app.innerHTML),'the facilities page shows the work and the upkeep');
S.day=S.build.done;weekly();ok(facLv('stadium')===6&&!S.build&&/扩建竣工/.test(S.news.map(n=>n.t).join()),'the expansion is finished on its week');
// joining us: a 丙级 club is no draw for a star; a fair player wants a premium; a 甲级 giant gets anyone
my().rep=15;S.mgr.rep=15;const star=makePlayer('FW',86,26),mid=makePlayer('FW',71,26),low=makePlayer('FW',60,26);star.ovr=88;mid.ovr=72;low.ovr=58;  // a small 丙级 club
ok(!willing(star,null).ok&&/看不上/.test(willing(star,null).why),'a star won\\u2019t come to a 丙级 club: '+willing(star,null).why);
ok(willing(mid,null).ok&&willing(mid,null).extra>0,'a good player comes for '+Math.round(willing(mid,null).extra*100)+'% more');
ok(willing(low,null).ok&&willing(low,null).extra===0,'an ordinary one comes for his price');
S.day=0;star.price=500;S.market.push(star);S.budget=99999;UI.tab='market';render();ok(/不愿加盟/.test(els.app.innerHTML),'the market says who won\\u2019t come');
const before=my().players.length;ACT.buy(String(star.id));ok(my().players.length===before,'and he can\\u2019t be signed');
mid.price=200;S.market.push(mid);const ex=willing(mid,null).extra;ACT.buy(String(mid.id));ok(my().players.includes(mid)&&S.budget===99999-Math.round(200*(1+ex)),'a good one signs, with the premium');
// a man at a bigger club won't step down
const big=S.teams.filter(t=>t.div===0).sort((a,b)=>b.rep-a.rep)[0],p=big.players.find(x=>!loyal(x,big)&&x.pos!=='GK');
ok(/看不上/.test(buyBlock(p,big)||''),'a player at '+big.short+' won\\u2019t step down to us: '+buyBlock(p,big));
// a giant gets him
newGame(TEAMS.map((t,i)=>[t,i]).filter(([t])=>t.div===0).sort((a,b)=>b[0].rep-a[0].rep)[0][1],teamNames());UI.guide=null;
ok(willing(makePlayer('FW',88,26),null).ok,'a 甲级 giant can sign a star');
// the news filter
news('以 300 万 签下 某某（前锋，能力 70）。');news('胜 2:0 对阵某队。比赛收入 20 万。');news('某某 受伤，预计伤停 5 天。');
UI.tab='home';UI.nf='move';render();ok(/签下 某某/.test(els.app.innerHTML)&&!/胜 2:0 对阵某队/.test(els.app.innerHTML),'the news filter: transfers only');
UI.nf='player';render();ok(/受伤/.test(els.app.innerHTML)&&!/签下 某某/.test(els.app.innerHTML),'players only');UI.nf='';
`);
