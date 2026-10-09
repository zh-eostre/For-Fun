// Going at the opponent's weakest line: what counts, the bonus in a match (scout department 3+), and the advice.
require('./harness').run(`
ok(targets('DF','4-3-3','bal')&&targets('DF','4-4-2','att')&&!targets('DF','4-4-2','bal'),'weak defence: three forwards or all out');
ok(targets('FW','3-5-2','bal')&&targets('FW','4-4-2','att')&&!targets('FW','4-4-2','def'),'weak attack: all out or a back three');
ok(targets('MF','4-5-1','bal')&&targets('MF','4-2-3-1','bal')&&!targets('MF','4-4-2','att'),'weak midfield: five in midfield');
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());
S.fac.scout=1;ACT.ff();S.event=null;S.offer=null;startMatch();clearTimeout(M.timer);ok(M.weak===null,'without a scout report there is no target');
M=null;UI.view='main';S.live=null;
S.fac.scout=3;startMatch();clearTimeout(M.timer);ok(['DF','MF','FW'].includes(M.weak),'with the report the weak line is known: '+M.weak);
const plan={DF:['4-3-3','bal'],FW:['4-4-2','att'],MF:['4-5-1','bal']}[M.weak];M[mySide()+'Form']=plan[0];M.tac=plan[1];
const b1=myBoost().atk;M.tac=M.weak==='MF'?'bal':'def';M[mySide()+'Form']=M.weak==='MF'?'4-4-2':'5-4-1';const b0=myBoost().atk;
ok(b1-b0>=TARGET_BONUS-.01,'going at it adds '+TARGET_BONUS+' attack ('+b0+' → '+b1+')');
M.tac=plan[1];M[mySide()+'Form']=plan[0];render();ok(/针对弱点/.test(els.app.innerHTML),'the scoreboard shows 针对弱点');
skipMatch();ACT.matchDone();UI.tab='home';
// the scout report spells out more with each level
S.fac.scout=3;render();let h=els.app.innerHTML;ok(/class="target/.test(h)&&!/进攻 \+/.test(h.slice(h.indexOf('class="target'),h.indexOf('class="target')+300))&&!/你目前的安排/.test(h),'level 3: only the weak line');
S.fac.scout=4;render();h=els.app.innerHTML;ok(/class="target/.test(h)&&h.includes('进攻 +'+TARGET_BONUS)&&!/你目前的安排/.test(h),'level 4: plus how to go at it');
S.fac.scout=5;render();h=els.app.innerHTML;ok(/你目前的安排(已|未)针对/.test(h),'level 5: plus whether we already do');
`);
