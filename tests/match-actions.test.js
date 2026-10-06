// Per-player match numbers (passes, key passes, tackles, interceptions, dribbles) and their place in ratings.
require('./harness').run(`
newGame(12,teamNames());
ACT.ff();S.event=null;startMatch();skipMatch();
const mine=mySide()==='h'?M.rh:M.ra;
ok(mine.every(x=>x.a&&x.a.pas>=0&&x.a.ok<=x.a.pas),'every player of ours has match numbers');
const df=mine.filter(x=>x.role==='DF'),fw=mine.filter(x=>x.role==='FW');
const sum=(l,k)=>l.reduce((s,x)=>s+x.a[k],0);
ok(sum(df,'tkl')+sum(df,'int')>=sum(fw,'tkl')+sum(fw,'int'),'defenders do more defending than forwards');
// live commentary of tackles, dribbles and passes agrees with the numbers
const liveIds=Object.keys(M.live||{});
ok(liveIds.length>0&&liveIds.every(id=>Object.entries(M.live[id]).every(([k,v])=>M.act[id]&&M.act[id][k]>=v)),'every action in the commentary is in the match numbers ('+liveIds.length+' players mentioned)');
render();ok(/详细数据/.test(els.app.innerHTML)&&/关键传球/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'full-time panel has the stats table');
M=null;UI.view='main';
// actions move ratings: same player, a quiet game vs a busy one
const p=my().players.find(x=>x.pos==='MF');
const quiet=rate(p,'MF',{},1,1,90,{pas:20,ok:15,kp:0,tkl:0,int:0,drb:0}),busy=rate(p,'MF',{},1,1,90,{pas:50,ok:46,kp:3,tkl:4,int:3,drb:2});
ok(busy-quiet>1.2,'a busy midfield display rates well above a quiet one ('+quiet+' → '+busy+')');
// minutes: a sub's own goals count in full, the rest of his rating needs time
const st=my().players.find(x=>x.pos==='FW'),sub=[0,1,2,3,4].map(()=>rate(st,'FW',{g:2},2,1,20,{pas:6,ok:5,kp:1,tkl:0,int:0,drb:1}));
ok(Math.min(...sub)>=7.9,'a sub scoring twice in 20 minutes (man-of-the-match level): '+sub.join(', '));
const cameo=[0,1,2,3,4].map(()=>rate(p,'MF',{},3,0,5,{pas:3,ok:3,kp:0,tkl:0,int:0,drb:0}));
ok(cameo.every(r=>r>=5.6&&r<=6.6),'a 5-minute cameo stays near 6: '+cameo.join(', '));
const d=my().players.find(x=>x.pos==='DF'),dr=rate(d,'DF',{},1,0,90,{pas:40,ok:36,kp:0,tkl:6,int:5,drb:0});
ok(dr>=7.5,'a defender with 6 tackles, 5 interceptions and a clean sheet: '+dr);
// a season of AI matches: man of the match is spread across positions
const all=()=>S.teams.flatMap(t=>t.players),mvp={};let n=0;
for(let k=0;k<200;k++){const a=k%20,b=(k*7+3+Math.floor(k/20))%20;if(a===b||a===S.my||b===S.my)continue;
  S.teams.forEach(t=>t.players.forEach(q=>{q.inj=0;q.ban=0;q.cond=95}));S.teams[a].condDay=S.teams[b].condDay=S.day;
  const snap=new Map(all().map(q=>[q.id,[q.rs||0,q.rn||0]]));quickSim(a,b);n++;
  let best=null;for(const t of [S.teams[a],S.teams[b]])t.players.forEach(q=>{const [rs,rn]=snap.get(q.id)||[0,0];if((q.rn||0)>rn){const r=(q.rs||0)-rs;if(!best||r>best.r)best={r,pos:q.pos}}});
  mvp[best.pos]=(mvp[best.pos]||0)+1}
const pc=k=>Math.round((mvp[k]||0)/n*100);console.log('  man of the match: 前锋 '+pc('FW')+'% 中场 '+pc('MF')+'% 后卫 '+pc('DF')+'% 门将 '+pc('GK')+'%');
ok(pc('DF')>=5&&pc('FW')>=20&&pc('MF')<=60,'man of the match goes to every outfield line');
// season totals and the player dialog
const q=all().find(x=>x.ss&&x.rn);ok(q&&q.ss.pas>0,'season totals are kept');
const myp=my().players.find(x=>x.rn);if(myp){ACT.player(String(myp.id));ok(/传球成功率/.test(els.app.innerHTML)&&!bad(els.app.innerHTML),'player dialog shows season numbers')}
`);
