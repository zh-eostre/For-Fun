// A new manager can only take a 丙级 club; 乙级 and 甲级 clubs are shown but locked.
require('./harness').run(`
S=null;UI.draft=null;render();const h=els.app.innerHTML;
const starts=(h.match(/data-act="start" data-arg="(\\d+)"/g)||[]).map(x=>+x.match(/\\d+/)[0]);
ok(starts.length===DIV_SIZES[2]&&starts.every(i=>TEAMS[i].div===2),starts.length+' selectable clubs, all 丙级');
ok((h.match(/class="team-pick locked"/g)||[]).length===DIV_SIZES[0]+DIV_SIZES[1]&&/需要执教履历/.test(h),'乙级 and 甲级 clubs shown locked');
ok(h.indexOf('丙级联赛')<h.indexOf('乙级联赛')&&h.indexOf('乙级联赛')<h.indexOf('甲级联赛'),'丙级 listed first, then the higher divisions');
ACT.start('0');ok(S===null,'starting at a 甲级 club is refused');
ACT.start(String(TEAMS.findIndex(t=>t.div===1)));ok(S===null,'starting at a 乙级 club is refused');
ACT.start(String(starts[0]));ok(S&&my().div===2,'starting at a 丙级 club works: '+(S&&my().name));
`);
