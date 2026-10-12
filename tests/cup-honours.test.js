// The cup tab's roll of honour (for the 天穹杯 and the 冠军杯): clubs by titles, with the seasons; and listed
// players can be bought by clubs abroad.
require('./harness').run(`
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());UI.guide=null;
UI.tab='cup';UI.cupv='dom';render();ok(/天穹杯历届冠军/.test(els.app.innerHTML)&&/还没有决出过冠军/.test(els.app.innerHTML),'no winner yet: the list says so');
const T=S.teams.filter(t=>!t.foreign),A=T[0].name,B=T[1].name;
S.records=[{season:1,cup:A,intl:B},{season:2,cup:B,intl:B},{season:3,cup:A,intl:null},{season:4,cup:A}];S.season=5;S.cup.winner=T[1].id;
render();let h=els.app.innerHTML;const rows=((h.split('天穹杯历届冠军')[1]||'').split('</section>')[0]).match(/class="hr-club"><b>[^<]+<\\/b>/g)||[];
ok(rows[0].includes('<b>'+A+'</b>')&&rows[1].includes('<b>'+B+'</b>')&&rows.length===2,'most titles first: '+A+', then '+B);
ok(h.includes('<b>3</b> 冠')&&h.includes('S3–S4、S1')&&h.includes('S5、S2'),'counts and seasons (latest first, runs joined), this season\\u2019s final included');
ok(seasonRuns([1,2,3,5,7,8,10,12,15])==='S15、S12、S10、S7–S8 等','a long list keeps to four runs: '+seasonRuns([1,2,3,5,7,8,10,12,15]));
UI.cupv='intl';render();h=els.app.innerHTML;ok(/天际冠军杯历届冠军/.test(h)&&h.includes(B)&&h.includes('<b>2</b> 冠'),'the 冠军杯 has its own');
// listed players: some bids from abroad
newGame(TEAMS.findIndex(t=>t.div===2),teamNames());UI.guide=null;const p=my().players.filter(x=>x.pos!=='GK').sort((a,b)=>b.ovr-a.ovr)[0];p.listed=true;
let home=0,abroad=0;for(let k=0;k<400;k++){rollOffer();const o=offerFor(p.id);if(o&&o.listed)(o.club<0||S.teams[o.club].foreign?abroad++:home++)}
ok(abroad>home*.25&&abroad<home*.9,'bids for a listed player from abroad too ('+abroad+' abroad, '+home+' at home)');
for(let k=0;k<200&&!(offerFor(p.id)&&offerFor(p.id).club>=0&&S.teams[offerFor(p.id).club].foreign);k++)rollOffer();
const o=offerFor(p.id),club=S.teams[o.club];UI.tab='home';render();ok(els.app.innerHTML.includes(club.name+'（海外）'),'the offer card says 海外');
acceptOffer(p.id);ok(club.foreign&&club.players.includes(p)&&!findP(p.id),'accepted: he moves abroad');
`);
