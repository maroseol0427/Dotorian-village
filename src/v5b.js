/* ---------- shop interiors: goods on display, clerks behind counters ---------- */
const SHOP_ROOMS = {
  mall:{ w:14, d:10, wall:'wall_pink', floor:'floor_check', title:'몽실 쇼핑몰', titleC:'#e86a92', clerk:'mong', clerkAt:[11,5], items:[
    { id:'rack', x:0, z:0, show:'cat:top', tag:'상의' }, { id:'rack', x:2, z:0, show:'cat:bottom', tag:'하의' },
    { id:'mannequin', x:5, z:0, show:'cat:set', set:'dino' }, { id:'mannequin', x:6, z:0, show:'cat:set', set:'princess', tag:'세트 옷' }, { id:'mannequin', x:7, z:0, show:'cat:set', set:'astro' },
    { id:'rack', x:9, z:0, show:'cat:back', tag:'등' }, { id:'fitting', x:12, z:0, show:'fitting', tag:'탈의실' },
    { id:'shelf2', x:0, z:3, show:'cat:hat', tag:'모자' }, { id:'shelf1', x:3, z:3, show:'cat:face', tag:'안경' }, { id:'shelf2', x:5, z:3, show:'cat:shoes', tag:'신발' },
    { id:'dtable', x:8, z:3, show:'cat:hand', tag:'손' }, { id:'dtable', x:11, z:3, show:'cat:music', tag:'악기' },
    { id:'ridestage', x:0, z:6, show:'ride:bike' }, { id:'ridestage', x:2, z:6, show:'ride:scooter', tag:'탈것' }, { id:'carstage', x:4, z:6, show:'ride:car' },
    { id:'counter3', x:10, z:6, show:'clerk' }, { id:'plant', x:13, z:8 }, { id:'plant', x:0, z:9 }, { id:'rug_round', x:7, z:5 },
  ] },
  shop:{ w:14, d:10, wall:'wall_wood', floor:'floor_wood', title:'모모네 잡화점', titleC:'#e8907a', clerk:'momo', clerkAt:[0,5], items:[
    { id:'wardrobe', x:0, z:0 }, { id:'bookshelf', x:1, z:0 }, { id:'fridge', x:2, z:0 }, { id:'kitchen', x:3, z:0 }, { id:'piano', x:5, z:0 }, { id:'tv', x:7, z:0 }, { id:'xmas', x:8, z:0 }, { id:'harp', x:9, z:0 }, { id:'mirror', x:10, z:0 }, { id:'aquarium', x:11, z:0 }, { id:'lamp', x:12, z:0 },
    { id:'board', x:13, z:0, show:'deco', tag:'벽지' },
    { id:'garland', x:5, z:0 }, { id:'clock', x:7, z:0 }, { id:'frame', x:11, z:0 }, { id:'window', x:13, z:0 },
    { id:'bed', x:0, z:3 }, { id:'sofa', x:1, z:3 }, { id:'desk', x:3, z:3 }, { id:'table', x:5, z:3 }, { id:'chair', x:6, z:3 }, { id:'plant', x:7, z:3 }, { id:'cactus', x:8, z:3 }, { id:'teddy', x:9, z:3 }, { id:'globe', x:10, z:3 }, { id:'jack', x:11, z:3 }, { id:'drums', x:12, z:3 },
    { id:'counter2', x:0, z:6, show:'clerk' }, { id:'xylophone', x:3, z:6 }, { id:'rug_round', x:5, z:6 }, { id:'rug_check', x:7, z:6 },
    { id:'shelf2', x:9, z:6, show:'seeds', tag:'씨앗' }, { id:'shelf2', x:11, z:6, show:'tools', tag:'도구' },
  ] },
  bank:{ w:8, d:6, wall:'wall_lav', floor:'floor_stone', title:'도토리 은행', titleC:'#5fb894', clerk:'coco', clerkAt:[3,1], items:[
    { id:'vault', x:0, z:0 }, { id:'plant', x:6, z:0 }, { id:'atm', x:7, z:0, show:'bank', tag:'ATM' }, { id:'counter4', x:2, z:2, show:'clerk' },
    { id:'bench2', x:0, z:4 }, { id:'bench2', x:6, z:4 }, { id:'rug_round', x:3, z:3 }, { id:'clock', x:3, z:0 },
  ] },
  cafe:{ w:8, d:6, wall:'wall_mint', floor:'floor_check', title:'보보 카페', titleC:'#5fb894', clerk:'bobo', clerkAt:[1,0], items:[
    { id:'cafebar', x:0, z:1, show:'clerk' }, { id:'showcase', x:5, z:0, show:'menu', tag:'메뉴' }, { id:'plant', x:7, z:0 },
    { id:'table', x:6, z:3 }, { id:'chair', x:5, z:3, r:1 }, { id:'chair', x:7, z:3, r:3 }, { id:'table', x:1, z:4 }, { id:'chair', x:0, z:4, r:1 }, { id:'chair', x:2, z:4, r:3 }, { id:'frame', x:5, z:0 }, { id:'window', x:2, z:0 },
  ] },
  depot:{ w:10, d:6, wall:'wall_stripe', floor:'floor_stone', title:'팡팡 물류센터', titleC:'#7a6aa0', clerk:'pang', clerkAt:[6,1], items:[
    { id:'conveyor', x:0, z:1, show:'jobs', tag:'분류 레일' }, { id:'boxes', x:0, z:0 }, { id:'boxes', x:2, z:0 }, { id:'boxes', x:4, z:0 },
    { id:'counter2', x:6, z:2, show:'clerk' }, { id:'boxes', x:9, z:0 }, { id:'boxes', x:9, z:1 }, { id:'boxes', x:8, z:0 }, { id:'bench2', x:0, z:4 }, { id:'clock', x:6, z:0 },
  ] },
};
const SHOP_SVC = { mall:'옷 구경하기', shop:'사고팔기', bank:'은행 업무', cafe:'알바하기', depot:'일하기' };
const SHOP_NAME = { mall:'몽실 쇼핑몰', shop:'모모네 잡화점', bank:'도토리 은행', cafe:'보보 카페', depot:'팡팡 물류센터' };
SHOP_ROOMS.shop.items.forEach(it => { if (!it.show && FURN[it.id] && !FURN[it.id].fixture) it.show = 'f:'+it.id; });
function npcModel(n, mode){
  if (n.bunny) return Char3D.bunny(THREE, mode ? Object.assign({}, n.bunny, { eyes: mode === 'sleep' ? 'closed' : 'ouch' }) : n.bunny);
  const L = npcLook(n); if (mode === 'sleep'){ L.eyes = 'closed'; L.mouth = 'smile'; } else if (mode === 'ouch'){ L.eyes = 'ouch'; L.mouth = 'wavy'; }
  return Char3D.build(THREE, L);
}
function clerkPresent(n){ const h = hourNow(); return h >= n.hours[0] && h < n.hours[1]; }
function makeLabel(text){ const l = document.createElement('div'); l.className = 'lbl npc'; l.textContent = text; $('#labels').appendChild(l); return l; }
function enterShop(kind){
  const R = SHOP_ROOMS[kind], b = BY[kind], n = NPC_BY[R.clerk];
  const home = { wall:R.wall, floor:R.floor, title:R.title, titleC:R.titleC, items:R.items.map(o => Object.assign({ r:0 }, o)) };
  IW = R.w; ID = R.d;
  let clerkNp = null;
  if (clerkPresent(n)){
    const g = new THREE.Group(), model = npcModel(n); g.add(model); g.traverse(o => { o.userData.clerk = true; });
    clerkNp = { n, g, model, x:iwx(R.clerkAt[0]), z:iwz(R.clerkAt[1]), i:-1, j:-1, path:[], face:0, walkT:0, talking:false, sleep:false, clerk:true, lbl:makeLabel(n.name) };
  }
  enterRoom({ kind:'shop', shop:kind, own:false, canEdit:false, home, b, w:R.w, d:R.d, clerkNp, clerkCell: clerkNp ? R.clerkAt : null });
  if (!G.rescue) toast(clerkNp ? (R.hello || n.name+': 어서 오세요! 진열된 물건을 바라보고 행동 버튼을 눌러 보세요') : SHOP_NAME[kind]+' · '+n.name+'은(는) 퇴근했어요. 계산대에서 셀프로 이용할 수 있어요', 2600);
}
const _exitHouse0 = exitHouse;
exitHouse = function(){ if (G.inside && G.inside.clerkNp && G.inside.clerkNp.lbl) G.inside.clerkNp.lbl.remove(); if (G.inside && G.inside.ownerNp && G.inside.ownerNp.lbl) G.inside.ownerNp.lbl.remove(); _exitHouse0(); };
function shopService(kind){
  if (kind === 'mall'){ shopCat = shopCat || 'top'; openShop(); }
  else if (kind === 'shop') openStore();
  else if (kind === 'bank') openBank();
  else if (kind === 'cafe') openJobs('cafe');
  else if (kind === 'depot') openJobs('depot');
}
function showLabel(it){
  const s = it.show || '';
  if (s.startsWith('cat:')){ const c = CATS.find(x => x[0]===s.slice(4)); return (c ? c[1] : '')+' 보기'; }
  if (s.startsWith('ride:')) return '타 보기';
  if (s.startsWith('f:')) return '구경';
  return { fitting:'입어 보기', seeds:'씨앗', tools:'도구', deco:'벽지 보기', clerk: G.inside && G.inside.clerkNp ? '말 걸기' : '셀프 계산', bank:'ATM', menu:'메뉴', jobs:'일하기' }[s] || '보기';
}
function showAct(it){
  const s = it.show || '';
  if (s.startsWith('cat:')){ shopCat = s.slice(4); G.preview = null; return openShop(); }
  if (s.startsWith('ride:')){ shopCat = 'ride'; G.preview = s.slice(5); previewItem(G.preview); return openShop(); }
  if (s.startsWith('f:')){ storeSel = 'f:'+s.slice(2); shopTab = 'furn'; return openStore(); }
  if (s === 'fitting') return openWardrobe();
  if (s === 'seeds'){ shopTab = 'seed'; storeSel = null; return openStore(); }
  if (s === 'tools'){ shopTab = 'tool'; storeSel = null; return openStore(); }
  if (s === 'deco'){ shopTab = 'deco'; storeSel = null; return openStore(); }
  if (s === 'bank') return openBank();
  if (s === 'menu') return openCafeMenu();
  if (s === 'jobs') return openJobs('depot');
  if (s === 'clerk'){ if (G.inside.clerkNp) return talkTo(G.inside.clerkNp); return shopService(G.inside.shop); }
}
function openCafeMenu(){
  G.panel = 'menu'; ensureDaily(); const d = G.me.daily; d.drinks = d.drinks || 0;
  const MENU = [['ame','아메리카노',10,10],['latte','꿀 라떼',15,16],['straw','딸기우유',15,16],['citrus','꿀 귤차',25,30]];
  openPanel('보보 카페 메뉴', '<p class="note">음료를 마시면 체력이 회복돼요. 하루에 3잔까지 마실 수 있어요. (오늘 '+d.drinks+'잔)</p><div class="grid">'+MENU.map(([k,n,p,st]) => '<div class="cell'+(d.drinks>=3?' no':'')+'" data-drink="'+k+'">'+n+'<b>도토리 '+p+' · 체력 +'+st+'</b></div>').join('')+'</div>', { half:true });
  $('#pbody').querySelectorAll('[data-drink]').forEach(c => c.addEventListener('click', () => {
    const m = MENU.find(x => x[0]===c.dataset.drink); if (d.drinks >= 3){ toast('오늘은 많이 마셨어요. 내일 또 와요'); return; }
    if (G.me.acorns < m[2]){ toast('도토리가 모자라요'); return; }
    regenStamina(); spend(m[2]); G.me.stamina = Math.min(ECON.stamMax, G.me.stamina + m[3]); d.drinks++; saveMe(); updateHud(); pop(m[1], '체력 +'+m[3]+'<br><small>보보: 맛있게 마셔요, 곰!</small>'); openCafeMenu();
  }));
}

/* ---------- fixture & instrument meshes ---------- */
const catItems = cat => SHOP.filter(it => it.cat===cat && it.price > 0);
const itemColor = it => { const v = it.v || {}; return v.c1 || v.c || (v.top && v.top.c1) || '#ffffff'; };
function fixMesh(it){
  const g = new THREE.Group(), id = it.id, F = FURN[id], show = it.show || '';
  const cat = show.startsWith('cat:') ? show.slice(4) : null;
  if (id.startsWith('counter') || id === 'cafebar'){
    const w = F.w; M(new THREE.BoxGeometry(w-0.05, 0.85, 0.62), id==='cafebar' ? '#e2f4ea' : '#fff4e8', (w-1)/2, 0.43, 0, g);
    M(new THREE.BoxGeometry(w+0.05, 0.07, 0.72), id==='cafebar' ? '#ffffff' : '#f2dcc2', (w-1)/2, 0.89, 0, g);
    M(new THREE.BoxGeometry(w-0.2, 0.5, 0.03), id==='counter4' ? '#cdbcf2' : id==='cafebar' ? '#9fdcc4' : '#ffc8b4', (w-1)/2, 0.45, 0.32, g);
    if (id === 'cafebar'){ M(new THREE.BoxGeometry(0.4,0.42,0.35), '#c8c0d8', 0.2, 1.12, -0.05, g); M(new THREE.CylinderGeometry(0.05,0.05,0.08,10), '#ffffff', 0.2, 0.97, 0.12, g); [1.3,1.5,1.7].forEach((x,k) => M(new THREE.CylinderGeometry(0.06,0.05,0.12,12), ['#ffb7c9','#ffe6a3','#ffffff'][k], x, 0.98, 0.05, g)); M(new THREE.SphereGeometry(0.1,12,10), '#f2c08a', 2.4, 0.98, 0, g).scale.set(1.3,0.6,1.3); }
    else if (id === 'counter4'){ M(new THREE.BoxGeometry(w-0.1, 0.5, 0.04), new THREE.MeshToonMaterial({ color:'#d8f0fa', gradientMap:GRAD, transparent:true, opacity:0.45 }), (w-1)/2, 1.17, 0.1, g); M(new THREE.BoxGeometry(0.3,0.04,0.2), '#ffffff', 0.5, 0.94, 0, g); M(new THREE.CylinderGeometry(0.06,0.06,0.06,12), '#ffe08a', 1.5, 0.95, 0.1, g); }
    else { M(new THREE.BoxGeometry(0.36,0.22,0.3), '#cdbcf2', 0.1, 1.04, -0.05, g); M(new THREE.BoxGeometry(0.28,0.14,0.02), '#d8f0fa', 0.1, 1.14, 0.11, g); M(new THREE.SphereGeometry(0.06,10,8), '#ffe08a', (w-1)/2+0.5, 0.97, 0.12, g); }
  } else if (id === 'rack'){
    [-0.4, 1.4].forEach(x => M(new THREE.CylinderGeometry(0.03,0.03,1.5,8), '#d8c8e8', x, 0.75, 0, g)); M(new THREE.CylinderGeometry(0.025,0.025,1.9,8), '#d8c8e8', 0.5, 1.48, 0, g).rotation.z = Math.PI/2;
    [-0.4,1.4].forEach(x => M(new THREE.BoxGeometry(0.3,0.04,0.4), '#d8c8e8', x, 0.02, 0, g));
    catItems(cat).slice(0, 8).forEach((s,k) => { const x = -0.25 + k*0.22, c = itemColor(s), c2 = (s.v && s.v.c2) || shade(c, 0.92); const hg = new THREE.Group(); hg.position.set(x, 1.42, 0); hg.rotation.y = 1.25; g.add(hg);
      M(new THREE.TorusGeometry(0.05,0.008,4,10,Math.PI), '#bfb2d6', 0, 0.02, 0, hg);
      if (cat === 'bottom'){ M(new THREE.BoxGeometry(0.2,0.06,0.04), c, 0, -0.06, 0, hg); [-0.05,0.05].forEach(o => M(new THREE.BoxGeometry(0.08,0.32,0.04), c, o, -0.25, 0, hg)); }
      else if (cat === 'back'){ M(new THREE.SphereGeometry(0.12,10,8), c, 0, -0.18, 0, hg).scale.set(1,1.2,0.5); }
      else { M(new THREE.BoxGeometry(0.24,0.34,0.05), c, 0, -0.2, 0, hg); M(new THREE.BoxGeometry(0.34,0.1,0.05), c, 0, -0.08, 0, hg); M(new THREE.BoxGeometry(0.06,0.05,0.055), c2, 0, -0.06, 0.005, hg); } });
  } else if (id === 'mannequin'){
    M(new THREE.CylinderGeometry(0.28,0.3,0.08,20), '#f2dcc2', 0, 0.04, 0, g);
    const m = Char3D.build(THREE, lookOf({ look:{ skin:'#f6efe6', hair:'short', hairColor:'#f6efe6', eyes:'dot', mouth:'smile' }, wear:{ set:it.set||'dress_red' } })); m.position.y = 0.08; g.add(m);
  } else if (id === 'shelf2' || id === 'shelf1'){
    const w = F.w; [0.3, 0.75].forEach(y => M(new THREE.BoxGeometry(w-0.1, 0.05, 0.5), '#fff4e8', (w-1)/2, y, 0, g));
    [-0.45, w-0.55].forEach(x => M(new THREE.BoxGeometry(0.05, 0.8, 0.5), '#f2dcc2', x, 0.4, 0, g)); M(new THREE.BoxGeometry(w-0.05, 0.05, 0.5), '#f2dcc2', (w-1)/2, 0.02, 0, g);
    let list = []; if (cat) list = catItems(cat).map(s => ({ c:itemColor(s), kind:cat }));
    if (show === 'seeds') list = Object.entries(CROPS).map(([k,c]) => ({ c:c.c, kind:'seed' }));
    if (show === 'tools') list = [{ c:'#9fdcc4', kind:'net' }, { c:'#c8a088', kind:'shovel' }, { c:'#8fc8f0', kind:'can' }];
    const per = Math.max(1, Math.ceil(list.length/2)); list.slice(0, 12).forEach((o,k) => { const row = Math.floor(k/per), col = k%per; const x = -0.35 + (col+0.5)*((w-0.3)/per), y = row ? 0.8 : 0.35;
      if (o.kind === 'hat'){ M(new THREE.SphereGeometry(0.1,12,8,0,Math.PI*2,0,Math.PI/2), o.c, x, y+0.02, 0, g); M(new THREE.CylinderGeometry(0.14,0.14,0.015,14), o.c, x, y+0.03, 0.02, g); }
      else if (o.kind === 'face'){ [-0.05,0.05].forEach(d => M(new THREE.TorusGeometry(0.04,0.01,6,12), o.c, x+d, y+0.06, 0, g)); }
      else if (o.kind === 'shoes'){ [-0.04,0.05].forEach(d => M(new THREE.BoxGeometry(0.07,0.06,0.14), o.c, x+d, y+0.05, 0, g)); }
      else if (o.kind === 'seed'){ M(new THREE.BoxGeometry(0.13,0.17,0.04), '#fff4e0', x, y+0.1, 0, g); M(new THREE.SphereGeometry(0.035,8,6), o.c, x, y+0.12, 0.025, g); }
      else if (o.kind === 'net'){ M(new THREE.CylinderGeometry(0.012,0.012,0.4,6), '#c8a088', x, y+0.2, 0, g).rotation.z = 0.3; M(new THREE.TorusGeometry(0.07,0.01,6,12), o.c, x+0.07, y+0.38, 0, g); }
      else if (o.kind === 'shovel'){ M(new THREE.CylinderGeometry(0.012,0.012,0.3,6), '#c8a088', x, y+0.2, 0, g); M(new THREE.BoxGeometry(0.1,0.12,0.02), '#c8c0d8', x, y+0.05, 0, g); }
      else if (o.kind === 'can'){ M(new THREE.CylinderGeometry(0.07,0.08,0.13,12), o.c, x, y+0.08, 0, g); M(new THREE.CylinderGeometry(0.012,0.02,0.14,6), o.c, x+0.1, y+0.12, 0, g).rotation.z = -0.9; }
      else M(new THREE.SphereGeometry(0.06,10,8), o.c, x, y+0.07, 0, g); });
  } else if (id === 'dtable'){
    M(new THREE.BoxGeometry(1.8,0.07,0.6), '#fff4e8', 0.5, 0.62, 0, g); [-0.3,1.3].forEach(x => M(new THREE.BoxGeometry(0.08,0.6,0.5), '#f2dcc2', x, 0.3, 0, g));
    catItems(cat).slice(0, 7).forEach((s,k) => { const x = -0.25 + k*0.25, c = itemColor(s), st = s.v.style;
      if (cat === 'music'){ if (st==='tambourine') M(new THREE.TorusGeometry(0.08,0.02,6,14), c, x, 0.7, 0, g).rotation.x = Math.PI/2; else if (st==='flute' || st==='trumpet'){ M(new THREE.CylinderGeometry(0.015,0.015,0.32,8), c, x, 0.68, 0, g).rotation.x = Math.PI/2; if (st==='trumpet') M(new THREE.ConeGeometry(0.05,0.08,12,1,true), c, x, 0.68, 0.18, g).rotation.x = -Math.PI/2; } else if (st==='maracas'){ M(new THREE.SphereGeometry(0.05,10,8), c, x, 0.72, 0, g); } else { const b = M(new THREE.SphereGeometry(0.08,12,10), c, x, 0.7, 0, g); b.scale.set(1,0.4,1.3); M(new THREE.BoxGeometry(0.03,0.02,0.22), '#8a5a34', x, 0.71, -0.18, g); } }
      else if (st === 'balloon'){ M(new THREE.CylinderGeometry(0.003,0.003,0.5,4), '#ffffff', x, 0.9, 0, g); M(new THREE.SphereGeometry(0.1,12,10), c, x, 1.2, 0, g).scale.set(1,1.15,1); }
      else if (st === 'umbrella'){ M(new THREE.CylinderGeometry(0.01,0.01,0.5,6), '#5a4a3a', x, 0.9, 0, g); M(new THREE.ConeGeometry(0.2,0.12,10), c, x, 1.15, 0, g); }
      else M(new THREE.SphereGeometry(0.06,10,8), c, x, 0.71, 0, g); });
  } else if (id === 'ridestage' || id === 'carstage'){
    const w = F.w; M(new THREE.CylinderGeometry(w===2?0.95:0.5, w===2?0.98:0.52, 0.1, 24), '#ffe6f0', (w-1)/2, 0.05, 0.5, g);
    const rid = show.slice(5), v = vehicleMesh(rid); if (v){ v.position.set((w-1)/2, 0.1, 0.5); v.rotation.y = 0.6; g.add(v); }
  } else if (id === 'fitting'){
    [-0.45, 1.45].forEach(x => M(new THREE.CylinderGeometry(0.03,0.03,2.0,8), '#d8c8e8', x, 1.0, 0, g)); M(new THREE.CylinderGeometry(0.025,0.025,1.95,8), '#d8c8e8', 0.5, 2.0, 0, g).rotation.z = Math.PI/2;
    for (let k=0;k<6;k++) M(new THREE.CylinderGeometry(0.09,0.09,1.75,10,1,true), '#ffc6d6', -0.38 + k*0.13, 1.05, 0, g);
    M(new THREE.CapsuleGeometry(0.25,0.9,6,16), '#f6e2cc', 1.1, 1.0, -0.15, g).scale.set(1,1,0.15); M(new THREE.CapsuleGeometry(0.2,0.82,6,16), new THREE.MeshToonMaterial({ color:'#d8f0fa', gradientMap:GRAD, emissive:'#203040' }), 1.1, 1.0, -0.12, g).scale.set(1,1,0.1);
  } else if (id === 'board'){
    M(new THREE.BoxGeometry(0.8,1.0,0.06), '#fff4e8', 0, 0.9, -0.1, g); [-0.3,0.3].forEach(x => M(new THREE.CylinderGeometry(0.025,0.025,1.0,6), '#c8a088', x, 0.45, 0.05, g).rotation.x = -0.15);
    Object.values(WALLS).concat(Object.values(FLOORS)).slice(0, 9).forEach((d,k) => M(new THREE.BoxGeometry(0.2,0.2,0.02), d.c2 || d.c, -0.24 + (k%3)*0.24, 1.18 - Math.floor(k/3)*0.25, -0.06, g));
  } else if (id === 'showcase'){
    M(new THREE.BoxGeometry(1.8,0.7,0.55), '#fff4e8', 0.5, 0.35, 0, g); M(new THREE.BoxGeometry(1.8,0.45,0.55), new THREE.MeshToonMaterial({ color:'#d8f0fa', gradientMap:GRAD, transparent:true, opacity:0.4 }), 0.5, 0.93, 0, g);
    [['#ffb7c9',-0.1],['#f2c08a',0.35],['#ffffff',0.8],['#c8a088',1.15]].forEach(([c,x]) => { M(new THREE.CylinderGeometry(0.12,0.12,0.12,14), c, x, 0.78, 0, g); M(new THREE.SphereGeometry(0.03,8,6), '#ff5a6e', x, 0.86, 0, g); });
  } else if (id === 'conveyor'){
    M(new THREE.BoxGeometry(4.9,0.12,0.7), '#8a86a8', 2, 0.55, 0, g); for (let k=0;k<5;k++) M(new THREE.BoxGeometry(0.1,0.55,0.6), '#c8c0d8', k, 0.27, 0, g);
    ['#ef9a9a','#9ab8ef','#f2d08a','#9fdcb4'].forEach((c,k) => M(new THREE.BoxGeometry(0.35,0.3,0.35), '#f2d6a8', 0.4+k*1.1, 0.77, 0, g) && M(new THREE.BoxGeometry(0.2,0.05,0.36), c, 0.4+k*1.1, 0.8, 0, g));
  } else if (id === 'boxes'){
    M(new THREE.BoxGeometry(0.6,0.5,0.6), '#f2d6a8', 0, 0.25, 0, g); M(new THREE.BoxGeometry(0.45,0.4,0.45), '#e8c896', 0.05, 0.7, 0.02, g); M(new THREE.BoxGeometry(0.62,0.06,0.12), '#d8b888', 0, 0.5, 0, g);
  } else if (id === 'vault'){
    M(new THREE.BoxGeometry(1.8,1.6,0.5), '#d8d0e8', 0.5, 0.8, -0.1, g); M(new THREE.CylinderGeometry(0.55,0.55,0.12,24), '#c8c0d8', 0.5, 0.85, 0.2, g).rotation.x = Math.PI/2; M(new THREE.TorusGeometry(0.25,0.04,6,16), '#ffe08a', 0.5, 0.85, 0.28, g);
  } else if (id === 'atm'){
    M(new THREE.BoxGeometry(0.75,1.4,0.55), '#9fdcc4', 0, 0.7, -0.05, g); M(new THREE.BoxGeometry(0.5,0.32,0.04), new THREE.MeshToonMaterial({ color:'#d8f0fa', emissive:'#20404a', gradientMap:GRAD }), 0, 1.0, 0.23, g); M(new THREE.BoxGeometry(0.4,0.04,0.1), '#5b4b78', 0, 0.7, 0.25, g);
  } else if (id === 'bench2'){
    M(new THREE.BoxGeometry(1.8,0.08,0.45), '#e0b898', 0.5, 0.42, 0, g); M(new THREE.BoxGeometry(1.8,0.3,0.06), '#e0b898', 0.5, 0.7, -0.2, g); [-0.3,1.3].forEach(x => M(new THREE.BoxGeometry(0.08,0.42,0.4), '#c8a088', x, 0.21, 0, g));
  }
  return g;
}
function extraMesh(id, g){
  if (id === 'drums'){
    M(new THREE.CylinderGeometry(0.32,0.32,0.4,20), '#ffffff', 0.5, 0.3, 0, g).rotation.x = Math.PI/2; M(new THREE.TorusGeometry(0.32,0.03,6,20), '#ff8fa6', 0.5, 0.3, 0.2, g);
    [[-0.05,0.62],[1.05,0.62]].forEach(([x,y]) => { M(new THREE.CylinderGeometry(0.17,0.17,0.15,16), '#ffb7c9', x, y, 0.1, g); M(new THREE.CylinderGeometry(0.015,0.015,y,6), '#c8c0d8', x, y/2, 0.1, g); });
    M(new THREE.CylinderGeometry(0.2,0.2,0.015,18), '#ffe08a', 1.2, 1.0, -0.15, g); M(new THREE.CylinderGeometry(0.012,0.012,1.0,6), '#c8c0d8', 1.2, 0.5, -0.15, g);
  } else if (id === 'harp'){
    M(new THREE.BoxGeometry(0.35,0.12,0.3), '#e6c070', 0, 0.06, 0, g); const arc = M(new THREE.TorusGeometry(0.5,0.05,8,20,Math.PI*0.75), '#f2cf7a', 0.05, 0.75, 0, g); arc.rotation.z = Math.PI*0.3;
    M(new THREE.CylinderGeometry(0.05,0.06,1.25,10), '#e6c070', -0.15, 0.68, 0, g).rotation.z = 0.12; for (let k=0;k<6;k++) M(new THREE.CylinderGeometry(0.006,0.006,0.5+k*0.08,4), '#fffaf0', -0.05+k*0.07, 0.55+k*0.03, 0, g);
  } else if (id === 'xylophone'){
    [-0.3,1.3].forEach(x => M(new THREE.BoxGeometry(0.06,0.5,0.4), '#e6c8a6', x, 0.25, 0, g));
    ['#ff8fa6','#ffb36a','#ffe07a','#9fdcb4','#8fc8f0','#b8a8f0','#f0a8d8'].forEach((c,k) => M(new THREE.BoxGeometry(0.17,0.05,0.42-k*0.03), c, -0.2+k*0.23, 0.52, 0, g));
  }
}

/* ---------- second little renderer for item previews ---------- */
const PV = { r:null, scene:null, cam:null, holder:null, cv:null, on:false, w:0, h:0 };
function pvInit(){
  if (PV.r) return true;
  try{
    const cv = document.createElement('canvas'); cv.className = 'pvcv'; PV.cv = cv;
    PV.r = new THREE.WebGLRenderer({ canvas:cv, antialias:true, alpha:true }); PV.r.setPixelRatio(Math.min(2, window.devicePixelRatio||1));
    PV.scene = new THREE.Scene(); PV.scene.add(new THREE.HemisphereLight(0xffffff, 0xe0d8ee, 0.75)); const dl = new THREE.DirectionalLight(0xfff4e8, 0.55); dl.position.set(2,4,3); PV.scene.add(dl);
    PV.cam = new THREE.PerspectiveCamera(28, 1.6, 0.1, 60); PV.holder = new THREE.Group(); PV.scene.add(PV.holder);
    return true;
  }catch(e){ PV.r = null; return false; }
}
function pvObject(kind, id){
  if (kind === 'f') return furnMesh(id);
  if (kind === 'd'){ const g = new THREE.Group(), d = WALLS[id] || FLOORS[id]; const m = new THREE.Mesh(new THREE.BoxGeometry(1.4, WALLS[id] ? 1.1 : 0.08, WALLS[id] ? 0.08 : 1.4), new THREE.MeshToonMaterial({ map:patTex(d, 1, 1), gradientMap:GRAD })); m.position.y = WALLS[id] ? 0.55 : 0.04; g.add(m); return g; }
  if (kind === 't'){ const g = new THREE.Group();
    if (id === 'net'){ M(new THREE.CylinderGeometry(0.025,0.025,1.0,8), '#c8a088', 0, 0.5, 0, g).rotation.z = 0.3; M(new THREE.TorusGeometry(0.2,0.02,8,18), '#9fdcc4', 0.17, 1.0, 0, g); M(new THREE.ConeGeometry(0.19,0.3,14,1,true), new THREE.MeshToonMaterial({ color:'#e8f6f0', gradientMap:GRAD, transparent:true, opacity:0.7, side:THREE.DoubleSide }), 0.17, 0.85, 0, g).rotation.x = Math.PI; }
    else if (id === 'shovel'){ M(new THREE.CylinderGeometry(0.025,0.025,0.8,8), '#c8a088', 0, 0.6, 0, g); M(new THREE.BoxGeometry(0.26,0.3,0.04), '#c8c0d8', 0, 0.12, 0, g); M(new THREE.BoxGeometry(0.22,0.05,0.05), '#c8a088', 0, 1.0, 0, g); }
    else { M(new THREE.CylinderGeometry(0.2,0.24,0.34,18), '#8fc8f0', 0, 0.2, 0, g); M(new THREE.CylinderGeometry(0.03,0.05,0.45,8), '#8fc8f0', 0.28, 0.32, 0, g).rotation.z = -0.9; M(new THREE.TorusGeometry(0.13,0.03,6,14,Math.PI), '#8fc8f0', -0.05, 0.38, 0, g); }
    return g; }
  if (kind === 's'){ const g = new THREE.Group(), c = CROPS[id]; M(new THREE.BoxGeometry(0.5,0.65,0.12), '#fff4e0', 0, 0.33, 0, g); M(new THREE.BoxGeometry(0.52,0.08,0.13), '#e6c8a6', 0, 0.66, 0, g); M(new THREE.SphereGeometry(0.11,12,10), c.c, 0, 0.32, 0.07, g); M(new THREE.SphereGeometry(0.06,10,8), '#9fd49a', 0.08, 0.44, 0.07, g).scale.set(1,0.5,1); return g; }
  if (kind === 'r') return vehicleMesh(id);
  return new THREE.Group();
}
function pvShow(kind, id, holder){
  if (!pvInit()) return;
  while (PV.holder.children.length) PV.holder.remove(PV.holder.children[0]);
  const o = pvObject(kind, id); PV.holder.add(o);
  const box = new THREE.Box3().setFromObject(o), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
  o.position.sub(ctr); const r = Math.max(size.x, size.y, size.z, 0.3);
  PV.cam.position.set(0, r*0.55, r*3.3); PV.cam.lookAt(0, 0, 0); PV.holder.rotation.set(0, 0.5, 0);
  holder.appendChild(PV.cv); PV.on = true; PV.w = 0;
}
function pvTick(dt){
  if (!PV.on) return; if (!PV.cv.isConnected){ PV.on = false; return; }
  const w = PV.cv.clientWidth, h = PV.cv.clientHeight; if (!w || !h) return;
  if (w !== PV.w || h !== PV.h){ PV.w = w; PV.h = h; PV.r.setSize(w, h, false); PV.cam.aspect = w/h; PV.cam.updateProjectionMatrix(); }
  PV.holder.rotation.y += dt*0.7; PV.r.render(PV.scene, PV.cam);
}

/* ---------- general store (rebuilt: tap to look, then buy) ---------- */
let storeSel = null;
const SEED_KEY = id => 's_'+id;
function storeItemInfo(sel){
  const [k,id] = sel.split(':');
  if (k === 'f') return { name:FURN[id].name, price:FURN[id].price, desc:DESC['f_'+id] || DESC[id] || '', pv:['f',id], owned:G.me.furn[id]||0, multi:true };
  if (k === 'd'){ const d = WALLS[id] || FLOORS[id]; return { name:d.name, price:d.price, desc:DESC[id]||'', pv:['d',id], owned:G.me.decos[id]?1:0 }; }
  if (k === 't') return { name:TOOLS[id].name, price:TOOLS[id].price, desc:DESC[id] || TOOLS[id].note, pv:['t',id], owned:G.me.tools[id]?1:0 };
  if (k === 's') return { name:CROPS[id].name+' 씨앗', price:CROPS[id].seed, desc:DESC[SEED_KEY(id)]||'', pv:['s',id], owned:(G.me.seeds||{})[id]||0, multi:true };
}
function openStore(){
  G.panel = 'store'; const me = G.me; me.inv = me.inv || {}; me.furn = me.furn || {}; me.tools = me.tools || {}; me.decos = me.decos || {}; me.seeds = me.seeds || {};
  const tabs = [['furn','가구'],['deco','벽지·바닥'],['seed','씨앗'],['tool','도구'],['sell','팔기']];
  let body = '<div class="tabs">'+tabs.map(([k,l]) => '<button data-st="'+k+'" class="'+(shopTab===k?'on':'')+'">'+l+'</button>').join('')+'</div>';
  if (storeSel && shopTab !== 'sell'){
    const I = storeItemInfo(storeSel), after = me.acorns - I.price, has = I.owned && !I.multi;
    body += '<div class="pvcard"><div class="pvbox" id="pvBox"></div><div class="pvinfo"><b>'+esc(I.name)+'</b><span>'+esc(I.desc)+'</span><span class="pr">도토리 '+I.price+(I.owned?' · '+(I.multi?I.owned+'개 있음':'가지고 있어요'):'')+'</span>'+
      (has ? '' : after >= 0 ? '<button class="go" id="buyNow">사기 · 남는 도토리 '+after+'</button>' : (after >= ECON.creditLimit && me.acorns >= ECON.creditLimit/2) ? '<button class="bad" id="buyNow">외상으로 사기</button>' : '<button disabled>도토리가 모자라요</button>')+'</div></div>';
  }
  const cell = (sel, name, sub, color) => '<div class="cell'+(storeSel===sel?' sel':'')+'" data-sel="'+sel+'">'+(color?'<div class="sw" style="background:'+color+'"></div>':'')+esc(name)+'<b>'+sub+'</b></div>';
  if (shopTab === 'furn') body += '<p class="note">눌러서 모양을 보고 사요. 산 가구는 집 안 "방 꾸미기"에서 놓을 수 있어요.</p><div class="grid">'+BUYABLE_FURN().map(id => cell('f:'+id, FURN[id].name, '도토리 '+FURN[id].price+(me.furn[id]?' · '+me.furn[id]+'개':''))).join('')+'</div>';
  if (shopTab === 'deco') body += '<div class="grid">'+[...Object.entries(WALLS), ...Object.entries(FLOORS)].filter(([,d]) => d.price>0).map(([id,d]) => cell('d:'+id, d.name, me.decos[id]?'가지고 있어요':'도토리 '+d.price, d.c2||d.c)).join('')+'</div>';
  if (shopTab === 'seed') body += '<p class="note">농장섬 밭에 심어요. 물을 준 뒤 하루 동안만 자라니까 매일 물을 줘요.</p><div class="grid">'+Object.entries(CROPS).map(([id,c]) => cell('s:'+id, c.name+' 씨앗', '도토리 '+c.seed+(me.seeds[id]?' · '+me.seeds[id]+'개':''), c.c)).join('')+'</div>';
  if (shopTab === 'tool') body += '<div class="grid">'+Object.entries(TOOLS).map(([id,t]) => cell('t:'+id, t.name, me.tools[id]?'가지고 있어요':'도토리 '+t.price)).join('')+'</div>';
  if (shopTab === 'sell'){
    const items = Object.entries(me.inv).filter(([id,n]) => n>0 && GATHER[id]);
    const total = items.reduce((a,[id,n]) => a + GATHER[id].price*n, 0);
    body += items.length ? '<div class="buybar"><span>모두 팔면 도토리 '+total+'</span><button class="go" id="sellAll">전부 팔기</button></div><div class="grid">'+items.map(([id,n]) => '<div class="cell" data-sell="'+id+'"><div class="sw" style="background:'+GATHER[id].c+'"></div>'+GATHER[id].name+'<b>'+n+'개 · 하나에 '+GATHER[id].price+'</b></div>').join('')+'</div><p class="note">물건을 누르면 하나씩 팔아요.</p>' : '<p class="note">팔 물건이 없어요. 곤충, 조개, 과일, 꽃, 농작물을 모아 오세요.</p>';
  }
  openPanel('잡화점 · 모모네', body, { half:true });
  if (storeSel && shopTab !== 'sell'){ const I = storeItemInfo(storeSel); pvShow(I.pv[0], I.pv[1], $('#pvBox')); }
  $('#pbody').querySelectorAll('[data-st]').forEach(b => b.addEventListener('click', () => { shopTab = b.dataset.st; storeSel = null; openStore(); }));
  $('#pbody').querySelectorAll('[data-sel]').forEach(c => c.addEventListener('click', () => { storeSel = c.dataset.sel; openStore(); $('#pbody').scrollTop = 0; }));
  const bn = $('#buyNow'); if (bn) bn.addEventListener('click', () => {
    const [k,id] = storeSel.split(':'), I = storeItemInfo(storeSel);
    if (me.acorns - I.price < ECON.creditLimit){ toast('도토리가 모자라요'); return; }
    spend(I.price); if (k==='f') me.furn[id] = (me.furn[id]||0)+1; if (k==='d') me.decos[id] = 1; if (k==='t') me.tools[id] = 1; if (k==='s') me.seeds[id] = (me.seeds[id]||0)+1;
    toast((me.acorns<0?'외상으로 ':'')+I.name+'을(를) 샀어요', 1400); saveMe(); openStore();
  });
  $('#pbody').querySelectorAll('[data-sell]').forEach(c => c.addEventListener('click', () => { const id = c.dataset.sell; if (!me.inv[id]) return; me.inv[id]--; earn(GATHER[id].price); toast(GATHER[id].name+' 판매 · 도토리 +'+GATHER[id].price, 1200); openStore(); }));
  const sa = $('#sellAll'); if (sa) sa.addEventListener('click', () => { let t = 0; Object.entries(me.inv).forEach(([id,n]) => { if (GATHER[id] && n>0){ t += GATHER[id].price*n; me.inv[id] = 0; } }); earn(t); pop('다 팔았어요', '도토리 +'+t); openStore(); });
}
