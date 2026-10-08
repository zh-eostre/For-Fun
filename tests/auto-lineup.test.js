// A lineup we never arranged by hand is re-picked after every match (a star back from injury returns to his place);
// one we arranged keeps our choices; the squad page says which.
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());ACT.form('4-2-3-1');
const fwSlot=slotRoles(S.formation).indexOf('FW'),star=findP(S.lineup[fwSlot]);
ok(S.autoXI===true&&star.pos==='FW','auto mode, best forward up front: '+star.name);
// he gets injured: someone else plays up front; he comes back: he is up front again
star.inj=3;fixLineup();ok(!S.lineup.includes(star.id),'injured: out of the XI');
star.inj=0;fixLineup();ok(S.lineup[fwSlot]===star.id,'fit again: back in his place');
// a post-match pick doesn't bench tired starters for a match days away
my().players.forEach(p=>p.cond=100);star.cond=60;fixLineup();ok(S.lineup[fwSlot]===star.id,'a tired star keeps his place after the match');
// out of position stays visible to the forwards' scoring: the forward slot holds a forward
let misplaced=0;for(let k=0;k<20;k++){const p=pick(my().players.filter(x=>S.lineup.includes(x.id)));p.inj=5;fixLineup();p.inj=0;fixLineup();if(findP(S.lineup[fwSlot]).pos!=='FW')misplaced++}
ok(!misplaced,'after 20 injuries and returns the forward slot still holds a forward');
// by hand: swap two slots -> manual, and our choice survives a re-fix
UI.tab='squad';render();ok(/首发：自动/.test(els.app.innerHTML),'squad page says 首发：自动');
ACT.slot(String(fwSlot));ACT.slot('1');ok(S.autoXI===false&&S.lineup[1]===star.id,'a swap by hand switches to manual');
fixLineup();ok(S.lineup[1]===star.id,'manual: our arrangement is kept');
render();ok(/首发：手动/.test(els.app.innerHTML),'squad page says 首发：手动');
star.cond=100;ACT.auto();ok(S.autoXI===true&&S.lineup[fwSlot]===star.id,'自动选人 goes back to auto (that pick does weigh stamina on the day)');
`);
