// The season-end page: summary card, our standouts, awards and team of the season for our division, other
// divisions folded away; and each division's leaderboard switch on its own.
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());
while(S.round<rounds()){if(S.event)ACT.event('0');if(S.offer)ACT.offerNo();ACT.ff();S.event=null;S.offer=null;startMatch();skipMatch();ACT.matchDone()}
render();const h=els.app.innerHTML;
ok(/class="panel se-hero/.test(h)&&/胜-平-负/.test(h)&&(h.match(/data-act="newSeason"/g)||[]).length===2,'summary card with the record, and the next-season button top and bottom');
ok(/本队之星/.test(h)&&/丙级个人奖项/.test(h)&&/class="xi-pitch"/.test(h),'our standouts, our division\\'s awards and team of the season');
ok(/其他级别的奖项/.test(h)&&/甲级最终排名/.test(h)&&/data-fold="seTable0"/.test(h),'other divisions are folded away');
ok(!/射手榜/.test(h)&&!/上一轮赛果/.test(h)&&!bad(h),'no leaderboards or last-round results here');
// each division keeps its own board on the table page
ACT.newSeason();for(let i=0;i<4;i++){ACT.ff();S.event=null;S.offer=null;startMatch();skipMatch();ACT.matchDone()}
UI.tab='table';UI.div=0;render();ACT.lb('0:ast');
ok(/助攻榜/.test(els.app.innerHTML),'甲级 shows assists');
UI.div=1;render();ok(/射手榜/.test(els.app.innerHTML)&&!/助攻榜/.test(els.app.innerHTML),'乙级 still shows scorers');
`);
