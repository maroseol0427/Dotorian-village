/* ================= v8b: instruments posed properly, close zoom, zoomable map, roomier hospital beds ================= */

/* ---------- instruments: carried at the side, played with real motions ---------- */
const _q8 = new THREE.Quaternion(), _m8 = new THREE.Matrix4(), _down8 = new THREE.Vector3(0,-1,0), _up8 = new THREE.Vector3(0,1,0);
const _a8 = new THREE.Vector3(), _b8 = new THREE.Vector3(), _c8 = new THREE.Vector3();
function aimArm(arm, tx, ty, tz){ _a8.set(tx - arm.position.x, ty - arm.position.y, tz - arm.position.z).normalize(); arm.quaternion.setFromUnitVectors(_down8, _a8); return _a8; }
function handAt(arm, len){ return _c8.copy(_a8).multiplyScalar(len || 0.25).add(arm.position); }
function orient(obj, dir, upHint){ const y = _a8.copy(dir).normalize(), z = _b8.copy(upHint).normalize(); const x = new THREE.Vector3().crossVectors(y, z).normalize(); z.crossVectors(x, y).normalize(); _m8.makeBasis(x, y, z); obj.quaternion.setFromRotationMatrix(_m8); }
function instPlayPose(c, I, t){
  const U = c.model.userData, root = c.model, A = U.arms, g = I.g;
  if (g.parent !== root){ root.add(g); g.scale.setScalar(I.style === 'violin' ? 1.2 : 1); if (I.bow){ root.add(I.bow); I.bow.visible = true; } }
  const st = I.style;
  if (st === 'violin'){
    const P = new THREE.Vector3(0.16, 0.78, 0.12), d = new THREE.Vector3(0.8, 0.02, 0.6).normalize();
    g.position.copy(P); orient(g, d, new THREE.Vector3(-0.5, 0.86, 0.05));
    const neck = P.clone().addScaledVector(d, 0.3); aimArm(A[1], neck.x, neck.y - 0.02, neck.z);
    const sw = Math.sin(t*4.2); aimArm(A[0], -0.06 + sw*0.12, 0.74 + sw*0.03, 0.34); const h = handAt(A[0], 0.25).clone();
    I.bow.position.copy(h); const S = P.clone().addScaledVector(d, 0.04); S.y += 0.05; orient(I.bow, S.sub(h), new THREE.Vector3(0,0,1));
    U.head.rotation.z = -0.22; U.head.rotation.x = 0.12;
  } else if (st === 'ukulele'){
    const P = new THREE.Vector3(0.0, 0.5, 0.22), d = new THREE.Vector3(1, 0.5, 0.18).normalize();
    g.position.copy(P); orient(g, d, new THREE.Vector3(-0.05, 0, 1));
    const neck = P.clone().addScaledVector(d, 0.3); aimArm(A[1], neck.x, neck.y, neck.z + 0.02);
    aimArm(A[0], -0.02, 0.52 + Math.sin(t*16)*0.05, 0.32); U.head.rotation.x = 0.18; U.head.rotation.z = Math.sin(t*3)*0.06;
  } else if (st === 'flute'){
    const P = new THREE.Vector3(-0.16, 0.86, 0.34), d = new THREE.Vector3(-1, -0.04, 0.15).normalize();
    g.position.copy(P); orient(g, d, new THREE.Vector3(0, 1, 0));
    const w = Math.sin(t*9)*0.012; aimArm(A[1], -0.02 + w, 0.84, 0.36); aimArm(A[0], -0.28 - w, 0.83, 0.38);
    U.head.rotation.z = 0.12; U.head.rotation.x = Math.sin(t*2)*0.04;
  } else if (st === 'trumpet'){
    const bob = Math.sin(t*3)*0.12, P = new THREE.Vector3(0, 0.84, 0.36), d = new THREE.Vector3(0, 0.08 + bob, 1).normalize();
    g.position.copy(P); orient(g, d, new THREE.Vector3(0, 1, 0));
    aimArm(A[0], -0.04, 0.8 + bob*0.12, 0.5); aimArm(A[1], 0.04, 0.8 + bob*0.12, 0.48); U.head.rotation.x = -bob*0.5;
  } else if (st === 'tambourine'){
    if (g.parent !== I.handL){ I.handL.add(g); g.position.set(0, -0.11, 0.03); g.rotation.set(0, Math.PI/2, 0); }
    const s = Math.sin(t*10); A[0].rotation.set(-2.5 + s*0.15, 0, -0.35 + s*0.2); A[1].rotation.set(-1.3 + Math.max(0, Math.sin(t*5))*-0.9, 0, 0.5);
  } else if (st === 'maracas'){
    if (g.parent !== I.handL){ I.handL.add(g); g.position.set(0,0,0.02); g.rotation.set(0.4,0,0); }
    const s = Math.sin(t*13); A[0].rotation.set(-1.9 + s*0.55, 0, -0.35); A[1].rotation.set(-1.9 - s*0.55, 0, 0.35); c.model.position.y += Math.abs(Math.sin(t*6.5))*0.03;
  }
}
function instCarryPose(c, I, moving){
  const U = c.model.userData, A = U.arms;
  if (I.style === 'violin' || I.style === 'ukulele' || I.style === 'tambourine'){ A[0].rotation.x *= 0.35; A[0].rotation.z = -0.5; }
  else if (I.style === 'flute' || I.style === 'trumpet'){ A[0].rotation.x = -0.45 + A[0].rotation.x*0.2; }
  else if (I.style === 'maracas'){ A[0].rotation.x = Math.min(A[0].rotation.x, -0.3); A[1].rotation.x = Math.min(A[1].rotation.x, -0.3); }
}
function instTick(tsec){
  Object.values(chars).forEach(c => {
    const U = c.model && c.model.userData, I = U && U.inst; if (!I || !c.g.visible) return;
    const me = c.slot === G.slot;
    const busy = c.ride || c.override || (me && (G.sit || G.sleepAnim || G.anim || G.down || G.fishing));
    const playing = me && G.music && G.music.inst === I.style && !busy;
    if (playing){ c.instPlay = true; instPlayPose(c, I, tsec); return; }
    if (c.instPlay){ c.instPlay = false; Char3D.carryInst(THREE, I); U.arms.forEach((a,k) => a.rotation.set(0, 0, 0.28*(k ? 1 : -1))); U.head.rotation.set(0,0,0); }
    if (!busy) instCarryPose(c, I);
  });
}

/* ---------- zoomable, draggable map ---------- */
const _openMap8 = openMap;
let mapZ = 1, mapX = 0, mapY = 0;
openMap = function(){
  _openMap8();
  const cv = $('#mapCv'); if (!cv) return; cv.width = cv.height = 1359; drawMap();
  const vp = document.createElement('div'); vp.className = 'mapvp'; cv.parentNode.insertBefore(vp, cv); vp.appendChild(cv);
  const ctr = document.createElement('div'); ctr.className = 'mapzoom'; ctr.innerHTML = '<button data-z="in" aria-label="지도 확대">+</button><button data-z="out" aria-label="지도 축소">−</button><button data-z="me" aria-label="내 위치">◎</button>'; vp.appendChild(ctr);
  const W = () => vp.clientWidth;
  const clamp = () => { const w = W(); mapX = Math.min(0, Math.max(w - w*mapZ, mapX)); mapY = Math.min(0, Math.max(w - w*mapZ, mapY)); };
  const apply = () => { clamp(); cv.style.transform = 'translate('+mapX+'px,'+mapY+'px) scale('+mapZ+')'; };
  const zoomAt = (f, px, py) => { const nz = Math.max(1, Math.min(6, mapZ*f)); const k = nz/mapZ; mapX = px - (px - mapX)*k; mapY = py - (py - mapY)*k; mapZ = nz; apply(); };
  const centerMe = z => { const me = chars[G.slot]; if (!me) return; mapZ = z || Math.max(mapZ, 3); const w = W(), cx = (me.x + C + 0.5)/N*w*mapZ, cz = (me.z + C + 0.5)/N*w*mapZ; mapX = w/2 - cx; mapY = w/2 - cz; apply(); };
  apply();
  ctr.addEventListener('click', e => { const b = e.target.closest('[data-z]'); if (!b) return; e.stopPropagation(); const w = W(); if (b.dataset.z === 'in') zoomAt(1.5, w/2, w/2); else if (b.dataset.z === 'out') zoomAt(1/1.5, w/2, w/2); else centerMe(); });
  const pts = new Map(); let pinch0 = null, moved = 0, last = null;
  vp.addEventListener('pointerdown', e => { if (e.target.closest('.mapzoom')) return; vp.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x:e.clientX, y:e.clientY }); moved = 0; last = { x:e.clientX, y:e.clientY };
    if (pts.size === 2){ const [a,b] = [...pts.values()]; const r = vp.getBoundingClientRect(); pinch0 = { d:Math.hypot(a.x-b.x, a.y-b.y), z:mapZ, cx:(a.x+b.x)/2 - r.left, cy:(a.y+b.y)/2 - r.top }; } });
  vp.addEventListener('pointermove', e => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x:e.clientX, y:e.clientY });
    if (pts.size === 2 && pinch0){ const [a,b] = [...pts.values()]; const f = Math.hypot(a.x-b.x, a.y-b.y)/pinch0.d; zoomAt(pinch0.z*f/mapZ, pinch0.cx, pinch0.cy); moved = 99; return; }
    if (pts.size === 1 && last){ const dx = e.clientX - last.x, dy = e.clientY - last.y; moved += Math.abs(dx) + Math.abs(dy); last = { x:e.clientX, y:e.clientY }; if (mapZ > 1){ mapX += dx; mapY += dy; apply(); } } });
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch0 = null; if (pts.size === 1){ const [a] = [...pts.values()]; last = { x:a.x, y:a.y }; } };
  vp.addEventListener('pointerup', up); vp.addEventListener('pointercancel', up);
  vp.addEventListener('click', e => { if (e.target.closest('.mapzoom')) return; e.stopPropagation(); e.preventDefault(); if (moved > 10) return; mapWalk(e.clientX, e.clientY); }, true);
  const mapWalk = (x, y) => { const r = cv.getBoundingClientRect(), sc = N / r.width; const i = Math.round((x - r.left)*sc - 0.5), j = Math.round((y - r.top)*sc - 0.5);
    if (!inb(i,j)) return; closePanel(); if (G.inside || G.boat){ toast(G.boat ? '배를 타고 있을 땐 방향키로 움직여요' : '밖에 나가서 이동해요'); return; }
    let ti = i, tj = j; if (blocked(ti,tj)){ let best = null, bd = 1e9; for (let a=-4;a<=4;a++) for (let b=-4;b<=4;b++){ const ii = i+a, jj = j+b; if (inb(ii,jj) && !blocked(ii,jj) && a*a+b*b < bd){ bd = a*a+b*b; best = [ii,jj]; } } if (!best){ toast('거기는 갈 수 없어요'); return; } [ti,tj] = best; }
    walkTo(ti, tj); };
  vp.addEventListener('wheel', e => { e.preventDefault(); const r = vp.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.2 : 1/1.2, e.clientX - r.left, e.clientY - r.top); }, { passive:false });
  const note = vp.parentNode.querySelector('.note'); if (note) note.textContent = '두 손가락으로 벌리거나 + 버튼으로 확대해요. 확대하면 끌어서 움직이고, 탭하면 그곳으로 걸어가요.';
};

/* ---------- hospital beds: longer, the patient lies fully on the mattress ---------- */
const _fixMesh8 = fixMesh;
fixMesh = function(it){
  if (it.id === 'hbed'){ const g = new THREE.Group();
    M(new THREE.BoxGeometry(0.92,0.46,2.0), '#ffffff', 0, 0.28, 0.52, g); M(new THREE.BoxGeometry(0.88,0.12,1.5), '#cfe8f6', 0, 0.56, 0.78, g);
    M(new THREE.CapsuleGeometry(0.12,0.42,4,10), '#ffffff', 0, 0.6, -0.2, g).rotation.z = Math.PI/2;
    M(new THREE.BoxGeometry(0.97,0.72,0.07), '#d8e8f2', 0, 0.5, -0.47, g); M(new THREE.BoxGeometry(0.97,0.42,0.06), '#d8e8f2', 0, 0.36, 1.5, g); return g; }
  return _fixMesh8(it);
};
patientModel = function(n){ const g = new THREE.Group(), m = npcModel(n, 'sleep'); bandage(m); m.rotation.x = -Math.PI/2; m.position.set(0, 0.12, 1.12); m.scale.setScalar(0.92); g.add(m);
  const bl = M(new THREE.BoxGeometry(0.8, 0.08, 0.75), '#bfe0f2', 0, 0.36, 0.95, g); return g; };

/* glue */
const _featTick8 = featTick;
featTick = function(dt, tsec){ _featTick8(dt, tsec); instTick(tsec); };
