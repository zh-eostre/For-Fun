// The season-end page: summary card, our standouts, awards and team of the season for any division (ours first),
// the full league data for any division; and each division's leaderboard switch on its own.
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());
while(!seasonDone()){if(S.event)ACT.event('0');if(S.offer)ACT.offerNo();ACT.ff();S.event=null;S.offer=null;startMatch();skipMatch();ACT.matchDone()}
render();const h=els.app.innerHTML;
ok(/class="panel se-hero/.test(h)&&/胜-平-负/.test(h)&&(h.match(/data-act="newSeason"/g)||[]).length===2,'summary card with the record, and the next-season button top and bottom');
ok(/本队之星/.test(h)&&/个人奖项与最佳阵容/.test(h)&&/丙级年度最佳阵容/.test(h)&&(h.match(/class="tok xi-tok/g)||[]).length===11,'our standouts, our division\\'s awards and the team of the season on a pitch');
ACT.seDiv('0');ok(/甲级年度最佳阵容/.test(els.app.innerHTML),'the awards switch shows another division');
ok(/联赛数据/.test(h)&&/射手榜/.test(h)&&/data-act="div"/.test(h)&&!bad(h),'the league data (tables and leaderboards) for every division is there');
ACT.div('1');ok(/乙级积分榜/.test(els.app.innerHTML),'switching shows 乙级');
// each division keeps its own board on the table page
ACT.newSeason();for(let i=0;i<4;i++){ACT.ff();S.event=null;S.offer=null;startMatch();skipMatch();ACT.matchDone()}
UI.tab='table';UI.div=0;render();ACT.lb('0:ast');
ok(/助攻榜/.test(els.app.innerHTML),'甲级 shows assists');
UI.div=1;render();ok(/射手榜/.test(els.app.innerHTML)&&!/助攻榜/.test(els.app.innerHTML),'乙级 still shows scorers');
`);
