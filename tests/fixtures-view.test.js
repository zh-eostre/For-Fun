// The calendar: four weeks ahead with window marks, and the whole season's fixtures with results and the next match.
require('./harness').run(`
newGame(6,teamNames());
for(let i=0;i<5;i++){if(S.event)ACT.event('0');if(S.offer)ACT.offerNo();ffToMatch();S.event=null;S.offer=null;startMatch();skipMatch();ACT.matchDone()}
render();const h=els.app.innerHTML;
const cells=(h.match(/class="day /g)||[]).length;ok(cells>=20,'calendar strip covers about four weeks ('+cells+' days)');
ok(/全赛季赛程/.test(h)&&new RegExp('还剩 '+(rounds()-S.round)+' 轮').test(h)&&/第 [0-9]+ 周周六结束/.test(h),'summary: rounds left and when the season ends');
const rows=(h.match(/class="fx-row/g)||[]).length;ok(rows>=rounds()+2,'every league round is listed, plus friendlies and markers ('+rows+' rows)');
ok((h.match(/class="wdl /g)||[]).length>=5&&(h.match(/下一场/g)||[]).length>=1,'played matches show results; the next one is marked');
ok(/冬季转会窗开启/.test(h)&&/赛季结束/.test(h)&&!bad(h),'winter window and season end are on the list');
// right after a match: today's cell says it's over, and the day can still be moved on
ffToMatch();S.event=null;S.offer=null;S.lineup=autoPick(my(),S.formation);startMatch();skipMatch();ACT.matchDone();UI.tab='home';render();
const h2=els.app.innerHTML;ok(/比赛已结束/.test(h2)&&/已结束/.test(h2)&&/data-act="nextDay"/.test(h2),'after a match: marked as played, next-day button there');
`);
