/* 도트마을 관리자 페이지 (구글 계정) */
(() => {
  const MAX = 10;
  const ROOFS = ['#3fae8c','#e0574a','#8a73d6','#5b9be8','#e8b42a','#ff8fa6','#4fae63','#a8744a','#6a6aa6','#ef7fa8'];
  firebase.initializeApp(window.DV_FIREBASE || {});
  const auth = firebase.auth(), db = firebase.database();
  const $ = s => document.querySelector(s), app = $('#app');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const keyOf = email => String(email || '').trim().toLowerCase().replace(/\./g, ',');
  const emailOf = key => key.replace(/,/g, '.');
  const ago = t => { if (!t) return '아직 들어온 적 없어요'; const s = (Date.now()-t)/1000; if (s<90) return '방금 접속'; if (s<3600) return Math.round(s/60)+'분 전 접속'; if (s<86400) return Math.round(s/3600)+'시간 전 접속'; return Math.round(s/86400)+'일 전 접속'; };
  let lastMsg = ['', false];
  const msg = (t, bad) => { lastMsg = [t || '', !!bad]; const m = $('#msg'); if (m){ m.textContent = t || ''; m.classList.toggle('bad', !!bad); } };
  const errText = e => { const c = (e && e.code) || ''; if (c.includes('popup-closed') || c.includes('cancelled-popup')) return ''; if (c.includes('unauthorized-domain')) return '이 주소가 Firebase 승인된 도메인에 없어요'; if (c.includes('PERMISSION') || c.includes('permission')) return '권한이 없어요. 데이터베이스 규칙을 확인해 주세요'; return (e && (e.msg || e.message)) || '문제가 생겼어요'; };
  const signIn = async () => { const p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt:'select_account' }); try{ await auth.signInWithPopup(p); }catch(e){ if ((e.code||'').includes('popup-blocked')) return auth.signInWithRedirect(p); msg(errText(e), true); } };

  function loginView(note){
    app.innerHTML = '<div class="card"><h2>관리자 로그인</h2><p class="sub" style="margin:0 0 4px">관리자 구글 계정으로 로그인해요.</p><button class="go" id="go">Google 계정으로 로그인</button><p id="msg" class="msg"></p></div>';
    $('#go').onclick = signIn; if (note) msg(note, true);
  }
  function claimView(user){
    app.innerHTML = '<div class="card"><h2>관리자 처음 정하기</h2><p class="sub" style="margin:0">아직 관리자가 없어요. 지금 로그인한 계정을 이 게임의 관리자로 정할까요? (한 번만 할 수 있어요)</p>'+
      '<p><b>'+esc(user.email)+'</b></p><button class="go" id="claim">이 계정을 관리자로 정하기</button><button class="small" id="other" style="margin-top:10px">다른 계정으로 로그인</button><p id="msg" class="msg"></p></div>';
    $('#claim').onclick = async () => { try{ await db.ref('config/adminUid').set(user.uid); await db.ref('config/adminEmail').set(user.email); dashboard(); }catch(e){ msg(errText(e), true); } };
    $('#other').onclick = async () => { await auth.signOut(); signIn(); };
  }

  let allowed = {}, villages = {}, subs = [], pickV = '';
  function dashboard(){
    subs.forEach(f => f()); subs = [];
    const watch = (path, fn) => { const r = db.ref(path); const h = r.on('value', s => { fn(s.val() || {}); render(); }, e => msg(errText(e), true)); subs.push(() => r.off('value', h)); };
    watch('allowed', v => allowed = v); watch('villages', v => villages = v);
    render();
  }
  function render(){
    const byV = {}; Object.entries(allowed).forEach(([k, a]) => { (byV[a.village] = byV[a.village] || []).push(Object.assign({ key:k, email:emailOf(k) }, a)); });
    const vnames = Object.keys(byV).sort();
    const keep = { em:($('#nem')||{}).value || '', nm:($('#nnm')||{}).value || '', v:($('#nv')||{}).value || '', nv:($('#nvn')||{}).value || '' };
    app.innerHTML =
      '<div class="card"><h2>구글 계정 등록</h2>'+
      '<div class="row"><div><label>구글 이메일</label><input id="nem" type="email" inputmode="email" autocomplete="off" placeholder="example@gmail.com"></div><div><label>이름(게임 속 이름)</label><input id="nnm" maxlength="8" placeholder="예: 엄마"></div></div>'+
      '<div class="row"><div><label>마을</label><select id="nv">'+vnames.map(v => '<option value="'+esc(v)+'">'+esc(v)+' ('+byV[v].length+'/'+MAX+')</option>').join('')+'<option value="__new">+ 새 마을 만들기</option></select></div>'+
      '<div id="nvWrap"><label>새 마을 이름 (영문·숫자·한글)</label><input id="nvn" maxlength="20" placeholder="예: family"></div></div>'+
      '<button class="go" id="add">등록하기</button><p id="msg" class="msg"></p>'+
      '<p class="sub" style="margin:8px 0 0;font-size:13px">등록한 사람은 게임 첫 화면에서 "Google 계정으로 시작하기"를 누르고 이 계정을 고르면 바로 들어와요.</p></div>'+
      (vnames.length ? vnames.map(v => villageCard(v, byV[v])).join('') : '<div class="card empty">아직 등록한 계정이 없어요.</div>')+
      '<div class="card"><span class="sub" style="font-size:13px">관리자: '+esc((auth.currentUser||{}).email||'')+'</span><br><button class="small" id="out" style="margin-top:8px">관리자 로그아웃</button></div>';
    $('#nem').value = keep.em; $('#nnm').value = keep.nm; if (pickV){ $('#nv').value = pickV; pickV = ''; $('#nvn').value = ''; } else if (keep.v) $('#nv').value = keep.v; $('#nvn').value = keep.nv;
    const syncNew = () => { $('#nvWrap').style.display = $('#nv').value === '__new' ? '' : 'none'; }; $('#nv').onchange = syncNew; syncNew();
    msg(lastMsg[0], lastMsg[1]);
    $('#add').onclick = add; $('#out').onclick = () => auth.signOut();
    app.querySelectorAll('[data-act]').forEach(b => b.onclick = () => act(b.dataset.act, b.dataset.k));
  }
  function villageCard(v, list){
    list.sort((a,b) => a.slot - b.slot);
    const live = (villages[v] && villages[v].live) || {}, players = (villages[v] && villages[v].players) || {};
    return '<div class="card"><div class="vh"><h2>'+esc(v)+' 마을</h2><span class="cnt">'+list.length+' / '+MAX+'명 · 지금 접속 '+Object.keys(live).length+'명</span></div>'+
      list.map(a => { let p = null; try{ p = JSON.parse(players[a.pid] || 'null'); }catch(e){}
        const on = !!live[a.pid];
        return '<div class="mem"><div class="slot" style="background:'+ROOFS[a.slot]+'">'+(a.slot+1)+'</div>'+
          '<div class="who"><b>'+esc(a.name || '이름 없음')+'</b>'+(on ? '<span class="tag on">접속 중</span>' : '')+(p ? '' : '<span class="tag">첫 접속 전</span>')+
          '<span>'+esc(a.email)+' · '+ago(p && p.at)+'</span></div>'+
          '<div class="acts"><button class="small" data-act="rename" data-k="'+esc(a.key)+'">이름</button><button class="small danger" data-act="del" data-k="'+esc(a.key)+'">삭제</button></div></div>'; }).join('')+'</div>';
  }
  async function add(){
    const email = $('#nem').value.trim().toLowerCase(), name = $('#nnm').value.trim(); let v = $('#nv').value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return msg('이메일 주소를 확인해 주세요', true);
    if (!name) return msg('게임 속 이름을 적어 주세요', true);
    if (v === '__new'){ v = $('#nvn').value.trim(); if (!/^[a-zA-Z0-9가-힣_-]{1,20}$/.test(v)) return msg('마을 이름은 영문·숫자·한글로 20자까지예요', true); }
    const k = keyOf(email); if (allowed[k]) return msg('이미 등록된 계정이에요 ('+allowed[k].village+' 마을)', true);
    const used = new Set(Object.values(allowed).filter(a => a.village === v).map(a => a.slot));
    if (used.size >= MAX) return msg(v+' 마을은 10명이 꽉 찼어요', true);
    let slot = 0; while (used.has(slot)) slot++;
    try{ await db.ref('allowed/'+k).set({ name, village:v, slot, pid:'p'+slot, at:Date.now() }); pickV = v; $('#nem').value = ''; $('#nnm').value = ''; msg(email+' 등록 완료! '+v+' 마을 '+(slot+1)+'번 집이에요'); }
    catch(e){ msg(errText(e), true); }
  }
  async function act(kind, k){
    const a = allowed[k]; if (!a) return; const email = emailOf(k);
    try{
      if (kind === 'rename'){ const n = prompt('게임 속 이름', a.name || ''); if (n == null || !n.trim()) return; await db.ref('allowed/'+k+'/name').set(n.trim().slice(0, 8)); msg('이름을 바꿨어요 (처음 들어올 때 이 이름으로 시작해요)'); }
      if (kind === 'del'){ if (!confirm(a.name+'('+email+')를 삭제할까요? 더 이상 들어올 수 없어요.')) return;
        const wipe = confirm('캐릭터(옷·도토리·집 꾸미기)도 지울까요?\n확인 = 지우기 / 취소 = 남겨 두기(나중에 다시 등록하면 이어서 할 수 있어요)');
        await db.ref('allowed/'+k).remove(); if (wipe){ await db.ref('villages/'+a.village+'/players/'+a.pid).remove(); await db.ref('villages/'+a.village+'/live/'+a.pid).remove(); }
        msg('삭제했어요'); }
    }catch(e){ msg(errText(e), true); }
  }

  auth.getRedirectResult().catch(e => msg(errText(e), true));
  auth.onAuthStateChanged(async user => {
    try{
      if (!user){ subs.forEach(f => f()); subs = []; return loginView(); }
      const adminUid = (await db.ref('config/adminUid').get()).val();
      if (!adminUid) return claimView(user);
      if (user.uid !== adminUid){ await auth.signOut(); loginView('관리자 계정이 아니에요 ('+user.email+')'); return; }
      dashboard();
    }catch(e){ app.innerHTML = '<div class="card"><p class="msg bad">'+esc(errText(e))+'</p><p class="sub">firebase-config.js 설정과 데이터베이스 규칙을 확인해 주세요.</p></div>'; }
  });
})();
