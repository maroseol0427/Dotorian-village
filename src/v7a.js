/* =====================================================================
   v7: bigger north, 숲밭섬 plots, benches & swings, jumping onto things,
       faces & sleep, hospital/police, villagers' social life, newcomers, minimap
   ===================================================================== */
Object.assign(NH_STYLE, {
  n1:{ wall:'#f4f0ff', roof:'#b8a8e8', shape:'cone', sign:'구름네', trim:'#8a7ab8' },
  n2:{ wall:'#fff2e6', roof:'#ff9a6a', shape:'tent', sign:'도담네', trim:'#e0805a' },
  n3:{ wall:'#f6eadc', roof:'#a87c5a', shape:'gable', sign:'나무네', trim:'#7a5a3a', logs:true },
  n4:{ wall:'#fff0f6', roof:'#ffb7d0', shape:'dome', sign:'솜이네', trim:'#ff9ab8' },
  n5:{ wall:'#ffffff', roof:'#9fdcb4', shape:'cloud', sign:'판도네', trim:'#5b5468' },
});
SHOP_ROOMS.hosp.w = 12; SHOP_ROOMS.hosp.d = 8; SHOP_ROOMS.hosp.clerkAt = [5,3];
SHOP_ROOMS.hosp.items = [
  { id:'counter3', x:4, z:4, show:'clerk' }, { id:'hbed', x:0, z:0 }, { id:'hbed', x:2, z:0 }, { id:'hbed', x:4, z:0 }, { id:'hbed', x:7, z:0 }, { id:'hbed', x:9, z:0 }, { id:'hbed', x:11, z:0 },
  { id:'plant', x:11, z:6 }, { id:'bench2', x:0, z:6 }, { id:'frame', x:6, z:0 }, { id:'clock', x:8, z:0 },
];
const HOSP_BEDS = SHOP_ROOMS.hosp.items.filter(it => it.id === 'hbed');
SHOP_ROOMS.police = { w:10, d:6, wall:'wall_stripe', floor:'floor_stone', title:'도토리 경찰서', titleC:'#5b7fd1', clerk:'cop1', clerkAt:[4,1], extra:[{ npc:'cop2', at:[7,1] }], hello:'여울: 도토리 경찰서예요. 안전 운전 부탁해요!', items:[
  { id:'counter4', x:3, z:2, show:'clerk' }, { id:'bench2', x:0, z:4 }, { id:'plant', x:9, z:4 }, { id:'clock', x:4, z:0 }, { id:'police_car', x:7, z:3 },
] };
SHOP_ROOMS.jobk = { w:10, d:6, wall:'wall_lav', floor:'floor_check', title:'JOB꼬리아', titleC:'#9a6ad8', clerk:'jobman', clerkAt:[4,1], hello:'꼬리: 어서 오세요, JOB꼬리아입니다! 알바생이 필요하면 말씀하세요.', items:[
  { id:'counter4', x:3, z:2, show:'clerk' }, { id:'board', x:0, z:0, show:'jobboard', tag:'구인 게시판' }, { id:'bench2', x:0, z:4 }, { id:'bench2', x:8, z:4 }, { id:'plant', x:9, z:0 },
] };
SHOP_SVC.police = '벌금·안전 이야기'; SHOP_SVC.jobk = '알바생 모집 신청'; SHOP_NAME.police = '도토리 경찰서'; SHOP_NAME.jobk = 'JOB꼬리아';
FURN.police_car = { name:'경찰차', w:3, d:2, fixture:true };
NPCS.push(
  { id:'cop1', name:'여울', kind:'여우', job:'경찰관', likes:['shell','dig'], gift:'globe', work:'police', hours:[0,24], allDay:true,
    look:{ skin:'#ffdcbf', hair:'short', hairColor:'#f2a86a', eyes:'round', mouth:'smile', animal:{ type:'fox', fur:'#f2a86a', inner:'#fff0e0' } }, wear:{ top:'jacket_black', bottom:'pants_black', hat:'cap_blue', shoes:'boots_brown' } },
  { id:'cop2', name:'치즈', kind:'고양이', job:'경찰관', likes:['bug','tree'], gift:'clock', work:'police', hours:[0,24], allDay:true,
    look:{ skin:'#ffe8cc', hair:'short', hairColor:'#ffcf7a', eyes:'smile', mouth:'cat', animal:{ type:'cat', fur:'#ffcf7a', inner:'#ffc6d6' } }, wear:{ top:'jacket_black', bottom:'pants_black', hat:'cap_blue', shoes:'boots_brown' } },
  { id:'jobman', name:'꼬리', kind:'다람쥐 같은 여우', job:'JOB꼬리아 상담원', likes:['tree','crop'], gift:'desk', work:'jobk', hours:[7,23],
    look:{ skin:'#ffe2cc', hair:'bob', hairColor:'#d8905a', eyes:'round', mouth:'open', animal:{ type:'fox', fur:'#d8905a', inner:'#fff6ea' } }, wear:{ top:'shirt_tie', bottom:'pants_beige', face:'glasses_brown', shoes:'loafer' } },
);
NPCS.forEach(n => { NPC_BY[n.id] = n; });
Object.assign(LINES, {
  cop1:{ intro:['도토리 경찰서 경찰관 여울이에요. 탈것 탈 땐 주민을 조심해요!','{name}, 반가워요. 마을의 평화는 제가 지킬게요.'], morning:['아침 순찰 완료! 오늘도 평화로워요.'], day:['자동차나 스쿠터로 주민을 치면 벌금 도토리 100개예요.'], evening:['저녁엔 전조등 켜고 다녀요!'], night:['밤에도 경찰서는 열려 있어요.'],
    chat0:['기차 선로를 건널 땐 좌우를 잘 봐요.','주민이 다치면 병원에 입원해요. 미안한 마음이 들죠?'], chat1:['사실 저 꼬리로 균형 잡는 거 엄청 잘해요.'], chat2:['{name}는 모범 시민이에요!'], giftLike:['어머, 고마워요! 근무 끝나고 볼게요.'], giftOk:['고마워요!'], tooMuch:['순찰 가야 해요. 다음에 또 봐요!'], bye:['안전 운전!','조심히 가요!'] },
  cop2:{ intro:['치즈 순경이다냥! 과속 단속 중이다냥.'], morning:['아침엔 졸리다냥…'], day:['삐뽀삐뽀~ 출동 연습 중이다냥.'], evening:['노을 단속… 아니 감상 중이다냥.'], night:['야간 근무는 생선포가 필수다냥.'],
    chat0:['벌금은 은행에 가서 내는 게 아니라 여기서 바로 낸다냥.'], chat1:['사실 경찰차 운전은 여울 선배가 다 한다냥.'], chat2:['{name}랑은 친구다냥!'], giftLike:['우와 최고다냥!'], giftOk:['고맙다냥.'], tooMuch:['근무 중이다냥!'], bye:['또 봐라냥!'] },
  jobman:{ intro:['어서 오세요! JOB꼬리아 상담원 꼬리예요. 일손이 필요하면 알바생을 보내 드려요!','{name} 님, 숲밭섬에 밭을 사셨나요? 알바생이 심고 수확까지 해 드려요!'], morning:['오늘도 구인 게시판이 꽉 찼어요!'], day:['알바생은 성실하기로 유명하죠.'], evening:['곧 마감이에요. 신청은 서둘러요!'], night:['야근 중이에요… 하암.'],
    chat0:['알바비는 도토리 10개! 씨앗 50개만 주시면 두 번 수확까지 해 드려요.','숲밭섬 밭은 표지판에서 살 수 있어요.'], chat1:['사실 저도 옛날엔 알바생이었어요!'], chat2:['{name} 님은 우리 VIP 고객님이에요!'], giftLike:['우와, 감사합니다!'], giftOk:['감사해요!'], tooMuch:['상담이 밀려서요, 다음에 또 와요!'], bye:['좋은 하루 되세요!'] },
});

/* ---------- meshes for the new places ---------- */
function buildBigStation(){
  const g = new THREE.Group();
  M(new THREE.BoxGeometry(5.2,0.18,3.0), '#ece6f4', 0, 0.09, 0, g);
  M(new THREE.BoxGeometry(4.8,1.9,2.6), '#fff4e8', 0, 1.1, -0.05, g);
  const rf = M(new THREE.CylinderGeometry(1.5, 1.5, 5.0, 3, 1), '#8fb8e8', 0, 2.35, 0, g); rf.rotation.set(-Math.PI/2, 0, Math.PI/2); rf.scale.set(1, 1, 0.5);
  M(new THREE.BoxGeometry(1.1,2.6,1.1), '#ffe6c8', 1.7, 2.3, -0.4, g); M(new THREE.ConeGeometry(0.85,0.9,4), '#ff9a8a', 1.7, 4.05, -0.4, g).rotation.y = Math.PI/4;
  M(new THREE.CylinderGeometry(0.36,0.36,0.06,24), '#ffffff', 1.7, 3.1, 0.17, g).rotation.x = Math.PI/2; M(new THREE.TorusGeometry(0.36,0.04,6,24), '#7a8fd0', 1.7, 3.1, 0.2, g);
  M(new THREE.BoxGeometry(0.03,0.24,0.02), '#5b4b78', 1.7, 3.16, 0.22, g); M(new THREE.BoxGeometry(0.16,0.03,0.02), '#5b4b78', 1.76, 3.1, 0.22, g);
  [-1.6,-0.6,0.6].forEach(x => M(new THREE.BoxGeometry(0.7,1.2,0.06), matWin, x, 0.9, 1.26, g));
  M(new THREE.BoxGeometry(0.9,1.3,0.07), '#7a8fd0', 1.6, 0.75, 1.27, g);
  const s = signMesh('마을역', 2.0, 0.5, '#ffffff', '#5b7fd1'); s.position.set(-0.4, 1.9, 1.38); g.add(s);
  [-2.2,2.2].forEach(x => M(SPH(0.28, 12, 10), '#b8e6a0', x, 0.28, 1.5, g));
  return g;
}
function buildPolice(){
  const g = new THREE.Group();
  M(new THREE.BoxGeometry(2.9,0.16,2.9), '#efe4d6', 0, 0.08, 0, g);
  M(new THREE.BoxGeometry(2.6,1.6,2.5), '#e6eefc', 0, 0.95, -0.05, g);
  M(new THREE.BoxGeometry(2.8,0.22,2.7), '#7a9ae0', 0, 1.85, -0.05, g);
  M(new THREE.BoxGeometry(2.62,0.2,0.04), '#ffffff', 0, 1.3, 1.22, g);
  M(new THREE.CylinderGeometry(0.14,0.14,0.2,12), '#ff6a7a', -0.25, 2.06, 0.4, g); M(new THREE.CylinderGeometry(0.14,0.14,0.2,12), '#6a9aff', 0.25, 2.06, 0.4, g);
  M(new THREE.BoxGeometry(0.7,0.95,0.07), '#5b7fd1', 0, 0.6, 1.22, g); [-0.85,0.85].forEach(x => M(new THREE.BoxGeometry(0.5,0.5,0.06), matWin, x, 0.95, 1.22, g));
  M(new THREE.CylinderGeometry(0.2,0.2,0.04,5), '#ffd34e', 0, 1.58, 1.26, g).rotation.x = Math.PI/2;
  const s = signMesh('경찰서', 1.2, 0.36, '#ffffff', '#5b7fd1'); s.position.set(0, 1.45, 1.5); s.rotation.x = -0.15; g.add(s);
  return g;
}
function buildJobk(){
  const g = new THREE.Group();
  M(new THREE.BoxGeometry(5.0,0.16,3.0), '#efe4d6', 0, 0.08, 0, g);
  M(new THREE.BoxGeometry(4.6,1.7,2.6), '#f4ecff', 0, 1.0, -0.05, g);
  M(new THREE.BoxGeometry(4.9,0.3,2.9), '#b89ae8', 0, 1.95, -0.05, g);
  awning(4.4, '#ffffff', '#ffd36a', g, 1.55, 1.32);
  [-1.4,1.4].forEach(x => M(new THREE.BoxGeometry(1.1,0.8,0.06), matWin, x, 0.8, 1.26, g)); M(new THREE.BoxGeometry(0.8,1.05,0.07), '#9a6ad8', 0, 0.62, 1.27, g);
  M(new THREE.BoxGeometry(0.9,1.1,0.05), '#fff4e8', -1.9, 0.75, 1.55, g); for (let k=0;k<4;k++) M(new THREE.BoxGeometry(0.22,0.18,0.02), ['#ffb7c9','#ffe6a3','#a8d8f0','#cdbcf2'][k], -2.08 + (k%2)*0.36, 0.95 - Math.floor(k/2)*0.3, 1.58, g);
  const s = signMesh('JOB꼬리아', 2.4, 0.5, '#ffffff', '#9a6ad8'); s.position.set(0, 1.96, 1.56); g.add(s);
  return g;
}
function buildSwingset(b){
  const g = new THREE.Group(); g.userData.seats = [];
  [-1.45, 1.45].forEach(x => { [-0.45, 0.45].forEach(z => { const p = M(GC('swpost', () => new THREE.CylinderGeometry(0.05,0.06,2.1,8)), '#ffb7c9', x, 1.0, z*0.6, g); p.rotation.x = z > 0 ? -0.22 : 0.22; }); });
  M(GC('swbar', () => new THREE.CylinderGeometry(0.06,0.06,3.0,10)), '#9fdcc4', 0, 2.0, 0, g).rotation.z = Math.PI/2;
  [-0.7, 0.7].forEach((x,k) => { const piv = new THREE.Group(); piv.position.set(x, 1.98, 0); g.add(piv);
    [-0.22, 0.22].forEach(o => M(GC('swrope', () => new THREE.CylinderGeometry(0.012,0.012,1.45,4)), '#fff4e8', o, -0.72, 0, piv));
    M(GC('swseat', () => new THREE.BoxGeometry(0.5,0.06,0.26)), ['#ffe6a3','#a8d8f0'][k], 0, -1.45, 0, piv); g.userData.seats.push(piv); });
  return g;
}
function buildBench(s){
  const g = new THREE.Group(), b = new THREE.Group(); g.add(b); b.rotation.y = s.face;
  M(GC('bseat', () => new THREE.BoxGeometry(0.92,0.08,0.4)), '#e8c09a', 0, 0.4, 0, b); M(GC('bback', () => new THREE.BoxGeometry(0.92,0.3,0.06)), '#e8c09a', 0, 0.68, -0.2, b);
  [-0.38,0.38].forEach(x => { M(GC('bleg', () => new THREE.BoxGeometry(0.06,0.4,0.36)), '#a89cc0', x, 0.2, 0, b); });
  return g;
}
function plotSignTex(P){
  const own = Store.data.placed['plot_'+P.id];
  return signTex(own ? (own.name||'가족')+'네 밭' : P.name+' · 판매 중', own ? '#fffaf0' : '#fff4d0', own ? '#4f8a5a' : '#c8784a');
}
function buildPlotSign(P){
  const g = new THREE.Group(); [-0.35,0.35].forEach(x => M(GC('pspost', () => new THREE.CylinderGeometry(0.04,0.05,0.9,8)), '#c8a088', x, 0.45, 0, g));
  M(GC('psboard', () => new THREE.BoxGeometry(1.0,0.34,0.06)), '#e6c8a6', 0, 0.8, -0.02, g);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.96,0.3), new THREE.MeshBasicMaterial({ map:plotSignTex(P), transparent:true })); m.position.set(0, 0.8, 0.02); g.add(m); g.userData.face = m; g.userData.plot = P;
  return g;
}
// plot signs and bench statics
PLOTS.forEach(P => { const [i,j] = T(P.sign[0], P.sign[1]); statics.set(key(i,j), { kind:'plotsign', id:'ps_'+P.id, plot:P, i, j }); });
const _buildExtraB6 = buildExtraB;
buildExtraB = function(s){
  if (s.kind === 'bigstation') return buildBigStation();
  if (s.kind === 'police') return buildPolice();
  if (s.kind === 'jobk') return buildJobk();
  if (s.kind === 'swingset') return buildSwingset(s);
  return _buildExtraB6(s);
};
function buildWorld7(){
  statics.forEach((s,k) => {
    if (s.kind === 'bench'){ const g = buildBench(s); g.position.set(wx(s.i), 0, wz(s.j)); g.traverse(o => { o.userData.key = k; }); worldRoot.add(g); objMeshes.set(k, g); }
    if (s.kind === 'plotsign'){ const g = buildPlotSign(s.plot); g.position.set(wx(s.i), 0, wz(s.j)); g.traverse(o => { o.userData.key = k; }); worldRoot.add(g); objMeshes.set(k, g); s.g = g; }
  });
  statics.forEach(s => { if (s.kind === 'plotsign') s.g.rotation.y = s.plot.id === 'E' ? -Math.PI/2 : s.plot.sign[0] < 0 ? Math.PI/2 : -Math.PI/2; });
}
function refreshPlotSigns(){ statics.forEach(s => { if (s.kind === 'plotsign' && s.g){ const m = s.g.userData.face; m.material.map = plotSignTex(s.plot); m.material.needsUpdate = true; } }); }
Store.on('placed', () => { if (G.started) refreshPlotSigns(); });
const _buildWorld6b = buildWorld;
buildWorld = function(){ _buildWorld6b(); buildWorld7(); rebuildPickables(); };

/* ---------- sitting on benches & swinging ---------- */
function sitBench(s){
  const me = chars[G.slot]; stopFishing(); me.path = [];
  G.sit = { kind:'bench', s, t:0 }; me.override = true; me.face = s.face;
  me.g.position.set(wx(s.i), 0, wz(s.j)); me.x = wx(s.i); me.z = wz(s.j); toast('벤치에 앉았어요. 움직이면 일어나요', 1400);
}
const swingUse = {}; // swingset id -> [occupant, occupant]
function swingSeatWorld(b, k){
  const g = objMeshes.get(b.id); const piv = g && g.userData.seats[k]; if (!piv) return null;
  const a = piv.rotation.x, L = 1.45; return { x:b.cx + (k ? 0.7 : -0.7), y:1.98 - Math.cos(a)*L, z:b.cz - Math.sin(a)*L, a };
}
function sitSwing(b){
  const me = chars[G.slot], occ = swingUse[b.id] = swingUse[b.id] || [null,null];
  const k = occ[0] && occ[0] !== 'me' ? (occ[1] && occ[1] !== 'me' ? -1 : 1) : 0; if (k < 0){ toast('그네가 꽉 찼어요'); return; }
  stopFishing(); me.path = []; occ[k] = 'me'; G.sit = { kind:'swing', b, k, t:0 }; me.override = true; me.face = 0;
  const kini = npcs.kini; if (kini && G.me.kini && G.me.kini.on && kini.g.visible && !occ[1-k]){ occ[1-k] = 'kini'; kini.override = true; G.sit.kini = kini; setTimeout(() => toast('끼니도 옆 그네에 탔어요! 헤헤', 1600), 400); }
  toast('그네를 타요! 움직이면 내려요', 1400); doAnim('cheer');
}
function standUp(){
  const S = G.sit; if (!S) return; const me = chars[G.slot]; G.sit = null; me.override = false; const m = me.model; m.position.y = 0; m.rotation.set(0,0,0); if (S.kini) S.kini.model.rotation.set(0,0,0);
  let tx, tz;
  if (S.kind === 'bench'){ tx = wx(S.s.i) + Math.sin(S.s.face); tz = wz(S.s.j) + Math.cos(S.s.face); }
  else { swingUse[S.b.id][S.k] = null; tx = S.b.cx + (S.k ? 0.7 : -0.7); tz = S.b.cz + 1; if (S.kini){ swingUse[S.b.id][1-S.k] = null; S.kini.override = false; const [ki,kj] = nearestFree(S.b.cx + (S.k ? -0.7 : 0.7), S.b.cz + 1); S.kini.i = ki; S.kini.j = kj; S.kini.x = wx(ki); S.kini.z = wz(kj); S.kini.jump = { t:-0.1 }; } }
  const [i,j] = nearestFree(tx, tz); charAt(me, i, j); G.me.i = i; G.me.j = j; saveMe();
}
function sitTick(dt, tsec){
  // swing animation for everyone on swings
  BUILD.forEach(b => { if (b.kind !== 'swingset') return; const g = objMeshes.get(b.id); if (!g) return; const occ = swingUse[b.id] || []; g.userData.seats.forEach((piv,k) => { const want = occ[k] ? Math.sin(tsec*2.2 + k*1.3)*0.7 : 0; piv.rotation.x += (want - piv.rotation.x)*Math.min(1, dt*4); }); });
  const S = G.sit; if (!S) return; const me = chars[G.slot], U = me.model.userData; S.t += dt;
  let mx = ctl.pad.x, mz = ctl.pad.z; ctl.keys.forEach(k => { mx += KEYMAP[k][0]; mz += KEYMAP[k][1]; });
  if (Math.hypot(mx, mz) > 0.3 && S.t > 0.4){ standUp(); return; }
  U.legs.forEach(l => l.rotation.x = -1.45);
  if (S.kind === 'bench'){ me.g.position.set(wx(S.s.i) - Math.sin(S.s.face)*0.05, 0.36, wz(S.s.j) - Math.cos(S.s.face)*0.05); me.g.rotation.y = S.s.face; me.model.position.y = 0; U.arms.forEach(a => a.rotation.x = -0.3); }
  else { const p = swingSeatWorld(S.b, S.k); if (p){ me.g.position.set(p.x, p.y - 0.42, p.z); me.g.rotation.y = 0; me.model.rotation.x = p.a*0.8; U.arms.forEach(a => a.rotation.x = -2.6 + p.a*0.4); me.model.position.y = 0; }
    if (S.kini){ const q = swingSeatWorld(S.b, 1-S.k); if (q){ const k = S.kini; k.g.position.set(q.x, q.y - 0.35, q.z); k.g.rotation.y = 0; k.model.rotation.x = q.a*0.8; k.model.userData.legs.forEach(l => l.rotation.x = -1.3); k.x = q.x; k.z = q.z; } } }
}
