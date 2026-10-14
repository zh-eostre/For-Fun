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
  strike:{n:'打击',c:1,t:'atk',r:'basic',d:u=>`造成 ${DM(u?9:6)} 点伤害`,f:u=>atk(u?9:6)},
  defend:{n:'防御',c:1,t:'skl',r:'basic',d:u=>`获得 ${u?8:5} 点格挡`,f:u=>gainBlock(u?8:5)},
  bash:{n:'重击',c:2,t:'atk',r:'basic',d:u=>`造成 ${DM(u?10:8)} 点伤害，施加 ${u?3:2} 层易伤`,f:u=>{const t=curTarget();hitEnemy(t,u?10:8);if(t.hp>0)applyE(t,'vuln',u?3:2)}},
  twin:{n:'连斩',c:1,t:'atk',r:'com',d:u=>`造成 ${DM(u?7:5)} 点伤害 2 次`,f:u=>atk(u?7:5,2)},
  cleave:{n:'横扫',c:1,t:'atk',r:'com',d:u=>`对所有敌人造成 ${DM(u?11:8,1,true)} 点伤害`,f:u=>atkAll(u?11:8)},
  jab:{n:'快拳',c:0,t:'atk',r:'com',d:u=>`造成 ${DM(u?6:3)} 点伤害，抽 1 张牌`,f:u=>{atk(u?6:3);draw(1)}},
  sunder:{n:'破甲',c:1,t:'atk',r:'com',d:u=>`造成 ${DM(u?9:7)} 点伤害，施加 ${u?2:1} 层虚弱`,f:u=>{const t=curTarget();hitEnemy(t,u?9:7);if(t.hp>0)applyE(t,'weak',u?2:1)}},
  venom:{n:'毒刃',c:1,t:'atk',r:'com',d:u=>`造成 ${DM(u?6:4)} 点伤害，施加 ${u?5:3} 层中毒`,f:u=>{const t=curTarget();hitEnemy(t,u?6:4);if(t.hp>0)applyE(t,'poison',u?5:3)}},
  slam:{n:'全身撞击',c:1,cu:0,t:'atk',r:'com',d:u=>`造成等同于你格挡值的伤害（${DM(C?C.p.block:0)}）`,f:u=>atk(C.p.block)},
  anger:{n:'怒火',c:0,t:'atk',r:'com',d:u=>`造成 ${DM(u?6:4)} 点伤害，放一张复制到弃牌堆`,f:u=>{atk(u?6:4);C.discard.push({uid:nid(),id:'anger',up:u})}},
  shrug:{n:'硬抗',c:1,t:'skl',r:'com',d:u=>`获得 ${u?11:8} 点格挡，抽 1 张牌`,f:u=>{gainBlock(u?11:8);draw(1)}},
  shout:{n:'战吼',c:0,t:'skl',r:'com',ex:1,d:u=>`抽 ${u?3:2} 张牌。消耗`,f:u=>draw(u?3:2)},
  scare:{n:'恐吓',c:0,t:'skl',r:'com',ex:1,d:u=>`所有敌人获得 ${u?2:1} 层虚弱。消耗`,f:u=>alive().forEach(e=>applyE(e,'weak',u?2:1))},
  haze:{n:'毒雾',c:1,t:'skl',r:'com',d:u=>`所有敌人获得 ${u?6:4} 层中毒`,f:u=>alive().forEach(e=>applyE(e,'poison',u?6:4))},
  darts:{n:'淬毒飞镖',c:1,t:'atk',r:'com',d:u=>`造成 ${DM(2)} 点伤害 ${u?4:3} 次，每次施加 1 层中毒`,f:u=>{for(let i=0;i<(u?4:3);i++){const t=curTarget();if(!t)break;hitEnemy(t,2);if(t.hp>0)applyE(t,'poison',1)}}},
  ironfist:{n:'铁拳',c:1,t:'atk',r:'com',d:u=>`造成 ${DM(u?7:5)} 点伤害，获得 ${u?7:5} 点格挡`,f:u=>{atk(u?7:5);gainBlock(u?7:5)}},
  heavy:{n:'巨刃',c:2,t:'atk',r:'unc',d:u=>`造成 ${DM(14,u?5:3)} 点伤害，力量效果 ×${u?5:3}`,f:u=>atk(14,1,u?5:3)},
  rampage:{n:'狂怒',c:1,t:'atk',r:'unc',d:(u,c)=>`造成 ${DM(8+((c&&c.bonus)||0))} 点伤害，本场每次打出伤害 +${u?8:5}`,f:(u,c)=>{atk(8+(c.bonus||0));c.bonus=(c.bonus||0)+(u?8:5)}},
  entrench:{n:'堡垒',c:2,cu:1,t:'skl',r:'unc',d:u=>`你的格挡值翻倍`,f:u=>gainBlock(C.p.block)},
  adren:{n:'肾上腺素',c:0,t:'skl',r:'rare',ex:1,d:u=>`获得 ${u?2:1} 点能量，抽 2 张牌。消耗`,f:u=>{C.energy+=u?2:1;draw(2)}},
  catal:{n:'催化',c:1,t:'skl',r:'unc',ex:1,d:u=>`目标的中毒层数${u?'变为 3 倍':'翻倍'}。消耗`,f:u=>{const t=curTarget();if(t)applyE(t,'poison',(t.poison||0)*(u?2:1))}},
  shock:{n:'震荡波',c:2,t:'skl',r:'unc',ex:1,d:u=>`所有敌人获得 ${u?3:2} 层虚弱和易伤。消耗`,f:u=>alive().forEach(e=>{applyE(e,'weak',u?3:2);applyE(e,'vuln',u?3:2)})},
  whirl:{n:'旋风斩',c:2,t:'atk',r:'unc',d:u=>`对所有敌人造成 ${DM(u?9:7,1,true)} 点伤害 2 次`,f:u=>atkAll(u?9:7,2)},
  inflame:{n:'燃烧意志',c:1,t:'pow',r:'unc',d:u=>`获得 ${u?3:2} 点力量`,f:u=>{C.p.str+=u?3:2;fx('p',`力量 +${u?3:2}`,'st')}},
  metal:{n:'金属化',c:1,t:'pow',r:'unc',d:u=>`每回合结束时获得 ${u?4:3} 点格挡`,f:u=>C.p.metal+=u?4:3},
  fumes:{n:'毒气',c:1,t:'pow',r:'unc',d:u=>`每回合开始时，所有敌人获得 ${u?3:2} 层中毒`,f:u=>C.p.fumes+=u?3:2},
  rupture:{n:'毒发',c:1,cu:0,t:'skl',r:'unc',d:u=>`目标立即失去等同于其中毒层数的生命${C&&curTarget()?`（<b>${curTarget().poison}</b>）`:''}`,f:u=>{const t=curTarget();if(t)harm(t,t.poison,true)}},
  thorns:{n:'荆棘护甲',c:1,t:'pow',r:'unc',d:u=>`每次受到攻击时，对攻击者造成 ${u?5:3} 点伤害`,f:u=>C.p.thorns+=u?5:3},
  embers:{n:'余烬',c:1,t:'pow',r:'unc',d:u=>`每消耗一张牌，获得 ${u?5:4} 点格挡`,f:u=>C.p.embers+=u?5:4},
  frenzy:{n:'狂乱',c:2,t:'atk',r:'rare',d:u=>`造成 ${DM(u?5:4)} 点伤害 ${u?5:4} 次`,f:u=>atk(u?5:4,u?5:4)},
  execute:{n:'处决',c:3,t:'atk',r:'rare',d:u=>`造成 ${DM(u?48:36)} 点伤害`,f:u=>atk(u?48:36)},
  demon:{n:'恶魔形态',c:3,cu:2,t:'pow',r:'rare',d:u=>`每回合开始时获得 ${u?3:2} 点力量`,f:u=>C.p.demon+=u?3:2},
  barricade:{n:'壁垒',c:2,cu:1,t:'pow',r:'rare',d:u=>`格挡不再在回合开始时消失`,f:u=>C.p.barricade=1},
  inspire:{n:'灵感',c:1,cu:0,t:'pow',r:'rare',d:u=>`每回合多抽 1 张牌`,f:u=>C.p.inspire+=1},
  offering:{n:'献祭',c:0,t:'skl',r:'rare',ex:1,d:u=>`失去 5 点生命，获得 2 点能量，抽 ${u?5:3} 张牌。消耗`,f:u=>{loseHp(5);C.energy+=2;draw(u?5:3)}},
  limit:{n:'极限突破',c:1,t:'skl',r:'rare',ex:u=>!u,d:u=>`力量翻倍。${u?'':'消耗'}`,f:u=>{const g=C.p.str;C.p.str*=2;if(g>0)fx('p',`力量 +${g}`,'st')}},
  toxin:{n:'剧毒',c:1,t:'pow',r:'rare',d:u=>`每次施加中毒时，额外施加 ${u?2:1} 层`,f:u=>C.p.toxin+=u?2:1},
  devour:{n:'吞噬',c:2,cu:1,t:'pow',r:'rare',d:u=>`每消耗一张牌，抽 1 张牌`,f:u=>C.p.devour+=1},
  hellfire:{n:'业火焚身',c:2,t:'atk',r:'rare',ex:1,d:u=>`消耗所有手牌，每消耗 1 张造成 ${DM(u?10:7)} 点伤害。消耗`,f:u=>C.hand.splice(0).forEach(c=>{exhaust(c);atk(u?10:7)})},
  wolfcall:{n:'召唤战狼',c:1,t:'skl',r:'com',d:u=>`召唤一只战狼：每回合结束时对目标造成 ${u?7:5} 点伤害`,f:u=>summon('wolf',u?7:5)},
  turtle:{n:'召唤石龟',c:1,t:'skl',r:'com',d:u=>`召唤一只石龟：每回合结束时为你提供 ${u?5:3} 点格挡`,f:u=>summon('turtle',u?5:3)},
  command:{n:'号令',c:0,t:'skl',r:'com',d:u=>`所有宠物立即行动一次${u?'，抽 1 张牌':''}`,f:u=>{C.pets.forEach(petAct);if(u)draw(1)}},
  toad:{n:'召唤毒蛙',c:1,t:'skl',r:'unc',d:u=>`召唤一只毒蛙：每回合结束时让所有敌人获得 ${u?3:2} 层中毒`,f:u=>summon('toad',u?3:2)},
  raven:{n:'召唤渡鸦',c:1,t:'skl',r:'unc',d:u=>`召唤一只渡鸦：每回合结束时对随机敌人造成 ${u?4:3} 点伤害 2 次`,f:u=>summon('raven',u?4:3)},
  pack:{n:'兽群之力',c:1,t:'pow',r:'unc',d:u=>`你的宠物造成的伤害、格挡和中毒 +${u?3:2}`,f:u=>C.p.pack+=u?3:2},
  wildcall:{n:'野性呼唤',c:3,cu:2,t:'skl',r:'rare',ex:1,d:u=>`召唤战狼、石龟和毒蛙各一只。消耗`,f:u=>{summon('wolf',4);summon('turtle',3);summon('toad',2)}},
  bloodpact:{n:'血契',c:1,t:'atk',r:'rare',d:u=>`你每有一只宠物，就造成一次 ${DM(u?10:7)} 点伤害${C?`（现在 ${C.pets.length} 次）`:''}`,f:u=>atk(u?10:7,C.pets.length)},
  // combo: 飞刀 is made in a fight, never found; the rest grow with the cards played this turn (C.played)
  shiv:{n:'飞刀',c:0,t:'atk',r:'token',ex:1,d:u=>`造成 ${DM((u?6:4)+(C?C.p.accuracy:0))} 点伤害。消耗`,f:u=>atk((u?6:4)+C.p.accuracy)},
  blades:{n:'飞刀雨',c:1,t:'skl',r:'com',d:u=>`把 ${u?4:3} 张飞刀放进手牌（0 费，4 点伤害，消耗）`,f:u=>addHand('shiv',u?4:3)},
  quickblade:{n:'快刀',c:0,t:'atk',r:'com',d:u=>`造成 ${DM(u?6:4)} 点伤害。本回合已打出 3 张以上的牌时，再造成一次`,f:u=>atk(u?6:4,C.played>=3?2:1)},
  thousand:{n:'千刃',c:1,t:'atk',r:'unc',d:u=>`本回合你每打出过一张牌，就造成一次 ${DM(u?4:3)} 点伤害${C?`（现在 ${C.played} 次）`:''}`,f:u=>atk(u?4:3,C.played)},
  flow:{n:'流水',c:1,t:'pow',r:'unc',d:u=>`每回合打出第 4 张牌时，抽 ${u?3:2} 张牌`,f:u=>C.p.flow+=u?3:2},
  accuracy:{n:'精准',c:1,t:'pow',r:'unc',d:u=>`飞刀的伤害 +${u?4:3}`,f:u=>C.p.accuracy+=u?4:3},
  bladedance:{n:'刀锋舞',c:2,cu:1,t:'pow',r:'rare',d:u=>`每回合开始时，把 2 张飞刀放进手牌`,f:u=>C.p.bladedance+=2},
  // berserk: pay with your own blood, and be strongest when you have little left
  reckless:{n:'鲁莽打击',c:1,t:'atk',r:'com',d:u=>`造成 ${DM(u?16:12)} 点伤害，失去 2 点生命`,f:u=>{atk(u?16:12);loseHp(2)}},
  bloodrage:{n:'血怒',c:0,t:'skl',r:'com',d:u=>`失去 2 点生命，获得 ${u?2:1} 点力量`,f:u=>{loseHp(2);C.p.str+=u?2:1;fx('p',`力量 +${u?2:1}`,'st')}},
  drain:{n:'饮血',c:2,t:'atk',r:'rare',ex:1,d:u=>`造成 ${DM(u?14:10)} 点伤害，回复其中一半的生命。消耗`,f:u=>heal(Math.floor(hitEnemy(curTarget(),u?14:10)/2))},
  laststand:{n:'背水一战',c:1,cu:0,t:'pow',r:'unc',d:u=>`生命不高于一半时，你的攻击伤害 +50%`,f:u=>C.p.laststand=1},
  agony:{n:'以痛为力',c:1,t:'pow',r:'rare',d:u=>`每当你在自己的回合失去生命，获得 ${u?2:1} 点力量`,f:u=>C.p.agony+=u?2:1},
  bloodfeast:{n:'鲜血狂欢',c:2,t:'atk',r:'rare',d:u=>`造成等同于你已损失生命 ${u?70:50}% 的伤害（${DM(lostHp(u))}）`,f:u=>atk(lostHp(u))}
};
// 鲜血狂欢's damage: a share of the HP you are missing
const lostHp=u=>Math.floor((S.maxHp-S.hp)*(u?.7:.5));
const POOL=r=>Object.keys(CARDS).filter(k=>CARDS[k].r===r);
const costOf=c=>{const d=CARDS[c.id];return c.up&&d.cu!==undefined?d.cu:d.c};
const exOf=c=>{const d=CARDS[c.id];return typeof d.ex==='function'?d.ex(c.up):!!d.ex};
// rewards lean toward the cards that suit the hero: four times in ten, the card comes from those it likes
function rollCard(elite){
  const x=Math.random()*100,w=elite?[45,40]:[60,32],pool=POOL(x<w[0]?'com':x<w[0]+w[1]?'unc':'rare'),fav=pool.filter(id=>hero().like.includes(id));
  return pick(fav.length&&Math.random()<.4?fav:pool);
}
function rollCards(n,elite){const s=new Set();let g=0;while(s.size<n&&g++<50)s.add(rollCard(elite));return [...s]}

/* ---------- pets ---------- */
// a pet acts at the end of each of your turns, before the enemies move; it lasts the fight. p is its power, b the 兽群之力 bonus
const PETS={
  wolf:{n:'战狼',d:(p,b)=>`每回合对目标造成 ${p+b} 点伤害`},
  turtle:{n:'石龟',d:(p,b)=>`每回合为你提供 ${p+b} 点格挡`},
  toad:{n:'毒蛙',d:(p,b)=>`每回合让所有敌人获得 ${p+b} 层中毒`},
  raven:{n:'渡鸦',d:(p,b)=>`每回合对随机敌人造成 ${p+b} 点伤害 2 次`}
};
const MAXPETS=3;

/* ---------- heroes ---------- */
// each starts with its own HP, deck and relic (found nowhere else), and card rewards lean toward the cards it likes
const HEROES={
  knight:{n:'骑士',img:'hero',hp:80,relic:'blood',deck:{strike:5,defend:4,bash:1},t:'力量与格挡',
    d:'身经百战的骑士。血厚，每场战斗后都能回一口气。',
    like:['twin','cleave','shrug','heavy','rampage','entrench','inflame','metal','whirl','ironfist','thorns','demon','barricade','limit','frenzy','slam']},
  assassin:{n:'刺客',img:'assassin',hp:72,relic:'viper',deck:{strike:4,defend:4,venom:1,jab:1},t:'中毒与快攻',
    d:'刀上淬着毒的刺客。血薄，但每回合第一刀都会让毒更深一层。',
    like:['venom','darts','haze','jab','anger','sunder','twin','catal','fumes','rupture','toxin','frenzy','adren','scare','blades','quickblade','thousand','flow','accuracy','bladedance']},
  pyro:{n:'灰烬术士',img:'pyro',hp:72,relic:'tome',deck:{strike:4,defend:4,shout:1,scare:1},t:'消耗',
    d:'以牌为薪的术士。烧掉一张牌，就从灰烬里取回一点能量。',
    like:['shout','scare','shock','adren','catal','embers','devour','hellfire','offering','limit','inspire','haze']},
  berserker:{n:'狂战士',img:'berserker',hp:80,relic:'scar',deck:{strike:4,defend:4,reckless:1,bloodrage:1},t:'以血换力',
    d:'越伤越狂的战士。越接近死亡，出手越多。',
    like:['reckless','bloodrage','drain','laststand','agony','bloodfeast','offering','heavy','inflame','limit','rampage','anger','ironfist','whirl']},
  beastmaster:{n:'驯兽师',img:'beastmaster',hp:66,relic:'whistle',deck:{strike:4,defend:4,wolfcall:1,command:1},t:'宠物',
    d:'带着狼群出征的驯兽师。每场战斗都有战狼相随。',
    like:['wolfcall','turtle','command','toad','raven','pack','wildcall','bloodpact','shrug','metal','inspire','haze','jab']}
};
const hero=()=>HEROES[S.hero||'knight'];

/* ---------- relics ---------- */
const RELICS={
  blood:{n:'燃烧之血',d:'战斗胜利后回复 6 点生命',start:1},
  viper:{n:'蛇牙',d:'每回合打出的第一张攻击牌，额外施加 3 层中毒',start:1},
  tome:{n:'灰烬法典',d:'每回合第一次消耗牌时，获得 1 点能量',start:1},
  anchor:{n:'船锚',d:'每场战斗第一回合获得 7 点格挡'},
  whet:{n:'磨刀石',d:'战斗开始时获得 1 点力量'},
  ring:{n:'蛇眼戒指',d:'每场战斗第一回合多抽 2 张牌'},
  drum:{n:'战鼓',d:'每回合打出第 3 张攻击牌时，获得 1 点力量'},
  sac:{n:'毒囊',d:'战斗开始时，所有敌人获得 3 层中毒'},
  purse:{n:'金币袋',d:'获得的金币 +50%'},
  ori:{n:'山铜',d:'回合结束时若没有格挡，获得 3 点格挡'},
  fang:{n:'吸血牙',d:'每击杀一个敌人，回复 3 点生命'},
  lantern:{n:'灯笼',d:'每场战斗第一回合多 1 点能量'},
  censer:{n:'焚香炉',d:'每消耗一张牌，对所有敌人造成 3 点伤害'},
  whistle:{n:'骨哨',d:'每场战斗开始时，召唤一只战狼（每回合造成 3 点伤害）',start:1},
  scar:{n:'战痕',d:'生命不高于一半时，每回合多 1 点能量',start:1},
  bracelet:{n:'疾风手环',d:'每回合打出第 6 张牌时，获得 1 点能量'},
  core:{n:'能量核心',d:'每回合多 1 点能量',boss:1},
  crown:{n:'王冠',d:'每回合多抽 1 张牌',boss:1},
  heart:{n:'巨人之心',d:'最大生命 +30',boss:1}
};
const has=k=>S.relics.includes(k);
function gainRelic(k){if(!k)return;S.relics.push(k);if(k==='heart'){S.maxHp+=30;S.hp+=30}}
const freeRelics=boss=>Object.keys(RELICS).filter(k=>!!RELICS[k].boss===!!boss&&!RELICS[k].start&&(!S.relics.includes(k)||k==='heart'));

/* ---------- enemies ---------- */
const EN={
  slime:{n:'史莱姆',hp:[18,22],ai:()=>pick([{a:6},{a:3,w:1}])},
  wolf:{n:'狂狼',hp:[24,28],ai:()=>pick([{a:7},{a:3,n:2}])},
  cultist:{n:'邪教徒',hp:[44,50],ai:(e,t)=>t===0?{s:3}:{a:6}},
  archer:{n:'骷髅弓手',hp:[20,24],ai:(e,t)=>t%2?{b:6,a:4}:{a:3,n:2}},
  shroom:{n:'毒蘑菇',hp:[14,18],ai:(e,t)=>t%2?{a:5}:{a:2,po:3}},
  bat:{n:'吸血蝠',hp:[10,13],ai:()=>({a:4})},
  snake:{n:'沙蛇',hp:[34,38],ai:(e,t)=>t%3===2?{vu:2,w:1}:{a:6}},
  rat:{n:'巨鼠',hp:[12,15],ai:()=>pick([{a:5},{a:2,n:2}])},
  goblin:{n:'哥布林',hp:[20,24],ai:(e,t)=>t%2?{a:8}:{a:3,n:2}},
  spider:{n:'狼蛛',hp:[30,34],ai:(e,t)=>t%2?{a:7}:{a:4,po:2}},
  ghoul:{n:'食尸鬼',hp:[38,44],ai:(e,t)=>[{a:5,vu:1},{a:4,n:2},{a:10}][t%3]},
  priest:{n:'兽人祭司',hp:[24,28],ai:(e,t)=>[{h:6},{a:6},{a:3,w:1}][t%3]},
  golem:{n:'石像鬼',hp:[78,84],elite:1,ai:(e,t)=>[{b:12,a:7},{a:12},{s:2,b:8}][t%3]},
  knight:{n:'暗影骑士',hp:[68,74],elite:1,ai:(e,t)=>[{a:5,n:3},{vu:2,a:8},{a:14}][t%3]},
  ogre:{n:'双头食人魔',hp:[88,94],elite:1,ai:(e,t)=>[{a:11},{s:2,b:6},{a:6,n:2}][t%3]},
  troll:{n:'巨魔',hp:[96,102],elite:1,ai:(e,t)=>[{a:12},{a:6,n:2},{h:10,b:8}][t%3]},
  naga:{n:'娜迦女王',hp:[74,80],elite:1,ai:(e,t)=>[{w:2,vu:2},{a:7,po:4},{a:17}][t%3]},
  dragon:{n:'深渊巨龙',hp:[170,170],boss:1,ai:(e,t)=>[{a:5,n:3},{b:15,s:2},{w:2,vu:1},{a:18}][t%4]},
  titan:{n:'机械泰坦',hp:[170,170],boss:1,ai:(e,t)=>[{b:12,a:8},{a:4,n:3},{s:2,po:2},{a:16}][t%4]},
  lich:{n:'不死巫妖',hp:[165,165],boss:1,ai:(e,t)=>[{a:5,n:3},{po:4,w:1},{h:8,b:10},{a:18}][t%4]}
};
const EASY=[['slime'],['wolf'],['bat','bat'],['shroom','bat'],['rat','rat']];
const NORMAL=[['cultist'],['slime','slime','bat'],['archer','bat'],['shroom','shroom','bat'],['wolf','slime'],['snake'],['archer','archer'],['wolf','bat','bat'],
  ['goblin','goblin'],['spider'],['ghoul'],['goblin','priest'],['ghoul','priest'],['spider','rat']];
const ELITES=[['golem'],['knight'],['ogre'],['troll'],['naga']];
const BOSSES=['dragon','titan','lich'];
function makeEnemy(k){
  const d=EN[k],fl=d.boss?0:S.floor,hm=1+.4*S.loop+.025*fl,dm=1+.35*S.loop+.02*fl,hp=Math.round(R(d.hp[0],d.hp[1])*hm);
  return {uid:nid(),k,name:d.n,hp,max:hp,block:0,str:0,weak:0,vuln:0,poison:0,t:0,dm,bm:hm,next:null};
}

