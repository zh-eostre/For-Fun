/* ---------- constants, shared state, small helpers ---------- */
const KEY='lvyin-fm-v1';  // localStorage key; kept as-is so old saves are still found
const SAVE_V=15;         // bump when the save format changes, and add a step to MIGRATE in engine.js
// a club's base strength (its typical best-XI level) from its 底蕴: 98 → 84, 86 → 80, 50 → 68, 14 → 55
function strFromRep(rep){return Math.round(50+rep*.35)}
const TIERS=[[80,'豪门'],[65,'强队'],[45,'中游'],[0,'弱旅']];
const tierOf=rep=>TIERS.find(([m])=>rep>=m)[1];
const DIV_SIZE=10;
// twenty club slots, ten per division. rep (底蕴, 0-100) sets an AI club's target strength and how hard it
// strengthens; it moves with results every season. each new game gives the slots random names from CITY + NICK
const TEAMS=[
  {div:0,color:'#B23A2E',rep:92},{div:0,color:'#1F5F99',rep:86},{div:0,color:'#C9822B',rep:76},{div:0,color:'#2C6E49',rep:72},
  {div:0,color:'#7A5C2E',rep:68},{div:0,color:'#4B4B8F',rep:58},{div:0,color:'#8C2F5A',rep:54},{div:0,color:'#1E7F86',rep:50},
  {div:0,color:'#2A8C8C',rep:40},{div:0,color:'#7B3F00',rep:34},
  {div:1,color:'#5E7D2B',rep:56},{div:1,color:'#9C4A1A',rep:44},{div:1,color:'#3D6B8E',rep:40},{div:1,color:'#6B3F7A',rep:36},
  {div:1,color:'#A8862B',rep:32},{div:1,color:'#2F7F6A',rep:30},{div:1,color:'#8E3B46',rep:26},{div:1,color:'#5A4FCF',rep:22},
  {div:1,color:'#54606B',rep:18},{div:1,color:'#B5527A',rep:14}
].map(t=>({...t,str:strFromRep(t.rep)}));
const DIVS=['甲级','乙级'];
const ROUNDS=2*(DIV_SIZE-1);  // a new season's length; a save mid-way through an older format uses rounds()
const SWAP=2;           // teams relegated from 甲级 and promoted from 乙级 each season
const PRIZE2=[240,200,170,140,120,105,95,85,78,70];
const DIV_INCOME=[1,.6];  // 乙级 gates and bonuses are smaller
// fictional places for club names
const CITY=['青岚','赤崖','白沙湾','雾港','星原','苍木','金穗','碧潭','风鸣','霜城','云岭','落日湾','铁砧','翠谷','银滩','烈风原','月牙泉','黑石','红树林','晨曦','潮汐镇','雷鸣谷','琥珀城','松涛','鹰嘴岩','蓝鲸湾','紫霞','白桦林'];
// loan destinations outside our two divisions: [league, club names]
const LOAN_LEAGUES={
  low:['丙级联赛',['柳溪竞技','石桥联队','枫林体育会','沙丘矿工','竹湾渔港','松坡青年队','鹿鸣竞技','蓝湖联队']],
  away:['外地联赛',['北原城','南岭联','西川流浪者','东滨竞技','高原雄鹰','河谷联队']],
  abroad:['海外联赛',['北境皇家','南洋星辰','西陆白狼','极光城','暮光港','翡翠海岸']]
};
const NICK=['流星','铁骑','海鹰','石狮','古城','南风','浪潮','犀鸟','猛虎','黑豹','雷霆','飞马','巨鳄','金鹰','烈火','白鲨','野牛','红隼','战象','疾风','银狼','火凤','苍龙','赤狐','冰熊','钢鹰','夜枭','狂狮'];
const POS={GK:'门将',DF:'后卫',MF:'中场',FW:'前锋'};
const PO=['GK','DF','MF','FW'];
// players per role; dm / am: how many of the midfielders play as holding (后腰) or attacking (前腰) midfielders
const FORMS={'4-4-2':{GK:1,DF:4,MF:4,FW:2},'4-3-3':{GK:1,DF:4,MF:3,FW:3},'4-2-3-1':{GK:1,DF:4,MF:5,FW:1,dm:2,am:3},
  '4-1-4-1':{GK:1,DF:4,MF:5,FW:1,dm:1},'4-5-1':{GK:1,DF:4,MF:5,FW:1},'4-3-1-2':{GK:1,DF:4,MF:4,FW:2,am:1},
  '3-5-2':{GK:1,DF:3,MF:5,FW:2},'3-4-3':{GK:1,DF:3,MF:4,FW:3},'3-4-2-1':{GK:1,DF:3,MF:6,FW:1,am:2},
  '5-3-2':{GK:1,DF:5,MF:3,FW:2},'5-4-1':{GK:1,DF:5,MF:4,FW:1}};
const LINE_NAME={DM:'后腰',AM:'前腰'};
const TACT={def:'防守反击',bal:'平衡',att:'全力进攻'};
const TRAIN={rest:['恢复训练','训练日体能 +10，不会通过训练进步'],normal:['常规训练','训练日体能 +4，有一定机会进步'],hard:['高强度加练','训练日体能 +1，进步最快，但疲劳的球员更容易受伤']};
const PRIZE=[500,400,320,260,220,190,165,145,130,120];
const CARD=.02;   // chance per team per minute of a booking (about 1.8 per team per match)
// chance to retire at the end of a season by age (33-39; 40+ always retires), scaled by ability below
const RETIRE_AGE={33:.08,34:.2,35:.4,36:.6,37:.75,38:.85,39:.95};
const YC_BAN=3;   // yellow cards that add up to a one-match ban
// player name parts; genName in engine.js combines them
// calendar: a season is one week per league round; league matches on Saturdays, cup ties on the Wednesday of the week whose
// league round is the cup format's at[k] (see CUP_FORMAT). the day after any of our matches is a rest day, every other day is a training day
const WEEKDAYS=['周一','周二','周三','周四','周五','周六','周日'];
const leagueDay=r=>(S.pre||0)+7*r+5;   // S.pre: preseason days before round 1 (see club.js)
const DAY_REST=10;   // stamina everyone gets back on a rest day
// per training day, depending on the training setting: stamina change, and chance to improve by 1
const TRAIN_DAY={rest:{cond:10,grow:0},normal:{cond:4,grow:.028},hard:{cond:1,grow:.05}};
const MATCH_GROW=.1;    // chance per match that a player who played improves by 1
const YOUTH_PROVEN=5;   // academy players need this many first-team matches before buyers value their potential

// knockout cup for all 16 clubs, slotted between league rounds
const CUP_NAME='天穹杯';
// a cup's format is stored with the cup (S.cup.fmt), so a save made under the 16-club format finishes its cup as it began
const CUP_FORMAT={
  names:['资格赛','十六强','八强','半决赛','决赛'],
  at:[2,5,9,13,16],             // stage k is played once this many league rounds are done
  prize:[0,0,30,60,120,250]     // by the stage you went out in; the last entry is for winning it
};
const CUP_LEGACY={names:['十六强','八强','半决赛','决赛'],at:[3,6,9,12],prize:[0,30,60,120,250]};

const INJ_RATE=.0007;    // chance per team per minute of an injury (about one every 16 matches per team)
const INJ_DAYS=[2,3,4,4,5,6,7,9,12,16,21];  // how many days an injury lasts, picked at random
// youth academy: upgrade cost to reach the next level, by current level (max level 5)
const ACADEMY_COST=[0,80,150,250,400];
// scout department, physio room, training ground: cost to go from level n to n+1, indexed by n
const FAC_COST=[0,60,120,200,320];
const SUBS=5;          // halftime substitutions allowed
const OOP=.85;           // ability multiplier for a player in another outfield line (keeper <-> outfield is .5)
const SIG_OVR=75;        // players this good get a signature move
const SIG_A=['苍雷','黑炎','绝影','天狼','冥王','流星','修罗','月影','虚空','龙卷','赤焰','霜华','雷神','幻影','极光'];
const SIG_B=['贯穿','断罪','葬送','乱舞','一闪','崩坏','螺旋','终焉','天翔','灭杀','裂空','轮回'];
const AWAKEN=.015;       // chance per match that a player aged 23 or under awakens
const BOOST=2;           // strength bonus while morale is high (after a derby win or some events)
const OFFER_CHANCE=.2;   // chance after each match that an AI club bids for one of your players
const EVENT_CHANCE=.2;   // chance after each match of a random event

const ACH={
  hat:['三重奏的支配者','有球员在一场比赛中独进 3 球'],
  streak:['不败神话·序章','各项赛事 5 连胜'],
  rout:['蹂躏者','单场净胜 5 球以上'],
  derby:['宿命的终结者','赢下与宿敌的对决'],
  pens:['十二码的死神','赢下一场点球大战'],
  giant:['巨人杀手','以乙级球队身份在杯赛淘汰甲级球队'],
  cup:['王者之杯',`夺得${CUP_NAME}`],
  promo:['从深渊归来之人','从乙级升入甲级'],
  champ:['天下布武','夺得甲级联赛冠军'],
  double:['双冠之王',`同一赛季夺得甲级冠军和${CUP_NAME}`],
  awaken:['觉醒之时','有球员觉醒'],
  cheat:['禁忌的窥视者','发动禁断之牌'],
  deal:['黄金交易人','以 200 万以上卖出球员'],
  vet:['老兵不死','执教满 5 个赛季'],
  academy:['青训之光','青训出身的球员能力达到 75']
};

// the once-per-season cheat card: display name, and [name, description] per effect
const CHEAT_CASH=150;
const HT_REST=.15;  // halftime: our players on the pitch get back this share of the stamina they've lost (at least 2)
const CHEAT_CARD='禁断之牌';
const CHEAT_INFO={
  redo:['时之逆流','令刚刚结束的一战归于虚无，从开球重来'],
  heal:['不死鸟之炎','全员体能燃至巅峰，伤病与停赛尽数焚尽'],
  scout:['真理之瞳','看穿市场上每个人隐藏的真实潜力'],
  cash:['黄金契约',`与神秘财团缔约，换来 ${CHEAT_CASH} 万资金`]
};
/* names: the big lists (Chinese surnames and given names, Western surnames, Japanese names) are in names.js, built
   from a public corpus; these hand-made ones add local flavour and cover what the corpus lacks */
const CN_COMP=['欧阳','司徒','上官','诸葛','东方','慕容','司马','皇甫','公孙','端木','令狐','夏侯'];
const GIV=[  // Hong Kong / Malaysian-Chinese style
  '志豪','伟杰','俊宏','家明','子轩','嘉乐','振宇','国良','文杰','浩然','建华','耀祖','天佑','启明','永康','智勇','俊彦','家豪',
  '伟诚','嘉俊','子健','立仁','宏达','冠霖','柏宇','承恩','博文','俊杰','浩轩','明辉','志强','伟铭','建邦','昊天','子豪','家伟',
  '凯文','文龙','世杰','振华','国伟','晋豪','炜霖','俊贤','锦荣','达明','鸿亮','宇轩','思远','子谦','卓然','嘉诚','永健','敬恒'];
const MALAY_F=['阿兹兰','哈菲兹','法伊兹','沙菲克','伊尔凡','阿米尔','达尼尔','莫哈末','卡立','依斯迈','祖海里','诺丁','拉希德','萨夫万','阿迪','法里斯',
  '哈基米','赛夫丁','阿克马尔','纳兹里','鲁斯兰','扎基','海鲁','阿里夫','伊扎特','奥马尔','苏海米','阿兹哈','费萨尔','哈里斯','伊克巴尔','卡迈鲁丁',
  '纳吉布','拉兹兰','沙鲁丁','苏库里','瓦希德','尤努斯','扎因','阿斯拉夫','巴哈鲁丁','法德利','希扎姆','伊赫桑','穆希丁','纳斯鲁拉','里德万','萨布里'];
const MALAY_L=['阿都拉','哈密','拉曼','优素福','卡林','沙列','依布拉欣','苏莱曼','哈山','阿末','再纳','哈伦','扎卡里亚','萨利','达乌','阿兹米',
  '伊斯迈','诺丁','阿兹兹','莫哈末','卡迪尔','加法','拉希德','阿旺','莫克塔','乌斯曼','贾马鲁丁','依德里斯','曼索','哈希姆','沙姆苏丁','雅谷'];
const INDIAN_F=['拉吉','库马尔','维杰','苏雷什','加内什','普拉卡什','阿伦','迪内什','萨尔万','卡蒂克','拉维','希瓦',
  '桑杰','维克拉姆','阿南德','普雷姆','莫汉','巴拉','德瓦','哈里','基尚','马尼','纳文','拉梅什','萨西','塔伦','乌代','维诺德'];
const INDIAN_L=['拉马萨米','克里希南','穆鲁甘','皮莱','纳伊杜','塞尔瓦拉','戈帕尔','苏潘','维鲁',
  '萨米','纳拉扬','苏布拉马尼亚姆','拉贾','切蒂亚尔','梅农','奈尔','帕拉尼','坎南','阿鲁穆甘','佩鲁马尔','辛格'];
// first names for players from abroad; their surnames come from EU_SUR in names.js
const WEST_F=['卡洛斯','马特乌斯','若昂','迭戈','伊万','安德烈','拉斐尔','奥斯卡','卢卡斯','马可','托马斯','尼古拉','达维德','塞尔吉奥',
  '保罗','佩德罗','米格尔','哈维尔','费尔南多','安东尼奥','路易斯','曼努埃尔','丹尼尔','亚历山大','马丁','费利佩','布鲁诺','蒂亚戈',
  '雨果','莱昂','菲利普','扬','埃里克','斯特凡','卢卡','马蒂亚斯','约纳斯','西蒙','安德烈亚斯','维克托','德扬','米兰','弗拉基米尔',
  '马里奥','法比奥','罗伯托','洛伦佐','安德斯','拉斯','奥利弗','亨里克','塞巴斯蒂安','伊戈尔','基里尔','阿德里安','埃米尔','恩佐','马克西姆'];
const KR_SUR='金李朴崔郑姜赵尹张林韩吴徐申权黄安宋'.split('');
const KR_GIV=['敏俊','志勋','在成','永宰','宇镇','成龙','贤宇','东旭','俊浩','泰熙','承佑','载勋','相民','民浩','炫宇','智焕','秀英','钟国',
  '正焕','泰勇','柱亨','胜佑','允成','熙灿','在锡','成焕','东元','俊秀','奎贤','宰赫'];
// match commentary; n = shooter / player, k = the opposing goalkeeper
const GOAL=[
  n=>`${n}：「这一击，名为终结。」——球应声入网！`,
  n=>`${n} 的右脚燃起黑炎，一记远射撕裂了球网！`,
  n=>`${n} 跃向苍穹，以神之额头将球砸进大门！`,
  n=>`混沌的禁区中，${n} 捕捉到命运的缝隙，补射得手！`,
  n=>`${n} 单骑突入，宛如孤狼，冷静地终结了一切！`,
  n=>`${n} 低语「领域展开」，皮球划出不可能的弧线钻入死角！`,
  n=>`时间仿佛静止——${n} 的凌空斩，球进了！`,
  n=>`${n} 解放了封印的左脚，门将只能目送球飞入网窝！`
];
const SAVE=[
  (n,k)=>`${n} 的必杀射门，被 ${k} 以「绝对领域」扑出！`,
  (n,k)=>`${k} 的指尖化作铁壁，${n} 的射门被挡了出来！`,
  (n,k)=>`${n} 势在必得的一击……${k}：「这里，禁止通行。」`,
  (n,k)=>`${k} 预判了命运，飞身将 ${n} 的射门托出横梁！`,
  (n,k)=>`${k} 双拳如锤，将 ${n} 的炮弹击飞！`
];
// tackles, interceptions, dribbles and killer passes that make the live commentary
const FLAIR={
  tkl:[n=>`${n} 一记精准的滑铲，将对手的进攻扼杀于萌芽！`,n=>`${n} 贴身缠斗，硬生生把球夺了回来！`,n=>`${n} 化身铁壁，干净利落地断下了球。`,
    n=>`${n}：「这里是我的领域。」——抢断成功！`],
  int:[n=>`${n} 看穿了对手的传球路线，拦截！`,n=>`${n} 仿佛预知了未来，伸脚截下了这脚传球。`,n=>`${n} 在空中截住了那记长传，危机解除。`],
  drb:[n=>`${n} 连续变向，像一阵风般晃过了两名防守球员！`,n=>`${n} 一个踩单车戏耍了对手，人球分过！`,n=>`${n} 的盘带宛如舞蹈，对方防线被搅得天翻地覆。`,
    n=>`${n} 背身扣球转身，甩开了紧逼的后卫！`],
  kp:[n=>`${n} 一脚手术刀般的直塞，撕开了对方防线！`,n=>`${n} 送出一记贴地斜传，队友差一点就能推射！`,n=>`${n} 的长传跨越半个球场，精准地找到了前插的队友！`,
    n=>`${n} 用一记脚后跟妙传点燃了进攻！`]
};
const MISS=[
  n=>`${n} 的射门偏离了命运的轨道，稍稍高出`,
  n=>`${n} 一脚劲射轰中门柱，大地为之震颤！`,
  n=>`${n} 的头球消失在天际`,
  n=>`${n} 的射门被后卫以肉身之盾封堵`,
  n=>`${n} 拔刀太早，球滚出了底线`
];
const LINE={
  kickoff:(h,a)=>`宿命的对决开始了。${h} 在主场迎战 ${a}！`,
  half:(hg,ag)=>`上半场的战斗落幕，比分 ${hg} : ${ag}。`,
  full:(hg,ag)=>`终焉之笛响起！${hg} : ${ag}`,
  yellow:(n,t)=>`${n}（${t}）被裁判之眼锁定，吃到一张黄牌`,
  ban:`，黄牌之印已集满 ${YC_BAN} 枚，下一轮将被放逐`,
  red:(n,t)=>`${n}（${t}）第二张黄牌！审判降临，红牌罚下！`,
  injury:n=>`${n} 倒在了战场上……看起来伤得不轻`,
  injSub:(o,i)=>`${o} 无法坚持，被担架抬下。${i} 紧急登场！`,
  injStay:n=>`换人名额已用尽，${n} 只能咬牙坚持。`,
  knock:n=>`${n} 倒地，理疗师冲进场内……只是轻伤，他站起来了！`,
  friendlyKick:(h,a)=>`季前友谊赛：${h} 对阵 ${a}。不计成绩，正好磨合阵容。`,
  tiredSub:(o,i)=>`${o} 体力透支，${i} 替补登场，注入新的力量！`,
  derbyKick:(h,a)=>`宿敌之战！${h} 与 ${a} 之间，今日必须做个了断！`,
  cupKick:(h,a,st)=>`${CUP_NAME}${st}，${h} 对阵 ${a}。败者，将就此退场。`,
  sigGoal:(n,s)=>`${n} 咆哮：「${s}！」——必杀技炸裂，球进了！`,
  sigSave:(k,s,n)=>`${k} 发动「${s}」！${n} 的射门被完全封印！`,
  sub:(o,i)=>`${i} 替换 ${o} 登场：「接下来，交给我吧。」`,
  awaken:n=>`${n} 体内沉睡的力量觉醒了！`,
  pensStart:'九十分钟无法分出胜负——点球大战，开始！',
  penIn:(n,t)=>`${n}（${t}）主罚——命中！`,
  penMiss:(n,k)=>k?`${n} 的点球被 ${k} 扑出！`:`${n} 一脚踢飞了点球！`,
  pensEnd:(hp,ap,w)=>`点球大战 ${hp} : ${ap}，${w} 晋级！`,
  win:'凯旋！',lose:'败北……',draw:'胜负未分'
};

const MF0={pos:'all',age:'all',sort:'ovr'};
let S=null, M=null, UI={tab:'home',view:'main',mf:{...MF0}};
let usedNames=new Set();  // not saved; rebuilt from S by indexNames()
// matches run on a seeded rng saved at kickoff, so reloading mid-match replays the same match instead of rerolling it
const seeded=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
let rng=Math.random;
const rnd=(a,b)=>a+rng()*(b-a);
const ri=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(rng()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const money=x=>'RM '+(Math.abs(x)>=100?Math.round(x):(Math.round(x*10)/10))+' 万';
