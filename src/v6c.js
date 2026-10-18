/* ---------- more bugs ---------- */
Object.assign(GATHER, {
  butterfly_y:{ name:'노랑나비', cat:'bug', price:14, seasons:'spring', when:'day', c:'#fff07a' },
  swallowtail:{ name:'제비나비', cat:'bug', price:45, seasons:'summer', when:'day', c:'#3a3f6a' },
  bluewing:{ name:'푸른부전나비', cat:'bug', price:28, seasons:'spring summer', when:'day', c:'#9fc8ff' },
  grasshopper:{ name:'메뚜기', cat:'bug', price:12, seasons:'summer autumn', when:'day', c:'#9fd46a', ground:true },
  mantisgreen:{ name:'방아깨비', cat:'bug', price:16, seasons:'autumn', when:'day', c:'#b8e07a', ground:true },
  rhino:{ name:'장수풍뎅이', cat:'bug', price:90, seasons:'summer', when:'night', c:'#6a4a32', ground:true },
  ant:{ name:'일개미', cat:'bug', price:5, seasons:'spring summer autumn', when:'day', c:'#4a3a3a', ground:true },
  snail:{ name:'달팽이', cat:'bug', price:10, seasons:'spring summer', when:'any', c:'#e6c8a6', ground:true },
  dungbeetle:{ name:'쇠똥구리', cat:'bug', price:24, seasons:'summer', when:'day', c:'#3a3a48', ground:true },
  dragonfly_b:{ name:'밀잠자리', cat:'bug', price:18, seasons:'summer', when:'day', c:'#8fb8e8' },
  jewel:{ name:'비단벌레', cat:'bug', price:150, seasons:'summer', when:'day', c:'#4fd8a0', ground:true, rare:true },
  moth_luna:{ name:'달빛나방', cat:'bug', price:70, seasons:'summer autumn', when:'night', c:'#d8f4c8' },
  ladybug7:{ name:'칠성무당벌레', cat:'bug', price:20, seasons:'spring', when:'day', c:'#ff6a5a', ground:true },
  honeycomb:{ name:'벌집', cat:'tree', price:90, c:'#ffcf5a' },
});
const _spotMesh5 = spotMesh;
spotMesh = function(sp){
  const it = GATHER[sp.item];
  if (sp.cat === 'bug' && it.ground){
    const g = new THREE.Group(), b = new THREE.Group(); g.add(b); g.userData.crawl = b;
    if (sp.item === 'snail'){ M(SPH(0.07, 10, 8), it.c, 0, 0.06, -0.02, b); M(GC('snailB', () => new THREE.CapsuleGeometry(0.03, 0.12, 4, 8)), '#f2e0c8', 0, 0.03, 0.03, b).rotation.x = Math.PI/2; }
    else if (sp.item === 'ant'){ [0,0.06,0.12].forEach((z,k) => M(SPH(k===1?0.022:0.03, 8, 6), it.c, 0, 0.03, z-0.06, b)); }
    else { M(SPH(0.06, 10, 8), it.c, 0, 0.05, 0, b).scale.set(0.8, 0.6, 1.3); if (sp.item==='rhino') M(GC('horn', () => new THREE.ConeGeometry(0.015,0.08,6)), it.c, 0, 0.09, 0.08, b).rotation.x = -0.6; if (sp.item==='grasshopper'||sp.item==='mantisgreen') [-1,1].forEach(s => M(GC('leg', () => new THREE.CylinderGeometry(0.006,0.006,0.12,4)), it.c, 0.05*s, 0.06, -0.02, b).rotation.z = 0.8*s); }
    const sp2 = M(new THREE.OctahedronGeometry(0.045), '#ffffff', 0, 0.28, 0, g); sp2.castShadow = false; g.userData.spark = sp2;
    return g;
  }
  return _spotMesh5(sp);
};

/* ---------- buildings: fire station, hospital, harbor ---------- */
function addBuilding(b){
  BUILD.push(b); b.door = [b.cx, b.cz + Math.floor(b.d/2) + 1];
  for (let a=-Math.floor(b.w/2); a<=Math.floor(b.w/2); a++) for (let c=-Math.floor(b.d/2); c<=Math.floor(b.d/2); c++){ const [i,j] = T(b.cx+a, b.cz+c); tile[idx(i,j)] = GRASS; statics.set(key(i,j), b); }
  const [di,dj] = T(b.door[0], b.door[1]); const st = statics.get(key(di,dj)); if (st && (st.kind==='tree'||st.kind==='rock')) statics.delete(key(di,dj)); tile[idx(di,dj)] = PATH;
  BY[b.id] = b;
}
const clearPath = (...pts) => { for (let k=0;k<pts.length-1;k++){ const [x1,z1] = pts[k], [x2,z2] = pts[k+1]; const dx = Math.sign(x2-x1), dz = Math.sign(z2-z1); let x = x1, z = z1; for(;;){ const [i,j] = T(x,z); const st = statics.get(key(i,j)); if (st && (st.kind==='tree'||st.kind==='rock')) statics.delete(key(i,j)); const t = tile[idx(i,j)]; if (t !== TRACK && t !== PLAT && t !== BRIDGE) tile[idx(i,j)] = t === WATER ? PLAT : PATH; if (x===x2 && z===z2) break; if (x!==x2) x += dx; else z += dz; } } };
addBuilding({ id:'fire', kind:'fire', cx:32, cz:12, w:3, d:3, name:'소방서' });
addBuilding({ id:'hosp', kind:'hosp', cx:45, cz:12, w:3, d:3, name:'병원' });
addBuilding({ id:'harbor', kind:'harbor', cx:12, cz:-17, w:3, d:3, name:'항구' });
clearPath([34,10],[34,14],[32,14]); clearPath([40,9],[40,14],[45,14]); clearPath([40,14],[38,14],[38,16]);
clearPath([4,-14],[4,-15],[15,-15],[15,-17]); clearPath([15,-17],[15,-20]);
const DOCK = { x:15, z:-21.2 };
function buildFireB(){
  const g = new THREE.Group();
  M(new THREE.BoxGeometry(2.9,0.16,2.9), '#efe4d6', 0, 0.08, 0, g);
  M(new THREE.BoxGeometry(2.6,1.7,2.5), '#ffd0c4', 0, 1.0, -0.05, g);
  M(new THREE.BoxGeometry(2.9,0.25,2.8), '#ff9a8a', 0, 1.95, -0.05, g);
  M(new THREE.BoxGeometry(1.5,1.1,0.06), '#fff4e8', 0, 0.68, 1.22, g); for (let k=0;k<4;k++) M(new THREE.BoxGeometry(1.5,0.03,0.07), '#f2dcc2', 0, 0.3+k*0.26, 1.24, g);
  M(new THREE.CylinderGeometry(0.16,0.16,0.18,14), '#ff6a6a', -0.9, 2.2, 0.6, g); M(new THREE.CylinderGeometry(0.16,0.16,0.18,14), '#8fc8f0', 0.9, 2.2, 0.6, g);
  M(new THREE.BoxGeometry(0.4,1.0,0.4), '#ffb0a0', 1.05, 2.5, -0.7, g);
  const s = signMesh('소방서', 1.3, 0.38, '#ffffff', '#ef6a6a'); s.position.set(0, 1.55, 1.48); g.add(s);
  return g;
}
function buildHospB(){
  const g = new THREE.Group();
  M(new THREE.BoxGeometry(2.9,0.16,2.9), '#efe4d6', 0, 0.08, 0, g);
  M(new THREE.BoxGeometry(2.6,1.8,2.5), '#ffffff', 0, 1.05, -0.05, g);
  M(new THREE.BoxGeometry(2.8,0.18,2.7), '#ffc6d6', 0, 2.0, -0.05, g);
  M(new THREE.BoxGeometry(0.5,0.16,0.06), '#ff7f9a', 0, 2.45, 0.2, g); M(new THREE.BoxGeometry(0.16,0.5,0.06), '#ff7f9a', 0, 2.45, 0.2, g); M(new THREE.BoxGeometry(0.7,0.7,0.04), '#ffffff', 0, 2.45, 0.17, g);
  M(new THREE.BoxGeometry(0.8,1.0,0.07), '#cfe8f6', 0, 0.62, 1.22, g); [-0.85,0.85].forEach(x => M(new THREE.BoxGeometry(0.5,0.5,0.06), matWin, x, 1.1, 1.22, g));
  const s = signMesh('도토리 병원', 1.5, 0.38, '#ffffff', '#ff7f9a'); s.position.set(0, 1.6, 1.48); g.add(s);
  return g;
}
function buildHarborB(){
  const g = new THREE.Group();
  M(new THREE.BoxGeometry(2.9,0.16,2.9), '#e6e0d8', 0, 0.08, 0, g);
  M(new THREE.BoxGeometry(2.4,1.3,2.3), '#e2f0fa', 0, 0.8, 0, g);
  const rf = M(new THREE.ConeGeometry(1.95, 0.9, 4), '#8fb8e8', 0, 1.9, 0, g); rf.rotation.y = Math.PI/4;
  M(new THREE.CylinderGeometry(0.22,0.26,1.6,12), '#ffffff', 1.05, 1.5, -0.8, g); M(new THREE.CylinderGeometry(0.24,0.24,0.25,12), '#ff9a8a', 1.05, 2.4, -0.8, g); M(new THREE.SphereGeometry(0.14,12,10), matBulb, 1.05, 2.62, -0.8, g);
  M(new THREE.TorusGeometry(0.22,0.07,8,16), '#ff9a8a', -0.7, 0.9, 1.18, g);
  M(new THREE.BoxGeometry(0.6,0.9,0.07), '#8fb8e8', 0.3, 0.55, 1.17, g);
  const s = signMesh('항구', 1.0, 0.34, '#ffffff', '#5b7fd1'); s.position.set(0, 1.5, 1.6); s.rotation.x = -0.2; g.add(s);
  return g;
}
function buildExtraB(s){ return s.kind==='fire' ? buildFireB() : s.kind==='hosp' ? buildHospB() : s.kind==='harbor' ? buildHarborB() : null; }
SHOP_ROOMS.fire = { w:10, d:6, wall:'wall_stripe', floor:'floor_stone', title:'도토리 소방서', titleC:'#ef6a6a', clerk:'dum', clerkAt:[6,2], extra:[{ npc:'mung', at:[8,2] }], items:[
  { id:'truck', x:0, z:0 }, { id:'heli_pad', x:6, z:0 }, { id:'bench2', x:0, z:4 }, { id:'clock', x:5, z:0 }, { id:'plant', x:9, z:4 },
] };
SHOP_ROOMS.hosp = { w:8, d:6, wall:'wall_mint', floor:'floor_check', title:'도토리 병원', titleC:'#ff7f9a', clerk:'doc', clerkAt:[3,1], items:[
  { id:'counter3', x:2, z:2, show:'clerk' }, { id:'hbed', x:0, z:0 }, { id:'hbed', x:6, z:0 }, { id:'plant', x:7, z:4 }, { id:'bench2', x:0, z:4 }, { id:'frame', x:3, z:0 },
] };
SHOP_ROOMS.fire.hello = '듬직: 도토리 소방서다! 언제든 출동 준비 완료!'; SHOP_ROOMS.hosp.hello = '하양: 어서 와요. 아픈 데 있으면 말해요.';
SHOP_SVC.fire = '출동 이야기'; SHOP_SVC.hosp = '진찰 받기'; SHOP_NAME.fire = '도토리 소방서'; SHOP_NAME.hosp = '도토리 병원';
Object.assign(FURN, { truck:{ name:'소방차', w:4, d:2, fixture:true }, heli_pad:{ name:'헬리콥터', w:4, d:2, fixture:true }, hbed:{ name:'병원 침대', w:1, d:2, fixture:true } });
const _fixMesh5 = fixMesh;
fixMesh = function(it){
  if (it.id === 'truck'){ const g = new THREE.Group(); M(new THREE.BoxGeometry(3.4,0.9,1.4), '#ff8a7a', 1.5, 0.75, 0.5, g); M(new THREE.BoxGeometry(1.1,0.7,1.35), '#ffb0a0', 3.0, 1.45, 0.5, g); M(new THREE.BoxGeometry(2.0,0.08,0.3), '#e6e0ea', 1.2, 1.3, 0.5, g); M(new THREE.BoxGeometry(0.8,0.35,0.02), matWin, 3.0, 1.5, 1.18, g); [0.4,2.6].forEach(x => [-0.2,1.2].forEach(z => M(new THREE.CylinderGeometry(0.28,0.28,0.18,16), '#5a4a5a', x, 0.28, z, g).rotation.x = Math.PI/2)); M(new THREE.CylinderGeometry(0.1,0.1,0.12,10), '#8fc8f0', 2.7, 1.86, 0.5, g); return g; }
  if (it.id === 'heli_pad'){ const g = heliMesh(); g.position.set(1.5, 0, 0.5); const w = new THREE.Group(); w.add(g); M(new THREE.CylinderGeometry(1.2,1.2,0.04,24), '#ffe6a3', 1.5, 0.02, 0.5, w); return w; }
  if (it.id === 'hbed'){ const g = new THREE.Group(); M(new THREE.BoxGeometry(0.9,0.5,1.8), '#ffffff', 0, 0.3, 0.5, g); M(new THREE.BoxGeometry(0.86,0.12,1.2), '#cfe8f6', 0, 0.58, 0.7, g); M(new THREE.CapsuleGeometry(0.12,0.4,4,10), '#ffffff', 0, 0.62, -0.18, g).rotation.z = Math.PI/2; M(new THREE.BoxGeometry(0.95,0.7,0.08), '#d8e8f2', 0, 0.5, -0.38, g); return g; }
  return _fixMesh5(it);
};
function heliMesh(){
  const g = new THREE.Group();
  M(SPH(0.6, 18, 14), '#ff9a8a', 0, 0.9, 0, g).scale.set(1, 0.85, 1.35);
  M(new THREE.BoxGeometry(0.9,0.45,0.05), matWin, 0, 1.0, 0.72, g);
  M(new THREE.CylinderGeometry(0.1,0.16,1.4,10), '#ff9a8a', 0, 1.0, -1.2, g).rotation.x = Math.PI/2;
  M(new THREE.BoxGeometry(0.05,0.5,0.3), '#ffffff', 0, 1.2, -1.85, g);
  [-0.4,0.4].forEach(x => M(new THREE.BoxGeometry(0.06,0.06,1.4), '#c8c0d8', x, 0.25, 0, g)); [-0.4,0.4].forEach(x => [0.4,-0.4].forEach(z => M(new THREE.BoxGeometry(0.04,0.4,0.04), '#c8c0d8', x, 0.45, z, g)));
  const rot = new THREE.Group(); rot.position.y = 1.6; g.add(rot); g.userData.rotor = rot; M(new THREE.CylinderGeometry(0.06,0.06,0.2,8), '#8a7aa8', 0, -0.05, 0, rot); [0, Math.PI/2].forEach(a => { const b = M(new THREE.BoxGeometry(2.6,0.03,0.14), '#fff4e8', 0, 0.04, 0, rot); b.rotation.y = a; });
  const s = signMesh('구조대', 0.7, 0.22, '#ffffff', '#ef6a6a'); s.position.set(0.62, 0.95, 0); s.rotation.y = Math.PI/2; g.add(s);
  return g;
}
// clerk room: support a second (decorative) person
const _enterShop5 = enterShop;
enterShop = function(kind){
  const R = SHOP_ROOMS[kind];
  if ((kind === 'fire') && G.dispatchUntil > Date.now()){ NPC_BY.dum._away = true; } else if (NPC_BY.dum) NPC_BY.dum._away = false;
  _enterShop5(kind);
  if (R.extra && G.inside && !(kind==='fire' && G.dispatchUntil > Date.now())) R.extra.forEach(e => { const n = NPC_BY[e.npc], g = new THREE.Group(), m = npcModel(n); g.add(m); g.position.set(iwx(e.at[0]), 0, iwz(e.at[1])); room.add(g); G.inside.extraLbl = (G.inside.extraLbl||[]).concat([{ lbl:makeLabel(n.name), x:iwx(e.at[0]), z:iwz(e.at[1]) }]); });
  if (kind === 'fire' && G.dispatchUntil > Date.now()) toast('소방서가 텅 비었어요. 곰돌이 구조대가 출동 중이에요!', 2400);
};
const _clerkPresent5 = clerkPresent;
clerkPresent = n => !n._away && (n.allDay || _clerkPresent5(n));
const _exitHouse6 = exitHouse;
exitHouse = function(){ if (G.inside && G.inside.extraLbl) G.inside.extraLbl.forEach(e => e.lbl.remove()); _exitHouse6(); };

/* ---------- new villagers: rescue bears, doctor, captain ---------- */
NPCS.push(
  { id:'dum', name:'듬직', kind:'곰', job:'소방대장', likes:['tree','crop'], gift:'clock', tic:'', work:'fire', hours:[0,24], allDay:true,
    look:{ skin:'#ffe2cc', hair:'short', hairColor:'#b07a4a', eyes:'round', mouth:'smile', animal:{ type:'bear', fur:'#b07a4a', inner:'#f2d2b0' } }, wear:{ set:'firefighter' } },
  { id:'mung', name:'뭉치', kind:'곰', job:'구급대원', likes:['flower','forage'], gift:'plant', tic:'', work:'fire', hours:[0,24], allDay:true,
    look:{ skin:'#fff0e2', hair:'short', hairColor:'#e8c08a', eyes:'smile', mouth:'open', animal:{ type:'bear', fur:'#e8c08a', inner:'#fff0dc' } }, wear:{ set:'firefighter' } },
  { id:'doc', name:'하양', kind:'고양이', job:'의사 선생님', likes:['flower','shell'], gift:'aquarium', tic:'', work:'hosp', hours:[0,24], allDay:true,
    look:{ skin:'#fff6f0', hair:'short', hairColor:'#ffffff', eyes:'round', mouth:'cat', animal:{ type:'cat', fur:'#ffffff', inner:'#ffc6d6' } }, wear:{ set:'doctor', face:'round_black' } },
  { id:'cap', name:'해구', kind:'강아지', job:'항구 선장', likes:['shell','tree'], gift:'aquarium', tic:'', post:[14,-15], hours:[5,23],
    look:{ skin:'#ffe2cc', hair:'short', hairColor:'#8a8a98', eyes:'smile', mouth:'smile', animal:{ type:'dog', fur:'#8a8a98', inner:'#e6e0ea' } }, wear:{ set:'captain' },
    extraOpts: np => [['boat', G.me.boat && !G.boat ? '배 다시 가져다줘' : '배 타기']] },
);
NPCS.forEach(n => { NPC_BY[n.id] = n; });
Object.assign(LINES, {
  dum:{ intro:['도토리 소방서 소방대장 듬직이다! 무슨 일이 생기면 언제든 출동한다!','{name}, 반갑다! 벌집은 함부로 건드리지 마라. 진짜 아프다!'],
    morning:['아침 체조로 하루를 시작한다! 하나, 둘!'], day:['오늘도 마을은 평화롭군. 좋은 일이다.','헬리콥터 점검 완료! 무인도에서도 구하러 간다.'], evening:['노을이 지면 순찰을 한 바퀴 돈다.'], night:['밤에도 소방서는 불이 켜져 있다. 걱정 마라.'],
    chat0:['벌에 많이 쏘이면 기절한다. 그럼 우리가 달려간다!','무인도에서 쓰러지면 헬리콥터가 출동한다. 대신 비용이 좀 든다.','배가 가라앉으면 구조선으로 튜브를 던져 준다!'], chat1:['사실 나도 벌이 무섭다… 비밀이다.','{name}가 무사하면 그걸로 됐다.'], chat2:['{name}는 우리 소방서의 명예 대원이다!'],
    giftLike:['오오! 고맙다! 대원들이랑 나눠 쓰겠다!'], giftOk:['고맙다!'], tooMuch:['지금은 출동 대기 중이다. 내일 또 와라!'], bye:['안전 제일!','조심히 다녀라!'] },
  mung:{ intro:['구급대원 뭉치예요! 다치면 제가 업고 병원까지 뛰어갈게요!','{name}, 반가워요! 아프면 참지 말고 병원에 가요.'],
    morning:['아침엔 구급상자 점검! 반창고 가득!'], day:['오늘은 아무도 안 다쳤으면 좋겠어요.'], evening:['하루 무사히 끝나서 다행이에요.'], night:['밤엔 조용해서 좋아요. …출동만 없다면요.'],
    chat0:['병원비는 도토리 10개! 헬리콥터는 100개예요.','하양 선생님은 엄청 다정해요.'], chat1:['사실 제 꿈은 헬리콥터 조종사예요!'], chat2:['{name}가 오면 소방서가 환해져요!'],
    giftLike:['우와! 이거 정말 좋아해요!'], giftOk:['고마워요!'], tooMuch:['오늘은 여기까지! 몸조심해요.'], bye:['조심히 가요!'] },
  doc:{ intro:['어서 와요. 도토리 병원 의사 하양이에요. 어디 아픈 데는 없어요?','{name}, 처음 뵙네요. 건강이 제일이에요.'],
    morning:['좋은 아침이에요. 오늘도 물 많이 마셔요.'], day:['햇볕이 강하면 모자를 꼭 써요.'], evening:['저녁엔 푹 쉬어야 내일 힘이 나요.'], night:['밤늦게까지 무리하면 안 돼요. 얼른 자요.'],
    chat0:['벌에 쏘이면 부어오를 수 있어요. 벌집은 조심!','체력이 낮을 땐 카페 음료나 침대에서 쉬어요.'], chat1:['사실 의사가 되기 전엔 간호사였어요.'], chat2:['{name}는 제가 지켜 줄게요. 언제든 와요.'],
    giftLike:['어머, 정말 좋아하는 거예요. 고마워요.'], giftOk:['고마워요. 진료실에 둘게요.'], tooMuch:['오늘 진료는 여기까지예요. 내일 봐요.'], bye:['건강하세요!','몸조심해요.'] },
  cap:{ intro:['어서 와, 항구 선장 해구다! 배 타고 바다 구경 가 볼 테냐?','{name}! 바다엔 무인도가 여럿 있어. 보물이 숨겨진 섬도 있지!'],
    morning:['아침 바다는 잔잔해서 배 타기 딱 좋아.'], day:['오늘은 바람이 좋구나. 멀리 나가 볼 만해.'], evening:['노을 질 때 바다 낚시가 최고야.'], night:['밤바다는 위험해. 조심해서 다녀와.'],
    chat0:['바다 한가운데선 상어나 고래가 낚일 때도 있어!','바다 곳곳에 암초가 있어. 열 번 넘게 부딪히면 배가 가라앉아!','배에서 땅 쪽을 보고 행동 버튼을 누르면 내릴 수 있어. 배는 그 자리에 묶여 있지.','무인도 중엔 아무것도 없는 섬도 있고, 벌집 있는 섬도 있어. 조심해!'],
    chat1:['젊었을 땐 저 멀리 바다 끝까지 가 봤지. 고래랑 같이 헤엄쳤어!'], chat2:['{name}는 이제 진짜 뱃사람이야!'],
    giftLike:['오! 바다 냄새 나는 선물이군. 고맙다!'], giftOk:['고맙다, 선원!'], tooMuch:['배 손질하러 가야 해. 내일 또 와!'], bye:['순풍을 빈다!','바다 조심!'] },
});

/* ---------- beehives & stings ---------- */
const HIVE_TREES = [];
(function(){ const r = rng(777); const trees = [...statics.entries()].filter(([k,s]) => s.kind==='tree' && s.tk !== 'palm'); for (let n=0;n<7 && trees.length;n++){ const k = Math.floor(r()*trees.length); const [, s] = trees.splice(k,1)[0]; s.hive = true; HIVE_TREES.push(s); } })();
const hiveDown = s => { const d = G.me && G.me.daily; return !!(d && d.date === today() && (d.hives||[]).includes(s.id)); };
function hiveMesh(){ const g = new THREE.Group(); [0.13,0.11,0.08].forEach((r,k) => M(SPH(r, 12, 10), k%2 ? '#ffd36a' : '#f2b84a', 0, -k*0.09, 0, g).scale.set(1, 0.7, 1)); M(SPH(0.03, 6, 4), '#5a3a2a', 0, -0.12, 0.1, g); M(GC('hstr', () => new THREE.CylinderGeometry(0.01,0.01,0.15,4)), '#8a6a4a', 0, 0.12, 0, g); return g; }
function refreshHives(){ HIVE_TREES.forEach(s => { const g = objMeshes.get(key(s.i,s.j)); if (!g) return; if (!g.userData.hive){ const h = hiveMesh(); h.position.set(0.32, 0.9, 0.3); g.add(h); g.userData.hive = h; h.traverse(o => { o.userData.key = key(s.i,s.j); }); } g.userData.hive.visible = !hiveDown(s); }); }
let fallenHive = null, swarm = null;
function hiveShake(s){
  if (!s.hive || hiveDown(s)) return false;
  ensureDaily(); G.me.daily.hives = G.me.daily.hives || []; G.me.daily.hives.push(s.id); saveMe(); refreshHives();
  const me = chars[G.slot], fx = wx(s.i) + Math.sign(me.x - wx(s.i))*0.6, fz = wz(s.j) + Math.sign(me.z - wz(s.j))*0.6;
  const g = hiveMesh(); g.position.set(fx, 0.12, fz); scene.add(g); fallenHive = { g, x:fx, z:fz, t:0 };
  startSwarm(wx(s.i), wz(s.j)); popWord(wx(s.i), 1.4, wz(s.j), '툭!'); toast('앗! 벌집이 떨어졌어요! 벌들이 화났어요. 도망쳐요!', 2600);
  return true;
}
function startSwarm(x, z){
  if (swarm) return; const g = new THREE.Group(); const bees = [];
  for (let k=0;k<7;k++){ const b = new THREE.Group(); M(SPH(0.07, 8, 6), '#ffd34e', 0, 0, 0, b).scale.set(1,1,1.3); M(SPH(0.035, 6, 4), '#3a2e3a', 0, 0, -0.08, b); M(GC('beestripe', () => new THREE.TorusGeometry(0.06,0.012,4,10)), '#3a2e3a', 0, 0, 0.0, b); const w = M(GC('beew', () => new THREE.CircleGeometry(0.04, 8)), new THREE.MeshBasicMaterial({ color:'#ffffff', transparent:true, opacity:0.7, side:THREE.DoubleSide }), 0, 0.04, 0, b); w.rotation.x = -Math.PI/2; g.add(b); bees.push(b); }
  scene.add(g); swarm = { g, bees, x, z, t:0, life:14, stingT:0.8, stings:0, islet: typeof isletAt === 'function' && isletAt(x, z) };
  playSfx('buzz');
}
function swarmTick(dt, tsec){
  if (fallenHive){ fallenHive.t += dt; fallenHive.g.rotation.y += dt*0.5; }
  if (!swarm) return; const S = swarm, me = chars[G.slot]; S.t += dt;
  const safe = G.inside || G.boat || G.ride || G.rescue;
  const tx = me.x, tz = me.z, dx = tx - S.x, dz = tz - S.z, d = Math.hypot(dx, dz);
  if (!safe){ const sp = Math.min(3.65, 1.5 + S.t*0.8); if (d > 0.05){ S.x += dx/d*Math.min(d, sp*dt); S.z += dz/d*Math.min(d, sp*dt); } }
  S.bees.forEach((b,k) => { const a = tsec*6 + k*0.9; b.position.set(S.x + Math.cos(a)*(0.35+0.1*Math.sin(k)), 0.9 + Math.sin(tsec*9+k)*0.18, S.z + Math.sin(a)*(0.35+0.1*Math.cos(k))); b.rotation.y = a + Math.PI/2; });
  if (Math.floor(S.t*1.5) !== Math.floor((S.t-dt)*1.5)) playSfx('buzz');
  if (!safe && d < 0.9 && !G.down){ S.stingT -= dt; if (S.stingT <= 0){ S.stingT = 1.0; S.stings++; popWord(me.x, 1.5, me.z, '따끔!', 'small'); playSfx('ouch'); try{ navigator.vibrate && navigator.vibrate(50); }catch(e){} toast('벌에 쏘였어요! ('+S.stings+'/5) 집이나 가게로 피해요!', 1300);
    if (S.stings >= 5){ endSwarm(); startRescue(S.islet ? 'heli' : 'amb'); return; } } }
  if (safe && S.t > 1){ endSwarm(); toast('벌들이 포기하고 돌아갔어요', 1800); return; }
  if (S.t > S.life){ endSwarm(); toast('휴, 벌들이 돌아갔어요', 1800); }
}
function endSwarm(){ if (!swarm) return; scene.remove(swarm.g); swarm = null; }
function pickFallenHive(){ if (!fallenHive) return false; const me = chars[G.slot]; if (Math.hypot(me.x-fallenHive.x, me.z-fallenHive.z) > 1.2) return false; scene.remove(fallenHive.g); fallenHive = null; doAnim('pick'); const isNew = addItem('honeycomb'); saveMe(); pop((isNew?'<div class="new">도감 새 등록</div>':'')+'벌집', '달콤한 벌집을 주웠어요!<br><small>잡화점에서 도토리 '+GATHER.honeycomb.price+'</small>'); return true; }

/* ---------- rescues: ambulance bears, helicopter, rescue boat ---------- */
function rescueBear(n){ const g = new THREE.Group(), m = npcModel(NPC_BY[n]); g.add(m); scene.add(g); return { g, m }; }
function fade(on){ const f = $('#fade'); f.hidden = false; f.classList.toggle('on', !!on); }
function startRescue(kind){
  const me = chars[G.slot]; if (G.rescue) return;
  stopFishing(); if (dlg) endDialog(); closePanel(); me.path = []; me.override = true;
  G.dispatchUntil = Date.now() + 45000;
  G.rescue = { kind, t:0, phase:'faint', p:{ x:me.x, z:me.z } };
  playSfx('siren');
  toast(kind === 'sea' ? '배가 가라앉아요! 구조대를 기다려요…' : '어질어질… 기절했어요! 구조대가 출동했어요', 2600);
}
function rescueTick(dt, tsec){
  const R = G.rescue; if (!R) return; R.t += dt; const me = chars[G.slot], m = me.model, P = R.p;
  const lie = () => { m.rotation.x = -Math.PI/2; m.position.y = 0.15; };
  if (R.phase === 'faint'){
    if (R.kind === 'sea'){ me.g.position.set(P.x, -0.35 + Math.sin(tsec*3)*0.05, P.z); m.userData.arms.forEach(a => a.rotation.x = -2.8 + Math.sin(tsec*8)*0.4); }
    else { me.g.position.set(P.x, 0, P.z); lie(); if (Math.floor(R.t*2) !== Math.floor((R.t-dt)*2)) popWord(P.x, 0.8, P.z, '@_@', 'small'); }
    if (R.t > 1.4){ R.phase = 'arrive'; R.t = 0;
      if (R.kind === 'amb'){ const a = Math.random()*6.28; R.b1 = rescueBear('dum'); R.b2 = rescueBear('mung'); R.from = { x:P.x + Math.cos(a)*9, z:P.z + Math.sin(a)*9 }; }
      else if (R.kind === 'heli'){ R.heli = heliMesh(); scene.add(R.heli); R.b1 = rescueBear('mung'); R.b1.g.visible = false; }
      else { R.boat = rescueBoatMesh(); scene.add(R.boat); R.b1 = rescueBear('dum'); R.b2 = rescueBear('mung'); R.from = { x:P.x + 10, z:P.z - 6 }; }
      playSfx('siren'); }
  }
  else if (R.phase === 'arrive'){
    if (R.kind === 'amb'){ const t = Math.min(1, R.t/2.2); [[R.b1,-0.55],[R.b2,0.55]].forEach(([b,o]) => { const tx = P.x + o, tz = P.z; b.g.position.set(R.from.x + (tx-R.from.x)*t + o*(1-t), 0, R.from.z + (tz-R.from.z)*t); b.g.rotation.y = Math.atan2(tx-R.from.x, tz-R.from.z); const U = b.m.userData, w = Math.sin(R.t*16); U.legs[0].rotation.x = w; U.legs[1].rotation.x = -w; U.arms[0].rotation.x = -w; U.arms[1].rotation.x = w; }); lie(); if (t >= 1){ R.phase = 'carry'; R.t = 0; toast('듬직 & 뭉치: 구조대 도착! 병원으로 가요!', 2000); } }
    else if (R.kind === 'heli'){ const t = Math.min(1, R.t/2.5); R.heli.position.set(P.x - 8*(1-t), 9 - 5*t, P.z - 6*(1-t)); R.heli.userData.rotor.rotation.y += dt*30; me.g.position.set(P.x, 0, P.z); lie(); if (t >= 1){ R.phase = 'rope'; R.t = 0; R.b1.g.visible = true; toast('헬리콥터 구조대 도착!', 1800); } }
    else { const t = Math.min(1, R.t/2.5); R.boat.position.set(R.from.x + (P.x+2.2-R.from.x)*t, 0, R.from.z + (P.z-R.from.z)*t); R.boat.rotation.y = Math.atan2(P.x+2.2-R.from.x, P.z-R.from.z); [R.b1,R.b2].forEach((b,k) => { b.g.position.set(R.boat.position.x + (k?0.25:-0.25), 0.25, R.boat.position.z); }); me.g.position.set(P.x, -0.35 + Math.sin(tsec*3)*0.05, P.z); if (t >= 1){ R.phase = 'tube'; R.t = 0; R.tube = M(new THREE.TorusGeometry(0.3,0.1,8,18), '#ff9a8a', 0, 0, 0, scene); R.tube.rotation.x = Math.PI/2; toast('구조대: 튜브 받아요~!', 1800); } }
  }
  else if (R.phase === 'carry'){ const t = Math.min(1, R.t/2.0), ax = R.from.x - P.x, az = R.from.z - P.z, al = Math.hypot(ax, az) || 1, cx = P.x + ax/al*3*t, cz = P.z + az/al*3*t;
    me.g.position.set(cx, 0.55, cz); m.rotation.x = -Math.PI/2; m.position.y = 0;
    [[R.b1,-0.55],[R.b2,0.55]].forEach(([b,o]) => { b.g.position.set(cx + o, 0, cz); b.g.rotation.y = Math.atan2(ax, az); const U = b.m.userData, w = Math.sin(R.t*14); U.legs[0].rotation.x = w; U.legs[1].rotation.x = -w; U.arms.forEach(a => a.rotation.x = -1.5); });
    if (R.t > 1.2 && !R.faded){ R.faded = true; fade(true); } if (R.t > 2.2){ R.phase = 'hospital'; R.t = 0; } }
  else if (R.phase === 'rope'){ const H = R.heli; H.userData.rotor.rotation.y += dt*30; const t = R.t;
    if (t < 1.2){ R.b1.g.position.set(P.x, 4 - 3.8*(t/1.2), P.z); } else if (t < 1.8){ R.b1.g.position.set(P.x, 0.2, P.z); lie(); } else { const u = Math.min(1, (t-1.8)/1.6); R.b1.g.position.set(P.x, 0.2 + 3.6*u, P.z); me.g.position.set(P.x + 0.3, 0.2 + 3.6*u, P.z); m.rotation.x = -Math.PI/2.5; }
    if (!R.rope){ R.rope = M(new THREE.CylinderGeometry(0.015,0.015,1,4), '#fff4e8', 0, 0, 0, scene); } const ry = R.b1.g.position.y + 0.9; R.rope.scale.y = Math.max(0.1, 4 - ry); R.rope.position.set(P.x, (4 + ry)/2, P.z);
    if (t > 3.0 && !R.faded){ R.faded = true; fade(true); } if (t > 3.8){ R.phase = 'hospital'; R.t = 0; } }
  else if (R.phase === 'tube'){ const t = Math.min(1, R.t/0.8), bx = R.boat.position.x, bz = R.boat.position.z; R.tube.position.set(bx + (P.x-bx)*t, 0.2 + Math.sin(t*Math.PI)*1.2, bz + (P.z-bz)*t);
    if (R.t > 0.9){ const u = Math.min(1, (R.t-0.9)/1.4); const px = P.x + (bx-0.4-P.x)*u, pz = P.z + (bz-P.z)*u; me.g.position.set(px, -0.25 + 0.5*u, pz); R.tube.position.set(px, -0.05 + 0.5*u, pz); }
    if (R.t > 2.6 && !R.faded){ R.faded = true; fade(true); } if (R.t > 3.4){ R.phase = 'harbor'; R.t = 0; } }
  else if (R.phase === 'hospital' || R.phase === 'harbor'){
    if (!R.done){ R.done = true; ['b1','b2'].forEach(k => R[k] && scene.remove(R[k].g)); if (R.heli) scene.remove(R.heli); if (R.boat) scene.remove(R.boat); if (R.tube) scene.remove(R.tube); if (R.rope) scene.remove(R.rope);
      m.rotation.set(0,0,0); m.position.y = 0; me.override = false;
      if (R.phase === 'hospital'){ if (G.boat) leaveBoatHere(); enterShop('hosp'); const H = playerBed(); me.x = iwx(H.x); me.z = iwz(H.z)+0.4; me.g.position.set(me.x, 0.55, me.z); me.override = true; m.rotation.x = -Math.PI/2; }
      else { sinkBoat(); const [i,j] = T(15, -19); charAt(me, i, j); G.me.i = i; G.me.j = j; saveMe(); }
      setTimeout(() => fade(false), 200); }
    if (R.phase === 'hospital' && R.t > 1.6 && !R.talked){ R.talked = true; m.rotation.set(0,0,0); me.override = false; const H = playerBed(); const [ti,tj] = [H.x + (H.x >= IW-1 ? -1 : 1), H.z + 2]; me.x = iwx(ti); me.z = iwz(tj); me.g.position.set(me.x, 0, me.z);
      const fee = R.kind === 'heli' ? 100 : 10; spend(fee); regenStamina(); G.me.stamina = Math.max(G.me.stamina, 50); updateHud();
      const doc = G.inside.clerkNp; const lines = [R.kind==='heli' ? '헬리콥터로 실려 왔어요. 무인도의 벌들은 정말 사납죠?' : '듬직이랑 뭉치가 업고 왔어요. 벌에 많이 쏘였네요.', '약 바르고 푹 쉬었으니 이제 괜찮아요. 체력도 조금 채워 뒀어요.', '치료비'+(R.kind==='heli'?'랑 헬리콥터 출동비':'')+'로 도토리 '+fee+'개를 받았어요. 다음엔 벌집 조심해요!'];
      if (doc) talkTo(doc, lines); else pop('치료 끝', '도토리 -'+fee);
      G.rescue = null; }
    if (R.phase === 'harbor' && R.t > 0.8 && !R.talked){ R.talked = true; G.rescue = null; const np = npcs.cap; if (np && np.g.visible){ talkTo(np, ['괜찮아?! 구조대가 튜브로 건져 왔어. 다친 데 없어서 다행이야.', '배는 바다 밑으로 가라앉았지만 걱정 마. 새 배를 준비해 뒀어. 다음엔 암초 조심해!']); } else pop('구조 완료', '구조선이 항구까지 데려다줬어요'); }
  }
}
function rescueBoatMesh(){ const g = boatMesh('#ff9a8a'); const s = signMesh('구조선', 0.8, 0.24, '#ffffff', '#ef6a6a'); s.position.set(0, 0.55, 0.7); g.add(s); return g; }
