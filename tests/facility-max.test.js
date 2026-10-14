// a facility or the academy reaching its top level: a line in the news and a celebration (confetti and a fanfare)
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===1),teamNames());UI.guide=null;
els.fx={className:'',innerHTML:'',offsetWidth:0,classList:{}};
S.budget=5000;S.fac.scout=3;upgradeFac('scout');
ok(S.fac.scout===4&&!/千里眼/.test(S.news[0].t)&&els.fx.className==='','level 4: an ordinary upgrade');
upgradeFac('scout');
ok(S.fac.scout===5&&/🏗 千里眼开启！球探部升至满级/.test(S.news[0].t),'level 5: the news: '+S.news[0].t);
ok(/party build/.test(els.fx.className)&&/球探部满级！/.test(els.fx.innerHTML)&&/<i style/.test(els.fx.innerHTML),'and a celebration with confetti');
els.fx.className='';upgradeFac('scout');ok(S.fac.scout===5&&els.fx.className==='','already at the top: nothing more');
S.academy.lv=ACADEMY_COST.length-1;upgradeAcademy();
ok(S.academy.lv===ACADEMY_COST.length&&/传奇的摇篮！青训营升至满级/.test(S.news[0].t)&&/青训营满级！/.test(els.fx.innerHTML),'the academy too');
`);
