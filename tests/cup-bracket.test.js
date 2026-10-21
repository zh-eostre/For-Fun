// the knockout bracket: from the last 16 to the champion, filled in as the rounds are played and drawn, our ties
// marked. the 天穹杯 draws every round afresh, so its bracket is joined up as far as the latest draw (the rest 待定);
// the 冠军杯's knockout is fixed from the groups
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===0),teamNames());UI.guide=null;
const C=S.cup,start=cupFmt().names.indexOf('十六强');
UI.tab='cup';UI.cupv='dom';render();ok(!/淘汰赛对阵/.test(els.app.innerHTML),'before the last 16 is drawn: no bracket yet');
while(C.stage<start)playCupStage(null);render();
const h=els.app.innerHTML,cols=h.split('class="bcol').length-1;
ok(/淘汰赛对阵/.test(h)&&cols===cupFmt().names.length-start+1,'the last 16 drawn: a bracket of '+(cols-1)+' rounds and the champion');
ok((h.match(/class="btie/g)||[]).length===8+4+2+1&&/待定/.test(h),'8 ties to play, the rest 待定');
ok(/class="bcol now loose"><div class="bh"><b>十六强/.test(h),'the round to come is marked, and not joined to the 八强 (not drawn yet)');
ok(/待抽签/.test(h),'the rounds to come say they are drawn later');
const drawn16=C.ties.map(t=>[...t]);playCupStage(null);render();const R=C.rounds[start],qf=C.ties;
ok(C.draw.stage===start+1&&C.draw.picks.length===8&&qf.every((t,j)=>t[0]===C.draw.picks[2*j]&&t[1]===C.draw.picks[2*j+1]),'天穹杯: the 八强 is drawn, the balls paired in the order they came out');
ok(qf.every((t,j)=>t[0]===R[2*j].w&&t[1]===R[2*j+1].w),'and the last 16 is reordered so the two ties feeding each 八强 tie sit together');
ok(R.every(r=>drawn16.some(t=>t[0]===r.h&&t[1]===r.a)),'the last-16 results are the ties that were drawn');
const h2=els.app.innerHTML;ok(qf.flat().every(id=>h2.includes('<span>'+S.teams[id].short+'</span>'))&&/class="bt [^"]*\\bw\\b/.test(h2),'the winners go through, the results are shown');
while(C.winner==null)playCupStage(null);render();ok(new RegExp('🏆<span>'+S.teams[C.winner].short).test(els.app.innerHTML),'the champion at the end');
ok(!/loose/.test(els.app.innerHTML)&&C.rounds.slice(start).every((rd,i,a)=>i===a.length-1||a[i+1].every((r,j)=>r.h===rd[2*j].w&&r.a===rd[2*j+1].w)),'played out: the whole bracket is joined up');
// the 冠军杯: the winner of tie j meets the winner of tie j + 4, and the two are drawn side by side
const I=S.intl;while(I.stage<INTL_GROUP_ROUNDS)playIntl(null);playIntl(null);
const r16=I.ko[0],q=I.ties;ok(q.every((t,j)=>t[0]===r16[j].w&&t[1]===r16[j+4].w),'冠军杯: the winner of tie j meets that of tie j + 4');
UI.cupv='intl';render();const pair=(els.app.innerHTML.split('<div class="bpair">')[1]||'').split('</div></div></div>')[0];
ok([r16[0],r16[4]].every(r=>pair.includes('<span>'+S.teams[r.h].short+'</span>')),'the first pair is ties 1 and 5');
ok(!bad(els.app.innerHTML),'the page renders');
// the draw is random: the 八强 isn't simply the winners of ties 1 and 2, 3 and 4 … of the last 16 as drawn
{let fixed=0;for(let g=0;g<12;g++){newGame(TEAMS.findIndex(t=>t.div===0),teamNames());const C=S.cup;while(C.stage<start)playCupStage(null);
  const t16=C.ties.map(t=>[...t]);playCupStage(null);const won=t=>S.cup.rounds[start].find(r=>r.h===t[0]&&r.a===t[1]).w;
  if(C.ties.every((t,j)=>t[0]===won(t16[2*j])&&t[1]===won(t16[2*j+1])))fixed++}
 ok(fixed<3,'over 12 cups the 八强 followed the last-16 order '+fixed+' times')}
`);
