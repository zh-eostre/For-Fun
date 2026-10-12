// Match pace: three settings, remembered; each new line of commentary adds reading time.
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());ffToMatch();S.event=null;S.offer=null;startMatch();clearTimeout(M.timer);render();
ok((els.app.innerHTML.match(/data-act="pace"/g)||[]).length===3&&/aria-pressed="true">正常/.test(els.app.innerHTML),'three paces, 正常 by default');
ACT.pace('slow');ok(S.pace==='slow'&&JSON.parse(store[KEY]).pace==='slow','the choice is kept, even mid-match');
ok(PACE.slow[2]>PACE.normal[2]&&PACE.normal[2]>PACE.fast[2]&&PACE.fast[2]===0,'reading time per line: 慢 > 正常 > 快 (none)');
skipMatch();ok(M.done,'match finishes');
`);
