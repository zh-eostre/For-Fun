/* ---------- constants, shared state, small helpers ---------- */
const KEY='lvyin-fm-v1';  // localStorage key; kept as-is so old saves are still found
const SAVE_V=24;         // bump when the save format changes, and add a step to MIGRATE in engine.js
// a club's base strength (its typical best-XI level) from its 底蕴: 98 → 84, 86 → 80, 50 → 68, 14 → 55
function strFromRep(rep){return Math.round(50+rep*.35)}
const TIERS=[[80,'豪门'],[65,'强队'],[45,'中游'],[0,'弱旅']];
const tierOf=rep=>TIERS.find(([m])=>rep>=m)[1];
// a pyramid of three divisions, fewer clubs at the top (like the real thing): 甲级 12, 乙级 14, 丙级 16.
// each plays a double round robin, so 甲级 has 22 rounds (one every Saturday), 乙级 26 and 丙级 30 (the extra ones on
// Tuesdays). a save from a smaller pyramid grows at the end of a season: more clubs go up, new ones join 丙级
// (promoSlots in engine.js, growLeague in club.js)
const DIVS=['甲级','乙级','丙级'];
const DIV_SIZES=[12,14,16];
// club slots per division. rep (底蕴, 0-100) sets an AI club's target strength and how hard it strengthens;
// it moves with results every season. each new game gives the slots random names from CITY + NICK
const TEAMS=[
  {div:0,color:'#B23A2E',rep:92},{div:0,color:'#1F5F99',rep:86},{div:0,color:'#C9822B',rep:76},{div:0,color:'#2C6E49',rep:72},
  {div:0,color:'#7A5C2E',rep:68},{div:0,color:'#4B4B8F',rep:58},{div:0,color:'#8C2F5A',rep:54},{div:0,color:'#1E7F86',rep:50},
  {div:0,color:'#2A8C8C',rep:40},{div:0,color:'#7B3F00',rep:34},{div:0,color:'#3E5C76',rep:74},{div:0,color:'#9E2A2B',rep:44},
  {div:1,color:'#5E7D2B',rep:56},{div:1,color:'#9C4A1A',rep:44},{div:1,color:'#3D6B8E',rep:40},{div:1,color:'#6B3F7A',rep:36},
  {div:1,color:'#A8862B',rep:32},{div:1,color:'#2F7F6A',rep:30},{div:1,color:'#8E3B46',rep:26},{div:1,color:'#5A4FCF',rep:22},
  {div:1,color:'#54606B',rep:18},{div:1,color:'#B5527A',rep:14},{div:1,color:'#3F7FBF',rep:48},{div:1,color:'#9A5B2E',rep:24},
  {div:1,color:'#4F772D',rep:34},{div:1,color:'#B07D62',rep:16},
  {div:2,color:'#6E8B3D',rep:38},{div:2,color:'#A0522D',rep:34},{div:2,color:'#4682B4',rep:30},{div:2,color:'#8B4789',rep:27},
  {div:2,color:'#B8860B',rep:24},{div:2,color:'#2E8B57',rep:21},{div:2,color:'#A52A2A',rep:19},{div:2,color:'#6A5ACD',rep:17},
  {div:2,color:'#708090',rep:15},{div:2,color:'#C71585',rep:13},{div:2,color:'#5F9EA0',rep:11},{div:2,color:'#8B7355',rep:9},
  {div:2,color:'#556B2F',rep:7},{div:2,color:'#CD5C5C',rep:5},{div:2,color:'#7D8491',rep:10},{div:2,color:'#A26769',rep:3}
].map(t=>({...t,str:strFromRep(t.rep)}));
const SWAP=2;           // clubs promoted from / relegated to the division below, each season, between every pair
// season prize money by final place, per division (万)
const PRIZES=[[500,400,320,260,220,190,165,145,130,120,112,105],[240,200,170,140,120,105,95,85,78,70,64,58,54,50],
  [120,100,85,72,62,55,50,45,41,38,35,32,30,28,26,24]];
const DIV_INCOME=[1,.6,.4];  // lower divisions' gates and bonuses are smaller
// fictional places for club names
const CITY=['青岚','赤崖','白沙湾','雾港','星原','苍木','金穗','碧潭','风鸣','霜城','云岭','落日湾','铁砧','翠谷','银滩','烈风原','月牙泉','黑石','红树林','晨曦','潮汐镇','雷鸣谷','琥珀城','松涛','鹰嘴岩','蓝鲸湾','紫霞','白桦林',
  '玉泉','沧澜','雪峰','枫叶港','砂石镇','灯塔湾','长风','暮云','石榴城','青石滩','火山口','珊瑚礁',
  '芦苇荡','望海','铜陵','桃源','龙脊','寒江','绿洲','花岗'];
// loan destinations outside our league pyramid: [league, club names]
const LOAN_LEAGUES={
  low:['地区联赛',['柳溪竞技','石桥联队','枫林体育会','沙丘矿工','竹湾渔港','松坡青年队','鹿鸣竞技','蓝湖联队']],
  away:['外地联赛',['北原城','南岭联','西川流浪者','东滨竞技','高原雄鹰','河谷联队']],
  abroad:['海外联赛',['北境皇家','南洋星辰','西陆白狼','极光城','暮光港','翡翠海岸']]
};
const NICK=['流星','铁骑','海鹰','石狮','古城','南风','浪潮','犀鸟','猛虎','黑豹','雷霆','飞马','巨鳄','金鹰','烈火','白鲨','野牛','红隼','战象','疾风','银狼','火凤','苍龙','赤狐','冰熊','钢鹰','夜枭','狂狮',
  '游隼','黑熊','雪豹','蓝鲸','角马','灰狼','金狮','铁甲','麒麟','闪电','巨浪','山鹰',
  '白鹭','猎豹','青蛟','骏马','怒涛','锦鲤','玄鸟','狂澜'];
const POS={GK:'门将',DF:'后卫',MF:'中场',FW:'前锋'};
const PO=['GK','DF','MF','FW'];
// players per role; dm / am: how many of the midfielders play as holding (后腰) or attacking (前腰) midfielders
const FORMS={'4-4-2':{GK:1,DF:4,MF:4,FW:2},'4-3-3':{GK:1,DF:4,MF:3,FW:3},'4-2-3-1':{GK:1,DF:4,MF:5,FW:1,dm:2,am:3},
  '4-1-4-1':{GK:1,DF:4,MF:5,FW:1,dm:1},'4-5-1':{GK:1,DF:4,MF:5,FW:1},'4-3-1-2':{GK:1,DF:4,MF:4,FW:2,am:1},
  '3-5-2':{GK:1,DF:3,MF:5,FW:2},'3-4-3':{GK:1,DF:3,MF:4,FW:3},'3-4-2-1':{GK:1,DF:3,MF:6,FW:1,am:2},
  '5-3-2':{GK:1,DF:5,MF:3,FW:2},'5-4-1':{GK:1,DF:5,MF:4,FW:1}};
// a five-man back line, to an AI club, is worth this much less than it plays by its tier (豪门 hardly ever, 强队 now and then)
const FIVE_BACK_COST={豪门:1,强队:.7,中游:.4,弱旅:.4};
// in a match an AI club's shape also follows the matchup: rated FORM_GAP below the opponent (counting FORM_AWAY more
// away from home) it leans FORM_LEAN toward five at the back (half that to a lone striker), FORM_GAP above toward
// three up front (half that to a 前腰)
const FORM_GAP=3,FORM_AWAY=1,FORM_LEAN=.7;
const LINE_NAME={DM:'后腰',AM:'前腰'};
const TACT={def:'防守反击',bal:'平衡',att:'全力进攻'};
// match pace: ms per minute of play, plus ms for each new line of commentary so there's time to read it
const PACE={slow:['慢',260,1800],normal:['正常',150,1000],fast:['快',45,0]};
const TRAIN={rest:['恢复训练','训练日体能 +10，不会通过训练进步'],normal:['常规训练','训练日体能 +4，有一定机会进步'],hard:['高强度加练','训练日体能 +1，进步最快，但疲劳的球员更容易受伤']};
const CARD=.013;   // chance per team per minute of a booking (about 1.2 per team per match)
// chance to retire at the end of a season by age (33-39; 40+ always retires), scaled by ability below
const RETIRE_AGE={33:.08,34:.2,35:.4,36:.6,37:.75,38:.85,39:.95};
// auto lineup rotation: a starter under ROTATE_AT stamina sits out for a fitter man in his position at most
// ROTATE_GAP points worse (and ROTATE_FRESH stamina fresher)
const ROTATE_AT=70,ROTATE_GAP=5,ROTATE_FRESH=15;
// set pieces: the share of goal chances that are a foul in the box (a penalty, scored by the taker about three times
// in four) and of near misses that win a free kick in range (struck at goal, in about one in eight)
const PEN_SHARE=.11,FK_SHARE=.08;
// difficulty, chosen when a game starts: our starting budget and match income, the AI clubs' level (in ability points,
// for their squads at the start and the level they keep to) and our injury risk
const DIFF={
  easy:{name:'轻松',budget:1.5,income:1.25,ai:-2,inj:.7,talent:.5,eyes:1,grab:.3,note:'预算多、收入高，对手稍弱，伤病少'},
  normal:{name:'普通',budget:1,income:1,ai:0,inj:1,talent:.2,eyes:1,grab:.55,note:'标准体验'},
  hard:{name:'困难',budget:.75,income:.85,ai:2,inj:1.25,talent:.05,eyes:2,grab:.8,note:'预算少、收入低，对手更强，伤病多'}};
// talent: the share of the market's prospects with 84+ potential; eyes: young talents a big club sets its sights on in
// a window (rumoured three days before its end); grab: the chance it signs each of them on the window's last day
const diff=()=>DIFF[S&&S.diff]||DIFF.normal;
// the new-player guide: a card at the bottom of the screen, a step per page (tab), shown after a player's first new game
const GUIDE_KEY='lvyin-guide-seen';
const GUIDE=[
  ['home','欢迎来到绿茵经理','你是这支球队的新主教练。「俱乐部」页是你的主页：日程、下一场对手、董事会目标和俱乐部动态都在这里。'],
  ['home','一天一天地过','日程里每一格是一天。点「进入下一天」过一天，点「快进到比赛日」直接到下一场。日程下面选训练：恢复训练回体能，高强度加练进步快但容易累，选了当天就算数。'],
  ['squad','排兵布阵','在「阵容」页选阵型和战术。首发可以交给自动安排（还能开「自动轮换」让累了的主力休息），也可以自己点选。点球员名字看详情，可以设点球手、任意球手，外租或出售。'],
  ['home','比赛日','比赛日点「开始比赛」。比赛中随时可以暂停调整：换人、换阵型、改战术；中场休息有作战会议。比赛速度可以调慢或调快。'],
  ['market','转会市场','季前一周和赛季中段的冬窗才能买卖球员。年轻球员的潜力是球探估计的范围，签下来才知道真实潜力，偶尔能淘到被低估的明珠。'],
  ['fac','设施与青训','用资金升级球探、理疗室、训练场和球场。青训营每个赛季会送来几个少年，好好培养可能出大器。'],
  ['table','升级之路','每个级别前 2 名升级、后 2 名降级。还有全国的天穹杯，甲级前列还能去打天际冠军杯。右上角的「规则」随时可以查看全部规则。祝你好运！']];
// a club's own (its academy, its young players at the start) who never left are loyal after ONE_CLUB seasons; a loyal
// one of ONE_CLUB_OVR or more becomes a 一人一城, and keeps the name. ours: a loyal one turns down clubs' approaches
// half the time; a 一人一城 also lifts the team at home (ONE_CLUB_AURA each, at most ONE_CLUB_AURA_MAX), gets a
// farewell, and selling one costs the manager reputation. at AI clubs only about AI_LOYAL of their own have it in
// them, and those never move, in the summer or to us
const AI_LOYAL=1/3;
const ONE_CLUB_OVR=80,ONE_CLUB=6,ONE_CLUB_AURA=.5,ONE_CLUB_AURA_MAX=1,ONE_CLUB_REFUSE=.5,ONE_CLUB_SALE_REP=3;
const LATE_MIN=85;  // from this minute a goal that wins or levels the match can be a 绝杀 / 绝平
const YC_BAN=3;   // yellow cards in one competition that add up to a one-match ban in it
// player name parts; genName in engine.js combines them
// calendar 3: a season of SEASON_WEEKS weeks, league rounds on Saturdays. 甲级 (22 rounds) plays every Saturday;
// 乙级 (26) and 丙级 (30) add their extra rounds on Tuesdays of weeks without a cup tie (see seasonDays in engine.js;
// on the old 10-club 甲级, 18 rounds, it sat 4 weekends out, on 冠军杯 weeks). cup ties and 冠军杯 matches on Wednesdays: the 天穹杯 final in the week before the
// last league round, the 冠军杯 final in the week after it. a week in which we'd have no match gets a warm-up
// friendly on the Saturday (planWarmups in club.js).
// the day after any of our matches is a rest day, every other day is a training day.
// a season keeps the calendar it began with: 1 (a week per 甲级 round, extra rounds on Tuesdays), 2 (26 weeks, every
// round on a Saturday) or 3
const CAL_V=3,SEASON_WEEKS=22;
// later calendars have more training days a season than calendar 1 (about 75): per-day chances (training growth,
// surprises) are scaled so a season adds up to about what it did
const DAY_SCALE3=.73;  // about 95 training days a season on calendar 3
const dayScale=()=>S.cal>=3?DAY_SCALE3:S.cal>=2?.6:1;
const WEEKDAYS=['周一','周二','周三','周四','周五','周六','周日'];
const DAY_REST=10;   // stamina everyone gets back on a rest day
// per training day, depending on the training setting: stamina change, and chance to improve by 1
const TRAIN_DAY={rest:{cond:10,grow:0},normal:{cond:4,grow:.028},hard:{cond:1,grow:.05}};
const MATCH_GROW=.1;    // chance per match that a player who played improves by 1
const YOUTH_PROVEN=5;   // academy players need this many first-team matches before buyers value their potential

// knockout cup for all our clubs, slotted between league rounds
const CUP_NAME='天穹杯';
// the international cup: 甲级's top three and the 天穹杯 winner (甲级 4th if the winner is already in) against 28 clubs
// from abroad. eight groups of four (home and away), the top two of each to the last 16, then quarter-finals, semis and
// a final, all on the Wednesdays of weeks without a 天穹杯 tie. a cup that began as four groups of 16 clubs (an older
// save) finishes that way: the format follows from the number of groups (intlKO)
const INTL_NAME='天际冠军杯';
// each competition keeps its own bookings and bans: league, 天穹杯, 冠军杯 (friendlies have neither)
const COMPS={lg:'联赛',cup:CUP_NAME,intl:INTL_NAME};
const INTL_GROUPS=8,INTL_GROUP_ROUNDS=6,INTL_LEAGUE_PLACES=3;  // 甲级's places (the 天穹杯 winner has one more)
const INTL_WEEKS=[1,3,4,7,8,10,11,14,18,22];  // six group rounds, last 16, quarters, semis, final (after the league)
const INTL_WEEKS4=[3,4,7,8,10,11,14,18,22];   // the four-group cup on the 22-week calendar
const INTL_WEEKS_V2=[3,4,7,8,11,12,16,19,23];  // on the 26-week calendar
const INTL_WEEKS_V1=[2,3,5,6,8,9,11,12,15];  // on the first, shorter calendar
const INTL_KO_NAMES=['十六强','八强','半决赛','决赛'];
// per group result; for reaching the last 16 / quarters / semis / final (a four-group cup uses the last three); winning
const INTL_PRIZE={win:30,draw:10,ko:[30,60,120,200],champion:450};
// clubs from abroad (they only play in the international cup): name, short name, colour, 底蕴
const FOREIGN=[['霜岭皇家','皇家','#2B3A67',86],['赤道星辰','星辰','#C9A227',82],['苍原白狼','白狼','#8D99AE',80],['冰原极光','极光','#3FA7D6',78],
  ['暮色湾联合','暮色','#6D597A',76],['碧波海岸','碧波','#2A9D8F',74],['东瀛蓝武士','武士','#1D3557',73],['月港联合','月港','#B56576',71],
  ['北岭钢铁','钢铁','#495057',70],['沙海猎鹰','猎鹰','#E09F3E',69],['白岩竞技','白岩','#ADB5BD',67],['珊瑚海盗','海盗','#E76F51',66],
  ['烈阳城','烈阳','#F4A261',64],['雾都皇冠','皇冠','#5C677D',63],['极北之星','北星','#4361EE',62],['银河体育会','银河','#7209B7',60],
  ['铁原竞技','铁原','#6B705C',75],['碧海联合','碧海','#0096C7',72],['金沙城','金沙','#D4A373',70],['苍穹之鹰','苍穹','#3A86FF',68],
  ['凛风港','凛风','#8ECAE6',66],['赤岩体育会','赤岩','#9D0208',65],['白昼骑士','白昼','#E9C46A',63],['星河联','星河','#5A189A',62],
  ['云端城竞技','云端','#48CAE4',61],['深蓝港','深蓝','#023E8A',59],['风暴角','风暴','#495867',58],['玄武联合','玄武','#2D6A4F',57],
  ['狮心王城','狮心','#9B2226',72],['翡翠高原','翡翠','#40916C',70],['黄金海岸','黄金','#E9B949',68],['夜莺城','夜莺','#3C096C',66],
  ['红杉联合','红杉','#AE2012',65],['蓝冰竞技','蓝冰','#90E0EF',63],['橡树港','橡树','#7F5539',62],['北极熊联','北熊','#CAD2C5',60],
  ['天狼星','天狼','#22223B',59],['火烈鸟','火鸟','#FF6B6B',57],['孤岛联合','孤岛','#577590',56],['山岚体育会','山岚','#84A98C',55]];
// how a club abroad's standing moves after a 冠军杯, by how far it went (group 4th, 3rd, out in the first knockout
// round, the next, the next, winner); a club more than FOREIGN_PULL away from where it started is pulled a point back each year, and one not in
// the cup drifts a point back. kept within FOREIGN_REP
const FOREIGN_FORM=[-2,-1,0,1,2,3],FOREIGN_PULL=6,FOREIGN_REP=[55,90];
// a cup's format is stored with the cup (S.cup.fmt), so a save made under the 16-club format finishes its cup as it began
const CUP_FORMAT={
  names:['资格赛','十六强','八强','半决赛','决赛'],
  at:[2,5,9,13,16],             // stage k is played once this many league rounds are done
  prize:[0,0,30,60,120,250]     // by the stage you went out in; the last entry is for winning it
};
const CUP_LEGACY={names:['十六强','八强','半决赛','决赛'],at:[3,6,9,12],prize:[0,30,60,120,250]};
// the 36-club pyramid: the 8 lowest clubs (by 底蕴) play a qualifying round, the other 28 join them in the last 32
const CUP_FORMAT32={
  names:['资格赛','三十二强','十六强','八强','半决赛','决赛'],
  at:[2,5,9,12,16,20],          // the final in the week before the last league round
  prize:[0,0,10,30,60,120,250]
};

const INJ_RATE=.00046;    // chance per team per minute of an injury, scaled by stamina (about one every 40-60 matches per team)
const INJ_DAYS=[2,3,4,4,5,6,7,9,12,16,21];  // how many days an injury lasts, picked at random
// youth academy: upgrade cost to reach the next level, by current level (max level 5)
const ACADEMY_COST=[0,80,150,250,400];
// scout department, physio room, training ground: cost to go from level n to n+1, indexed by n
const FAC_COST=[0,60,120,200,320];
const SQUAD_MAX=25;    // our first team (players out on loan don't count), as the 25-man lists of the big leagues
const SUBS=5;          // halftime substitutions allowed
const OOP=.85;           // ability multiplier for a player in another outfield line (keeper <-> outfield is .5)
// signature moves: a player learns one the moment his ability goes above 87, and it fades in the summer he turns 34
const SIG_OVR=88,SIG_FADE=34;
const SIG_A=['苍雷','黑炎','绝影','天狼','冥王','流星','修罗','月影','虚空','龙卷','赤焰','霜华','雷神','幻影','极光'];
const SIG_B=['贯穿','断罪','葬送','乱舞','一闪','崩坏','螺旋','终焉','天翔','灭杀','裂空','轮回'];
const AWAKEN=.004;       // chance per match that a player aged 23 or under awakens (rare: once in a career for a few)
const BOOST=2;           // strength bonus while morale is high (after a derby win or some events)
// AI clubs shopping in a window: hardly at all at first, so we get first pick, then in a rush over the last three
// days. each club's chance a day: early, then the third-last, second-last and last day. the summer window is the
// main one (up to 2 signings a club); in winter clubs only patch things up (1 at most, and few of them bother)
const AI_BUY={summer:{early:.02,rush:[.14,.24,.38]},winter:{early:.004,rush:[.03,.05,.08]}};
// each transfer-window day, OFFER_TRIES chances that an AI club bids for one of our players: most of them in the
// window's first OFFER_EARLY_DAYS days, few later
const OFFER_TRIES=3,OFFER_CHANCE={early:.25,late:.04},OFFER_EARLY_DAYS=3;
// a player on our transfer list draws bids of his own: on this share of window days, at this range of his value
const LIST_CHANCE=.45,LIST_RANGE=[.95,1.3],LIST_ABROAD=1/3;  // and this share of those bids come from clubs abroad
// a club bids for a player who would fit in: at most FIT_BELOW below its level (FIT_BELOW_INTL for a club from the
// 冠军杯) and not more than FIT_ABOVE above it. a listed player too weak for the 冠军杯 clubs draws bids from the
// small clubs of the leagues abroad (the ones we loan to), for a little less
const FIT_BELOW=12,FIT_BELOW_INTL=8,FIT_ABOVE=10,MINOR_RANGE=[.85,1.15];
const EVENT_CHANCE=.2;   // chance after each match of a random event

const ACH_RICH=3000;  // 富可敌国: the budget it takes
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
  academy:['青训之光','青训出身的球员能力达到 75'],
  comeback:['逆转之王','落后的情况下逆转取胜'],
  late:['读秒杀手','在第 85 分钟以后打进绝杀球'],
  oneclub:['城之守望者','培养出第一位「一人一城」的球员'],
  intl:['大陆之王','夺得天际冠军杯'],
  clean:['铁壁·不落之城','各项赛事连续 3 场零封对手'],
  streak10:['不败神话·终章','各项赛事 10 连胜'],
  fest:['火力全开','单场打进 6 球'],
  tenmen:['残阵之魂','有球员被罚下，仍然赢下比赛'],
  slayer:['弑神者','在天际冠军杯中击败海外球队'],
  unbeaten:['无敌之师','联赛整个赛季不败'],
  treble:['三冠王',`同一赛季夺得甲级冠军、${CUP_NAME}和天际冠军杯`],
  dynasty:['王朝','带领同一支球队甲级联赛三连冠'],
  boot:['王者之靴','有球员获得联赛金靴'],
  legend:['传奇缔造者','第一位球员载入「传奇退役」'],
  vet10:['活着的传说','执教满 10 个赛季'],
  star90:['神之领域','拥有能力 90 以上的球员'],
  rich:['富可敌国',`资金达到 ${ACH_RICH} 万`],
  builder:['基建狂魔','球探部、理疗室、训练场和球场全部升到满级'],
  wander:['流浪的指挥家','执教第二家俱乐部']
};
// halftime team talk (once a match): [name, what the manager says, what it does]
const TALK={
  inspire:['鼓舞','「这一战，我们注定要赢！」','下半场进攻 +3'],
  calm:['冷静','「呼吸。看清对手，再出手。」','下半场防守 +3'],
  roar:['怒吼','「你们就只有这点能耐吗！？」','赌一把：成功则进攻 +5、防守 +2，失败则攻防各 −2；教练声望越高越容易成功']
};
const TALK_FX={inspire:{atk:3,def:0},calm:{atk:0,def:3},roarOk:{atk:5,def:2},roarBad:{atk:-2,def:-2}};
// late-match boosts for our side: trailing from the 75th minute (绝境爆发), and the manager's aura (by reputation)
const DESPAIR={home:4,away:3},AURA_PER_REP=1/30;
// playing at the opponent's weakest line (seen in the scout report, scout department 3+): attack bonus, and what counts
const TARGET_BONUS=1.5;
const TARGET={DF:['对方后防薄弱','用三前锋以上的阵型，或全力进攻'],FW:['对方锋线没威胁','放心全力进攻，或用三后卫阵型压上'],MF:['对方中场薄弱','用五中场以上的阵型（含后腰、前腰）抢控球']};

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
  penAward:(team,victim)=>`${victim}在禁区里被放倒——点球！${team}获得一个点球！`,
  penGoal:n=>`${n} 站上十二码……推射死角，稳稳命中！`,
  penSaved:(n,gk)=>`${n} 主罚点球……被 ${gk} 判断对方向扑了出来！`,
  penMiss:n=>`${n} 主罚点球……打偏了！皮球擦着门柱飞出底线！`,
  fkAward:(team,n)=>`${team}在禁区前沿获得任意球，${n} 站到了球前。`,
  fkGoal:n=>`${n} 一脚弧线绕过人墙，直挂死角！任意球破门！`,
  fkSaved:(n,gk)=>`${n} 的任意球直奔球门，被 ${gk} 奋力扑出。`,
  fkMiss:n=>`${n} 的任意球稍稍高出横梁。`,
  // a goal from LATE_MIN that wins or levels it: a question when it goes in, the verdict at the final whistle
  lateMaybe:(k,team,left)=>k==='win'?`${team}打破僵局！${left>0?`还剩最后 ${left} 分钟，这会是绝杀吗？`:'这已经是最后一分钟了！'}`:`${team}在最后时刻扳平了！${left>0?'还有时间再进一个吗？':'这已经是最后一分钟了！'}`,
  lateSure:(k,team,name,min,pens)=>k==='win'?`${name} 第 ${min} 分钟的进球成为绝杀，${team}笑到了最后！`:`${name} 第 ${min} 分钟的进球绝平${pens?'，把比赛拖进了点球大战':'，硬生生抢回一分'}！`,
  yellow:(n,t)=>`${n}（${t}）被裁判之眼锁定，吃到一张黄牌`,
  ban:`，黄牌之印已集满 ${YC_BAN} 枚——本场仍可继续作战，下一场将被放逐`,
  red:(n,t)=>`${n}（${t}）第二张黄牌！审判降临，红牌罚下！`,
  injury:n=>`${n} 倒在了战场上……看起来伤得不轻`,
  injSub:(o,i)=>`${o} 无法坚持，被担架抬下。${i} 紧急登场！`,
  injStay:n=>`换人名额已用尽，${n} 只能咬牙坚持。`,
  knock:n=>`${n} 倒地，理疗师冲进场内……只是轻伤，他站起来了！`,
  warmKick:(h,a)=>`热身赛：${h} 对阵 ${a}。联赛轮空的一周，拉出来练练兵。`,
  friendlyKick:(h,a)=>`季前友谊赛：${h} 对阵 ${a}。不计成绩，正好磨合阵容。`,
  tiredSub:(o,i)=>`${o} 体力透支，${i} 替补登场，注入新的力量！`,
  derbyKick:(h,a)=>`宿敌之战！${h} 与 ${a} 之间，今日必须做个了断！`,
  intlKick:(h,a,st,ko)=>`${INTL_NAME}${st}，${h} 对阵 ${a}。${ko?'各国豪门云集，输了就回家。':'大陆舞台，每一分都很珍贵。'}`,
  cupKick:(h,a,st)=>`${CUP_NAME}${st}，${h} 对阵 ${a}。败者，将就此退场。`,
  sigGoal:(n,s)=>`${n} 咆哮：「${s}！」——必杀技炸裂，球进了！`,
  sigSave:(k,s,n)=>`${k} 发动「${s}」！${n} 的射门被完全封印！`,
  sigPass:(m,s,n)=>`${m} 发动「${s}」——一记穿透一切的直塞，${n} 只需轻轻一推！`,
  sigBlock:(d,s,n)=>`${d} 发动「${s}」！以血肉之躯挡下了 ${n} 的必进之球！`,
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
const money=x=>(Math.abs(x)>=100?Math.round(x):(Math.round(x*10)/10))+' 万';
