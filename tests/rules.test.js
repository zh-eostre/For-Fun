// The rules dialog: opens from the header, uses the game's own numbers, closes again.
require('./harness').run(`
newGame(12,teamNames());render();
ok(/data-act="rules"/.test(els.app.innerHTML),'header has a 规则 button');
ACT.rules();const h=els.app.innerHTML;
ok(/规则说明/.test(h)&&!bad(h),'rules dialog renders');
ok(h.includes(rounds()+' 轮')&&h.includes('最多换 '+SUBS+' 人')&&h.includes('低于 '+TIRED)&&h.includes(YC_BAN+' 张黄牌')&&h.includes(WINTER+' 天冬窗'),'it quotes the current settings');
ok(['赛季与日程','比赛怎么踢','战术与阵型','体能与换人','伤病与红黄牌','评分与奖项','成长与老化','转会与俱乐部','只属于你的加成'].every(t=>h.includes(t)),'all nine sections are there');
ACT.closeModal();ok(!UI.modal&&!/id="mtitle">规则说明/.test(els.app.innerHTML),'closes');
`);
