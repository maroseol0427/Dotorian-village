/* ---------- the open sea: islets, reefs, harbor boats, sea fish ---------- */
const ISLETS = [
  { id:'acorn', name:'도토리 무인도', cx:-28, cz:-36, r:4.2, treasure:{ acorns:150 }, hive:false },
  { id:'pearl', name:'진주 무인도', cx:-62, cz:-14, r:3.6, treasure:{ items:{ pearl:2 } }, hive:false },
  { id:'buzz', name:'벌집 무인도', cx:34, cz:-34, r:4.2, treasure:{ acorns:80, items:{ gem:1 } }, hive:true },
  { id:'empty', name:'텅 빈 무인도', cx:-46, cz:32, r:3.4, treasure:null, hive:false },
  { id:'fossil', name:'화석 무인도', cx:46, cz:34, r:4.0, treasure:{ items:{ fossil:1 } }, hive:false },
  { id:'jewel', name:'반짝 무인도', cx:-24, cz:43, r:3.6, treasure:{ items:{ gem:2, oldcoin:1 } }, hive:true },
  { id:'gull', name:'갈매기 무인도', cx:-48, cz:-34, r:3.0, treasure:null, hive:false },
  { id:'coin', name:'동전 무인도', cx:22, cz:46, r:3.2, treasure:{ items:{ oldcoin:2 }, acorns:40 }, hive:false },
  { id:'shell', name:'조개 무인도', cx:63, cz:-12, r:3.8, treasure:{ items:{ conch:3, starfish:2 }, acorns:60 }, hive:false },
  { id:'wind', name:'바람 무인도', cx:-62, cz:46, r:3.4, treasure:null, hive:true },
];
ISLETS.forEach((I,k) => {
  const R2 = Math.ceil(I.r*1.4);
  for (let z=-R2; z<=R2; z++) for (let x=-R2; x<=R2; x++){ const [i,j] = T(I.cx+x, I.cz+z); if (!inb(i,j) || tile[idx(i,j)] !== WATER) continue; const a = Math.atan2(z,x), d = Math.hypot(x,z)/I.r + 0.06*Math.sin(a*3+k) + 0.04*Math.sin(a*5+k*2); if (d <= 0.95){ tile[idx(i,j)] = d > 0.55 ? SAND : GRASS; isle[idx(i,j)] = 10+k; } }
  const r = rng(900+k);
  const place = (kind, extra) => { for (let t=0;t<40;t++){ const x = I.cx + Math.round((r()*2-1)*(I.r-1.2)), z = I.cz + Math.round((r()*2-1)*(I.r-1.2)), [i,j] = T(x,z); if (tile[idx(i,j)] === WATER || statics.has(key(i,j)) || (x===I.cx && z===I.cz)) continue; const s = Object.assign({ kind, i, j }, extra); statics.set(key(i,j), s); return s; } return null; };
  if (I.treasure){ const [i,j] = T(I.cx, I.cz); statics.set(key(i,j), { kind:'chest', id:'chest_'+I.id, islet:I, i, j }); }
  for (let n=0;n<2;n++) place('tree', { tk:'palm', id:'t'+(tid++), fruit:'coconut' });
  if (I.hive){ const s = place('tree', { tk:'round', id:'t'+(tid++), fruit:'apple' }); if (s){ s.hive = true; HIVE_TREES.push(s); } }
});
const isletAt = (x, z) => ISLETS.find(I => Math.hypot(x-I.cx, z-I.cz) <= I.r + 1.2) || null;
// sea vs pond: flood from the map edge
const seaMask = new Uint8Array(N*N);
(function(){ const q = [0]; seaMask[0] = 1; while (q.length){ const c = q.pop(), i = c % N, j = (c/N)|0; [[1,0],[-1,0],[0,1],[0,-1]].forEach(([a,b]) => { const ni = i+a, nj = j+b; if (!inb(ni,nj)) return; const n = idx(ni,nj); if (seaMask[n]) return; const t = tile[n]; if (t !== WATER && t !== BRIDGE) return; seaMask[n] = 1; q.push(n); }); } })();
const isSea = (i,j) => inb(i,j) && !!seaMask[idx(i,j)];
const landNear = (x, z, r) => { for (let a=-r;a<=r;a++) for (let b=-r;b<=r;b++){ const t = tAt(Math.round(x)+a, Math.round(z)+b); if (t !== WATER && t !== BRIDGE) return true; } return false; };
const REEFS = [[-18,-27],[12,-29],[24,-25],[-36,-21],[42,-22],[-52,8],[52,12],[-28,31],[30,32],[16,40],[-10,50],[46,46],[-40,-44],[60,22],[-60,20],[55,-40],[-55,-48],[30,-50],[-30,-52],[66,40],[-20,62]].filter(([x,z]) => tAt(x,z) === WATER && !landNear(x,z,1)).map(([x,z]) => ({ x, z }));
// sea fish
FISH.forEach(f => { f.water = f.water || 'pond'; });
FISH.push(
  { id:'mackerel', name:'고등어', price:20, seasons:'all', when:'any', w:10, c:'#7a9ab8', water:'sea' },
  { id:'jack', name:'전갱이', price:15, seasons:'all', when:'day', w:9, c:'#b8c8d8', water:'sea' },
  { id:'seabream', name:'참돔', price:55, seasons:'spring autumn', when:'any', w:4, c:'#ff9a9a', water:'sea' },
  { id:'squid', name:'오징어', price:35, seasons:'all', when:'night', w:6, c:'#ffe6e0', water:'sea' },
  { id:'octopus', name:'문어', price:45, seasons:'all', when:'any', w:5, c:'#e88a7a', water:'sea' },
  { id:'puffer', name:'복어', price:40, seasons:'all', when:'any', w:4, c:'#e8d88a', water:'sea' },
  { id:'ray', name:'가오리', price:70, seasons:'summer autumn', when:'any', w:3, c:'#8a8aa8', water:'sea' },
  { id:'tuna', name:'참치', price:180, seasons:'all', when:'any', w:1.6, c:'#4a5a8a', water:'sea', deep:true },
  { id:'shark', name:'상어', price:300, seasons:'summer autumn', when:'any', w:0.8, c:'#7a8aa0', water:'sea', deep:true },
  { id:'dolphin', name:'돌고래', price:400, seasons:'all', when:'day', w:0.5, c:'#9ab8d8', water:'sea', deep:true, release:true },
  { id:'whale', name:'고래', price:600, seasons:'all', when:'any', w:0.3, c:'#5a6a9a', water:'sea', deep:true, release:true },
);
rollFish = function(){
  const F = G.fishing || {}, sea = isSea(F.ti, F.tj), deep = sea && !landNear(wx(F.ti||0), wz(F.tj||0), 5);
  const s = season(), h = hourNow(), night = h>=19||h<5;
  const pool = FISH.filter(f => (f.water === (sea ? 'sea' : 'pond')) && (!f.deep || deep) && (f.seasons==='all'||f.seasons.includes(s)) && (f.when==='any'||(f.when==='night')===night));
  let tot = pool.reduce((a,f)=>a+f.w*(f.deep && G.boat ? 2 : 1),0), r = Math.random()*tot;
  for (const f of pool){ r -= f.w*(f.deep && G.boat ? 2 : 1); if (r<=0) return f; } return pool[0];
};

/* boats */
function boatMesh(col){
  const g = new THREE.Group();
  M(new THREE.BoxGeometry(0.95,0.32,1.5), col || '#ffffff', 0, 0.05, -0.05, g);
  const nose = M(new THREE.CylinderGeometry(0.475,0.475,0.32,16,1,false,0,Math.PI), col || '#ffffff', 0, 0.05, 0.7, g); nose.rotation.y = -Math.PI/2; nose.scale.set(1, 1, 1);
  M(new THREE.BoxGeometry(0.85,0.06,1.4), '#f2dcc2', 0, 0.2, -0.05, g);
  M(new THREE.BoxGeometry(1.0,0.06,0.12), '#8fc8f0', 0, 0.23, -0.78, g); [-1,1].forEach(s => M(new THREE.BoxGeometry(0.06,0.08,1.5), '#8fc8f0', 0.48*s, 0.23, -0.05, g));
  M(new THREE.BoxGeometry(0.8,0.1,0.28), '#ffffff', 0, 0.32, -0.4, g); M(new THREE.BoxGeometry(0.8,0.1,0.28), '#ffffff', 0, 0.32, 0.25, g);
  M(new THREE.BoxGeometry(0.22,0.35,0.22), '#8a8aa8', 0, 0.3, -0.92, g);
  return g;
}
let parkedBoat = null;
function syncParkedBoat(){
  const B = G.me && G.me.boat; if (G.boat || !B){ if (parkedBoat){ parkedBoat.visible = !!G.boat; } }
  if (!parkedBoat){ parkedBoat = boatMesh('#fff4e8'); scene.add(parkedBoat); }
  if (G.boat){ parkedBoat.visible = true; parkedBoat.position.set(G.boat.x, -0.12 + Math.sin(performance.now()/500)*0.03, G.boat.z); parkedBoat.rotation.y = G.boat.a; parkedBoat.rotation.z = Math.sin(performance.now()/700)*0.04; }
  else if (B){ parkedBoat.visible = true; parkedBoat.position.set(B.x, -0.12 + Math.sin(performance.now()/600)*0.025, B.z); parkedBoat.rotation.y = B.a; }
  else parkedBoat.visible = false;
}
function boardBoat(fromCaptain){
  const me = chars[G.slot]; if (!G.me.boat || fromCaptain){ G.me.boat = { x:DOCK.x, z:DOCK.z, a:0, b:(G.me.boat && G.me.boat.b) || 0 }; }
  const B = G.me.boat; stopFishing(); closePanel();
  G.boat = { x:B.x, z:B.z, a:B.a, v:0, b:B.b||0, saveT:0 };
  me.override = true; me.path = []; doAnim('cheer'); playSfx('jump');
  const k = npcs.kini; if (k && G.me.kini && G.me.kini.on && k.g.visible){ k.override = true; G.boat.kini = k; }
  toast('배를 탔어요! 방향키로 움직이고, 땅을 보고 행동 버튼을 누르면 내려요. 물을 보고 누르면 낚시!', 3200);
}
function leaveBoatHere(){ if (!G.boat) return; G.me.boat = { x:G.boat.x, z:G.boat.z, a:G.boat.a, b:G.boat.b }; if (G.boat.kini) G.boat.kini.override = false; G.boat = null; chars[G.slot].override = false; saveMe(); }
function sinkBoat(){ if (G.boat && G.boat.kini){ const k = G.boat.kini; k.override = false; kiniArrive(); } G.boat = null; G.me.boat = null; chars[G.slot].override = false; saveMe(); }
const boatPass = (x, z) => { const i = Math.round(x)+C, j = Math.round(z)+C; if (!inb(i,j)) return false; const t = tile[idx(i,j)]; return t === WATER || t === BRIDGE; };
function boatControls(dt){
  const B = G.boat, me = chars[G.slot];
  let dx = ctl.pad.x, dz = ctl.pad.z; ctl.keys.forEach(k => { dx += KEYMAP[k][0]; dz += KEYMAP[k][1]; });
  const len = Math.hypot(dx, dz);
  if (len > 0.1){ dx /= len; dz /= len; if (G.yaw){ const cy = Math.cos(G.yaw), sy = Math.sin(G.yaw), rx = dx*cy + dz*sy, rz = -dx*sy + dz*cy; dx = rx; dz = rz; }
    if (G.fishing) stopFishing();
    const want = Math.atan2(dx, dz); let dr = want - B.a; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); B.a += dr*Math.min(1, dt*3.2); B.v = Math.min(5.5, B.v + dt*4.5*(Math.abs(dr) < 1.2 ? 1 : 0.3)); }
  else B.v = Math.max(0, B.v - dt*3.5);
  if (B.v < 0) B.v = Math.min(0, B.v + dt*5);
  const nx = B.x + Math.sin(B.a)*B.v*dt, nz = B.z + Math.cos(B.a)*B.v*dt;
  const fx = nx + Math.sin(B.a)*0.7, fz = nz + Math.cos(B.a)*0.7;
  const reef = REEFS.find(r => Math.hypot(fx - r.x, fz - r.z) < 0.85);
  if (reef && B.v > 0.6){ B.b++; B.v = -2.2; popWord(fx, 0.8, fz, '쿵!'); playSfx('bonk'); try{ navigator.vibrate && navigator.vibrate(80); }catch(e){}
    if (B.b >= 10){ const p = { x:B.x, z:B.z }; G.me.boat = null; const k = B.kini; if (k){ k.override = false; } G.boat = null; me.override = true; G.rescue = null; startRescue('sea'); G.rescue.p = p; G.sinking = { x:p.x, z:p.z, a:B.a, t:0 }; return; }
    toast('암초에 부딪혔어요! 배가 덜컹거려요 ('+B.b+'/10)', 1800); }
  else if (boatPass(fx, fz) && boatPass(nx, nz)){ B.x = nx; B.z = nz; }
  else { B.v = 0; }
  me.face = B.a;
  B.saveT += dt; if (B.saveT > 4){ B.saveT = 0; G.me.boat = { x:B.x, z:B.z, a:B.a, b:B.b }; saveMe(); }
}
function boatAction(){
  if (G.fishing){ fishTap(); return; }
  const B = G.boat, me = chars[G.slot];
  for (const d of [1.0, 1.5]){ const x = Math.round(B.x + Math.sin(B.a)*d), z = Math.round(B.z + Math.cos(B.a)*d), [i,j] = T(x,z);
    if (inb(i,j) && tile[idx(i,j)] !== WATER && tile[idx(i,j)] !== BRIDGE && !blocked(i,j)){
      const k = B.kini; leaveBoatHere(); charAt(me, i, j); me.face = B.a; me.jump = { t:0 }; G.me.i = i; G.me.j = j; saveMe(); playSfx('jump');
      if (k){ const [ki,kj] = nearestFree(x - Math.sin(B.a), z - Math.cos(B.a)); k.i = ki; k.j = kj; k.x = wx(ki); k.z = wz(kj); k.path = []; k.jump = { t:-0.2 }; }
      const I = isletAt(x, z); toast(I ? I.name+'에 내렸어요!' : '배에서 내렸어요. 배는 여기 묶어 둘게요', 2000); return; }
  }
  const x = Math.round(B.x + Math.sin(B.a)*1.3), z = Math.round(B.z + Math.cos(B.a)*1.3), [i,j] = T(x,z);
  if (inb(i,j) && tile[idx(i,j)] === WATER){ if (B.v > 1){ toast('배를 멈추고 낚싯대를 던져요', 1400); return; } startFishing(i, j); return; }
  toast('땅을 바라보고 누르면 내리고, 물을 보고 누르면 낚시해요', 1800);
}
function boatTick(dt, tsec){
  syncParkedBoat();
  const me = chars[G.slot];
  if (G.boat){ const B = G.boat, bob = Math.sin(tsec*2)*0.03; me.g.position.set(B.x - Math.sin(B.a)*0.15, 0.08 + bob, B.z - Math.cos(B.a)*0.15); me.g.rotation.y = B.a; me.x = B.x; me.z = B.z;
    const U = me.model.userData; U.legs.forEach(l => l.rotation.x = -1.45); me.model.position.y = 0;
    if (!G.fishing && !G.anim){ U.arms[0].rotation.x = U.arms[1].rotation.x = -1.0 + Math.sin(tsec*5)*(B.v > 0.5 ? 0.5 : 0.05); }
    if (B.kini){ const k = B.kini; k.g.position.set(B.x - Math.sin(B.a)*0.62, 0.1 + bob, B.z - Math.cos(B.a)*0.62); k.g.rotation.y = B.a; k.x = k.g.position.x; k.z = k.g.position.z; k.model.userData.legs.forEach(l => l.rotation.x = -1.4); k.model.position.y = 0; }
    dolphinTick(dt, tsec);
  }
  if (G.sinking){ const S = G.sinking; S.t += dt; if (!S.g){ S.g = boatMesh('#fff4e8'); scene.add(S.g); } S.g.position.set(S.x, -0.12 - S.t*0.25, S.z); S.g.rotation.set(Math.min(0.6, S.t*0.3), S.a, Math.min(0.5, S.t*0.2)); if (S.t > 3){ scene.remove(S.g); G.sinking = null; } }
}
let dolphin = null, dolT = 8;
function dolphinTick(dt, tsec){
  const B = G.boat; if (!B) return;
  if (dolphin){ dolphin.t += dt; const t = dolphin.t/1.5; dolphin.g.position.set(dolphin.x + dolphin.dx*t*3, -0.4 + Math.sin(t*Math.PI)*1.3, dolphin.z + dolphin.dz*t*3); dolphin.g.rotation.x = -Math.cos(t*Math.PI)*0.9; if (t >= 1){ scene.remove(dolphin.g); dolphin = null; } return; }
  dolT -= dt; if (dolT > 0 || landNear(B.x, B.z, 4)) return; dolT = 14 + Math.random()*16;
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body); M(new THREE.CapsuleGeometry(0.18, 0.7, 6, 12), '#9ab8d8', 0, 0, 0, body).rotation.x = Math.PI/2; M(new THREE.ConeGeometry(0.08, 0.22, 8), '#8aa8c8', 0, 0.2, -0.05, body); M(new THREE.ConeGeometry(0.16, 0.12, 8), '#8aa8c8', 0, 0, -0.52, body).rotation.x = Math.PI/2; M(new THREE.SphereGeometry(0.03, 6, 4), '#2a2e4a', 0.1, 0.06, 0.3, body);
  const a = B.a + (Math.random()<0.5?1:-1)*1.2, x = B.x + Math.sin(a)*3, z = B.z + Math.cos(a)*3, dx = Math.sin(B.a), dz = Math.cos(B.a);
  g.rotation.y = Math.atan2(dx, dz); scene.add(g); dolphin = { g, x, z, dx, dz, t:0 }; setTimeout(() => toast('와! 돌고래가 뛰어올랐어요', 1600), 300); playSfx('splash');
}

/* chests */
const chestOpened = s => { const d = G.me && G.me.daily; return !!(d && d.date === today() && (d.chests||[]).includes(s.id)); };
function chestMesh(open){
  const g = new THREE.Group(); M(new THREE.BoxGeometry(0.62,0.34,0.42), '#c8905a', 0, 0.17, 0, g); M(new THREE.BoxGeometry(0.66,0.05,0.46), '#ffd36a', 0, 0.06, 0, g); [-0.22,0.22].forEach(x => M(new THREE.BoxGeometry(0.06,0.36,0.44), '#ffd36a', x, 0.18, 0, g));
  const lid = new THREE.Group(); lid.position.set(0, 0.34, -0.21); g.add(lid); M(new THREE.CylinderGeometry(0.21,0.21,0.62,14,1,false,0,Math.PI), '#d8a06a', 0, 0, 0.21, lid).rotation.z = Math.PI/2; M(new THREE.BoxGeometry(0.1,0.1,0.04), '#ffd36a', 0, 0, 0.43, lid);
  lid.rotation.x = open ? -1.6 : 0; g.userData.lid = lid; return g;
}
function refreshChests(){ statics.forEach((s,k) => { if (s.kind !== 'chest') return; const g = objMeshes.get(k); if (g && g.userData.lid) g.userData.lid.rotation.x = chestOpened(s) ? -1.6 : 0; }); }
function openChest(s){
  ensureDaily(); const d = G.me.daily; d.chests = d.chests || [];
  if (chestOpened(s)){ toast('빈 상자예요. 내일 또 와 봐요', 1600); return; }
  d.chests.push(s.id); doAnim('open'); playSfx('chest'); refreshChests();
  const T2 = s.islet.treasure, parts = [];
  if (T2.acorns){ earn(T2.acorns); parts.push('도토리 '+T2.acorns+'개'); }
  Object.entries(T2.items||{}).forEach(([id,n]) => { addItem(id, n); parts.push(GATHER[id].name+' '+n+'개'); });
  saveMe(); pop('보물 상자!', s.islet.name+'의 보물<br>'+parts.join(' · ')+'<br><small>내일 또 채워져요</small>');
}

/* world dressing for the sea */
function buildWorld6(){
  statics.forEach((s,k) => { if (s.kind !== 'chest') return; const g = chestMesh(false); g.position.set(wx(s.i), 0, wz(s.j)); g.traverse(o => { o.userData.key = k; }); worldRoot.add(g); objMeshes.set(k, g); });
  REEFS.forEach((r,k) => { const g = new THREE.Group(); M(new THREE.DodecahedronGeometry(0.42, 0), '#7a7088', 0, -0.05, 0, g).scale.set(1.2, 0.6, 1); M(new THREE.DodecahedronGeometry(0.25, 0), '#8a8098', 0.35, -0.08, 0.2, g); const f = M(new THREE.TorusGeometry(0.62, 0.05, 6, 20), '#ffffff', 0, -0.17, 0, g); f.rotation.x = Math.PI/2; f.castShadow = false; g.position.set(r.x, 0, r.z); g.rotation.y = k; worldRoot.add(g); });
  // harbor dock posts and a buoy
  [[15.5,-18],[15.5,-20],[14.5,-18],[14.5,-20]].forEach(([x,z]) => M(GC('dockpost', () => new THREE.CylinderGeometry(0.06,0.07,0.6,8)), '#c8a088', x, 0.1, z, worldRoot));
  M(SPH(0.2, 12, 10), '#ff9a8a', 17, -0.1, -22, worldRoot);
  refreshChests(); refreshHives();
}
/* targets, labels, actions, dialogue for v6 */
function frontExtra(){
  const me = chars[G.slot]; if (!me) return null; const fx = me.x + Math.sin(me.face)*0.9, fz = me.z + Math.cos(me.face)*0.9;
  if (fallenHive && Math.hypot(me.x-fallenHive.x, me.z-fallenHive.z) < 1.2) return { type:'hivepick' };
  const B = G.me.boat; if (B && !G.boat && (Math.hypot(fx-B.x, fz-B.z) < 1.3 || Math.hypot(me.x-B.x, me.z-B.z) < 1.2)) return { type:'boat' };
  return null;
}
function labelExtra(t){
  if (t.type === 'chest') return chestOpened(t.s) ? '빈 상자' : '보물 열기';
  if (t.type === 'boat') return '배 타기';
  if (t.type === 'hivepick') return '벌집 줍기';
  if (t.type === 'fire' || t.type === 'hosp') return '들어가기';
  if (t.type === 'harbor') return '항구';
  return null;
}
function actExtra(t){
  if (t.type === 'chest') return openChest(t.s);
  if (t.type === 'boat') return boardBoat(false);
  if (t.type === 'hivepick') return pickFallenHive();
  if (t.type === 'fire') return enterShop('fire');
  if (t.type === 'hosp') return enterShop('hosp');
  if (t.type === 'harbor'){ const np = npcs.cap; if (np && np.g.visible){ walkTo(np.i, np.j, () => talkTo(np)); } else toast('선장님이 퇴근했어요. 아침에 다시 와요'); return; }
}
function chooseV6(o){
  if (o === 'boat'){ endDialog(); if (G.me.boat && !G.boat){ G.me.boat = { x:DOCK.x, z:DOCK.z, a:0, b:G.me.boat.b||0 }; saveMe(); } boardBoat(true); return true; }
  if (o === 'svc' && G.inside && (G.inside.shop === 'fire' || G.inside.shop === 'hosp')){
    const lines = G.inside.shop === 'fire' ? ['벌에 다섯 번 넘게 쏘이면 기절해. 그러면 우리가 업고 병원까지 달려가지! 치료비는 도토리 10개.','무인도에서 기절하면 헬리콥터가 출동해. 출동비 포함 도토리 100개야.','배가 암초에 열 번 넘게 부딪혀서 가라앉으면 구조선이 튜브를 던져 줄 거야!'] : (regenStamina(), G.me.stamina < 60 ? (G.me.stamina = Math.min(ECON.stamMax, G.me.stamina + 20), spend(10), updateHud(), ['조금 지쳐 보이네요. 비타민 주사 한 대! 체력이 20 올랐어요. 진료비는 도토리 10개예요.']) : ['아주 건강해요! 오늘도 즐겁게 놀아요.']);
    sayMore(lines); return true; }
  return false;
}
GUIDE.push(
  { id:'boat', t:'항구·배', at:[14,-14], lines:['여기는 항구야! 선장 해구에게 말을 걸면 배를 탈 수 있어.','배에선 방향키로 움직이고, 땅을 보고 행동 버튼을 누르면 내려. 물을 보고 누르면 바다 낚시! 먼바다에선 상어나 고래도 낚여.','바다 곳곳에 무인도가 있고, 섬마다 보물 상자가 달라. 아무것도 없는 섬도 있어. 암초에 열 번 넘게 부딪히면 배가 가라앉으니 조심!'] },
  { id:'hosp', t:'병원·구급대', at:[38,14], lines:['농장섬에는 소방서랑 병원이 있어. 소방서엔 곰돌이 구조대 듬직이랑 뭉치가 살아.','나무에 벌집이 달린 걸 흔들면 벌들이 쫓아와! 다섯 번 쏘이면 기절하고, 구조대가 병원으로 데려가. 치료비는 도토리 10개.','무인도에서 기절하면 헬리콥터가 와. 그땐 도토리 100개! 벌이 쫓아오면 건물이나 배로 피하면 돼.'] },
  { id:'fun', t:'점프·사진', at:null, lines:['점프 버튼을 누르면 폴짝 뛰어! 키보드에선 J나 Shift야. 끼니가 따라오면 같이 뛰어.','왼쪽 카메라 버튼을 누르면 사진이 찍혀. "사진 저장"을 누르면 기기에 저장돼! 키보드에선 P.','기차 선로는 조심해! 기차에 치이면 퍽 하고 날아가서 넘어져.'] },
);
const _drawMap5 = drawMap;
drawMap = function(){ _drawMap5(); const cv = $('#mapCv'); if (!cv) return; const g = cv.getContext('2d'), s = cv.width / N;
  g.fillStyle = '#7a7088'; REEFS.forEach(r => { g.beginPath(); g.arc((r.x+C+0.5)*s, (r.z+C+0.5)*s, s*0.7, 0, 7); g.fill(); });
  g.font = (s*1.9)+'px Jua, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#5b4b78'; g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = s*0.6;
  ISLETS.forEach(I => { const x = (I.cx+C+0.5)*s, y = (I.cz+C - I.r - 1.6)*s; g.strokeText(I.name, x, y); g.fillText(I.name, x, y); });
  if (G.boat){ g.fillStyle = '#5fb894'; g.beginPath(); g.arc((G.boat.x+C+0.5)*s, (G.boat.z+C+0.5)*s, s*1.1, 0, 7); g.fill(); }
  else if (G.me.boat){ g.fillStyle = '#ffffff'; g.fillRect((G.me.boat.x+C)*s, (G.me.boat.z+C)*s, s, s); }
};

/* per-frame glue for v6 */
const _featTick5 = featTick;
featTick = function(dt, tsec){
  _featTick5(dt, tsec);
  npcJumpTick(dt); downTick(dt); npcDownTick(dt); riderPose(); swarmTick(dt, tsec); rescueTick(dt, tsec); boatTick(dt, tsec);
  if (G.inside && G.inside.extraLbl) G.inside.extraLbl.forEach(e => { if (G.focus){ e.lbl.hidden = true; return; } _v.set(e.x, 1.75, e.z).project(cam); e.lbl.hidden = false; e.lbl.style.left = ((_v.x+1)/2*window.innerWidth)+'px'; e.lbl.style.top = ((1-_v.y)/2*window.innerHeight)+'px'; });
};
const _featSlow6 = featSlow;
featSlow = function(){ _featSlow6(); if (G.slowN % 5 === 0){ refreshChests(); refreshHives(); } };
