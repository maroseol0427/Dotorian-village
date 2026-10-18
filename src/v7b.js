/* ---------- jump onto things & bump into people ---------- */
function platAt(i,j){
  const s = statics.get(key(i,j)); let h = !s ? 0 : s.kind === 'rock' ? 0.32 : s.kind === 'bench' ? 0.42 : 0;
  const p = Store.data.placed[dkey(i,j)]; if (p && DEC[p.t]) h = Math.max(h, p.t === 'bench' ? 0.42 : p.t === 'pumpkin' ? 0.4 : p.t === 'pot' ? 0.32 : 0);
  return h;
}
function charBlock(me, x, z){
  const near = (ox, oz) => { const d0 = Math.hypot(me.x-ox, me.z-oz), d1 = Math.hypot(x-ox, z-oz); return d1 < 0.5 && d1 < d0; };
  for (const np of Object.values(npcs)){ if (!np.g.visible || np.override || np.hidden) continue; if (near(np.x, np.z)) return true; }
  for (const c of Object.values(chars)){ if (c === me || !c.g.visible) continue; if (near(c.x, c.z)) return true; }
  return false;
}
function elevTick(me){
  if (G.inside || me.override){ me.elev = 0; return; }
  const i = Math.round(me.x)+C, j = Math.round(me.z)+C; const h = blocked(i,j) ? platAt(i,j) : 0;
  const up = (me.elev||0) + (me.jy||0);
  if (h > 0 && (up >= h - 0.06 || me.elev >= h - 0.01)){ if (!me.elev && !me.jump) {} me.elev = h; }
  else me.elev = 0;
}
const _npcWalk5 = npcWalk;
npcWalk = function(np, dt, speed){
  const [ti,tj] = np.path[0], tx = wx(ti), tz = wz(tj), me = chars[G.slot];
  const skipMe = np.n.id === 'kini' || (G.guide && G.guide.np === np) || (G.tour && G.tour.np === np);
  const occ = (ox, oz) => Math.hypot(ox - tx, oz - tz) < 0.55 && Math.hypot(ox - np.x, oz - np.z) > 0.2;
  let stop = false;
  if (tile[idx(ti,tj)] === TRACK && train.cars.concat(islTrain.cars).some(c => Math.hypot(c.position.x - tx, c.position.z - tz) < 3.2)) stop = true;
  if (me && !skipMe && !G.inside && occ(me.x, me.z)) stop = true;
  if (!stop) for (const o of Object.values(npcs)){ if (o === np || !o.g.visible || o.hidden || o.override) continue; if (occ(o.x, o.z) && o.path.length === 0){ stop = true; break; } }
  if (stop){ np.blockT = (np.blockT||0) + dt; np.face = Math.atan2(tx-np.x, tz-np.z); if (np.blockT > 1.6){ np.blockT = 0; np.path = []; np.wait = 0.8; if (!np.said || Date.now() - np.said > 20000){ np.said = Date.now(); say(np, pickL(['앗, 실례!','먼저 지나가세요~','어이쿠, 미안해요!','저기요, 잠깐만요!','부딪힐 뻔했다!'])); } } return false; }
  np.blockT = 0; return _npcWalk5(np, dt, speed);
};

/* ---------- faces: closed eyes when sleeping, a wince when hurt ---------- */
function setCharFace(c, mode, p){ if (!c || c.faceMode === mode) return; c.faceMode = mode || null; c.sig = ''; applyLook(c, p || (c.slot === G.slot ? G.me : Store.data.players[pid(c.slot)])); }
function setNpcFace(np, mode){
  if (!np || np.faceMode === (mode||null)) return; np.faceMode = mode || null;
  const m = npcModel(np.n, mode); np.g.remove(np.model); np.g.add(m); np.model = m;
  if (!np.clerk) np.g.traverse(o => { o.userData.npc = np.n.id; }); else np.g.traverse(o => { o.userData.clerk = true; });
  rebuildPickables();
}
/* Zzz bubbles over sleepers */
const sleepers = new Set();
let zzzT = 0;
function zzzTick(dt){
  zzzT -= dt; if (zzzT > 0) return; zzzT = 1.1;
  const list = [];
  if (G.inside && G.inside.clerkNp && G.inside.clerkNp.sleep) list.push(G.inside.clerkNp.g);
  if (G.sleepAnim) list.push(chars[G.slot].g);
  if (G.inside && G.inside.patients) G.inside.patients.forEach(p => list.push(p.g));
  sleepers.forEach(g => { if (g.visible) list.push(g); });
  list.forEach(g => { const p = new THREE.Vector3(); g.getWorldPosition(p); _v.set(p.x + 0.2, p.y + 1.0, p.z).project(cam); if (_v.z > 1) return;
    const el = document.createElement('div'); el.className = 'zzz'; el.textContent = Math.random() < 0.5 ? 'Zzz…' : 'z Z'; el.style.left = ((_v.x+1)/2*window.innerWidth)+'px'; el.style.top = ((1-_v.y)/2*window.innerHeight)+'px';
    $('#labels').appendChild(el); setTimeout(() => el.remove(), 1900); });
}
/* sleeping in your own bed */
restAtHome = function(){
  regenStamina(); const me = G.me, wait = (me.restAt||0) + ECON.restCooldown - Date.now();
  if (wait > 0){ toast('아직 졸리지 않아요 · '+Math.ceil(wait/60000)+'분 뒤에 쉴 수 있어요'); return; }
  const H = G.inside && G.inside.home, bed = H && H.items.find(it => it.id === 'bed'); const c = chars[G.slot];
  if (!bed){ me.stamina = Math.min(ECON.stamMax, me.stamina + ECON.restGain); me.restAt = Date.now(); me.stAt = Date.now(); saveMe(); updateHud(); pop('푹 잤어요', '체력 +'+ECON.restGain); return; }
  const cells = cellsOf(bed), bx = cells.reduce((a,q)=>a+q[0],0)/cells.length, bz = cells.reduce((a,q)=>a+q[1],0)/cells.length;
  G.sleepAnim = { t:0, x:iwx(bx), z:iwz(bz), r:(bed.r||0), back:{ x:c.x, z:c.z } }; c.override = true; setCharFace(c, 'sleep');
  toast('쿨쿨… 잠이 들었어요', 2000);
};
function sleepTick(dt){
  const S = G.sleepAnim; if (!S) return; const c = chars[G.slot]; S.t += dt;
  c.x = S.x; c.z = S.z; c.g.position.set(S.x, 0.5, S.z); c.g.rotation.y = -S.r*Math.PI/2; c.model.rotation.x = -Math.PI/2; c.model.position.set(0, 0, 0.55); c.model.userData.arms.forEach(a => a.rotation.x = -0.2);
  if (S.t > 4.5){ G.sleepAnim = null; c.model.rotation.set(0,0,0); c.model.position.set(0,0,0); setCharFace(c, null); c.x = S.back.x; c.z = S.back.z; c.g.position.set(c.x, 0, c.z); c.override = false;
    const me = G.me; me.stamina = Math.min(ECON.stamMax, me.stamina + ECON.restGain); me.restAt = Date.now(); me.stAt = Date.now(); saveMe(); updateHud(); pop('개운하게 일어났어요!', '체력 +'+ECON.restGain); doAnim('cheer'); }
}
