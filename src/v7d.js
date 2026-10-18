/* ---------- speech bubbles, chit-chat, moods ---------- */
function say(np, text, ms){
  if (!np) return; if (!np.bub){ np.bub = document.createElement('div'); np.bub.className = 'say'; $('#labels').appendChild(np.bub); }
  np.bub.textContent = text; np.bub.hidden = false; np.bubUntil = performance.now() + (ms || Math.max(2400, text.length*120));
}
function bubbleTick(){
  const now = performance.now(), W = window.innerWidth, H = window.innerHeight;
  Object.values(npcs).forEach(np => { const b = np.bub; if (!b || b.hidden) return;
    if (now > np.bubUntil || !np.g.visible || G.focus || dlg && dlg.np === np){ b.hidden = true; return; }
    const p = np.g.position; _v.set(p.x, p.y + (np.n.bunny ? 1.7 : 2.05), p.z).project(cam); if (_v.z > 1 || Math.abs(_v.x) > 1.1 || Math.abs(_v.y) > 1.1){ b.style.left = '-999px'; return; }
    b.style.left = ((_v.x+1)/2*W)+'px'; b.style.top = ((1-_v.y)/2*H)+'px'; });
}
const CHAT_PAIRS = [
  ['오늘 날씨 진짜 좋다!','그러게, 빨래 널기 딱 좋은 날이야.'],
  ['{b}, 점심 뭐 먹었어?','나? 보보네 카페 샌드위치! 너는?','나는 사과 하나… 배고파.'],
  ['요즘 {name} 엄청 열심히 일하더라.','맞아, 아침마다 물류센터 가는 거 봤어!'],
  ['기차 소리 들으면 마음이 편해져.','나는 깜짝깜짝 놀라던데…'],
  ['꽃섬 튤립 봤어?','봤지! 분홍색이 제일 예쁘더라.','다음엔 같이 가자!'],
  ['어제 바다에서 돌고래 봤대!','진짜? 나도 배 타 보고 싶다.'],
  ['{b}, 그 옷 새로 샀어?','응! 몽실이가 골라 줬어. 어때?','완전 잘 어울려!'],
  ['벌집 조심해. 나 어제 쏘일 뻔했어.','으악, 듬직이가 업고 갈 뻔했네!'],
  ['요즘 도토리 모으는 중이야.','뭐 사려고?','비밀~ 헤헤.'],
  ['{name} 집 앞 지나가 봤어?','응, 창문에 불이 반짝반짝하더라.'],
  ['오늘 저녁에 노을 보러 갈래?','좋아! 야자섬 바닷가 어때?'],
  ['배고프다~','나도… 귤 하나 나눠 먹을래?','고마워! 넌 최고야.'],
  ['토니한테 길 물어봤는데 진짜 다 알더라.','토니는 걸어다니는 지도야.'],
  ['끼니 봤어? 또 어디 놀러 갔나 봐.','아까 꽃밭에서 나비 쫓고 있던데!'],
  ['나 요즘 그네 타는 게 취미야.','그네 타면 하늘 날 것 같지?'],
  ['은행 이자 들어왔다!','오, 얼마?','그건… 비밀이야.'],
  ['비 오면 뭐 해?','창가에 앉아서 빗소리 들어.','낭만적이다~'],
  ['농장섬 호박 엄청 크더라.','할로윈에 랜턴 만들면 좋겠다!'],
  ['{b}, 내 꼬리 어때 보여?','오늘따라 윤기 나는데?','헤헤, 빗질했거든!'],
  ['역에 새 이웃이 온대!','진짜? 누구일까 궁금하다.'],
  ['경찰서 앞에서 치즈 순경 졸고 있더라.','쉿! 비밀로 해 주자.'],
  ['요즘 잠이 너무 와.','봄이라 그런가 봐… 하암.'],
  ['{name}가 준 선물 아직도 간직하고 있어.','나도! 우리 마을 최고의 이웃이야.'],
  ['어제 꿈에 거대한 도토리가 나왔어.','그거 부자 되는 꿈 아니야?'],
  ['같이 산책할래?','좋아, 다리 건너 꽃섬까지!'],
];
const MOODS = {
  morning:['상쾌한 아침이다~','오늘은 뭘 할까?','아침 공기 좋다!','하암… 아직 졸려.'],
  day:['기분 좋은 오후야.','햇살이 따뜻하다~','배고파졌다…','오늘 할 일 다 했나?','뭔가 재미있는 일 없을까?'],
  evening:['노을이 예쁘다.','오늘 하루도 수고했어, 나!','저녁은 뭐 먹지?','슬슬 집에 갈까…'],
  night:['별이 반짝반짝.','졸려… 하암.','밤바람 시원하다.'],
  rich:['통장 보니까 든든하다!','오늘은 나를 위한 선물을 살까?','도토리 부자가 된 기분~'],
  broke:['지갑이 텅 비었네…','아껴 써야지.','일 좀 더 해야겠다!'],
  rest:['벤치에 앉으니 좋다~','잠깐 쉬어 가자.','다리 아파… 휴.'],
  play:['야호! 신난다!','그네 최고!','하늘까지 날아갈 것 같아!'],
  work:['오늘도 열심히!','바쁘다 바빠~','일하는 거 즐거워!'],
  hurt:['아직 좀 욱신거려…','기차는 무서워…'],
};
let chatT = 4;
function chatTick(dt){
  chatT -= dt; if (chatT > 0) return; chatT = 3 + Math.random()*3;
  const me = chars[G.slot]; if (!me || G.inside) return;
  const near = Object.values(npcs).filter(np => np.g.visible && !np.override && !np.talking && !np.convo && np.path.length === 0 && Math.hypot(np.x-me.x, np.z-me.z) < 16);
  // a pair chats
  for (let a=0; a<near.length; a++) for (let b=a+1; b<near.length; b++){ const A = near[a], B = near[b];
    if (Math.hypot(A.x-B.x, A.z-B.z) > 2.6 || (A.chatAt && Date.now()-A.chatAt < 45000) || (B.chatAt && Date.now()-B.chatAt < 45000) || Math.random() < 0.4) continue;
    startConvo(A, B); return; }
  // or someone mutters to themselves
  const solo = near.filter(np => !np.muAt || Date.now()-np.muAt > 30000); if (!solo.length || Math.random() < 0.35) return;
  const np = solo[Math.floor(Math.random()*solo.length)]; np.muAt = Date.now(); say(np, moodLine(np));
}
function moodLine(np){
  const h = hourNow(), band = h < 11 ? 'morning' : h < 17 ? 'day' : h < 21 ? 'evening' : 'night', w = npcWealth(np.n.id);
  const pools = [MOODS[band]]; if (np.seat) pools.push(MOODS[np.seat.kind === 'swing' ? 'play' : 'rest'], MOODS[np.seat.kind === 'swing' ? 'play' : 'rest']);
  if (w > 5000) pools.push(MOODS.rich); if (w < 300) pools.push(MOODS.broke); if (np.n.work && npcAtWork(np.n)) pools.push(MOODS.work);
  let t = pickL(pickL(pools)); if (np.n.tic && Math.random() < 0.4) t += ' '+np.n.tic+'!'; return t;
}
function startConvo(A, B){
  const lines = pickL(CHAT_PAIRS).map(l => l.replace(/\{b\}/g, B.n.name).replace(/\{a\}/g, A.n.name).replace(/\{name\}/g, G.me.name));
  A.convo = B.convo = { lines, k:0, t:0, A, B }; A.chatAt = B.chatAt = Date.now(); A.path = []; B.path = [];
}
function convoTick(dt){
  const done = new Set();
  Object.values(npcs).forEach(np => { const C = np.convo; if (!C || done.has(C)) return; done.add(C);
    if (!C.A.g.visible || !C.B.g.visible || C.A.override || C.B.override || C.A.talking || C.B.talking){ C.A.convo = C.B.convo = null; return; }
    C.A.face = Math.atan2(C.B.x-C.A.x, C.B.z-C.A.z); C.B.face = Math.atan2(C.A.x-C.B.x, C.A.z-C.B.z); C.A.wait = C.B.wait = 3;
    C.t -= dt; if (C.t > 0) return;
    if (C.k >= C.lines.length){ C.A.convo = C.B.convo = null; return; }
    say(C.k % 2 ? C.B : C.A, C.lines[C.k], 2600); C.k++; C.t = 2.7; });
}

/* ---------- villagers rest on benches and play on swings ---------- */
const benchUse = {};
function npcActivity(np){ const h = Math.floor(hourNow()); const r = rng(hashStr(np.n.id + today() + h))(); return r < 0.35 ? 'wander' : r < 0.68 ? 'rest' : 'play'; }
const _npcGoal7 = npcGoal;
npcGoal = function(np){
  const n = np.n;
  if (!n.staff && !n.guide && !n.post && !(n.id === 'kini' && G.me.kini && G.me.kini.on) && !np.seatCool && n.id !== 'jobman'){
    const act = npcActivity(np);
    if (act === 'rest' || act === 'play'){
      let best = null, bd = 30;
      if (act === 'rest') statics.forEach(s => { if (s.kind !== 'bench' || benchUse[s.id]) return; const d = Math.hypot(wx(s.i)-np.x, wz(s.j)-np.z); if (d < bd){ bd = d; best = { kind:'bench', s }; } });
      else BUILD.forEach(b => { if (b.kind !== 'swingset') return; const occ = swingUse[b.id] = swingUse[b.id] || [null,null]; const k = occ[0] ? (occ[1] ? -1 : 1) : 0; if (k < 0) return; const d = Math.hypot(b.cx-np.x, b.cz-np.z); if (d < bd){ bd = d; best = { kind:'swing', b, k }; } });
      if (best){ np.actTarget = best; const [ti,tj] = best.kind === 'bench' ? nearestFree(wx(best.s.i) + Math.sin(best.s.face), wz(best.s.j) + Math.cos(best.s.face)) : nearestFree(best.b.cx + (best.k ? 0.7 : -0.7), best.b.cz + 1); return [ti,tj]; }
    }
  }
  np.actTarget = null; return _npcGoal7(np);
};
function seatTick(dt, tsec){
  Object.values(npcs).forEach(np => {
    if (np.seatCool){ np.seatCool -= dt; if (np.seatCool <= 0) np.seatCool = 0; }
    const T2 = np.actTarget;
    if (T2 && !np.seat && !np.override && np.path.length === 0 && np.g.visible){
      const tx = T2.kind === 'bench' ? wx(T2.s.i) : T2.b.cx + (T2.k ? 0.7 : -0.7), tz = T2.kind === 'bench' ? wz(T2.s.j) : T2.b.cz;
      if (Math.hypot(np.x - tx, np.z - tz) < 1.6){
        if (T2.kind === 'bench' && !benchUse[T2.s.id]){ benchUse[T2.s.id] = np.n.id; np.seat = { kind:'bench', s:T2.s, until:performance.now() + 25000 + Math.random()*35000 }; np.override = true; }
        else if (T2.kind === 'swing'){ const occ = swingUse[T2.b.id]; if (!occ[T2.k]){ occ[T2.k] = np.n.id; np.seat = { kind:'swing', b:T2.b, k:T2.k, until:performance.now() + 20000 + Math.random()*25000 }; np.override = true; } }
        np.actTarget = null;
      }
    }
    const S = np.seat; if (!S) return; const U = np.model.userData;
    const leave = performance.now() > S.until || npcAsleep(np.n) || isPatient(np.n.id) || np.down || (np.talking && false);
    if (leave){ np.seat = null; np.override = false; np.model.rotation.set(0,0,0); np.model.position.y = 0; np.seatCool = 40;
      if (S.kind === 'bench') delete benchUse[S.s.id]; else swingUse[S.b.id][S.k] = null;
      const [i,j] = S.kind === 'bench' ? nearestFree(wx(S.s.i) + Math.sin(S.s.face), wz(S.s.j) + Math.cos(S.s.face)) : nearestFree(S.b.cx + (S.k ? 0.7 : -0.7), S.b.cz + 1);
      np.i = i; np.j = j; np.x = wx(i); np.z = wz(j); np.path = []; np.wait = 2; return; }
    U.legs.forEach(l => l.rotation.x = -1.45);
    if (S.kind === 'bench'){ np.g.position.set(wx(S.s.i), np.n.bunny ? 0.3 : 0.36, wz(S.s.j)); np.g.rotation.y = S.s.face; np.model.position.y = 0; U.arms.forEach(a => a.rotation.x = -0.3); np.x = wx(S.s.i); np.z = wz(S.s.j); }
    else { const p = swingSeatWorld(S.b, S.k); if (p){ np.g.position.set(p.x, p.y - (np.n.bunny ? 0.32 : 0.42), p.z); np.g.rotation.y = 0; np.model.rotation.x = p.a*0.8; U.arms.forEach(a => a.rotation.x = -2.6 + p.a*0.4); np.model.position.y = 0; np.x = p.x; np.z = p.z; } }
    np.g.visible = !G.inside;
  });
}
// the player can't take a seat someone is using
const _sitBench7 = sitBench;
sitBench = function(s){ if (benchUse[s.id]){ const np = npcs[benchUse[s.id]]; toast((np ? np.n.name : '누군가')+'이(가) 앉아 있어요'); if (np) say(np, pickL(['여기 제 자리예요~','같이 앉을래요? …자리가 좁네요!','잠깐 쉬는 중이에요!'])); return; } benchUse[s.id] = 'me'; _sitBench7(s); };
const _standUp7 = standUp;
standUp = function(){ if (G.sit && G.sit.kind === 'bench') delete benchUse[G.sit.s.id]; _standUp7(); };

/* ---------- affection hearts ---------- */
const heartsOf = id => { const f = relOf(id).f; const n = Math.min(10, Math.floor(f/3)); return '♥'.repeat(Math.ceil(n/2)) + '♡'.repeat(5 - Math.ceil(n/2)); };
const heartLevel = id => Math.min(10, Math.floor(relOf(id).f/3));
const _openDialog5 = openDialog;
openDialog = function(np, lines, sleeping){ _openDialog5(np, lines, sleeping); const w = talkEl().querySelector('.who'); w.innerHTML = esc(np.n.name + ' · ' + np.n.kind + ' ' + np.n.job) + ' <span class="hearts" title="호감도">' + heartsOf(np.n.id) + '</span>'; };
function villagerBook(){
  const list = NPCS.filter(n => !n.notYet && G.me.npc && G.me.npc[n.id] && G.me.npc[n.id].met);
  return '<h3>주민 호감도 · '+list.length+'명</h3>'+(list.length ? '<div class="grid">'+list.map(n => '<div class="cell">'+esc(n.name)+'<b class="hearts">'+heartsOf(n.id)+'</b><b>'+esc(n.job)+'</b></div>').join('')+'</div><p class="note">말 걸기, 선물, 부탁 들어주기, 연주 들려주기로 호감도가 올라요. 탈것으로 치면 떨어져요.</p>' : '<p class="note">아직 인사한 주민이 없어요.</p>');
}
const _openBag5 = openBag;
openBag = function(){ _openBag5(); const pb = $('#pbody'); const d = document.createElement('div'); d.style.display = 'contents'; d.innerHTML = villagerBook(); pb.insertBefore(d, pb.firstChild.nextSibling || null); };

/* ---------- villagers' savings (shown at the bank) ---------- */
const WEALTH = { momo:[1800,120,90], coco:[6200,160,70], dan:[400,60,70], toni:[1500,80,60], kini:[120,15,12], mong:[2600,130,110], bobo:[3400,150,100], pang:[2200,140,95], bori:[1600,90,70], kongi:[900,90,85], dubu:[1100,90,75], dum:[2000,110,80], mung:[1200,110,90], doc:[8800,220,120], cap:[3000,100,80], cop1:[2500,120,90], cop2:[700,120,115], jobman:[2100,110,85] };
function npcWealth(id){
  const W = WEALTH[id] || [800, 80, 70]; const start = Date.UTC(2026, 9, 1), days = Math.max(0, Math.floor((Date.now() - start)/DAY)); let m = W[0];
  for (let d=0; d<=days; d++){ const r = rng(hashStr(id+'#'+d)); const frac = d === days ? hourNow()/24 : 1; m += Math.round((W[1]*(0.7 + r()*0.6) - W[2]*(0.4 + r()*1.2))*frac); if (m < 20) m = 20 + Math.round(r()*40); }
  return m;
}
const _openBank5 = openBank;
openBank = function(){
  _openBank5();
  const rows = NPCS.filter(n => !n.notYet).map(n => ({ n, m:npcWealth(n.id) })).sort((a,b) => b.m - a.m);
  const d = document.createElement('div'); d.style.display = 'contents';
  d.innerHTML = '<h3>주민 통장 현황 (코코의 장부)</h3><div class="card">'+rows.map((r,k) => '<div class="k"><span>'+(k+1)+'. '+esc(r.n.name)+' <small style="color:var(--ink-soft)">'+esc(r.n.job)+'</small></span><b>도토리 '+r.m.toLocaleString()+'</b></div>').join('')+'</div><p class="note">일하는 주민은 매일 벌고, 쇼핑하고 놀면서 쓰기도 해요. 매일 조금씩 바뀌어요.</p>';
  $('#pbody').appendChild(d);
};
