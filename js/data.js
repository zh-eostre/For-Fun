/* ---------- shared state and helpers ---------- */
const KEY='abyss-tower-v1',BEST='abyss-tower-best';
const R=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let S=null,C=null,UI={over:null},FX=[],HIT={};

/* ---------- cards ---------- */
function DM(base,mul=1,all=false){
  if(!C)return `<b>${base}</b>`;
  const v=pDmg(base,all?null:curTarget(),mul);
  return `<b class="${v>base?'up':v<base?'down':''}">${v}</b>`;
}
const TYPE={atk:'攻击',skl:'技能',pow:'能力'};
const CARDS={
  strike:{n:'打击',c:1,t:'atk',r:'basic',e:'🗡️',d:u=>`造成 ${DM(u?9:6)} 点伤害`,f:u=>atk(u?9:6)},
  defend:{n:'防御',c:1,t:'skl',r:'basic',e:'🛡️',d:u=>`获得 ${u?8:5} 点格挡`,f:u=>gainBlock(u?8:5)},
  bash:{n:'重击',c:2,t:'atk',r:'basic',e:'🔨',d:u=>`造成 ${DM(u?10:8)} 点伤害，施加 ${u?3:2} 层易伤`,f:u=>{const t=curTarget();hitEnemy(t,u?10:8);if(t.hp>0)applyE(t,'vuln',u?3:2)}},
  twin:{n:'连斩',c:1,t:'atk',r:'com',e:'⚔️',d:u=>`造成 ${DM(u?7:5)} 点伤害 2 次`,f:u=>atk(u?7:5,2)},
  cleave:{n:'横扫',c:1,t:'atk',r:'com',e:'🌀',d:u=>`对所有敌人造成 ${DM(u?11:8,1,true)} 点伤害`,f:u=>atkAll(u?11:8)},
  jab:{n:'快拳',c:0,t:'atk',r:'com',e:'👊',d:u=>`造成 ${DM(u?6:3)} 点伤害，抽 1 张牌`,f:u=>{atk(u?6:3);draw(1)}},
  sunder:{n:'破甲',c:1,t:'atk',r:'com',e:'🔪',d:u=>`造成 ${DM(u?9:7)} 点伤害，施加 ${u?2:1} 层虚弱`,f:u=>{const t=curTarget();hitEnemy(t,u?9:7);if(t.hp>0)applyE(t,'weak',u?2:1)}},
  venom:{n:'毒刃',c:1,t:'atk',r:'com',e:'🐍',d:u=>`造成 ${DM(u?6:4)} 点伤害，施加 ${u?5:3} 层中毒`,f:u=>{const t=curTarget();hitEnemy(t,u?6:4);if(t.hp>0)applyE(t,'poison',u?5:3)}},
  slam:{n:'全身撞击',c:1,cu:0,t:'atk',r:'com',e:'💥',d:u=>`造成等同于你格挡值的伤害（${DM(C?C.p.block:0)}）`,f:u=>atk(C.p.block)},
  anger:{n:'怒火',c:0,t:'atk',r:'com',e:'😤',d:u=>`造成 ${DM(u?8:6)} 点伤害，放一张复制到弃牌堆`,f:u=>{atk(u?8:6);C.discard.push({uid:nid(),id:'anger',up:u})}},
  shrug:{n:'硬抗',c:1,t:'skl',r:'com',e:'🪖',d:u=>`获得 ${u?11:8} 点格挡，抽 1 张牌`,f:u=>{gainBlock(u?11:8);draw(1)}},
  shout:{n:'战吼',c:0,t:'skl',r:'com',e:'📯',ex:1,d:u=>`抽 ${u?3:2} 张牌。消耗`,f:u=>draw(u?3:2)},
  scare:{n:'恐吓',c:0,t:'skl',r:'com',e:'😠',ex:1,d:u=>`所有敌人获得 ${u?2:1} 层虚弱。消耗`,f:u=>alive().forEach(e=>applyE(e,'weak',u?2:1))},
  haze:{n:'毒雾',c:1,t:'skl',r:'com',e:'☁️',d:u=>`所有敌人获得 ${u?6:4} 层中毒`,f:u=>alive().forEach(e=>applyE(e,'poison',u?6:4))},
  heavy:{n:'巨刃',c:2,t:'atk',r:'unc',e:'🪓',d:u=>`造成 ${DM(14,u?5:3)} 点伤害，力量效果 ×${u?5:3}`,f:u=>atk(14,1,u?5:3)},
  rampage:{n:'狂怒',c:1,t:'atk',r:'unc',e:'🔥',d:(u,c)=>`造成 ${DM(8+((c&&c.bonus)||0))} 点伤害，本场每次打出伤害 +${u?8:5}`,f:(u,c)=>{atk(8+(c.bonus||0));c.bonus=(c.bonus||0)+(u?8:5)}},
  entrench:{n:'堡垒',c:2,cu:1,t:'skl',r:'unc',e:'🏰',d:u=>`你的格挡值翻倍`,f:u=>gainBlock(C.p.block)},
  adren:{n:'肾上腺素',c:0,t:'skl',r:'unc',e:'⚡',ex:1,d:u=>`获得 ${u?2:1} 点能量，抽 2 张牌。消耗`,f:u=>{C.energy+=u?2:1;draw(2)}},
  catal:{n:'催化',c:1,t:'skl',r:'unc',e:'🧪',ex:1,d:u=>`目标的中毒层数${u?'变为 3 倍':'翻倍'}。消耗`,f:u=>{const t=curTarget();if(t)applyE(t,'poison',(t.poison||0)*(u?2:1))}},
  shock:{n:'震荡波',c:1,t:'skl',r:'unc',e:'🌊',ex:1,d:u=>`所有敌人获得 ${u?3:2} 层虚弱和易伤。消耗`,f:u=>alive().forEach(e=>{applyE(e,'weak',u?3:2);applyE(e,'vuln',u?3:2)})},
  whirl:{n:'旋风斩',c:2,t:'atk',r:'unc',e:'🌪️',d:u=>`对所有敌人造成 ${DM(u?7:5,1,true)} 点伤害 2 次`,f:u=>atkAll(u?7:5,2)},
  inflame:{n:'燃烧意志',c:1,t:'pow',r:'unc',e:'💪',d:u=>`获得 ${u?3:2} 点力量`,f:u=>{C.p.str+=u?3:2;fx('p',`力量 +${u?3:2}`,'st')}},
  metal:{n:'金属化',c:1,t:'pow',r:'unc',e:'🔩',d:u=>`每回合结束时获得 ${u?4:3} 点格挡`,f:u=>C.p.metal+=u?4:3},
  fumes:{n:'毒气',c:1,t:'pow',r:'unc',e:'☠️',d:u=>`每回合开始时，所有敌人获得 ${u?3:2} 层中毒`,f:u=>C.p.fumes+=u?3:2},
  frenzy:{n:'狂乱',c:2,t:'atk',r:'rare',e:'💫',d:u=>`造成 ${DM(u?5:4)} 点伤害 ${u?5:4} 次`,f:u=>atk(u?5:4,u?5:4)},
  execute:{n:'处决',c:3,t:'atk',r:'rare',e:'🔱',d:u=>`造成 ${DM(u?42:30)} 点伤害`,f:u=>atk(u?42:30)},
  demon:{n:'恶魔形态',c:3,t:'pow',r:'rare',e:'😈',d:u=>`每回合开始时获得 ${u?3:2} 点力量`,f:u=>C.p.demon+=u?3:2},
  barricade:{n:'壁垒',c:3,cu:2,t:'pow',r:'rare',e:'🧱',d:u=>`格挡不再在回合开始时消失`,f:u=>C.p.barricade=1},
  inspire:{n:'灵感',c:1,cu:0,t:'pow',r:'rare',e:'📖',d:u=>`每回合多抽 1 张牌`,f:u=>C.p.inspire+=1},
  offering:{n:'献祭',c:0,t:'skl',r:'rare',e:'🩸',ex:1,d:u=>`失去 6 点生命，获得 2 点能量，抽 ${u?5:3} 张牌。消耗`,f:u=>{loseHp(6);C.energy+=2;draw(u?5:3)}},
  limit:{n:'极限突破',c:1,t:'skl',r:'rare',e:'🌟',ex:u=>!u,d:u=>`力量翻倍。${u?'':'消耗'}`,f:u=>{const g=C.p.str;C.p.str*=2;if(g>0)fx('p',`力量 +${g}`,'st')}}
};
const POOL=r=>Object.keys(CARDS).filter(k=>CARDS[k].r===r);
const costOf=c=>{const d=CARDS[c.id];return c.up&&d.cu!==undefined?d.cu:d.c};
const exOf=c=>{const d=CARDS[c.id];return typeof d.ex==='function'?d.ex(c.up):!!d.ex};
function rollCard(elite){const x=Math.random()*100,w=elite?[45,40]:[60,32];return pick(POOL(x<w[0]?'com':x<w[0]+w[1]?'unc':'rare'))}
function rollCards(n,elite){const s=new Set();let g=0;while(s.size<n&&g++<50)s.add(rollCard(elite));return [...s]}

/* ---------- relics ---------- */
const RELICS={
  blood:{n:'燃烧之血',e:'❤️‍🔥',d:'战斗胜利后回复 8 点生命'},
  anchor:{n:'船锚',e:'⚓',d:'每场战斗第一回合获得 10 点格挡'},
  whet:{n:'磨刀石',e:'🪨',d:'战斗开始时获得 1 点力量'},
  ring:{n:'蛇眼戒指',e:'💍',d:'每场战斗第一回合多抽 2 张牌'},
  drum:{n:'战鼓',e:'🥁',d:'每回合打出第 3 张攻击牌时，获得 1 点力量'},
  sac:{n:'毒囊',e:'🫧',d:'战斗开始时，所有敌人获得 3 层中毒'},
  purse:{n:'金币袋',e:'💰',d:'获得的金币 +50%'},
  ori:{n:'山铜',e:'🔶',d:'回合结束时若没有格挡，获得 6 点格挡'},
  fang:{n:'吸血牙',e:'🦷',d:'每击杀一个敌人，回复 4 点生命'},
  lantern:{n:'灯笼',e:'🏮',d:'每场战斗第一回合多 1 点能量'},
  core:{n:'能量核心',e:'🔋',d:'每回合多 1 点能量',boss:1},
  crown:{n:'王冠',e:'👑',d:'每回合多抽 1 张牌',boss:1},
  heart:{n:'巨人之心',e:'💗',d:'最大生命 +30',boss:1}
};
const has=k=>S.relics.includes(k);
function gainRelic(k){if(!k)return;S.relics.push(k);if(k==='heart'){S.maxHp+=30;S.hp+=30}}
const freeRelics=boss=>Object.keys(RELICS).filter(k=>!!RELICS[k].boss===!!boss&&k!=='blood'&&(!S.relics.includes(k)||k==='heart'));

/* ---------- enemies ---------- */
const EN={
  slime:{n:'史莱姆',e:'🦠',hp:[18,22],ai:()=>pick([{a:6},{a:3,w:1}])},
  wolf:{n:'狂狼',e:'🐺',hp:[24,28],ai:()=>pick([{a:7},{a:3,n:2}])},
  cultist:{n:'邪教徒',e:'🧙',hp:[44,50],ai:(e,t)=>t===0?{s:3}:{a:6}},
  archer:{n:'骷髅弓手',e:'💀',hp:[20,24],ai:(e,t)=>t%2?{b:6,a:4}:{a:3,n:2}},
  shroom:{n:'毒蘑菇',e:'🍄',hp:[14,18],ai:(e,t)=>t%2?{a:5}:{a:2,po:3}},
  bat:{n:'吸血蝠',e:'🦇',hp:[10,13],ai:()=>({a:4})},
  snake:{n:'沙蛇',e:'🦎',hp:[28,32],ai:(e,t)=>t%3===2?{vu:2,w:1}:{a:6}},
  golem:{n:'石像鬼',e:'🗿',hp:[78,84],elite:1,ai:(e,t)=>[{b:12,a:7},{a:12},{s:2,b:8}][t%3]},
  knight:{n:'暗影骑士',e:'🤺',hp:[68,74],elite:1,ai:(e,t)=>[{a:5,n:3},{vu:2,a:9},{a:16}][t%3]},
  ogre:{n:'双头食人魔',e:'👹',hp:[88,94],elite:1,ai:(e,t)=>[{a:11},{s:3,b:6},{a:6,n:2}][t%3]},
  dragon:{n:'深渊巨龙',e:'🐉',hp:[170,170],boss:1,ai:(e,t)=>[{a:6,n:3},{b:15,s:2},{w:2,vu:1},{a:20}][t%4]},
  titan:{n:'机械泰坦',e:'🤖',hp:[180,180],boss:1,ai:(e,t)=>[{b:12,a:8},{a:4,n:4},{s:2,po:3},{a:20}][t%4]}
};
const EASY=[['slime'],['wolf'],['bat','bat'],['shroom','bat']];
const NORMAL=[['cultist'],['slime','slime','bat'],['archer','bat'],['shroom','shroom','bat'],['wolf','slime'],['snake'],['archer','archer'],['wolf','bat','bat']];
const ELITES=[['golem'],['knight'],['ogre']];
function makeEnemy(k){
  const d=EN[k],fl=d.boss?0:S.floor,hm=1+.25*S.loop+.025*fl,dm=1+.2*S.loop+.012*fl,hp=Math.round(R(d.hp[0],d.hp[1])*hm);
  return {uid:nid(),k,name:d.n,hp,max:hp,block:0,str:0,weak:0,vuln:0,poison:0,t:0,dm,bm:hm,next:null};
}

