/* ================= v9b: left menu button, full screen, gifts from the admin, village chat ================= */

let chatMsgs = [], chatUnread = 0, chatFirst = true, chatSeenAt = Number(LS.get('dv.chatSeen', 0)) || 0;
/* ---------- menu ---------- */
const menuPop = $('#menuPop');
function toggleMenu(show){ const on = show === undefined ? menuPop.hidden : show; menuPop.hidden = !on; }
$('#menuBtn').addEventListener('click', e => { e.stopPropagation(); toggleMenu(); });
menuPop.addEventListener('click', e => {
  const b = e.target.closest('[data-m]'); if (!b) return; toggleMenu(false);
  const m = b.dataset.m;
  if (m === 'full') return toggleFull();
  if (m === 'chat') return G.panel === 'chat' ? closePanel() : openChat();
  const t = document.getElementById(m); if (t) t.click();
});
document.addEventListener('pointerdown', e => { if (!menuPop.hidden && !e.target.closest('#menuPop') && !e.target.closest('#menuBtn')) toggleMenu(false); }, true);
if (window.DVNet) menuPop.querySelectorAll('.netonly').forEach(b => b.hidden = false);
function syncMenuDot(){
  const mail = Number($('#mailBadge').hidden ? 0 : $('#mailBadge').textContent) || 0;
  $('#mailBadge2').hidden = !mail; $('#mailBadge2').textContent = mail;
  $('#chatBadge2').hidden = !chatUnread; $('#chatBadge2').textContent = chatUnread > 99 ? '99+' : chatUnread;
  $('#menuDot').hidden = !(mail || chatUnread);
}
const _updateBadge9 = updateBadge;
updateBadge = function(){ _updateBadge9(); syncMenuDot(); };

/* ---------- full screen ---------- */
const isIOS = /iP(hone|od|ad)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = () => window.matchMedia('(display-mode: fullscreen)').matches || window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
function goFull(){ const d = document.documentElement, f = d.requestFullscreen || d.webkitRequestFullscreen; if (!f) return false; try{ const r = f.call(d, { navigationUI:'hide' }); if (r && r.catch) r.catch(() => {}); return true; }catch(e){ return false; } }
function toggleFull(){
  if (fsEl()){ (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
  if (standalone()){ toast('이미 전체 화면이에요'); return; }
  if (!goFull() || isIOS) openPanel('전체 화면으로 하기', '<p class="note" style="font-size:15px;line-height:1.7">아이폰에서는 <b>홈 화면에 추가</b>해서 열면 주소창 없이 전체 화면으로 할 수 있어요.</p><ol style="font-family:var(--f-body);line-height:1.9;padding-left:20px"><li>Safari 아래쪽 <b>공유 버튼</b>(네모에 위 화살표)</li><li><b>홈 화면에 추가</b></li><li>홈 화면에 생긴 <b>도토리 마을</b> 아이콘으로 열기</li></ol><p class="note">안드로이드는 메뉴의 "전체 화면"을 누르거나, Chrome 메뉴 → 홈 화면에 추가 하면 돼요.</p>', { half:true });
}
// first touch in the game → full screen on phones that allow it (Android)
let autoFullTried = false;
document.addEventListener('pointerdown', e => {
  if (autoFullTried || !G.started || isIOS || standalone() || fsEl()) return;
  if (!matchMedia('(pointer: coarse)').matches) return;
  if (e.target.closest('#panel') || e.target.closest('input')) return;
  autoFullTried = true; goFull();
}, true);
['fullscreenchange','webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, () => setTimeout(resize, 120)));
window.addEventListener('orientationchange', () => { setTimeout(resize, 250); setTimeout(resize, 700); });
if (window.visualViewport) window.visualViewport.addEventListener('resize', () => setTimeout(resize, 60));

/* ---------- gifts from the admin (web version) ---------- */
const giftDone = new Set();
function giftLabel(g){
  if (g.kind === 'acorn') return '도토리 ' + g.n + '개';
  if (g.kind === 'item') return (ITEM[g.id] ? ITEM[g.id].name : g.id);
  if (g.kind === 'furn') return (FURN[g.id] ? FURN[g.id].name : g.id) + (g.n > 1 ? ' ' + g.n + '개' : '');
  if (g.kind === 'seed') return (CROPS[g.id] ? CROPS[g.id].name + ' 씨앗' : g.id) + ' ' + g.n + '개';
  return '선물';
}
function applyGifts(v){
  if (!NETON() || !G.started || !G.me || !v) return;
  const got = [], froms = new Set();
  Object.entries(v).forEach(([k, j]) => {
    if (giftDone.has(k)) return; giftDone.add(k);
    let g = null; try{ g = JSON.parse(j); }catch(e){}
    window.DVNet.remove('gifts/' + window.DVNet.session.pid + '/' + k);
    if (!g) return; const n = Math.max(1, Math.min(99999, Math.round(Number(g.n) || 1)));
    if (g.kind === 'acorn') G.me.acorns += n;
    else if (g.kind === 'item' && ITEM[g.id]){ G.me.owned = G.me.owned || {}; G.me.owned[g.id] = 1; if (G.me.broken) delete G.me.broken[g.id]; }
    else if (g.kind === 'furn' && FURN[g.id]){ G.me.furn = G.me.furn || {}; G.me.furn[g.id] = (G.me.furn[g.id] || 0) + n; }
    else if (g.kind === 'seed' && CROPS[g.id]){ G.me.seeds = G.me.seeds || {}; G.me.seeds[g.id] = (G.me.seeds[g.id] || 0) + n; }
    else return;
    got.push(esc(giftLabel(Object.assign({}, g, { n }))) + (g.msg ? ' · "' + esc(String(g.msg).slice(0, 40)) + '"' : '')); if (g.from) froms.add(String(g.from).slice(0, 12)); else froms.add('관리자');
  });
  if (!got.length) return;
  saveMe(true); updateHud(); playSfx && playSfx('jump'); doAnim('cheer');
  const fl = [...froms]; pop('🎁 ' + (fl.length === 1 ? (fl[0] === '관리자' ? '관리자 선물이 도착했어요!' : esc(fl[0]) + '님이 선물을 보냈어요!') : '선물이 도착했어요!'), got.join('<br>') + (fl.length > 1 ? '<br><small>보낸 사람: ' + esc(fl.join(', ')) + '</small>' : ''));
}
let lastGifts = null;
if (window.DVNet) window.DVNet.ready.then(S => window.DVNet.on('gifts/' + S.pid, v => { lastGifts = v; applyGifts(v); }));
Store.on('loaded', () => setTimeout(() => applyGifts(lastGifts), 1500));

/* ---------- village chat (web version) ---------- */
function chatPid(m){ return m && m.p; }
function slotOfPid(p){ const n = Number(String(p || '').slice(1)); return isNaN(n) ? -1 : n; }
function onChat(v){
  const list = Object.entries(v || {}).map(([k, j]) => { let m = null; try{ m = JSON.parse(j); }catch(e){} return m && Object.assign({ k }, m); }).filter(Boolean).sort((a,b) => a.at - b.at);
  const known = new Set(chatMsgs.map(m => m.k));
  const fresh = list.filter(m => !known.has(m.k));
  chatMsgs = list;
  if (!chatFirst) fresh.forEach(m => {
    const s = slotOfPid(m.p), c = chars[s];
    if (c && (c.g.visible || s === G.slot)) chatSay(c, m.t);
    if (s !== G.slot && G.panel !== 'chat'){ chatUnread++; if (!c || !c.g.visible) toast('💬 ' + m.n + ': ' + m.t, 2600); }
  });
  else chatUnread = list.filter(m => m.at > chatSeenAt && slotOfPid(m.p) !== (window.DVNet.session || {}).slot).length;
  chatFirst = false;
  if (G.panel === 'chat') renderChat(); syncMenuDot();
  // keep the history short
  if (list.length > 80 && Math.random() < 0.3) list.slice(0, list.length - 60).forEach(m => window.DVNet.remove('chat/' + m.k));
}
if (window.DVNet) window.DVNet.ready.then(() => window.DVNet.onLast('chat', 60, onChat));
function renderChat(){
  const box = $('#chatList'); if (!box) return; const me = G.slot;
  box.innerHTML = chatMsgs.length ? chatMsgs.map(m => '<div class="chatmsg'+(slotOfPid(m.p) === me ? ' me' : '')+'"><b>'+esc(m.n || '이웃')+' · '+ago(m.at)+'</b>'+esc(m.t)+'</div>').join('') : '<div class="chatmsg sys">아직 대화가 없어요. 첫 인사를 남겨 봐요!</div>';
  box.scrollTop = box.scrollHeight;
}
function openChat(){
  if (!NETON()) return;
  G.panel = 'chat';
  openPanel('마을 채팅', '<div id="chatList" class="chatlist"></div><div class="chatin"><input id="chatTxt" maxlength="100" placeholder="마을 사람들에게 말하기" enterkeyhint="send" autocomplete="off"><button class="go" id="chatSend">보내기</button></div><p class="note">말하면 내 캐릭터 머리 위에도 말풍선이 떠요.</p>', { half:true });
  chatUnread = 0; chatSeenAt = Date.now(); LS.set('dv.chatSeen', chatSeenAt); syncMenuDot(); renderChat();
  const send = () => { const t = $('#chatTxt').value.trim(); if (!t) return; $('#chatTxt').value = '';
    window.DVNet.push('chat', JSON.stringify({ p:window.DVNet.session.pid, n:G.me.name, t:t.slice(0, 100), at:Date.now() })); };
  $('#chatSend').addEventListener('click', send);
  $('#chatTxt').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' && !e.isComposing){ e.preventDefault(); send(); } });
}
// speech bubbles over players
function chatSay(c, text){
  if (!c.bub){ c.bub = document.createElement('div'); c.bub.className = 'say chat'; $('#labels').appendChild(c.bub); }
  c.bub.textContent = text; c.bub.hidden = false; c.bubUntil = performance.now() + Math.max(5000, text.length*180);
}
function chatBubbleTick(){
  const now = performance.now(), W = window.innerWidth, H = window.innerHeight;
  Object.values(chars).forEach(c => { const b = c.bub; if (!b || b.hidden) return;
    if (now > c.bubUntil || !c.g.visible || G.focus){ b.hidden = true; return; }
    _v.set(c.g.position.x, c.g.position.y + 2.3, c.g.position.z).project(cam); if (_v.z > 1){ b.style.left = '-999px'; return; }
    b.style.left = ((_v.x+1)/2*W)+'px'; b.style.top = ((1-_v.y)/2*H)+'px'; });
}
// name labels sit a bit higher while a bubble is showing → keep both readable
const _featTick9b = featTick;
featTick = function(dt, tsec){ _featTick9b(dt, tsec); chatBubbleTick(); };

/* ---------- catalog for the admin page (used at build time) ---------- */
window.DV_CATALOG = () => ({
  items: SHOP.filter(it => it.price > 0 || it.cat === 'set' || it.cat === 'acc' || it.hw).map(it => ({ id:it.id, name:it.name, cat:(CATS.find(c => c[0] === it.cat) || [it.cat, it.cat])[1], price:it.price })),
  furn: Object.entries(FURN).filter(([id,f]) => !f.fixture && f.price).map(([id,f]) => ({ id, name:f.name, price:f.price })),
  seeds: Object.entries(CROPS).map(([id,c]) => ({ id, name:c.name + ' 씨앗', price:c.seed })),
});

/* ---------- choose your own name (web version): asked once on the next visit, changeable in settings ---------- */
function openNamePick(after){
  G.panel = 'name';
  openPanel('내 이름 정하기', '<p class="note" style="font-size:15px">마을에서 불릴 이름을 직접 정해 주세요. 나중에 설정에서도 바꿀 수 있어요.</p>'+
    '<div class="chatin"><input id="namePick" maxlength="8" value="'+esc(G.me.name || '')+'" placeholder="이름 (8자까지)" autocomplete="off" enterkeyhint="done"><button class="go" id="nameOk">이 이름으로!</button></div><p class="note" id="nameMsg"></p>', { half:true, closeLabel:'나중에' });
  const ok = () => { const v = $('#namePick').value.trim().replace(/\s+/g, ' '); if (!v){ $('#nameMsg').textContent = '이름을 적어 주세요'; return; }
    G.me.name = v.slice(0, 8); G.me.nameSet = true; saveMe(true); updateHud && updateHud(); closePanel(); toast(G.me.name + '(으)로 정했어요!', 2000); if (after) setTimeout(after, 250); };
  $('#nameOk').addEventListener('click', ok);
  $('#namePick').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' && !e.isComposing){ e.preventDefault(); ok(); } });
  setTimeout(() => { try{ $('#namePick').focus(); $('#namePick').select(); }catch(e){} }, 200);
}
Store.on('loaded', () => {
  if (!NETON()) return;
  setTimeout(() => {
    if (!G.started || !G.me || G.me.nameSet) return;
    const needMirror = !G.me.made || G.panel === 'mirror';
    if (G.panel) closePanel();
    openNamePick(needMirror ? openMirror : null);
  }, 700);
});
// settings: renaming there also counts as choosing a name
const _openSettings9b = openSettings;
openSettings = function(){
  _openSettings9b();
  const b = $('#saveName'); if (!b) return; const nb = b.cloneNode(true); b.replaceWith(nb);
  nb.addEventListener('click', () => { const v = $('#myname').value.trim(); if (!v){ toast('이름을 적어 주세요'); return; } G.me.name = v.slice(0, 8); G.me.nameSet = true; saveMe(true); toast('이름을 '+G.me.name+'(으)로 바꿨어요'); });
};

/* ---------- name signs in front of every player's house ---------- */
const houseSignCache = {};
function houseSignName(slot){
  const p = Store.data.players[pid(slot)];
  if (slot === G.slot && G.me) return G.me.name;
  if (p && p.name) return p.name;
  return NETON() ? '' : SLOTS[slot].name; // web: nobody lives here yet
}
function refreshHouseSigns(force){
  BUILD.forEach(b => {
    if (b.kind !== 'house') return; const g = objMeshes.get(b.id); if (!g) return;
    const name = houseSignName(b.slot), label = name ? name + '네 집' : '빈 집', key = label + '|' + ROOFS[b.slot];
    if (!force && g.userData.signKey === key && g.userData.sign && g.userData.sign.parent === g) return;
    if (g.userData.sign){ g.remove(g.userData.sign); g.userData.sign.traverse(o => { if (o.material && o.material.map) o.material.map.dispose(); }); }
    const s = new THREE.Group();
    M(GC('hsPost', () => new THREE.CylinderGeometry(0.05, 0.06, 0.95, 8)), '#b9875c', 0, 0.47, 0, s);
    M(GC('hsBoard', () => new THREE.BoxGeometry(1.42, 0.42, 0.07)), '#fff6e8', 0, 1.02, 0, s);
    M(GC('hsTrim', () => new THREE.BoxGeometry(1.5, 0.08, 0.09)), ROOFS[b.slot], 0, 1.26, 0, s);
    const fg = name ? '#5b4b78' : '#a89cbf';
    [1, -1].forEach(side => { const pl = signMesh(label, 1.3, 0.33, '#fff6e8', fg); pl.position.set(0, 1.02, 0.04*side); if (side < 0) pl.rotation.y = Math.PI; s.add(pl); });
    s.position.set(1.15, 0, 1.75); s.rotation.y = -0.15;
    s.traverse(o => { o.userData.key = b.id; });
    g.add(s); g.userData.sign = s; g.userData.signKey = key;
  });
}
const _buildWorld9 = buildWorld;
buildWorld = function(){ _buildWorld9.apply(this, arguments); refreshHouseSigns(true); };
Store.on('players', () => refreshHouseSigns());
Store.on('loaded', () => setTimeout(() => refreshHouseSigns(), 300));
const _saveMe9 = saveMe;
saveMe = function(now){ _saveMe9(now); if (G.me && houseSignCache.last !== G.me.name){ houseSignCache.last = G.me.name; refreshHouseSigns(); } };
refreshHouseSigns(true);
