// the knockout bracket: from the last 16 to the champion, each tie beside the one it meets next, filled in as the rounds
// are played (winners carried forward, the rest 待定), our ties marked
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===0),teamNames());UI.guide=null;
const C=S.cup,start=cupFmt().names.indexOf('十六强');
UI.tab='cup';UI.cupv='dom';render();ok(!/淘汰赛对阵/.test(els.app.innerHTML),'before the last 16 is drawn: no bracket yet');
while(C.stage<start)playCupStage(null);render();
const h=els.app.innerHTML,cols=h.split('class="bcol').length-1;
ok(/淘汰赛对阵/.test(h)&&cols===cupFmt().names.length-start+1,'the last 16 drawn: a bracket of '+(cols-1)+' rounds and the champion');
ok((h.match(/class="btie/g)||[]).length===8+4+2+1&&/待定/.test(h),'8 ties to play, the rest 待定');
ok(/class="bcol now"><div class="bh"><b>十六强/.test(h),'the round to come is marked');
playCupStage(null);render();const R=C.rounds[start],qf=C.ties;
ok(qf.every((t,j)=>t[0]===R[2*j].w&&t[1]===R[2*j+1].w),'天穹杯: ties 1 and 2 meet, 3 and 4 …');
const h2=els.app.innerHTML;ok(qf.flat().every(id=>h2.includes('<span>'+S.teams[id].short+'</span>'))&&/class="bt [^"]*\\bw\\b/.test(h2),'the winners go through, the results are shown');
while(C.winner==null)playCupStage(null);render();ok(new RegExp('🏆<span>'+S.teams[C.winner].short).test(els.app.innerHTML),'the champion at the end');
// the 冠军杯: the winner of tie j meets the winner of tie j + 4, and the two are drawn side by side
const I=S.intl;while(I.stage<INTL_GROUP_ROUNDS)playIntl(null);playIntl(null);
const r16=I.ko[0],q=I.ties;ok(q.every((t,j)=>t[0]===r16[j].w&&t[1]===r16[j+4].w),'冠军杯: the winner of tie j meets that of tie j + 4');
UI.cupv='intl';render();const pair=(els.app.innerHTML.split('<div class="bpair">')[1]||'').split('</div></div></div>')[0];
ok([r16[0],r16[4]].every(r=>pair.includes('<span>'+S.teams[r.h].short+'</span>')),'the first pair is ties 1 and 5');
ok(!bad(els.app.innerHTML),'the page renders');
`);
