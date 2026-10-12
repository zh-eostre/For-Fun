// Opponent lineup dialog before a match, and the redesigned scorers / ratings leaderboards.
require('./harness').run(`
newGame(4,teamNames());
for(let i=0;i<6;i++){ffToMatch();S.event=null;S.offer=null;startMatch();skipMatch();M=null;UI.view='main'}
S.event=null;S.offer=null;UI.tab='home';render();
ok(/data-act="oppXI"/.test(els.app.innerHTML),'next-match panel has 查看对手阵容');
const opp=S.teams[nextFix().opp];ACT.oppXI();let h=els.app.innerHTML;
ok(/预计阵容/.test(h)&&h.includes(opp.name)&&(h.match(/class="tok /g)||[]).length>=11&&!bad(h),'dialog shows the opponent XI on a pitch');
ok(h.includes('--team:'+opp.color),'drawn in the opponent colours');
S.fac.scout=1;render();ok(/预计战术：/.test(els.app.innerHTML)&&!/class="oppr"/.test(els.app.innerHTML),'tactic prediction at any scout level; no weak-line report below level 3');
S.fac.scout=3;UI.modal=null;UI.tab='home';render();ok(/class="target/.test(els.app.innerHTML)&&/王牌/.test(els.app.innerHTML)&&/对手预计打法/.test(els.app.innerHTML),'scout level 3 adds the weak line (with advice) and key player');
closeModal();ok(!UI.modal,'dialog closes (focus return is checked in a real browser)');
UI.tab='table';render();h=els.app.innerHTML;
ok(/class="panel lb"/.test(h)&&/lb-row m1/.test(h)&&/data-act="player"/.test(h)&&!bad(h),'leaderboards: medals and clickable names');
const rows=(h.match(/class="lb-row/g)||[]).length;ok(rows>=8,'up to 8 per board ('+rows+' rows on the page)');
`);
