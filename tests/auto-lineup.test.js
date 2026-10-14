// A lineup we never arranged by hand is re-picked after every match (a star back from injury returns to his place);
// one we arranged keeps our choices; the squad page says which.
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());S.rotate=false;ACT.form('4-2-3-1');  // rotation is tested below
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
// rotation: a worn starter makes way for a fitter man of his position who is nearly as good
{newGame(TEAMS.findIndex(t=>t.div===2),teamNames());S.autoXI=true;const roles=slotRoles(S.formation);
  my().players.forEach(p=>{p.cond=100;p.inj=0});fixLineup();
  const i=roles.indexOf('MF'),star=findP(S.lineup[i]),others=my().players.filter(p=>p.pos==='MF'&&!S.lineup.includes(p.id));
  others.forEach(p=>p.ovr=Math.min(p.ovr,star.ovr-3));const sub=others.sort((a,b)=>b.ovr-a.ovr)[0];sub.ovr=star.ovr-3;
  S.lineup.forEach((id,j)=>{if(roles[j]==='MF'&&j!==i)findP(id).ovr=star.ovr+5});  // the other midfielders stay ahead of the sub
  S.training='hard';star.cond=50;star.cond=ROTATE_AT-5-(kickoffCond(star)-50);fixLineup();  // under ROTATE_AT at kickoff
  ok(!S.lineup.includes(star.id)&&S.lineup.some(id=>findP(id).pos==='MF'&&findP(id).ovr===star.ovr-3),'a starter on '+star.cond+' stamina is rested for a midfielder 3 points worse');
  {const g=rotateGap(kickoffCond(star));sub.ovr=star.ovr-g-1;fixLineup();ok(S.lineup.includes(star.id),'not for one '+(g+1)+' points worse (he may give up '+g+' on '+kickoffCond(star)+' stamina)');
  const k0=star.cond;star.cond=k0-12;const g2=rotateGap(kickoffCond(star));sub.ovr=star.ovr-g2;fixLineup();ok(g2>g&&!S.lineup.includes(star.id),'more worn, a weaker man will do: '+g2+' points on '+kickoffCond(star));star.cond=k0}
  sub.ovr=star.ovr-3;S.rotate=false;fixLineup();ok(S.lineup.includes(star.id),'and not with rotation switched off');
  S.rotate=true;star.cond=ROTATE_AT+5;fixLineup();  // (already above it before the days' recovery)ok(S.lineup.includes(star.id),'above '+ROTATE_AT+' he plays');
  UI.tab='squad';render();ok(/data-act="rotate"/.test(els.app.innerHTML)&&/自动轮换：开/.test(els.app.innerHTML),'the squad page has the switch');
  star.cond=100;fixLineup();ok(S.lineup.includes(star.id),'fresh again: back in');
  star.cond=40;ACT.nextDay();ok(kickoffCond(star)<ROTATE_AT===!S.lineup.includes(star.id),'the auto XI is brought up to date as the days go by');}
`);
