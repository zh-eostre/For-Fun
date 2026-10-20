/* ================= 配置与数值：建筑、等级、任务、交易 ================= */
let W=24,H=16;const T=16,KEY='qingchuan-town-v1';
const SIZES=[{n:'小',w:24,h:16},{n:'中',w:34,h:22},{n:'大',w:46,h:30}];
const KINDS={valley:{n:'河谷',e:'🏞️',d:'一条河穿过平原，树林和岩石都有，最均衡。'},lakes:{n:'湖区',e:'🎣',d:'好几个大湖，农场和渔屋很好发展，但岩石少，石头要省着用。'},forest:{n:'密林',e:'🌲',d:'到处是森林，木材多到用不完，但要先砍出空地才能盖房子。'},hills:{n:'山地',e:'⛰️',d:'岩石遍布，石头很充足，但水源少，粮食是最大的难题。'}};
const SEASON_DAYS=30,DAY_MS=5000;
const SN=['春','夏','秋','冬'],SICON=['🌸','☀️','🍂','❄️'];
const N4=[[0,-1],[1,0],[0,1],[-1,0]];
const RI={coins:'💰',wood:'🪵',stone:'🪨',food:'🌾'};
const RN={coins:'金币',wood:'木材',stone:'石头',food:'粮食'};
const HN=['木屋','砖房','宅院'];
const HCAP=[4,8,14],HTAX=[.2,.35,.55],HHEAT=[.3,.45,.6];
const HUP=[{wood:15,stone:10,coins:20},{wood:20,stone:30,coins:50}];  // cost to buy a house's next level outright

const B={
  road:{n:'道路',cost:{coins:2},rank:0,cat:0,desc:'民居和需要工人的建筑要靠道路连到市政厅才能运作。电脑上可以按住鼠标拖动连续铺路。'},
  bridge:{n:'桥',cost:{wood:8,coins:4},rank:0,cat:0,desc:'只能建在水上，像道路一样把两岸连起来。'},
  house:{n:'民居',cost:{wood:10},rank:0,cat:1,desc:'居民住的地方。附近服务越齐全，居民会自己把房子升级成砖房、宅院，住更多人、交更多税。'},
  farm:{n:'农场',cost:{wood:12,coins:8},workers:3,rank:0,cat:2,up:{cost:{wood:18,coins:12,stone:10},workers:4,d:'产量 ×1.5'},desc:'生产粮食。紧挨着水产量更高。秋天产量最高，冬天停产。'},
  lumber:{n:'伐木场',cost:{coins:15,wood:5},workers:2,rank:0,cat:2,up:{cost:{coins:22,wood:8,stone:10},workers:3,d:'产量 ×1.5'},desc:'2 格内的树越多，木材产量越高（每棵树 0.5，最多 3.5）。'},
  quarry:{n:'采石场',cost:{wood:15},workers:3,rank:0,cat:2,need:'rock',up:{cost:{wood:22,stone:10},workers:4,d:'产量 ×1.5'},desc:'必须紧挨着岩石。周围 8 格的岩石越多，产量越高（最多 3）。'},
  well:{n:'水井',cost:{stone:6,coins:5},rank:0,cat:3,r:3,svc:'water',up:{cost:{stone:15,coins:8},r:4,d:'供水半径 3 → 4'},desc:'为 3 格内的民居供水。民居升级必备。不用连路。'},
  store:{n:'仓库',cost:{wood:20},rank:0,cat:0,up:{cost:{wood:30,stone:15},d:'储存上限 +150 → +300'},desc:'木材、石头、粮食的储存上限各 +150。冬天前很需要。不用连路。'},
  plant:{n:'种树',cost:{coins:3},rank:0,cat:4,desc:'在空地上种一棵树。伐木场旁边多种树可以提高产量。'},
  fish:{n:'渔屋',cost:{wood:15},workers:2,rank:1,cat:2,need:'water',up:{cost:{wood:22,stone:10},workers:3,d:'产量 ×1.5'},desc:'必须紧挨着水。2 格内的水面越多，产量越高（每格 0.5，最多 3）。和别的渔屋范围重叠的水面要平分。四季都能捕鱼，冬天结冰产量打 6 折。和农场同时运作，全镇幸福度 +5。'},
  market:{n:'市场',cost:{wood:20,stone:10},workers:4,rank:1,cat:3,desc:'镇上有一座运作中的市场，民居才能升级。每天另赚 3 金币，还能在侧栏买卖材料。'},
  bakery:{n:'面包房',cost:{wood:20,stone:10,coins:15},workers:3,rank:1,cat:3,desc:'每天用 2 粮食烤面包。每座供应 40 位居民，吃上面包的居民越多，全镇幸福度加得越多（最多 +5）。'},
  tea:{n:'茶馆',cost:{wood:25,stone:15,coins:30},workers:3,rank:2,cat:3,r:4,svc:'tea',desc:'4 格内的居民更开心。每天另赚 2 金币。'},
  park:{n:'公园',cost:{coins:25},rank:1,cat:3,r:3,svc:'park',upkeep:.5,up:{cost:{coins:38,stone:10},r:4,d:'覆盖半径 3 → 4'},desc:'3 格内的居民更开心。是宅院的升级条件之一。不用连路。'},
  school:{n:'学校',cost:{wood:20,stone:30,coins:40},workers:4,rank:2,cat:3,r:5,svc:'school',upkeep:1,desc:'5 格内的砖房才能升级成宅院。'},
  workshop:{n:'工坊',cost:{wood:15,stone:20},workers:2,rank:2,cat:2,up:{cost:{wood:22,stone:30},workers:4,d:'每天加工 2 份：2 木材 + 2 石头 → 12 金币'},desc:'每天把 1 木材和 1 石头加工成 6 金币。用来消化多余的材料。'},
  temple:{n:'神庙',cost:{stone:50,coins:60},workers:3,rank:3,cat:3,r:6,svc:'temple',upkeep:1,desc:'6 格内的居民幸福感大增，也能代替公园让砖房升级。'},
  tower:{n:'钟楼',cost:{stone:120,wood:80,coins:300},rank:4,cat:5,unique:1,desc:'小镇的地标，只能建一座。全镇幸福度 +10。不用连路。'},
  hall:{n:'市政厅',desc:'小镇的中心，每天收入 2 金币。所有道路都要从这里连出去。'}
};
const ORDER=['road','bridge','house','store','farm','fish','lumber','quarry','workshop','well','market','bakery','tea','park','school','temple','plant','tower'];
const UP_RANK=2;  // town rank that unlocks building upgrades (houses upgrade on their own)
const RANKS=[
  {n:'拓荒地',pop:0},
  {n:'小村庄',pop:15,reward:{coins:80}},
  {n:'村镇',pop:45,reward:{coins:150}},
  {n:'小镇',pop:100,reward:{coins:250}},
  {n:'城镇',pop:180,reward:{coins:400}},
  {n:'繁华之城',pop:300,reward:{coins:600}}
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
  {t:'人口达到 300',c:()=>popTotal()>=300,p:()=>`${popTotal()}/300`,r:{coins:500}}
];

const TRADE=[{g:{coins:25},r:{wood:10}},{g:{coins:35},r:{stone:10}},{g:{coins:20},r:{food:10}},{g:{wood:10},r:{coins:10}},{g:{stone:10},r:{coins:14}},{g:{food:10},r:{coins:8}}];
const TRADES=[{g:{wood:30},r:{coins:45}},{g:{coins:40},r:{food:45}},{g:{stone:20},r:{coins:40}},{g:{coins:50},r:{stone:25}},{g:{food:40},r:{coins:35}},{g:{coins:35},r:{wood:35}},{g:{food:30},r:{wood:30}}];
