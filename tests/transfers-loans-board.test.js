// Buying from other clubs, loans, board objectives, stadium, team and player pages.
require('./harness').run(`

const btn=()=>({dataset:{},textContent:'',isConnected:true});const twice=(k,a)=>{const b=btn();ACT[k](a,b);ACT[k](a,b)};
newGame(2,teamNames());S.budget=3000;
// board objectives
ok(S.goal&&S.goal.rank===expectedRank()&&stageName(S.goal.cup)==='八强','board goal: top '+S.goal.rank+' + cup '+stageName(S.goal.cup));
UI.tab='home';render();ok(/董事会目标/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'home shows board objectives');
// team page and buying
const other=S.teams.find(t=>t.id!==S.my&&t.div===0&&t.id!==S.rival);ACT.team(String(other.id));
ok(/常用阵型/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'team page for '+other.name);
const star=[...other.players].filter(p=>p.pos!=='GK').sort((a,b)=>b.ovr-a.ovr)[0],bench=[...other.players].filter(p=>!bestForm(other,true).ids.includes(p.id)).sort((a,b)=>a.ovr-b.ovr)[0];
ok(askPrice(star,other)>value(star)*1.7&&askPrice(bench,other)<value(bench)*1.1,'star asks '+askPrice(star,other)+' (value '+value(star)+'), bench man '+askPrice(bench,other)+' (value '+value(bench)+')');
const rv=S.teams[S.rival],rs=[...rv.players].sort((a,b)=>b.ovr-a.ovr)[0];ok(Math.abs(askPrice(rs,rv)-Math.round(value(rs)*1.8*1.3))<=1,'rival charges 30% more');
const n0=my().players.length,b0=S.budget,price=askPrice(star,other);ACT.player(String(star.id));ok(/以 .* 签下/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'AI player page shows the buy button');
twice('bid',String(star.id));ok(my().players.includes(star)&&!other.players.includes(star)&&S.budget===b0-price&&my().players.length===n0+1,'bought '+star.name+' for '+price+' ['+POS[star.pos]+', block: '+buyBlock(star,other)+', toast: '+els.toast.textContent+']');
ok(UI.pages.length===1&&UI.pages[0].type==='team','after buying, back on the team page');
while(other.players.length>15)other.players.pop();const t15=other.players[0];ok(buyBlock(t15,other)!=='','club with 15 players refuses: '+buyBlock(t15,other));
ACT.back();ok(!UI.pages.length,'back returns to the tabs');
// loans
const kid=my().players.filter(p=>p.age<=LOAN_AGE&&!unavail(p)).sort((a,b)=>a.ovr-b.ovr)[0]||(()=>{const k=S.academy.intake[0];ACT.ysign(String(k.id));return findP(k.id)})();
ACT.player(String(kid.id));ok(/data-act="loan"/.test(els.app.innerHTML),'young player page offers a loan');UI.modal=null;
const vet=my().players.find(x=>x.age>LOAN_AGE);ACT.player(String(vet.id));ok(/disabled title="只有 [0-9]+ 岁及以下/.test(els.app.innerHTML)&&!/data-act="loan"/.test(els.app.innerHTML),'an older player: the loan button is greyed out, saying why');UI.modal=null;
ACT.player(String(kid.id));
twice('loan',String(kid.id));ok(kid.loan&&unavail(kid)&&!S.lineup.includes(kid.id)&&typeof kid.loan.club==="string","loaned to "+loanLabel(kid));
UI.pages=[];
let played=0;while(S.round<6){ffToMatch();S.event=null;S.offer=null;S.lineup=autoPick(my(),S.formation);if(!nextFix().cup&&!nextFix().intl&&!nextFix().friendly)played++;startMatch();if(!M){console.log("STUCK: "+els.toast.textContent+" | day "+S.day+" next "+nextMatchDay()+" round "+S.round+" | issues "+lineupIssues().join(";")+" | squad "+squadSize()+" | GKs: "+my().players.filter(p=>p.pos==="GK").map(p=>p.name+"(inj "+p.inj+" ban "+p.ban+" away "+p.away+" loan "+!!p.loan+")").join(",")+" | available "+my().players.filter(p=>!unavail(p)).length);throw "stuck"}skipMatch();M=null;UI.view="main"}
ok(kid.lapps===played&&careerApps(kid)>=played,"loan matches counted: "+kid.lapps+" (league rounds played: "+played+")");
UI.tab='squad';render();ok(/租借至/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'squad list shows the loan');
ACT.recall(String(kid.id));ok(!kid.loan&&!unavail(kid),'recall brings him back');
twice('loan',String(kid.id));
// stadium
UI.tab='fac';render();ok(/球场/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'facilities page has the stadium');
const bb=S.budget;twice('fup','stadium');ok(facLv('stadium')===2&&S.budget===bb-100&&stadiumMult()===1.25,'stadium level 2 costs 100, gate x1.25');
// finish the season: loans end, goals paid, player history
while(!seasonDone()){ffToMatch();S.event=null;S.offer=null;S.lineup=autoPick(my(),S.formation);startMatch();if(!M){console.log("STUCK: "+els.toast.textContent+" | day "+S.day+" next "+nextMatchDay()+" round "+S.round+" | issues "+lineupIssues().join(";")+" | squad "+squadSize()+" | GKs: "+my().players.filter(p=>p.pos==="GK").map(p=>p.name+"(inj "+p.inj+" ban "+p.ban+" away "+p.away+" loan "+!!p.loan+")").join(",")+" | available "+my().players.filter(p=>!unavail(p)).length);throw "stuck"}skipMatch();M=null;UI.view="main"}
render();ok(/class="se-goal (ok|no)"/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'season end shows the board result');
const st=goalStatus(),bud=S.budget;newSeason();
ok(!kid.loan&&kid.lapps===0,'loan ended at season end');
ok(S.news.some(n=>/董事会目标/.test(n.t))&&S.goal.rank===expectedRank(),'board paid out ('+JSON.stringify(st)+') and set new goals');
if(findAny(star.id)){ACT.player(String(star.id));ok(/能力变化/.test(els.app.innerHTML)&&(star.hist||[]).length===1&&!bad(els.app.innerHTML),'player page shows ability history')}else console.log('  (bought player retired at season end — skipped)');
// migration v9 -> v10
const old=JSON.parse(JSON.stringify(S));old.v=9;delete old.goal;store[KEY]=JSON.stringify(old);const up=load();ok(up.v===SAVE_V&&up.goal&&up.goal.rank>0,'v9 save gets board goals');
`);
