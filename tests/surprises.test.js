// Surprise events: rare, automatic good news on calendar days.
require('./harness').run(`
newGame(2,teamNames());S.event=null;S.offer=null;
const fp=()=>firstTeam();
// each surprise does what it says
let b=S.budget,t=SURPRISES[0].run();ok(S.budget>b&&/追加投资/.test(t),'sponsor: '+t);
const before=new Map(fp().map(p=>[p.id,p.ovr]));t=SURPRISES[1].run();
ok(fp().some(p=>p.ovr-before.get(p.id)>=2),'epiphany: '+t);
fp().forEach(p=>p.cond=50);t=SURPRISES[2].run();ok(fp().every(p=>p.cond===100),'yoga master: '+t);
ok(!SURPRISES[3].ok(),'old healer only appears when someone is injured');
fp()[4].inj=12;t=SURPRISES[3].run();ok(fp()[4].inj===0,'old healer: '+t);
b=S.budget;t=SURPRISES[4].run();ok(S.budget>b,'fans: '+t);
S.boost=0;t=SURPRISES[5].run();ok(S.boost===1,'legend visit: '+t);
t=SURPRISES[6].run();ok(S.market.some(p=>p.pot>=88&&p.scout.conf==='low'),'scout letter: '+t);
const n=S.academy.intake.length;t=SURPRISES[7].run();ok(S.academy.intake.length===n+1&&S.academy.intake[n].pot>=85,'gifted kid: '+t);
// how often over a full season of calendar days
newGame(2,teamNames());let count=0,days=0;
while(S.round<rounds()){const log={days:0,cond:0,trained:[],healed:[]};while(advanceDay(log));days+=log.days;count+=(log.surprises||[]).length;
  S.event=null;S.offer=null;S.lineup=autoPick(my(),S.formation);startMatch();skipMatch();M=null;UI.view='main'}
console.log('  surprises this season: '+count+' over '+days+' days');
ok(count<=12,'they stay rare (≤12 a season)');
// the day log shows one
newSeason();UI.dayLog={days:1,cond:0,trained:[],healed:[],surprises:['一位瑜伽大师路过训练场']};UI.tab='home';render();
ok(/class="surprise"/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'day log highlights the surprise');
`);
