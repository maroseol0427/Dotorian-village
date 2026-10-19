/* ================= v9: web version — neighbours move in real time (Firebase), login instead of a pick screen ================= */
const NETON = () => Store.mode === 'fb';
let liveMap = {}, liveSendT = 0;
if (window.DVNet) window.DVNet.onLive(v => { liveMap = v || {}; });

// in the web version other players only appear while they are actually online
const _syncOthers9 = syncOthers;
syncOthers = function(){
  if (!NETON()) return _syncOthers9();
  if (!G.started) return;
  SLOTS.forEach((_,s) => { if (s === G.slot) return; const c = chars[s], p = Store.data.players[pid(s)]; if (c && p) applyLook(c, p); });
};
const r2 = v => Math.round(v*100)/100;
function liveTick(dt){
  if (!NETON() || !G.started) return;
  const me = chars[G.slot]; if (!me) return;
  liveSendT -= dt;
  if (liveSendT <= 0){ liveSendT = 0.15;
    const st = { x:r2(me.x), z:r2(me.z), f:r2(me.g.rotation.y), m:(ctl.wasMoving || me.path.length) ? 1 : 0, j:r2(me.jy || 0), e:r2(me.elev || 0), i:G.inside ? 1 : 0, s:G.sit ? 1 : 0, a:G.anim ? G.anim.type : 0, p:G.music ? 1 : 0, em:G.emo ? G.emo.id + ':' + G.emo.n : 0 };
    window.DVNet.sendLive(st);
  }
  // move everybody else toward where they really are
  SLOTS.forEach((_,s) => {
    if (s === G.slot) return; const c = chars[s]; if (!c) return; const L = liveMap[pid(s)];
    const show = !!L && !L.i && !G.inside && !!Store.data.players[pid(s)];
    if (!show){ if (c.g.visible){ c.g.visible = false; c.lbl.hidden = true; } c.netSeen = false; return; }
    c.path = [];
    if (!c.g.visible || !c.netSeen || Math.hypot(L.x - c.x, L.z - c.z) > 6){ c.x = L.x; c.z = L.z; c.netSeen = true; c.g.visible = true; }
    const k = Math.min(1, dt*9); c.x += (L.x - c.x)*k; c.z += (L.z - c.z)*k;
    c.i = Math.round(c.x) + C; c.j = Math.round(c.z) + C;
    c.face = L.f; c.jy = L.j || 0; c.elev = L.e || 0;
    const U = c.model && c.model.userData; if (!U) return;
    const moving = L.m && !c.ride;
    if (moving){ c.netWalk = (c.netWalk || 0) + dt*13; const sw = Math.sin(c.netWalk)*0.7; U.legs[0].rotation.x = sw; U.legs[1].rotation.x = -sw; U.arms[0].rotation.x = -sw*0.8; U.arms[1].rotation.x = sw*0.8; c.model.position.y = Math.abs(Math.sin(c.netWalk))*0.05; }
    if (L.s){ U.legs.forEach(l => l.rotation.x = -1.45); }
    if (L.a === 'wave'){ U.arms[1].rotation.x = -2.8; U.arms[1].rotation.z = 0.35 + Math.sin(performance.now()/60)*0.35; }
    else if (L.a === 'cheer'){ U.arms[0].rotation.x = U.arms[1].rotation.x = -2.9; }
    else if (L.a){ U.arms[1].rotation.x = -1.4 + Math.sin(performance.now()/90)*0.4; }
    else if (U.arms[1].rotation.z > 0.3) U.arms[1].rotation.z = 0.28;
  });
}
const _featTick9 = featTick;
featTick = function(dt, tsec){ _featTick9(dt, tsec); liveTick(dt); };

// online dot = really connected right now
const isOnline9 = s => s === G.slot || (NETON() ? !!liveMap[pid(s)] : false);

// settings: log out
const _openSettings9 = openSettings;
openSettings = function(){
  _openSettings9();
  if (!NETON()) return;
  const sw = $('#swap'); if (sw){ sw.textContent = '로그아웃'; const nb = sw.cloneNode(true); sw.replaceWith(nb); nb.addEventListener('click', () => { saveMe(true); setTimeout(() => window.DVNet.signOut(), 400); }); }
  const S = window.DVNet.session; const nm = $('#myname'); if (nm && S){ const info = document.createElement('p'); info.className = 'note'; info.textContent = S.email+' · '+S.village+' 마을 '+(S.slot+1)+'번 집'; nm.parentNode.after(info); }
};
// tapping someone: show whether they're online now
window.addEventListener('beforeunload', () => { if (NETON()){ try{ saveMe(true); window.DVNet.clearLive(); }catch(e){} } });
// app in the background → leave the street (come back when the app is opened again)
document.addEventListener('visibilitychange', () => { if (!NETON()) return; if (document.hidden){ try{ saveMe(true); }catch(e){} window.DVNet.clearLive(); } else liveSendT = 0; });
