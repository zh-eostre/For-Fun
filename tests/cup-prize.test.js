// cup prize money is paid once the final has been played: nothing on the way, everything we earned at the end
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===0),teamNames());UI.guide=null;
const C=S.cup;let g=0;while(!inCup()&&C.stage<cupFmt().names.length&&g++<5)playCupStage(null);
const tie=()=>C.ties.find(x=>x.includes(S.my)),win=t=>({h:t[0],a:t[1],hg:t[0]===S.my?2:0,ag:t[0]===S.my?0:2});
const b0=S.budget;while(cupFmt().prize[C.stage]===0&&tie())playCupStage(win(tie()));  // through to a round worth something
ok(S.budget===b0,'winning ties pays nothing yet');
const t=tie(),k=C.stage;
const res={h:t[0],a:t[1],hg:t[0]===S.my?0:2,ag:t[0]===S.my?2:0};playCupStage(res);
const P=cupFmt().prize[k];
ok(P>0&&S.budget===b0&&C.owed===P,'knocked out in the '+stageName(k)+': nothing paid yet, '+money(P)+' owed');
ok(!P||S.news.some(n=>/在决赛后发放/.test(n.t)),'the news says when');
while(C.winner==null)playCupStage(null);
ok(S.budget===b0+P&&!C.owed&&(!P||S.news.some(n=>/落幕，本队奖金/.test(n.t))),'after the final: paid in full ('+money(P)+')');
// the 冠军杯: group results and progress add up, paid after its final
const I=S.intl,b1=S.budget;let mineIn=intlIn();
while(I.stage<intlStages()&&!intlMine())playIntl(null);
if(intlMine()){const m=intlMatches().find(x=>x.includes(S.my));playIntl({h:m[0],a:m[1],hg:m[0]===S.my?3:0,ag:m[0]===S.my?0:3});
  ok(S.budget===b1&&I.owed===INTL_PRIZE.win,'a 冠军杯 win: '+money(INTL_PRIZE.win)+' owed, not yet paid')}
const owed=I.owed||0;finishIntl();ok(S.budget>=b1+owed&&!I.owed,'all of it paid after the 冠军杯 final');
`);
