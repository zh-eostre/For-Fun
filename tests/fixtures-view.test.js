// The calendar: four weeks ahead with window marks, and the whole season's fixtures with results and the next match.
require('./harness').run(`
newGame(6,teamNames());
for(let i=0;i<5;i++){if(S.event)ACT.event('0');if(S.offer)ACT.offerNo();ACT.ff();S.event=null;S.offer=null;startMatch();skipMatch();ACT.matchDone()}
render();const h=els.app.innerHTML;
const cells=(h.match(/class="day /g)||[]).length;ok(cells>=20,'calendar strip covers about four weeks ('+cells+' days)');
ok(/全赛季赛程/.test(h)&&new RegExp('还剩 '+(rounds()-S.round)+' 轮联赛').test(h)&&/赛季在第 \\d+ 周周六结束/.test(h),'summary: rounds left and when the season ends');
const rows=(h.match(/class="fx-row/g)||[]).length;ok(rows>=rounds()+2,'every league round is listed, plus friendlies and markers ('+rows+' rows)');
ok((h.match(/class="wdl /g)||[]).length>=5&&(h.match(/下一场/g)||[]).length>=1,'played matches show results; the next one is marked');
ok(/冬季转会窗开启/.test(h)&&/赛季结束/.test(h)&&!bad(h),'winter window and season end are on the list');
`);
