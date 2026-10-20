/* ================= 配置与数值：建筑、等级、任务、交易 ================= */
let W=24,H=16;const T=16,KEY='qingchuan-town-v1';
const SIZES=[{n:'小',w:24,h:16},{n:'中',w:34,h:22},{n:'大',w:46,h:30}];
const KINDS={valley:{n:'河谷',e:'🏞️',d:'一条河穿过平原，树林和岩石都有，最均衡。'},lakes:{n:'湖区',e:'🎣',d:'好几个大湖，农场和渔屋很好发展，但岩石少，石头要省着用。'},forest:{n:'密林',e:'🌲',d:'到处是森林，木材多到用不完，但要先砍出空地才能盖房子。'},hills:{n:'山地',e:'⛰️',d:'岩石遍布，石头很充足，但水源少，粮食是最大的难题。'}};
const SEASON_DAYS=30,DAY_MS=5000;
const SN=['春','夏','秋','冬'],SICON=['🌸','☀️','🍂','❄️'];
const N4=[[0,-1],[1,0],[0,1],[-1,0]];
const RI={coins:'💰',wood:'🪵',stone:'🪨',food:'🌾',silk:'🧵',cloth:'🧣',wine:'🍶',porcelain:'🏺'};
const RN={coins:'金币',wood:'木材',stone:'石头',food:'粮食',silk:'蚕丝',cloth:'布',wine:'酒',porcelain:'瓷器'};
const STORED=['wood','stone','food','silk','cloth','wine','porcelain'];  // goods limited by warehouse capacity
const HN=['木屋','砖房','宅院','公寓'];
const HCAP=[4,8,14,20],HTAX=[.2,.35,.55,.8],HHEAT=[.3,.45,.6,.75];
const CLOTH_PER=.04,LV4_RANK=5,WINE_RANK=6,KILN_RANK=7;
// what a 外贸公司 ships out each day, in order: [good, coins each, amount the town keeps]
const EXPORTS=[['porcelain',15,0],['cloth',7,30],['wine',6,30]],EXPORT_PER_DAY=3;  // cloth each 公寓 resident uses a day; town rank that allows 公寓
const HUP=[{wood:15,stone:10,coins:20},{wood:20,stone:30,coins:50},{wood:30,stone:40,coins:100,cloth:10}];  // cost to buy a house's next level outright

const B={
  road:{n:'道路',cost:{coins:2},rank:0,cat:0,desc:'民居和需要工人的建筑要靠道路连到市政厅才能运作。电脑上可以按住鼠标拖动连续铺路。'},
  bridge:{n:'桥',cost:{wood:8,coins:4},rank:0,cat:0,desc:'只能建在水上，像道路一样把两岸连起来。'},
  house:{n:'民居',cost:{wood:10},rank:0,cat:1,desc:'居民住的地方。附近服务越齐全，居民会自己把房子升级成砖房、宅院，住更多人、交更多税。'},
  farm:{n:'农场',cost:{wood:12,coins:8},workers:3,rank:0,cat:2,up:{cost:{wood:18,coins:12,stone:10},workers:4,d:'产量 ×1.5'},desc:'生产粮食。紧挨着水产量更高。秋天产量最高，冬天停产。2 格内有水井也算有灌溉。'},
  lumber:{n:'伐木场',cost:{coins:15,wood:5},workers:2,rank:0,cat:2,up:{cost:{coins:22,wood:8,stone:10},workers:3,d:'产量 ×1.5'},noise:4,desc:'2 格内的树越多，木材产量越高（每棵树 0.5，最多 3.5）。会吵到 2 格内的民居（幸福度 −4）。'},
  quarry:{n:'采石场',cost:{wood:15},workers:3,rank:0,cat:2,need:'rock',up:{cost:{wood:22,stone:10},workers:4,d:'产量 ×1.5'},noise:8,desc:'必须紧挨着岩石。周围 8 格的岩石越多，产量越高（最多 3）。会吵到 2 格内的民居（幸福度 −8）。'},
  well:{n:'水井',cost:{stone:6,coins:5},rank:0,cat:3,r:3,svc:'water',up:{cost:{stone:15,coins:8},r:4,d:'供水半径 3 → 4'},desc:'为 3 格内的民居供水。民居升级必备。不用连路。2 格内的农场有灌溉，产量 +1。'},
  store:{n:'仓库',cost:{wood:20},rank:0,cat:0,up:{cost:{wood:30,stone:15},d:'储存上限 +150 → +300'},desc:'木材、石头、粮食的储存上限各 +150。冬天前很需要。不用连路。'},
  plant:{n:'种树',cost:{coins:3},rank:0,cat:4,desc:'在空地上种一棵树。伐木场旁边多种树可以提高产量。'},
  fish:{n:'渔屋',cost:{wood:15},workers:2,rank:1,cat:2,need:'water',up:{cost:{wood:22,stone:10},workers:3,d:'产量 ×1.5'},desc:'必须紧挨着水。2 格内的水面越多，产量越高（每格 0.5，最多 3）。和别的渔屋范围重叠的水面要平分。四季都能捕鱼，冬天结冰产量打 6 折。和农场同时运作，全镇幸福度 +5。'},
  market:{n:'市场',cost:{wood:20,stone:10},workers:4,rank:1,cat:3,desc:'镇上有一座运作中的市场，民居才能升级。每天另赚 3 金币，还能在侧栏买卖材料。'},
  bakery:{n:'面包房',cost:{wood:20,stone:10,coins:15},workers:3,rank:1,cat:3,desc:'每天用 2 粮食烤面包。每座供应 40 位居民，吃上面包的居民越多，全镇幸福度加得越多（最多 +5）。'},
  tea:{n:'茶馆',cost:{wood:25,stone:15,coins:30},workers:3,rank:2,cat:3,r:4,svc:'tea',desc:'4 格内的居民更开心。每天另赚 2 金币。被公园、茶馆、神庙、饭店中两种覆盖的民居进入幸福网，幸福度再 +5。'},
  park:{n:'公园',cost:{coins:25},rank:1,cat:3,r:3,svc:'park',upkeep:.5,up:{cost:{coins:38,stone:10},r:4,d:'覆盖半径 3 → 4'},desc:'3 格内的居民更开心。是宅院的升级条件之一。不用连路。被公园、茶馆、神庙、饭店中两种覆盖的民居进入幸福网，幸福度再 +5。'},
  school:{n:'学校',cost:{wood:20,stone:30,coins:40},workers:4,rank:2,cat:3,seats:120,upkeep:1,desc:'提供 120 个学位（缺工人时按比例减少），不用管放在哪里。砖房要有学位才能升级成宅院，宅院和公寓也要有学位才能维持。'},
  workshop:{n:'工坊',cost:{wood:15,stone:20},workers:2,rank:2,cat:2,up:{cost:{wood:22,stone:30},workers:4,d:'每天加工 2 份：2 木材 + 2 石头 → 12 金币'},noise:6,desc:'每天把 1 木材和 1 石头加工成 6 金币。用来消化多余的材料。会吵到 2 格内的民居（幸福度 −6）。'},
  temple:{n:'神庙',cost:{stone:50,coins:60},workers:3,rank:3,cat:3,r:6,svc:'temple',upkeep:1,desc:'6 格内的居民幸福感大增，也能代替公园让砖房升级。被公园、茶馆、神庙、饭店中两种覆盖的民居进入幸福网，幸福度再 +5。'},
  tower:{n:'钟楼',cost:{stone:120,wood:80,coins:300},rank:4,cat:5,unique:1,desc:'小镇的地标，只能建一座。全镇幸福度 +10。不用连路。'},
  mulberry:{n:'养蚕场',cost:{wood:20,coins:30},workers:3,rank:5,cat:2,up:{cost:{wood:30,stone:10,coins:45},workers:4,d:'产量 ×1.5'},desc:'种桑养蚕，每天产 3 蚕丝。夏天产量更高，冬天停产。'},
  weave:{n:'纺织厂',cost:{wood:30,stone:20,coins:40},workers:4,rank:5,cat:2,noise:4,up:{cost:{wood:45,stone:30,coins:60},workers:6,d:'每天加工 2 份：4 蚕丝 → 6 布'},desc:'每天把 2 蚕丝织成 3 布。公寓的居民每天都要用布。会吵到 2 格内的民居（幸福度 −4）。'},
  winery:{n:'酒厂',cost:{wood:30,stone:30,coins:60},workers:3,rank:6,cat:2,desc:'每天用 3 粮食酿 2 酒。'},
  tavern:{n:'饭店',cost:{wood:40,stone:40,coins:100},workers:4,rank:6,cat:3,r:5,svc:'tavern',desc:'每天用 1 酒。5 格内的居民幸福度大增，公寓交的税 +25%。每天另赚 4 金币。没酒时暂停营业。被公园、茶馆、神庙、饭店中两种覆盖的民居进入幸福网，幸福度再 +5。'},
  kiln:{n:'陶瓷厂',cost:{wood:40,stone:60,coins:80},workers:4,rank:7,cat:2,noise:6,desc:'每天用 2 石头和 1 木材烧出 1 瓷器。会吵到 2 格内的民居（幸福度 −6）。'},
  firm:{n:'外贸公司',cost:{wood:50,stone:30,coins:150},workers:3,rank:7,cat:3,desc:'每天把最多 3 件货卖到外地：先卖瓷器（每件 15 金币），再卖超过 30 的布（每件 7）和酒（每件 6），留够镇上自己用。'},
  uni:{n:'大学',cost:{coins:300},workers:6,builders:6,seats:400,rank:8,cat:5,unique:1,
    stages:[{cost:{stone:150,wood:120,coins:600},days:10},{cost:{stone:150,porcelain:20,coins:900},days:10},{cost:{cloth:40,wine:20,coins:1200},days:10}],
    desc:'大工程，分 3 期施工：每期先投入材料，再由 6 个工人干 10 天。建成后要 6 个教职工：提供 400 个学位，全镇税收 +10%。'},
  spire:{n:'观光塔',cost:{coins:400},workers:4,builders:6,rank:8,cat:5,unique:1,
    stages:[{cost:{stone:200,wood:150,coins:800},days:10},{cost:{stone:200,porcelain:30,coins:1200},days:10},{cost:{coins:2000},days:10}],
    desc:'大工程，分 3 期施工：每期先投入材料，再由 6 个工人干 10 天。建成后要 4 个工人：全镇幸福度 +10，游客每天带来 20 金币。'},
  lab:{n:'研究所',cost:{wood:40,stone:60,coins:200},workers:4,rank:4,cat:3,unique:1,desc:'有人上班才能研究科技。点研究所选要研究的项目：先付钱，再按天数研究，完成后永久生效。'},
  hall:{n:'市政厅',desc:'小镇的中心，每天收入 2 金币。所有道路都要从这里连出去。'}
};
const ORDER=['road','bridge','house','store','farm','fish','lumber','quarry','workshop','mulberry','weave','winery','kiln','well','market','bakery','tea','tavern','firm','park','school','temple','lab','plant','tower','uni','spire'];
const NOISE_R=2;  // how far industry noise reaches
const UP_RANK=2;  // town rank that unlocks building upgrades (houses upgrade on their own)
// policies cost coins every day while switched on (base + per resident); winter ones only charge in winter
const POLICIES={
  clinic:{n:'免费诊所',rank:2,base:5,per:.08,d:'全镇幸福度 +5'},
  heating:{n:'冬季供暖补贴',rank:2,base:5,per:.06,winter:1,d:'冬天取暖用的木材减半，只在冬天扣钱'},
  overtime:{n:'加班补贴',rank:3,base:8,per:.12,d:'农场、渔屋、伐木场、采石场、养蚕场产量 +15%，但幸福度 −3'}
};
// research at the 研究所: pay up front, then it takes `days` staffed days
const TECHS={
  seeds:{n:'良种',cost:500,days:15,rank:4,d:'农场产量 +20%'},
  cold:{n:'冷藏',cost:400,days:10,rank:4,d:'冬天渔屋不再减产'},
  stove:{n:'节能炉灶',cost:600,days:12,rank:4,d:'取暖用的木材 −25%'},
  drill:{n:'机械采石',cost:700,days:15,rank:4,d:'采石场产量 +25%'},
  edu:{n:'现代教育',cost:1000,days:20,rank:4,d:'学校和大学的学位 +50%'},
  loom:{n:'新式织机',cost:800,days:15,rank:5,d:'纺织厂用同样的蚕丝多织 25% 的布'},
  brew:{n:'酿造工艺',cost:1000,days:20,rank:6,d:'酒厂用同样的粮食多酿 50% 的酒'},
  glaze:{n:'釉料改良',cost:1500,days:20,rank:7,d:'陶瓷厂用同样的材料多烧 50% 的瓷器'}
};
const RANKS=[
  {n:'拓荒地',pop:0},
  {n:'小村庄',pop:15,reward:{coins:80}},
  {n:'村镇',pop:45,reward:{coins:150}},
  {n:'小镇',pop:100,reward:{coins:250}},
  {n:'城镇',pop:180,reward:{coins:400}},
  {n:'繁华之城',pop:300,reward:{coins:600}},
  {n:'小城市',pop:500,reward:{coins:900}},
  {n:'大城市',pop:800,reward:{coins:1200}},
  {n:'大都市',pop:1200,reward:{coins:1600}}
];
const QUESTS=[
  {t:'建 2 栋民居',c:()=>cnt('house')>=2,p:()=>`${cnt('house')}/2`,r:{wood:15}},
  {t:'建一座农场，并用道路连上',c:()=>connCnt('farm')>=1,r:{food:20}},
  {t:'人口达到 8',c:()=>popTotal()>=8,p:()=>`${popTotal()}/8`,r:{coins:40}},
  {t:'建一座伐木场',c:()=>connCnt('lumber')>=1,r:{wood:20}},
  {t:'建一座采石场',c:()=>connCnt('quarry')>=1,r:{stone:15}},
  {t:'建一口水井',c:()=>connCnt('well')>=1,r:{coins:30}},
  {t:'人口达到 15',c:()=>popTotal()>=15,p:()=>`${popTotal()}/15`,r:{coins:50}},
  {t:'建一座市场',c:()=>connCnt('market')>=1,r:{stone:20}},
  {t:'让一栋民居升级成砖房',c:()=>lvCnt(2)>=1,r:{wood:30,coins:40}},
  {t:'熬过第一个冬天',c:()=>S.day>=SEASON_DAYS*4,p:()=>`第 ${Math.min(S.day,SEASON_DAYS*4)}/${SEASON_DAYS*4} 天`,r:{coins:80},bg:1},
  {t:'人口达到 45',c:()=>popTotal()>=45,p:()=>`${popTotal()}/45`,r:{coins:80}},
  {t:'建一所学校',c:()=>connCnt('school')>=1,r:{coins:60}},
  {t:'让一栋砖房升级成宅院',c:()=>lvCnt(3)>=1,r:{coins:120}},
  {t:'幸福度达到 75',c:()=>S.happy>=75,p:()=>`${Math.round(S.happy)}/75`,r:{coins:100}},
  {t:'拥有 5 栋宅院',c:()=>lvCnt(3)>=5,p:()=>`${lvCnt(3)}/5`,r:{coins:200}},
  {t:'人口达到 100',c:()=>popTotal()>=100,p:()=>`${popTotal()}/100`,r:{coins:150}},
  {t:'建一座神庙',c:()=>connCnt('temple')>=1,r:{stone:40}},
  {t:'人口达到 180',c:()=>popTotal()>=180,p:()=>`${popTotal()}/180`,r:{coins:250}},
  {t:'建成钟楼',c:()=>cnt('tower')>=1,r:{coins:300}},
  {t:'人口达到 300',c:()=>popTotal()>=300,p:()=>`${popTotal()}/300`,r:{coins:500}},
  {t:'建一座养蚕场',c:()=>connCnt('mulberry')>=1,r:{coins:150}},
  {t:'建一座纺织厂',c:()=>connCnt('weave')>=1,r:{coins:150}},
  {t:'攒下 30 布',c:()=>S.res.cloth>=30,p:()=>`${Math.floor(S.res.cloth)}/30`,r:{coins:200}},
  {t:'让一栋宅院升级成公寓',c:()=>lvCnt(4)>=1,r:{coins:300}},
  {t:'拥有 5 座公寓',c:()=>lvCnt(4)>=5,p:()=>`${lvCnt(4)}/5`,r:{coins:400}},
  {t:'人口达到 500',c:()=>popTotal()>=500,p:()=>`${popTotal()}/500`,r:{coins:600}},
  {t:'建一座酒厂',c:()=>connCnt('winery')>=1,r:{coins:200}},
  {t:'建一座饭店',c:()=>connCnt('tavern')>=1,r:{coins:250}},
  {t:'攒下 30 酒',c:()=>S.res.wine>=30,p:()=>`${Math.floor(S.res.wine)}/30`,r:{coins:250}},
  {t:'人口达到 800',c:()=>popTotal()>=800,p:()=>`${popTotal()}/800`,r:{coins:900}},
  {t:'建一座陶瓷厂',c:()=>connCnt('kiln')>=1,r:{coins:300}},
  {t:'建一座外贸公司',c:()=>connCnt('firm')>=1,r:{coins:300}},
  {t:'外贸公司累计赚到 1000 金币',c:()=>(S.exported||0)>=1000,p:()=>`${Math.floor(S.exported||0)}/1000`,r:{stone:100}},
  {t:'人口达到 1200',c:()=>popTotal()>=1200,p:()=>`${popTotal()}/1200`,r:{coins:1500}},
  {t:'建成大学',c:()=>Object.values(S.b).some(b=>b.type==='uni'&&b.built),r:{coins:1000}},
  {t:'建成观光塔',c:()=>Object.values(S.b).some(b=>b.type==='spire'&&b.built),r:{coins:1500}},
  {t:'人口达到 1500',c:()=>popTotal()>=1500,p:()=>`${popTotal()}/1500`,r:{coins:2000}}
];

const TRADE=[{g:{porcelain:10},r:{coins:120},rank:KILN_RANK},{g:{wine:10},r:{coins:50},rank:WINE_RANK},{g:{silk:10},r:{coins:25},rank:LV4_RANK},{g:{cloth:10},r:{coins:60},rank:LV4_RANK},{g:{coins:25},r:{wood:10}},{g:{coins:35},r:{stone:10}},{g:{coins:20},r:{food:10}},{g:{wood:10},r:{coins:10}},{g:{stone:10},r:{coins:14}},{g:{food:10},r:{coins:8}}];
const TRADES=[{g:{wood:30},r:{coins:45}},{g:{coins:40},r:{food:45}},{g:{stone:20},r:{coins:40}},{g:{coins:50},r:{stone:25}},{g:{food:40},r:{coins:35}},{g:{coins:35},r:{wood:35}},{g:{food:30},r:{wood:30}}];
