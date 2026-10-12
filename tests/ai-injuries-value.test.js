// AI formation/tactic choice, screen reader announcements, injuries in days, transfer value by age, migration.
require('./harness').run(`

newGame(2,teamNames());
const forms={};S.teams.forEach(t=>{if(t.id!==S.my){const b=bestForm(t,true);forms[b.form]=(forms[b.form]||0)+1}});
console.log('  AI formations at kickoff:',JSON.stringify(forms));
const tacs={};for(let i=0;i<16;i++)for(let j=0;j<16;j++)if(i!==j&&i!==S.my&&j!==S.my){const a=bestForm(S.teams[i],true),b=bestForm(S.teams[j],false);const t=tacFor(a.r,b.r);tacs[t]=(tacs[t]||0)+1}
console.log('  AI tactics over all pairings:',JSON.stringify(tacs));
ffToMatch();S.event=null;startMatch();const opp=S.teams[nextFix().opp];
ok(['att','def','bal'].includes(M.aiTac)&&Object.keys(FORMS).includes(M.h===S.my?M.aForm:M.hForm),'live opponent uses '+(M.h===S.my?M.aForm:M.hForm)+' / '+TACT[M.aiTac]);
const srBefore=els.sr.textContent;skipMatch();ok(els.sr.textContent!==''&&/终焉|进球/.test(els.sr.textContent),'screen reader region announced: "'+els.sr.textContent+'"');
M=null;UI.view='main';
// injuries in days heal on the calendar
S.friendlies.forEach(f=>f.res={hg:0,ag:0});  // skip the preseason friendlies so four days are free
advanceDay({days:0,cond:0,trained:[],healed:[]});  // off the match day (the day we played doesn't count toward recovery)
const p=my().players.find(x=>!unavail(x));p.inj=4;dropFromLineup(p.id);
const log={days:0,cond:0,trained:[],healed:[]};let d=0;while(p.inj>0&&advanceDay(log))d++;
// (a surprise visit from the old healer can cure him sooner)
ok(p.inj===0&&(d===4&&log.healed.includes(p)||d<4&&(log.surprises||[]).length>0),'a 4-day injury heals after 4 calendar days ('+d+')');
UI.tab='squad';p.inj=6;render();ok(/伤停 6 天/.test(els.app.innerHTML),'squad shows 伤停 6 天');
// value: no discount until 31
const v=a=>value({age:a,ovr:75,pot:75});ok(v(30)===v(29)&&v(31)<v(30),'value 29:'+v(29)+' 30:'+v(30)+' 31:'+v(31));
// v8 -> v9: old injuries in matches become weeks
const old=JSON.parse(JSON.stringify(S));old.v=8;old.teams[0].players[0].inj=2;store[KEY]=JSON.stringify(old);const up=load();
ok(up.v===SAVE_V&&up.teams[0].players[0].inj===14,'old 2-match injury becomes 14 days');
UI.tab='home';render();ok(!/undefined|NaN/.test(els.app.innerHTML),'home renders cleanly');
`);
