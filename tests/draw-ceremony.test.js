// The draw ceremony: a draw with us in it is queued (S.drawQ) and shown at the top of the club page, the balls in
// the order they came out; it runs on the clock, 跳过动画 shows the outcome, 完成 moves on to the next one.
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===0),teamNames());UI.guide=null;
ok(!(S.drawQ||[]).length,'no ceremony for the draws made before a new game starts');
S.round=rounds();newSeason();UI.tab='home';
ok(intlIn()&&S.drawQ.some(e=>e.kind==='intl'),'a new season with us in the 冠军杯: its group draw is queued');
ok(S.news.some(n=>/冠军杯抽签！我们落入 [A-H] 组/.test(n.t)),'and the news says which group');
render();let h=els.app.innerHTML;
ok(/class="panel dceremony[ "]/.test(h)&&/小组赛抽签/.test(h)&&!bad(h),'the club page opens with the ceremony');
ok((h.match(/class="dnow/g)||[]).length===32&&(h.match(/class="dout"/g)||[]).length===32&&(h.match(/class="din"/g)||[]).length===32,'32 balls: on the stage, in the pots and in the groups');
const at=[...h.matchAll(/class="dnow[^"]*" style="--at:([0-9.]+)s/g)].map(m=>+m[1]);
ok(at.every((t,i)=>!i||t>at[i-1])&&at[8]-at[7]>at[1]-at[0],'they come out one after another, with a pause between the pots');
ok(/class="dgroup mine"/.test(h)&&/就是我们/.test(h),'our group and our ball are marked');
UI.drawAt.t0-=3000;render();const t=+(els.app.innerHTML.match(/--t:([0-9.]+)s/)||[])[1];ok(t>=3&&t<4,'a re-render carries on where it was ('+t+'s in)');
ACT.drawSkip();ok(/class="panel dceremony done"/.test(els.app.innerHTML),'跳过动画: the outcome at once');
const before=S.drawQ.length;ACT.drawDone();ok(S.drawQ.length===before-1&&UI.drawAt==null,'完成: on to the next');
// a 天穹杯 round with us in it, drawn after the one before is played
{newGame(TEAMS.findIndex(t=>t.div===2),teamNames());UI.guide=null;S.drawQ=[];const C=S.cup;let g=0;
  while(cupAlive()&&C.stage<cupFmt().names.length-1&&!S.drawQ.length&&g++<9)playCupStage(null);
  if(S.drawQ.length){const e=S.drawQ[0];
    ok(e.kind==='cup'&&e.stage===C.stage&&C.draw.picks.includes(S.my),'天穹杯: the next round with us in it is queued');
    UI.tab='home';render();h=els.app.innerHTML;
    ok(new RegExp(stageName(C.stage)+'抽签').test(h)&&(h.match(/class="dtie/g)||[]).length===C.ties.length&&!bad(h),'the ceremony shows the round’s ties');
    ok(/命运的签球已经落定/.test(h),'and how it came out for us');
    playCupStage(null);render();const e2=drawNow();
    ok(!S.drawQ.includes(e)&&(!e2||e2.stage===C.stage&&e2.stage>e.stage),'once that round is played, its ceremony is gone (the next one is shown if we went through)');
  }else ok(true,'(knocked out before a draw: nothing to show)')}
// a draw we're not in has no ceremony
{newGame(TEAMS.findIndex(t=>t.div===2),teamNames());S.drawQ=[];S.intl=newIntl(domestic().filter(t=>t.div===0).slice(0,4).map(t=>t.id));
  queueDraw('intl');ok(!S.drawQ.length,'a 冠军杯 without us: no ceremony')}
`);
