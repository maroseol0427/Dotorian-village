/* test-only stand-in for the Firebase compat SDK (auth + realtime database). Shared between tabs via localStorage. */
(() => {
  const K = 'mockfb.db', KU = 'mockfb.users';
  const load = k => { try{ return JSON.parse(localStorage.getItem(k) || 'null'); }catch(e){ return null; } };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const parts = p => String(p || '').split('/').filter(Boolean);
  const getAt = (o, p) => { let c = o; for (const k of parts(p)){ if (c == null || typeof c !== 'object') return null; c = c[k]; } return c === undefined ? null : c; };
  const clean = v => { if (v && typeof v === 'object'){ if (v['.sv'] === 'timestamp') return Date.now(); const o = {}; let n = 0; for (const k in v){ const c = clean(v[k]); if (c != null){ o[k] = c; n++; } } return n ? o : null; } return v; };
  const setAt = (o, p, v) => { const ks = parts(p); if (!ks.length) return clean(v) || {}; let c = o; for (let i=0;i<ks.length-1;i++){ if (c[ks[i]] == null || typeof c[ks[i]] !== 'object') c[ks[i]] = {}; c = c[ks[i]]; } const cv = clean(v); if (cv == null) delete c[ks[ks.length-1]]; else c[ks[ks.length-1]] = cv; return o; };
  const listeners = []; // {path, cb, last}
  const fire = () => { const d = load(K) || {}; listeners.forEach(L => { const v = L.path === '.info/connected' ? true : getAt(d, L.path); const j = JSON.stringify(v); if (j !== L.last){ L.last = j; try{ L.cb({ val:() => JSON.parse(j) }); }catch(e){ console.error(e); } } }); };
  window.addEventListener('storage', e => { if (e.key === K) fire(); });
  const write = (path, v) => { const d = load(K) || {}; save(K, setAt(d, path, v)); setTimeout(fire, 0); return Promise.resolve(); };
  const disc = [];
  window.addEventListener('beforeunload', () => disc.forEach(p => write(p, null)));
  function ref(path){
    path = parts(path).join('/');
    const r = {
      get: () => Promise.resolve({ val:() => { const v = getAt(load(K) || {}, path); return v == null ? null : JSON.parse(JSON.stringify(v)); }, exists(){ return this.val() != null; } }),
      set: v => write(path, v),
      update: v => { const d = load(K) || {}; Object.entries(v).forEach(([k,x]) => setAt(d, path + '/' + k, x)); save(K, d); setTimeout(fire, 0); return Promise.resolve(); },
      remove: () => write(path, null),
      push: v => { const k = 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); write(path + '/' + k, v); return Promise.resolve({ key:k }); },
      on: (ev, cb) => { const L = { path, cb, last:undefined }; listeners.push(L); setTimeout(fire, 0); return cb; },
      off: (ev, cb) => { const i = listeners.findIndex(L => L.path === path && (!cb || L.cb === cb)); if (i >= 0) listeners.splice(i, 1); },
      onDisconnect: () => ({ remove: () => { disc.push(path); return Promise.resolve(); } }),
      orderByChild: () => r, orderByKey: () => r, limitToLast: () => r, child: c => ref(path + '/' + c),
    };
    return r;
  }
  const db = { ref };
  // auth
  const SKEY = 'mockfb.cur';
  let cur = load(SKEY), authCbs = [];
  const setCur = u => { cur = u; sessionStorage.setItem(SKEY, JSON.stringify(u)); localStorage.setItem(SKEY, JSON.stringify(u)); authCbs.forEach(f => setTimeout(() => f(u), 0)); };
  try{ cur = JSON.parse(sessionStorage.getItem(SKEY) || 'null'); }catch(e){ cur = null; }
  const err = code => Promise.reject({ code });
  const auth = {
    get currentUser(){ return cur; },
    onAuthStateChanged(f){ authCbs.push(f); setTimeout(() => f(cur), 0); return () => {}; },
    createUserWithEmailAndPassword(email, pw){ const us = load(KU) || {}; if (us[email]) return err('auth/email-already-in-use'); if (pw.length < 6) return err('auth/weak-password'); const u = { uid:'u' + Math.random().toString(36).slice(2,10), email }; us[email] = { pw, uid:u.uid }; save(KU, us); setCur(u); return Promise.resolve({ user:u }); },
    signInWithEmailAndPassword(email, pw){ const us = load(KU) || {}; const r = us[email]; if (!r || r.pw !== pw) return err('auth/invalid-credential'); const u = { uid:r.uid, email }; setCur(u); return Promise.resolve({ user:u }); },
    signOut(){ setCur(null); return Promise.resolve(); },
    signInWithPopup(){ const email = (window.__mockEmail || '').toLowerCase(); if (!email) return err('auth/popup-closed-by-user'); const us = load(KU) || {}; if (!us[email]){ us[email] = { uid:'g' + Math.random().toString(36).slice(2,10) }; save(KU, us); } const u = { uid:us[email].uid, email }; setCur(u); return Promise.resolve({ user:u }); },
    signInWithRedirect(){ return this.signInWithPopup(); },
    getRedirectResult(){ return Promise.resolve({ user:null }); },
  };
  const fb = { initializeApp: () => ({}), auth: () => auth, database: () => db };
  fb.auth.GoogleAuthProvider = function(){ this.setCustomParameters = () => {}; };
  fb.database.ServerValue = { TIMESTAMP:{ '.sv':'timestamp' } };
  window.firebase = fb;
})();
