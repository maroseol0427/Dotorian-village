/* ================= v11: 루루(돌아오면 선물 주는 분홍 사슴), 장신구, 감정표현, 이웃에게 선물하기, 할로윈 ================= */

Object.assign(DESC, {
  acc_pearl:'은은하게 빛나는 동글동글 진주 목걸이.', acc_locket:'가슴에 분홍 하트가 달랑.', acc_clover:'행운을 불러오는 네잎클로버.', acc_choker:'움직일 때마다 딸랑딸랑.',
  acc_starear:'귀에서 반짝이는 노란 별.', acc_ribbon:'머리 옆에 커다란 분홍 리본.', acc_sakura:'봄을 닮은 벚꽃 두 송이.',
  sp_tiara:'루루의 선물. 공주님처럼 반짝반짝.', sp_halo:'루루의 선물. 머리 위에 동동 떠 있는 천사 링.', sp_butterfly:'루루의 선물. 나풀나풀 나비.', sp_moonear:'루루의 선물. 밤하늘 초승달.',
  sp_sparkle:'루루의 선물. 머리 주위를 별들이 빙글빙글 돌아요.', sp_antler:'루루의 선물. 루루랑 똑같은 사슴뿔!', sp_crystal:'루루의 선물. 투명하게 빛나는 수정.', sp_rainbow:'루루의 선물. 비 갠 뒤 무지개.',
  hw_witch:'할로윈 한정! 호박 바구니랑 잘 어울려요.', hw_vampire:'할로윈 한정! 펄럭이는 검은 망토.', hw_ghost:'할로윈 한정! 우우~ 꼬마 유령.', hw_pumpkin:'할로윈 한정! 머리 위에 꼬마 호박.',
  hw_witchhat:'할로윈 한정! 뾰족한 마녀 모자.', hw_batwings:'할로윈 한정! 파닥파닥 박쥐 날개.', hw_bag:'할로윈 한정! 사탕이 가득.', hw_candy:'할로윈 한정! 주황 사탕.',
});
const projEl = (el, x, y, z) => { _v.set(x, y, z).project(cam); if (_v.z > 1){ el.style.left = '-999px'; return; } el.style.left = ((_v.x+1)/2*window.innerWidth)+'px'; el.style.top = ((1-_v.y)/2*window.innerHeight)+'px'; };

/* ---------- 할로윈 (10/15 ~ 11/3) ---------- */
function isHalloween(d){ d = d || new Date(); const v = (d.getMonth()+1)*100 + d.getDate(); return v >= 1015 && v <= 1103; }
const HW_ON = isHalloween();
SHOP.forEach(it => { if (it.hw){ it.basePrice = it.price; if (!HW_ON) it.price = 0; } });
const JACK_SPOTS = [[2,4],[-7,2],[8,-3],[-3,-9],[10,7],[-11,-5]];
let jackList = [];
function jackMesh(){
  const g = new THREE.Group(), om = '#ff9a3a', glow = new THREE.MeshBasicMaterial({ color:'#ffd66a' });
  [-1, 0, 1].forEach(k => { const b = M(GC('jkB', () => new THREE.SphereGeometry(0.3, 16, 12)), k ? '#f58a2e' : om, k*0.14, 0.27, k ? -0.03 : 0, g); b.scale.set(k ? 0.7 : 0.85, 0.86, k ? 0.95 : 1); });
  M(GC('jkS', () => new THREE.CylinderGeometry(0.035, 0.05, 0.13, 8)), '#6a8a3a', 0, 0.56, 0, g).rotation.z = 0.2;
  const tri = GC('jkT', () => { const s = new THREE.Shape(); s.moveTo(-0.06, -0.04); s.lineTo(0.06, -0.04); s.lineTo(0, 0.05); s.lineTo(-0.06, -0.04); return new THREE.ShapeGeometry(s); });
  [-1, 1].forEach(s => { const e = new THREE.Mesh(tri, glow); e.position.set(0.1*s, 0.33, 0.302); g.add(e); });
  const mouth = GC('jkM', () => { const s = new THREE.Shape(); s.moveTo(-0.15, 0.03); [[-0.1,-0.02],[-0.05,0.02],[0,-0.03],[0.05,0.02],[0.1,-0.02],[0.15,0.03],[0.1,-0.07],[0,-0.09],[-0.1,-0.07],[-0.15,0.03]].forEach(p => s.lineTo(p[0], p[1])); return new THREE.ShapeGeometry(s); });
  const mo = new THREE.Mesh(mouth, glow); mo.position.set(0, 0.2, 0.29); mo.rotation.x = -0.25; g.add(mo);
  return g;
}
function placeJacks(){
  if (!HW_ON || !worldRoot) return;
  jackList = JACK_SPOTS.map(([x, z], n) => {
    const [i, j] = nearestFree(x, z), k = key(i, j); statics.set(k, { kind:'jack', id:'jack'+n, n, i, j });
    const g = jackMesh(); g.position.set(wx(i), 0, wz(j)); g.rotation.y = Math.atan2(-wx(i), -wz(j)) + 0.3; g.traverse(o => { o.userData.key = k; });
    worldRoot.add(g); objMeshes.set(k, g); return { n, i, j, g };
  });
  rebuildPickables();
}
const _buildWorld11 = buildWorld;
buildWorld = function(){ _buildWorld11.apply(this, arguments); placeJacks(); };
function jackTap(n){
  ensureDaily(); const d = G.me.daily; d.jack = d.jack || [];
  const J = jackList[n], me = chars[G.slot];
  if (d.jack.includes(n)){ toast('이 호박등은 오늘 벌써 사탕을 줬어요. 내일 또 와요! (오늘 '+d.jack.length+'/'+JACK_SPOTS.length+')', 2200); return; }
  d.jack.push(n); G.me.acorns += 50; doAnim('pick'); playSfx('jump');
  if (J) popWord(J.g.position.x, 1.1, J.g.position.z, '트릭 오어 트릿!', 'big');
  if (d.jack.length >= JACK_SPOTS.length){
    if (!G.me.owned.hw_bag){ G.me.owned.hw_bag = 1; pop('🎃 호박등을 모두 찾았어요!', '사탕 대신 도토리 50개, 그리고<br><b>호박 사탕 바구니</b>를 선물로 받았어요!<br><small>옷장 → 손에서 들 수 있어요</small>'); }
    else { G.me.acorns += 300; pop('🎃 오늘의 호박등 6개 다 찾았어요!', '보너스 도토리 300개!'); }
  } else toast('🍬 사탕 대신 도토리 50개! 오늘 찾은 호박등 '+d.jack.length+'/'+JACK_SPOTS.length, 2200);
  saveMe(); updateHud();
}
// bats circling over the plaza
const bats = [];
if (HW_ON){
  const bm = '#3a2f4a';
  for (let k = 0; k < 5; k++){
    const g = new THREE.Group(); M(new THREE.SphereGeometry(0.1, 10, 8), bm, 0, 0, 0, g);
    [-1, 1].forEach(s => M(new THREE.ConeGeometry(0.035, 0.07, 4), bm, 0.05*s, 0.09, 0, g));
    const wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.x = 0.07*s; g.add(w); const m = M(new THREE.SphereGeometry(0.16, 10, 6), '#4a3c5c', 0.15*s, 0, 0, w); m.scale.set(1, 0.18, 0.55); return w; });
    g.userData = { wings, a:k/5*Math.PI*2, r:4 + (k % 3), h:3.6 + (k % 2)*0.8, sp:0.45 + k*0.06 };
    g.traverse(o => { o.castShadow = false; }); scene.add(g); bats.push(g);
  }
}
function halloweenTick(dt, tsec){
  if (!bats.length) return; const cx = wx(SPAWN[0]), cz = wz(SPAWN[1]), show = G.started && !G.inside;
  bats.forEach(b => { const U = b.userData; b.visible = show; if (!show) return; U.a += dt*U.sp; b.position.set(cx + Math.cos(U.a)*U.r, U.h + Math.sin(tsec*2 + U.a)*0.3, cz + Math.sin(U.a)*U.r); b.rotation.y = -U.a; U.wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * Math.sin(tsec*16 + U.a)*0.7; }); });
}

/* ---------- 루루: 오래 쉬다 돌아오면 선물을 들고 찾아오는 분홍 사슴 ---------- */
const WELCOME_RATE = 500, WELCOME_MAXH = 24, WELCOME_ACC_H = 5;
const SPECIAL_ACC = SHOP.filter(it => it.special).map(it => it.id);
let lulu = null;
function welcomeCheck(prev){
  if (!G.me || !prev) return;
  const now = Date.now(), hrs = Math.floor((now - prev) / 3600000);
  if (hrs < 1) return;
  const old = G.me.welcome, h = Math.min(WELCOME_MAXH, hrs + (old ? old.h : 0));
  let acc = old && old.acc || null;
  if (h >= WELCOME_ACC_H && !acc){ const left = SPECIAL_ACC.filter(id => !G.me.owned[id]); acc = left.length ? left[Math.floor(Math.random()*left.length)] : 'bonus'; }
  G.me.welcome = { h, n:h*WELCOME_RATE, acc, at:now };
  saveMe(true);
  setTimeout(() => toast('🎁 분홍 사슴 루루가 선물을 들고 찾아왔어요!', 3200), 900);
}
const _start11 = start;
start = function(s){
  const was = G.started, p = Store.data.players[pid(s)], prev = p && p.at;
  const r = _start11.apply(this, arguments);
  if (!was && G.started){ setTimeout(() => welcomeCheck(prev), 600); if (HW_ON) setTimeout(halloweenHello, 2600); }
  return r;
};
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (!G.started || !G.me) return;
  if (document.hidden){ hiddenAt = Date.now(); if (!NETON()){ try{ saveMe(true); }catch(e){} } }
  else if (hiddenAt){ const prev = hiddenAt; hiddenAt = 0; welcomeCheck(prev); }
});
// while you're playing, keep the "last seen" time fresh
setInterval(() => { if (G.started && G.me && !document.hidden) saveMe(); }, 120000);
function halloweenHello(){
  if (LS.get('dv.hwHello', '') === today()) return; LS.set('dv.hwHello', today());
  pop('🎃 할로윈 이벤트!', '11월 3일까지 마을 곳곳에 <b>호박등 6개</b>가 숨어 있어요.<br>찾아서 말 걸면 사탕(도토리)을 줘요. 하루에 한 번씩!<br><small>쇼핑몰에 할로윈 옷도 들어왔어요</small>');
}
function giftBoxMesh(){
  const g = new THREE.Group();
  M(new THREE.BoxGeometry(0.24, 0.2, 0.2), '#ff8fb3', 0, 0, 0, g);
  M(new THREE.BoxGeometry(0.26, 0.05, 0.22), '#ff8fb3', 0, 0.1, 0, g);
  M(new THREE.BoxGeometry(0.05, 0.25, 0.21), '#fff4c2', 0, 0.01, 0, g); M(new THREE.BoxGeometry(0.25, 0.05, 0.21), '#fff4c2', 0, 0.0, 0.0, g).rotation.y = Math.PI/2;
  [-1, 1].forEach(s => { const b = M(new THREE.TorusGeometry(0.045, 0.016, 6, 12), '#fff4c2', 0.045*s, 0.15, 0, g); b.rotation.set(0, 0, 0.6*s); });
  return g;
}
function makeLulu(){
  const g = new THREE.Group(), m = Char3D.deer(THREE, { scale:0.9 }); g.add(m);
  const box = giftBoxMesh(); box.position.set(0, 0.42, 0.3); box.visible = false; g.add(box);
  g.traverse(o => { o.userData.lulu = true; });
  const [i, j] = nearestFree(-3, -5), home = { x:wx(i), z:wz(j) };
  g.position.set(home.x, 0, home.z); scene.add(g);
  lulu = { g, m, box, x:home.x, z:home.z, home, mode:'home', hop:0, lbl:makeLabel('루루 · 선물 사슴'), bub:null, bubUntil:0, said:false };
}
function luluSay(text, ms){
  if (!lulu.bub){ lulu.bub = document.createElement('div'); lulu.bub.className = 'say chat'; $('#labels').appendChild(lulu.bub); }
  lulu.bub.textContent = text; lulu.bub.hidden = false; lulu.bubUntil = performance.now() + (ms || 3500);
}
function luluTick(dt, tsec){
  if (!lulu) return; const L = lulu, me = chars[G.slot];
  const show = G.started && !G.inside && !G.roof && !!me && !G.focus;
  L.g.visible = G.started && !G.inside && !G.roof;
  if (!show){ L.lbl.hidden = true; if (L.bub) L.bub.hidden = true; return; }
  const pending = !!(G.me && G.me.welcome);
  if (pending && L.mode === 'home' && G.me.made && !G.panel){
    for (let k = 0; k < 8; k++){ const a = (G.yaw || 0) + Math.PI*0.75 + k*Math.PI/4, px = me.x + Math.sin(a)*3.2, pz = me.z + Math.cos(a)*3.2, ti = Math.round(px) + C, tj = Math.round(pz) + C;
      if (inb(ti, tj) && !blocked(ti, tj)){ L.x = px; L.z = pz; break; } }
    L.mode = 'visit'; L.said = false; popWord(L.x, 1.5, L.z, '뿅!', 'big'); playSfx('jump');
  }
  let tx = null, tz = null, sp = 2.4, stop = 0;
  if (L.mode === 'visit'){
    if (!pending){ L.mode = 'leave'; }
    else { const d = Math.hypot(me.x - L.x, me.z - L.z); if (d > 14){ L.x = me.x - 2; L.z = me.z - 2; }
      tx = me.x; tz = me.z; stop = 1.35; sp = d > 6 ? 5 : 2.6;
      if (d < 1.5 && !L.said){ L.said = true; luluSay('오랜만이에요! 보고 싶었어요. 선물 가져왔어요!', 4200); } }
  }
  if (L.mode === 'leave'){ tx = L.home.x; tz = L.home.z; sp = 2.2; if (Math.hypot(tx - L.x, tz - L.z) < 0.05) L.mode = 'home'; }
  let walking = false;
  if (tx !== null){ const dx = tx - L.x, dz = tz - L.z, dist = Math.hypot(dx, dz);
    if (dist > stop + 0.03){ const st = Math.min(dist - stop, sp*dt); L.x += dx/dist*st; L.z += dz/dist*st; L.face = Math.atan2(dx, dz); walking = true; L.hop += dt*11; } }
  if (!walking && Math.hypot(me.x - L.x, me.z - L.z) < 5) L.face = Math.atan2(me.x - L.x, me.z - L.z);
  if (L.face !== undefined){ let dr = L.face - L.m.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); L.m.rotation.y += dr*Math.min(1, dt*8); }
  L.box.rotation.y = L.m.rotation.y; L.box.position.set(Math.sin(L.m.rotation.y)*0.3, 0.42, Math.cos(L.m.rotation.y)*0.3);
  const U = L.m.userData;
  L.g.position.set(L.x, walking ? Math.abs(Math.sin(L.hop))*0.12 : Math.max(0, Math.sin(tsec*2.2))*0.015, L.z);
  U.ears.forEach((e, i) => { e.rotation.x = Math.sin(tsec*3 + i)*0.1; });
  const sw = walking ? Math.sin(L.hop)*0.6 : 0; U.legs[0].rotation.x = sw; U.legs[1].rotation.x = -sw;
  U.arms.forEach((a, i) => { a.rotation.x = pending ? -1.1 : (i ? sw : -sw)*0.7; });
  L.box.visible = pending;
  L.lbl.hidden = false; const lt = pending ? '루루 🎁 선물 받기' : '루루 · 선물 사슴'; if (L.lbl.textContent !== lt) L.lbl.textContent = lt;
  projEl(L.lbl, L.x, 1.75, L.z);
  if (L.bub && !L.bub.hidden){ if (performance.now() > L.bubUntil) L.bub.hidden = true; else projEl(L.bub, L.x, 2.15, L.z); }
}
function openLulu(){
  if (G.me.welcome) return claimWelcome();
  G.panel = 'lulu';
  const got = SPECIAL_ACC.filter(id => G.me.owned[id]).length;
  const row = (a, b) => '<div class="k"><span>'+a+'</span><b>'+b+'</b></div>';
  openPanel('분홍 사슴 루루', '<p class="note" style="font-size:15px">안녕하세요, 루루예요! 마을을 오래 비웠다가 돌아오면 제가 선물을 들고 찾아갈게요.</p>'+
    '<div class="card">'+row('1시간 쉬고 오면', '도토리 500개')+row('2시간', '도토리 1000개')+row('3시간', '도토리 1500개')+row('1시간마다', '+500개 (24시간까지)')+row('5시간 이상', '특별한 장신구도 함께!')+'</div>'+
    '<p class="note">루루의 특별한 장신구 '+got+'/'+SPECIAL_ACC.length+'</p><div class="grid">'+
    SPECIAL_ACC.map(id => { const it = ITEM[id], own = G.me.owned[id]; return '<div class="cell'+(own ? '' : ' no')+'">'+(own ? swatch(it) : '<div class="sw" style="background:#e6ddf2"></div>')+(own ? esc(it.name) : '???')+'<b>'+(own ? '모았어요' : '아직')+'</b></div>'; }).join('')+'</div>', { half:true });
  luluSay(got ? '장신구 잘 어울려요!' : '푹 쉬고 와요. 선물 준비해 둘게요!');
}
function claimWelcome(){
  const W = G.me.welcome; if (!W) return; delete G.me.welcome;
  G.me.acorns += W.n; let accTxt = '';
  if (W.acc === 'bonus'){ G.me.acorns += 1000; accTxt = '<br>특별 장신구를 모두 모아서 보너스 도토리 1000개도!'; }
  else if (W.acc && ITEM[W.acc]){ G.me.owned[W.acc] = 1; accTxt = '<br><b>특별한 장신구 「'+esc(ITEM[W.acc].name)+'」</b>도 함께!<br><small>옷장 → 장신구에서 해 볼 수 있어요</small>'; }
  saveMe(true); updateHud(); playSfx('jump'); doAnim('cheer');
  pop('🎁 루루의 선물', W.h+'시간 만에 돌아왔네요! 보고 싶었어요.<br>도토리 '+W.n+'개'+accTxt);
  if (lulu){ lulu.mode = 'leave'; luluSay('또 만나요! 💕', 2600); popWord(lulu.x, 1.6, lulu.z, '💕', 'big'); }
}
function tapLulu(){
  const me = chars[G.slot]; if (Math.hypot(me.x - lulu.x, me.z - lulu.z) < 1.9) return openLulu();
  walkTo(Math.round(lulu.x) + C, Math.round(lulu.z) + C, openLulu);
}

/* ---------- 감정표현 ---------- */
const EMOTES = [['hi','👋','안녕','wave'],['heart','💗','좋아','cheer'],['clap','👏','박수','clap'],['laugh','😆','하하','laugh'],['wow','❗','깜짝','wow'],['cry','😢','엉엉','cry'],['angry','💢','흥!','angry'],['dance','🎵','춤','dance'],['bow','🙇','꾸벅','bow'],['sleepy','💤','졸려','sleepy']];
Object.assign(ANIM_DUR, { clap:1.6, laugh:1.4, cry:1.8, angry:1.4, dance:2.4, bow:1.1, wow:0.8, sleepy:1.8 });
const EMO_POSE = new Set(['clap','laugh','cry','angry','dance','bow','wow','sleepy']);
let emoSeq = 0;
function showEmo(c, emoji){
  if (!c.emoEl){ c.emoEl = document.createElement('div'); c.emoEl.className = 'say emo'; $('#labels').appendChild(c.emoEl); }
  c.emoEl.textContent = emoji; c.emoEl.hidden = false; c.emoUntil = performance.now() + 2400;
  c.emoEl.classList.remove('popin'); void c.emoEl.offsetWidth; c.emoEl.classList.add('popin');
}
function doEmote(id){
  const E = EMOTES.find(e => e[0] === id), me = chars[G.slot]; if (!E || !G.started || !me) return;
  if (G.anim && EMO_POSE.has(G.anim.type)) emoReset(me);
  G.emo = { id, n:++emoSeq }; clearTimeout(doEmote.t); doEmote.t = setTimeout(() => { G.emo = null; }, 2600);
  showEmo(me, E[1]); doAnim(E[3]); if (id === 'wow' && !me.jump) me.jump = { t:0 };
}
function emoPose(c, type, t, dur){
  const U = c.model && c.model.userData; if (!U || !U.arms) return; const m = c.model, k = Math.min(1, t/dur), s = Math.sin(k*Math.PI);
  switch (type){
    case 'clap': { const a = (Math.sin(t*16) + 1)/2; U.arms[0].rotation.x = U.arms[1].rotation.x = -1.35; U.arms[0].rotation.z = 0.15 + 0.45*a; U.arms[1].rotation.z = -(0.15 + 0.45*a); break; }
    case 'laugh': m.position.y = Math.abs(Math.sin(t*15))*0.06; U.head.rotation.x = -0.25*s; U.arms[0].rotation.x = U.arms[1].rotation.x = -0.6; U.arms[0].rotation.z = 0.5; U.arms[1].rotation.z = -0.5; break;
    case 'cry': U.arms[0].rotation.x = U.arms[1].rotation.x = -2.5; U.arms[0].rotation.z = 0.55; U.arms[1].rotation.z = -0.55; U.head.rotation.x = 0.3*s; U.head.rotation.z = Math.sin(t*22)*0.06; break;
    case 'angry': U.arms[0].rotation.x = U.arms[1].rotation.x = 0.25; U.arms[0].rotation.z = -0.55; U.arms[1].rotation.z = 0.55; U.legs[0].rotation.x = -0.7*Math.max(0, Math.sin(t*11)); U.head.rotation.z = Math.sin(t*18)*0.08; break;
    case 'dance': m.rotation.y = k*Math.PI*4; U.arms[0].rotation.x = -2.5 + Math.sin(t*10)*0.5; U.arms[1].rotation.x = -2.5 - Math.sin(t*10)*0.5; m.position.y = Math.abs(Math.sin(t*10))*0.05; break;
    case 'bow': m.rotation.x = 0.55*s; U.head.rotation.x = 0.15*s; U.arms[0].rotation.x = U.arms[1].rotation.x = 0.2*s; break;
    case 'wow': U.arms[0].rotation.x = U.arms[1].rotation.x = -2.6*s; U.arms[0].rotation.z = -0.5*s; U.arms[1].rotation.z = 0.5*s; break;
    case 'sleepy': U.head.rotation.z = 0.25*s; U.head.rotation.x = 0.15*s; U.arms[1].rotation.x = -2.3*s; U.arms[1].rotation.z = -0.5*s; break;
  }
}
function emoReset(c){
  const U = c.model && c.model.userData; if (!U || !U.arms) return;
  c.model.rotation.x = 0; c.model.rotation.y = 0; c.model.position.y = 0; U.head.rotation.x = U.head.rotation.z = 0; U.arms[0].rotation.z = -0.28; U.arms[1].rotation.z = 0.28; U.legs[0].rotation.x = 0;
}
const _actionPose11 = actionPose;
actionPose = function(c, dt, tsec){
  const A = G.anim, type = A && A.type; _actionPose11(c, dt, tsec);
  if (!type || !EMO_POSE.has(type) || c.slot !== G.slot) return;
  if (G.anim === A) emoPose(c, type, A.t, A.dur); else emoReset(c);
};
function remoteEmoTick(dt){
  if (!NETON() || !G.started) return;
  SLOTS.forEach((_, s) => {
    if (s === G.slot) return; const c = chars[s]; if (!c || !c.g.visible){ if (c && c.remA){ c.remA = null; emoReset(c); } return; }
    const L = liveMap[pid(s)], em = (L && L.em) || 0;
    if (em && em !== c.lastEm){ const E = EMOTES.find(e => e[0] === String(em).split(':')[0]); if (E){ showEmo(c, E[1]); if (EMO_POSE.has(E[3])) c.remA = { type:E[3], t:0, dur:ANIM_DUR[E[3]] }; } }
    c.lastEm = em;
    if (c.remA){ c.remA.t += dt; if (c.remA.t >= c.remA.dur){ c.remA = null; emoReset(c); } else emoPose(c, c.remA.type, c.remA.t, c.remA.dur); }
  });
}
function emoBubbleTick(){
  const now = performance.now();
  Object.values(chars).forEach(c => { const b = c.emoEl; if (!b || b.hidden) return;
    if (now > c.emoUntil || !c.g.visible || G.focus){ b.hidden = true; return; }
    projEl(b, c.g.position.x, c.g.position.y + (c.bub && !c.bub.hidden ? 2.85 : 2.15), c.g.position.z); });
}
function openEmotes(){
  if (!G.started) return; G.panel = 'emote';
  openPanel('감정표현', '<div class="emogrid">'+EMOTES.map(e => '<button data-emo="'+e[0]+'"><span>'+e[1]+'</span>'+e[2]+'</button>').join('')+'</div><p class="note">'+(NETON() ? '마을 사람들 화면에도 똑같이 보여요.' : '')+'</p>', { half:true });
  $('#pbody').querySelectorAll('[data-emo]').forEach(b => b.addEventListener('click', () => { closePanel(); doEmote(b.dataset.emo); }));
}
// sparkle accessory: stars circle around the head
function sparkleTick(dt, tsec){
  Object.values(chars).forEach(c => { const sp = c.model && c.model.userData.spin; if (!sp || !c.g.visible) return; sp.rotation.y += dt*1.3; sp.children.forEach(st => { st.rotation.y = -sp.rotation.y; st.scale.setScalar(0.8 + Math.abs(Math.sin(tsec*3 + st.userData.tw))*0.5); }); });
}

/* ---------- 이웃에게 선물하기 (웹 버전) ---------- */
function villageMembers(){ return SLOTS.map((_, s) => s).filter(s => s !== G.slot && Store.data.players[pid(s)]); }
function openGiftMenu(){
  if (!NETON() || !G.started) return; G.panel = 'giftmenu'; const list = villageMembers();
  openPanel('선물 보내기', list.length ? '<p class="note">누구에게 보낼까요? 지금 접속해 있지 않아도 다음에 들어오면 받아요.</p><div class="grid">'+list.map(s => '<div class="cell" data-gs="'+s+'"><div class="sw" style="background:'+ROOFS[s]+'"></div>'+esc(playerName(s))+'<b>'+(liveMap[pid(s)] ? '지금 접속 중' : '마지막 '+ago(Store.data.players[pid(s)].at))+'</b></div>').join('')+'</div>' : '<p class="note">아직 마을에 다른 이웃이 없어요.</p>', { half:true });
  $('#pbody').querySelectorAll('[data-gs]').forEach(el => el.addEventListener('click', () => { giftSel = null; openGiftTo(Number(el.dataset.gs)); }));
}
let giftTab = 'acorn', giftSel = null, giftBusy = false;
const giftable = id => { const it = ITEM[id]; return it && (it.price > 0 || it.special || it.hw || it.basePrice); };
function openGiftTo(s){
  G.panel = 'giftto'; const nm = playerName(s), other = Store.data.players[pid(s)] || {}, oo = other.owned || {}, me = G.me;
  const TABS = [['acorn','도토리'],['item','옷·장신구'],['furn','가구'],['seed','씨앗']];
  let cells = '';
  if (giftTab === 'acorn') cells = [10, 50, 100, 500, 1000].map(n => '<div class="cell'+(me.acorns < n ? ' no' : '')+(giftSel === 'a:'+n ? ' sel' : '')+'" data-g="a:'+n+'"><div class="sw" style="background:#d9a066"></div>도토리 '+n+'개<b>'+(me.acorns < n ? '모자라요' : '보내기')+'</b></div>').join('');
  if (giftTab === 'item') cells = Object.keys(me.owned || {}).filter(giftable).map(id => { const it = ITEM[id], has = !!oo[id]; return '<div class="cell'+(has ? ' no' : '')+(giftSel === 'i:'+id ? ' sel' : '')+'" data-g="i:'+id+'">'+swatch(it)+esc(it.name)+'<b>'+(has ? '이미 가지고 있어요' : isWorn(id) ? '입는 중 · 보내기' : '보내기')+'</b></div>'; }).join('');
  if (giftTab === 'furn') cells = Object.entries(me.furn || {}).filter(([id, n]) => n > 0 && FURN[id] && !FURN[id].fixture).map(([id, n]) => '<div class="cell'+(giftSel === 'f:'+id ? ' sel' : '')+'" data-g="f:'+id+'"><div class="sw" style="background:#f2dcc2"></div>'+esc(FURN[id].name)+'<b>'+n+'개 있어요</b></div>').join('');
  if (giftTab === 'seed') cells = Object.entries(me.seeds || {}).filter(([id, n]) => n > 0 && CROPS[id]).map(([id, n]) => '<div class="cell'+(giftSel === 's:'+id ? ' sel' : '')+'" data-g="s:'+id+'"><div class="sw" style="background:'+CROPS[id].c+'"></div>'+esc(CROPS[id].name)+' 씨앗<b>'+n+'개 있어요</b></div>').join('');
  if (!cells) cells = '<p class="note">보낼 수 있는 게 없어요.</p>';
  let bar = '<p class="note">보낼 것을 골라 주세요. 보내면 내 것에서 빠져요.</p>';
  if (giftSel){ const [k, v] = [giftSel[0], giftSel.slice(2)];
    const what = k === 'a' ? '도토리 '+v+'개' : k === 'i' ? ITEM[v].name : k === 'f' ? FURN[v].name+' 1개' : CROPS[v].name+' 씨앗 '+Math.min(5, (me.seeds||{})[v]||0)+'개';
    bar = '<div class="buybar"><span>'+esc(nm)+'에게<br><b>'+esc(what)+'</b></span><button class="go" id="giftGo">보내기</button></div><div class="chatin"><input id="giftMsg" maxlength="30" placeholder="한마디 (안 써도 돼요)" autocomplete="off"></div>'; }
  openPanel(nm+'에게 선물', '<div class="tabs" data-gtabs>'+TABS.map(([k, l]) => '<button data-gt="'+k+'" class="'+(k === giftTab ? 'on' : '')+'">'+l+'</button>').join('')+'</div>'+bar+'<div class="grid">'+cells+'</div>', { half:true });
  $('#pbody').querySelector('[data-gtabs]').addEventListener('click', e => { const b = e.target.closest('[data-gt]'); if (!b) return; giftTab = b.dataset.gt; giftSel = null; openGiftTo(s); });
  $('#pbody').querySelectorAll('[data-g]').forEach(el => el.addEventListener('click', () => { if (el.classList.contains('no')) return; giftSel = el.dataset.g; openGiftTo(s); }));
  const mi = $('#giftMsg'); if (mi) mi.addEventListener('keydown', e => e.stopPropagation());
  const gb = $('#giftGo'); if (gb) gb.addEventListener('click', () => sendGift(s, giftSel, (mi && mi.value.trim()) || ''));
}
async function sendGift(s, sel, msg){
  if (giftBusy || !sel) return; const me = G.me, k = sel[0], v = sel.slice(2);
  let g = null;
  if (k === 'a'){ const n = Number(v); if (me.acorns < n){ toast('도토리가 모자라요'); return; } g = { kind:'acorn', n }; }
  if (k === 'i'){ if (!me.owned[v]) return; g = { kind:'item', id:v, n:1 }; }
  if (k === 'f'){ if (!((me.furn||{})[v] > 0)) return; g = { kind:'furn', id:v, n:1 }; }
  if (k === 's'){ const have = (me.seeds||{})[v] || 0; if (!have) return; g = { kind:'seed', id:v, n:Math.min(5, have) }; }
  if (!g) return;
  Object.assign(g, { msg:msg.slice(0, 30), from:me.name, fp:pid(G.slot), at:Date.now() });
  giftBusy = true; const gbtn = $('#giftGo'); if (gbtn) gbtn.disabled = true;
  const ok = await window.DVNet.push('gifts/' + pid(s), JSON.stringify(g));
  giftBusy = false;
  if (!ok){ toast('선물을 보내지 못했어요. 관리자에게 서버 규칙 업데이트를 부탁해 주세요', 3200); openGiftTo(s); return; }
  if (k === 'a') me.acorns -= g.n;
  if (k === 'i'){ const it = ITEM[v], w = me.wear, sl = slotOf(it.cat);
    if (it.cat === 'ride'){ if (me.ride === v) me.ride = null; }
    else if (w[sl] === v){ delete w[sl]; if (it.cat === 'set' || it.cat === 'top') w.top = w.top || 'tee_w'; if (it.cat === 'set' || it.cat === 'bottom') w.bottom = w.bottom || 'jeans'; if (it.cat === 'shoes') w.shoes = 'sneaker_w'; }
    delete me.owned[v]; applyLook(chars[G.slot], me); }
  if (k === 'f') me.furn[v]--;
  if (k === 's') me.seeds[v] -= g.n;
  saveMe(true); updateHud(); doAnim('wave'); giftSel = null;
  closePanel(); toast('🎁 '+playerName(s)+'에게 선물을 보냈어요!', 2400);
}
function openPlayerCard(s){
  G.panel = 'pcard'; const p = Store.data.players[pid(s)] || {}, online = NETON() ? !!liveMap[pid(s)] : true;
  openPanel(playerName(s), '<div class="card"><div class="k"><span>'+(online ? '지금 마을에 있어요' : '마지막 접속')+'</span><b>'+(online ? '🟢' : ago(p.at))+'</b></div></div>'+
    '<button class="go" id="pcHi">👋 인사하기</button>'+(NETON() ? '<button class="go" id="pcGift" style="margin-top:8px">🎁 선물하기</button>' : ''), { half:true });
  $('#pcHi').addEventListener('click', () => { closePanel(); const me = chars[G.slot], c = chars[s]; if (me && c){ me.face = Math.atan2(c.x - me.x, c.z - me.z); } doEmote('hi'); });
  const gb = $('#pcGift'); if (gb) gb.addEventListener('click', () => { giftSel = null; openGiftTo(s); });
}
const _onTap11 = onTap;
onTap = function(x, y){
  if (!dlg && G.started && !G.inside && !G.panel && !G.build && !G.ride && !G.mini && !G.down && !G.rescue && !G.fishing){
    ndc.set((x/window.innerWidth)*2-1, -(y/window.innerHeight)*2+1); ray.setFromCamera(ndc, cam);
    if (lulu && lulu.g.visible && ray.intersectObject(lulu.g, true).length){ tapLulu(); return; }
    const h0 = ray.intersectObjects(pickables, false)[0];
    if (h0 && h0.object.userData.char !== undefined && h0.object.userData.char !== G.slot){ openPlayerCard(h0.object.userData.char); return; }
  }
  return _onTap11(x, y);
};

/* ---------- action button / menu glue ---------- */
const _frontTarget11 = frontTarget;
frontTarget = function(){
  if (lulu && lulu.g.visible && !G.inside && !G.roof){ const me = chars[G.slot]; if (me && Math.hypot(me.x - lulu.x, me.z - lulu.z) < (G.me.welcome ? 1.7 : 1.25)) return { type:'lulu' }; }
  return _frontTarget11();
};
const _labelExtra11 = labelExtra;
labelExtra = function(t){ if (t.type === 'lulu') return G.me.welcome ? '선물 받기' : '루루와 말하기'; if (t.type === 'jack') return '사탕 받기'; return _labelExtra11(t); };
const _actExtra11 = actExtra;
actExtra = function(t){ if (t.type === 'lulu') return openLulu(); if (t.type === 'jack') return jackTap(t.s ? t.s.n : t.b.n); return _actExtra11(t); };
menuPop.addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (!b) return; if (b.dataset.m === 'emote') openEmotes(); if (b.dataset.m === 'giftsend') openGiftMenu(); });
const _featTick11 = featTick;
featTick = function(dt, tsec){ _featTick11(dt, tsec); luluTick(dt, tsec); remoteEmoTick(dt); emoBubbleTick(); sparkleTick(dt, tsec); halloweenTick(dt, tsec); };
makeLulu();
placeJacks();
