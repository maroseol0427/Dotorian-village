/* ================= v8 ================= */

/* ---------- hospital patients you can talk to ---------- */
const WHY_LINES = {
  car: [['자동차에 쾅! 부딪혔어요… 아직도 머리가 띵해요.','누가 운전하다가 저를 못 봤나 봐요. 다들 천천히 다니면 좋겠어요.'],
        ['스쿠터가 휙 지나가다가 저를 치고 갔어요!','다리가 욱신거리지만 의사 선생님이 금방 낫는대요.'],
        ['길을 건너는데 빵빵! 하더니 날아갔지 뭐예요.','붕대 감으니까 좀 멋있어 보이지 않아요? 헤헤.']],
  train: [['기차 건널목에서 딴생각하다가… 기차에 치였어요.','다음부턴 꼭 좌우를 살피고 건널 거예요!'],
          ['칙칙폭폭 소리를 못 들었어요. 쿵! 하고 하늘을 날았답니다.','기차는 정말 무서워요… 다들 철길 조심해요.'],
          ['철길 위에서 꽃을 보고 있었는데 기차가 왔어요.','꽃은 무사해요. 저만 다쳤어요, 하하…']],
  other: [['넘어져서 쿵 하고 다쳤어요.','금방 나을 거예요. 걱정해 줘서 고마워요.']],
};
function patientTalk(id){
  const p = patients[id], n = NPC_BY[id]; if (!p || !n || dlg) return;
  const pick = (WHY_LINES[p.why] || WHY_LINES.other); const L = pick[(id.length + (n.name.charCodeAt(0)||0)) % pick.length];
  const left = Math.max(1, Math.ceil((p.until - Date.now())/60000));
  const g = G.inside && G.inside.patients && (G.inside.patients.find(q => q.id === id) || {}).g;
  const fake = { n, g: g || new THREE.Group(), model: null, x: g ? g.position.x : 0, z: g ? g.position.z : 0, path: [], talking: false, sleep: false, clerk: true, patient: true };
  const me = chars[G.slot]; if (me && g) me.face = Math.atan2(g.position.x - me.x, g.position.z - me.z);
  closePanel(); stopFishing();
  const rel = relOf(id); if (!rel.met){ rel.met = true; rel.last = today(); rel.today = 1; saveMe(); }
  openDialog(fake, ['(붕대를 감고 누워 있어요) 어, '+G.me.name+'! 와 줬구나.', ...L, '앞으로 '+left+'분만 더 쉬면 퇴원이래요. 문병 와 줘서 고마워요!']);
}
function tagPatients(){ (G.inside && G.inside.patients || []).forEach(p => p.g.traverse(o => { o.userData.patient = p.id; })); }
const _enterShop8 = enterShop;
enterShop = function(kind){ _enterShop8(kind); tagPatients(); };
const _enterNpcHome8 = enterNpcHome;
enterNpcHome = function(npc){ _enterNpcHome8(npc); tagPatients(); };
const _onTap8 = onTap;
onTap = function(x, y){
  if (!dlg && G.started && G.inside && G.inside.patients && G.inside.patients.length && !G.panel && room){
    ndc.set((x/window.innerWidth)*2-1, -(y/window.innerHeight)*2+1); ray.setFromCamera(ndc, cam);
    const hit = ray.intersectObjects(G.inside.patients.map(p => p.g), true)[0];
    if (hit){ let o = hit.object; while (o && o.userData.patient === undefined) o = o.parent; if (o){ patientTalk(o.userData.patient); return; } }
  }
  return _onTap8(x, y);
};
const _frontTarget8 = frontTarget;
frontTarget = function(){
  if (G.inside && G.inside.patients && G.inside.patients.length){ const me = chars[G.slot];
    if (me){ const fx = me.x + Math.sin(me.face)*0.9, fz = me.z + Math.cos(me.face)*0.9;
      for (const p of G.inside.patients){ const q = new THREE.Vector3(); p.g.getWorldPosition(q); if (Math.hypot(q.x - fx, q.z - fz) < 1.25) return { type:'patient', id:p.id }; } } }
  return _frontTarget8();
};
const _labelExtra8 = labelExtra;
labelExtra = function(t){ if (t.type === 'patient') return '문병'; return _labelExtra8(t); };
const _actExtra8 = actExtra;
actExtra = function(t){ if (t.type === 'patient') return patientTalk(t.id); return _actExtra8(t); };

/* ---------- villagers step aside when they block the way ---------- */
function sideStep(np, dirx, dirz, avoid){
  const l = Math.hypot(dirx, dirz) || 1, ux = dirx/l, uz = dirz/l;
  const opts = [[Math.round(uz), Math.round(-ux)], [Math.round(-uz), Math.round(ux)], [-Math.round(ux), -Math.round(uz)]]
    .filter(([a,b]) => a || b).sort(() => Math.random() - 0.5);
  // prefer the two sideways tiles first, backwards last
  opts.sort((A,B) => (Math.abs(A[0]*ux + A[1]*uz) - Math.abs(B[0]*ux + B[1]*uz)));
  for (const [a,b] of opts){ const i = np.i + a, j = np.j + b; if (!inb(i,j) || blocked(i,j)) continue;
    if (avoid && Math.hypot(wx(i) - avoid.x, wz(j) - avoid.z) < 0.8) continue;
    if (Object.values(npcs).some(o => o !== np && o.g.visible && !o.hidden && Math.hypot(o.x - wx(i), o.z - wz(j)) < 0.6)) continue;
    np.path = [[i,j]]; np.wait = 0; np.stepAside = 1.2; np.blockT = 0; return true; }
  return false;
}
const _npcWalk8 = npcWalk;
npcWalk = function(np, dt, speed){
  const [ti,tj] = np.path[0], tx = wx(ti), tz = wz(tj), me = chars[G.slot];
  if (np.stepAside){ np.stepAside -= dt; if (np.stepAside <= 0) np.stepAside = 0; }
  const meBlocks = me && !G.inside && Math.hypot(me.x - tx, me.z - tz) < 0.55 && Math.hypot(me.x - np.x, me.z - np.z) > 0.2;
  if (meBlocks && np.n.id !== 'kini'){
    np.pBlockT = (np.pBlockT||0) + dt; np.face = Math.atan2(tx - np.x, tz - np.z);
    if (np.pBlockT > 1.5){ np.pBlockT = 0; if (sideStep(np, tx - np.x, tz - np.z, me)){ if (!np.said || Date.now() - np.said > 15000){ np.said = Date.now(); say(np, pickL(['앗, 먼저 지나가세요~','비켜 드릴게요!','어이쿠, 실례했어요!','이쪽으로 지나가요~'])); } return false; } }
    return false;
  }
  np.pBlockT = 0;
  const r = _npcWalk8(np, dt, speed);
  // blocked by a standing villager for too long → step around
  if (!r && np.path.length && np.blockT > 1.4){ const o = Object.values(npcs).find(o => o !== np && o.g.visible && !o.hidden && Math.hypot(o.x - tx, o.z - tz) < 0.55); if (o) sideStep(np, tx - np.x, tz - np.z, o); }
  return r;
};
// pushing against a villager who is standing still → they shuffle out of the way after ~1.5s
const _charBlock8 = charBlock;
charBlock = function(me, x, z){
  const r = _charBlock8(me, x, z);
  if (r && me === chars[G.slot] && !G.inside){
    const np = Object.values(npcs).find(np => np.g.visible && !np.override && !np.hidden && !np.talking && Math.hypot(x - np.x, z - np.z) < 0.5);
    if (np && !np.path.length){ const now = performance.now(); if (!np.pushAt || now - np.pushLast > 400) np.pushAt = now; np.pushLast = now;
      if (now - np.pushAt > 1500){ np.pushAt = 0; np.pushLast = 0; if (sideStep(np, x - me.x, z - me.z, { x, z })){ np.wait = 2.5; say(np, pickL(['앗, 지나가세요~','비켜 줄게!','어머, 미안해요!','길 막았네, 헤헤.'])); } } }
  }
  return r;
};

/* ---------- police: walk out of the station, chase, patrol for 10 minutes ---------- */
const WANTED_MS = 10*60*1000;
const POLICE_B = BUILD.find(b => b.kind === 'police');
G.cops = null; // { list:[cop], until }
const copsOut = () => !!(G.cops && G.cops.list.length);
clerkPresent = (_cp => n => !(n.work === 'police' && copsOut()) && _cp(n))(clerkPresent);
function playerHidden(){
  const me = chars[G.slot]; if (!me) return true;
  return !!(G.inside || G.boat || G.ride || G.rescue || G.down || G.sleepAnim || isletAt(me.x, me.z));
}
function copSpawnTile(){ const [i,j] = T(POLICE_B.door[0], POLICE_B.door[1]); return [i,j]; }
function makeCop(id, k){
  const g = new THREE.Group(), m = npcModel(NPC_BY[id]); g.add(m); scene.add(g);
  const [i,j] = copSpawnTile(); const el = document.createElement('div'); el.className = 'siren'; el.textContent = '🚨'; el.hidden = true; $('#labels').appendChild(el);
  const c = { id, n:NPC_BY[id], g, m, i, j, x:wx(i) + (k ? 0.3 : -0.3), z:wz(j), path:[], mode:'patrol', repath:0, lost:0, walkT:0, face:0, el, wait:k*1.5 };
  g.position.set(c.x, 0, c.z); return c;
}
let patrolTiles = null;
function buildPatrolTiles(){
  const [si,sj] = copSpawnTile(), seen = new Uint8Array(N*N), q = [idx(si,sj)]; seen[q[0]] = 1; let h = 0; patrolTiles = [];
  while (h < q.length){ const cur = q[h++], ci = cur % N, cj = (cur/N)|0; const t = tile[cur]; if ((t === PATH || t === PLAT || t === BRIDGE) && Math.abs(ci - si) + Math.abs(cj - sj) < 70) patrolTiles.push([ci,cj]);
    for (const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){ const ni = ci+a, nj = cj+b; if (!inb(ni,nj)) continue; const n = idx(ni,nj); if (seen[n] || blocked(ni,nj)) continue; seen[n] = 1; q.push(n); } }
}
function startWanted(spotted){
  const now = Date.now(); G.me.wanted = now + WANTED_MS; saveMe();
  if (!G.cops) G.cops = { list:[] };
  if (!G.cops.list.length && !G.inside) G.cops.list = [makeCop('cop1', 0), makeCop('cop2', 1)];
  const me = chars[G.slot];
  if (playerHidden()){ toast(G.inside ? '🚨 경찰이 출동했어요! 10분 동안 마을을 순찰해요' : '🚨 경찰이 출동했지만 여기까진 못 와요. 10분 동안 마을을 순찰해요', 2800); }
  else { G.cops.list.forEach(c => { c.mode = 'chase'; c.repath = 0; }); toast('🚨 삐뽀삐뽀! 경찰이 쫓아와요! 잡히면 벌금 100 · 집에 숨으면 따돌려요', 3000); }
  playSfx('siren');
}
callPolice = function(){ if (G.rescue) return; startWanted(true); };
function copWalk(c, dt, speed){
  if (!c.path.length) return false; const [ti,tj] = c.path[0], tx = wx(ti), tz = wz(tj), dx = tx - c.x, dz = tz - c.z, d = Math.hypot(dx, dz), st = speed*dt;
  c.face = Math.atan2(dx, dz);
  if (d <= st){ c.x = tx; c.z = tz; c.i = ti; c.j = tj; c.path.shift(); } else { c.x += dx/d*st; c.z += dz/d*st; }
  return true;
}
function removeCop(c){ scene.remove(c.g); c.el.remove(); if (c.bub) c.bub.remove(); }
function fineByCop(c){
  const me = chars[G.slot]; G.me.wanted = 0; G.me.acorns -= 100; saveMe(); updateHud();
  G.cops.list.forEach(o => { o.mode = 'home'; o.path = []; o.el.hidden = true; });
  c.mode = 'talk'; const U = c.m.userData; U.legs.forEach(l => l.rotation.x = 0); U.arms[1].rotation.x = -2.6;
  c.face = Math.atan2(me.x - c.x, me.z - c.z); me.face = Math.atan2(c.x - me.x, c.z - me.z); me.path = []; ctl.wasMoving = false;
  const cop = { n:NPC_BY[c.id], g:c.g, model:c.m, x:c.x, z:c.z, path:[], talking:false, sleep:false, clerk:true };
  talkTo(cop, ['삐뽀삐뽀! 딱 걸렸어요! 아까 탈것으로 주민을 쳤죠?', '다친 주민은 병원에서 치료받고 있어요. 벌금 도토리 100개를 받겠어요.', '앞으로는 천천히, 주민을 잘 보고 운전해요. 약속!']);
  c.after = () => { c.mode = 'home'; c.path = []; };
}
policeTick = function(dt, tsec){
  const K = G.cops; const me = chars[G.slot];
  // keep the wanted state alive across reloads
  if ((!K || !K.list.length) && G.me && G.me.wanted > Date.now() && !G.inside && G.started){ if (!G.cops) G.cops = { list:[] }; G.cops.list = [makeCop('cop1', 0), makeCop('cop2', 1)]; return; }
  if (!K || !K.list.length) return;
  const wanted = G.me.wanted > Date.now(), hidden = playerHidden();
  K.list.forEach(c => { c.g.visible = !G.inside; });
  if (G.inside){ K.list.forEach(c => { if (c.mode === 'chase'){ c.mode = 'patrol'; c.path = []; c.el.hidden = true; } c.el.hidden = true; }); if (!K.hidToast && wanted){ K.hidToast = true; if (K.wasChased) toast('휴~ 경찰을 따돌렸어요! (아직 순찰 중이에요)', 2400); } return; }
  K.hidToast = false;
  const [hi,hj] = copSpawnTile();
  K.list.forEach(c => {
    let speed = 2.1, moving = false;
    if (!wanted && c.mode !== 'home' && c.mode !== 'talk'){ c.mode = 'home'; c.path = []; c.el.hidden = true; }
    if (c.mode === 'talk'){ if (!dlg){ c.mode = 'home'; c.path = []; } }
    else if (c.mode === 'home'){
      speed = 2.6; if (!c.path.length){ if (c.i === hi && c.j === hj){ c.gone = true; } else { const p = bfs(c.i, c.j, (i,j) => i === hi && j === hj); c.path = p || []; if (!p) c.gone = true; } }
    }
    else if (c.mode === 'patrol'){
      if (!hidden && Math.hypot(me.x - c.x, me.z - c.z) < 7){ c.mode = 'chase'; c.repath = 0; c.lost = 0; K.wasChased = true; toast('🚨 경찰에게 들켰어요! 도망쳐요!', 1800); playSfx('siren'); say(c, pickL(['거기 서요!','찾았다! 멈춰요!','삐뽀삐뽀! 기다려요!'])); }
      else if (!c.path.length){ if ((c.wait -= dt) <= 0){ if (!patrolTiles) buildPatrolTiles(); const t = patrolTiles[(Math.random()*patrolTiles.length)|0]; const p = t && bfs(c.i, c.j, (i,j) => i === t[0] && j === t[1]); c.path = p ? p.slice(0, 120) : []; c.wait = 1 + Math.random()*2; } }
    }
    if (c.mode === 'chase'){
      speed = 3.5; K.wasChased = true; const d = Math.hypot(me.x - c.x, me.z - c.z);
      if (hidden || d > 14){ c.lost += dt; } else c.lost = 0;
      if (c.lost > 2.5){ c.mode = 'patrol'; c.path = []; c.el.hidden = true; }
      else if (d < 0.95 && !hidden && !dlg){ fineByCop(c); }
      else { c.repath -= dt; if (c.repath <= 0){ c.repath = 0.5; const p = bfs(c.i, c.j, (i,j) => Math.abs(i - me.i) + Math.abs(j - me.j) <= 0); c.path = p ? p.slice(0, 60) : []; if (!p){ c.lost += 0.6; } }
        if (!c.path.length && d < 1.6){ const dx = me.x - c.x, dz = me.z - c.z, l = Math.hypot(dx,dz)||1; c.x += dx/l*speed*dt; c.z += dz/l*speed*dt; c.face = Math.atan2(dx,dz); moving = true; } }
    }
    if (c.mode !== 'talk') moving = copWalk(c, dt, speed) || moving;
    c.g.position.set(c.x, 0, c.z); let dr = c.face - c.g.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); c.g.rotation.y += dr*Math.min(1, dt*10);
    if (c.mode !== 'talk'){ c.walkT = moving ? c.walkT + dt*(c.mode === 'chase' ? 15 : 11) : 0; const U = c.m.userData, w = moving ? Math.sin(c.walkT)*0.7 : 0; U.legs[0].rotation.x = w; U.legs[1].rotation.x = -w; U.arms[0].rotation.x = -w; U.arms[1].rotation.x = c.mode === 'chase' ? -2.4 : w; }
    // blinking siren over the head while chasing
    const show = c.mode === 'chase';
    if (show){ _v.set(c.x, 2.6, c.z).project(cam); c.el.hidden = _v.z > 1; c.el.style.left = ((_v.x+1)/2*window.innerWidth)+'px'; c.el.style.top = ((1-_v.y)/2*window.innerHeight)+'px'; } else c.el.hidden = true;
    if (c.bub && !c.bub.hidden){ if (performance.now() > c.bubUntil || dlg){ c.bub.hidden = true; } else { _v.set(c.x, 2.05, c.z).project(cam); c.bub.style.left = ((_v.x+1)/2*window.innerWidth)+'px'; c.bub.style.top = ((1-_v.y)/2*window.innerHeight)+'px'; } }
  });
  K.list.filter(c => c.gone).forEach(removeCop); K.list = K.list.filter(c => !c.gone);
};
// drop the old freeze-style police entirely
G.police = null;

GUIDE.forEach(gd => { if (gd.id === 'safety') gd.lines[0] = '자동차나 스쿠터로 주민을 치면 경찰이 출동해! 도망칠 수도 있고 집에 숨으면 따돌릴 수 있지만, 10분 동안 경찰이 마을을 순찰해. 머리 위에 🚨가 반짝이면 쫓아오는 중! 잡히면 벌금 도토리 100개.'; });
