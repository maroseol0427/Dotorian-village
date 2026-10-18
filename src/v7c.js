/* ---------- patients: villagers hurt by trains or cars rest in hospital (or at home) for 10 minutes ---------- */
const PATIENT_MS = 10*60*1000;
let patients = LS.get('dv.patients', {});
const savePatients = () => LS.set('dv.patients', patients);
function isPatient(id){ const p = patients[id]; if (!p) return false; if (Date.now() > p.until){ delete patients[id]; savePatients(); const np = npcs[id]; if (np) setTimeout(() => { if (np.g.visible) say(np, pickL(['다 나았다! 이제 조심해야지.','퇴원했어요~ 상쾌해!','붕대 풀었다! 야호!'])); }, 2500); return false; } return true; }
function freeHospBed(){ const used = new Set(Object.values(patients).filter(p => p.where === 'hosp').map(p => p.bed)); for (let k=0;k<HOSP_BEDS.length;k++) if (!used.has(k)) return k; return -1; }
function hospitalize(np, why){
  const id = np.n.id; if (isPatient(id)) return;
  const bed = freeHospBed(), where = bed >= 0 ? 'hosp' : (NHOME[np.n.home] ? 'home' : 'hosp');
  patients[id] = { until:Date.now() + PATIENT_MS, where, bed:Math.max(0,bed), why }; savePatients();
  if (id === 'kini' && G.me.kini && G.me.kini.on){ G.me.kini.on = false; saveMe(); }
  if (G.guide && G.guide.np === np) G.guide = null;
  toast(np.n.name+'이(가) '+(where === 'hosp' ? '병원에 입원했어요' : '병실이 꽉 차서 자기 집에서 쉬어요')+' (10분 뒤 퇴원)', 2800);
}
function bandage(model){ const U = model.userData; if (!U || !U.head) return; const t = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.05, 6, 18), TM('#ffffff')); t.rotation.x = Math.PI/2.3; t.position.y = 0.08; U.head.add(t); const p = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.08,0.02), TM('#ffd6dc')); p.position.set(0.12, 0.12, 0.31); U.head.add(p); }
function patientModel(n){ const g = new THREE.Group(), m = npcModel(n, 'sleep'); bandage(m); m.rotation.x = -Math.PI/2; m.position.z = 0.55; g.add(m); return g; }
// show patients in hospital beds / at home
const _enterShop6 = enterShop;
enterShop = function(kind){
  _enterShop6(kind);
  if (kind === 'hosp' && G.inside){ G.inside.patients = [];
    Object.entries(patients).forEach(([id,p]) => { if (p.where !== 'hosp' || !isPatient(id) || !NPC_BY[id]) return; const B = HOSP_BEDS[p.bed]; if (!B) return; const g = patientModel(NPC_BY[id]); g.position.set(iwx(B.x), 0.5, iwz(B.z)); room.add(g); G.inside.patients.push({ g, id }); });
    if (G.inside.patients.length && !G.rescue) setTimeout(() => toast('입원 중: '+G.inside.patients.map(p => NPC_BY[p.id].name).join(', ')+' · 누르면 문병할 수 있어요', 2600), 900); }
};
const _enterNpcHome5 = enterNpcHome;
enterNpcHome = function(npc){
  _enterNpcHome5(npc);
  const p = patients[npc]; if (!p || p.where !== 'home' || !isPatient(npc) || !G.inside) return;
  const H = G.inside.home, bed = H.items.find(it => it.id === 'bed' && !(it.r%2)), g = patientModel(NPC_BY[npc]);
  g.position.set(bed ? iwx(bed.x) : iwx(1.5), bed ? 0.5 : 0.15, bed ? iwz(bed.z) : iwz(1.5)); room.add(g); G.inside.patients = [{ g, id:npc }];
  setTimeout(() => toast(NPC_BY[npc].name+'이(가) 다쳐서 집에서 쉬고 있어요. 쉿!', 2400), 300);
};
// the rescued player gets a free bed
function playerBed(){ const used = new Set(Object.values(patients).filter(p => p.where === 'hosp').map(p => p.bed)); for (let k=HOSP_BEDS.length-1;k>=0;k--) if (!used.has(k)) return HOSP_BEDS[k]; return HOSP_BEDS[0]; }
const _clerkPresent6 = clerkPresent;
clerkPresent = n => !isPatient(n.id) && !(n.work === 'police' && G.dispatchPoliceUntil > Date.now()) && _clerkPresent6(n);

/* ---------- train hits: twice in a row and you faint; villagers get hurt too ---------- */
const _knockdown6 = knockdown;
knockdown = function(tx, tz, word, opts){
  const me = chars[G.slot]; const now = Date.now(); const H = G.me.trainHits = (G.me.trainHits && now - G.me.trainHits.at < 30*60000) ? G.me.trainHits : { n:0, at:now };
  H.n++; H.at = now;
  if (G.me.ride && ITEM[G.me.ride] && !(opts && opts.noBreak)){ const rid = G.me.ride, nm = ITEM[rid].name; G.me.broken = G.me.broken || {}; G.me.broken[rid] = 1; delete G.me.owned[rid]; G.me.ride = null; applyLook(me, G.me); updateHud(); setTimeout(() => pop(nm+'이(가) 부서졌어요', '기차랑 부딪혀서 산산조각…<br><small>몽실 쇼핑몰에서 원래 가격의 10%로 다시 살 수 있어요</small>', true), 900); }
  _knockdown6(tx, tz, word);
  G.down.faint = H.n >= 2; setCharFace(me, 'ouch');
  if (G.down.faint) H.n = 0;
  saveMe();
};
const _downTick6 = downTick;
downTick = function(dt){
  const D = G.down; if (!D) return; const faint = D.faint;
  if (faint && D.t > 2.4){ const me = chars[G.slot]; me.model.rotation.set(0,0,0); me.model.position.y = 0; charAt(me, D.li, D.lj); G.down = null; setCharFace(me, null); toast('기차에 두 번이나 치여서 기절했어요!', 2400); startRescue('amb'); return; }
  _downTick6(dt);
  if (!G.down) setCharFace(chars[G.slot], null);
};
trainHitCheck = function(){
  const me = chars[G.slot];
  const cars = train.cars.concat(islTrain.cars);
  if (me && !G.inside && !G.down && !G.boat && !G.rescue && !G.sit && !G.sleepAnim && me.g.visible){
    for (const c of cars){ const dx = me.x - c.position.x, dz = me.z - c.position.z; if (dx*dx + dz*dz < 0.55 && (me.jy||0) + (me.elev||0) < 0.55){
      const fwd = [Math.sin(c.rotation.y), Math.cos(c.rotation.y)], side = [fwd[1], -fwd[0]], sgn = (dx*side[0] + dz*side[1]) >= 0 ? 1 : -1;
      const dir = [side[0]*sgn*0.8 + fwd[0]*0.6, side[1]*sgn*0.8 + fwd[1]*0.6], len = Math.hypot(dir[0], dir[1]);
      knockdown(me.x + dir[0]/len*3.8, me.z + dir[1]/len*3.8, '퍽!'); break; } }
  }
  Object.values(npcs).forEach(np => { if (!np.g.visible || np.override || np.down || np.hidden) return; for (const c of cars){ const dx = np.x - c.position.x, dz = np.z - c.position.z; if (dx*dx+dz*dz < 0.45){ npcKnock(np, c); break; } } });
};
npcKnock = function(np, c, dirx, dirz){
  const fx = dirx !== undefined ? dirx : Math.sin(c.rotation.y), fz = dirz !== undefined ? dirz : Math.cos(c.rotation.y);
  const [li,lj] = nearestFree(np.x + fz*2.5 + fx*2, np.z - fx*2.5 + fz*2);
  np.down = { t:0, from:{ x:np.x, z:np.z }, to:{ x:wx(li), z:wz(lj) }, li, lj }; np.override = true; np.path = []; np.talking = false;
  popWord(np.x, 1.0, np.z, '퍽!'); playSfx('bonk'); setNpcFace(np, 'ouch');
};
npcDownTick = function(dt){
  Object.values(npcs).forEach(np => { const D = np.down; if (!D) return; D.t += dt; const m = np.model;
    if (D.t < 0.8){ const q = hopArc(D.from, D.to, D.t/0.8, 1.8); np.g.position.set(q.x, q.y, q.z); m.rotation.x = D.t/0.8*Math.PI*2; }
    else if (D.t < 2.4){ np.g.position.set(D.to.x, 0, D.to.z); m.rotation.x = -Math.PI/2; m.position.y = 0.15; if (!D.called){ D.called = true; popWord(D.to.x, 0.9, D.to.z, '아야야…', 'small'); } }
    else { m.rotation.x = 0; m.position.y = 0; np.i = D.li; np.j = D.lj; np.x = D.to.x; np.z = D.to.z; np.override = false; np.down = null; setNpcFace(np, null); popWord(np.x, 1.2, np.z, '삐뽀삐뽀', 'small'); hospitalize(np, D.why || 'train'); }
  });
};

/* ---------- vehicles can hit villagers → police ---------- */
const _charBlock7 = charBlock;
charBlock = function(me, x, z){
  const ride = G.me.ride;
  if ((ride === 'car' || ride === 'scooter') && ctl.wasMoving){
    for (const np of Object.values(npcs)){ if (!np.g.visible || np.override || np.hidden || np.down) continue; if (Math.hypot(x-np.x, z-np.z) < 0.62){ const dx = np.x - me.x, dz = np.z - me.z, l = Math.hypot(dx,dz)||1;
      npcKnock(np, null, dx/l, dz/l); np.down.why = 'car'; relOf(np.n.id).f = Math.max(0, relOf(np.n.id).f - 3); saveMe(); setTimeout(callPolice, 1200); return false; } }
  }
  return _charBlock7(me, x, z);
};
function callPolice(){
  if (G.police || G.rescue) return; const me = chars[G.slot];
  if (G.inside){ return; }
  G.dispatchPoliceUntil = Date.now() + 40000;
  const a = Math.random()*6.28, from = { x:me.x + Math.cos(a)*9, z:me.z + Math.sin(a)*9 };
  const mk = id => { const g = new THREE.Group(), m = npcModel(NPC_BY[id]); g.add(m); scene.add(g); return { g, m }; };
  G.police = { t:0, phase:'arrive', from, b1:mk('cop1'), b2:mk('cop2') }; me.path = []; ctl.wasMoving = false;
  playSfx('siren'); toast('삐뽀삐뽀! 경찰이 출동했어요. 멈춰요!', 2200);
}
function policeTick(dt, tsec){
  const P = G.police; if (!P) return; P.t += dt; const me = chars[G.slot];
  const run = (b, tx, tz, t, fx, fz) => { b.g.position.set(fx + (tx-fx)*t, 0, fz + (tz-fz)*t); b.g.rotation.y = Math.atan2(tx-fx, tz-fz); const U = b.m.userData, w = Math.sin(P.t*16); U.legs[0].rotation.x = w; U.legs[1].rotation.x = -w; U.arms[0].rotation.x = -w; U.arms[1].rotation.x = w; };
  if (P.phase === 'arrive'){ const t = Math.min(1, P.t/2.4); run(P.b1, me.x - 0.7, me.z + 0.3, t, P.from.x - 0.4, P.from.z); run(P.b2, me.x + 0.7, me.z + 0.3, t, P.from.x + 0.4, P.from.z);
    if (t >= 1){ P.phase = 'talk'; P.t = 0; [P.b1, P.b2].forEach(b => { b.g.rotation.y = Math.atan2(me.x - b.g.position.x, me.z - b.g.position.z); const U = b.m.userData; U.legs.forEach(l => l.rotation.x = 0); U.arms[1].rotation.x = -2.6; });
      me.face = Math.atan2(P.b1.g.position.x - me.x, P.b1.g.position.z - me.z);
      const cop = { n:NPC_BY.cop1, g:P.b1.g, model:P.b1.m, x:P.b1.g.position.x, z:P.b1.g.position.z, path:[], talking:false, sleep:false, clerk:true };
      spend(100); talkTo(cop, ['삐뽀삐뽀! 거기 서요! 탈것으로 주민을 치었네요.', '다친 주민은 병원으로 갔어요. 벌금 도토리 100개를 받겠어요.', '앞으로는 천천히, 주민을 잘 보고 운전해요. 약속!']); } }
  else if (P.phase === 'talk'){ if (!dlg && P.t > 0.5){ P.phase = 'leave'; P.t = 0; } }
  else if (P.phase === 'leave'){ const t = Math.min(1, P.t/2.0); [P.b1, P.b2].forEach((b,k) => { const sx = b.sx = b.sx !== undefined ? b.sx : b.g.position.x, sz = b.sz = b.sz !== undefined ? b.sz : b.g.position.z; run(b, P.from.x + (k?0.4:-0.4), P.from.z, t, sx, sz); });
    if (t >= 1){ scene.remove(P.b1.g); scene.remove(P.b2.g); G.police = null; } }
}
