// Formations with holding (后腰) and attacking (前腰) midfielders: lines, pitch layout, strength, goals and actions.
require('./harness').run(`
newGame(5,teamNames());
ok(slotLines('4-2-3-1').join()==='GK,DF,DF,DF,DF,DM,DM,AM,AM,AM,FW'&&slotLines('4-1-4-1').filter(l=>l==='MF').length===4&&slotLines('3-4-2-1').filter(l=>l==='AM').length===2,'midfield slots split into lines');
ok(Object.keys(FORMS).every(f=>slotRoles(f).length===11),'every formation has 11 slots ('+Object.keys(FORMS).length+' formations)');
// pitch: no two players on top of each other
const crowded=Object.keys(FORMS).filter(f=>{const sp=pitchSpots(autoPick(my(),f),f);return sp.some((a,i)=>sp.some((b,j)=>j>i&&Math.abs(a.x-b.x)<14&&Math.abs(a.y-b.y)<9))});
ok(!crowded.length,'pitch layouts keep players apart'+(crowded.length?': '+crowded.join(','):''));
// strength: lines change the style, not the total
const t=my(),st=f=>strength(t,autoPick(t,f),'bal',true,0,f);
const a=st('4-5-1'),b=st('4-2-3-1'),c=st('4-1-4-1');
ok(Math.abs((a.atk+a.def)-(b.atk+b.def))<.01&&b.atk>a.atk&&c.def>a.def,'4-2-3-1 attacks more, 4-1-4-1 defends more, same total as 4-5-1');
// attacking midfielders score and assist more than holding ones
const ids=autoPick(t,'4-2-3-1'),lines=slotLines('4-2-3-1'),g={DM:0,AM:0},as={DM:0,AM:0};
for(let k=0;k<4000;k++){const p=scorer(t,ids,'4-2-3-1'),l=lines[ids.indexOf(p.id)];if(g[l]!=null)g[l]++;const q=assister(t,ids,'4-2-3-1',p);if(q){const m=lines[ids.indexOf(q.id)];if(as[m]!=null)as[m]++}}
ok(g.AM/3>g.DM/2*2&&as.AM/3>as.DM/2,'per player: 前腰 '+Math.round(g.AM/3)+' goals '+Math.round(as.AM/3)+' assists, 后腰 '+Math.round(g.DM/2)+' goals '+Math.round(as.DM/2)+' assists');
// match numbers: holding midfielders defend more, attacking ones create more
const lm=lineMap(ids,'4-2-3-1');let dm={d:0,kp:0,n:0},am={d:0,kp:0,n:0};
for(let k=0;k<200;k++){const r=matchActions(t,ids,lm,{},.5,0,12);ids.forEach(id=>{const x=r[id],o=lm[id]==='DM'?dm:lm[id]==='AM'?am:null;if(o&&x){o.d+=x.tkl+x.int;o.kp+=x.kp;o.n++}})}
ok(dm.d/dm.n>am.d/am.n&&am.kp/am.n>dm.kp/dm.n,'后腰 '+(dm.d/dm.n).toFixed(1)+' tackles+int, 前腰 '+(am.kp/am.n).toFixed(1)+' key passes per match');
// AI clubs use a spread of formations
const used=new Set(S.teams.filter(x=>x.id!==S.my).map(x=>bestForm(x,true).form));
ok(used.size>=4,'AI clubs use '+used.size+' different formations');
// the squad page and a live match in a new formation
UI.tab='squad';ACT.form('4-2-3-1');ACT.auto();render();ok(/后腰/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'squad page explains the midfield lines');
ffToMatch();S.event=null;S.offer=null;startMatch();skipMatch();render();ok(M.done&&!bad(els.app.innerHTML),'a match in 4-2-3-1 plays out');
// five at the back: 豪门 hardly ever, 强队 now and then, the rest as their squads suit
const five=rep=>{let n=0;for(let i=0;i<150;i++){const t={id:900+i,rep,str:strFromRep(rep),players:makeSquad(strFromRep(rep))};if(FORMS[bestForm(t,true).form].DF===5)n++}return n/150};
const big=five(88),strong=five(72),weak=five(30);
ok(big<=.05&&strong<=.15&&weak>strong,'five at the back: 豪门 '+Math.round(big*100)+'%, 强队 '+Math.round(strong*100)+'%, 弱旅 '+Math.round(weak*100)+'%');
`);
