// The transfer list: a listed player draws bids of his own in the transfer windows (often, at 0.95-1.3 of his value);
// direct sale stays at 85%; the dialog lists and unlists him and the squad list tags him.
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());UI.guide=null;
ok(windowOpen(),'preseason: the window is open');
const p=my().players.filter(x=>x.pos!=='GK').sort((a,b)=>a.ovr-b.ovr)[0];
ok(sellPrice(p)===Math.round(marketValue(p)*.85),'direct sale: 85% of his value');
ACT.player(String(p.id));ok(/data-act="list"/.test(els.app.innerHTML)&&/挂牌出售/.test(els.app.innerHTML),'the player dialog offers 挂牌出售');
ACT.list(String(p.id));ok(p.listed===true,'listed');UI.modal=null;
UI.tab='squad';render();ok(/tag2 listed/.test(els.app.innerHTML),'tagged 挂牌 in the squad list');
let mine=0,other=0,inRange=true;const v=marketValue(p);
for(let k=0;k<400;k++){rollOffer();S.offers.forEach(o=>{if(o.pid===p.id&&o.listed){mine++;const R=o.club>=0?LIST_RANGE:MINOR_RANGE,r=o.amount/v;if(r<R[0]-.02||r>R[1]+.02)inRange=false}else other++})}
ok(mine>120&&mine<240,'bids for him on about '+Math.round(LIST_CHANCE*100)+'% of window days ('+mine+' of 400)');
ok(inRange,'each between '+LIST_RANGE.join(' and ')+' of his value ('+MINOR_RANGE.join('-')+' from a small club abroad)');
ok(other>20,'other players still draw the usual bids now and then ('+other+')');
for(let k=0;k<200&&!(offerFor(p.id)&&offerFor(p.id).listed);k++)rollOffer();
UI.tab='home';render();ok(/挂牌出售中/.test(els.app.innerHTML),'the offer card (club page) says he was listed');
const club=S.teams[offerFor(p.id).club],b=S.budget,amt=offerFor(p.id).amount;acceptOffer(p.id);
ok(!findP(p.id)&&club.players.includes(p)&&!p.listed&&S.budget===b+amt,'accepted: he is gone, paid for, and off the list');
const q=my().players.find(x=>x.pos!=='GK');ACT.list(String(q.id));ACT.list(String(q.id));ok(!q.listed,'pressed again: off the list');
let listedBids=0;for(let k=0;k<200;k++){rollOffer();listedBids+=S.offers.filter(o=>o.listed).length}ok(listedBids===0,'nobody listed: no listed bids');
// several bids can stand at once, one per player; each answered on its own
{let most=0;for(let k=0;k<300;k++){rollOffer();most=Math.max(most,S.offers.length);if(new Set(S.offers.map(o=>o.pid)).size!==S.offers.length)most=-99}
  ok(most>=2,'up to '+most+' bids on the same day, never two for one player');}
{let tries=0;while(S.offers.length<2&&tries++<500)rollOffer();
  if(S.offers.length>=2){const [a,b2]=S.offers;UI.tab='home';render();
    ok(els.app.innerHTML.includes('data-act="offerYes" data-arg="'+a.pid+'"')&&els.app.innerHTML.includes('data-act="offerYes" data-arg="'+b2.pid+'"'),'the club page shows each with its own buttons');
    ACT.offerNo(String(a.pid));ok(!offerFor(a.pid)&&offerFor(b2.pid),'rejecting one leaves the other');
    acceptOffer(b2.pid);ok(!offerFor(b2.pid)&&!findP(b2.pid),'accepting the other sells him')}else ok(true,'(no two bids at once this time)')}
// a save from before (one offer at most) keeps its offer
{const old=JSON.parse(JSON.stringify(S));const p0=my().players[0];old.v=20;old.offer={pid:p0.id,club:S.rival,amount:50};delete old.offers;
  store[KEY]=JSON.stringify(old);const up=load();ok(up.v===SAVE_V&&up.offers.length===1&&up.offers[0].pid===p0.id&&!('offer' in up),'an older save: its one offer carries over');}
// random bids come mostly in a window's first days
{newGame(TEAMS.findIndex(t=>t.div===2),teamNames());UI.guide=null;const count=day=>{let n=0;S.day=day;for(let k=0;k<300;k++){rollOffer();n+=S.offers.length}return n};
  const early=count(1)+count(2)+count(3),late=count(4)+count(5)+count(6);S.day=0;S.offers=[];
  ok(early>late*3,'preseason bids: '+early+' over days 1-3, '+late+' over days 4-6');}
// fast-forward stops on a day that brings bids, before they lapse
{let stopped=false;for(let k=0;k<30&&!stopped;k++){newGame(TEAMS.findIndex(t=>t.div===2),teamNames());UI.guide=null;
    ACT.ff();if(S.offers.length){stopped=true;ok(!isMatchDay()||S.day===nextMatchDay(),'stopped on '+dayLabel(S.day)+' with '+S.offers.length+' bid(s), next match '+dayLabel(nextMatchDay()));
      ok(/转会报价/.test(els.toast.textContent),'and says so: '+els.toast.textContent)}}
  ok(stopped,'a fast-forward through the window stopped for bids');}
// clubs only bid for players who'd fit in; a weak listed player goes to a small club abroad
{newGame(TEAMS.findIndex(t=>t.div===2),teamNames());UI.guide=null;
  const w=my().players.find(x=>x.pos!=='GK');w.ovr=30;w.listed=true;const clubs=new Set(),minors=new Set();
  for(let k=0;k<300;k++){rollOffer();const o=offerFor(w.id);if(o){if(o.club>=0)clubs.add(o.club);else minors.add(o.minor)}}
  ok(clubs.size===0&&minors.size>0&&[...minors].every(n=>LOAN_LEAGUES.abroad[1].includes(n)),'a 30-rated listed player: bids only from small clubs abroad ('+[...minors].join('、')+')');
  ok([...Array(50)].every(()=>{rollOffer();return S.offers.every(o=>o.club<0||(findP(o.pid).ovr>=S.teams[o.club].str-(S.teams[o.club].foreign?FIT_BELOW_INTL:FIT_BELOW)))}),'no club bids for a player well below its level');
  for(let k=0;k<100&&!offerFor(w.id);k++)rollOffer();const o=offerFor(w.id);UI.tab='home';render();
  ok(els.app.innerHTML.includes(o.minor+'（海外联赛）'),'the offer card names the small club');
  acceptOffer(w.id);ok(!findP(w.id)&&!S.teams.some(t=>t.players.includes(w))&&S.news.some(n=>n.t.includes('转投海外联赛的 '+o.minor)),'accepted: he leaves for the leagues abroad');}
`);
