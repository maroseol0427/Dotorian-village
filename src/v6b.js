/* ---------- island line: a shuttle on trestles linking 꽃섬 · 도토리섬 · 야자섬 · 농장섬 ---------- */
function makeLine(pts){
  const out = []; let acc = 0;
  for (let k=0;k<pts.length-1;k++){ const [x1,z1] = pts[k], [x2,z2] = pts[k+1], L = Math.hypot(x2-x1, z2-z1), n = Math.ceil(L/0.2);
    for (let s=0;s<n;s++){ const x = x1+(x2-x1)*s/n, z = z1+(z2-z1)*s/n; if (out.length) acc += Math.hypot(x-out[out.length-1].x, z-out[out.length-1].z); out.push({ x, z, s:acc }); } }
  const [lx,lz] = pts[pts.length-1]; acc += Math.hypot(lx-out[out.length-1].x, lz-out[out.length-1].z); out.push({ x:lx, z:lz, s:acc });
  return { pts:out, L:acc };
}
const ISL = makeLine([[-39,7],[-39,19],[-36,22],[-14,22],[4,22],[34,22],[39,19],[39,15]]);
function islAt(s){
  s = Math.max(0, Math.min(ISL.L, s)); const P = ISL.pts; let lo = 0, hi = P.length-1;
  while (lo < hi){ const m = (lo+hi+1)>>1; if (P[m].s <= s) lo = m; else hi = m-1; }
  const a = P[lo], b = P[Math.min(lo+1, P.length-1)]; const L = b.s - a.s, t = L ? (s-a.s)/L : 0;
  const ang = Math.atan2(b.x-a.x, b.z-a.z) || (lo ? Math.atan2(a.x-P[lo-1].x, a.z-P[lo-1].z) : 0);
  return { x:a.x+(b.x-a.x)*t, z:a.z+(b.z-a.z)*t, ang };
}
const islS = (x,z) => { let best = 0, bd = 1e9; ISL.pts.forEach(p => { const d = (p.x-x)**2+(p.z-z)**2; if (d<bd){ bd=d; best=p.s; } }); return best; };
const forceT = (x,z,t) => { const [i,j] = T(x,z); if (!inb(i,j)) return; tile[idx(i,j)] = t; const st = statics.get(key(i,j)); if (st && (st.kind==='tree' || st.kind==='rock')) statics.delete(key(i,j)); };
// rail bed on land, piers & platforms over water
ISL.pts.forEach(p => { const x = Math.round(p.x), z = Math.round(p.z); const t = tAt(x,z); if (t !== WATER && t !== BRIDGE && t !== PLAT) forceT(x,z,TRACK); });
const ISL_ST = [
  { id:'iflower', name:'꽃섬역', line:'island', px:-38, pz:8, tiles:[[-38,7],[-38,8],[-38,9]], pier:[], tx:-39, tz:8 },
  { id:'imain', name:'도토리섬 남쪽역', line:'island', px:-14, pz:21, tiles:[[-15,21],[-14,21],[-13,21]], pier:[[-14,20],[-14,19],[-14,18]], tx:-14, tz:22 },
  { id:'ipalm', name:'야자섬역', line:'island', px:2, pz:23, tiles:[[1,23],[2,23],[3,23]], pier:[[2,24],[2,25],[2,26],[2,27]], tx:2, tz:22 },
  { id:'ifarm', name:'농장섬역', line:'island', px:37, pz:16, tiles:[[37,15],[37,16],[37,17]], pier:[[36,17]], tx:39, tz:16 },
];
ISL_ST.forEach(st => { st.s = islS(st.tx, st.tz); st.tiles.forEach(([x,z]) => forceT(x,z,PLAT)); st.pier.forEach(([x,z]) => { if (tAt(x,z) === WATER || statics.has(key(...T(x,z)))) forceT(x,z,PLAT); }); STATIONS.push(st); });
STATIONS.forEach(st => { if (!st.line) st.line = 'loop'; });
const islTrain = { s:0, dir:1, wait:0, group:new THREE.Group(), cars:[] };
// open-top cars so riders are visible (both trains)
function openCar(col){
  const g = new THREE.Group();
  M(GC('car_floor', () => new THREE.BoxGeometry(0.84,0.22,1.25)), col, 0, 0.32, 0, g);
  [-1,1].forEach(s => M(GC('car_side', () => new THREE.BoxGeometry(0.06,0.3,1.25)), col, 0.4*s, 0.56, 0, g));
  [-1,1].forEach(s => M(GC('car_end', () => new THREE.BoxGeometry(0.84,0.3,0.06)), shade(col,0.94), 0, 0.56, 0.6*s, g));
  M(GC('car_seat', () => new THREE.BoxGeometry(0.7,0.12,0.32)), '#fff4e8', 0, 0.5, -0.32, g); M(GC('car_seat2', () => new THREE.BoxGeometry(0.7,0.12,0.32)), '#fff4e8', 0, 0.5, 0.25, g);
  [-1,1].forEach(s => M(GC('car_rim', () => new THREE.BoxGeometry(0.08,0.05,1.3)), '#fff4e8', 0.41*s, 0.72, 0, g));
  [[-0.42,0.36],[0.42,0.36],[-0.42,-0.36],[0.42,-0.36]].forEach(([x,z]) => M(GC('car_wheel', () => new THREE.CylinderGeometry(0.15,0.15,0.08,16)), '#8a7aa8', x, 0.17, z, g).rotation.z = Math.PI/2);
  return g;
}
(function(){
  // swap the loop train's closed cars for open ones
  while (train.cars.length > 1){ const c = train.cars.pop(); train.group.remove(c); }
  ['#a8dcf0','#b8e6b0'].forEach(col => { const g = openCar(col); train.group.add(g); train.cars.push(g); });
  train.group.traverse(o => { o.userData.key = 'train'; });
  // island shuttle: mint engine + two open cars
  const eng = new THREE.Group();
  M(new THREE.CapsuleGeometry(0.34, 0.75, 6, 16), '#9fdcc4', 0, 0.55, 0.12, eng).rotation.x = Math.PI/2;
  M(new THREE.BoxGeometry(0.82,0.75,0.55), '#b6e8d4', 0, 0.72, -0.4, eng); M(new THREE.BoxGeometry(0.95,0.1,0.7), '#fff4e8', 0, 1.13, -0.4, eng);
  M(new THREE.CylinderGeometry(0.1,0.14,0.36,12), '#8a7aa8', 0, 1.0, 0.45, eng); M(new THREE.SphereGeometry(0.1,12,8), matBulb, 0, 0.55, 0.62, eng); M(new THREE.BoxGeometry(0.7,0.28,0.04), matWin, 0, 0.85, -0.12, eng);
  [[-0.42,0.36],[0.42,0.36],[-0.42,-0.36],[0.42,-0.36]].forEach(([x,z]) => M(GC('car_wheel', () => new THREE.CylinderGeometry(0.15,0.15,0.08,16)), '#8a7aa8', x, 0.17, z, eng).rotation.z = Math.PI/2);
  islTrain.group.add(eng); islTrain.cars.push(eng);
  ['#ffd6e2','#fff0b8'].forEach(col => { const g = openCar(col); islTrain.group.add(g); islTrain.cars.push(g); });
  islTrain.group.traverse(o => { o.userData.key = 'train'; }); scene.add(islTrain.group);
})();
function placeIslTrain(){ islTrain.cars.forEach((c,k) => { const p = islAt(islTrain.s - islTrain.dir*k*1.45); c.position.set(p.x, 0, p.z); c.rotation.y = p.ang + (islTrain.dir < 0 ? Math.PI : 0); }); }
function buildIslRails(){
  const list = [];
  for (let s=0; s<ISL.L; s+=0.5){ const p = islAt(s); const x = Math.round(p.x), z = Math.round(p.z), wet = tAt(x,z) === WATER || tAt(x,z) === BRIDGE;
    list.push([p.x, wet ? 0.12 : 0.03, p.z, 0.85, 0.05, 0.14, '#d8bca8', p.ang+Math.PI/2]);
    if (wet && Math.round(s*2) % 4 === 0){ [-0.4,0.4].forEach(o => list.push([p.x+Math.cos(p.ang)*o, -0.35, p.z-Math.sin(p.ang)*o, 0.12, 0.9, 0.12, '#c8b098', 0])); list.push([p.x, 0.04, p.z, 1.0, 0.1, 0.5, '#e0c8ac', p.ang+Math.PI/2]); } }
  for (let s=0; s<ISL.L; s+=0.35){ const p = islAt(s+0.175); const wet = tAt(Math.round(p.x), Math.round(p.z)) === WATER; [-0.27,0.27].forEach(o => list.push([p.x+Math.cos(p.ang)*o, wet ? 0.17 : 0.08, p.z-Math.sin(p.ang)*o, 0.06,0.05,0.38,'#a8a4c0',p.ang])); }
  const m = vox(list); m.castShadow = false; return m;
}
function buildPiers(){
  const list = []; ISL_ST.forEach(st => st.tiles.concat(st.pier).forEach(([x,z]) => { list.push([x, -0.04, z, 1.0, 0.12, 1.0, '#ece6f4', 0]); list.push([x, -0.45, z, 0.14, 0.8, 0.14, '#c8b098', 0]); }));
  return vox(list);
}
const _buildWorld5 = buildWorld;
buildWorld = function(){ _buildWorld5(); worldRoot.add(buildIslRails()); worldRoot.add(buildPiers()); if (typeof buildWorld6 === 'function') buildWorld6(); rebuildPickables(); };
// stations: one line at a time
openStation = function(st){
  G.panel = 'station'; const fare = st.line === 'island' ? ECON.fare*2 : ECON.fare;
  const dests = STATIONS.filter(s => s !== st && s.line === st.line);
  openPanel(st.name, '<p class="note">'+(st.line==='island' ? '섬 연결 열차예요. 바다 위를 달려 다른 섬으로 가요.' : '도토리섬 순환 기차예요.')+' 기차표는 도토리 '+fare+'개. 어디로 갈까요?</p>'+dests.map(d => '<button class="go" data-st="'+d.id+'">'+d.name+'(으)로</button>').join('')+(st.line==='loop' ? '<p class="note">다른 섬으로 가려면 도토리섬 남쪽역(남서쪽 바닷가)에서 섬 연결 열차를 타요.</p>' : ''));
  $('#pbody').querySelectorAll('[data-st]').forEach(b => b.addEventListener('click', () => { closePanel(); rideTrain(st, STATIONS.find(s => s.id===b.dataset.st)); }));
};
rideTrain = function(from, to){
  const fare = from.line === 'island' ? ECON.fare*2 : ECON.fare;
  if (G.me.acorns - fare < ECON.creditLimit){ toast('기차표 살 도토리가 없어요'); return; }
  spend(fare); stopFishing();
  const me = chars[G.slot], isl = from.line === 'island';
  let s1 = from.s, s2, dir;
  if (isl){ dir = to.s > from.s ? 1 : -1; s2 = to.s; islTrain.dir = dir; islTrain.s = s1 - dir*7; }
  else { dir = 1; s2 = from.s + (((to.s - from.s) % TR.L) + TR.L) % TR.L; train.s = s1 - 6; }
  const kini = npcs.kini && G.me.kini && G.me.kini.on && npcs.kini.g.visible ? npcs.kini : null;
  G.ride = { isl, from, to, dir, phase:'arrive', s1, s2, t:0, kini, start:[me.x, me.z] };
  me.path = []; toast(from.name+' → '+to.name+' · 기차가 들어와요!', 2000);
};
const rideCar = R => (R.isl ? islTrain : train).cars;
function seatPos(R, idx, back){
  const c = rideCar(R)[idx]; const a = c.rotation.y, off = back ? 0.25 : -0.3;
  return { x:c.position.x + Math.sin(a)*off, z:c.position.z + Math.cos(a)*off, y:0.42, a };
}
const hopArc = (a, b, t, h) => ({ x:a.x+(b.x-a.x)*t, z:a.z+(b.z-a.z)*t, y:(a.y||0)+((b.y||0)-(a.y||0))*t + Math.sin(t*Math.PI)*h });
function trainsTick(dt){
  const R = G.ride, me = chars[G.slot];
  if (!R || !R.isl){ islTrain.wait -= dt; if (islTrain.wait <= 0){ islTrain.s += islTrain.dir*3.4*dt; if (islTrain.s > ISL.L-2 || islTrain.s < 2){ islTrain.dir *= -1; islTrain.s = Math.max(2, Math.min(ISL.L-2, islTrain.s)); islTrain.wait = 3; } } }
  if (!R || R.isl) train.s += 3.2*dt;
  if (R){
    R.t += dt; const T2 = R.isl ? islTrain : train, cur = () => T2.s;
    const k = R.kini;
    if (R.phase === 'arrive'){ T2.s += R.dir*10*dt; if ((cur() - R.s1)*R.dir >= 0){ T2.s = R.s1; R.phase = 'board'; R.t = 0; R.p0 = { x:me.x, z:me.z, y:0 }; if (k) R.k0 = { x:k.x, z:k.z, y:0 }; me.override = true; if (k) k.override = true; playSfx('jump'); } }
    else if (R.phase === 'board'){
      const sp = seatPos(R, 1), t = Math.min(1, R.t/0.6), q = hopArc(R.p0, sp, t, 0.9); me.g.position.set(q.x, q.y, q.z); me.face = sp.a;
      if (k){ const kt = Math.max(0, Math.min(1, (R.t-0.25)/0.6)), ks = seatPos(R, 2), kq = hopArc(R.k0, ks, kt, 0.8); k.g.position.set(kq.x, kq.y, kq.z); k.face = ks.a; if (R.t > 0.25 && !R.kHop){ R.kHop = true; playSfx('jump'); } }
      if (R.t > (k ? 0.9 : 0.65)){ R.phase = 'go'; R.t = 0; }
    }
    else if (R.phase === 'go'){
      const remain = (R.s2 - cur())*R.dir, v = Math.min(15, 3 + remain*1.2, 4 + R.t*8); T2.s += R.dir*v*dt;
      if ((cur() - R.s2)*R.dir >= 0){ T2.s = R.s2; R.phase = 'drop'; R.t = 0; R.p0 = null; }
    }
    else if (R.phase === 'drop'){
      const [ti,tj] = T(R.to.px, R.to.pz), dest = { x:wx(ti), z:wz(tj), y:0 };
      if (!R.p0){ R.p0 = seatPos(R, 1); if (k) R.k0 = seatPos(R, 2); playSfx('jump'); }
      const t = Math.min(1, R.t/0.6), q = hopArc(R.p0, dest, t, 0.9); me.g.position.set(q.x, q.y, q.z);
      if (k){ const kd = { x:dest.x - 1, z:dest.z, y:0 }, kq = hopArc(R.k0, kd, Math.min(1, R.t/0.7), 0.8); k.g.position.set(kq.x, kq.y, kq.z); }
      if (R.t > (k ? 0.75 : 0.62)){
        charAt(me, ti, tj); me.override = false; me.path = []; G.me.i = ti; G.me.j = tj; saveMe();
        if (k){ k.override = false; const [ki,kj] = nearestFree(dest.x-1, dest.z); k.i = ki; k.j = kj; k.x = wx(ki); k.z = wz(kj); k.path = []; }
        G.ride = null; toast(R.to.name+'에 도착했어요', 1800);
      }
    }
    if (R.phase === 'go'){ const sp = seatPos(R, 1); me.g.position.set(sp.x, sp.y, sp.z); me.face = sp.a; me.g.rotation.y = sp.a; if (k){ const ks = seatPos(R, 2); k.g.position.set(ks.x, ks.y, ks.z); k.g.rotation.y = ks.a; } }
    me.x = me.g.position.x; me.z = me.g.position.z;
  }
  placeTrain(); placeIslTrain();
  if (!R) trainHitCheck();
}
function riderPose(){
  const R = G.ride; if (!R || R.phase === 'arrive') return; const me = chars[G.slot];
  const sit = (m, U) => { if (!U) return; U.legs.forEach(l => l.rotation.x = -1.45); };
  if (R.phase === 'go'){ sit(me.model, me.model.userData); me.model.position.y = 0; me.model.userData.arms[0].rotation.x = -0.4 + Math.sin(R.t*3)*0.1; me.model.userData.arms[1].rotation.x = R.t < 2 ? -2.7 + Math.sin(R.t*14)*0.3 : -0.4; if (R.kini){ const U = R.kini.model.userData; sit(R.kini.model, U); R.kini.model.position.y = 0; U.arms[1].rotation.x = -2.5 + Math.sin(R.t*12)*0.4; } }
}
const rideCamTarget = () => { const R = G.ride; if (!R) return null; const me = chars[G.slot]; return _v.set(me.g.position.x, 0, me.g.position.z); };

/* ---------- getting hit by a train: 퍽! fly, fall, get up ---------- */
function trainHitCheck(){
  const me = chars[G.slot]; if (!me || G.inside || G.down || G.boat || !me.g.visible) return;
  const hitBy = (T2, dirSign) => { for (const c of T2.cars){ const dx = me.x - c.position.x, dz = me.z - c.position.z; if (dx*dx + dz*dz < 0.55 && (me.jy||0) < 0.55) return { c, fwd:[Math.sin(c.rotation.y), Math.cos(c.rotation.y)] }; } return null; };
  const h = hitBy(train) || hitBy(islTrain);
  if (h){
    const side = [h.fwd[1], -h.fwd[0]], dx = me.x - h.c.position.x, dz = me.z - h.c.position.z, sgn = (dx*side[0] + dz*side[1]) >= 0 ? 1 : -1;
    const dir = [side[0]*sgn*0.8 + h.fwd[0]*0.6, side[1]*sgn*0.8 + h.fwd[1]*0.6], len = Math.hypot(dir[0], dir[1]);
    knockdown(me.x + dir[0]/len*3.8, me.z + dir[1]/len*3.8, '퍽!');
  }
  const k = npcs.kini; if (k && k.g.visible && !k.override && !k.down){ for (const c of train.cars.concat(islTrain.cars)){ const dx = k.x - c.position.x, dz = k.z - c.position.z; if (dx*dx+dz*dz < 0.45){ npcKnock(k, c); break; } } }
}
function popWord(x, y, z, text, cls){
  _v.set(x, y, z).project(cam); const el = document.createElement('div'); el.className = 'pow '+(cls||''); el.textContent = text;
  el.style.left = ((_v.x+1)/2*window.innerWidth)+'px'; el.style.top = ((1-_v.y)/2*window.innerHeight)+'px'; $('#labels').appendChild(el); setTimeout(() => el.remove(), 1200);
}
function knockdown(tx, tz, word){
  const me = chars[G.slot], [li,lj] = nearestFree(tx, tz);
  stopFishing(); if (dlg) endDialog(); closePanel(); me.path = [];
  G.down = { t:0, from:{ x:me.x, z:me.z }, to:{ x:wx(li), z:wz(lj) }, li, lj, spin:(Math.random()<0.5?-1:1) };
  me.override = true; playSfx('bonk'); popWord(me.x, 1.2, me.z, word || '퍽!');
  try{ navigator.vibrate && navigator.vibrate([60,40,120]); }catch(e){}
  regenStamina(); G.me.stamina = Math.max(0, G.me.stamina - 5); updateHud();
}
function downTick(dt){
  const D = G.down; if (!D) return; const me = chars[G.slot]; D.t += dt; const m = me.model;
  if (D.t < 0.85){ const t = D.t/0.85, q = hopArc(D.from, D.to, t, 2.4); me.g.position.set(q.x, q.y, q.z); m.rotation.x = D.spin * t * Math.PI * 3; m.rotation.z = t * 0.6 * D.spin; }
  else if (D.t < 2.6){ me.g.position.set(D.to.x, 0, D.to.z); m.rotation.x = -Math.PI/2; m.rotation.z = 0; m.position.y = 0.16; if (!D.landed){ D.landed = true; popWord(D.to.x, 0.6, D.to.z, '쿵', 'small'); toast('아야야… 기차는 조심해요!', 1800); } const U = m.userData; U.arms[0].rotation.x = U.arms[1].rotation.x = -Math.PI*0.9; }
  else if (D.t < 3.1){ const t = (D.t-2.6)/0.5; m.rotation.x = -Math.PI/2*(1-t); m.position.y = 0.16*(1-t); }
  else { m.rotation.set(0,0,0); m.position.y = 0; charAt(me, D.li, D.lj); me.override = false; G.me.i = D.li; G.me.j = D.lj; saveMe(); G.down = null; }
  me.x = me.g.position.x; me.z = me.g.position.z;
}
function npcKnock(np, c){
  const fx = Math.sin(c.rotation.y), fz = Math.cos(c.rotation.y), [li,lj] = nearestFree(np.x + fz*3 + fx*1.5, np.z - fx*3 + fz*1.5);
  np.down = { t:0, from:{ x:np.x, z:np.z }, to:{ x:wx(li), z:wz(lj) }, li, lj }; np.override = true; np.path = [];
  popWord(np.x, 1.0, np.z, '퍽!'); playSfx('bonk');
}
function npcDownTick(dt){
  Object.values(npcs).forEach(np => { const D = np.down; if (!D) return; D.t += dt; const m = np.model;
    if (D.t < 0.8){ const q = hopArc(D.from, D.to, D.t/0.8, 1.8); np.g.position.set(q.x, q.y, q.z); m.rotation.x = D.t/0.8*Math.PI*2; }
    else if (D.t < 2.0){ np.g.position.set(D.to.x, 0, D.to.z); m.rotation.x = -Math.PI/2; m.position.y = 0.15; }
    else { m.rotation.x = 0; np.i = D.li; np.j = D.lj; np.x = D.to.x; np.z = D.to.z; np.override = false; np.down = null; if (np.n.id === 'kini') setTimeout(() => toast('끼니: 으앙… 괜찮아, 안 아파! 헤헤', 2000), 100); }
  });
}
