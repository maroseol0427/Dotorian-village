/* 도토리 마을 — web version: Google login (only accounts the admin registered) and the village server (Firebase). */
window.DVNet = (() => {
  firebase.initializeApp(window.DV_FIREBASE || {});
  const auth = firebase.auth(), db = firebase.database();
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const keyOf = email => String(email || '').trim().toLowerCase().replace(/\./g, ',');
  let resolveReady; const ready = new Promise(r => resolveReady = r);
  const api = { ready, session:null, base:null };

  /* in-app browsers (KakaoTalk, Instagram, NAVER…) can't do Google login → send to the real browser */
  const UA = navigator.userAgent || '';
  const inApp = /KAKAOTALK|Instagram|FBAN|FBAV|NAVER|Line\/|DaumApps|everytimeApp|SamsungBrowser\/[0-9.]+ .*CrossApp/i.test(UA);
  if (/KAKAOTALK/i.test(UA)){ location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(location.href); }

  /* ---------- login screen ---------- */
  function ui(html){ const box = $('#authBox'); if (box) box.innerHTML = html; }
  function msg(t, bad){ const m = $('#authMsg'); if (m){ m.textContent = t || ''; m.classList.toggle('bad', !!bad); } }
  const G_ICON = '<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" style="vertical-align:-4px;margin-right:8px"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
  function showLogin(note){
    if (inApp){ ui('<h2>브라우저에서 열어 주세요</h2><p class="anote">카카오톡·인스타그램 같은 앱 안에서는 구글 로그인이 안 돼요. 오른쪽 위(또는 아래) 메뉴에서 <b>다른 브라우저로 열기</b>(Chrome, Safari)를 눌러 주세요.</p><button class="go" id="aCopy">주소 복사하기</button><p id="authMsg" class="amsg"></p>');
      $('#aCopy').onclick = () => { try{ navigator.clipboard.writeText(location.href); msg('주소를 복사했어요. Chrome이나 Safari에 붙여넣어 주세요'); }catch(e){ msg(location.href); } }; return; }
    ui('<h2>시작하기</h2><p class="anote">관리자가 등록해 둔 구글 계정으로만 들어올 수 있어요.</p>'+
      '<button class="go gbtn" id="aGoogle">'+G_ICON+'Google 계정으로 시작하기</button><p id="authMsg" class="amsg"></p>');
    if (note) msg(note, true);
    $('#aGoogle').onclick = signIn;
  }
  function showDenied(email){
    ui('<h2>등록되지 않은 계정이에요</h2><p class="anote"><b>'+esc(email)+'</b><br>관리자에게 이 이메일을 알려 주고 등록을 부탁해 주세요.</p>'+
      '<button class="go" id="aOther">다른 구글 계정으로 시작하기</button><p id="authMsg" class="amsg"></p>');
    $('#aOther').onclick = async () => { await auth.signOut(); signIn(); };
  }
  function errText(e){
    const c = e && e.code || '';
    if (c.includes('popup-closed') || c.includes('cancelled-popup')) return '';
    if (c.includes('unauthorized-domain')) return '이 주소는 아직 로그인 허용 목록에 없어요 (Firebase 승인된 도메인)';
    if (c.includes('network')) return '인터넷 연결을 확인해 주세요';
    if (c.includes('PERMISSION') || c.includes('permission')) return '권한이 없어요. 관리자에게 문의해 주세요';
    return (e && (e.msg || e.message)) || '문제가 생겼어요. 다시 시도해 주세요';
  }
  async function signIn(){
    const p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt:'select_account' });
    msg('구글 로그인 창을 여는 중…');
    try{ await auth.signInWithPopup(p); }
    catch(e){
      if ((e.code || '').includes('popup-blocked') || (e.code || '').includes('operation-not-supported')){ try{ await auth.signInWithRedirect(p); return; }catch(e2){ e = e2; } }
      msg(errText(e), true);
    }
  }
  let entering = false;
  async function enter(user){
    if (api.session || entering) return; entering = true;
    try{
      ui('<p class="anote">확인 중…</p>');
      const a = (await db.ref('allowed/' + keyOf(user.email)).get()).val();
      if (!a){ entering = false; showDenied(user.email); return; }
      api.session = { uid:user.uid, email:user.email, village:a.village, slot:a.slot, pid:a.pid, name:a.name };
      api.base = 'villages/' + a.village + '/';
      ui('<p class="anote">'+esc(a.name || '')+'님, '+esc(a.village)+' 마을로 들어가는 중…</p>');
      startLive();
      resolveReady(api.session);
    }catch(e){ entering = false; console.warn(e); if ((e.code || e.message || '').toString().toLowerCase().includes('permission')) showDenied(user.email); else showLogin(errText(e)); }
  }
  auth.getRedirectResult().catch(e => { const t = errText(e); if (t) setTimeout(() => msg(t, true), 300); });
  auth.onAuthStateChanged(user => { if (user) enter(user); else if (!api.session) showLogin(); });

  /* ---------- village data ---------- */
  api.on = (path, fn) => { db.ref(api.base + path).on('value', s => fn(s.val()), e => console.warn('read', path, e)); };
  api.set = (path, val) => db.ref(api.base + path).set(val).catch(e => console.warn('write', path, e));
  api.onLast = (path, n, fn) => { db.ref(api.base + path).orderByKey().limitToLast(n).on('value', s => fn(s.val()), e => console.warn('read', path, e)); };
  api.remove = path => db.ref(api.base + path).remove().catch(e => console.warn('remove', path, e));
  api.push = (path, val) => db.ref(api.base + path).push(val).catch(e => console.warn('push', path, e));
  api.signOut = async () => { try{ await db.ref(api.base + 'live/' + api.session.pid).remove(); }catch(e){} await auth.signOut(); location.reload(); };
  api.who = () => api.session ? api.session.email : '';
  /* play time (only the admin page shows it): stats/{village}/{pid} = { total, days:{date:sec}, sessions, last } */
  api.addPlay = (sec, day, newSession) => {
    if (!api.session) return Promise.resolve(false);
    return db.ref('stats/' + api.session.village + '/' + api.session.pid).transaction(cur => {
      cur = cur || { total:0, days:{}, sessions:0 }; cur.days = cur.days || {};
      cur.total = (cur.total || 0) + sec; if (sec) cur.days[day] = (cur.days[day] || 0) + sec;
      if (newSession) cur.sessions = (cur.sessions || 0) + 1;
      const keys = Object.keys(cur.days).sort(); while (keys.length > 40) delete cur.days[keys.shift()];
      cur.last = Date.now(); return cur;
    }).then(() => true).catch(e => { console.warn('stats', e); return false; });
  };

  /* ---------- live positions (who is online right now) ---------- */
  const liveCbs = [];
  let liveRef = null, lastSent = '', lastAt = 0;
  function startLive(){
    liveRef = db.ref(api.base + 'live/' + api.session.pid);
    db.ref('.info/connected').on('value', s => { if (s.val() === true){ liveRef.onDisconnect().remove(); lastSent = ''; } });
    db.ref(api.base + 'live').on('value', s => { const v = s.val() || {}; liveCbs.forEach(f => f(v)); });
  }
  api.onLive = fn => liveCbs.push(fn);
  api.sendLive = (state, force) => {
    if (!liveRef) return; const now = Date.now(); const j = JSON.stringify(state);
    if (!force && j === lastSent && now - lastAt < 4000) return;
    lastSent = j; lastAt = now; liveRef.set(Object.assign({ at:firebase.database.ServerValue.TIMESTAMP }, state)).catch(() => {});
  };
  api.clearLive = () => { if (liveRef) liveRef.remove().catch(() => {}); lastSent = ''; };
  return api;
})();
