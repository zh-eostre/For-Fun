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
for(let k=0;k<400;k++){S.offer=null;rollOffer();if(S.offer){if(S.offer.pid===p.id&&S.offer.listed){mine++;const r=S.offer.amount/v;if(r<LIST_RANGE[0]-.02||r>LIST_RANGE[1]+.02)inRange=false}else other++}}
ok(mine>120&&mine<240,'bids for him on about '+Math.round(LIST_CHANCE*100)+'% of window days ('+mine+' of 400)');
ok(inRange,'each between '+LIST_RANGE.join(' and ')+' of his value');
ok(other>20,'other players still draw the usual bids now and then ('+other+')');
S.offer=null;for(let k=0;k<200&&!(S.offer&&S.offer.listed);k++){S.offer=null;rollOffer()}
UI.tab='home';render();ok(/挂牌出售中/.test(els.app.innerHTML),'the offer card (club page) says he was listed');
const club=S.teams[S.offer.club],b=S.budget,amt=S.offer.amount;acceptOffer();
ok(!findP(p.id)&&club.players.includes(p)&&!p.listed&&S.budget===b+amt,'accepted: he is gone, paid for, and off the list');
const q=my().players.find(x=>x.pos!=='GK');ACT.list(String(q.id));ACT.list(String(q.id));ok(!q.listed,'pressed again: off the list');
let listedBids=0;for(let k=0;k<200;k++){S.offer=null;rollOffer();if(S.offer&&S.offer.listed)listedBids++}ok(listedBids===0,'nobody listed: no listed bids');
`);
