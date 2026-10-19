/* ================= v12a: 주민 대화·반응 다채롭게 — 오늘의 기분, 새 대화거리, 넌센스 퀴즈, 칭찬·춤, 감정표현에 반응, 주민끼리 수다 ================= */

const tic = n => n.tic ? ' ' + n.tic + '!' : '';
const withTic = (n, s) => (n.tic && Math.random() < 0.45 && !s.includes(n.tic)) ? s.replace(/[.!?~]*$/, '') + tic(n) : s;
const hashS = s => { let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

/* ---------- 오늘의 기분 ---------- */
const DAY_MOODS = [
  { k:'happy', e:'😊', name:'기분 최고', greet:['오늘 기분이 너무 좋아요! 뭐든 잘될 것 같은 날이에요.','{name}! 마침 보고 싶었는데 딱 왔네요!','햇살이 나만 비춰 주는 것 같은 날이에요~'], reply:['오늘은 날아갈 것 같아요! 콧노래가 절로 나와요.','최고예요! {name}도 기분 좋아 보여서 더 좋아요.','좋은 일이 연달아 세 번이나 있었어요. 헤헤.'] },
  { k:'sleepy', e:'😪', name:'졸림', greet:['하암… 어제 늦게 잤더니 눈이 자꾸 감겨요.','{name}… 아, 미안해요. 잠깐 서서 졸았어요.','오늘은 이불이 나를 놔주지 않았어요…'], reply:['졸려요… 구름 위에서 낮잠 자고 싶다…','눈꺼풀이 천 근 만 근이에요. 커피 한 잔이 필요해요.','쿨… 아, 안 잤어요! 진짜예요!'] },
  { k:'excited', e:'🤩', name:'신남', greet:['{name}! 있잖아요, 오늘 엄청 신나는 일이 생길 것 같아요!','두근두근! 오늘은 왠지 특별한 날 같아요!','방금 네잎클로버를 본 것 같아요! 아닐 수도 있지만요!'], reply:['신나서 가만히 못 있겠어요! 같이 뛰어요!','뭔가 재밌는 일 없을까요? 같이 찾아봐요!','오늘 같은 날은 노래를 불러야 해요. 랄랄라~'] },
  { k:'grumpy', e:'😤', name:'심술', greet:['흥… 아침부터 발가락을 찧었어요. 아직도 아파요.','오늘은 좀 심술 나는 날이에요. 이해해 줘요.','바람이 내 모자를 세 번이나 날려 버렸어요. 흥!'], reply:['별로예요. 근데 {name}랑 얘기하니까 조금 나아졌어요.','흥칫뿡! …농담이에요, 조금 괜찮아졌어요.','달콤한 거 먹으면 풀릴지도 몰라요.'] },
  { k:'shy', e:'😳', name:'수줍음', greet:['어, 어서 와요… 오늘따라 왜 이렇게 부끄럽지…','{name}… 그, 그 옷 잘 어울려요… 헤헤.','아, 안녕… 갑자기 말 걸어서 깜짝 놀랐어요.'], reply:['그냥… 괜히 얼굴이 빨개지는 날이에요.','말 걸어 줘서 고마워요… 사실 기다렸어요.','부끄러우니까 너무 쳐다보지 말아요…'] },
  { k:'hungry', e:'🤤', name:'배고픔', greet:['꼬르륵… 아, 들렸어요? 배가 너무 고파요.','{name}, 혹시 맛있는 거 있어요? 아무거나 좋아요!','오늘 점심 메뉴 고민만 한 시간째예요.'], reply:['배고파요… 보보 카페 케이크가 아른거려요.','밥 먹고 나면 기분 최고가 될 거예요!','도토리 쿠키 백 개 먹을 수 있을 것 같아요.'] },
  { k:'calm', e:'🍵', name:'평온', greet:['오늘은 바람이 잔잔해서 마음도 잔잔해요.','차 한 잔 마신 것처럼 마음이 편한 날이에요.','구름이 천천히 흘러가는 걸 보고 있었어요.'], reply:['평화로워요. 이런 날이 제일 좋아요.','그냥 좋아요. 아무 일도 없어서 좋아요.','숨을 크게 쉬어 봐요. 바다 냄새가 나요.'] },
  { k:'curious', e:'🧐', name:'궁금', greet:['{name}, 하늘은 왜 파란 걸까요? 오늘 하루 종일 궁금해요.','어제 이상한 발자국을 봤어요. 누구 거였을까요?','오늘은 궁금한 게 백 가지쯤 있어요!'], reply:['궁금해서 잠이 안 와요. 개미는 어디서 잘까요?','이것저것 알아보고 싶은 날이에요. 같이 탐험할래요?','{name}는 제일 좋아하는 색이 뭐예요? 궁금했어요!'] },
];
function moodOf(id){ G.me.npcMood = G.me.npcMood || {}; const m = G.me.npcMood[id]; if (m && m.d === today()) return DAY_MOODS.find(x => x.k === m.k) || MOODS[0]; return DAY_MOODS[hashS(today() + id) % DAY_MOODS.length]; }
function setMood(id, k){ G.me.npcMood = G.me.npcMood || {}; G.me.npcMood[id] = { d:today(), k }; }

/* ---------- 주민마다 새 이야깃거리 ---------- */
const EXTRA = {
  momo:['어제 손님이 조개 백 개를 한꺼번에 팔러 왔어요. 세다가 귀가 꼬였어요!','가게 앞 화분에 당근을 심었는데 아무도 모르게 자라고 있어요. 쉿.','내 귀는 비 오기 전에 간질간질해요. 일기예보보다 정확하다니까요?','모르는 손님이 오면 귀가 먼저 인사해요. 쫑긋!','가끔 물건 값을 헷갈려서 코코한테 혼나요… 비밀이에요.'],
  coco:['오늘 장부가 1도토리 안 맞아서 세 번 다시 셌다. 결국 내 주머니에 있었다냥.','고양이는 상자를 좋아한다. 은행 금고도 큰 상자다냥.','숫자 7을 좋아한다. 깔끔하게 생겼다냥.','비 오는 날엔 은행에 손님이 적다. 그래서 몰래 낮잠을 잔다냥.','{name}, 저금은 습관이다. 하루 한 개라도 꾸준히다냥.'],
  dan:['어제 동굴 같은 데를 찾았는데 그냥 큰 나무 구멍이었지롱.','지도에 없는 길을 하나 알아냈어! 아직 비밀이지롱.','나 사실 높은 데 조금 무서워. 옥상 있는 집은 대단해!','꼬리로 균형 잡는 연습 중이야. 넘어지면 못 본 척해 줘!','다음엔 섬 끝까지 헤엄쳐 가 볼 거야. 아니, 배 탈래.'],
  toni:['마을 구석구석 안내하는 게 내 일이야. 길 잃으면 언제든 불러!','오늘 처음 온 손님한테 기차역을 세 번이나 알려 줬어. 뿌듯해!','지도를 펼치면 우리 마을이 하트 모양 같지 않아? 아닌가…','끼니는 내 동생 같은 친구야. 맨날 어디로 사라지는지 몰라!'],
  kini:['나 오늘 개구리랑 눈싸움했다? 내가 이겼어!','어른이 되면 탐험가가 될 거야. 단풍이 형처럼!','몰래 알려 줄게. 저기 나무 밑에 반짝이는 돌 숨겨 놨어.','심심하면 나랑 숨바꼭질하자! 내가 술래할게!'],
  mong:['새 옷이 들어오면 제일 먼저 입어 보는 게 내 특권이에요, 메에.','털 깎는 날엔 몸이 가벼워서 춤추고 싶어요.','{name}한테는 하늘색 옷이 잘 어울릴 것 같아요. 한번 입어 봐요!','요즘 유행은 장신구예요. 목걸이 하나로 분위기가 확 달라져요!','사실 나 거울 앞에서 포즈 연습해요. 비밀이에요, 메에.'],
  bobo:['오늘의 추천은 꿀 라떼예요. 꿀은 내가 직접… 아, 아니에요.','커피콩 볶는 냄새 맡으면 겨울잠 자고 싶어져요, 곰.','손님들이 웃으면서 나가면 그게 제일 맛있는 디저트예요.','새 메뉴를 연구 중이에요. 도토리 크림 케이크! 어때요?','팡팡이가 맨날 와서 대나무 라떼를 만들어 달래요. 그런 건 없는데…'],
  pang:['택배 상자 쌓기 신기록 세웠다! 열두 층! 무너졌지만!','물류센터는 바빠도 재밌어. 상자마다 누군가의 설렘이 들어 있거든, 팡.','점심엔 대나무 샌드위치! 먹어 볼래? 아, 질기다고?','일하고 나서 마시는 보보네 음료가 최고야, 팡!'],
  bori:['기차가 정시에 오면 꼬리가 저절로 흔들려요, 멍!','오늘 승객 수를 셌어요. 47명! 아니 48명이었나…','기차 소리만 들어도 어느 기차인지 알 수 있어요. 멍멍 특기!','표 검사할 때 다들 웃어 줘서 좋아요.'],
  kongi:['쇼핑몰역은 쇼핑백 든 손님이 많아요. 다들 행복해 보여요, 멍멍!','기차 기다릴 땐 바람 냄새를 맡아요. 오늘은 빵 냄새가 나요!','보리 형은 꼼꼼하고 두부는 씩씩해요. 나는… 귀여운 담당?'],
  dubu:['일터역에선 다들 바빠요. 그래서 내가 더 크게 인사해요, 왈!','출근하는 손님들한테 힘내라고 꼬리 흔들어 줘요.','쉬는 시간엔 플랫폼에서 하늘 보는 게 좋아요, 왈.'],
  dum:['불조심은 모두의 약속이야. 그래도 캠프파이어는 좋아해!','소방차 닦는 게 내 취미야. 반짝반짝해야 기분이 좋거든.','위험할 땐 언제든 불러. 듬직하게 달려갈게!'],
  mung:['구급차 사이렌은 일부러 귀엽게 바꿔 놨어. 놀라지 말라고.','옥상에서 떨어진 사람을 태운 적이 있지… 조심해야 해!','다치면 바로 말해. 반창고는 항상 주머니에 있어.'],
  doc:['손 씻기, 잘 자기, 잘 먹기. 이 세 가지면 병원 올 일 없어요.','청진기로 들어 보면 다들 심장이 콩닥콩닥 귀여워요.','환자가 웃으면서 퇴원할 때가 제일 보람 있어요.','요즘 마을 사람들이 너무 건강해서 조금 심심해요. 좋은 일이죠!'],
  cap:['바다는 매일 얼굴이 달라. 오늘은 기분이 좋은 바다야.','작은 섬에 가 봤나? 거기 노을이 이 세상에서 제일 예뻐.','배 위에서 먹는 도시락은 두 배로 맛있어. 진짜야.'],
  cop1:['마을 순찰 중이에요. 오늘도 평화롭네요!','길 건널 땐 기차 조심! 꼭 좌우 살펴요.','나쁜 짓 하면 내가 다 알아요. …농담이에요, 아마도요.'],
  cop2:['순찰 돌다가 햇볕 좋은 곳 발견하면 잠깐 서 있어요. 잠깐만요.','치즈라는 이름 때문에 다들 간식인 줄 알아요. 경찰이에요!','마을이 조용하면 나는 행복해요.'],
  jobman:['일자리 찾고 있어요? 마을엔 할 일이 가득해요!','일하고 받은 도토리는 더 반짝여 보여요. 진짜로요.','오늘의 추천 일감은… 비밀이에요. 와서 직접 봐요!'],
  n1:['오늘 노을을 그리려다 물감이 모자랐어요. 분홍색이 너무 많았거든요.','{name}를 그려 봐도 될까요? 가만히 서 있기만 하면 돼요!','그림은 마음을 옮기는 거래요. 나는 아직 연습 중이에요.'],
  n2:['오늘은 도토리 수프를 만들었어요. 조금 탔지만 맛은 있었어요!','요리사가 되면 마을 사람 모두를 초대할 거예요.','소금이랑 설탕을 또 헷갈렸어요. 달콤한 계란말이 먹어 볼래요?'],
  n3:['이 마을 벤치 반은 내가 만들었어. 앉아 봤어?','나무에도 결이 있어. 쓰다듬어 보면 느껴져.','건축가 뚝딱이랑 친구야. 집 증축할 때 나도 도와!'],
  n4:['오늘 새 노래를 만들었어요. 제목은 "도토리 마을의 아침"!','노래할 때 다들 박수 쳐 주면 너무 행복해요.','{name}도 노래해 봐요! 못 불러도 괜찮아요, 즐거우면 돼요.'],
  n5:['오늘 찍은 사진 중에 제일 잘 나온 건 구름 사진이에요.','사진은 지금을 오래 간직하는 마법이에요.','{name}, 카메라 버튼 눌러 봤어요? 마을 사진 찍기 좋아요!'],
};
Object.entries(EXTRA).forEach(([id, arr]) => { const L = LINES[id]; if (L){ L.chat0 = (L.chat0 || []).concat(arr.slice(0, 3)); L.chat1 = (L.chat1 || []).concat(arr.slice(3)); } });

/* ---------- 지금 상황에 맞는 말 ---------- */
const ACC_TALK = { _:['그 장신구 예쁘다! 어디서 났어요?','오늘 반짝반짝하네요. 장신구 덕분인가?'],
  sp_tiara:['그 티아라… 공주님 같아요!','티아라 반짝이는 거 봐요. 눈부셔요!'], sp_halo:['머리 위에 링이 떠 있어요! 천사였어요?'], sp_antler:['어? 루루랑 똑같은 뿔이다!','사슴뿔 머리띠! 루루가 준 거죠?'],
  sp_sparkle:['머리 주위에 별이 빙글빙글 돌아요! 신기해!'], sp_butterfly:['나비가 머리에 앉은 줄 알았어요!'], acc_pearl:['진주 목걸이, 우아하다…'], acc_ribbon:['리본 핀 너무 귀여워요!'] };
const HW_TALK = ['트릭 오어 트릿! 사탕 안 주면 장난칠 거예요~','호박등 몇 개 찾았어요? 나는 아직 두 개밖에 못 봤어요.','할로윈이라 그런지 밤에 박쥐가 날아다녀요. 귀엽지 않아요?','무슨 분장할지 아직 못 정했어요. 추천해 줄래요?'];
const HW_COSTUME = { hw_witch:['꼬마 마녀다! 빗자루는 어디 있어요?'], hw_vampire:['뱀파이어다! 무, 물지 말아요!'], hw_ghost:['꺄악! 유령… 아, {name}였구나!'] };
const LULU_TALK = ['분홍 사슴 루루 봤어요? 오래 쉬다 오면 선물을 준대요!','루루는 늘 선물 상자를 들고 다녀요. 뭐가 들었을까?','어제 루루가 광장에서 뿔에 나뭇잎 달고 다니던데요. 귀여워!'];
function lookSig(){ const k = G.me.look || {}; return [k.hair, k.hairColor, k.eyes, k.mouth].join('|'); }
function contextLines(id){
  const me = G.me, out = [], rel = relOf(id);
  const acc = me.wear && me.wear.acc; if (acc && Math.random() < 0.55) out.push(pickL(ACC_TALK[acc] || ACC_TALK._));
  const set = me.wear && me.wear.set; if (set && HW_COSTUME[set]) out.push(pickL(HW_COSTUME[set]));
  else if (HW_ON && Math.random() < 0.4) out.push(pickL(HW_TALK));
  const sig = lookSig(); if (rel.look && rel.look !== sig) out.push(pickL(['어? 머리 바꿨어요? 잘 어울려요!','뭔가 달라졌는데… 아, 헤어스타일! 멋져요.','오늘 얼굴이 더 환해 보여요. 뭐 바꿨어요?'])); rel.look = sig;
  const f = me.house && me.house.floors; if (f >= 2 && Math.random() < 0.3) out.push(f >= 3 ? '집에 옥상 있다면서요? 다음에 놀러 가도 돼요?' : '집 2층으로 늘렸다면서요? 부러워요!');
  if (heldInstrument() && Math.random() < 0.5) out.push(pickL(['악기 들고 있네요! 한 곡 들려줄래요?','연주하는 모습 보고 싶어요!']));
  if (me.acorns >= 5000 && Math.random() < 0.3) out.push('도토리 부자네요! 나 조금만… 농담이에요!');
  if (Math.random() < 0.15) out.push(pickL(LULU_TALK));
  return out;
}
const _situational12 = situational;
situational = function(id){
  const base = _situational12(id), np = npcs[id], extra = contextLines(id);
  const all = base.concat(extra.sort(() => Math.random() - 0.5).slice(0, 1));
  return all.slice(0, 3).map(s => np ? withTic(np.n, s) : s);
};
// first chat of the day: mention today's mood
const _talkTo12 = talkTo;
talkTo = function(np, preset){
  const id = np && np.n && np.n.id, rel = id && G.me ? relOf(id) : null, first = rel && rel.met && rel.last !== today() && !preset && !np.sleep;
  _talkTo12(np, preset);
  if (first && dlg && dlg.np === np){ const m = moodOf(id); dlg.lines.splice(1, 0, fill(withTic(np.n, pickL(m.greet)))); say(np, m.e, 2500); }
};

/* ---------- 더 이야기하기: 기분·넌센스 퀴즈·칭찬·같이 춤·비밀 ---------- */
const JOKES = [
  ['세상에서 가장 큰 코는?','멕시코!'],['바나나가 웃으면?','바나나킥!'],['소가 노래하면?','소송!'],['왕이 넘어지면?','킹콩!'],
  ['세상에서 제일 뜨거운 과일은?','천도복숭아! 천 도니까요.'],['도둑이 제일 좋아하는 아이스크림은?','보석바!'],['아몬드가 죽으면?','다이아몬드!'],['개가 사람을 가르치면?','개인 지도!'],
  ['깨가 죽으면?','주근깨!'],['토끼가 제일 잘하는 운동은?','깡총 줄넘기!'],['물고기 중에 제일 학벌이 좋은 물고기는?','고등어!'],['오리가 얼면?','언덕!'],
  ['세상에서 가장 빠른 닭은?','후다닥!'],['곰이 목욕하면?','곰탕!'],['자동차를 톡 치면?','카톡!'],['딸기가 직장을 잃으면?','딸기 시럽! (딸기 실업)'],
  ['펭귄이 다니는 중학교는?','냉방중!'],['스님이 공을 차면?','중거리 슛!'],['진짜 문제투성이인 것은?','시험지!'],['세상에서 가장 지루한 중학교는?','로딩중!'],
];
const PRAISE = { happy:['헤헤, 칭찬 받으니까 더 좋아요!','고마워요! {name}도 최고예요!'], sleepy:['…어? 칭찬이에요? 잠이 확 깼어요!'], excited:['우와아! 칭찬 받았다! 오늘 진짜 최고의 날이에요!'], grumpy:['흥… 그런다고 기분이 풀릴 줄… 풀렸어요. 고마워요.'], shy:['에, 에이… 부끄럽게… 고, 고마워요…'], hungry:['칭찬으로 배가 조금 불렀어요. 진짜예요!'], calm:['고마워요. 마음이 따뜻해졌어요.'], curious:['정말요? 어디가 제일 좋아요? 궁금해요!'] };
const SECRETS = ['사실 나 밤에 몰래 별똥별한테 소원 빌어요. 마을 사람들 다 행복하게 해 달라고요.','처음 이 마을에 왔을 때 길을 잃어서 울었어요. 토니가 찾아 줬어요.','나 사실 거미가 조금 무서워요… 아무한테도 말하지 마요.','내 보물 상자에는 마을 친구들이 준 편지가 들어 있어요.','언젠간 루루 뿔을 한 번만 만져 보고 싶어요.','가끔 기차를 타고 종점까지 갔다가 그냥 돌아와요. 기분 전환이에요.','{name}가 이 마을에 와서 진짜 좋아요. 이건 진심이에요.'];
const _npcOptions12 = npcOptions;
npcOptions = function(np){ const o = _npcOptions12(np); const i = o.findIndex(x => x[0] === 'bye'); o.splice(i < 0 ? o.length : i, 0, ['more12','더 이야기하기 ▸']); return o; };
function moreMenu(){
  const np = dlg.np, id = np.n.id, rel = relOf(id), ch = talkEl().querySelector('.choices');
  const items = [['mood12','오늘 기분 어때?'],['joke12','넌센스 퀴즈!'],['praise12','칭찬하기'],['dance12','같이 춤추자']];
  if (rel.f >= 8) items.push(['secret12','비밀 얘기 해 줘']);
  items.push(['back12','◂ 뒤로']);
  talkEl().querySelector('.text').textContent = '무슨 이야기를 할까요?';
  ch.innerHTML = items.map(([k, l]) => '<button data-o="'+k+'">'+l+'</button>').join('');
  ch.querySelectorAll('[data-o]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); choose(b.dataset.o); }));
}
const _choose12 = choose;
choose = function(o){
  if (!dlg) return; const np = dlg.np, n = np.n, id = n.id, rel = relOf(id), m = moodOf(id);
  if (o === 'more12') return moreMenu();
  if (o === 'back12'){ dlg.k = dlg.lines.length; return showLine(); }
  if (o === 'mood12'){ say(np, m.e, 2500); return sayMore([m.e+' 오늘은 '+m.name+'!', withTic(n, pickL(m.reply))]); }
  if (o === 'joke12'){ const j = pickL(JOKES); return sayMore(['문제! '+j[0], '…정답은요?', j[1], withTic(n, pickL(['ㅋㅋㅋ 웃겼죠?','에이, 웃어 줘요~','이거 단풍이한테 배웠어요.','하나 더 해 줄까요?']))]); }
  if (o === 'praise12'){
    const first = rel.praised !== today(); rel.praised = today(); if (first){ rel.f += 1; if (m.k === 'grumpy' || m.k === 'sleepy') setMood(id, 'happy'); }
    saveMe(); npcReact(np, 'heart'); return sayMore([withTic(n, pickL(PRAISE[m.k] || PRAISE.happy))].concat(first ? [] : ['오늘 칭찬 벌써 받았는데… 또 들어도 좋네요!']));
  }
  if (o === 'dance12'){
    const first = rel.danced !== today(); rel.danced = today(); if (first) rel.f += 1; saveMe();
    endDialog(); doEmote('dance'); npcReact(np, 'dance', true); say(np, pickL(['랄랄라~ 🎵','둠칫둠칫!','춤은 내가 더 잘 춰요!','같이 추니까 신난다!']), 2600); return;
  }
  if (o === 'secret12'){ return sayMore(['…가까이 와 봐요. '+withTic(n, pickL(SECRETS))]); }
  return _choose12(o);
};

/* ---------- 감정표현·점프에 반응 ---------- */
const REACT = {
  hi:['안녕!','{name}, 안녕~','반가워요!','오, 안녕!'], heart:['헤헤 💕','나도 좋아요!','하트 받았다!','꺄, 부끄러워!'], clap:['짝짝짝!','와아~','최고!','브라보!'],
  laugh:['ㅋㅋㅋ 뭐가 그렇게 웃겨요?','나도 웃음 나요!','하하하!'], wow:['뭐야 뭐야?!','깜짝이야!','무슨 일이에요?!'], cry:['괜찮아요? 😢','울지 마요…','토닥토닥.','무슨 일 있어요?'],
  angry:['히익! 왜 화났어요?','진정해요~','내가 뭘 잘못했나…'], dance:['나도 춤출래!','둠칫둠칫 🎵','같이 춰요!'], bow:['꾸벅!','아, 저도 꾸벅!','예의 바르다~'], sleepy:['하암… 나까지 졸려요.','졸리면 집에 가서 자요!','쿨쿨…'],
};
const REACT_POSE = { hi:'wave', heart:'cheer', clap:'clap', laugh:'laugh', wow:'wow', cry:'cry', angry:'wow', dance:'dance', bow:'bow', sleepy:'sleepy' };
function npcReact(np, emo, keep){
  if (!np || np.hidden || np.sleep) return; const me = chars[G.slot];
  np.path = []; np.wait = Math.max(np.wait || 0, 2.6); if (me) np.face = Math.atan2(me.x - np.x, me.z - np.z);
  const type = REACT_POSE[emo] || 'wave'; np.react = { type, t:0, dur:(ANIM_DUR[type] || 1) * (keep ? 1.4 : 1) };
}
const _doEmote12 = doEmote;
doEmote = function(id){
  _doEmote12(id); const me = chars[G.slot]; if (!me || G.inside) return;
  const near = Object.values(npcs).filter(np => np.g.visible && !np.hidden && !np.sleep && !np.talking && Math.hypot(np.x - me.x, np.z - me.z) < 4.5).slice(0, 3);
  near.forEach((np, k) => setTimeout(() => { npcReact(np, id); say(np, fill(withTic(np.n, pickL(REACT[id] || REACT.hi))), 2600); }, 350 + k*420));
};
function npcReactTick(dt){
  Object.values(npcs).forEach(np => { const R = np.react; if (!R) return; R.t += dt;
    if (R.t >= R.dur || np.talking || !np.model){ np.react = null; emoReset(np); if (np.model) np.model.position.y = 0; return; }
    if (np.n.bunny){ const U = np.model.userData; if (R.type === 'dance') np.model.rotation.y = (R.t/R.dur)*Math.PI*4; np.model.position.y = Math.abs(Math.sin(R.t*12))*0.12; if (U.arms) U.arms.forEach((a, i) => a.rotation.x = -1.6 + Math.sin(R.t*14 + i)*0.4); return; }
    emoPose(np, R.type, R.t, R.dur);
  });
}
// startle when you jump right next to someone
let lastJumpReact = 0;
const _jump12 = jump;
jump = function(){
  _jump12(); const me = chars[G.slot], now = performance.now(); if (!me || !me.jump || now - lastJumpReact < 4000 || G.inside) return;
  const np = Object.values(npcs).find(np => np.g.visible && !np.hidden && !np.sleep && !np.talking && Math.hypot(np.x - me.x, np.z - me.z) < 1.4);
  if (np){ lastJumpReact = now; npcReact(np, 'wow'); say(np, withTic(np.n, pickL(['으앗, 깜짝이야!','점프 높다!','나도 뛸래!','바로 옆에서 뛰면 놀라잖아요~'])), 2200); }
};

/* ---------- 지나가며 인사 & 주민끼리 수다 ---------- */
const PASS_HI = ['안녕, {name}!','{name}, 어디 가요?','좋은 하루예요!','오늘도 반가워요~','어, {name}다!','산책 중이에요?'];
const CHATTER = [
  [['a','오늘 날씨 진짜 좋다!'],['b','그러니까! 산책하기 딱이야.']],
  [['a','점심 뭐 먹었어?'],['b','클로버 샐러드. 너는?'],['a','도토리 수프! 맛있었어.']],
  [['a','요즘 {name} 자주 보이더라.'],['b','응, 부지런한 이웃이야!']],
  [['a','너 그 소문 들었어?'],['b','무슨 소문?'],['a','루루가 선물 상자에 뭘 넣고 다니는지 아무도 모른대!']],
  [['a','어젯밤에 별똥별 봤어!'],['b','진짜? 소원 빌었어?'],['a','비밀이야~']],
  [['a','하암… 졸려.'],['b','나도… 같이 낮잠 잘래?']],
  [['a','보보 카페 신메뉴 먹어 봤어?'],['b','아직! 맛있어?'],['a','완전! 오늘 같이 가자.']],
  [['a','기차 시간표 외웠어?'],['b','보리가 다 알려 줘. 걱정 없어!']],
  [['a','나 요즘 노래 연습해.'],['b','들려줘!'],['a','라~ 라라~ 🎵'],['b','…연습 많이 하자!']],
  [['a','가방이 왜 이렇게 무거워?'],['b','조개 주웠어. 백 개쯤?'],['a','모모네 가게 가자!']],
  [['a','바다 색이 오늘은 민트색이야.'],['b','해구 선장님은 바다 기분이 좋은 날이래.']],
  [['a','넌센스 퀴즈! 곰이 목욕하면?'],['b','…곰탕?'],['a','정답! 헤헤.']],
  [['a','나 새 옷 샀어! 어때?'],['b','완전 잘 어울려!']],
  [['a','어제 꿈에 거대한 도토리가 나왔어.'],['b','길몽이다! 오늘 뭐 좋은 일 있을 거야.']],
  [['a','안녕!'],['b','안녕! 오늘도 힘내!']],
];
const HW_CHATTER = [[['a','트릭 오어 트릿!'],['b','사탕 여기 있어! 장난은 안 돼~']],[['a','호박등 봤어? 눈이 반짝반짝해.'],['b','밤에 보면 조금 무서워…']],[['a','할로윈에 뭐 입을 거야?'],['b','유령! 이불 쓰면 돼.']]];
const PAIR = {
  'momo|coco':[[['momo','코코, 오늘 가게 장부 좀 봐 줄 수 있어요?'],['coco','…또 틀렸냥? 이번엔 몇 개다냥.'],['momo','헤헤, 세 개요.']]],
  'coco|dan':[[['dan','코코! 나 땅 팠는데 동전 나왔다!'],['coco','길 파지 마라냥. 동전은 은행에 맡겨라.']]],
  'bobo|pang':[[['pang','보보! 대나무 라떼 주세요, 팡!'],['bobo','그런 메뉴는 없다니까요, 곰…']]],
  'toni|kini':[[['kini','토니! 나 오늘 개구리랑 눈싸움 이겼어!'],['toni','또? 개구리가 불쌍하다~']]],
  'mong|momo':[[['mong','모모, 이번에 들어온 리본 핀 봤어요? 메에!'],['momo','봤어요! 귀에 달면 예쁘겠다, 깡총!']]],
  'cop1|cop2':[[['cop1','순찰 이상 없음!'],['cop2','이상 없음… 햇볕만 이상하게 따뜻함.'],['cop1','또 졸지 마요!']]],
  'n4|n1':[[['n4','구름아, 내 노래 들어 볼래?'],['n1','좋아! 들으면서 그림 그릴게.']]],
};
// add to the villagers' own chatter (v7d) + special pairs + Halloween talk
CHATTER.forEach(sc => CHAT_PAIRS.push(sc.map(x => x[1])));
const _startConvo12 = startConvo;
startConvo = function(A, B){
  const k1 = A.n.id + '|' + B.n.id, k2 = B.n.id + '|' + A.n.id, key2 = PAIR[k1] ? k1 : PAIR[k2] ? k2 : null;
  let script = null;
  if (key2 && Math.random() < 0.7){ script = pickL(PAIR[key2]); if (script[0][0] !== A.n.id){ const t = A; A = B; B = t; } }
  else if (HW_ON && Math.random() < 0.3) script = pickL(HW_CHATTER);
  if (!script) return _startConvo12(A, B);
  const lines = script.map(x => withTic(x[0] === 'a' || x[0] === A.n.id ? A.n : B.n, x[1]).replace(/\{name\}/g, G.me.name));
  A.convo = B.convo = { lines, k:0, t:0, A, B }; A.chatAt = B.chatAt = Date.now(); A.path = []; B.path = [];
};
Object.assign(MOODS, { halloween:['호박등 몇 개 찾았지?','트릭 오어 트릿~','박쥐가 귀엽다…','오늘 밤은 으스스해!'] });
MOODS.day.push('구름이 솜사탕 같아.','오늘 루루 봤나?','춤추고 싶은 날이다~','바다 보러 갈까?');
MOODS.morning.push('오늘은 좋은 일이 생길 거야!','아침밥 맛있었다~');
MOODS.evening.push('오늘 저녁엔 뭐 해 먹지?','하늘이 분홍색이야!');
MOODS.night.push('별똥별 떨어질까?','부엉부엉… 아, 부엉이 소리 흉내야.');
const _moodLine12 = moodLine;
moodLine = function(np){
  const r = Math.random();
  if (r < 0.2){ const m = moodOf(np.n.id); return m.e + ' ' + withTic(np.n, pickL(m.reply).replace(/\{name\}/g, G.me.name)); }
  if (HW_ON && r < 0.35) return withTic(np.n, pickL(MOODS.halloween));
  return _moodLine12(np);
};
let passT = {};
function npcSocialTick(dt){
  if (!G.started || G.inside || dlg) return; const me = chars[G.slot]; if (!me) return;
  const now = performance.now();
  Object.values(npcs).forEach(np => { if (!np.g.visible || np.hidden || np.sleep || np.talking || np.react || np.convo) return;
    const d = Math.hypot(np.x - me.x, np.z - me.z), id = np.n.id;
    if (d < 2.6 && (!passT[id] || now - passT[id] > 120000)){ passT[id] = now; if (Math.random() < 0.55){ const m = moodOf(id); say(np, fill(withTic(np.n, pickL(PASS_HI))) + ' ' + m.e, 2400); np.face = Math.atan2(me.x - np.x, me.z - np.z); } } });
}

const _featTick12 = featTick;
featTick = function(dt, tsec){ _featTick12(dt, tsec); npcReactTick(dt); npcSocialTick(dt); };
