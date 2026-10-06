// Player names built from the corpus lists (names.js) plus the hand-made ones.
require('./harness').run(`
newGame(4,teamNames());
const names=S.teams.flatMap(t=>t.players).map(p=>p.name).concat(S.market.map(p=>p.name));
ok(names.length>200&&new Set(names).size===names.length,'every name in a new league is unique ('+names.length+')');
ok(names.every(n=>/^[\\u4e00-\\u9fff·]{2,12}$/.test(n)),'names are Chinese characters (with · between given and family name)');
const cn=names.filter(n=>!n.includes('·')),eu=names.filter(n=>EU_SET.has(n.split('·')[1]||''));
ok(cn.length>names.length*.3&&eu.length>0,'a mix of origins: '+cn.length+' Chinese/East Asian, '+eu.length+' Western of '+names.length);
// variety: 600 Chinese names share few given names
const giv=Array.from({length:600},()=>cnName().slice(-2));
ok(new Set(giv).size>400,'600 Chinese names use '+new Set(giv).size+' different given names');
const surs=Array.from({length:2000},()=>cnName()[0]),wang=surs.filter(c=>c==='王').length,ge=surs.filter(c=>c==='葛').length;
ok(wang>ge*3,'common surnames are more common: 王 '+wang+', 葛 '+ge);
ok(shortName('卡洛斯·'+EU_SUR[0])===EU_SUR[0]&&shortName('阿兹兰·阿都拉')==='阿兹兰'&&shortName('王志强')==='王志强','short names: Western surname, Malay given name, Chinese in full');
console.log('  sample: '+names.slice(0,14).join(' '));
`);
