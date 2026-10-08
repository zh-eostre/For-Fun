// Things on our side: halftime team talk, 绝境爆发 when behind late, the manager's aura, comeback title,
// win-streak flame and the season-end celebration.
require('./harness').run(`
newGame(5,teamNames());
while(nextFix().friendly){ACT.ff();S.event=null;S.offer=null;startMatch();skipMatch();M=null;UI.view='main'}  // a league match: friendlies don't count
ACT.ff();S.event=null;S.offer=null;startMatch();clearTimeout(M.timer);
while(!M.ht)tick(false);render();
ok(/更衣室训话/.test(els.app.innerHTML)&&(els.app.innerHTML.match(/data-act="talk"/g)||[]).length===3,'halftime offers three team talks');
ACT.talk('inspire');ok(M.talk==='inspire'&&/鼓舞/.test(els.toast.textContent),'鼓舞 chosen');
ACT.talk('calm');ok(M.talk==='inspire','only one talk a match');
render();ok(/训话「鼓舞」/.test(els.app.innerHTML)&&!/data-act="talk"/.test(els.app.innerHTML),'the panel shows the choice instead of the options');
ACT.resume();clearTimeout(M.timer);tick(false);ok(myBoost().atk>=3,'second half: attack +3 from the talk');
// a roar works more often for a famous manager
const roar=rep=>{let ok=0;for(let k=0;k<400;k++){M.talk=null;M.ht=true;S.mgr.rep=rep;ACT.talk('roar');if(M.talkOK)ok++}M.ht=false;return ok/4};
const lo=roar(0),hi=roar(100);ok(lo>35&&lo<55&&hi>85,'怒吼 works '+lo+'% of the time for an unknown manager, '+hi+'% for a famous one');
// late boosts: behind from the 75th minute, and the aura
M.talk=null;S.mgr.rep=60;while(M.min<79)tick(true);
const home=M.h===S.my;if(home){M.hg=0;M.ag=2}else{M.hg=2;M.ag=0}M.despair=false;M.feed=M.feed.filter(e=>!/血液沸腾/.test(e.t));  // it may already have fired in the simulated minutes
const b=myBoost();ok(b.atk>=(home?DESPAIR.home:DESPAIR.away)+2,'behind at '+M.min+'\\': 绝境爆发 + aura 2 = attack +'+b.atk);
ok(M.feed.filter(e=>/血液沸腾/.test(e.t)).length===1,'绝境爆发 is announced once');myBoost();ok(M.feed.filter(e=>/血液沸腾/.test(e.t)).length===1,'and not again');
render();ok(/绝境爆发/.test(els.app.innerHTML)&&/名帅光环 \\+2/.test(els.app.innerHTML),'scoreboard shows the active boosts');
// come back and win
while(M.min<89)tick(true);if(home){M.hg=4;M.ag=2}else{M.hg=2;M.ag=4}M.trailed=true;  // two clear: a goal in the last minute can't undo the win
tick(true);
ok(M.done&&!M.friendly&&S.ach.comeback&&S.news.some(n=>n.t.startsWith('逆转')),'winning from behind unlocks 「逆转之王」');
// streak flame and season-end glory
M=null;UI.view='main';S.streak=4;render();ok(/🔥 4 连胜/.test(els.app.innerHTML),'header shows a win streak of 3+');
S.round=rounds();S.cup.winner=S.my;render();ok(/class="glory"/.test(els.app.innerHTML)&&new RegExp(CUP_NAME+'冠军').test(els.app.innerHTML),'season end celebrates a trophy');
`);
