// A new manager can only take a 乙级 club; 甲级 clubs are shown but locked.
require('./harness').run(`
S=null;UI.draft=null;render();const h=els.app.innerHTML;
const starts=(h.match(/data-act="start" data-arg="(\\d+)"/g)||[]).map(x=>+x.match(/\\d+/)[0]);
ok(starts.length===10&&starts.every(i=>TEAMS[i].div===1),'10 selectable clubs, all 乙级');
ok((h.match(/class="team-pick locked"/g)||[]).length===10&&/需要执教履历/.test(h),'10 甲级 clubs shown locked');
ok(h.indexOf('乙级联赛')<h.indexOf('甲级联赛'),'乙级 listed first');
ACT.start('0');ok(S===null,'starting at a 甲级 club is refused');
ACT.start(String(starts[0]));ok(S&&my().div===1,'starting at a 乙级 club works: '+(S&&my().name));
`);
