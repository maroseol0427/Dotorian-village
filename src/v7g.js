/* ---------- minimap (top right, turns with the camera; tap for the big map) ---------- */
let mmBase = null, mmT = 0;
function buildMmBase(){
  const s = 3, cv = document.createElement('canvas'); cv.width = N*s; cv.height = N*s; const g = cv.getContext('2d');
  const col = { 0:'#a8dcf0', 1:'#fbeccc', 2:'#c6ecb0', 3:'#f6e4c8', 4:'#d8c4b0', 5:'#ece6f4', 6:'#e8cfb2', 7:'#ffc6dc', 8:'#e2c09a' };
  for (let j=0;j<N;j++) for (let i=0;i<N;i++){ g.fillStyle = col[tile[idx(i,j)]]; g.fillRect(i*s, j*s, s, s); }
  statics.forEach((st,k) => { const [i,j] = k.split('_').map(Number); if (st.kind === 'tree'){ g.fillStyle = '#8fcf8a'; g.fillRect(i*s+0.5, j*s+0.5, s-1, s-1); } else if (st.kind !== 'rock' && st.kind !== 'bench' && st.kind !== 'chest' && st.kind !== 'plotsign'){ g.fillStyle = st.kind==='house' ? ROOFS[st.slot] : st.kind==='nhouse' ? (NH_STYLE[st.npc]||{}).roof || '#c9b6f0' : '#b8a8e8'; g.fillRect(i*s, j*s, s, s); } });
  mmBase = cv;
}
function drawMinimap(){
  const cv = $('#mm'); if (!cv || !G.started) return; if (!mmBase) buildMmBase();
  const g = cv.getContext('2d'), W = cv.width, me = chars[G.slot]; if (!me) return;
  const span = 30, sc = W / span, s = 3; // 30 tiles across
  const cx = G.inside && G.inside.b ? G.inside.b.cx : me.x, cz = G.inside && G.inside.b ? G.inside.b.cz : me.z;
  g.save(); g.clearRect(0,0,W,W); g.beginPath(); g.arc(W/2, W/2, W/2-2, 0, 7); g.clip(); g.fillStyle = '#a8dcf0'; g.fillRect(0,0,W,W);
  g.translate(W/2, W/2); g.rotate(G.inside ? 0 : G.yaw); g.imageSmoothingEnabled = false;
  g.drawImage(mmBase, (cx + C + 0.5 - span/2)*s, (cz + C + 0.5 - span/2)*s, span*s, span*s, -W/2, -W/2, W, W);
  const dot = (x, z, c, r) => { const px = (x - cx)*sc, pz = (z - cz)*sc; if (Math.abs(px) > W/2 || Math.abs(pz) > W/2) return; g.fillStyle = '#fff'; g.beginPath(); g.arc(px, pz, r+1.2, 0, 7); g.fill(); g.fillStyle = c; g.beginPath(); g.arc(px, pz, r, 0, 7); g.fill(); };
  Object.values(npcs).forEach(np => { if (np.g.visible) dot(np.x, np.z, np.n.lost ? '#ff9a6a' : '#ffd36a', 2.4); });
  Object.values(chars).forEach(c => { if (c.slot !== G.slot && c.g.visible) dot(c.x, c.z, '#ffb7c9', 3); });
  if (G.delivery) dot(G.delivery.door[0], G.delivery.door[1], '#ff6a7a', 3.4);
  g.restore();
  // me: an arrow pointing where I face (relative to camera)
  g.save(); g.translate(W/2, W/2); g.rotate((G.inside ? 0 : G.yaw) - me.face + Math.PI); g.fillStyle = '#5fb894'; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(0,-7); g.lineTo(5,5); g.lineTo(0,2); g.lineTo(-5,5); g.closePath(); g.stroke(); g.fill(); g.restore();
  g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3; g.beginPath(); g.arc(W/2, W/2, W/2-2, 0, 7); g.stroke();
}
$('#mm').addEventListener('click', () => { if (G.started) (G.panel==='map' ? closePanel() : openMap()); });

/* ---------- targets & actions for v7 things ---------- */
const _labelExtra6 = labelExtra;
labelExtra = function(t){
  if (t.type === 'bench') return benchUse[t.s.id] && benchUse[t.s.id] !== 'me' ? '자리 있음' : '앉기';
  if (t.type === 'swingset') return '그네 타기';
  if (t.type === 'bigstation') return '기차역';
  if (t.type === 'police' || t.type === 'jobk') return '들어가기';
  if (t.type === 'plotsign') return '표지판';
  return _labelExtra6(t);
};
const _actExtra6 = actExtra;
actExtra = function(t){
  if (t.type === 'bench') return sitBench(t.s);
  if (t.type === 'swingset') return sitSwing(t.b);
  if (t.type === 'bigstation') return openStation(STATIONS.find(s => s.id === 'north'));
  if (t.type === 'police') return enterShop('police');
  if (t.type === 'jobk') return enterShop('jobk');
  if (t.type === 'plotsign') return openPlot(t.s.plot);
  return _actExtra6(t);
};
const _showAct7 = showAct;
showAct = function(it){ if (it.show === 'jobboard') return openJobAgency(); return _showAct7(it); };
GUIDE.push(
  { id:'north', t:'북쪽 새 동네', at:[0,-20], lines:['도토리섬 북쪽에 새 동네가 생겼어! 큰 마을역, 경찰서, JOB꼬리아, 새 이웃들 집이 있어.','마을역 앞에서 길을 헤매는 새 이웃을 만나면 말을 걸어 봐. 명소 세 군데를 구경시켜 주면 도토리 1000개를 줘!','새 이웃은 하루에 한 명씩 이사 와.'] },
  { id:'plots', t:'숲밭섬 밭·알바', at:[0,-50], lines:['북쪽 다리를 건너면 숲밭섬! 50칸짜리 밭이 다섯 개 있어.','밭 앞 표지판에서 밭을 살 수 있고, 산 사람 이름이 표지판에 적혀.','JOB꼬리아에서 알바비 도토리 10개랑 씨앗 50개를 주면 알바생이 심고 두 번 수확까지 해 줘!'] },
  { id:'social', t:'주민 생활·호감도', at:null, lines:['주민들은 일도 하고, 벤치에서 쉬기도 하고, 그네 타며 놀기도 해. 서로 수다도 떨고 혼잣말도 해!','가방을 열면 주민 호감도 하트를 볼 수 있어. 은행에선 주민들 통장 잔고도 볼 수 있지.','점프하면 바위나 벤치 위에 올라갈 수 있어. 벤치에 앉거나 그네도 탈 수 있어!'] },
  { id:'safety', t:'경찰서·안전', at:[-6,-15], lines:['자동차나 스쿠터로 주민을 치면 경찰이 출동해서 벌금 도토리 100개!','다친 주민은 병원에 10분 동안 입원해. 병실이 꽉 차면 자기 집에서 쉬어.','기차에 두 번 연속 치이면 기절해서 구조대가 와. 탈것을 타고 부딪히면 탈것이 부서지지만 쇼핑몰에서 10% 가격에 다시 살 수 있어.'] },
);

/* ---------- glue ---------- */
const _featTick6 = featTick;
featTick = function(dt, tsec){
  _featTick6(dt, tsec);
  seatTick(dt, tsec); sitTick(dt, tsec); sleepTick(dt); policeTick(dt, tsec); tourTick(dt); lostTick(dt); jobTick(dt, tsec);
  convoTick(dt); chatTick(dt); bubbleTick(); zzzTick(dt);
  mmT -= dt; if (mmT <= 0){ mmT = 0.2; drawMinimap(); }
};
const _featSlow7 = featSlow;
featSlow = function(){ _featSlow7(); if (G.slowN % 10 === 0){ newcomerState(); syncJobCrops(); } };
