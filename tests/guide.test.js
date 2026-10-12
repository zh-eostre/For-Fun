// The new-player guide: shown after the first new game on a device, a step per page, skippable, replayable from
// the rules; not shown again once finished or skipped.
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());
ok(UI.guide===0&&/class="guide"/.test(els.app.innerHTML)&&els.app.innerHTML.includes(GUIDE[0][1]),'first new game: the guide opens at step 1');
const tabs=[];for(let k=1;k<GUIDE.length;k++){ACT.guide('next');tabs.push(UI.tab);ok(els.app.innerHTML.includes(GUIDE[k][1])&&!bad(els.app.innerHTML),'step '+(k+1)+': '+GUIDE[k][1]+' ('+UI.tab+')')}
ok(tabs.join()===GUIDE.slice(1).map(g=>g[0]).join(),'each step shows its page');
ACT.guide('back');ok(UI.guide===GUIDE.length-2,'上一步 goes back');
ACT.guide('next');ok(/开始执教/.test(els.app.innerHTML),'the last step ends with 开始执教');
ACT.guide('next');ok(UI.guide==null&&!/class="guide"/.test(els.app.innerHTML)&&store[GUIDE_KEY]==='1','finished: gone, and remembered');
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());ok(UI.guide==null,'a second new game does not show it again');
ACT.rules();ok(/重看新手引导/.test(els.app.innerHTML),'the rules offer to show it again');ACT.guide('again');ok(UI.guide===0&&!UI.modal&&/class="guide"/.test(els.app.innerHTML),'and it starts over');
ACT.guide('skip');ok(UI.guide==null,'跳过 closes it');
`);
