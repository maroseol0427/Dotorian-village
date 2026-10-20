/* 도토리 마을 관리자 페이지 (구글 계정) */
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

  let allowed = {}, villages = {}, stats = {}, statsErr = false, subs = [], pickV = '', playSort = 'week';
  function dashboard(){
    subs.forEach(f => f()); subs = [];
    const watch = (path, fn) => { const r = db.ref(path); const h = r.on('value', s => { fn(s.val() || {}); render(); }, e => msg(errText(e), true)); subs.push(() => r.off('value', h)); };
    watch('allowed', v => allowed = v); watch('villages', v => villages = v);
    { const r = db.ref('stats'); const h = r.on('value', s => { stats = s.val() || {}; statsErr = false; render(); }, () => { statsErr = true; render(); }); subs.push(() => r.off('value', h)); }
    render();
  }
  function render(){
    const byV = {}; Object.entries(allowed).forEach(([k, a]) => { (byV[a.village] = byV[a.village] || []).push(Object.assign({ key:k, email:emailOf(k) }, a)); });
    const vnames = Object.keys(byV).sort();
    keepG = { to:($('#gTo')||{}).value, kind:($('#gKind')||{}).value, item:($('#gItem')||{}).value, n:($('#gN')||{}).value, msg:($('#gMsg')||{}).value };
    const keep = { em:($('#nem')||{}).value || '', nm:($('#nnm')||{}).value || '', v:($('#nv')||{}).value || '', nv:($('#nvn')||{}).value || '' };
    app.innerHTML =
      '<div class="card"><h2>구글 계정 등록</h2>'+
      '<div class="row"><div><label>구글 이메일</label><input id="nem" type="email" inputmode="email" autocomplete="off" placeholder="example@gmail.com"></div><div><label>이름(게임 속 이름)</label><input id="nnm" maxlength="8" placeholder="예: 엄마"></div></div>'+
      '<div class="row"><div><label>마을</label><select id="nv">'+vnames.map(v => '<option value="'+esc(v)+'">'+esc(v)+' ('+byV[v].length+'/'+MAX+')</option>').join('')+'<option value="__new">+ 새 마을 만들기</option></select></div>'+
      '<div id="nvWrap"><label>새 마을 이름 (영문·숫자·한글)</label><input id="nvn" maxlength="20" placeholder="예: family"></div></div>'+
      '<button class="go" id="add">등록하기</button><p id="msg" class="msg"></p>'+
      '<p class="sub" style="margin:8px 0 0;font-size:13px">등록한 사람은 게임 첫 화면에서 "Google 계정으로 시작하기"를 누르고 이 계정을 고르면 바로 들어와요.</p></div>'+
      (vnames.length ? giftCard(byV, vnames) : '')+
      (vnames.length ? playCard(byV, vnames) : '')+
      (vnames.length ? vnames.map(v => villageCard(v, byV[v])).join('') : '<div class="card empty">아직 등록한 계정이 없어요.</div>')+
      '<div class="card"><span class="sub" style="font-size:13px">관리자: '+esc((auth.currentUser||{}).email||'')+'</span><br><button class="small" id="out" style="margin-top:8px">관리자 로그아웃</button></div>';
    $('#nem').value = keep.em; $('#nnm').value = keep.nm; if (pickV){ $('#nv').value = pickV; pickV = ''; $('#nvn').value = ''; } else if (keep.v) $('#nv').value = keep.v; $('#nvn').value = keep.nv;
    const syncNew = () => { $('#nvWrap').style.display = $('#nv').value === '__new' ? '' : 'none'; }; $('#nv').onchange = syncNew; syncNew();
    msg(lastMsg[0], lastMsg[1]);
    $('#add').onclick = add;
    if ($('#gKind')){ const gk = keepG; if (gk.to) $('#gTo').value = gk.to; if (gk.kind) $('#gKind').value = gk.kind; fillGiftItems(); if (gk.item) $('#gItem').value = gk.item; if (gk.n) $('#gN').value = gk.n; if (gk.msg) $('#gMsg').value = gk.msg;
      $('#gKind').onchange = fillGiftItems; $('#gSend').onclick = sendGift; gmsg(lastG[0], lastG[1]); } $('#out').onclick = () => auth.signOut();
    app.querySelectorAll('[data-act]').forEach(b => b.onclick = () => act(b.dataset.act, b.dataset.k));
    app.querySelectorAll('[data-ps]').forEach(b => b.onclick = () => { playSort = b.dataset.ps; render(); });
  }
  let keepG = {}, lastG = ['', false];
  const gmsg = (t, bad) => { lastG = [t || '', !!bad]; const m = $('#gMsgOut'); if (m){ m.textContent = t || ''; m.classList.toggle('bad', !!bad); } };
  const CAT = window.DV_CATALOG || { items:[], furn:[], seeds:[] };
  function giftCard(byV, vnames){
    const opts = vnames.map(v => '<optgroup label="'+esc(v)+' 마을"><option value="all|'+esc(v)+'">'+esc(v)+' 마을 모두에게</option>'+byV[v].sort((a,b)=>a.slot-b.slot).map(a => '<option value="'+esc(a.key)+'">'+esc(a.name)+' ('+(a.slot+1)+'번 집)</option>').join('')+'</optgroup>').join('');
    return '<div class="card"><h2>선물 보내기</h2>'+
      '<div class="row"><div><label>받는 사람</label><select id="gTo">'+opts+'</select></div><div><label>선물 종류</label><select id="gKind"><option value="acorn">도토리</option><option value="item">옷·소품·악기·탈것</option><option value="furn">가구</option><option value="seed">씨앗</option></select></div></div>'+
      '<div class="row"><div id="gItemWrap"><label>아이템</label><select id="gItem"></select></div><div><label id="gNLabel">개수</label><input id="gN" type="number" inputmode="numeric" min="1" max="99999" value="100"></div></div>'+
      '<label>한마디 (선택)</label><input id="gMsg" maxlength="40" placeholder="예: 생일 축하해!">'+
      '<button class="go" id="gSend">선물 보내기</button><p id="gMsgOut" class="msg"></p>'+
      '<p class="sub" style="margin:8px 0 0;font-size:13px">받는 사람이 게임에 들어오면 바로 도착해요(지금 접속 중이면 즉시).</p></div>';
  }
  function fillGiftItems(){
    const k = $('#gKind').value, sel = $('#gItem');
    $('#gItemWrap').style.display = k === 'acorn' ? 'none' : ''; $('#gNLabel').textContent = k === 'acorn' ? '도토리 개수' : '개수';
    if (k === 'item'){ $('#gN').value = 1; $('#gN').disabled = true; } else { $('#gN').disabled = false; if (k !== 'acorn' && Number($('#gN').value) > 99) $('#gN').value = 1; }
    const list = k === 'item' ? CAT.items : k === 'furn' ? CAT.furn : k === 'seed' ? CAT.seeds : [];
    if (k === 'item'){ const g = {}; list.forEach(it => (g[it.cat] = g[it.cat] || []).push(it)); sel.innerHTML = Object.entries(g).map(([c, arr]) => '<optgroup label="'+esc(c)+'">'+arr.map(it => '<option value="'+esc(it.id)+'">'+esc(it.name)+'</option>').join('')+'</optgroup>').join(''); }
    else sel.innerHTML = list.map(it => '<option value="'+esc(it.id)+'">'+esc(it.name)+'</option>').join('');
  }
  async function sendGift(){
    const to = $('#gTo').value, kind = $('#gKind').value, id = kind === 'acorn' ? '' : $('#gItem').value, n = Math.round(Number($('#gN').value) || 0), msg = $('#gMsg').value.trim().slice(0, 40);
    if (kind !== 'item' && (n < 1 || n > 99999)) return gmsg('개수를 확인해 주세요 (1~99999)', true);
    if (kind !== 'acorn' && !id) return gmsg('아이템을 골라 주세요', true);
    const targets = to.startsWith('all|') ? Object.values(allowed).filter(a => a.village === to.slice(4)) : [allowed[to]].filter(Boolean);
    if (!targets.length) return gmsg('받는 사람을 골라 주세요', true);
    const body = JSON.stringify({ kind, id, n: kind === 'item' ? 1 : n, msg, at:Date.now() });
    try{ await Promise.all(targets.map(a => db.ref('villages/'+a.village+'/gifts/'+a.pid).push(body))); $('#gMsg').value = '';
      const what = kind === 'acorn' ? '도토리 '+n+'개' : ($('#gItem').selectedOptions[0] || {}).textContent + (kind === 'item' ? '' : ' '+n+'개');
      gmsg((targets.length > 1 ? targets.length+'명에게 ' : targets[0].name+'에게 ')+what+' 선물을 보냈어요!'); }
    catch(e){ gmsg(errText(e), true); }
  }
  /* ---------- play time (admin only) ---------- */
  const dayKey = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const fmt = sec => { sec = Math.round(sec || 0); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60); return h ? h + '시간 ' + (m ? m + '분' : '') : m ? m + '분' : (sec ? '1분 미만' : '0분'); };
  function lastDays(n){ const out = []; for (let i = n - 1; i >= 0; i--){ const d = new Date(); d.setDate(d.getDate() - i); out.push(dayKey(d)); } return out; }
  function playCard(byV, vnames){
    if (statsErr) return '<div class="card"><h2>플레이 시간</h2><p class="msg bad">플레이 시간을 불러오지 못했어요. Firebase 데이터베이스 규칙을 새 버전으로 다시 게시해 주세요.</p></div>';
    const days7 = lastDays(7), today = days7[6], W = ['일','월','화','수','목','금','토'];
    const rows = [];
    vnames.forEach(v => byV[v].forEach(a => { const st = (stats[v] || {})[a.pid] || {}, d = st.days || {};
      let p = null; try{ p = JSON.parse(((villages[v] || {}).players || {})[a.pid] || 'null'); }catch(e){}
      rows.push({ a, v, name:(p && p.name) || a.name, total:st.total || 0, today:d[today] || 0, week:days7.reduce((s, k) => s + (d[k] || 0), 0), days:days7.map(k => d[k] || 0), sessions:st.sessions || 0, last:st.last }); }));
    rows.sort((x, y) => (y[playSort] || 0) - (x[playSort] || 0));
    const max = Math.max(60, ...rows.map(r => Math.max(...r.days)));
    const sum = k => rows.reduce((s, r) => s + r[k], 0);
    const tabs = [['today','오늘'],['week','최근 7일'],['total','전체']].map(([k, l]) => '<button class="small'+(playSort === k ? ' on' : '')+'" data-ps="'+k+'">'+l+' 순</button>').join('');
    return '<div class="card"><div class="vh"><h2>플레이 시간</h2><span class="cnt">관리자만 볼 수 있어요</span></div>'+
      '<div class="ptabs">'+tabs+'</div>'+
      '<div class="psum"><div><b>'+fmt(sum('today'))+'</b><span>오늘 모두 합계</span></div><div><b>'+fmt(sum('week'))+'</b><span>최근 7일 합계</span></div><div><b>'+fmt(sum('total'))+'</b><span>전체 합계</span></div></div>'+
      rows.map((r, i) => '<div class="prow"><div class="slot" style="background:'+ROOFS[r.a.slot]+'">'+(i+1)+'</div><div class="pwho"><b>'+esc(r.name)+'</b><span>'+esc(r.v)+' 마을 · 접속 '+r.sessions+'회'+(r.last ? ' · 마지막 플레이 '+ago(r.last).replace(' 접속', '') : '')+'</span>'+
        '<div class="pnum"><span>오늘 <b>'+fmt(r.today)+'</b></span><span>7일 <b>'+fmt(r.week)+'</b></span><span>전체 <b>'+fmt(r.total)+'</b></span></div>'+
        '<div class="pbars">'+r.days.map((s, k) => { const d = new Date(days7[k]); return '<div title="'+days7[k]+' '+fmt(s)+'"><i style="height:'+Math.max(s ? 3 : 0, Math.round(s / max * 34))+'px"></i><em>'+(k === 6 ? '오늘' : W[d.getDay()])+'</em></div>'; }).join('')+'</div></div></div>').join('')+
      '<p class="sub" style="margin:10px 0 0;font-size:13px">게임 화면을 켜 두고 5분 안에 한 번이라도 만진 시간만 세요. 화면을 끄거나 다른 앱으로 가면 멈춰요. 이 기록은 게임 안에서는 아무에게도 안 보여요.</p></div>';
  }
  function villageCard(v, list){
    list.sort((a,b) => a.slot - b.slot);
    const live = (villages[v] && villages[v].live) || {}, players = (villages[v] && villages[v].players) || {};
    return '<div class="card"><div class="vh"><h2>'+esc(v)+' 마을</h2><span class="cnt">'+list.length+' / '+MAX+'명 · 지금 접속 '+Object.keys(live).length+'명</span></div>'+
      list.map(a => { let p = null; try{ p = JSON.parse(players[a.pid] || 'null'); }catch(e){}
        const on = !!live[a.pid];
        return '<div class="mem"><div class="slot" style="background:'+ROOFS[a.slot]+'">'+(a.slot+1)+'</div>'+
          '<div class="who"><b>'+esc((p && p.name) || a.name || '이름 없음')+'</b>'+(p && p.name && p.name !== a.name ? '<span class="tag">등록 이름 '+esc(a.name)+'</span>' : '')+(on ? '<span class="tag on">접속 중</span>' : '')+(p ? '' : '<span class="tag">첫 접속 전</span>')+
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
