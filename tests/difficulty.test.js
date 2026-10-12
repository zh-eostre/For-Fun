// Difficulty, chosen on the start screen: starting budget, match income, the AI clubs' level, our injury risk.
require('./harness').run(`
const low=TEAMS.findIndex(t=>t.div===2),avgAI=()=>{const T=S.teams.filter(t=>t.id!==S.my&&!t.foreign);return T.reduce((s,t)=>s+t.players.reduce((a,p)=>a+p.ovr,0)/t.players.length,0)/T.length};
render();ok(/data-act="diff"/.test(els.app.innerHTML)&&/轻松/.test(els.app.innerHTML)&&/困难/.test(els.app.innerHTML),'the start screen offers 轻松 / 普通 / 困难');
ACT.diff('easy');ok(UI.diff==='easy'&&els.app.innerHTML.includes(money(Math.round(startBudget(TEAMS[low])*1.5))),'picking 轻松 shows the bigger budgets');
const res={};
for(const d of ['easy','normal','hard']){
  let ai=0,b=0;for(let k=0;k<3;k++){newGame(low,teamNames(),d);ai+=avgAI();b=S.budget}
  res[d]={ai:ai/3,b};
}
console.log('  AI squads (average ability): easy '+res.easy.ai.toFixed(1)+', normal '+res.normal.ai.toFixed(1)+', hard '+res.hard.ai.toFixed(1));
ok(res.easy.ai<res.normal.ai-1&&res.hard.ai>res.normal.ai+1,'AI squads are weaker on 轻松 and stronger on 困难');
ok(res.easy.b===Math.round(startBudget(TEAMS[low])*1.5)&&res.hard.b===Math.round(startBudget(TEAMS[low])*.75)&&res.normal.b===startBudget(TEAMS[low]),'starting budget ×1.5 / ×1 / ×0.75');
newGame(low,teamNames(),'hard');ok(S.diff==='hard'&&diff().inj>1&&diff().income<1,'the save keeps its difficulty');
ACT.rules();ok(/本档难度：<b>困难/.test(els.app.innerHTML),'the rules say which');UI.modal=null;
const old=JSON.parse(JSON.stringify(S));delete old.diff;S=old;ok(diff()===DIFF.normal,'a save from before difficulty plays as 普通');
// income: the same match pays more on 轻松
newGame(low,teamNames(),'easy');S.friendlies.forEach(f=>f.res={hg:0,ag:0});ffToMatch();S.event=null;S.offer=null;startMatch();skipMatch();
const inc=M.summary.income,w=M.summary.w,home=M.h===S.my;
const base=(4+(home?18*stadiumMult():0)+(w==='胜'?10:w==='平'?4:0))*DIV_INCOME[my().div]*(M.derby?2:1);
ok(inc===Math.round(base*1.25),'match income ×1.25 on 轻松 ('+inc+' vs '+Math.round(base)+' on 普通)');
`);
