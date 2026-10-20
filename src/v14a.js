/* ================= v14: 플레이 시간 기록 (관리자 페이지에서만 보임) ================= */
// counts only while the game is on screen and someone touched it in the last 5 minutes
let playPend = 0, playLastInput = Date.now(), playFlushAt = Date.now();
['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, () => { playLastInput = Date.now(); }, true));
const playDay = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
function playFlush(){ if (!playPend || !NETON() || !window.DVNet.addPlay) return; const n = playPend; playPend = 0; playFlushAt = Date.now(); window.DVNet.addPlay(n, playDay(), false).then(ok => { if (!ok) playPend += n; }); }
setInterval(() => {
  if (!NETON() || !G.started || document.hidden) return;
  if (Date.now() - playLastInput > 5*60*1000) return;
  playPend++;
  if (Date.now() - playFlushAt > 60000) playFlush();
}, 1000);
document.addEventListener('visibilitychange', () => { if (document.hidden) playFlush(); });
window.addEventListener('pagehide', playFlush);
Store.on('loaded', () => { if (NETON() && window.DVNet.addPlay) window.DVNet.addPlay(0, playDay(), true); });
