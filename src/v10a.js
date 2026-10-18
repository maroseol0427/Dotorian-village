/* ================= v10: furniture fixes & moving, room camera, house extensions (2~4 floors), stairs, elevator, rooftop ================= */

/* ---------- never get stuck inside furniture ---------- */
function inCornersBlocked(wxp, wzp){
  const rr = 0.24, dc = doorCols(); let n = 0;
  for (const [ox,oz] of [[-rr,-rr],[rr,-rr],[-rr,rr],[rr,rr]]){
    const x = Math.round(wxp + ox - IX + (IW-1)/2), z = Math.round(wzp + oz - IZ + (ID-1)/2);
    if (z >= ID && (x === dc[0] || x === dc[1])) continue; if (inBlocked(x, z)) n++;
  }
  return n;
}
const _canStandIn10 = canStandIn;
canStandIn = function(x, z){
  if (_canStandIn10(x, z)) return true;
  const me = chars[G.slot]; if (!me) return false;
  const now = inCornersBlocked(me.x, me.z); if (!now) return false; // normal wall/furniture collision
  return inCornersBlocked(x, z) <= now && (x !== me.x || z !== me.z); // overlapping furniture: let the player walk out
};
const playerCells = () => { const me = chars[G.slot], rr = 0.24, out = []; [[-rr,-rr],[rr,-rr],[-rr,rr],[rr,rr]].forEach(([ox,oz]) => out.push([Math.round(me.x + ox - IX + (IW-1)/2), Math.round(me.z + oz - IZ + (ID-1)/2)])); return out; };
const overlapsPlayer = it => { if (FURN[it.id].wall || FURN[it.id].rug) return false; const pc = playerCells(); return cellsOf(it).some(([a,b]) => pc.some(([x,z]) => x === a && z === b)); };

/* ---------- moving furniture that is already placed ---------- */
const _openDecorate10 = openDecorate;
openDecorate = function(tab){
  _openDecorate10(tab);
  const D = G.decorate, H = G.inside && G.inside.home; if (!D || !H) return;
  const bar = $('#pbody .buybar');
  if (D.move !== undefined && H.items[D.move]){
    const it = H.items[D.move];
    const html = '<div class="buybar"><span>'+esc(FURN[it.id].name)+' 옮기는 중 · 바닥을 탭해요</span><span style="display:flex;gap:6px"><button id="mvCancel">취소</button></span></div>';
    if (bar) bar.outerHTML = html; else $('#pbody').insertAdjacentHTML('afterbegin', html);
    $('#mvCancel').addEventListener('click', () => { D.move = undefined; openDecorate(); });
    return;
  }
  if (D.edit !== undefined && H.items[D.edit] && bar){
    const span = bar.querySelector('span:last-child');
    if (span){ const b = document.createElement('button'); b.id = 'mvB'; b.textContent = '옮기기'; span.prepend(b);
      b.addEventListener('click', () => { D.move = D.edit; D.edit = undefined; D.sel = null; openDecorate(); toast('옮길 자리를 탭해요', 1400); }); }
  }
};
const _decorTap10 = decorTap;
decorTap = function(x, z, furnIdx){
  const D = G.decorate, H = G.inside.home;
  if (furnIdx !== undefined && furnIdx !== null && H.items[furnIdx] && FURN[H.items[furnIdx].id] && FURN[H.items[furnIdx].id].fixture && D.move === undefined && !D.sel){ toast(FURN[H.items[furnIdx].id].name+'은(는) 옮길 수 없어요'); return; }
  if (D.move !== undefined && H.items[D.move]){
    const it = H.items[D.move], F = FURN[it.id], nx = Object.assign({}, it, { x, z: F.wall ? 0 : z });
    if (!fits(nx, D.move)){ toast(F.wall ? '벽 장식은 뒷벽에만 걸 수 있어요' : '여기엔 놓을 수 없어요'); return; }
    if (overlapsPlayer(nx)){ toast('내가 서 있는 자리예요. 조금 비켜서 놓아요'); return; }
    it.x = nx.x; it.z = nx.z; D.move = undefined; buildRoom(H); saveRoom(); openDecorate(); toast(F.name+'을(를) 옮겼어요', 1200); return;
  }
  if (D.sel && FURN[D.sel] && !FURN[D.sel].wall){ const it = { id:D.sel, x, z, r:0 }; if (overlapsPlayer(it)){ toast('내가 서 있는 자리예요. 조금 비켜서 놓아요'); return; } }
  return _decorTap10(x, z, furnIdx);
};

/* ---------- room camera: hide the side wall that faces the camera ---------- */
function roomWallTick(){
  if (!G.inside || !room) return; const y = G.inYaw || 0;
  room.children.forEach(o => { if (o.userData.wallSide) o.visible = o.userData.wallSide > 0 ? y < 0.3 : y > -0.3; });
}

/* ---------- house extensions ---------- */
const FLOOR_H = 1.45, EXT_PRICE = { 2:1000, 3:2000, 4:3000 }, ELEV_PRICE = 1000;
Object.assign(FURN, { stairs:{ name:'계단', w:1, d:2, fixture:true }, elevator:{ name:'엘리베이터', w:1, d:1, fixture:true } });
function ownerOf(slot){ return slot === G.slot && G.me ? G.me : Store.data.players[pid(slot)]; }
function floorsOf(slot){ const p = ownerOf(slot); return Math.max(1, Math.min(4, (p && p.house && p.house.floors) || 1)); }
function roofTopY(slot){ return 0.16 + floorsOf(slot)*FLOOR_H + 0.14; }
function floorHome(owner, f){ if (f <= 1) return homeOf(owner); owner.homes = owner.homes || []; while (owner.homes.length < f-1) owner.homes.push({ wall:'wall_cream', floor:'floor_wood', items:[] }); return owner.homes[f-2]; }
function ensureFixtures(owner){
  const h = owner.house || {}, f = h.floors || 1; if (f < 2) return;
  if (!h.shifted){ homeOf(owner).items.forEach(it => { it.x += 1; }); h.shifted = true; owner.house = h; }
  for (let k=1;k<=f;k++){ const H = floorHome(owner, k); H.items = H.items.filter(it => it.id !== 'stairs' && it.id !== 'elevator'); H.items.push({ id:'stairs', x:9, z:0, r:0 }); if (h.elev) H.items.push({ id:'elevator', x:0, z:0, r:0 }); }
}
window.otherFloorsCount = id => { if (!G.inside || G.inside.kind !== 'home' || !G.inside.own) return 0; const f = floorsOf(G.slot); let n = 0; for (let k=1;k<=f;k++){ if (k === (G.inside.floor||1)) continue; n += floorHome(G.me, k).items.filter(it => it.id === id).length; } return n; };
var otherFloorsCount = window.otherFloorsCount;

// outside: taller houses, a flat rooftop with a helipad from 3 floors
const _buildHouse10 = buildHouse;
buildHouse = function(slot, fArg){
  const f = fArg || floorsOf(slot); if (f <= 1){ const g1 = _buildHouse10(slot); g1.userData.floors = 1; return g1; }
  const g = new THREE.Group(), roof = ROOFS[slot];
  M(new THREE.BoxGeometry(2.7,0.16,2.7), '#efe4d6', 0, 0.08, 0, g);
  for (let k=0;k<f;k++){
    const y0 = 0.16 + k*FLOOR_H;
    M(new THREE.BoxGeometry(2.4,FLOOR_H,2.4), k % 2 ? '#fffaf2' : '#fff4e8', 0, y0 + FLOOR_H/2, 0, g);
    const wy = y0 + 0.84; const wx2 = k ? [-0.65, 0.65] : [-0.8, 0.8];
    wx2.forEach(x => { M(new THREE.BoxGeometry(0.5,0.5,0.06), matWin, x, wy, 1.21, g); M(new THREE.BoxGeometry(0.6,0.07,0.12), '#ffffff', x, wy - 0.28, 1.24, g); });
    [-1, 1].forEach(s => M(new THREE.BoxGeometry(0.06,0.5,0.5), matWin, 1.21*s, wy, 0, g));
    if (k > 0) M(new THREE.BoxGeometry(2.5,0.07,2.5), roof, 0, y0, 0, g);
  }
  M(new THREE.BoxGeometry(0.62,0.95,0.08), '#e0aa88', 0, 0.62, 1.22, g);
  M(new THREE.CylinderGeometry(0.31,0.31,0.08,16,1,false,0,Math.PI), '#e0aa88', 0, 1.1, 1.22, g).rotation.set(Math.PI/2, 0, -Math.PI/2);
  M(new THREE.SphereGeometry(0.04,8,6), '#ffe08a', 0.2, 0.62, 1.28, g);
  M(new THREE.SphereGeometry(0.22,12,10), '#b8e6a0', -0.95, 0.2, 1.4, g); M(new THREE.SphereGeometry(0.18,12,10), '#c8eeb0', 0.95, 0.18, 1.45, g);
  const top = 0.16 + f*FLOOR_H;
  if (f < 3){ const rf = M(new THREE.ConeGeometry(2.15, 1.3, 4), roof, 0, top + 0.6, 0, g); rf.rotation.y = Math.PI/4; M(new THREE.CylinderGeometry(0.14,0.16,0.6,12), '#e8c8b8', 0.65, top + 0.7, -0.45, g); }
  else {
    M(new THREE.BoxGeometry(2.95,0.14,2.95), '#ece6f4', 0, top + 0.07, 0, g);
    M(new THREE.CylinderGeometry(0.95,0.95,0.02,32), '#ffd98a', 0, top + 0.15, 0.15, g);
    M(new THREE.TorusGeometry(0.82,0.035,6,32), '#ffffff', 0, top + 0.165, 0.15, g).rotation.x = Math.PI/2;
    [-0.24, 0.24].forEach(x => M(new THREE.BoxGeometry(0.1,0.02,0.62), '#ffffff', x, top + 0.17, 0.15, g)); M(new THREE.BoxGeometry(0.44,0.02,0.1), '#ffffff', 0, top + 0.17, 0.15, g);
    const ry = top + 0.14, rc = roof;
    [[0,-1.42,2.95,0.06],[0,1.42,2.95,0.06],[-1.42,0,0.06,2.95],[1.42,0,0.06,2.95]].forEach(([x,z,w,d]) => { M(new THREE.BoxGeometry(w,0.06,d), rc, x, ry + 0.36, z, g); M(new THREE.BoxGeometry(w,0.04,d), '#ffffff', x, ry + 0.18, z, g); });
    for (let a=-1.4;a<=1.41;a+=0.7){ [[a,-1.42],[a,1.42],[-1.42,a],[1.42,a]].forEach(([x,z]) => M(GC('rpost', () => new THREE.CylinderGeometry(0.035,0.035,0.38,6)), '#ffffff', x, ry + 0.19, z, g)); }
    M(new THREE.BoxGeometry(0.62,0.48,0.62), '#cdbcf2', -0.9, ry + 0.24, -0.9, g); M(new THREE.BoxGeometry(0.34,0.36,0.04), '#a890e0', -0.9, ry + 0.2, -0.58, g);
  }
  g.userData.floors = f; return g;
};
function refreshHouses(){
  let changed = false;
  BUILD.forEach(b => {
    if (b.kind !== 'house') return; const old = objMeshes.get(b.id); if (!old || !old.parent) return; const f = floorsOf(b.slot);
    if ((old.userData.floors || 1) === f) return;
    const g = buildHouse(b.slot, f); g.position.copy(old.position); g.traverse(o => { o.userData.key = b.id; });
    old.parent.add(g); old.parent.remove(old); objMeshes.forEach((v,k) => { if (v === old) objMeshes.set(k, g); }); changed = true;
  });
  if (changed){ rebuildPickables(); refreshHouseSigns(true); }
}
Store.on('players', () => refreshHouses());
Store.on('loaded', () => setTimeout(refreshHouses, 400));

// inside: wider rooms with stairs (and an elevator) once the house has more than one floor
const _enterRoom10 = enterRoom;
enterRoom = function(o){
  if (o && o.kind === 'home'){
    const f = floorsOf(o.slot); o.floor = o.floor || 1;
    if (f > 1){ const owner = o.own ? G.me : null; if (owner){ ensureFixtures(owner); o.home = floorHome(owner, o.floor); } o.w = 10; }
  }
  return _enterRoom10(o);
};
const _enterHouse10 = enterHouse;
enterHouse = function(slot){
  if (slot !== G.slot && floorsOf(slot) > 1){
    const owner = Store.data.players[pid(slot)]; if (!owner){ toast('아직 아무도 살지 않는 집이에요'); return; }
    const copy = JSON.parse(JSON.stringify(owner)); ensureFixtures(copy); G.visitCopy = copy;
    enterRoom({ kind:'home', slot, own:false, canEdit:false, home:floorHome(copy, 1), b:BUILD.find(x => x.kind==='house' && x.slot===slot), w:10, d:6, floor:1 });
    toast(playerName(slot)+'네 집에 놀러 왔어요 · '+floorsOf(slot)+'층짜리 집이에요', 2600); return;
  }
  return _enterHouse10(slot);
};
function placeNearStairs(){
  const me = chars[G.slot]; const tryCells = [[8,1],[8,0],[9,2],[8,2],[7,1],[9,3],[7,0],[8,3],[1,1],[0,1]];
  for (const [x,z] of tryCells){ if (!inBlocked(x, z)){ me.x = iwx(x); me.z = iwz(z); me.g.position.set(me.x, 0, me.z); me.face = Math.PI; return; } }
}
function gotoFloor(fl){
  const I = G.inside; if (!I || I.kind !== 'home') return;
  const own = I.own, slot = I.slot, owner = own ? G.me : (G.visitCopy || JSON.parse(JSON.stringify(Store.data.players[pid(slot)])));
  ensureFixtures(owner); closePanel();
  fade(true); setTimeout(() => {
    enterRoom({ kind:'home', slot, own, canEdit:own, home:floorHome(owner, fl), b:I.b, w:10, d:6, floor:fl, back:I.back, keepYaw:true });
    placeNearStairs(); fade(false); toast(fl+'층', 1200);
  }, 260);
}
function floorButtons(I, viaElev){
  const f = floorsOf(I.slot), cur = I.floor || 1, out = [];
  if (viaElev){ for (let k=1;k<=f;k++) out.push('<button class="go" data-fl="'+k+'"'+(k===cur?' disabled':'')+'>'+k+'층'+(k===cur?' (지금)':'')+'</button>'); if (f >= 3) out.push('<button class="go" data-fl="roof">옥상</button>'); }
  else { if (cur < f) out.push('<button class="go" data-fl="'+(cur+1)+'">'+(cur+1)+'층으로 올라가기</button>'); if (cur === f && f >= 3) out.push('<button class="go" data-fl="roof">옥상으로 올라가기</button>'); if (cur > 1) out.push('<button data-fl="'+(cur-1)+'">'+(cur-1)+'층으로 내려가기</button>'); }
  return out.join('');
}
function openFloorPanel(viaElev){
  const I = G.inside; G.panel = 'floors';
  openPanel(viaElev ? '엘리베이터' : '계단', '<p class="note">지금 '+(I.floor||1)+'층이에요.</p>'+floorButtons(I, viaElev), { half:true });
  $('#pbody').querySelectorAll('[data-fl]').forEach(b => b.addEventListener('click', () => { const v = b.dataset.fl; if (v === 'roof') goRoof(); else gotoFloor(Number(v)); }));
}
const _useFurniture10 = useFurniture;
useFurniture = function(n){
  const it = G.inside && G.inside.home.items[n];
  if (it && it.id === 'stairs') return openFloorPanel(false);
  if (it && it.id === 'elevator') return openFloorPanel(true);
  return _useFurniture10(n);
};
const _exitHouse10 = exitHouse;
exitHouse = function(){
  if (G.inside && G.inside.kind === 'home' && (G.inside.floor || 1) > 1){ const me = chars[G.slot]; me.z = IZ + ID/2 - 0.75; me.g.position.z = me.z; toast('현관은 1층에 있어요. 계단으로 내려가요', 1600); return; }
  G.visitCopy = null; return _exitHouse10();
};
// stairs & elevator models
const _fixMesh10 = fixMesh;
fixMesh = function(it){
  if (it.id === 'stairs'){ const g = new THREE.Group();
    for (let k=0;k<6;k++) M(new THREE.BoxGeometry(0.86, 0.24*(k+1), 0.3), k % 2 ? '#e8cfb2' : '#f2dcc2', 0, 0.12*(k+1), 1.3 - k*0.3, g);
    M(new THREE.BoxGeometry(0.05,1.4,1.9), '#d8bca0', -0.45, 0.95, 0.5, g).rotation.x = -0.6;
    const s = signMesh('계단', 0.6, 0.18, '#ffffff', '#7a6aa0'); s.position.set(0, 1.75, -0.38); g.add(s); return g; }
  if (it.id === 'elevator'){ const g = new THREE.Group();
    M(new THREE.BoxGeometry(0.92,2.1,0.6), '#dfe6f0', 0, 1.05, -0.12, g);
    [-0.2,0.2].forEach(x => M(new THREE.BoxGeometry(0.38,1.7,0.04), '#c4cede', x, 0.88, 0.2, g));
    M(new THREE.BoxGeometry(0.02,1.7,0.05), '#8a96aa', 0, 0.88, 0.22, g);
    M(new THREE.CylinderGeometry(0.05,0.05,0.03,12), '#ffd36a', 0.42, 1.0, 0.2, g).rotation.x = Math.PI/2;
    const s = signMesh('EV', 0.4, 0.14, '#5b4b78', '#ffffff'); s.position.set(0, 1.9, 0.19); g.add(s); return g; }
  return _fixMesh10(it);
};

/* ---------- rooftop ---------- */
function goRoof(){
  const I = G.inside; if (!I) return; const b = I.b, slot = I.slot; closePanel();
  fade(true);
  setTimeout(() => {
    G.inside = null; G.decorate = null; G.visitCopy = null; if (room){ scene.remove(room); room = null; }
    const me = chars[G.slot]; G.roof = { slot, b, y:roofTopY(slot), rail:false };
    me.x = b.cx + 0.4; me.z = b.cz + 0.5; me.face = 0; me.path = []; me.elev = G.roof.y; me.g.position.set(me.x, me.elev, me.z);
    applyTime(true); updateHud(); resize(); camTarget.set(me.x, me.elev, me.z); fade(false);
    toast('옥상이에요! 점프하면 난간에 올라갈 수 있어요. 떨어지면 다쳐요', 2600);
  }, 260);
}
function leaveRoof(){
  const R = G.roof; if (!R) return; G.roof = null; const me = chars[G.slot]; me.elev = 0;
  const top = floorsOf(R.slot);
  if (R.slot === G.slot) enterHouse(R.slot); else enterHouse(R.slot);
  if (G.inside && top > 1) setTimeout(() => gotoFloor(top), 30);
}
const _elevTick10 = elevTick;
elevTick = function(c){
  if (G.roof && c === chars[G.slot] && !G.fall){ c.elev = G.roof.y + (G.roof.rail ? 0.36 : 0); return; }
  if (G.fall && c === chars[G.slot]) return;
  return _elevTick10(c);
};
const _canStand10 = canStand;
canStand = function(x, z){
  const R = G.roof; if (!R) return _canStand10(x, z);
  const dx = x - R.b.cx, dz = z - R.b.cz, m = Math.max(Math.abs(dx), Math.abs(dz));
  if (Math.hypot(dx + 0.9, dz + 0.9) < 0.48) return false; // the hatch
  if (!R.rail) return m <= 1.12;
  if (m <= 1.48) return true;
  roofFall(x, z); return false;
};
function roofTick(dt){
  const R = G.roof, me = chars[G.slot]; if (!R || !me) return;
  const dx = me.x - R.b.cx, dz = me.z - R.b.cz, m = Math.max(Math.abs(dx), Math.abs(dz));
  if (!R.rail && me.jump && (me.jy || 0) > 0.25 && m > 0.95){ R.rail = true; toast('난간 위예요! 조심…', 1200); }
  if (R.rail && m < 1.05 && !me.jump){ R.rail = false; }
}
function roofFall(x, z){
  const R = G.roof, me = chars[G.slot]; if (!R || G.fall) return;
  const dx = x - R.b.cx, dz = z - R.b.cz, l = Math.hypot(dx, dz) || 1;
  const [i, j] = nearestFree(R.b.cx + dx/l*2.7, R.b.cz + dz/l*2.7);
  G.fall = { t:0, from:{ x:me.x, y:R.y + 0.36, z:me.z }, to:{ x:wx(i), z:wz(j) }, i, j };
  G.roof = null; me.override = true; me.path = []; ctl.wasMoving = false;
  setCharFace(me, 'ouch'); playSfx('bonk');
}
function fallTick(dt){
  const F = G.fall; if (!F) return; const me = chars[G.slot]; F.t += dt; const k = Math.min(1, F.t/0.75);
  const x = F.from.x + (F.to.x - F.from.x)*k, z = F.from.z + (F.to.z - F.from.z)*k, y = F.from.y*(1 - k*k) + Math.sin(k*Math.PI)*0.5;
  me.x = x; me.z = z; me.elev = Math.max(0, y); me.g.position.set(x, me.elev, z); me.model.rotation.x = k*1.4;
  if (k >= 1){
    G.fall = null; me.model.rotation.x = 0; me.elev = 0; me.override = false; charAt(me, F.i, F.j); G.me.i = F.i; G.me.j = F.j;
    popWord(me.x, 1.2, me.z, '쿵!', 'big'); saveMe(true);
    setTimeout(() => { startRescue('amb'); setTimeout(() => setCharFace(chars[G.slot], null), 9000); }, 500);
  }
}
const _frontTarget10 = frontTarget;
frontTarget = function(){
  const R = G.roof; if (R){ const me = chars[G.slot]; if (Math.hypot(me.x - (R.b.cx - 0.9), me.z - (R.b.cz - 0.9)) < 1.05) return { type:'roofdoor' }; return null; }
  if (!G.inside && archSpot){ const me = chars[G.slot], fx = me.x + Math.sin(me.face)*0.9, fz = me.z + Math.cos(me.face)*0.9; if (Math.hypot(fx - archSpot.x, fz - archSpot.z) < 0.75) return { type:'architect' }; }
  return _frontTarget10();
};

/* ---------- the architect (건축가 뚝딱) ---------- */
let archSpot = null, archG = null, archLbl = null;
function placeArchitect(){
  if (!worldRoot) return;
  if (!archSpot){ const [i,j] = nearestFree(3, -5); archSpot = { i, j, x:wx(i), z:wz(j) }; statics.set(key(i,j), { kind:'architect', id:'arch', i, j }); }
  const L = Object.assign(lookOf({ look:{ skin:'#f7cfa8', hair:'short', hairColor:'#8a5a34', eyes:'smile', mouth:'smile', beard:true }, wear:{ set:'overalls' } }), { hat:{ style:'cap', c:'#ffcf3a' } });
  archG = new THREE.Group(); const m = Char3D.build(THREE, L); archG.add(m); archG.userData.model = m;
  const post = new THREE.Group(); M(new THREE.CylinderGeometry(0.04,0.05,1.0,8), '#b9875c', 0, 0.5, 0, post); M(new THREE.BoxGeometry(1.0,0.36,0.06), '#fff6e8', 0, 1.05, 0, post);
  const s = signMesh('건축사무소', 0.92, 0.28, '#fff6e8', '#5b4b78'); s.position.set(0, 1.05, 0.04); post.add(s); post.position.set(0.75, 0, -0.1); archG.add(post);
  archG.position.set(archSpot.x, 0, archSpot.z); archG.traverse(o => { o.userData.key = key(archSpot.i, archSpot.j); });
  worldRoot.add(archG); objMeshes.set(key(archSpot.i, archSpot.j), archG); rebuildPickables();
  if (!archLbl) archLbl = makeLabel('뚝딱 · 건축가');
}
const _buildWorld10 = buildWorld;
buildWorld = function(){ _buildWorld10.apply(this, arguments); placeArchitect(); };
function archTick(tsec){
  if (!archG || !archLbl) return;
  const show = G.started && !G.inside && !G.focus; archG.visible = !G.inside; archLbl.hidden = !show;
  if (show){ _v.set(archSpot.x, 1.75, archSpot.z).project(cam); archLbl.style.left = ((_v.x+1)/2*window.innerWidth)+'px'; archLbl.style.top = ((1-_v.y)/2*window.innerHeight)+'px'; }
  const me = chars[G.slot], m = archG.userData.model; if (me && m){ const want = Math.atan2(me.x - archSpot.x, me.z - archSpot.z); if (Math.hypot(me.x - archSpot.x, me.z - archSpot.z) < 5) m.rotation.y += (want - m.rotation.y)*0.1; m.position.y = Math.sin(tsec*2)*0.01; }
}
function openArchitect(){
  const me = G.me, h = me.house || { floors:1 }, f = h.floors || 1; G.panel = 'arch';
  const next = f + 1, price = EXT_PRICE[next];
  let body = '<p class="note" style="font-size:15px">안녕하세요, 건축가 뚝딱이에요! 우리 집을 더 크고 높게 지어 드릴게요.</p>'+
    '<div class="card"><div class="k"><span>지금 우리 집</span><b>'+f+'층'+(f >= 3 ? ' · 옥상 있음' : '')+(h.elev ? ' · 엘리베이터' : '')+'</b></div></div>';
  if (price) body += '<button class="go" id="extB">'+next+'층으로 증축 · 도토리 '+price+'개</button><p class="note">'+(next === 3 ? '3층이 되면 지붕 대신 헬기장 같은 넓은 옥상이 생겨요! ' : '')+'층마다 방이 생기고 계단으로 오르내려요.</p>';
  else body += '<p class="note">우리 집은 이미 최고층(4층)이에요!</p>';
  if (f >= 2 && !h.elev) body += '<button class="go" id="elevB">엘리베이터 설치 · 도토리 '+ELEV_PRICE+'개</button><p class="note">모든 층과 옥상으로 바로 이동해요.</p>';
  openPanel('건축사무소', body, { half:true });
  const buy = (cost, fn) => { if (G.me.acorns < cost){ toast('도토리가 모자라요'); return; } G.me.acorns -= cost; fn(); ensureFixtures(G.me); saveMe(true); updateHud(); refreshHouses(); closePanel(); doAnim('cheer'); };
  const eb = $('#extB'); if (eb) eb.addEventListener('click', () => buy(price, () => { G.me.house = Object.assign({ floors:1 }, G.me.house, { floors:next }); pop('증축 완료!', '우리 집이 '+next+'층이 됐어요!'+(next === 3 ? ' 옥상에도 올라가 봐요.' : '')); }));
  const vb = $('#elevB'); if (vb) vb.addEventListener('click', () => buy(ELEV_PRICE, () => { G.me.house = Object.assign({ floors:f }, G.me.house, { elev:true }); pop('엘리베이터 설치!', '집 안 왼쪽 안쪽에 엘리베이터가 생겼어요'); }));
}
const _labelExtra10 = labelExtra;
labelExtra = function(t){ if (t.type === 'roofdoor') return '내려가기'; if (t.type === 'architect') return '집 증축'; return _labelExtra10(t); };
const _actExtra10 = actExtra;
actExtra = function(t){ if (t.type === 'roofdoor') return leaveRoof(); if (t.type === 'architect') return openArchitect(); return _actExtra10(t); };

/* ---------- glue ---------- */
const _featTick10 = featTick;
featTick = function(dt, tsec){ _featTick10(dt, tsec); roomWallTick(); roofTick(dt); fallTick(dt); archTick(tsec); };
placeArchitect();
