(() => {
'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const shade = Char3D.shade;

/* ================= family slots ================= */
const SLOTS = [
  { name:'민트', roof:'#3fae8c', look:{ skin:'#ffd9b8', hair:'short', hairColor:'#5b3a24', eyes:'round', mouth:'smile' } },
  { name:'토마토', roof:'#e0574a', look:{ skin:'#ffe0c8', hair:'long', hairColor:'#2b2230', eyes:'round', mouth:'smile' } },
  { name:'라벤더', roof:'#8a73d6', look:{ skin:'#ffdcbf', hair:'ponytail', hairColor:'#c0662e', eyes:'smile', mouth:'open' } },
  { name:'하늘', roof:'#5b9be8', look:{ skin:'#ffe6d2', hair:'bob', hairColor:'#2b2230', eyes:'round', mouth:'smile' } },
  { name:'레몬', roof:'#e8c34a', look:{ skin:'#f7cfa8', hair:'spiky', hairColor:'#8a5a34', eyes:'dot', mouth:'smile' } },
  { name:'복숭아', roof:'#ff9eb0', look:{ skin:'#ffd9b8', hair:'twin', hairColor:'#5b3a24', eyes:'smile', mouth:'cat' } },
  { name:'솔', roof:'#4fae63', look:{ skin:'#e8b892', hair:'short', hairColor:'#2b2230', eyes:'round', mouth:'smile' } },
  { name:'모카', roof:'#a8744a', look:{ skin:'#ffe0c8', hair:'bun', hairColor:'#5b3a24', eyes:'sleepy', mouth:'smile' } },
  { name:'달빛', roof:'#6a6aa6', look:{ skin:'#ffdcbf', hair:'long', hairColor:'#e8c46a', eyes:'star', mouth:'smile' } },
  { name:'별사탕', roof:'#ef7fa8', look:{ skin:'#ffd9b8', hair:'wavy', hairColor:'#ef7fa8', eyes:'sparkle', mouth:'smile' } },
];

/* ================= storage ================= */
const LS = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const Store = {
  mode:'loading', db:null, data:{ placed:{}, players:{}, mail:[] }, ls:{}, q:{}, timers:{}, readOnly:false,
  on(ev, fn){ (this.ls[ev] = this.ls[ev] || []).push(fn); },
  emit(ev){ (this.ls[ev] || []).forEach(f => { try{ f(); }catch(e){ console.error(e); } }); },
  async init(){
    if (window.DVNet){ const sess = await window.DVNet.ready; this.net = window.DVNet; this.mode = 'fb'; this.subFb(); this.emit('mode'); return; }
    let db = null;
    try{ if (window.claude && typeof window.claude.use === 'function') db = await Promise.race([ window.claude.use('db'), new Promise(r => setTimeout(() => r(null), 9000)) ]); }catch(e){ db = null; }
    if (db){ this.db = db; this.mode = 'db'; this.subDb(); } else { this.mode = 'local'; this.loadLocal(); }
    this.emit('mode');
  },
  loadLocal(){ const d = LS.get('dv2.local', null); if (d) this.data = { placed:d.placed||{}, players:d.players||{}, mail:d.mail||[] }; ['placed','players','mail'].forEach(k => this.emit(k)); },
  saveLocal(){ LS.set('dv2.local', this.data); },
  err(e){
    console.warn(e);
    if (e && e.code === 'invalid_argument' && !this.readOnly){ this.readOnly = true; toast('가족 마을에 저장할 권한이 없어요. 공유 메뉴에서 편집자로 초대받으면 같이 할 수 있어요.', 5000); }
    else if (e && e.code === 'quota_exceeded') toast('마을 저장 공간이 가득 찼어요.');
  },
  subDb(){
    const db = this.db;
    db.collection('placed').onSnapshot(s => { const m = {}; s.docs.forEach(d => { m[d.id] = d.data(); }); this.data.placed = m; this.emit('placed'); }, e => this.err(e));
    db.collection('players').onSnapshot(s => { const m = {}; s.docs.forEach(d => { m[d.id] = d.data(); }); this.data.players = m; this.emit('players'); }, e => this.err(e));
    db.collection('mail').orderBy('at','desc').limit(40).onSnapshot(s => { this.data.mail = s.docs.map(d => Object.assign({ id:d.id }, d.data())); this.emit('mail'); }, e => this.err(e));
  },
  subFb(){
    const N8 = this.net, P = j => { try{ return typeof j === 'string' ? JSON.parse(j) : j; }catch(e){ return null; } };
    let got = { placed:false, players:false, mail:false };
    const done = k => { if (!got[k]){ got[k] = true; if (got.placed && got.players && got.mail) this.emit('loaded'); } };
    N8.on('placed', v => { const m = {}; Object.entries(v || {}).forEach(([k,j]) => { const o = P(j); if (o) m[k] = o; }); this.data.placed = m; this.emit('placed'); done('placed'); });
    N8.on('players', v => { const m = {}; Object.entries(v || {}).forEach(([k,j]) => { const o = P(j); if (o) m[k] = o; }); this.data.players = m; this.emit('players'); done('players'); });
    N8.on('mail', v => { this.data.mail = Object.entries(v || {}).map(([k,j]) => Object.assign({ id:k }, P(j))).filter(m => m.at).sort((a,b) => b.at - a.at).slice(0, 40); this.emit('mail'); done('mail'); });
  },
  write(path, fn){ this.q[path] = (this.q[path] || Promise.resolve()).then(fn).catch(e => this.err(e)); return this.q[path]; },
  setPlaced(key, obj){ if (this.mode === 'fb'){ this.data.placed[key] = obj; this.net.set('placed/'+key, JSON.stringify(obj)); this.emit('placed'); return; } if (this.mode === 'db') this.write('placed/'+key, () => this.db.doc('placed/'+key).set(obj)); else { this.data.placed[key] = obj; this.saveLocal(); this.emit('placed'); } },
  delPlaced(key){ if (this.mode === 'fb'){ delete this.data.placed[key]; this.net.set('placed/'+key, null); this.emit('placed'); return; } if (this.mode === 'db') this.write('placed/'+key, () => this.db.doc('placed/'+key).delete()); else { delete this.data.placed[key]; this.saveLocal(); this.emit('placed'); } },
  savePlayer(id, obj, now){
    const go = () => {
      const body = JSON.parse(JSON.stringify(obj));
      if (this.mode === 'fb'){ this.data.players[id] = body; this.net.set('players/'+id, JSON.stringify(body)); return; }
      if (this.mode === 'db') this.write('players/'+id, () => this.db.doc('players/'+id).set(body));
      else { this.data.players[id] = body; this.saveLocal(); }
    };
    clearTimeout(this.timers[id]); if (now) go(); else this.timers[id] = setTimeout(go, 900);
  },
  addMail(m){ if (this.mode === 'fb'){ this.net.push('mail', JSON.stringify(m)); return; } if (this.mode === 'db') this.db.collection('mail').add(m).catch(e => this.err(e)); else { this.data.mail.unshift(Object.assign({ id:'m'+Date.now() }, m)); this.data.mail = this.data.mail.slice(0, 40); this.saveLocal(); this.emit('mail'); } }
};

/* ================= time & season ================= */
const settings = Object.assign({ pixel:'mid', time:'real', season:'real' }, LS.get('dv.settings', {}));
const saveSettings = () => LS.set('dv.settings', settings);
const SEASONS = { spring:'봄', summer:'여름', autumn:'가을', winter:'겨울' };
const realSeason = d => { const m = d.getMonth()+1; return m>=3&&m<=5?'spring':m>=6&&m<=8?'summer':m>=9&&m<=11?'autumn':'winter'; };
const season = () => settings.season === 'real' ? realSeason(new Date()) : settings.season;
function hourNow(){ if (settings.time==='day') return 13; if (settings.time==='eve') return 18.3; if (settings.time==='night') return 22.5; const d = new Date(); return d.getHours()+d.getMinutes()/60; }
const today = () => { const d = new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); };
function ago(t){ const s = (Date.now()-t)/1000; if (s<90) return '방금'; if (s<3600) return Math.round(s/60)+'분 전'; if (s<86400) return Math.round(s/3600)+'시간 전'; return Math.round(s/86400)+'일 전'; }
const DAY = 86400000;

/* ================= world layout (v5: four islands) ================= */
const N = 151, C = 75, OLD_C = 20;
const WATER=0, SAND=1, GRASS=2, PATH=3, TRACK=4, PLAT=5, BRIDGE=6, FLOWERF=7, FARM=8;
const WALKABLE_DECOR = [GRASS, SAND, PATH];
function rng(seed){ return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = rng(20261017);
const tile = new Uint8Array(N*N), isle = new Int8Array(N*N).fill(-1);
const idx = (i,j) => j*N+i, inb = (i,j) => i>=0 && j>=0 && i<N && j<N;
const key = (i,j) => i+'_'+j;
const T = (x,z) => [x+C, z+C]; // world int -> tile
const wx = i => i - C, wz = j => j - C;
// decor keys use world coords so the map can grow without breaking saves
const dkey = (i,j) => 'w_'+wx(i)+'_'+wz(j);
const dparse = k => { const p = k.split('_'); return p[0]==='w' ? [Number(p[1])+C, Number(p[2])+C] : [Number(p[0])-OLD_C+C, Number(p[1])-OLD_C+C]; };
const ISLANDS = [
  { id:'main', name:'도토리섬', cx:0, cz:0, r:20.5, p:4, sand:0.86 },
  { id:'flower', name:'꽃섬', cx:-39, cz:-4, r:13.5, p:2.6, sand:0.84 },
  { id:'farm', name:'농장섬', cx:39, cz:4, r:13.5, p:3, sand:0.86 },
  { id:'palm', name:'야자섬', cx:4, cz:39, r:12.5, p:2.2, sand:0.6 },
  { id:'north', name:'', cx:0, cz:-27, r:14, p:3, sand:0.86 },
  { id:'forest', name:'숲밭섬', cx:0, cz:-59, r:16, p:2.4, sand:0.88 },
];
for (let j=0;j<N;j++) for (let i=0;i<N;i++){
  let best = 9, bi = -1, bs = 0.86;
  ISLANDS.forEach((I,k) => {
    const dx = wx(i)-I.cx, dz = wz(j)-I.cz, a = Math.atan2(dz,dx);
    const d = Math.pow(Math.pow(Math.abs(dx),I.p)+Math.pow(Math.abs(dz),I.p), 1/I.p)/I.r + 0.025*Math.sin(a*5+1+k) + 0.02*Math.sin(a*9+k*2);
    if (d < best){ best = d; bi = k; bs = I.sand; }
  });
  tile[idx(i,j)] = best>0.95 ? WATER : best>bs ? SAND : GRASS;
  if (best <= 0.95) isle[idx(i,j)] = bi;
}
const isleAt = (x,z) => { const [i,j] = T(x,z); return inb(i,j) ? isle[idx(i,j)] : -1; };
const setT = (x,z,t) => { const [i,j] = T(x,z); if (inb(i,j) && tile[idx(i,j)] !== WATER) tile[idx(i,j)] = t; };
const tAt = (x,z) => { const [i,j] = T(x,z); return inb(i,j) ? tile[idx(i,j)] : WATER; };
// pond
for (let z=-14;z<=14;z++) for (let x=-14;x<=14;x++) if ((x+7)**2+(z-11)**2 <= 3.3) { const [i,j] = T(x,z); tile[idx(i,j)] = WATER; }
// farm island pond
for (let z=-6;z<=0;z++) for (let x=44;x<=50;x++) if ((x-47)**2+(z+3)**2 <= 3.3) { const [i,j] = T(x,z); tile[idx(i,j)] = WATER; }

// --- track (rounded rectangle on the main island) ---
const TR = { h:14, r:4 };
const trackPts = [];
(function(){
  const h = TR.h, r = TR.r, seg = [];
  const corners = [[h-r,-h+r, -Math.PI/2],[h-r,h-r,0],[-h+r,h-r,Math.PI/2],[-h+r,-h+r,Math.PI]];
  const straights = [[-h+r,-h,h-r,-h],[h,-h+r,h,h-r],[h-r,h,-h+r,h],[-h,h-r,-h,-h+r]];
  for (let k=0;k<4;k++){
    const [x1,z1,x2,z2] = straights[k]; const L = Math.hypot(x2-x1,z2-z1); const n = Math.ceil(L/0.2);
    for (let s=0;s<n;s++) seg.push([x1+(x2-x1)*s/n, z1+(z2-z1)*s/n]);
    const [cx,cz,a0] = corners[k]; const m = Math.ceil(r*Math.PI/2/0.2);
    for (let s=0;s<m;s++){ const a = a0 + (Math.PI/2)*s/m; seg.push([cx+Math.cos(a)*r, cz+Math.sin(a)*r]); }
  }
  let acc = 0; seg.forEach((p,k) => { if (k) acc += Math.hypot(p[0]-seg[k-1][0], p[1]-seg[k-1][1]); trackPts.push({ x:p[0], z:p[1], s:acc }); });
  TR.L = acc + Math.hypot(seg[0][0]-seg[seg.length-1][0], seg[0][1]-seg[seg.length-1][1]);
})();
function trackAt(s){
  s = ((s % TR.L) + TR.L) % TR.L;
  let lo = 0, hi = trackPts.length-1;
  while (lo < hi){ const m = (lo+hi+1)>>1; if (trackPts[m].s <= s) lo = m; else hi = m-1; }
  const a = trackPts[lo], b = trackPts[(lo+1) % trackPts.length];
  const segL = (lo+1 < trackPts.length ? b.s : TR.L) - a.s; const t = segL ? (s-a.s)/segL : 0;
  return { x:a.x+(b.x-a.x)*t, z:a.z+(b.z-a.z)*t, ang:Math.atan2(b.x-a.x, b.z-a.z) };
}
trackPts.forEach(p => { const x = Math.round(p.x), z = Math.round(p.z); if (tAt(x,z) !== WATER) setT(x,z,TRACK); });
const nearestS = (x,z) => { let best = 0, bd = 1e9; trackPts.forEach(p => { const d = (p.x-x)**2+(p.z-z)**2; if (d<bd){ bd=d; best=p.s; } }); return best; };

const STATIONS = [
  { id:'north', name:'마을역', px:4, pz:-13, tiles:[[3,-13],[4,-13],[5,-13]], tx:4, tz:-14, staff:'bori' },
  { id:'east', name:'쇼핑몰역', px:13, pz:5, tiles:[[13,4],[13,5],[13,6]], tx:14, tz:5, staff:'kongi' },
  { id:'south', name:'일터역', px:-4, pz:13, tiles:[[-5,13],[-4,13],[-3,13]], tx:-4, tz:14, staff:'dubu' },
];
STATIONS.forEach(st => { st.s = nearestS(st.tx, st.tz); st.tiles.forEach(([x,z]) => setT(x,z,PLAT)); });

// --- paths ---
const line = (x1,z1,x2,z2) => { const dx = Math.sign(x2-x1), dz = Math.sign(z2-z1); let x = x1, z = z1; setT(x,z,PATH); while (x!==x2 || z!==z2){ if (x!==x2) x += dx; else z += dz; if (tAt(x,z)===TRACK || tAt(x,z)===PLAT) continue; setT(x,z,PATH); } };
const poly = (...p) => { for (let k=0;k<p.length-1;k++) line(p[k][0],p[k][1],p[k+1][0],p[k+1][1]); };
const plaza = (x0,z0,x1,z1,t) => { for (let z=z0;z<=z1;z++) for (let x=x0;x<=x1;x++) setT(x,z,t||PATH); };
plaza(-2,-2,2,2);
poly([-7,-6],[-7,-3],[-2,-3],[-2,-2]); poly([0,-7],[0,-3]); poly([7,-6],[7,-3],[2,-3],[2,-2]);
poly([4,-12],[4,-3]);
poly([2,2],[6,2],[6,7],[9,7]); poly([9,7],[12,7],[12,5]);
poly([-2,2],[-3,2],[-3,8],[-9,8]);
poly([-1,2],[-1,12],[2,12]); poly([-1,12],[-4,12]);
poly([-3,2],[-9,2]); poly([3,-2],[10,-2]);
// bridges: water becomes planks, land becomes path
const BRIDGES = [];
function bridge(x1,z1,x2,z2){
  const dx = Math.sign(x2-x1), dz = Math.sign(z2-z1); let x = x1, z = z1;
  for (;;){ const [i,j] = T(x,z); const t = tile[idx(i,j)];
    if (t === WATER){ tile[idx(i,j)] = BRIDGE; BRIDGES.push([x,z, dx!==0]); }
    else if (t !== TRACK && t !== PLAT && t !== BRIDGE) tile[idx(i,j)] = PATH;
    if (x===x2 && z===z2) break; if (x!==x2) x += dx; else z += dz; }
}
bridge(-10,2,-32,2);                       // west → 꽃섬
line(12,7,12,9); bridge(12,9,31,9);        // east → 농장섬
line(2,12,6,12); bridge(6,12,6,31);        // south → 야자섬
// 꽃섬 paths
plaza(-41,0,-37,4); poly([-32,2],[-37,2]); poly([-39,0],[-39,-7]); poly([-39,-4],[-44,-4]); poly([-39,-4],[-34,-4]); poly([-41,2],[-46,2]); poly([-39,4],[-39,8]);
// 농장섬 paths
plaza(33,8,35,10); poly([31,9],[33,9]); poly([34,8],[34,-2]); poly([34,1],[39,1],[39,-2]); poly([39,1],[44,1],[44,-4]); poly([35,7],[36,7]);
// 야자섬 paths
plaza(4,32,8,34); poly([6,31],[6,32]); poly([4,33],[-2,33],[-2,39],[0,39]); poly([8,33],[13,33],[13,39],[11,39]); poly([6,34],[6,38],[8,38],[8,43],[6,43]);
// 도토리섬 북쪽 (새 동네): 큰 기차역, 경찰서, JOB꼬리아, 새 이웃 집
poly([0,-15],[15,-15]); poly([-6,-15],[0,-15]); poly([0,-15],[0,-31]); poly([-10,-31],[10,-31]); poly([0,-22],[-5,-22]); poly([0,-22],[9,-22],[9,-24]); plaza(-2,-30,2,-28);
bridge(0,-31,0,-46);
// 숲밭섬 paths
poly([0,-46],[0,-71]); poly([0,-62],[-12,-62]); poly([0,-62],[12,-62]); poly([0,-54],[-12,-54]); poly([0,-54],[12,-54]); poly([0,-47],[11,-47]);

// flower fields (꽃섬 + a little one at home)
const FIELDS = [
  { id:'f_tulip', x0:-36, z0:-12, x1:-32, z1:-9, flower:'tulip', cols:['#ffb3c8','#fff0a8','#ff9a9a','#ffffff'] },
  { id:'f_sun', x0:-46, z0:-12, x1:-42, z1:-9, flower:'sunflower', cols:['#ffe07a','#ffd34e','#fff0a8'] },
  { id:'f_cosmos', x0:-46, z0:6, x1:-42, z1:9, flower:'cosmos', cols:['#ffc6e6','#ffffff','#f7a8d8','#d6c4ff'] },
  { id:'f_lily', x0:-36, z0:6, x1:-33, z1:9, flower:'lily', cols:['#ffffff','#fff6d8','#ffe6f0'] },
  { id:'f_rose', x0:-9, z0:-12, x1:-7, z1:-11, flower:'rose', cols:['#ff9aae','#ffb3c8','#ffd0dc'] },
];
FIELDS.forEach(F => { for (let z=F.z0;z<=F.z1;z++) for (let x=F.x0;x<=F.x1;x++) if (tAt(x,z)===GRASS) setT(x,z,FLOWERF); });
const fieldAt = (x,z) => FIELDS.find(F => x>=F.x0 && x<=F.x1 && z>=F.z0 && z<=F.z1);
// farm plots (농장섬)
const FARM_RECT = { x0:37, z0:4, x1:44, z1:9 };
for (let z=FARM_RECT.z0; z<=FARM_RECT.z1; z++) for (let x=FARM_RECT.x0; x<=FARM_RECT.x1; x++) setT(x,z, (x===40 || z===7) ? PATH : FARM);
// 숲밭섬 rental plots: 5 sets of 10×5 = 50 cells
const PLOTS = [
  { id:'A', name:'1번 밭', x0:-12, z0:-68, x1:-3, z1:-64, sign:[-2,-66] },
  { id:'B', name:'2번 밭', x0:3, z0:-68, x1:12, z1:-64, sign:[2,-66] },
  { id:'C', name:'3번 밭', x0:-12, z0:-60, x1:-3, z1:-56, sign:[-2,-58] },
  { id:'D', name:'4번 밭', x0:3, z0:-60, x1:12, z1:-56, sign:[2,-58] },
  { id:'E', name:'5번 밭', x0:2, z0:-52, x1:11, z1:-48, sign:[1,-50] },
];
PLOTS.forEach(P => { for (let z=P.z0; z<=P.z1; z++) for (let x=P.x0; x<=P.x1; x++){ const [i,j] = T(x,z); tile[idx(i,j)] = FARM; } });
const plotAt = (x,z) => PLOTS.find(P => x>=P.x0 && x<=P.x1 && z>=P.z0 && z<=P.z1) || null;

// --- buildings ---
const BUILD = [
  { id:'h0', kind:'house', slot:0, cx:-7, cz:-8, w:3, d:3 },
  { id:'h1', kind:'house', slot:1, cx:0, cz:-9, w:3, d:3 },
  { id:'h2', kind:'house', slot:2, cx:7, cz:-8, w:3, d:3 },
  { id:'mall', kind:'mall', cx:9, cz:5, w:5, d:3, name:'쇼핑몰' },
  { id:'cafe', kind:'cafe', cx:-9, cz:6, w:3, d:3, name:'카페' },
  { id:'depot', kind:'depot', cx:2, cz:10, w:5, d:3, name:'물류센터' },
  { id:'mailbox', kind:'mailbox', cx:3, cz:-1, w:1, d:1 },
  { id:'shop', kind:'shop', cx:-9, cz:0, w:3, d:3, name:'잡화점' },
  { id:'bank', kind:'bank', cx:10, cz:-4, w:3, d:3, name:'은행' },
  // villagers' own homes
  { id:'nh_toni', kind:'nhouse', npc:'toni', cx:-39, cz:-9, w:3, d:3 },
  { id:'nh_kini', kind:'nhouse', npc:'kini', cx:-44, cz:-6, w:3, d:3 },
  { id:'nh_momo', kind:'nhouse', npc:'momo', cx:-34, cz:-6, w:3, d:3 },
  { id:'nh_dan', kind:'nhouse', npc:'dan', cx:34, cz:-4, w:3, d:3 },
  { id:'nh_bobo', kind:'nhouse', npc:'bobo', cx:39, cz:-4, w:3, d:3 },
  { id:'nh_pang', kind:'nhouse', npc:'pang', cx:44, cz:-6, w:3, d:3 },
  { id:'nh_coco', kind:'nhouse', npc:'coco', cx:0, cz:37, w:3, d:3 },
  { id:'nh_mong', kind:'nhouse', npc:'mong', cx:11, cz:37, w:3, d:3 },
  { id:'nh_dogs', kind:'nhouse', npc:'bori', cx:6, cz:41, w:3, d:3 },
  { id:'bigstation', kind:'bigstation', cx:4, cz:-17, w:5, d:3, name:'마을역' },
  { id:'police', kind:'police', cx:-6, cz:-18, w:3, d:3, name:'경찰서' },
  { id:'jobk', kind:'jobk', cx:-5, cz:-25, w:5, d:3, name:'JOB꼬리아' },
  { id:'nh_n1', kind:'nhouse', npc:'n1', cx:-10, cz:-33, w:3, d:3 },
  { id:'nh_n2', kind:'nhouse', npc:'n2', cx:-5, cz:-33, w:3, d:3 },
  { id:'nh_n3', kind:'nhouse', npc:'n3', cx:5, cz:-33, w:3, d:3 },
  { id:'nh_n4', kind:'nhouse', npc:'n4', cx:10, cz:-33, w:3, d:3 },
  { id:'nh_n5', kind:'nhouse', npc:'n5', cx:9, cz:-26, w:3, d:3 },
  { id:'swing1', kind:'swingset', cx:5, cz:-21, w:3, d:1 },
  { id:'swing2', kind:'swingset', cx:-37, cz:-1, w:3, d:1 },
  { id:'swing3', kind:'swingset', cx:2, cz:46, w:3, d:1 },
  { id:'swing4', kind:'swingset', cx:-4, cz:4, w:3, d:1 },
];
const statics = new Map(); // tile key -> building/static
BUILD.forEach(b => {
  b.door = [b.cx, b.cz + Math.floor(b.d/2) + 1];
  for (let a=-Math.floor(b.w/2); a<=Math.floor(b.w/2); a++) for (let c=-Math.floor(b.d/2); c<=Math.floor(b.d/2); c++){
    const [i,j] = T(b.cx+a, b.cz+c); tile[idx(i,j)] = GRASS; statics.set(key(i,j), b);
  }
  if (b.kind !== 'mailbox') setT(b.door[0], b.door[1], PATH);
});
const BY = Object.fromEntries(BUILD.map(b => [b.id, b]));
const NHOME = {}; BUILD.forEach(b => { if (b.kind==='nhouse') NHOME[b.npc] = b; });

// --- nature ---
function freeForDeco(i,j,gap){
  if (!inb(i,j) || tile[idx(i,j)] !== GRASS) return false;
  for (let a=-gap;a<=gap;a++) for (let b=-gap;b<=gap;b++){ const ii=i+a, jj=j+b; if (!inb(ii,jj)) continue; if (statics.has(key(ii,jj))) return false; const t = tile[idx(ii,jj)]; if (gap>0 && t!==GRASS && t!==SAND) return false; }
  return true;
}
const cand = []; for (let j=1;j<N-1;j++) for (let i=1;i<N-1;i++) if (tile[idx(i,j)] !== WATER) cand.push([i,j]);
for (let k=cand.length-1;k>0;k--){ const r = Math.floor(R()*(k+1)); [cand[k],cand[r]] = [cand[r],cand[k]]; }
let tid = 0, rid = 0;
// tree kinds per island: main mixes, flower island blossoms, farm island orchards, palm island palms
const TREE_MIX = {
  0:[['round',4],['cherry',2],['maple',2],['pine',2]],
  1:[['cherry',4],['maple',2],['round',1],['birch',2]],
  2:[['orange',4],['round',3],['pine',1]],
  3:[['palm',1]],
  4:[['round',3],['cherry',2],['maple',2],['pine',2]],
  5:[['pine',4],['birch',3],['maple',2],['round',2],['orange',1]],
};
const TREE_QUOTA = { 0:34, 1:16, 2:16, 3:14, 4:12, 5:70 }, treeCount = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 };
function pickTree(isl){ const mix = TREE_MIX[isl], tot = mix.reduce((a,m)=>a+m[1],0); let x = R()*tot; for (const [k,w] of mix){ x -= w; if (x<=0) return k; } return mix[0][0]; }
const TREE_FRUIT = { round:null, cherry:'cherry', maple:'maple_leaf', pine:'pinecone', palm:'coconut', orange:'orange', birch:'birch_bark' };
for (const [i,j] of cand){
  const isl = isle[idx(i,j)]; if (isl < 0 || treeCount[isl] >= TREE_QUOTA[isl]) continue;
  const okTile = isl===5 ? freeForDeco(i,j,0) && R()<0.8 : isl===3 ? (tile[idx(i,j)]===GRASS || tile[idx(i,j)]===SAND) && !statics.has(key(i,j)) && [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]].every(([a,b]) => { const t = tile[idx(i+a,j+b)]; return (t===GRASS||t===SAND) && !statics.has(key(i+a,j+b)); }) : freeForDeco(i,j,1);
  if (!okTile) continue;
  const tk = pickTree(isl); const fruit = tk==='round' ? (R()<0.5?'apple':'persimmon') : TREE_FRUIT[tk];
  statics.set(key(i,j), { kind:'tree', tk, id:'t'+(tid++), fruit, i, j }); treeCount[isl]++;
}
for (const [i,j] of cand){ if (rid>=24) break; if (freeForDeco(i,j,1) && R()<0.5) statics.set(key(i,j), { kind:'rock', id:'r'+(rid++), i, j }); }
const flowers = [];
for (const [i,j] of cand){ if (flowers.length>=110) break; if (freeForDeco(i,j,0) && R()<0.3) flowers.push({ i, j, c:Math.floor(R()*4), ox:(R()-.5)*.5, oz:(R()-.5)*.5 }); }
// benches face the nearest path
const BENCH_SPOTS = [[-3,3],[3,3],[-3,-3],[3,-3],[-12,2],[11,8],[-1,-16],[2,-23],[-2,-32],[2,-32],[-38,5],[-42,-2],[36,11],[42,2],[3,31],[9,32],[-1,-47],[-1,-63],[1,-55],[-11,9]];
let benchN = 0;
BENCH_SPOTS.forEach(([x,z]) => { const [i,j] = T(x,z); if (!inb(i,j) || statics.has(key(i,j))) return; const t = tile[idx(i,j)]; if (t !== GRASS && t !== SAND && t !== PATH) return;
  let face = 0; for (const [a,b,f] of [[0,1,0],[0,-1,Math.PI],[1,0,Math.PI/2],[-1,0,-Math.PI/2]]){ if (tile[idx(i+a,j+b)] === PATH && !statics.has(key(i+a,j+b))){ face = f; break; } }
  statics.set(key(i,j), { kind:'bench', id:'bn'+(benchN++), face, i, j }); });
// houses for neighbours 4-10 (added after nature so the rest of the island stays exactly as it was)
[[3,-11,-6],[4,11,-9],[5,11,0],[6,-17,-4],[7,-3,10],[8,7,9],[9,6,0]].forEach(([slot,cx,cz]) => {
  const b = { id:'h'+slot, kind:'house', slot, cx, cz, w:3, d:3 }; b.door = [cx, cz + 2];
  for (let a=-2;a<=2;a++) for (let c=-2;c<=3;c++){ const k = key(...T(cx+a, cz+c)), s0 = statics.get(k); if (s0 && (s0.kind === 'tree' || s0.kind === 'rock' || s0.kind === 'bench')) statics.delete(k); }
  for (let a=-1;a<=1;a++) for (let c=-1;c<=1;c++){ const [i,j] = T(cx+a, cz+c); tile[idx(i,j)] = GRASS; statics.set(key(i,j), b); }
  setT(b.door[0], b.door[1], PATH); BUILD.push(b); BY[b.id] = b;
});
for (let k=flowers.length-1;k>=0;k--){ const f = flowers[k]; if (statics.has(key(f.i,f.j)) || tile[idx(f.i,f.j)] === PATH) flowers.splice(k,1); }
const TREE_TOTAL = tid, ROCK_TOTAL = rid;
const SPAWN = T(0,1);

/* ================= catalogs ================= */
const FISH = [
  { id:'crucian', name:'붕어', price:10, seasons:'all', when:'any', w:10, c:'#9a8a5a' },
  { id:'chub', name:'피라미', price:8, seasons:'all', when:'day', w:9, c:'#9fb7c9' },
  { id:'ricefish', name:'송사리', price:6, seasons:'spring summer', when:'day', w:8, c:'#c9d6b0' },
  { id:'sweetfish', name:'은어', price:35, seasons:'summer', when:'day', w:3, c:'#b8c8cf' },
  { id:'eel', name:'뱀장어', price:60, seasons:'summer', when:'night', w:2, c:'#4a4a3a' },
  { id:'salmon', name:'연어', price:40, seasons:'autumn', when:'any', w:4, c:'#e08a6a' },
  { id:'saury', name:'꽁치', price:25, seasons:'autumn', when:'any', w:5, c:'#7a96b8' },
  { id:'smelt', name:'빙어', price:30, seasons:'winter', when:'any', w:6, c:'#dfe9f2' },
  { id:'catfish', name:'메기', price:30, seasons:'all', when:'night', w:5, c:'#5a5146' },
  { id:'goldfish', name:'금붕어', price:80, seasons:'all', when:'any', w:1, c:'#ff8a2a' },
];
const FRUIT = { apple:{ name:'사과', c:'#e2393b', price:12 }, persimmon:{ name:'감', c:'#ff8a1f', price:12 } };
const DECOR = [
  { id:'sapling', name:'나무 묘목', cost:25, c:'#6fc35a', note:'현실 시간으로 자라요' },
  { id:'flowerbed', name:'꽃밭', cost:12, c:'#ff7fa8' },
  { id:'pot', name:'꽃 화분', cost:15, c:'#c86b45' },
  { id:'bench', name:'나무 벤치', cost:30, c:'#b07a48' },
  { id:'lamp', name:'가로등', cost:40, c:'#ffd34e', note:'밤에 켜져요' },
  { id:'fence', name:'울타리', cost:8, c:'#efe2c8' },
  { id:'pumpkin', name:'호박', cost:20, c:'#f08a24' },
];
const DEC = Object.fromEntries(DECOR.map(x => [x.id, x]));
const ECON = { stamMax:100, regenMs:120000, restGain:60, restCooldown:3*3600000, creditLimit:-300, interest:0.1, repoDays:3, splurge:300, fare:5 };
const JOBS = {
  cafe: { name:'카페 알바', place:'cafe', cost:25, fine:30, desc:'손님 6명의 음료 주문을 받아요. 주문과 다른 음료를 내거나 시간이 지나면 실수예요.', pay:'손님당 도토리 18 + 빠르면 팁 6' },
  sort: { name:'택배 분류', place:'depot', cost:20, fine:25, desc:'상자 14개를 색깔에 맞는 레일로 보내요. 점점 빨라져요. 잘못 보내면 상자가 깨져요.', pay:'상자당 도토리 8 · 깨진 상자 변상 5' },
  deliver: { name:'택배 배달', place:'depot', cost:15, fine:20, desc:'정해진 시간 안에 마을 어딘가로 택배를 가져다줘요. 기차나 탈것을 타면 빨라요.', pay:'도토리 45 + 남은 시간 보너스' },
};

/* ================= three.js (pastel storybook look) ================= */
const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'default' });
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const cam = new THREE.OrthographicCamera(-5,5,5,-5,0.1,200);
const hemi = new THREE.HemisphereLight(0xffffff, 0xd8d0e6, 0.5); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff4e8, 0.62);
sun.castShadow = true; sun.shadow.mapSize.set(1024,1024); sun.shadow.radius = 4;
Object.assign(sun.shadow.camera, { left:-16, right:16, top:16, bottom:-16, near:1, far:80 });
sun.shadow.bias = -0.0025; sun.shadow.normalBias = 0.04; scene.add(sun); scene.add(sun.target);
const GRAD = (() => { const d = new Uint8Array([165,165,165,255, 215,215,215,255, 255,255,255,255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const soft = hex => { const c = new THREE.Color(hex); c.lerp(new THREE.Color('#ffffff'), 0.12); return c; };
const tmCache = new Map();
const TM = (hex, extra) => { if (!extra && tmCache.has(hex)) return tmCache.get(hex); const m = new THREE.MeshToonMaterial(Object.assign({ color:soft(hex), gradientMap:GRAD }, extra||{})); if (!extra) tmCache.set(hex, m); return m; };
const boxGeo = new THREE.BoxGeometry(1,1,1);
const matStd = new THREE.MeshToonMaterial({ color:0xffffff, gradientMap:GRAD });
const matWin = new THREE.MeshToonMaterial({ color:0xc8e6f6, emissive:0x000000, gradientMap:GRAD });
const matBulb = new THREE.MeshToonMaterial({ color:0xfff3c0, emissive:0x000000, gradientMap:GRAD });
const _o = new THREE.Object3D(), _c = new THREE.Color(), _v = new THREE.Vector3();
function vox(list, mat){
  const m = new THREE.InstancedMesh(boxGeo, mat || matStd, list.length);
  list.forEach((b,i) => { _o.position.set(b[0],b[1],b[2]); _o.scale.set(b[3],b[4],b[5]); _o.rotation.set(0, b[7]||0, 0); _o.updateMatrix(); m.setMatrixAt(i,_o.matrix); m.setColorAt(i,soft(b[6])); });
  m.castShadow = true; m.receiveShadow = true; return m;
}
// mesh helper: M(geometry, color|material, x,y,z, parent)
function M(geo, c, x, y, z, parent){ const m = new THREE.Mesh(geo, typeof c === 'string' ? TM(c) : c); m.position.set(x||0, y||0, z||0); m.castShadow = true; m.receiveShadow = true; if (parent) parent.add(m); return m; }
const pick = (arr, r) => arr[Math.floor(r()*arr.length)];
function signTex(text, bg, fg){
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = bg; g.beginPath(); g.roundRect ? g.roundRect(4,4,504,120,40) : g.rect(4,4,504,120); g.fill();
  g.fillStyle = fg; g.font = '72px Jua, "Apple SD Gothic Neo", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 70);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}
function signMesh(text, w, h, bg, fg){ return new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({ map:signTex(text,bg,fg), transparent:true })); }
function stripeTex(a, b, n){ const c = document.createElement('canvas'); c.width = 256; c.height = 16; const g = c.getContext('2d'); for (let k=0;k<n;k++){ g.fillStyle = k%2?b:a; g.fillRect(k*256/n,0,256/n+1,16); } const t = new THREE.CanvasTexture(c); return t; }

const PAL = {
  spring:{ grass:['#c6ecb0','#bfe6a6','#cdf0b8'], leaves:['#ffc6dc','#ffd6e6','#f9b3cf','#d4f0b8'], sand:'#fbeccc', flower:['#ffb3c8','#fff0a8','#ffffff','#d6c4ff'] },
  summer:{ grass:['#b6e4a0','#addf96','#bfe9aa'], leaves:['#a6e0a0','#b8e8ac','#94d690','#c6efb6'], sand:'#fcebc4', flower:['#ffb3c8','#fff0a8','#ffffff','#b8dcff'] },
  autumn:{ grass:['#d4e8a8','#cde3a0','#dbecb2'], leaves:['#ffc29a','#ffd8a0','#f9ad9e','#ffe0a6'], sand:'#fbe8c4', flower:['#ffb3a6','#fff0a8','#ffffff','#e6c4ff'] },
  winter:{ grass:['#f4f8fc','#eef4fa','#fbfdff'], leaves:['#f4f8fc','#e2eee6','#ffffff','#cfe6d8'], sand:'#f2eee6', flower:['#ffffff','#e6f0ff','#ffffff','#f6e6ff'] },
};
const FARMC = '#e6c8a8', PATHC = '#f6e4c8', TRACKC = '#e8d6c0', PLATC = '#ece6f4', UNDERC = '#bfe6e0';
const sea = new THREE.Mesh(new THREE.PlaneGeometry(500,500), new THREE.MeshToonMaterial({ color:'#a8dcf0', gradientMap:GRAD, transparent:true, opacity:0.82 }));
sea.rotation.x = -Math.PI/2; sea.position.y = -0.2; sea.receiveShadow = true; scene.add(sea);
const seabed = new THREE.Mesh(new THREE.PlaneGeometry(500,500), new THREE.MeshLambertMaterial({ color:'#9ed4e4' }));
seabed.rotation.x = -Math.PI/2; seabed.position.y = -0.8; scene.add(seabed);

let worldRoot = null, ground = null;
const objMeshes = new Map(); let pickables = [];
const noise = (x,z) => Math.sin(x*0.7+z*0.3)*0.5 + Math.sin(x*0.23-z*0.61)*0.5;
function tileColor(t, i, j, pal){
  if (t === GRASS){ const n = noise(i,j); return new THREE.Color(pal.grass[0]).lerp(new THREE.Color(n>0?pal.grass[2]:pal.grass[1]), Math.abs(n)); }
  if (t === SAND) return new THREE.Color(pal.sand);
  if (t === PATH) return new THREE.Color(PATHC);
  if (t === TRACK) return new THREE.Color(TRACKC);
  if (t === PLAT) return new THREE.Color(PLATC);
  if (t === FLOWERF){ const n = noise(i,j); return new THREE.Color(pal.grass[1]).lerp(new THREE.Color(pal.grass[2]), Math.abs(n)*0.6); }
  if (t === FARM) return new THREE.Color(FARMC);
  return new THREE.Color(UNDERC);
}
function buildGround(pal){
  const geo = new THREE.PlaneGeometry(N, N, N*2, N*2); geo.rotateX(-Math.PI/2);
  const pos = geo.attributes.position, cols = new Float32Array(pos.count*3);
  for (let k=0;k<pos.count;k++){
    const x = pos.getX(k), z = pos.getZ(k);
    // sample the 4 tiles around this point (half-tile offsets) for smooth blending
    let cr=0, cg=0, cb=0, land=0, n=0;
    for (const [ox,oz] of [[-0.25,-0.25],[0.25,-0.25],[-0.25,0.25],[0.25,0.25]]){
      const i = Math.round(x+ox)+C, j = Math.round(z+oz)+C; const t = inb(i,j) ? tile[idx(i,j)] : WATER;
      const c = tileColor(t, i, j, pal); cr += c.r; cg += c.g; cb += c.b; n++; if (t !== WATER && t !== BRIDGE) land++;
    }
    pos.setY(k, land===4 ? 0 : land>=2 ? -0.1 : land===1 ? -0.35 : -0.75);
    cols[k*3] = cr/n; cols[k*3+1] = cg/n; cols[k*3+2] = cb/n;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  // drop triangles that sit entirely on the deep sea floor (the seabed plane shows there anyway)
  const ix = geo.index.array, keep = [];
  for (let k=0;k<ix.length;k+=3){ if (pos.getY(ix[k]) > -0.7 || pos.getY(ix[k+1]) > -0.7 || pos.getY(ix[k+2]) > -0.7) keep.push(ix[k], ix[k+1], ix[k+2]); }
  geo.setIndex(keep); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors:true })); m.receiveShadow = true; m.userData.ground = true;
  return m;
}
const geoCache = new Map();
const GC = (k, fn) => { let g = geoCache.get(k); if (!g){ g = fn(); geoCache.set(k, g); } return g; };
const SPH = (r, a, b) => GC('s'+r+'_'+(a||14), () => new THREE.SphereGeometry(r, a||14, b||10));
const TREE_LEAF = {
  cherry:{ spring:['#ffc6dc','#ffd6e6','#ffb8d2'], summer:['#b8e8ac','#a8e0a0'], autumn:['#ffc29a','#ffb08a'], winter:['#f4f8fc','#ffffff'] },
  maple:{ spring:['#d8f0a8','#c8eaa0'], summer:['#a6e0a0','#b2e6a6'], autumn:['#ff9a7a','#ffb36a','#ff8a8a'], winter:['#f4f8fc','#eef2f8'] },
  pine:{ spring:['#8fcfa0','#9ad6a8'], summer:['#86c898','#90d0a0'], autumn:['#8fc8a0','#98cfa4'], winter:['#9ccfae','#a8d6b6'] },
  orange:{ spring:['#9fd49a','#a8dca0'], summer:['#94cf90','#9fd49a'], autumn:['#a6d69a','#9fd49a'], winter:['#a8d6a6','#b2dcae'] },
  birch:{ spring:['#e2f4b8','#d8f0b0'], summer:['#c6eaa8','#d0eeb0'], autumn:['#ffe08a','#ffd36a'], winter:['#f4f8fc','#ffffff'] },
  palm:{ spring:['#a6dca0','#b6e4a8'], summer:['#9cd896','#aee0a2'], autumn:['#b2dca0','#a6d89a'], winter:['#b2dcae','#a6d6a6'] },
};
const FRUIT_C = { apple:'#e2393b', persimmon:'#ff8a1f', cherry:'#e8455a', pinecone:'#b08a6a', coconut:'#a8784e', orange:'#ffa63a', maple_leaf:'#ff8a6a', birch_bark:'#f4ece0' };
function buildTree(t, pal, r){
  const g = new THREE.Group(), tk = t.tk || 'round', s = season();
  const cg = new THREE.Group(); g.add(cg); g.userData.crown = cg;
  const fg = new THREE.Group(); g.add(fg); g.userData.fruit = fg;
  const lv = TREE_LEAF[tk] ? TREE_LEAF[tk][s] : pal.leaves, c = pick(lv, r), fc = FRUIT_C[t.fruit] || '#e2393b';
  const fruitAt = (pts, rad) => pts.forEach(p => M(SPH(rad||0.085, 10, 8), fc, p[0], p[1], p[2], fg));
  if (tk === 'round'){
    M(GC('trunk', () => new THREE.CylinderGeometry(0.1, 0.15, 0.9, 10)), '#c8a088', 0, 0.45, 0, g);
    M(SPH(0.5, 18, 14), c, 0, 1.15, 0, cg).scale.set(1, 0.9, 1);
    M(SPH(0.36, 16, 12), shade(c, 1.04), -0.3, 1.0, 0.18, cg);
    M(SPH(0.34, 16, 12), shade(c, 0.97), 0.3, 1.05, -0.12, cg);
    M(SPH(0.3, 16, 12), shade(c, 1.06), 0.05, 1.5, 0.05, cg);
    fruitAt([[0.45,1.0,0.25],[-0.2,1.3,0.45],[0.15,0.95,-0.48],[-0.5,1.1,-0.1]]);
  } else if (tk === 'cherry'){
    M(GC('trunkC', () => new THREE.CylinderGeometry(0.09, 0.16, 0.95, 10)), '#b89488', 0, 0.47, 0, g);
    [[0,1.25,0,0.5],[-0.42,1.1,0.1,0.34],[0.42,1.12,-0.05,0.36],[0.1,1.15,0.4,0.32],[-0.1,1.18,-0.4,0.33],[0.05,1.6,0,0.3]].forEach(([x,y,z,rr],k) => M(SPH(rr, 16, 12), shade(c, 0.96+k*0.02), x, y, z, cg).scale.set(1.1, 0.85, 1.1));
    if (s === 'spring') for (let k=0;k<7;k++) M(SPH(0.05, 8, 6), '#ffffff', Math.cos(k*0.9)*0.5, 1.2+((k*37)%5)*0.08, Math.sin(k*0.9)*0.5, cg);
    [[0.42,0.95,0.3],[-0.35,1.05,0.4],[0.2,0.95,-0.45]].forEach(([x,y,z]) => { M(SPH(0.055, 8, 6), fc, x, y, z, fg); M(SPH(0.055, 8, 6), fc, x+0.08, y-0.02, z, fg); });
  } else if (tk === 'maple'){
    M(GC('trunkM', () => new THREE.CylinderGeometry(0.08, 0.14, 1.0, 10)), '#b8907a', 0, 0.5, 0, g);
    [[0,1.0,0,0.52],[0,1.38,0,0.42],[0,1.7,0,0.28]].forEach(([x,y,z,rr],k) => M(SPH(rr, 16, 12), shade(c, 1-k*0.03), x, y, z, cg).scale.set(1, 0.72, 1));
    [[-0.38,1.15,0.25],[0.36,1.25,-0.2],[0.1,1.0,0.45]].forEach(([x,y,z]) => M(SPH(0.22, 12, 10), shade(c, 1.06), x, y, z, cg));
    if (s !== 'winter') [[0.3,0.04,0.35],[-0.35,0.04,-0.2],[0.05,0.04,-0.45]].forEach(([x,y,z]) => { const l = M(GC('leafD', () => new THREE.CircleGeometry(0.08, 5)), c, x, y, z, fg); l.rotation.x = -Math.PI/2; l.castShadow = false; });
  } else if (tk === 'pine'){
    M(GC('trunkP', () => new THREE.CylinderGeometry(0.08, 0.13, 0.7, 10)), '#b08a6a', 0, 0.35, 0, g);
    [[0.62,0.75,0.75],[0.48,0.68,1.2],[0.32,0.6,1.6]].forEach(([rr,h,y],k) => { M(GC('pc'+k, () => new THREE.ConeGeometry(rr, h, 16)), shade(c, 1-k*0.04), 0, y, 0, cg); if (s==='winter') M(GC('ps'+k, () => new THREE.ConeGeometry(rr*0.7, h*0.42, 16)), '#ffffff', 0, y+h*0.3, 0, cg); });
    [[0.42,0.62,0.2],[-0.3,1.05,0.28],[0.15,0.62,-0.45]].forEach(([x,y,z]) => M(GC('cone', () => new THREE.ConeGeometry(0.06, 0.14, 8)), fc, x, y, z, fg).rotation.x = Math.PI);
  } else if (tk === 'palm'){
    const lean = (r()-0.5)*0.5; let px = 0, py = 0;
    for (let k=0;k<6;k++){ const seg = M(GC('palmseg', () => new THREE.CylinderGeometry(0.1, 0.12, 0.3, 10)), k%2 ? '#e2c49a' : '#d6b488', px, py+0.15, 0, g); seg.rotation.z = -lean*0.6; px += Math.sin(lean)*0.09*k*0.35; py += 0.28; }
    cg.position.set(px, py, 0);
    for (let k=0;k<7;k++){ const a = k/7*Math.PI*2; const fr = new THREE.Group(); fr.rotation.y = a; cg.add(fr);
      const leaf = M(GC('frond', () => new THREE.SphereGeometry(0.5, 14, 8)), shade(c, 0.94+(k%3)*0.04), 0.42, -0.08, 0, fr); leaf.scale.set(1, 0.08, 0.28); leaf.rotation.z = -0.38; }
    M(SPH(0.13, 12, 10), shade(c, 0.9), 0, 0.02, 0, cg);
    fg.position.set(px, py-0.12, 0);
    [[0.12,0,0.06],[-0.1,0,0.09],[0.02,-0.02,-0.12]].forEach(([x,y,z]) => M(SPH(0.11, 12, 10), fc, x, y, z, fg));
  } else if (tk === 'orange'){
    M(GC('trunkO', () => new THREE.CylinderGeometry(0.09, 0.13, 0.7, 10)), '#c8a088', 0, 0.35, 0, g);
    M(SPH(0.56, 18, 14), c, 0, 1.05, 0, cg).scale.set(1, 0.85, 1);
    M(SPH(0.32, 14, 12), shade(c, 1.05), -0.34, 0.95, 0.2, cg); M(SPH(0.3, 14, 12), shade(c, 0.97), 0.34, 1.0, -0.15, cg);
    fruitAt([[0.5,0.95,0.2],[-0.25,1.25,0.45],[0.2,0.85,-0.5],[-0.52,1.0,-0.12],[0.1,1.35,0.3],[0.38,1.2,-0.3]], 0.075);
  } else if (tk === 'birch'){
    M(GC('trunkB', () => new THREE.CylinderGeometry(0.08, 0.11, 1.3, 10)), '#f6f0e6', 0, 0.65, 0, g);
    [0.35,0.7,1.0].forEach((y,k) => M(GC('bmark', () => new THREE.BoxGeometry(0.1, 0.03, 0.17)), '#6a5a5a', 0, y, 0.02, g).rotation.y = k*1.3);
    M(SPH(0.4, 16, 12), c, 0, 1.55, 0, cg).scale.set(0.85, 1.35, 0.85);
    M(SPH(0.24, 12, 10), shade(c, 1.05), 0.22, 1.3, 0.12, cg); M(SPH(0.22, 12, 10), shade(c, 0.97), -0.2, 1.42, -0.1, cg);
  }
  return g;
}
function buildRock(){ const g = new THREE.Group(); M(new THREE.DodecahedronGeometry(0.32, 1), '#d2cde0', 0, 0.18, 0, g).scale.set(1.1, 0.7, 1); M(new THREE.DodecahedronGeometry(0.18, 1), '#c4bed6', 0.28, 0.1, 0.18, g).scale.set(1, 0.7, 1); return g; }
const ROOFS = ['#9fdcc4','#f7b2b7','#c9b6f0','#a8ccf4','#f6e09a','#ffc6d2','#a8dcb4','#d8b896','#b8b4e0','#f8b4d0'];
function buildHouse(slot){
  const g = new THREE.Group(), roof = ROOFS[slot];
  M(new THREE.BoxGeometry(2.7,0.16,2.7), '#efe4d6', 0, 0.08, 0, g);
  M(new THREE.BoxGeometry(2.4,1.45,2.4), '#fff4e8', 0, 0.86, 0, g);
  const rf = M(new THREE.ConeGeometry(2.15, 1.3, 4), roof, 0, 2.2, 0, g); rf.rotation.y = Math.PI/4;
  M(new THREE.CylinderGeometry(0.14,0.16,0.6,12), '#e8c8b8', 0.65, 2.3, -0.45, g);
  M(new THREE.BoxGeometry(0.62,0.95,0.08), '#e0aa88', 0, 0.62, 1.22, g);
  M(new THREE.CylinderGeometry(0.31,0.31,0.08,16,1,false,0,Math.PI), '#e0aa88', 0, 1.1, 1.22, g).rotation.set(Math.PI/2, 0, -Math.PI/2);
  M(new THREE.SphereGeometry(0.04,8,6), '#ffe08a', 0.2, 0.62, 1.28, g);
  [-0.8, 0.8].forEach(x => { M(new THREE.BoxGeometry(0.5,0.5,0.06), matWin, x, 1.0, 1.21, g); M(new THREE.BoxGeometry(0.6,0.07,0.12), '#ffffff', x, 0.72, 1.24, g); });
  [-1, 1].forEach(s => M(new THREE.BoxGeometry(0.06,0.5,0.5), matWin, 1.21*s, 1.0, 0, g));
  M(new THREE.SphereGeometry(0.22,12,10), '#b8e6a0', -0.95, 0.2, 1.4, g); M(new THREE.SphereGeometry(0.18,12,10), '#c8eeb0', 0.95, 0.18, 1.45, g);
  return g;
}
function awning(w, a, b, parent, y, z){ const m = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, w, 20, 1, true, 0, Math.PI), new THREE.MeshToonMaterial({ map:stripeTex(a,b,Math.round(w*2.5)), gradientMap:GRAD, side:THREE.DoubleSide })); m.rotation.set(0, 0, Math.PI/2); m.position.set(0, y, z); m.castShadow = true; parent.add(m); return m; }
function buildMall(){
  const g = new THREE.Group();
  M(new THREE.BoxGeometry(5.0,0.16,3.0), '#efe4d6', 0, 0.08, 0, g);
  M(new THREE.BoxGeometry(4.7,2.1,2.7), '#ffe3ea', 0, 1.15, 0, g);
  M(new THREE.BoxGeometry(5.0,0.3,3.0), '#f7b8cc', 0, 2.35, 0, g);
  M(new THREE.CylinderGeometry(1.0,1.0,0.4,24,1,false,0,Math.PI), '#ffd0dc', 0, 2.5, 0, g).rotation.set(0, Math.PI/2, Math.PI/2);
  awning(4.6, '#ffffff', '#f7a8c0', g, 1.7, 1.38);
  [-1.45, 1.45].forEach(x => M(new THREE.BoxGeometry(1.2,0.95,0.06), matWin, x, 0.85, 1.36, g));
  M(new THREE.BoxGeometry(0.9,1.15,0.06), matWin, 0, 0.75, 1.36, g);
  const s = signMesh('쇼핑몰', 2.2, 0.55, '#ffffff', '#e86a92'); s.position.set(0, 2.36, 1.54); g.add(s);
  return g;
}
function buildCafe(){
  const g = new THREE.Group();
  M(new THREE.BoxGeometry(2.8,0.16,2.8), '#efe4d6', 0, 0.08, 0, g);
  M(new THREE.BoxGeometry(2.5,1.5,2.5), '#e2f5ea', 0, 0.9, 0, g);
  const rf = M(new THREE.ConeGeometry(2.1, 1.0, 4), '#d8b8a0', 0, 2.1, 0, g); rf.rotation.y = Math.PI/4;
  awning(2.4, '#ffffff', '#9fdcc4', g, 1.45, 1.3);
  M(new THREE.BoxGeometry(0.8,0.7,0.06), matWin, 0.62, 0.85, 1.26, g);
  M(new THREE.BoxGeometry(0.55,0.95,0.07), '#9fdcc4', -0.55, 0.6, 1.27, g);
  M(new THREE.CylinderGeometry(0.28,0.28,0.05,16), '#ffffff', 1.05, 0.5, 1.75, g); M(new THREE.CylinderGeometry(0.04,0.04,0.45,8), '#c8a088', 1.05, 0.25, 1.75, g);
  M(new THREE.CylinderGeometry(0.35,0.02,0.5,16), '#ffd8a8', 1.05, 1.0, 1.75, g);
  const s = signMesh('카페', 1.2, 0.4, '#9fdcc4', '#ffffff'); s.position.set(0, 1.95, 1.62); s.rotation.x = -0.2; g.add(s);
  return g;
}
function buildDepot(){
  const g = new THREE.Group();
  M(new THREE.BoxGeometry(5.0,0.16,3.0), '#e6e0d8', 0, 0.08, 0, g);
  M(new THREE.BoxGeometry(4.7,1.9,2.7), '#e4def4', 0, 1.0, 0, g);
  M(new THREE.CylinderGeometry(1.45,1.45,4.8,24,1,false,0,Math.PI), '#c8bce8', 0, 1.95, 0, g).rotation.set(0, 0, Math.PI/2);
  for (let k=0;k<6;k++) M(new THREE.BoxGeometry(1.6,0.13,0.06), k%2?'#d6d0ec':'#ece8f8', -0.8, 0.22+k*0.18, 1.37, g);
  [[1.35,0.22,1.75,0.45],[1.82,0.18,1.62,0.36],[1.55,0.6,1.7,0.32]].forEach(b => M(new THREE.BoxGeometry(b[3],b[3],b[3]), '#f2d6a8', b[0], b[1], b[2], g));
  const s = signMesh('물류센터', 1.9, 0.48, '#fff0a8', '#7a6aa0'); s.position.set(0, 1.6, 1.53); g.add(s);
  return g;
}
function buildShopB(){
  const g = new THREE.Group();
  M(new THREE.BoxGeometry(2.8,0.16,2.8), '#efe4d6', 0, 0.08, 0, g);
  M(new THREE.BoxGeometry(2.5,1.5,2.5), '#fff1c8', 0, 0.9, 0, g);
  M(new THREE.CylinderGeometry(1.4,1.4,2.8,24,1,false,0,Math.PI), '#ffc8b4', 0, 1.65, 0, g).rotation.set(0, 0, Math.PI/2);
  awning(2.4, '#ffffff', '#ffc8b4', g, 1.42, 1.3);
  M(new THREE.BoxGeometry(0.8,0.7,0.06), matWin, 0.62, 0.85, 1.26, g); M(new THREE.BoxGeometry(0.55,0.95,0.07), '#ffb7c9', -0.55, 0.6, 1.27, g);
  [[1.15,1.7],[-1.15,1.75]].forEach(([x,z]) => { M(new THREE.BoxGeometry(0.42,0.32,0.42), '#e6c8a6', x, 0.16, z, g); [0,1,2].forEach(k => M(new THREE.SphereGeometry(0.08,8,6), ['#ffb7c9','#ffe6a3','#9fdcb4'][k], x-0.1+k*0.1, 0.36, z, g)); });
  const s = signMesh('잡화점', 1.4, 0.42, '#ffffff', '#e8907a'); s.position.set(0, 2.0, 1.6); s.rotation.x = -0.2; g.add(s);
  return g;
}
function buildBankB(){
  const g = new THREE.Group();
  M(new THREE.BoxGeometry(2.9,0.24,2.9), '#ece6f0', 0, 0.12, 0, g);
  M(new THREE.BoxGeometry(2.5,1.55,2.4), '#fbf8ff', 0, 1.0, -0.1, g);
  [-1.0,-0.35,0.35,1.0].forEach(x => M(new THREE.CylinderGeometry(0.11,0.13,1.55,14), '#ffffff', x, 1.0, 1.25, g));
  M(new THREE.BoxGeometry(2.9,0.18,2.9), '#d8f0e6', 0, 1.86, 0, g);
  const pd = M(new THREE.CylinderGeometry(1.0,1.0,2.9,3,1), '#9fdcc4', 0, 2.2, 0, g); pd.rotation.set(0, 0, Math.PI/2); pd.scale.set(1, 1, 0.45); pd.rotation.x = Math.PI/2;
  M(new THREE.CylinderGeometry(0.22,0.22,0.06,20), '#ffe08a', 0, 2.25, 1.36, g).rotation.x = Math.PI/2;
  M(new THREE.BoxGeometry(0.7,1.0,0.07), '#c8b8e8', 0, 0.75, 1.07, g);
  const s = signMesh('은행', 1.0, 0.34, '#ffffff', '#5fb894'); s.position.set(0, 1.63, 1.53); g.add(s);
  return g;
}
function buildMailbox(){ const g = new THREE.Group(); M(new THREE.CylinderGeometry(0.05,0.06,0.8,8), '#c8a088', 0, 0.4, 0, g); M(new THREE.CapsuleGeometry(0.2,0.25,6,12), '#ffa8a8', 0, 0.92, 0, g).rotation.x = Math.PI/2; M(new THREE.BoxGeometry(0.04,0.28,0.06), '#ffe08a', 0.24, 1.02, 0.05, g); return g; }
function buildStation(st){
  const g = new THREE.Group(); const horiz = st.tiles[0][1] === st.tiles[1][1];
  const pl = M(new THREE.BoxGeometry(horiz?3:1, 0.12, horiz?1:3), '#efeaf6', 0, 0.06, 0, g);
  const pp = horiz ? [[-1.2,-0.3],[1.2,-0.3]] : [[-0.3,-1.2],[-0.3,1.2]];
  pp.forEach(([x,z]) => M(new THREE.CylinderGeometry(0.06,0.06,1.3,10), '#a8bce8', x, 0.75, z, g));
  M(new THREE.BoxGeometry(horiz?3.3:1.2, 0.12, horiz?1.2:3.3), '#b8cdf2', horiz?0:-0.1, 1.45, horiz?-0.1:0, g);
  const s = signMesh(st.name, 1.4, 0.36, '#ffffff', '#7a8fd0'); s.position.set(0, 1.78, horiz?0.4:0); if (!horiz) s.rotation.y = -Math.PI/2; g.add(s);
  return g;
}
const NH_STYLE = {
  toni:{ wall:'#fff1dc', roof:'#f2dcc0', shape:'dome', sign:'토니네', trim:'#9fdcc4' },
  kini:{ wall:'#ffffff', roof:'#ffc6d6', shape:'dome', sign:'끼니네', trim:'#ffb7c9' },
  momo:{ wall:'#fff4e8', roof:'#ffb88a', shape:'cone', sign:'모모네', trim:'#9fd49a' },
  coco:{ wall:'#eef0fb', roof:'#8f9ad8', shape:'gable', sign:'코코네', trim:'#ffe08a' },
  dan:{ wall:'#fff0e0', roof:'#f6a86a', shape:'tent', sign:'단풍네', trim:'#c8a088' },
  bobo:{ wall:'#f0d8bc', roof:'#c89a74', shape:'gable', sign:'보보네', trim:'#9a6a4a', logs:true },
  pang:{ wall:'#ffffff', roof:'#a8dca0', shape:'cone', sign:'팡팡네', trim:'#5b5468' },
  mong:{ wall:'#fffaf2', roof:'#ffffff', shape:'cloud', sign:'몽실네', trim:'#cdbcf2' },
  bori:{ wall:'#fff4e8', roof:'#ef9a8a', shape:'gable', sign:'역무원 숙소', trim:'#7a8fd0' },
};
function buildNHouse(b){
  const st = NH_STYLE[b.npc] || NH_STYLE.momo, g = new THREE.Group();
  M(GC('nhbase', () => new THREE.BoxGeometry(2.7,0.16,2.7)), '#efe4d6', 0, 0.08, 0, g);
  if (st.logs){ for (let k=0;k<6;k++){ const lg = M(GC('log', () => new THREE.CylinderGeometry(0.12,0.12,2.4,10)), k%2?st.wall:shade(st.wall,0.95), 0, 0.28+k*0.24, 0, g); lg.rotation.z = Math.PI/2; lg.scale.set(1,1,1); } M(GC('nhbody2', () => new THREE.BoxGeometry(2.3,1.45,2.3)), st.wall, 0, 0.86, 0, g); }
  else M(GC('nhbody', () => new THREE.BoxGeometry(2.4,1.45,2.4)), st.wall, 0, 0.86, 0, g);
  if (st.shape === 'dome'){ M(GC('dome', () => new THREE.SphereGeometry(1.55, 24, 16, 0, Math.PI*2, 0, Math.PI/2)), st.roof, 0, 1.55, 0, g).scale.set(1, 0.75, 1); M(SPH(0.16), st.trim, 0, 2.75, 0, g);
    if (b.npc==='toni' || b.npc==='kini'){ [-1,1].forEach(s => { const e = M(GC('rear', () => new THREE.CapsuleGeometry(0.16, 0.7, 6, 12)), st.roof, 0.45*s, 2.75, 0, g); e.rotation.z = -0.25*s; e.scale.set(1,1,0.55); M(GC('rear2', () => new THREE.CapsuleGeometry(0.08, 0.55, 6, 10)), '#ffc6d6', 0.45*s, 2.75, 0.07, g).rotation.z = -0.25*s; }); } }
  else if (st.shape === 'cone'){ const rf = M(GC('nhcone', () => new THREE.ConeGeometry(2.15, 1.4, 4)), st.roof, 0, 2.25, 0, g); rf.rotation.y = Math.PI/4; if (b.npc==='pang') [-1,1].forEach(s => M(SPH(0.28), '#5b5468', 0.8*s, 2.35, 0, g)); }
  else if (st.shape === 'gable'){ const rf = M(GC('gable', () => new THREE.CylinderGeometry(1.5, 1.5, 2.8, 3, 1)), st.roof, 0, 1.95, 0, g); rf.rotation.set(-Math.PI/2, 0, Math.PI/2); rf.scale.set(1, 1, 0.55); M(GC('chim', () => new THREE.BoxGeometry(0.3,0.6,0.3)), shade(st.roof,0.9), 0.7, 2.4, -0.5, g); }
  else if (st.shape === 'tent'){ const rf = M(GC('tent', () => new THREE.ConeGeometry(1.95, 1.9, 8)), st.roof, 0, 2.5, 0, g); for (let k=0;k<4;k++){ const sp = M(GC('tstripe', () => new THREE.ConeGeometry(1.96, 1.91, 8, 1, true, 0, 0.35)), '#fff4e0', 0, 2.5, 0, g); sp.rotation.y = k*Math.PI/2; } M(GC('flag', () => new THREE.BoxGeometry(0.03,0.6,0.03)), '#8a6a5a', 0, 3.6, 0, g); M(GC('flag2', () => new THREE.BoxGeometry(0.34,0.22,0.02)), '#ffe08a', 0.18, 3.78, 0, g); }
  else if (st.shape === 'cloud'){ [[0,2.0,0,0.9],[-0.75,1.85,0.3,0.62],[0.75,1.85,0.3,0.62],[-0.6,1.9,-0.5,0.6],[0.6,1.95,-0.5,0.62],[0,2.5,0,0.6]].forEach(([x,y,z,rr]) => M(SPH(rr, 16, 12), st.roof, x, y, z, g)); }
  // door & windows
  M(GC('nhdoor', () => new THREE.BoxGeometry(0.62,0.95,0.08)), st.trim, 0, 0.62, 1.22, g);
  M(GC('nhdoorTop', () => new THREE.CylinderGeometry(0.31,0.31,0.08,16,1,false,0,Math.PI)), st.trim, 0, 1.1, 1.22, g).rotation.set(Math.PI/2, 0, -Math.PI/2);
  M(SPH(0.04, 8, 6), '#ffe08a', 0.2, 0.62, 1.28, g);
  [-0.8, 0.8].forEach(x => { M(GC('nhwin', () => new THREE.CylinderGeometry(0.24,0.24,0.06,18)), matWin, x, 1.0, 1.21, g).rotation.x = Math.PI/2; M(GC('nhwinF', () => new THREE.TorusGeometry(0.25,0.04,6,18)), '#ffffff', x, 1.0, 1.24, g); });
  const sw = st.sign.length>4 ? 1.3 : 0.95, sx = 1.25 + (sw-0.95)/2;
  [-1,1].forEach(k => M(GC('nhpost', () => new THREE.CylinderGeometry(0.035,0.04,0.75,8)), '#c8a088', sx + k*(sw/2-0.08), 0.37, 1.85, g));
  M(new THREE.BoxGeometry(sw+0.08, 0.36, 0.05), shade(st.trim, 0.95), sx, 0.72, 1.83, g);
  const s = signMesh(st.sign, sw, 0.3, '#ffffff', shade(st.trim, 0.75)); s.position.set(sx, 0.72, 1.86); g.add(s);
  M(SPH(0.22, 12, 10), '#b8e6a0', -0.95, 0.2, 1.4, g); M(SPH(0.18, 12, 10), '#ffd0dc', 0.95, 0.18, 1.45, g);
  return g;
}
function buildBridges(){
  const list = [];
  BRIDGES.forEach(([x,z,h]) => {
    list.push([x, -0.06, z, 1.02, 0.12, 1.02, '#e8cfb2', 0]);
    for (let k=-1;k<=1;k++) list.push([x + (h?k*0.33:0), 0.005, z + (h?0:k*0.33), h?0.26:1.0, 0.03, h?1.0:0.26, k%2?'#f0dcc4':'#dcc2a4', 0]);
    [-0.47,0.47].forEach(o => { list.push([x + (h?0:o), 0.22, z + (h?o:0), h?1.02:0.07, 0.06, h?0.07:1.02, '#fff4e8', 0]); list.push([x + (h?0:o), 0.1, z + (h?o:0), 0.08, 0.32, 0.08, '#e0c8ac', 0]); });
    list.push([x, -0.45, z, 0.16, 0.7, 0.16, '#c8b098', 0]);
  });
  const m = vox(list); return m;
}
let fieldMesh = null, fieldIdx = new Map();
function buildFields(pal){
  const cells = []; for (let j=0;j<N;j++) for (let i=0;i<N;i++) if (tile[idx(i,j)]===FLOWERF) cells.push([i,j]);
  const per = 8, head = new THREE.InstancedMesh(SPH(0.1, 10, 8), matStd, cells.length*per), bush = new THREE.InstancedMesh(SPH(0.3, 10, 8), TM('#ffffff'), cells.length*2), stem = new THREE.InstancedMesh(GC('stem', () => new THREE.CylinderGeometry(0.015,0.015,0.2,5)), TM('#8fcf8a'), cells.length*per);
  const win = season()==='winter'; fieldIdx = new Map();
  cells.forEach(([i,j],c) => { const F = fieldAt(wx(i), wz(j)), rr = rng(i*977+j*131); const ids = [];
    for (let k=0;k<per;k++){ const n = c*per+k, x = wx(i)+(rr()-0.5)*0.85, z = wz(j)+(rr()-0.5)*0.85, h = 0.2+rr()*0.16;
      _o.position.set(x, h, z); _o.scale.set(F && F.flower==='sunflower' ? 1.6 : 1, 1, F && F.flower==='sunflower' ? 1.6 : 1); _o.rotation.set(0,0,0); _o.updateMatrix(); head.setMatrixAt(n, _o.matrix);
      head.setColorAt(n, new THREE.Color(win ? (k%2?'#ffffff':'#f0f4ff') : F ? F.cols[Math.floor(rr()*F.cols.length)] : '#ffb3c8'));
      _o.position.set(x, h/2, z); _o.scale.set(1, h/0.2, 1); _o.updateMatrix(); stem.setMatrixAt(n, _o.matrix); ids.push(n); }
    for (let k=0;k<2;k++){ _o.position.set(wx(i)+(k?0.22:-0.2), 0.03, wz(j)+(k?-0.18:0.2)); _o.scale.set(1.1, 0.35, 1.1); _o.updateMatrix(); bush.setMatrixAt(c*2+k, _o.matrix); bush.setColorAt(c*2+k, new THREE.Color(win ? '#e8f0ec' : k ? '#a8dca0' : '#b6e4a8')); }
    fieldIdx.set(key(i,j), { ids, x:wx(i), z:wz(j) }); });
  head.castShadow = false; stem.castShadow = false; bush.castShadow = false; bush.receiveShadow = true; const g = new THREE.Group(); g.add(bush); g.add(head); g.add(stem); g.userData.head = head; return g;
}
function refreshFields(){
  if (!fieldMesh || !G.me) return; const picked = (G.me.daily && G.me.daily.fl) || [], head = fieldMesh.userData.head;
  fieldIdx.forEach((v,k) => { const hide = picked.includes(k); v.ids.forEach(n => { head.getMatrixAt(n, _o.matrix); _o.matrix.decompose(_o.position, _o.quaternion, _o.scale); const want = hide ? 0.001 : 1; if (Math.abs(_o.scale.y - want) > 0.01){ _o.scale.set(want,want,want); _o.updateMatrix(); head.setMatrixAt(n, _o.matrix); } }); });
  head.instanceMatrix.needsUpdate = true;
}
function buildSignpost(x, z, text, rot){
  const g = new THREE.Group(); M(GC('spost', () => new THREE.CylinderGeometry(0.05,0.06,1.1,8)), '#c8a088', 0, 0.55, 0, g);
  const s = signMesh(text, 1.2, 0.34, '#fff4e8', '#7a6aa0'); s.position.set(0, 1.0, 0.07); g.add(s);
  const back = M(GC('spback', () => new THREE.BoxGeometry(1.2,0.34,0.05)), '#e6c8a6', 0, 1.0, 0.03, g);
  g.position.set(x, 0, z); g.rotation.y = rot || 0; return g;
}
let flowerMesh = null;
function buildWorld(){
  if (worldRoot) scene.remove(worldRoot);
  worldRoot = new THREE.Group(); scene.add(worldRoot); objMeshes.clear();
  const pal = PAL[season()], r = rng(5);
  ground = buildGround(pal); worldRoot.add(ground);
  // flowers (instanced little spheres on stems)
  const fGeo = new THREE.SphereGeometry(0.07, 10, 8), fl = new THREE.InstancedMesh(fGeo, matStd, flowers.length*2);
  flowers.forEach((f,k) => { const x = wx(f.i)+f.ox, z = wz(f.j)+f.oz;
    _o.position.set(x,0.18,z); _o.scale.set(1,1,1); _o.updateMatrix(); fl.setMatrixAt(k*2,_o.matrix); fl.setColorAt(k*2, new THREE.Color(pal.flower[f.c]));
    _o.position.set(x,0.07,z); _o.scale.set(0.35,1.3,0.35); _o.updateMatrix(); fl.setMatrixAt(k*2+1,_o.matrix); fl.setColorAt(k*2+1, new THREE.Color('#9fd49a')); });
  worldRoot.add(fl); flowerMesh = fl;
  worldRoot.add(buildBridges());
  fieldMesh = buildFields(pal); worldRoot.add(fieldMesh); refreshFields();
  [[-12,3,'꽃섬 ←',0],[13.5,10,'농장섬 →',0],[7,15.5,'야자섬 ↓',0],[-31,3,'도토리섬 →',0],[32,10,'← 도토리섬',0],[7,32,'도토리섬 ↑',0]].forEach(([x,z,t,r]) => worldRoot.add(buildSignpost(x,z,t,r)));
  // rails
  const rails = [];
  for (let s=0; s<TR.L; s+=0.5){ const p = trackAt(s); rails.push([p.x,0.03,p.z,0.85,0.05,0.14,'#d8bca8',p.ang+Math.PI/2]); }
  for (let s=0; s<TR.L; s+=0.35){ const p = trackAt(s+0.175); [-0.27,0.27].forEach(o => rails.push([p.x+Math.cos(p.ang)*o, 0.08, p.z-Math.sin(p.ang)*o, 0.06,0.05,0.38,'#a8a4c0',p.ang])); }
  const rm = vox(rails); rm.castShadow = false; worldRoot.add(rm);
  const tr = rng(11), done = new Set();
  statics.forEach((s,k) => {
    if (s.kind && BY[s.id] === s && done.has(s.id)){ objMeshes.set(k, objMeshes.get(s.id)); return; }
    let g = null;
    if (s.kind==='tree') g = buildTree(s, pal, tr);
    else if (s.kind==='rock') g = buildRock();
    else if (BY[s.id] === s){ done.add(s.id); g = s.kind==='house' ? buildHouse(s.slot) : s.kind==='mall' ? buildMall() : s.kind==='cafe' ? buildCafe() : s.kind==='depot' ? buildDepot() : s.kind==='shop' ? buildShopB() : s.kind==='bank' ? buildBankB() : s.kind==='nhouse' ? buildNHouse(s) : (typeof buildExtraB === 'function' && buildExtraB(s)) || buildMailbox(); }
    if (!g) return;
    const px = s.cx !== undefined ? s.cx : wx(s.i), pz = s.cz !== undefined ? s.cz : wz(s.j);
    g.position.set(px,0,pz);
    const pkey = s.cx !== undefined ? s.id : k;
    g.traverse(o => { o.userData.key = pkey; });
    worldRoot.add(g); objMeshes.set(k, g); if (s.cx !== undefined) objMeshes.set(s.id, g);
  });
  STATIONS.forEach(st => { const g = buildStation(st); g.position.set(st.px,0,st.pz); g.traverse(o => { o.userData.key = 'st_'+st.id; }); worldRoot.add(g); objMeshes.set('st_'+st.id, g); });
  refreshFruit(); rebuildPickables(); applyTime(true);
}

/* ================= placed decor ================= */
const placedMeshes = new Map();
const saplingStage = at => { const d = (Date.now()-at)/DAY; return d<2?0:d<7?1:d<30?2:3; };
function buildDecor(p){
  const t = p.t, g = new THREE.Group(), pal = PAL[season()];
  if (t==='bench'){ M(new THREE.BoxGeometry(0.9,0.08,0.34), '#e0b898', 0, 0.32, 0, g); M(new THREE.BoxGeometry(0.9,0.2,0.06), '#e0b898', 0, 0.55, -0.15, g); [-0.36,0.36].forEach(x => M(new THREE.CylinderGeometry(0.035,0.035,0.32,8), '#a89cc0', x, 0.16, 0, g)); }
  else if (t==='pot'){ M(new THREE.CylinderGeometry(0.2,0.15,0.3,16), '#f2b8a0', 0, 0.15, 0, g); M(new THREE.SphereGeometry(0.17,12,10), '#a8dca0', 0, 0.38, 0, g); [['#ffb3c8',0.08,0.5,0.05],['#fff0a8',-0.08,0.47,-0.05]].forEach(f => M(new THREE.SphereGeometry(0.07,10,8), f[0], f[1], f[2], f[3], g)); }
  else if (t==='lamp'){ M(new THREE.CylinderGeometry(0.05,0.07,1.4,10), '#a89cc0', 0, 0.7, 0, g); M(new THREE.ConeGeometry(0.2,0.16,12), '#a89cc0', 0, 1.56, 0, g); M(new THREE.SphereGeometry(0.13,14,10), matBulb, 0, 1.4, 0, g).castShadow = false; }
  else if (t==='fence'){ [-0.4,0.4].forEach(x => M(new THREE.CylinderGeometry(0.06,0.06,0.6,10), '#fff4e8', x, 0.3, 0, g)); [0.22,0.44].forEach(y => M(new THREE.BoxGeometry(0.95,0.07,0.05), '#f6e8d8', 0, y, 0, g)); }
  else if (t==='pumpkin'){ M(new THREE.SphereGeometry(0.28,16,12), '#ffbf8a', 0, 0.22, 0, g).scale.set(1.15,0.8,1.15); M(new THREE.CylinderGeometry(0.03,0.04,0.14,8), '#9fd49a', 0, 0.46, 0, g); }
  else if (t==='flowerbed'){ M(new THREE.CylinderGeometry(0.45,0.48,0.1,20), '#d8b8a0', 0, 0.05, 0, g); const r = rng(p.at % 9973); for (let k=0;k<8;k++){ const a = r()*6.28, d = r()*0.32; M(new THREE.SphereGeometry(0.075,10,8), pick(pal.flower,r), Math.cos(a)*d, 0.17, Math.sin(a)*d, g); } }
  else if (t==='sapling'){
    const st = saplingStage(p.at), r = rng(p.at % 7919), lc = pick(pal.leaves, r);
    if (st===0){ M(new THREE.CylinderGeometry(0.15,0.16,0.06,14), '#d8b8a0', 0, 0.03, 0, g); M(new THREE.CylinderGeometry(0.015,0.015,0.2,6), '#9fd49a', 0, 0.15, 0, g); M(new THREE.SphereGeometry(0.06,8,6), '#b8e6a0', 0.05, 0.27, 0, g).scale.set(1.4,0.6,1); }
    else if (st===1){ M(new THREE.CylinderGeometry(0.05,0.06,0.5,8), '#c8a088', 0, 0.25, 0, g); M(new THREE.SphereGeometry(0.2,14,10), lc, 0, 0.6, 0, g); }
    else if (st===2){ M(new THREE.CylinderGeometry(0.07,0.1,0.7,8), '#c8a088', 0, 0.35, 0, g); M(new THREE.SphereGeometry(0.34,16,12), lc, 0, 0.88, 0, g); M(new THREE.SphereGeometry(0.22,14,10), lc, 0.18, 1.12, 0.05, g); }
    else { const tg = buildTree({ fruit:'apple' }, pal, r); tg.remove(tg.userData.fruit); g.add(tg); }
  }
  return g;
}
function syncPlaced(){
  const data = Store.data.placed;
  placedMeshes.forEach((v,k) => { if (!data[k]){ scene.remove(v.group); placedMeshes.delete(k); } });
  if (!Store.readOnly && Store.mode !== 'loading'){ const legacy = Object.keys(data).filter(k => /^\d+_\d+$/.test(k) && data[k] && DEC[data[k].t]);
    legacy.forEach(k => { const [i,j] = dparse(k); const nk = dkey(i,j); const p = data[k]; Store.delPlaced(k); if (!data[nk]) Store.setPlaced(nk, p); }); }
  Object.entries(data).forEach(([k,p]) => {
    if (!p || !DEC[p.t]) return;
    const sig = p.t + (p.t==='sapling' ? saplingStage(p.at) : '') + season();
    const cur = placedMeshes.get(k); if (cur && cur.sig === sig) return; if (cur) scene.remove(cur.group);
    const [i,j] = dparse(k); const g = buildDecor(p); g.position.set(wx(i),0,wz(j));
    g.traverse(o => { o.userData.key = k; o.userData.placed = true; }); scene.add(g); placedMeshes.set(k, { group:g, sig });
  });
  rebuildPickables(); applyTime(true);
}
function rebuildPickables(){
  pickables = []; if (ground) pickables.push(ground);
  new Set(objMeshes.values()).forEach(g => g.traverse(o => { if (o.isMesh) pickables.push(o); }));
  placedMeshes.forEach(v => v.group.traverse(o => { if (o.isMesh) pickables.push(o); }));
  Object.values(chars).forEach(c => c.g.traverse(o => { if (o.isMesh) pickables.push(o); }));
  if (typeof npcs !== 'undefined') Object.values(npcs).forEach(np => np.g.traverse(o => { if (o.isMesh) pickables.push(o); }));
  if (spotsGroup) spotsGroup.traverse(o => { if (o.isMesh) pickables.push(o); });
}

/* ================= train ================= */
const train = { s:0, group:new THREE.Group(), cars:[] };
(function(){
  const wheels = g => [[-0.42,0.36],[0.42,0.36],[-0.42,-0.36],[0.42,-0.36]].forEach(([x,z]) => M(new THREE.CylinderGeometry(0.15,0.15,0.08,16), '#8a7aa8', x, 0.17, z, g).rotation.z = Math.PI/2);
  const eng = new THREE.Group();
  M(new THREE.CapsuleGeometry(0.34, 0.75, 6, 16), '#ffa8a8', 0, 0.55, 0.12, eng).rotation.x = Math.PI/2;
  M(new THREE.BoxGeometry(0.82,0.75,0.55), '#ffb8b8', 0, 0.72, -0.4, eng);
  M(new THREE.BoxGeometry(0.95,0.1,0.7), '#fff4e8', 0, 1.13, -0.4, eng);
  M(new THREE.CylinderGeometry(0.1,0.14,0.36,12), '#8a7aa8', 0, 1.0, 0.45, eng);
  M(new THREE.SphereGeometry(0.1,12,8), matBulb, 0, 0.55, 0.62, eng);
  M(new THREE.BoxGeometry(0.7,0.28,0.04), matWin, 0, 0.85, -0.12, eng);
  wheels(eng); train.group.add(eng); train.cars.push(eng);
  ['#a8dcf0','#b8e6b0'].forEach(col => { const g = new THREE.Group(); M(new THREE.BoxGeometry(0.82,0.7,1.2), col, 0, 0.55, 0, g); M(new THREE.BoxGeometry(0.92,0.1,1.3), '#fff4e8', 0, 0.95, 0, g); [-1,1].forEach(s => M(new THREE.BoxGeometry(0.04,0.26,0.85), matWin, 0.42*s, 0.65, 0, g)); wheels(g); train.group.add(g); train.cars.push(g); });
  train.group.traverse(o => { o.userData.key = 'train'; });
  scene.add(train.group);
})();
function placeTrain(){
  train.cars.forEach((c,k) => { const p = trackAt(train.s - k*1.45); c.position.set(p.x,0,p.z); c.rotation.y = p.ang; });
}

/* ================= characters & vehicles ================= */
const chars = {};
function vehicleMesh(id){
  const it = ITEM[id]; if (!it) return null; const c = it.v.c, g = new THREE.Group();
  if (id === 'bike'){ g.add(vox([[0,0.22,0.32,0.06,0.44,0.44,'#24304a'],[0,0.22,-0.32,0.06,0.44,0.44,'#24304a'],[0,0.42,0,0.06,0.06,0.7,c],[0,0.55,0.25,0.06,0.3,0.06,c],[0,0.7,0.25,0.4,0.05,0.05,'#24304a'],[0,0.55,-0.12,0.16,0.05,0.2,'#5a4a3a']])); }
  if (id === 'scooter'){ g.add(vox([[0,0.15,0.35,0.1,0.3,0.3,'#24304a'],[0,0.15,-0.35,0.1,0.3,0.3,'#24304a'],[0,0.3,0,0.4,0.15,0.9,c],[0,0.55,-0.2,0.38,0.12,0.4,'#5a4a3a'],[0,0.6,0.38,0.12,0.6,0.12,c],[0,0.9,0.38,0.5,0.06,0.06,'#24304a'],[0,0.75,0.45,0.2,0.12,0.06,'#fff3c0']])); }
  if (id === 'car'){ g.add(vox([[0,0.38,0,1.0,0.42,1.4,c],[0,0.7,-0.12,0.9,0.36,0.85,shade(c,0.95)],[0,0.72,0.31,0.82,0.28,0.04,'#bfe6ff'],[-0.46,0.72,-0.12,0.02,0.24,0.6,'#bfe6ff'],[0.46,0.72,-0.12,0.02,0.24,0.6,'#bfe6ff'],[-0.5,0.18,0.45,0.1,0.34,0.34,'#24304a'],[0.5,0.18,0.45,0.1,0.34,0.34,'#24304a'],[-0.5,0.18,-0.45,0.1,0.34,0.34,'#24304a'],[0.5,0.18,-0.45,0.1,0.34,0.34,'#24304a'],[-0.3,0.42,0.71,0.18,0.12,0.04,'#fff3c0'],[0.3,0.42,0.71,0.18,0.12,0.04,'#fff3c0']])); }
  return g;
}
function makeChar(slot){
  const g = new THREE.Group(); scene.add(g);
  const lbl = document.createElement('div'); lbl.className = 'lbl'; $('#labels').appendChild(lbl);
  return { slot, g, model:null, veh:null, sig:'', lbl, i:SPAWN[0], j:SPAWN[1], x:wx(SPAWN[0]), z:wz(SPAWN[1]), path:[], onArrive:null, face:0, walkT:0, rod:null, ride:null };
}
function applyLook(c, p){
  const L = lookOf(p), ride = p.ride && p.owned && p.owned[p.ride] ? p.ride : null;
  if (c.faceMode === 'sleep'){ L.eyes = 'closed'; L.mouth = 'smile'; } else if (c.faceMode === 'ouch'){ L.eyes = 'ouch'; L.mouth = 'wavy'; }
  const sig = JSON.stringify(L) + '|' + ride;
  if (sig === c.sig) return;
  c.sig = sig;
  if (c.model) c.g.remove(c.model); if (c.veh) c.g.remove(c.veh);
  c.model = Char3D.build(THREE, L); c.g.add(c.model);
  c.ride = ride; c.veh = ride ? vehicleMesh(ride) : null;
  if (c.veh){ c.g.add(c.veh); }
  c.model.position.y = ride==='car' ? 0.32 : ride==='scooter' ? 0.22 : ride==='bike' ? 0.26 : 0;
  c.model.scale.setScalar(ride==='car' ? 0.82 : 1);
  if (ride==='car') c.model.userData.legs.forEach(l => l.visible = false);
  c.g.traverse(o => { o.userData.char = c.slot; });
  c.rod = null; rebuildPickables();
}
const charAt = (c,i,j) => { c.i=i; c.j=j; c.x=wx(i); c.z=wz(j); c.g.position.set(c.x,0,c.z); };

/* ================= game state ================= */
const G = { slot:null, me:null, fishing:null, build:null, zoom:1.3, started:false, shake:[], fx:[], panel:null, focus:false, mini:null, ride:null, delivery:null };
const pid = s => 'p'+s;
function blankPlayer(s){
  return { name:SLOTS[s].name, i:SPAWN[0], j:SPAWN[1], acorns:120, look:Object.assign({}, SLOTS[s].look), made:false,
    wear:{ top:'tee_w', bottom:'jeans', shoes:'sneaker_w' }, owned:{ tee_w:1, jeans:1, sneaker_w:1 }, ride:null,
    stamina:100, stAt:Date.now(), restAt:0, dex:{}, daily:{}, debtSince:null, debtTick:null, repoDay:'', at:Date.now(), wv:6 };
}
function ensureDaily(){
  const me = G.me; if (!me) return;
  if (!me.daily || me.daily.date !== today()) me.daily = { date:today(), trees:[], rocks:[], fish:0, spent:0, earned:0, jobs:{}, banned:{}, splurge:false };
  me.daily.jobs = me.daily.jobs || {}; me.daily.banned = me.daily.banned || {}; me.daily.got = me.daily.got || []; me.daily.fl = me.daily.fl || [];
}
function saveMe(now){ if (!G.me) return; G.me.at = Date.now(); Store.savePlayer(pid(G.slot), G.me, now); }
function regenStamina(){
  const me = G.me; const now = Date.now(); const n = Math.floor((now - (me.stAt||now)) / ECON.regenMs);
  if (n > 0){ me.stamina = Math.min(ECON.stamMax, me.stamina + n); me.stAt = (me.stAt||now) + n*ECON.regenMs; }
  if (me.stamina >= ECON.stamMax) me.stAt = now;
}
function earn(n, why){
  ensureDaily(); n = Math.round(n); G.me.acorns += n; G.me.daily.earned += Math.max(0,n);
  if (G.me.acorns >= 0){ G.me.debtSince = null; G.me.debtTick = null; }
  updateHud(); saveMe();
}
function spend(n){
  ensureDaily(); n = Math.round(n); G.me.acorns -= n; G.me.daily.spent += n;
  if (G.me.acorns < 0 && !G.me.debtSince){ G.me.debtSince = Date.now(); G.me.debtTick = Date.now(); }
  if (G.me.daily.spent > ECON.splurge && !G.me.daily.splurge){
    G.me.daily.splurge = true;
    pop('지름신 후유증', '오늘 도토리를 '+G.me.daily.spent+'개나 썼어요.<br>오늘은 일해서 버는 돈이 20% 줄어요.', true);
  }
  updateHud(); saveMe();
}
function fine(n, why){ spend(n); }
function processDebt(){
  const me = G.me; if (!me || me.acorns >= 0 || !me.debtSince) return;
  const now = Date.now(); let days = Math.floor((now - (me.debtTick||me.debtSince)) / DAY), total = 0;
  while (days-- > 0 && me.acorns < 0){ const it = Math.max(5, Math.ceil(-me.acorns * ECON.interest)); me.acorns -= it; total += it; me.debtTick = (me.debtTick||me.debtSince) + DAY; }
  if (total) pop('빚 이자', '외상값에 이자가 붙었어요. 도토리 -'+total, true);
  const owedDays = Math.floor((now - me.debtSince) / DAY);
  if (owedDays >= ECON.repoDays && me.repoDay !== today()){
    const owned = Object.keys(me.owned||{}).filter(id => ITEM[id] && ITEM[id].price > 0).sort((a,b) => ITEM[b].price - ITEM[a].price);
    if (owned.length){
      const id = owned[0], it = ITEM[id]; delete me.owned[id];
      Object.keys(me.wear).forEach(k => { if (me.wear[k] === id) delete me.wear[k]; }); if (me.ride === id) me.ride = null;
      if (!me.wear.top && !me.wear.set) me.wear.top = 'tee_w'; if (!me.wear.bottom && !me.wear.set) me.wear.bottom = 'jeans';
      const back = Math.round(it.price * 0.5); me.acorns += back; me.repoDay = today();
      pop('압류', '빚을 '+owedDays+'일 동안 못 갚아서 <b>'+esc(it.name)+'</b>을(를) 가져갔어요.<br>빚에서 도토리 '+back+'개를 깎아 줬어요.', true);
      applyLook(chars[G.slot], me);
    }
  }
  updateHud(); saveMe();
}
const payRate = () => (G.me.daily.splurge ? 0.8 : 1) * (G.me.stamina < 20 ? 0.85 : 1);

/* ================= grid / path ================= */
function blocked(i,j){
  if (!inb(i,j)) return true; if (tile[idx(i,j)] === WATER) return true;
  if (statics.has(key(i,j))) return true; if (Store.data.placed[dkey(i,j)]) return true; return false;
}
function bfs(si,sj, goal){
  const prev = new Int32Array(N*N).fill(-1), seen = new Uint8Array(N*N); const q = [idx(si,sj)]; seen[idx(si,sj)] = 1; let h = 0;
  const D = [[1,0],[-1,0],[0,1],[0,-1]];
  while (h < q.length){
    const cur = q[h++]; const ci = cur % N, cj = (cur/N)|0;
    if (goal(ci,cj)){ const path = []; let k = cur; while (k !== idx(si,sj)){ path.unshift([k%N,(k/N)|0]); k = prev[k]; } return path; }
    for (const [a,b] of D){ const ni=ci+a, nj=cj+b; if (!inb(ni,nj)) continue; const n = idx(ni,nj); if (seen[n] || blocked(ni,nj)) continue; seen[n]=1; prev[n]=cur; q.push(n); }
  }
  return null;
}
const adjTo = (ti,tj) => (i,j) => Math.abs(i-ti)+Math.abs(j-tj) === 1;
function goalFor(ti,tj){
  const s = statics.get(key(ti,tj));
  if (s && s.door){ const [di,dj] = T(s.door[0], s.door[1]); return (i,j) => i===di && j===dj; }
  return adjTo(ti,tj);
}
function walkTo(ti,tj, after){
  const me = chars[G.slot]; if (G.ride) return; stopFishing();
  if (!after && blocked(ti,tj)){ toast('거기는 갈 수 없어요'); return; }
  const goal = after ? goalFor(ti,tj) : ((i,j) => i===ti && j===tj);
  if (after && goal(me.i, me.j)){ faceTile(me,ti,tj); after(); return; }
  const path = bfs(me.i, me.j, goal);
  if (!path){ toast('거기까지 가는 길이 없어요'); return; }
  me.path = path; me.onArrive = after ? () => { faceTile(me,ti,tj); after(); } : null;
}
function faceTile(c,ti,tj){ const s = statics.get(key(ti,tj)); const x = s && s.cx!==undefined ? s.cx : wx(ti), z = s && s.cz!==undefined ? s.cz : wz(tj); c.face = Math.atan2(x-c.x, z-c.z); }

/* ================= nature interactions ================= */
const fruitNow = s => { if (!s.fruit) return false; return season()!=='winter' || ['pinecone','coconut','orange'].includes(s.fruit); };
function refreshFruit(){
  statics.forEach((s,k) => { if (s.kind!=='tree') return; const g = objMeshes.get(k); if (!g || !g.userData.fruit) return;
    g.userData.fruit.visible = !(G.me && G.me.daily && G.me.daily.date===today() && (G.me.daily.trees||[]).includes(s.id)) && fruitNow(s); });
}
function shakeTree(s){
  const g = objMeshes.get(key(s.i,s.j)); G.shake.push({ g:g.userData.crown, t:0 }); ensureDaily(); doAnim('shake');
  if (typeof hiveShake === 'function' && hiveShake(s)) return;
  if (!fruitNow(s)){ toast('지금은 아무것도 안 떨어져요. 따뜻해지면 다시 와요'); return; }
  if (G.me.daily.trees.includes(s.id)){ toast('오늘은 다 땄어요. 내일 또 열려요'); return; }
  G.me.daily.trees.push(s.id); G.fx.push({ g:g.userData.fruit, t:0 }); setTimeout(refreshFruit, 500);
  const it = GATHER[s.fruit], n = ['apple','persimmon','orange','cherry'].includes(s.fruit) ? 3 : s.fruit==='coconut' ? 2 : 1 + Math.floor(Math.random()*2);
  const isNew = addItem(s.fruit, n); saveMe();
  pop((isNew?'<div class="new">도감 새 등록</div>':'')+'<div class="sw" style="background:'+it.c+';width:40px;height:22px;margin:0 auto 4px"></div>'+it.name+' '+n+'개', '나무를 흔들었더니 떨어졌어요!<br><small>잡화점에서 하나에 도토리 '+it.price+'</small>');
}
function hitRock(s){
  const g = objMeshes.get(key(s.i,s.j)); G.shake.push({ g, t:0, rock:true }); ensureDaily(); doAnim('hit');
  if (G.me.daily.rocks.includes(s.id)){ toast('단단한 돌이에요. 내일 다시 두드려 봐요'); return; }
  G.me.daily.rocks.push(s.id); const n = 4+Math.floor(Math.random()*5); earn(n); toast('돌 틈에서 도토리 '+n+'개를 찾았어요');
}
let bobber = null;
function startFishing(ti,tj){
  const me = chars[G.slot];
  if (!bobber){ bobber = vox([[0,0,0,0.16,0.12,0.16,'#ffffff'],[0,0.1,0,0.16,0.08,0.16,'#e0574a']]); scene.add(bobber); }
  bobber.position.set(wx(ti),-0.28,wz(tj)); bobber.visible = true;
  if (!me.rod){ const arm = me.model.userData.arms[1]; me.rod = new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.015,1.1,6), new THREE.MeshLambertMaterial({ color:'#8a5a34' })); me.rod.position.set(0,-0.25,0.4); me.rod.rotation.x = Math.PI/2 - 0.5; arm.add(me.rod); }
  me.rod.visible = true;
  G.fishing = { ti, tj, state:'wait', biteAt:performance.now()+1600+Math.random()*3400 };
  toast('찌가 움직이면 화면을 탭!', 1600);
}
function stopFishing(){ if (!G.fishing) return; G.fishing = null; if (bobber) bobber.visible = false; const me = chars[G.slot]; if (me && me.rod) me.rod.visible = false; hideBubble(); }
function rollFish(){ const s = season(), h = hourNow(), night = h>=19||h<5; const pool = FISH.filter(f => (f.seasons==='all'||f.seasons.includes(s)) && (f.when==='any'||(f.when==='night')===night)); let tot = pool.reduce((a,f)=>a+f.w,0), r = Math.random()*tot; for (const f of pool){ r -= f.w; if (r<=0) return f; } return pool[0]; }
function fishTap(){
  if (G.fishing.state === 'bite'){
    const f = rollFish(); ensureDaily(); const isNew = !G.me.dex[f.id]; G.me.dex[f.id] = (G.me.dex[f.id]||0)+1; G.me.daily.fish++;
    stopFishing(); earn(f.price);
    pop((isNew?'<div class="new">도감 새 등록</div>':'')+'<div class="sw" style="background:'+f.c+';width:44px;height:22px;margin:0 auto 4px"></div>'+f.name, (f.release ? '반갑게 인사하고 바다로 돌려보냈어요<br><small>관찰 기록 보너스 ' : '<small>')+'도토리 +'+f.price+'</small>'); doAnim('cheer');
  } else { stopFishing(); toast('앗, 너무 빨랐어요'); }
}

/* ================= object taps ================= */
function targetAt(i,j){
  if (!inb(i,j)) return null;
  const k = key(i,j), s = statics.get(k);
  if (s){ if (BY[s.id] === s) return { type:s.kind, b:s, i, j }; return { type:s.kind, s, i, j }; }
  const sp = spotAt(i,j); if (sp) return { type:'spot', sp, i, j };
  if (Store.data.placed[dkey(i,j)]) return { type:'placed', k:dkey(i,j), i, j };
  const tt = tile[idx(i,j)];
  if (tt === WATER) return { type:'water', i, j };
  if (tt === FLOWERF && G.me && !((G.me.daily && G.me.daily.fl) || []).includes(k)) return { type:'flower', i, j };
  if (tt === FARM) return { type:'farm', i, j };
  const st = STATIONS.find(st => st.tiles.some(([x,z]) => { const [a,b] = T(x,z); return a===i && b===j; }));
  if (st) return { type:'station', st, i, j };
  return null;
}
function actLabel(t){
  if (!t) return '행동';
  if (t.type === 'spot') return { bug:'잡기', shell:'줍기', forage:'캐기', dig:'파기' }[t.sp.cat];
  if (t.type === 'farm') return farmLabel(t.i, t.j);
  if (t.type === 'clerk') return '말 걸기';
  if (typeof labelExtra === 'function'){ const lx = labelExtra(t); if (lx) return lx; }
  if (t.type === 'tool') return { net:'휘두르기', shovel:'파기', can:'물 주기', rod:'낚싯대' }[G.me.tool] || '도구';
  if (t.type === 'show') return t.label || '구경';
  if (t.type === 'furn'){ const it = G.inside && G.inside.home.items[t.n]; if (!it) return '보기'; if (it.show) return showLabel(it); const F = FURN[it.id]; if (F.use === 'play' || F.use === 'piano') return '연주'; return G.inside.own ? ({ rest:'자기', ward:'옷장', mirror:'거울', tv:'TV 보기' }[F.use] || '보기') : '보기'; }
  return { house: t.b && t.b.slot===G.slot ? '집에 들어가기' : '놀러 가기', mall:'들어가기', cafe:'들어가기', depot:'들어가기', mailbox:'편지', tree:'흔들기', rock:'두드리기', water:'낚시', flower:'꽃 따기', nhouse:'놀러 가기', play:'연주', station:'기차', placed:'구경', shop:'들어가기', bank:'들어가기', npc:'말 걸기', door:'나가기' }[t.type] || '행동';
}
function act(t){
  if (!t) return;
  if (['mailbox','station','placed','furn','door'].includes(t.type)) doAnim('tap');
  switch (t.type){
    case 'house': return enterHouse(t.b.slot);
    case 'shop': return enterShop('shop');
    case 'bank': return enterShop('bank');
    case 'npc': return talkTo(t.np);
    case 'spot': return gather(t.sp);
    case 'flower': return pickFlower(t.i, t.j);
    case 'farm': return farmAct(t.i, t.j);
    case 'nhouse': return enterNpcHome(t.b.npc);
    case 'clerk': return talkTo(t.np);
    case 'show': return showAct(t);
    case 'play': return playInstrument(t.inst);
    case 'tool': return toolAction();
    case 'furn': return useFurniture(t.n);
    case 'door': return exitHouse();
    case 'mall': if (!deliveryArrive('mall')) enterShop('mall'); return;
    case 'cafe': if (!deliveryArrive('cafe')) enterShop('cafe'); return;
    case 'depot': return enterShop('depot');
    case 'mailbox': return openMail();
    case 'tree': return shakeTree(t.s);
    case 'rock': return hitRock(t.s);
    case 'water': return startFishing(t.i, t.j);
    case 'station': return openStation(t.st);
    default: if (typeof actExtra === 'function') return actExtra(t); return;
    case 'placed': { const p = Store.data.placed[t.k]; if (!p) return; let msg = DEC[p.t].name+' · '+(p.byName||'가족')+'이(가) 놓았어요';
      if (p.t==='sapling'){ const d = Math.floor((Date.now()-p.at)/DAY); msg = (p.byName||'가족')+'이(가) 심은 나무 · '+(d+1)+'일째'+(saplingStage(p.at)<3?' (30일이면 큰 나무)':''); }
      return toast(msg); }
  }
}
function onObjectTap(k){
  if (k === 'train'){ toast('기차는 역에서 탈 수 있어요'); return; }
  if (k.startsWith('st_')){ const st = STATIONS.find(s => 'st_'+s.id === k); const [i,j] = T(st.px, st.pz); return walkTo(i,j, () => openStation(st)); }
  let i, j;
  if (BY[k]) [i,j] = T(BY[k].cx, BY[k].cz); else if (k.startsWith('w_')) [i,j] = dparse(k); else [i,j] = k.split('_').map(Number);
  const t = targetAt(i,j); if (!t) return;
  walkTo(i,j, () => act(t));
}
function frontTile(c){ return [Math.round(c.x + Math.sin(c.face)*0.8) + C, Math.round(c.z + Math.cos(c.face)*0.8) + C]; }
function frontTarget(){
  const me = chars[G.slot]; if (!me) return null;
  if (G.inside){ const c = G.inside.clerkNp; if (c && !c.sleep){ const fx = me.x + Math.sin(me.face)*0.9, fz = me.z + Math.cos(me.face)*0.9; if (Math.hypot(c.x-fx, c.z-fz) < 0.9) return { type:'clerk', np:c }; }
    const f = furnAtFront(); if (f.atDoor) return { type:'door' }; if (f.n >= 0) return { type:'furn', n:f.n }; const hi = heldInstrument(); return hi ? { type:'play', inst:hi } : null; }
  const np = npcNear(); if (np) return { type:'npc', np };
  const fxt = frontExtra(); if (fxt) return fxt;
  const [fi,fj] = frontTile(me); let t = targetAt(fi,fj);
  if (!t){ const here = targetAt(me.i, me.j); if (here && here.type==='station') t = here; }
  if (!t){ // door tile in front of a building: look one more step ahead
    const s = [...new Set(statics.values())].find(b => b.door && T(b.door[0], b.door[1])[0]===me.i && T(b.door[0], b.door[1])[1]===me.j);
    if (s) t = { type:s.kind, b:s };
  }
  if (!t){ if (G.me.tool) t = { type:'tool' }; else { const hi = heldInstrument(); if (hi) t = { type:'play', inst:hi }; } }
  return t;
}
function actionPress(){
  if (dlg){ dialogTap(); return; }
  if (!G.started || G.ride || G.mini || G.down || G.rescue || G.police || G.sleepAnim) return;
  if (G.sit){ standUp(); return; }
  if (G.boat && typeof boatAction === 'function'){ boatAction(); return; }
  if (G.panel === 'decor'){ const me = chars[G.slot]; const f = furnAtFront(); decorTap(f.fx, f.fz, f.n >= 0 ? f.n : null); return; }
  if (G.fishing){ fishTap(); return; }
  if (G.panel && G.panel !== 'build'){ closePanel(); return; }
  const me = chars[G.slot];
  if (G.build){ const [fi,fj] = frontTile(me); buildTap(fi,fj); return; }
  const t = frontTarget();
  if (!t){ toast('앞에 아무것도 없어요. 무언가를 바라보고 눌러요', 1500); return; }
  me.path = []; act(t);
}
const playerName = s => { const p = Store.data.players[pid(s)]; return (s===G.slot && G.me) ? G.me.name : (p && p.name) || SLOTS[s].name; };

/* ================= panels ================= */
function openPanel(title, html, opts){
  opts = opts || {};
  $('#ptitle').textContent = title; $('#pbody').innerHTML = html; $('#panel').hidden = false;
  $('#panel').classList.toggle('half', !!opts.half);
  if (opts.focus && !G.focus && chars[G.slot]){ chars[G.slot].face = G.inside ? 0 : G.yaw; chars[G.slot].path = []; }
  G.focus = !!opts.focus;
  if (opts.closeLabel) $('#pclose').textContent = opts.closeLabel; else $('#pclose').textContent = '닫기';
  resize();
}
function closePanel(){
  if (G.panel === 'shop' && G.preview){ G.preview = null; applyLook(chars[G.slot], G.me); }
  if (G.panel === 'mirror' && !G.me.made){ G.me.made = true; saveMe(true); toast('방향키로 걷고, 무언가를 바라보며 행동 버튼을 눌러요', 3200); }
  if (G.panel === 'build') G.build = null;
  if (G.panel === 'decor' && G.decorate){ G.decorate.sel = null; G.decorate.edit = undefined; }
  $('#panel').hidden = true; G.panel = null; G.focus = false; resize();
}
$('#pclose').addEventListener('click', closePanel);
const row = (label, n, tot) => '<div class="row"><span>'+label+'</span><span class="prog"><i style="width:'+Math.min(100,n/tot*100)+'%"></i></span><span>'+n+' / '+tot+'</span></div>';

function openBag(){
  ensureDaily(); regenStamina(); G.panel = 'bag'; const d = G.me.daily, me = G.me;
  const dex = FISH.map(f => { const n = me.dex[f.id]; const when = (f.seasons==='all'?'사계절':f.seasons.split(' ').map(x=>SEASONS[x]).join('·'))+(f.when==='night'?' 밤':f.when==='day'?' 낮':'');
    return n ? '<div class="cell"><div class="sw" style="background:'+f.c+'"></div>'+f.name+'<b>'+n+'마리 · '+f.price+'</b></div>' : '<div class="cell no"><div class="sw" style="background:#cfd6e0"></div>???<b>'+when+'</b></div>'; }).join('');
  const debtCard = me.acorns < 0 ? '<div class="card warn"><div class="k"><span>빚</span><b>도토리 '+(-me.acorns)+'</b></div><span class="note">하루마다 이자 10%가 붙어요. 3일 넘게 못 갚으면 가장 비싼 물건을 압류해 가요. 일해서 갚아요.</span></div>' : '';
  openPanel(me.name+'의 가방',
    debtCard +
    '<h3>오늘의 가계부</h3><div class="card"><div class="k"><span>번 도토리</span><b>'+d.earned+'</b></div><div class="k"><span>쓴 도토리</span><b>'+d.spent+'</b></div>'+(d.splurge?'<span class="note" style="color:var(--warn)">과소비로 오늘은 일당이 20% 줄어요.</span>':'<span class="note">하루에 '+ECON.splurge+'개 넘게 쓰면 지름신 후유증이 와요.</span>')+'</div>'+
    '<h3>오늘 한 일</h3>'+row('카페 알바', d.jobs.cafe||0, 3)+row('택배 분류', d.jobs.sort||0, 3)+row('택배 배달', d.jobs.deliver||0, 4)+row('나무 흔들기', d.trees.length, TREE_TOTAL)+row('물고기 낚기', d.fish, 5)+
    '<h3>채집한 물건</h3>'+(Object.entries(me.inv||{}).filter(([k,n])=>n>0&&GATHER[k]).map(([k,n]) => '<div class="cell"><div class="sw" style="background:'+GATHER[k].c+'"></div>'+GATHER[k].name+'<b>'+n+'개</b></div>').join('').replace(/^(.+)$/, '<div class="grid">$1</div>') || '<p class="note">아직 없어요. 곤충·조개·버섯·땅속 보물을 모아 봐요.</p>')+
    '<h3>도구 · 눌러서 손에 들기</h3><div class="seg" id="toolSeg">'+['rod'].concat(Object.keys(me.tools||{}).filter(k=>TOOLS[k])).map(k => '<button data-tool="'+k+'" class="'+(me.tool===k?'on':'')+'">'+(k==='rod'?'낚싯대':TOOLS[k].name)+'</button>').join('')+'</div>'+(Object.keys(me.tools||{}).length ? '' : '<p class="note">잡화점에서 잠자리채, 삽, 물뿌리개를 팔아요</p>')+
    '<h3>씨앗</h3><p class="note">'+(Object.entries(me.seeds||{}).filter(([,n])=>n>0).map(([k,n])=>CROPS[k].name+' '+n+'개').join(', ') || '없음 · 잡화점에서 씨앗을 사서 농장섬 밭에 심어요')+'</p>'+
    '<h3>채집 도감 · '+Object.keys(GATHER).filter(k=>(me.gdex||{})[k]).length+' / '+Object.keys(GATHER).length+'</h3><div class="grid">'+Object.entries(GATHER).map(([k,g]) => (me.gdex||{})[k] ? '<div class="cell"><div class="sw" style="background:'+g.c+'"></div>'+g.name+'<b>'+GCAT[g.cat]+' · '+g.price+'</b></div>' : '<div class="cell no"><div class="sw" style="background:#e6dff0"></div>???<b>'+GCAT[g.cat]+(g.seasons&&g.seasons!=='all'?' · '+g.seasons.split(' ').map(x=>SEASONS[x]).join('·'):'')+'</b></div>').join('')+'</div>'+
    '<h3>물고기 도감 · '+FISH.filter(f=>me.dex[f.id]).length+' / '+FISH.length+'</h3><div class="grid">'+dex+'</div>'+
    '<h3>꾸미기</h3><button id="decoBtn">마을에 물건 놓기</button>');
  $('#decoBtn').addEventListener('click', openBuild);
  $('#toolSeg').querySelectorAll('[data-tool]').forEach(b => b.addEventListener('click', () => { holdTool(b.dataset.tool); openBag(); }));
}

/* ---- wardrobe & shop ---- */
const swatch = it => { const v = it.v; const c = v.c1 || v.c || (v.top && v.top.c1) || '#ffffff'; const c2 = v.c2 || (v.top && v.top.c2); return '<div class="sw" style="background:'+(c2?'linear-gradient(90deg,'+c+' 60%,'+c2+' 60%)':c)+'"></div>'; };
function isWorn(id){ const w = G.me.wear, it = ITEM[id]; if (it.cat==='ride') return G.me.ride===id; return w[slotOf(it.cat)] === id; }
const priceOf = it => (G.me && G.me.broken && G.me.broken[it.id]) ? Math.ceil(it.price*0.1) : it.price;
const slotOf = cat => cat === 'music' ? 'hand' : cat;
function equip(id){
  const it = ITEM[id], w = G.me.wear;
  if (it.cat === 'ride'){ G.me.ride = G.me.ride === id ? null : id; }
  else if (isWorn(id)){ if (['top','bottom','shoes'].includes(it.cat)) return; delete w[slotOf(it.cat)]; if (it.cat==='set'){ w.top = w.top||'tee_w'; w.bottom = w.bottom||'jeans'; } }
  else { w[slotOf(it.cat)] = id; if (it.cat==='set'){ delete w.top; delete w.bottom; } if (it.cat==='top'||it.cat==='bottom'){ delete w.set; w.top = w.top||'tee_w'; w.bottom = w.bottom||'jeans'; } }
  applyLook(chars[G.slot], G.me); saveMe(); updateHud();
}
let wardCat = 'top', shopCat = 'top';
function tabsHtml(cur){ return '<div class="tabs" data-tabs>'+CATS.map(([k,l]) => '<button data-cat="'+k+'" class="'+(k===cur?'on':'')+'">'+l+'</button>').join('')+'</div>'; }
function openWardrobe(){
  G.panel = 'ward';
  const own = SHOP.filter(it => it.cat===wardCat && G.me.owned[it.id]);
  const cells = own.map(it => '<div class="cell'+(isWorn(it.id)?' on':'')+'" data-id="'+it.id+'">'+swatch(it)+esc(it.name)+'<b>'+(isWorn(it.id)?'입는 중':'입기')+'</b></div>').join('') || '<p class="note">이 칸에 가진 물건이 없어요. 쇼핑몰에서 사 보세요.</p>';
  openPanel('옷장', tabsHtml(wardCat)+'<div class="grid">'+cells+'</div><p class="note">입는 중인 물건을 다시 누르면 벗어요. 세트 옷을 입으면 상의·하의 대신 입혀져요.</p><button id="mirrorBtn">얼굴·머리 바꾸기</button>', { half:true, focus:true });
  $('#pbody').querySelector('[data-tabs]').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (!b) return; wardCat = b.dataset.cat; openWardrobe(); });
  $('#pbody').querySelectorAll('[data-id]').forEach(el => el.addEventListener('click', () => { equip(el.dataset.id); openWardrobe(); }));
  $('#mirrorBtn').addEventListener('click', openMirror);
}
function openShop(){
  G.panel = 'shop'; const me = G.me;
  const list = SHOP.filter(it => it.cat===shopCat && it.price > 0);
  const sel = G.preview && ITEM[G.preview] && ITEM[G.preview].cat===shopCat ? ITEM[G.preview] : null;
  const cells = list.map(it => '<div class="cell'+(sel&&sel.id===it.id?' sel':'')+'" data-id="'+it.id+'">'+swatch(it)+esc(it.name)+'<b>'+(me.owned[it.id]?'<span class="own">가지고 있어요</span>':(me.broken&&me.broken[it.id]?'수리 재구매 '+priceOf(it):'도토리 '+it.price))+'</b></div>').join('');
  let buy = '<p class="note">물건을 누르면 입어 볼 수 있어요.'+(shopCat==='ride'?' 탈것은 타면 걷는 것보다 빨라요.':'')+'</p>';
  if (sel){
    const after = me.acorns - priceOf(sel);
    if (me.owned[sel.id]) buy = '<div class="buybar"><span>'+esc(sel.name)+' · 이미 있어요</span><button class="go" id="wearBtn">'+(sel.cat==='ride'?'타기':sel.cat==='music'?'들기':'입기')+'</button></div>';
    else if (after >= 0) buy = '<div class="buybar"><span>'+esc(sel.name)+'<br><small>남는 도토리 '+after+'</small></span><button class="go" id="buyBtn">도토리 '+priceOf(sel)+'에 '+(me.broken&&me.broken[sel.id]?'다시 ':'')+'사기</button></div>';
    else if (after >= ECON.creditLimit && me.acorns >= ECON.creditLimit/2) buy = '<div class="buybar"><span style="color:var(--warn)">도토리가 '+(-after)+'개 모자라요.<br><small>외상하면 빚이 되고 매일 이자 10%</small></span><button class="bad" id="buyBtn">외상으로 사기</button></div>';
    else buy = '<div class="buybar"><span style="color:var(--warn)">도토리가 모자라고 외상 한도도 넘었어요. 일해서 모아 오세요.</span></div>';
  }
  const desc = sel ? '<div class="desc"><b>'+esc(sel.name)+'</b> '+esc(descOf(sel.id))+'</div>' : '';
  openPanel('몽실 쇼핑몰', tabsHtml(shopCat)+desc+buy+'<div class="grid">'+cells+'</div>', { half:true, focus:true });
  $('#pbody').querySelector('[data-tabs]').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (!b) return; shopCat = b.dataset.cat; openShop(); });
  $('#pbody').querySelectorAll('[data-id]').forEach(el => el.addEventListener('click', () => { G.preview = el.dataset.id; previewItem(el.dataset.id); openShop(); }));
  const bb = $('#buyBtn'); if (bb) bb.addEventListener('click', () => buyItem(sel.id));
  const wb = $('#wearBtn'); if (wb) wb.addEventListener('click', () => { if (!isWorn(sel.id)) equip(sel.id); G.preview = null; openShop(); });
}
function previewItem(id){
  const it = ITEM[id]; const p = JSON.parse(JSON.stringify(G.me));
  if (it.cat === 'ride') p.ride = id, p.owned[id] = 1;
  else { p.wear[slotOf(it.cat)] = id; if (it.cat==='set'){ delete p.wear.top; delete p.wear.bottom; } if (it.cat==='top'||it.cat==='bottom') delete p.wear.set; }
  applyLook(chars[G.slot], p);
}
function buyItem(id){
  const it = ITEM[id]; if (G.me.owned[id]) return;
  const debtBefore = G.me.acorns < 0;
  spend(priceOf(it)); G.me.owned[id] = 1; G.preview = null; if (G.me.broken) delete G.me.broken[id];
  if (!isWorn(id)) equip(id); else applyLook(chars[G.slot], G.me);
  toast((G.me.acorns<0 && !debtBefore ? '외상으로 ' : '')+it.name+'을(를) 샀어요');
  openShop();
}

/* ---- mirror (face & hair) ---- */
const SKINS = ['#ffe6d2','#ffd9b8','#f7cfa8','#e8b892','#c98f68','#8a5a3e'];
const HAIRC = ['#2b2230','#5b3a24','#8a5a34','#c0662e','#e8c46a','#f2e6cf','#6a6a70','#ef7fa8','#5b9be8','#4fae63'];
const HAIRS = [['short','짧은 머리'],['bob','단발'],['long','긴 머리'],['ponytail','포니테일'],['twin','양갈래'],['bun','똥머리'],['spiky','삐죽 머리'],['wavy','웨이브'],['hime','공주 머리'],['curly','뽀글 파마'],['braid','옆 땋은 머리'],['spacebuns','양쪽 똥머리'],['sidepart','옆 가르마'],['fluffy','복슬 단발'],['bow','리본 포니'],['afro','아프로'],['mohawk','닭벼슬'],['topknot','상투'],['lowtwin','낮은 양갈래'],['wolf','울프컷'],['bowl','바가지'],['halfup','반묶음'],['longcurl','긴 컬'],['pixie','픽시컷'],['sidetail','옆 포니']];
const EYES = [['round','동그란 눈'],['smile','웃는 눈'],['dot','점 눈'],['sleepy','졸린 눈'],['star','반짝 눈'],['lash','속눈썹'],['wink','윙크'],['heart','하트 눈'],['sparkle','초롱 눈'],['droopy','순한 눈']];
const NOSES = [['none','없음'],['dot','점 코'],['button','동글 코'],['pink','분홍 코'],['arc','반달 코'],['line','오똑 코'],['tri','세모 코'],['freckle','주근깨'],['heart','하트 코'],['piggy','꿀꿀 코']];
const MOUTHS = [['smile','미소'],['open','벌린 입'],['cat','고양이 입'],['o','오 입'],['grin','활짝'],['tongue','메롱'],['pout','뾰로통'],['laugh','깔깔'],['smirk','씨익'],['tiny','작은 미소']];
function openMirror(){
  G.panel = 'mirror'; const L = G.me.look;
  const dots = (k, arr) => '<div class="dots" data-k="'+k+'">'+arr.map(c => '<button style="background:'+c+'" data-v="'+c+'" class="'+(L[k]===c?'on':'')+'" aria-label="'+c+'"></button>').join('')+'</div>';
  const seg = (k, arr) => '<div class="seg" data-k="'+k+'">'+arr.map(([v,l]) => '<button data-v="'+v+'" class="'+(L[k]===v?'on':'')+'">'+l+'</button>').join('')+'</div>';
  openPanel(G.me.made ? '얼굴·머리 바꾸기' : '내 캐릭터 만들기',
    '<h3>피부</h3>'+dots('skin',SKINS)+'<h3>머리 모양</h3>'+seg('hair',HAIRS)+'<h3>머리 색</h3>'+dots('hairColor',HAIRC)+'<h3>눈</h3>'+seg('eyes',EYES)+'<h3>코</h3>'+seg('nose',NOSES)+'<h3>입</h3>'+seg('mouth',MOUTHS)+
    '<h3>수염</h3><div class="seg" data-k="beard"><button data-v="0" class="'+(!L.beard?'on':'')+'">없음</button><button data-v="1" class="'+(L.beard?'on':'')+'">있음</button></div>', { half:true, focus:true, closeLabel: G.me.made ? '닫기' : '완성!' });
  $('#pbody').querySelectorAll('[data-k]').forEach(el => el.addEventListener('click', e => {
    const b = e.target.closest('[data-v]'); if (!b) return; const k = el.dataset.k;
    L[k] = k==='beard' ? b.dataset.v==='1' : b.dataset.v;
    el.querySelectorAll('[data-v]').forEach(x => x.classList.toggle('on', x===b));
    applyLook(chars[G.slot], G.me); saveMe();
  }));
}

/* ---- home ---- */
function openHome(){
  regenStamina(); G.panel = 'home'; const me = G.me; const wait = (me.restAt||0) + ECON.restCooldown - Date.now();
  openPanel('우리 집',
    '<div class="card"><div class="k"><span>체력</span><b>'+me.stamina+' / '+ECON.stamMax+'</b></div><span class="note">체력은 2분마다 1씩 저절로 차요. 집에서 쉬면 한 번에 '+ECON.restGain+' 회복해요(3시간마다).</span></div>'+
    '<button class="go" id="restBtn" '+(wait>0?'disabled':'')+'>'+(wait>0?'아직 쉴 수 없어요 · '+Math.ceil(wait/60000)+'분 뒤':'쉬기')+'</button>'+
    '<button id="mirrorBtn2">거울 보기 (얼굴·머리 바꾸기)</button><button id="wardBtn2">옷장 열기</button>');
  $('#restBtn').addEventListener('click', () => { me.stamina = Math.min(ECON.stamMax, me.stamina + ECON.restGain); me.restAt = Date.now(); me.stAt = Date.now(); saveMe(); updateHud(); closePanel(); pop('푹 쉬었어요', '체력 +'+ECON.restGain); });
  $('#mirrorBtn2').addEventListener('click', openMirror); $('#wardBtn2').addEventListener('click', openWardrobe);
}

/* ---- station ---- */
function openStation(st){
  G.panel = 'station';
  const dests = STATIONS.filter(s => s !== st);
  openPanel(st.name, '<p class="note">기차표는 도토리 '+ECON.fare+'개예요. 어디로 갈까요?</p>'+dests.map(d => '<button class="go" data-st="'+d.id+'">'+d.name+'(으)로</button>').join(''));
  $('#pbody').querySelectorAll('[data-st]').forEach(b => b.addEventListener('click', () => { closePanel(); rideTrain(st, STATIONS.find(s => s.id===b.dataset.st)); }));
}
function rideTrain(from, to){
  if (G.me.acorns - ECON.fare < ECON.creditLimit){ toast('기차표 살 도토리가 없어요'); return; }
  spend(ECON.fare);
  const dist = ((to.s - from.s) % TR.L + TR.L) % TR.L;
  G.ride = { from, to, phase:'arrive', s0:from.s - 4, s1:from.s, s2:from.s + dist, t:0 };
  train.s = G.ride.s0; toast(from.name+' → '+to.name, 2000);
}

/* ---- jobs ---- */
function openJobs(place){
  ensureDaily(); regenStamina(); G.panel = 'jobs';
  const ids = Object.keys(JOBS).filter(k => JOBS[k].place === place);
  const html = ids.map(k => { const J = JOBS[k], d = G.me.daily, banned = d.banned[k], done = d.jobs[k]||0, lim = k==='deliver'?4:3;
    const busy = k==='deliver' && G.delivery;
    let btn = '<button class="go" data-job="'+k+'">일 시작 · 체력 '+J.cost+'</button>';
    if (banned) btn = '<button disabled>오늘은 일할 수 없어요 (일을 망쳤어요)</button>';
    else if (done >= lim) btn = '<button disabled>오늘 몫은 다 했어요</button>';
    else if (busy) btn = '<button disabled>배달 중이에요</button>';
    else if (G.me.stamina < J.cost) btn = '<button disabled>너무 피곤해요 · 체력 '+J.cost+' 필요</button>';
    return '<div class="card"><div class="k"><b>'+J.name+'</b><span>'+done+' / '+lim+'</span></div><span>'+J.desc+'</span><span class="note">'+J.pay+' · 망치면 벌금 '+J.fine+'</span>'+btn+'</div>';
  }).join('');
  const warn = (G.me.daily.splurge ? '<p class="note" style="color:var(--warn)">지름신 후유증으로 오늘은 일당 20% 감소</p>' : '') + (G.me.stamina < 20 ? '<p class="note" style="color:var(--warn)">체력이 낮으면 일당이 15% 줄어요</p>' : '');
  openPanel(place==='cafe'?'카페':'물류센터', warn + html);
  $('#pbody').querySelectorAll('[data-job]').forEach(b => b.addEventListener('click', () => startJob(b.dataset.job)));
}
function startJob(k){
  const J = JOBS[k]; closePanel(); G.me.stamina -= J.cost; if (G.me.stamina < 0) G.me.stamina = 0; G.me.stAt = Date.now(); updateHud(); saveMe();
  if (k==='cafe') startCafe(); else if (k==='sort') startSort(); else startDelivery();
}
function jobDone(k, earned, failed, extraFine){
  ensureDaily(); const J = JOBS[k];
  G.me.daily.jobs[k] = (G.me.daily.jobs[k]||0) + 1;
  if (failed){
    G.me.daily.banned[k] = true; const f = J.fine + (extraFine||0); fine(f);
    pop('일을 망쳤어요', J.name+'에서 실수가 너무 많았어요.<br>벌금 도토리 '+f+' · 오늘은 이 일을 다시 못 해요.', true);
  } else {
    const km = kiniMult(), pay = Math.round(earned * payRate() * km); earn(pay);
    pop(J.name+' 끝!', '일당 도토리 +'+pay+(payRate()<1?'<br><small>(감소 적용)</small>':'')+(km>1?'<br><small>끼니의 행운이 따랐어요! 일당이 쑥 늘었어요</small>':''));
  }
  updateHud(); saveMe();
}
const DRINKS = [ { id:'ame', name:'아메리카노', c:'#5a3a26' }, { id:'latte', name:'라떼', c:'#d8b48a' }, { id:'straw', name:'딸기우유', c:'#ff9eb8' }, { id:'matcha', name:'녹차라떼', c:'#8cc46a' } ];
const CUST = ['곰 씨','토끼 씨','여우 씨','다람쥐 씨','펭귄 씨','고양이 씨','부엉이 씨'];
function startCafe(){
  G.mini = { type:'cafe', n:0, total:6, strikes:0, earned:0, tray:[], order:null };
  nextCustomer(); $('#mini').hidden = false;
}
function nextCustomer(){
  const M = G.mini; if (!M) return;
  if (M.n >= M.total || M.strikes >= 3){ endMini(); return; }
  const cnt = M.n < 2 ? 1 : M.n < 4 ? 2 : 3;
  M.order = Array.from({ length:cnt }, () => DRINKS[Math.floor(Math.random()*4)].id);
  M.who = CUST[Math.floor(Math.random()*CUST.length)]; M.tray = []; M.t0 = performance.now(); M.limit = 7000 + cnt*2200 - M.n*300;
  renderCafe();
}
const cupHtml = id => { const d = DRINKS.find(x => x.id===id); return '<span class="cup"><i style="background:'+d.c+'"></i>'+d.name+'</span>'; };
const strikesHtml = n => '<span class="strikes">실수'+[0,1,2].map(k => '<span class="'+(k<n?'x':'')+'"></span>').join('')+'</span>';
function renderCafe(){
  const M = G.mini;
  $('#mbox').innerHTML = '<div class="mhead"><span>카페 알바 · 손님 '+(M.n+1)+' / '+M.total+'</span>'+strikesHtml(M.strikes)+'</div>'+
    '<div class="tbar"><i id="tfill" style="width:100%"></i></div>'+
    '<div class="order"><span class="who">'+M.who+'</span><div class="cups">'+M.order.map(cupHtml).join('')+'</div></div>'+
    '<div class="tray">'+(M.tray.length ? M.tray.map(cupHtml).join('') : '쟁반이 비어 있어요. 주문대로 음료를 골라요')+'</div>'+
    '<div class="mbtns">'+DRINKS.map(d => '<button data-d="'+d.id+'"><span class="cup"><i style="background:'+d.c+'"></i></span>'+d.name+'</button>').join('')+'</div>'+
    '<div class="mhead"><span>번 도토리 '+M.earned+'</span><button id="quitMini" style="padding:4px 10px;font-size:13px">그만두기</button></div>';
  $('#mbox').querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => serve(b.dataset.d)));
  $('#quitMini').addEventListener('click', () => { M.strikes = 3; endMini(); });
}
function serve(id){
  const M = G.mini; M.tray.push(id);
  if (M.tray.length < M.order.length){ renderCafe(); return; }
  const a = M.order.slice().sort().join(), b = M.tray.slice().sort().join();
  if (a === b){ const fast = performance.now() - M.t0 < M.limit*0.45; M.earned += 18 + (fast ? 6 : 0); toast(fast ? '빨라요! 팁 +6' : '고마워요!', 900); }
  else { M.strikes++; toast('주문이 틀렸어요', 1100); try{ navigator.vibrate && navigator.vibrate(80); }catch(e){} }
  M.n++; nextCustomer();
}
const CHUTES = [ { id:'r', name:'빨강', c:'#ef4f5e' }, { id:'b', name:'파랑', c:'#3c6fd1' }, { id:'y', name:'노랑', c:'#f2b82a' }, { id:'g', name:'초록', c:'#4fae63' } ];
function startSort(){ G.mini = { type:'sort', n:0, total:14, strikes:0, earned:0, broken:0 }; nextBox(); $('#mini').hidden = false; }
function nextBox(){
  const M = G.mini; if (!M) return;
  if (M.n >= M.total || M.strikes >= 3){ endMini(); return; }
  M.box = CHUTES[Math.floor(Math.random()*4)]; M.t0 = performance.now(); M.limit = Math.max(1400, 3000 - M.n*120);
  $('#mbox').innerHTML = '<div class="mhead"><span>택배 분류 · 상자 '+(M.n+1)+' / '+M.total+'</span>'+strikesHtml(M.strikes)+'</div><div class="tbar"><i id="tfill" style="width:100%"></i></div>'+
    '<div class="box3d"><span style="background:'+M.box.c+'">'+M.box.name+'</span></div><div class="mbtns">'+CHUTES.map(c => '<button data-c="'+c.id+'" style="background:'+c.c+';color:#fff">'+c.name+' 레일</button>').join('')+'</div>'+
    '<div class="mhead"><span>번 도토리 '+M.earned+' · 깨진 상자 '+M.broken+'</span><button id="quitMini" style="padding:4px 10px;font-size:13px">그만두기</button></div>';
  $('#mbox').querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => sortTo(b.dataset.c)));
  $('#quitMini').addEventListener('click', () => { M.strikes = 3; endMini(); });
}
function sortTo(cid){
  const M = G.mini; if (!M || M.type!=='sort') return;
  if (cid === M.box.id) M.earned += 8; else { M.strikes++; M.broken++; toast('상자가 깨졌어요', 900); try{ navigator.vibrate && navigator.vibrate(80); }catch(e){} }
  M.n++; nextBox();
}
function miniTick(now){
  const M = G.mini; if (!M) return;
  const left = 1 - (now - M.t0)/M.limit, f = $('#tfill'); if (f) f.style.width = Math.max(0,left*100)+'%';
  if (left <= 0){
    if (M.type==='cafe'){ M.strikes++; toast('손님이 기다리다 갔어요', 1100); M.n++; nextCustomer(); }
    else { M.strikes++; M.broken++; toast('상자를 놓쳤어요', 900); M.n++; nextBox(); }
  }
}
function endMini(){
  const M = G.mini; G.mini = null; $('#mini').hidden = true; if (!M) return;
  if (M.type === 'cafe') jobDone('cafe', M.earned, M.strikes >= 3);
  else jobDone('sort', M.earned - M.broken*5, M.strikes >= 3, M.broken*5);
}
/* delivery */
const DEST = () => [
  ...BUILD.filter(b => b.kind==='house').map(b => ({ id:b.id, name:playerName(b.slot)+'네 집', door:b.door })),
  ...BUILD.filter(b => b.kind==='nhouse').map(b => ({ id:b.id, name:NH_STYLE[b.npc].sign, door:b.door })),
  { id:'mall', name:'쇼핑몰', door:BY.mall.door }, { id:'cafe', name:'카페', door:BY.cafe.door },
  ...STATIONS.map(s => ({ id:'st_'+s.id, name:s.name, door:[s.px, s.pz] })),
];
function startDelivery(){
  const me = chars[G.slot];
  const opts = DEST().map(d => { const [i,j] = T(d.door[0], d.door[1]); return Object.assign(d, { dist:Math.abs(i-me.i)+Math.abs(j-me.j) }); }).filter(d => d.dist > 10);
  const pool = opts.length ? opts : DEST(); const d = pool[Math.floor(Math.random()*pool.length)]; d.dist = d.dist || 20;
  const secs = Math.round(d.dist * 0.5 + 18);
  G.delivery = { id:d.id, name:d.name, door:d.door, until:Date.now()+secs*1000, secs };
  pop('택배 배달', '<b>'+esc(d.name)+'</b>까지 '+secs+'초 안에 가져다줘요.<br><small>노란 화살표를 따라가요</small>');
  updateHud();
}
function deliveryArrive(id){
  const D = G.delivery; if (!D || D.id !== id) return false;
  const left = Math.round((D.until - Date.now())/1000); G.delivery = null; $('#arrow').hidden = true;
  if (left >= 0) jobDone('deliver', 45 + left);
  else if (left > -60){ ensureDaily(); G.me.daily.jobs.deliver = (G.me.daily.jobs.deliver||0)+1; const pay = Math.round(12*payRate()); earn(pay); pop('늦었어요', -left+'초 늦어서 일당을 조금만 받았어요. 도토리 +'+pay, true); }
  else jobDone('deliver', 0, true);
  updateHud(); return true;
}
function deliveryTick(){
  const D = G.delivery; if (!D) return;
  if (Date.now() - D.until > 60000){ G.delivery = null; $('#arrow').hidden = true; jobDone('deliver', 0, true); return; }
  const me = chars[G.slot]; const [di,dj] = T(D.door[0], D.door[1]);
  if (me && !G.ride && me.i===di && me.j===dj) deliveryArrive(D.id);
}

/* ---- build mode (decor) ---- */
function openBuild(){
  closePanel(); G.build = { item:DECOR[0].id }; G.panel = 'build';
  const render = () => {
    openPanel('마을 꾸미기', '<p class="note">놓을 자리를 탭하세요. 놓인 물건을 탭하면 치워요(도토리 돌려받음).</p><div class="grid">'+DECOR.map(it => '<div class="cell'+(G.build.item===it.id?' sel':'')+'" data-it="'+it.id+'"><div class="sw" style="background:'+it.c+'"></div>'+it.name+'<b>도토리 '+it.cost+'</b></div>').join('')+'</div>', { half:true, closeLabel:'다 했어요' });
    G.panel = 'build';
    $('#pbody').querySelectorAll('[data-it]').forEach(el => el.addEventListener('click', () => { G.build.item = el.dataset.it; render(); }));
  };
  render();
}
function buildTap(i,j){
  const k = dkey(i,j);
  if (Store.data.placed[k]){ const p = Store.data.placed[k]; earn(DEC[p.t].cost); Store.delPlaced(k); toast(DEC[p.t].name+'을(를) 치웠어요'); return; }
  if (!inb(i,j) || !WALKABLE_DECOR.includes(tile[idx(i,j)]) || statics.has(key(i,j)) || spots.has(key(i,j))){ toast('여기엔 놓을 수 없어요'); return; }
  if (Object.values(chars).some(c => c.i===i && c.j===j)){ toast('누가 서 있어요'); return; }
  const it = DEC[G.build.item]; if (G.me.acorns < it.cost){ toast('도토리가 모자라요'); return; }
  spend(it.cost); Store.setPlaced(k, { t:it.id, by:G.slot, byName:G.me.name, at:Date.now() });
}

/* ---- mail ---- */
const mailFor = m => m.to==='all' || m.to===G.slot || m.from===G.slot;
const unreadMail = () => { const seen = LS.get('dv.mailSeen.'+G.slot, 0); return Store.data.mail.filter(m => m.from!==G.slot && (m.to==='all'||m.to===G.slot) && m.at > seen).length; };
function updateBadge(){ if (!G.started) return; const n = unreadMail(); $('#mailBadge').hidden = !n; $('#mailBadge').textContent = n; }
function openMail(){
  G.panel = 'mail'; LS.set('dv.mailSeen.'+G.slot, Date.now()); updateBadge();
  const opts = '<option value="all">가족 모두에게</option>' + SLOTS.map((_,s) => s===G.slot ? '' : '<option value="'+s+'">'+esc(playerName(s))+'에게</option>').join('');
  const list = Store.data.mail.filter(mailFor).map(m => '<div class="letter"><div class="meta"><span>'+esc(playerName(m.from))+' → '+(m.to==='all'?'모두':esc(playerName(m.to)))+'</span><span>'+ago(m.at)+'</span></div>'+esc(m.text)+'</div>').join('') || '<p class="note">아직 편지가 없어요.</p>';
  openPanel('우체통', '<h3>편지 쓰기</h3><select id="mto" aria-label="받는 사람">'+opts+'</select><textarea id="mtext" maxlength="140" placeholder="오늘 마을에서 있었던 일, 고마운 말…"></textarea><button class="go" id="msend">편지 넣기</button><h3>편지함</h3>'+list);
  $('#msend').addEventListener('click', () => { const text = $('#mtext').value.trim(); if (!text){ toast('내용을 적어 주세요'); return; } const to = $('#mto').value; Store.addMail({ from:G.slot, to: to==='all'?'all':Number(to), text, at:Date.now() }); toast('편지를 넣었어요'); setTimeout(openMail, 300); });
}

/* ---- settings ---- */
function openSettings(){
  G.panel = 'set';
  const seg = (name, opts) => '<div class="seg" data-seg="'+name+'">'+opts.map(([v,l]) => '<button data-v="'+v+'" class="'+(settings[name]===v?'on':'')+'">'+l+'</button>').join('')+'</div>';
  openPanel('설정',
    '<h3>내 이름</h3><div class="row"><input id="myname" maxlength="8" value="'+esc(G.me.name)+'"><button id="saveName" style="flex:0 0 auto">바꾸기</button></div>'+
    '<h3>시간</h3>'+seg('time',[['real','실제 시간'],['day','낮'],['eve','저녁'],['night','밤']])+
    '<h3>계절 미리보기</h3>'+seg('season',[['real','실제 계절'],['spring','봄'],['summer','여름'],['autumn','가을'],['winter','겨울']])+
    '<h3>마을 저장</h3><p class="note">'+(Store.mode==='fb' ? '마을 서버에 연결돼 있어요. 이웃들이 꾸민 것, 편지, 움직임이 실시간으로 보여요.' : Store.mode==='db' ? '가족 마을에 연결돼 있어요. 가족이 꾸민 것, 옷, 편지가 실시간으로 보여요.' : '지금은 이 폰에만 저장돼요. 가족에게 이 페이지를 편집자로 공유하면 같은 마을에서 함께할 수 있어요.')+'</p>'+
    '<button id="swap">다른 캐릭터로 바꾸기</button>');
  $('#pbody').querySelectorAll('[data-seg]').forEach(el => el.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; const name = el.dataset.seg, prev = season();
    settings[name] = b.dataset.v; saveSettings(); el.querySelectorAll('button').forEach(x => x.classList.toggle('on', x===b));
    if (name==='time') applyTime(true);
    if (name==='season' && season()!==prev){ buildWorld(); placedMeshes.forEach(v => scene.remove(v.group)); placedMeshes.clear(); syncPlaced(); }
  }));
  $('#saveName').addEventListener('click', () => { const v = $('#myname').value.trim(); if (!v) return; G.me.name = v; saveMe(true); toast('이름을 바꿨어요'); });
  $('#swap').addEventListener('click', () => { saveMe(true); setTimeout(() => location.reload(), 400); });
}

$('#bBag').addEventListener('click', () => G.panel==='bag' ? closePanel() : openBag());
$('#bWard').addEventListener('click', () => G.panel==='ward' ? closePanel() : openWardrobe());
$('#bMail').addEventListener('click', () => G.panel==='mail' ? closePanel() : openMail());
$('#bSet').addEventListener('click', () => G.panel==='set' ? closePanel() : openSettings());
$('#zin').addEventListener('click', () => { G.zoom = Math.min(4.5, G.zoom*1.2); resize(); });
$('#camReset').addEventListener('click', () => { setYaw(0); setPitch(47); G.inYaw = 0; toast('카메라를 정면으로 돌렸어요', 1200); });
$('#bMap').addEventListener('click', () => G.panel==='map' ? closePanel() : openMap());
$('#zout').addEventListener('click', () => { G.zoom = Math.max(0.55, G.zoom/1.2); resize(); });
$('#rideBtn').addEventListener('click', () => {
  const rides = SHOP.filter(it => it.cat==='ride' && G.me.owned[it.id]); if (!rides.length) return;
  if (G.me.ride) G.me.ride = null; else G.me.ride = rides.sort((a,b) => b.v.speed - a.v.speed)[0].id;
  applyLook(chars[G.slot], G.me); saveMe(); updateHud();
});

/* ---- toast / pop ---- */
let toastEl = null, toastT = 0;
function toast(msg, ms){ if (toastEl) toastEl.remove(); toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.textContent = msg; document.body.appendChild(toastEl); clearTimeout(toastT); const el = toastEl; toastT = setTimeout(() => { el.remove(); if (toastEl===el) toastEl = null; }, ms || 2200); }
const popQ = []; let popOn = false;
function pop(title, body, bad){ popQ.push([title, body, bad]); if (!popOn) nextPop(); }
function nextPop(){ const p = popQ.shift(); if (!p){ popOn = false; return; } popOn = true; const d = document.createElement('div'); d.className = 'pop'+(p[2]?' bad':''); d.innerHTML = '<div class="big">'+p[0]+'</div><div>'+p[1]+'</div>'; document.body.appendChild(d); setTimeout(() => { d.remove(); nextPop(); }, p[2] ? 3200 : 1900); }
let bubbleEl = null;
function showBubble(){ if (!bubbleEl){ bubbleEl = document.createElement('div'); bubbleEl.className = 'bub'; bubbleEl.textContent = '!'; $('#labels').appendChild(bubbleEl); } bubbleEl.hidden = false; }
function hideBubble(){ if (bubbleEl) bubbleEl.hidden = true; }

/* ---- HUD ---- */
function updateHud(){
  if (!G.me) return; regenStamina();
  $('#acorns').textContent = G.me.acorns; $('#acornChip').classList.toggle('debt', G.me.acorns < 0);
  $('#stamBar').style.width = (G.me.stamina/ECON.stamMax*100)+'%'; $('#stamBar').classList.toggle('low', G.me.stamina < 25); $('#stamNum').textContent = G.me.stamina;
  const tags = [];
  if (G.me.acorns < 0){ const d = Math.floor((Date.now()-(G.me.debtSince||Date.now()))/DAY); tags.push('<span class="tag bad">빚 '+(-G.me.acorns)+' · '+(d+1)+'일째</span>'); }
  if (G.me.daily && G.me.daily.splurge) tags.push('<span class="tag bad">지름신 후유증</span>');
  if (G.delivery){ const left = Math.round((G.delivery.until-Date.now())/1000); tags.push('<span class="tag '+(left<0?'bad':'job')+'">배달 '+esc(G.delivery.name)+' '+(left<0?'지각 '+(-left):left)+'초</span>'); }
  $('#status').innerHTML = tags.join('');
  const hasRide = SHOP.some(it => it.cat==='ride' && G.me.owned[it.id]);
  $('#rideBtn').hidden = !hasRide || !!G.inside; $('#rideBtn').textContent = G.me.ride ? '내리기' : '타기';
  $('#roomBtn').hidden = !(G.inside && G.inside.canEdit);
}

/* ---- icons & avatar ---- */
const ICONS = {
  bag:'<path d="M7 9V7a5 5 0 0 1 10 0v2"/><rect x="4" y="9" width="16" height="12" rx="4"/><path d="M9 14h6"/>',
  shirt:'<path d="M8 3l-5 3 2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0z"/>',
  mail:'<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M4 8l8 6 8-6"/>',
  map:'<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="M12 5l3 7-3 7-3-7z"/>',
  camera:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  chat:'<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/>',
  expand:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  gift:'<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M3 13h18M12 9v12M12 9C9 9 7 7.5 8 5.5S12 6 12 9c0-3 3-5.5 4-3.5S15 9 12 9z"/>',
  gear:'<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
};
document.querySelectorAll('[data-ico]').forEach(el => { el.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+ICONS[el.dataset.ico]+'</svg>'; });
function avatarCanvas(s){
  const L = (Store.data.players[pid(s)] && Store.data.players[pid(s)].look) || SLOTS[s].look;
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128; cv.className = 'ava';
  const g = cv.getContext('2d'); const ell = (x,y,rx,ry,c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x,y,rx,ry,0,0,Math.PI*2); g.fill(); };
  ell(64,112,34,22,ROOFS[s]); ell(64,60,42,40,L.hairColor); ell(64,68,36,32,L.skin);
  g.fillStyle = L.hairColor; g.beginPath(); g.ellipse(64,44,40,22,0,Math.PI,0); g.fill();
  ell(50,70,4.5,6,'#3a2e4a'); ell(78,70,4.5,6,'#3a2e4a'); ell(48.5,67.5,1.6,1.8,'#fff'); ell(76.5,67.5,1.6,1.8,'#fff');
  g.globalAlpha = .5; ell(40,82,7,4,'#ff9eb0'); ell(88,82,7,4,'#ff9eb0'); g.globalAlpha = 1;
  g.strokeStyle = '#b0566a'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.arc(64,80,6,0.25*Math.PI,0.75*Math.PI); g.stroke();
  return cv;
}

/* ---- controls: d-pad, action button, keyboard ---- */
const ctl = { pad:{ x:0, z:0 }, keys:new Set(), wasMoving:false };
const pad = $('#dpad'), knob = $('#knob');
let padId = null;
function padSet(e){
  const r = pad.getBoundingClientRect(), cx = r.left + r.width/2, cy = r.top + r.height/2;
  let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx,dy);
  if (d < 10){ ctl.pad.x = 0; ctl.pad.z = 0; knob.style.transform = ''; return; }
  const a = Math.round(Math.atan2(dy,dx) / (Math.PI/4)) * (Math.PI/4);
  ctl.pad.x = Math.cos(a); ctl.pad.z = Math.sin(a);
  const k = Math.min(d, r.width*0.3); knob.style.transform = 'translate('+(Math.cos(a)*k)+'px,'+(Math.sin(a)*k)+'px)';
  pad.dataset.dir = Math.round(((a*180/Math.PI)+360)%360);
}
pad.addEventListener('pointerdown', e => { e.preventDefault(); padId = e.pointerId; pad.setPointerCapture(e.pointerId); padSet(e); });
pad.addEventListener('pointermove', e => { if (e.pointerId === padId) padSet(e); });
const padEnd = e => { if (e.pointerId !== padId) return; padId = null; ctl.pad.x = 0; ctl.pad.z = 0; knob.style.transform = ''; delete pad.dataset.dir; };
pad.addEventListener('pointerup', padEnd); pad.addEventListener('pointercancel', padEnd);
$('#actBtn').addEventListener('click', actionPress);
const KEYMAP = { ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0], w:[0,-1], s:[0,1], a:[-1,0], d:[1,0], W:[0,-1], S:[0,1], A:[-1,0], D:[1,0] };
window.addEventListener('keydown', e => {
  if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (KEYMAP[e.key]){ ctl.keys.add(e.key); e.preventDefault(); }
  else if (e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); actionPress(); }
  else if (e.key === 'Escape' && G.panel) closePanel();
});
window.addEventListener('keyup', e => ctl.keys.delete(e.key));
window.addEventListener('blur', () => ctl.keys.clear());
function canStand(x, z){
  const rr = 0.26, me = chars[G.slot], up = me ? (me.elev||0) + (me.jy||0) : 0;
  for (const [ox,oz] of [[-rr,-rr],[rr,-rr],[-rr,rr],[rr,rr]]){ const i = Math.round(x+ox)+C, j = Math.round(z+oz)+C; if (blocked(i,j)){ const h = platAt(i,j); if (!(h > 0 && up >= h - 0.06)) return false; } }
  if (me && charBlock(me, x, z)) return false;
  return true;
}
function stepControls(dt){
  if (!G.started || G.ride || G.mini || dlg || G.down || G.rescue || G.police || G.sleepAnim || G.sit || (G.panel && G.panel !== 'build' && G.panel !== 'decor')){ ctl.wasMoving = false; return; }
  if (G.boat && typeof boatControls === 'function'){ boatControls(dt); return; }
  let dx = ctl.pad.x, dz = ctl.pad.z;
  ctl.keys.forEach(k => { dx += KEYMAP[k][0]; dz += KEYMAP[k][1]; });
  const len = Math.hypot(dx,dz);
  const me = chars[G.slot]; if (!me) return;
  if (len < 0.1){ if (ctl.wasMoving){ ctl.wasMoving = false; me.moving = false; if (!G.inside){ G.me.i = me.i; G.me.j = me.j; saveMe(); } } return; }
  dx /= len; dz /= len;
  const YW = G.inside ? (G.inYaw||0) : G.yaw; if (YW){ const cy = Math.cos(YW), sy = Math.sin(YW), rx = dx*cy + dz*sy, rz = -dx*sy + dz*cy; dx = rx; dz = rz; }
  if (G.fishing) stopFishing();
  me.path = []; me.onArrive = null;
  const sp = 3.4 * (me.ride && ITEM[me.ride] ? ITEM[me.ride].v.speed : 1) * dt;
  const nx = me.x + dx*sp, nz = me.z + dz*sp;
  const ok = G.inside ? canStandIn : canStand;
  if (ok(nx, nz)){ me.x = nx; me.z = nz; }
  else if (ok(nx, me.z)) me.x = nx;
  else if (ok(me.x, nz)) me.z = nz;
  me.face = Math.atan2(dx, dz);
  if (G.inside){ me.moving = true; ctl.wasMoving = true; if (me.z > IZ + ID/2 + 0.15) exitHouse(); return; }
  me.i = Math.round(me.x)+C; me.j = Math.round(me.z)+C;
  me.moving = true; ctl.wasMoving = true;
}
let actT = 0;
function updateActLabel(){ if (!G.started) return; const t = G.fishing ? { type:'fish' } : G.build ? { type:'build' } : frontTarget(); $('#actBtn').textContent = t && t.type==='fish' ? '낚아채기' : t && t.type==='build' ? '놓기' : actLabel(t); $('#actBtn').classList.toggle('hot', !!t); }

/* ---- character select ---- */
function renderPick(){
  if (window.DVNet) return; // web version: login screen, no characters shown
  const cards = $('#cards'); cards.innerHTML = '';
  SLOTS.forEach((S,s) => {
    const p = Store.data.players[pid(s)]; const card = document.createElement('div'); card.className = 'pcard';
    card.appendChild(avatarCanvas(s)); const who = document.createElement('div'); who.className = 'who';
    who.innerHTML = '<div><input id="nm'+s+'" maxlength="8" aria-label="이름" value="'+esc((p&&p.name)||S.name)+'"><button class="go" data-s="'+s+'">입장</button></div><span class="seen">'+(p ? '마지막 접속 '+ago(p.at)+' · 도토리 '+p.acorns : '아직 아무도 안 골랐어요')+'</span>';
    card.appendChild(who); cards.appendChild(card);
  });
}
$('#cards').addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (!b) return; start(Number(b.dataset.s), $('#nm'+b.dataset.s).value.trim()); });
function start(s, name){
  if (G.started) return; if (Store.mode === 'loading'){ toast('마을을 불러오는 중이에요'); return; }
  G.slot = s; LS.set('dv.slot', s);
  const p = Store.data.players[pid(s)];
  G.me = p && p.owned ? JSON.parse(JSON.stringify(p)) : Object.assign(blankPlayer(s), p ? { name:p.name, dex:p.dex||{}, acorns:Math.max(120, p.acorns||0) } : {});
  if (name) G.me.name = name;
  if (!G.me.wv){ if (p && p.owned){ G.me.i += C-OLD_C; G.me.j += C-OLD_C; } G.me.wv = 6; }
  else if (G.me.wv === 5){ G.me.i += 20; G.me.j += 20; G.me.wv = 6; }
  ensureDaily(); regenStamina();
  $('#pick').hidden = true; $('#hud').hidden = false; G.started = true;
  SLOTS.forEach((_,k) => { if (!chars[k]) chars[k] = makeChar(k); });
  const me = chars[s]; applyLook(me, G.me);
  const si = blocked(G.me.i,G.me.j) ? SPAWN[0] : G.me.i, sj = blocked(G.me.i,G.me.j) ? SPAWN[1] : G.me.j;
  charAt(me, si, sj); G.me.i = si; G.me.j = sj;
  homeOf(G.me); G.me.inv = G.me.inv || {}; G.me.tools = G.me.tools || {}; G.me.furn = G.me.furn || {};
  if (!Object.keys(npcs).length) spawnNpcs();
  buildSpots(true); syncCrops(); refreshFields();
  syncOthers(); refreshFruit(); rebuildPickables(); processDebt(); processBank(); updateHud(); saveMe(true); updateBadge();
  camTarget.set(me.x,0,me.z);
  if (!G.me.made) setTimeout(openMirror, 300);
  else toast('방향키로 걷고, 무언가를 바라보며 행동 버튼을 눌러요', 3200);
}
function syncOthers(){
  if (!G.started) return;
  SLOTS.forEach((_,s) => {
    if (s === G.slot) return; const c = chars[s], p = Store.data.players[pid(s)];
    if (!p){ c.g.visible = false; c.lbl.hidden = true; return; }
    c.g.visible = true; applyLook(c, p);
    const off = p.wv === 5 ? 20 : p.wv ? 0 : C-OLD_C, pi = p.i + off, pj = p.j + off;
    if (c.i !== pi || c.j !== pj){
      if (c.placedOnce && Math.abs(c.i-pi)+Math.abs(c.j-pj) < 40){ const path = bfs(c.i,c.j,(i,j)=>i===pi&&j===pj); if (path) c.path = path; else charAt(c,pi,pj); }
      else { charAt(c,pi,pj); c.placedOnce = true; }
    }
  });
}

/* ---- time of day ---- */
const SKY = [[0,'#4a4e86',0.36,0.12],[5,'#6a6aa6',0.36,0.15],[6.5,'#ffd6c8',0.44,0.3],[8,'#d2eef8',0.5,0.46],[16.5,'#d2eef8',0.5,0.46],[18,'#ffd0bc',0.45,0.34],[19.5,'#9a8ec8',0.38,0.2],[21,'#5a5c98',0.36,0.12],[24,'#4a4e86',0.36,0.12]];
let lastTimeKey = '';
function applyTime(force){
  const h = hourNow(), k = Math.round(h*12)+settings.time+(G.inside?'i':''); if (!force && k===lastTimeKey) return; lastTimeKey = k;
  let a = SKY[0], b = SKY[1]; for (let n=0;n<SKY.length-1;n++) if (h>=SKY[n][0] && h<=SKY[n+1][0]){ a = SKY[n]; b = SKY[n+1]; break; }
  const t = (h-a[0])/Math.max(0.001,b[0]-a[0]); const col = new THREE.Color(a[1]).lerp(new THREE.Color(b[1]), t);
  scene.background = G.inside ? new THREE.Color('#d6cae4') : col; document.body.style.background = '#'+col.getHexString();
  hemi.intensity = a[2]+(b[2]-a[2])*t; sun.intensity = a[3]+(b[3]-a[3])*t;
  if (G.inside){ hemi.intensity = Math.min(hemi.intensity, 0.3); sun.intensity = Math.min(sun.intensity, 0.36); }
  sun.color.set(((h>16.5&&h<19.5)||(h>5&&h<7.5)) ? 0xffd8c0 : (h>=19.5||h<5) ? 0xb8c0ff : 0xfff4e8); hemi.groundColor.set((h>=19.5||h<5) ? 0x8a8ab8 : 0xd8d0e6);
  const night = h>=18.6 || h<5.6;
  matWin.emissive.set(night ? 0xffd58a : 0x000000); matWin.color.set(night ? 0xffeab8 : 0xc8e6f6); matBulb.emissive.set(night ? 0xffe0a0 : 0x000000);
  sea.material.color.set(night ? 0x7a86c8 : 0xa8dcf0); seabed.material.color.set(night ? 0x6a76b0 : 0x9ed4e4);
  const d = new Date(), hh = Math.floor(h), mm = settings.time==='real' ? d.getMinutes() : Math.round((h-hh)*60);
  $('#clock').innerHTML = SEASONS[season()]+' · '+(d.getMonth()+1)+'월 '+d.getDate()+'일<small>'+(hh<12?'오전 ':'오후 ')+(((hh+11)%12)+1)+':'+String(mm).padStart(2,'0')+(settings.time!=='real'?' (미리보기)':'')+'</small>';
}

/* ---- camera / resize ---- */
const camTarget = new THREE.Vector3(0,0,0);
function resize(){
  const w = window.innerWidth, h = window.innerHeight;
  const pr = Math.min(window.devicePixelRatio||1, 2);
  renderer.setPixelRatio(pr); renderer.setSize(w, h, false);
  const aspect = w/h, z = G.focus ? 3.3 : (G.inside ? Math.max(1.55, G.zoom) : G.zoom); G.land = aspect > 1.1;
  const viewW = Math.max(10, Math.min(18, 10 * Math.max(1, aspect*1.6))) / z, viewH = viewW / aspect;
  cam.left = -viewW/2; cam.right = viewW/2; cam.top = viewH/2; cam.bottom = -viewH/2;
  if (G.focus){ if (G.land){ cam.left = -viewW*0.26; cam.right = viewW*0.74; } else { cam.top = viewH*0.25; cam.bottom = -viewH*0.75; } }
  cam.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
const CAM_OFF = new THREE.Vector3(0,14,13);
G.yaw = LS.get('dv.yaw', 0) || 0;
function setPitch(p){ G.pitch = Math.max(22, Math.min(82, p)); try{ LS.set('dv.pitch', G.pitch); }catch(e){} }
function setYaw(y){ G.yaw = Math.atan2(Math.sin(y), Math.cos(y)); try{ LS.set('dv.yaw', G.yaw); }catch(e){} }
function camOffset(){
  const yaw = G.inside ? (G.inYaw||0) : G.yaw, p = (G.focus ? 13 : G.pitch)*Math.PI/180;
  return CAM_OFF.set(Math.sin(yaw)*19*Math.cos(p), 19*Math.sin(p), Math.cos(yaw)*19*Math.cos(p));
}
setPitch(LS.get('dv.pitch', 47));

/* ---- input ---- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const pointers = new Map(); let pinch = null, downInfo = null;
let drag = null;
canvas.addEventListener('mousedown', e => { if (e.button === 1) e.preventDefault(); });
canvas.addEventListener('auxclick', e => { if (e.button === 1) e.preventDefault(); });
canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x:e.clientX, y:e.clientY }); if (pointers.size===1){ downInfo = { x:e.clientX, y:e.clientY, t:performance.now(), mid:e.button===1, yaw:G.yaw, iy:G.inYaw||0, pitch:G.pitch, face:null }; drag = null; } if (pointers.size===2){ const [a,b] = [...pointers.values()]; pinch = { d:Math.hypot(a.x-b.x,a.y-b.y), z:G.zoom, y:(a.y+b.y)/2, p:G.pitch }; downInfo = null; drag = null; } });
canvas.addEventListener('pointermove', e => { if (!pointers.has(e.pointerId)) return; pointers.set(e.pointerId, { x:e.clientX, y:e.clientY });
  if (pinch && pointers.size===2){ const [a,b] = [...pointers.values()]; const ratio = Math.hypot(a.x-b.x,a.y-b.y)/pinch.d, dy = (a.y+b.y)/2 - pinch.y; if (Math.abs(ratio-1) > 0.06) { G.zoom = Math.max(0.55, Math.min(4.5, pinch.z*ratio)); resize(); } setPitch(pinch.p + dy*0.18); return; }
  if (downInfo && pointers.size===1){ const dx = e.clientX-downInfo.x, dy = e.clientY-downInfo.y;
    if (!drag && Math.hypot(dx,dy) > 12) drag = downInfo.mid ? 'pitch' : G.focus ? 'spin' : (dlg || G.ride) ? null : G.inside ? (G.panel === 'decor' ? null : Math.abs(dx) >= Math.abs(dy)*0.7 ? 'iyaw' : null) : Math.abs(dx) >= Math.abs(dy)*0.7 ? 'yaw' : null;
    if (drag === 'yaw') setYaw(downInfo.yaw - dx*0.009);
    else if (drag === 'iyaw') G.inYaw = Math.max(-0.95, Math.min(0.95, downInfo.iy - dx*0.009));
    else if (drag === 'pitch'){ setPitch(downInfo.pitch + dy*0.25); if (!G.inside && !G.focus) setYaw(downInfo.yaw - dx*0.009); }
    else if (drag === 'spin'){ const me = chars[G.slot]; if (me){ if (downInfo.face === null) downInfo.face = me.face; me.face = downInfo.face + dx*0.02; } } } });
const endPtr = e => { pointers.delete(e.pointerId); if (pointers.size<2) pinch = null; if (e.type==='pointerup' && downInfo && pointers.size===0 && !drag){ if (Math.hypot(e.clientX-downInfo.x, e.clientY-downInfo.y) < 12 && performance.now()-downInfo.t < 600) onTap(e.clientX, e.clientY); } if (pointers.size===0){ downInfo = null; drag = null; } };
canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);
canvas.addEventListener('wheel', e => { e.preventDefault(); G.zoom = Math.max(0.55, Math.min(4.5, G.zoom*(e.deltaY<0?1.1:0.9))); resize(); }, { passive:false });
function onTap(x,y){
  if (dlg){ dialogTap(); return; }
  if (!G.started || G.ride || G.mini || G.down || G.rescue) return;
  if (G.inside){
    ndc.set((x/window.innerWidth)*2-1, -(y/window.innerHeight)*2+1); ray.setFromCamera(ndc, cam);
    const hit = room ? ray.intersectObjects(room.children, true)[0] : null; if (!hit) return;
    let o = hit.object, n = null; if (hit.object.userData.clerk && G.inside.clerkNp && !G.panel){ if (G.inside.clerkNp.sleep) toast('쿨쿨… 깊이 잠들어 있어요'); else talkTo(G.inside.clerkNp); return; }
    while (o && n === null){ if (o.userData.furn !== undefined) n = o.userData.furn; o = o.parent; }
    if (G.panel === 'decor'){ const tx = Math.round(hit.point.x - IX + (IW-1)/2), tz = Math.round(hit.point.z - IZ + (ID-1)/2); decorTap(tx, tz, n); return; }
    if (G.panel){ closePanel(); return; }
    if (n !== null) useFurniture(n);
    return;
  }
  if (G.panel && G.panel !== 'build'){ closePanel(); return; }
  if (G.fishing && !G.build){ fishTap(); return; }
  ndc.set((x/window.innerWidth)*2-1, -(y/window.innerHeight)*2+1); ray.setFromCamera(ndc, cam);
  const hits = ray.intersectObjects(pickables, false);
  for (const h of hits){
    const o = h.object;
    if (o.userData.npc){ const np = npcs[o.userData.npc]; if (!np.g.visible) continue; if (!G.build) walkTo(np.i, np.j, () => talkTo(np)); return; }
    if (o.userData.char !== undefined){ if (o.userData.char !== G.slot && !G.build){ const s = o.userData.char, p = Store.data.players[pid(s)]; toast(playerName(s)+' · 마지막 접속 '+(p?ago(p.at):'없음')); return; } continue; }
    if (o.userData.key){
      if (G.build){ if (o.userData.placed){ const [i,j] = dparse(o.userData.key); buildTap(i,j); } else toast('여기엔 놓을 수 없어요'); return; }
      onObjectTap(o.userData.key); return;
    }
    if (o === ground){ const i = Math.round(h.point.x)+C, j = Math.round(h.point.z)+C; if (!inb(i,j)) return;
      if (tile[idx(i,j)] === WATER){ if (G.build){ toast('물 위에는 놓을 수 없어요'); return; } walkTo(i,j, () => startFishing(i,j)); return; }
      if (G.build) buildTap(i,j); else walkTo(i,j); return; }
  }
}

/* ---- loop ---- */
let last = performance.now(), waterT = 0, timeT = 0, hudT = 0;
const W2 = () => window.innerWidth, H2 = () => window.innerHeight;
function frame(now){
  requestAnimationFrame(frame);
  if (now - last < 1000/32) return; const dt = Math.min(0.05, (now-last)/1000); last = now; const tsec = now/1000;
  // trains
  trainsTick(dt);
  // characters
  Object.values(chars).forEach(c => {
    if (!c.g.visible || !c.model) return; let moving = !!c.moving && c.slot === G.slot && ctl.wasMoving;
    const sp = 3.4 * (c.ride && ITEM[c.ride] ? ITEM[c.ride].v.speed : 1);
    if (c.path.length){
      const [ti,tj] = c.path[0], tx = wx(ti), tz = wz(tj), dx = tx-c.x, dz = tz-c.z, dist = Math.hypot(dx,dz), step = sp*dt;
      c.face = Math.atan2(dx,dz);
      if (dist <= step){ c.x = tx; c.z = tz; c.i = ti; c.j = tj; c.path.shift();
        if (!c.path.length){ if (c.slot===G.slot){ G.me.i = c.i; G.me.j = c.j; saveMe(); } const cb = c.onArrive; c.onArrive = null; if (cb) cb(); } }
      else { c.x += dx/dist*step; c.z += dz/dist*step; moving = true; }
    }
    let dr = c.face - c.g.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); c.g.rotation.y += dr*Math.min(1, dt*14);
    c.walkT = moving ? c.walkT + dt*(c.ride?16:13) : 0;
    const U = c.model.userData, sw = moving ? Math.sin(c.walkT)*0.7 : 0;
    if (c.ride === 'car'){ U.arms.forEach(a => a.rotation.x = -0.9); }
    else if (c.ride){ U.legs[0].rotation.x = -0.9 + (moving?Math.sin(c.walkT)*0.5:0); U.legs[1].rotation.x = -0.9 - (moving?Math.sin(c.walkT)*0.5:0); U.arms.forEach(a => a.rotation.x = -0.8); }
    else { U.legs[0].rotation.x = sw; U.legs[1].rotation.x = -sw; U.arms[0].rotation.x = -sw*0.8; U.arms[1].rotation.x = (c.slot===G.slot && G.fishing) ? -0.9 : sw*0.8; }
    c.model.position.y = (c.ride==='car'?0.32:c.ride==='scooter'?0.22:c.ride==='bike'?0.26:0) + (moving && !c.ride ? Math.abs(Math.sin(c.walkT))*0.05 : Math.sin(tsec*2+c.slot)*0.008);
    U.head.rotation.z = moving ? Math.sin(c.walkT)*0.04 : Math.sin(tsec*1.3+c.slot)*0.03;
    if (c.slot === G.slot) actionPose(c, dt, tsec);
    if (!c.override) c.g.position.set(c.x, (c.elev||0) + (c.jy||0), c.z);
  });
  // fishing
  if (G.fishing){ const F = G.fishing; if (F.state==='wait'){ bobber.position.y = -0.28+Math.sin(tsec*3)*0.02; if (now >= F.biteAt){ F.state = 'bite'; F.until = now+950; showBubble(); try{ navigator.vibrate && navigator.vibrate(60); }catch(e){} } } else if (now > F.until){ stopFishing(); toast('앗, 놓쳤어요'); } else bobber.position.y = -0.42+Math.sin(tsec*30)*0.03; }
  G.shake = G.shake.filter(s => { s.t += dt; const k = Math.max(0, 1-s.t/0.6); if (s.g){ if (s.rock) s.g.position.y = Math.abs(Math.sin(s.t*30))*0.05*k; else s.g.rotation.z = Math.sin(s.t*40)*0.12*k; } return s.t < 0.6; });
  G.fx = G.fx.filter(f => { f.t += dt; if (f.g){ f.g.position.y = -(Math.min(1,f.t*2)**2)*0.9; if (f.t >= 0.55) f.g.position.y = 0; } return f.t < 0.55; });
  stepControls(dt);
  featTick(dt, tsec);
  timeT += dt; if (timeT > 20){ timeT = 0; applyTime(); }
  hudT += dt; if (hudT > 1 && G.me){ hudT = 0; updateHud(); deliveryTick(); featSlow(); }
  actT += dt; if (actT > 0.25){ actT = 0; updateActLabel(); }
  if (G.mini) miniTick(now);
  // camera
  const me = G.started ? chars[G.slot] : null;
  if (G.ride){ camTarget.lerp(rideCamTarget(), Math.min(1, dt*4)); }
  else if (me && G.focus) camTarget.lerp(_v.set(me.x, 0.62, me.z), Math.min(1, dt*6));
  else if (me && G.inside){ const ex = Math.max(0, IW/2 - 2.5); camTarget.lerp(_v.set(Math.max(IX-ex, Math.min(IX+ex, me.x)), 0, Math.max(IZ - ID/2 + 2.4, Math.min(IZ + ID/2 - 2.2, me.z)) + (G.panel==='decor' && !G.land ? 1.6 : 0)), Math.min(1, dt*5)); }
  else if (me) camTarget.lerp(_v.set(me.x, Math.min(0.7, Math.max(0, G.zoom - 1.6)*0.3) + (me.elev||0)*0.9, me.z), Math.min(1, dt*5));
  else camTarget.set(Math.sin(tsec*0.12)*5, 0, Math.cos(tsec*0.12)*5);
  cam.position.copy(camTarget).add(camOffset()); cam.lookAt(camTarget);
  sun.position.copy(camTarget).add(_v.set(-8,16,6)); sun.target.position.copy(camTarget);
  renderer.render(scene, cam);
  // labels
  const W = W2(), H = H2();
  Object.values(chars).forEach(c => {
    if (!c.g.visible || !G.started || G.focus || (G.inside && c.slot !== G.slot)){ c.lbl.hidden = true; return; }
    _v.set(c.x, 1.65 + (c.elev||0) + (c.jy||0), c.z).project(cam); c.lbl.hidden = false; c.lbl.style.left = ((_v.x+1)/2*W)+'px'; c.lbl.style.top = ((1-_v.y)/2*H)+'px';
    const p = Store.data.players[pid(c.slot)], on = c.slot===G.slot || (p && Date.now()-p.at < 180000);
    const txt = (on?'<span class="on"></span>':'')+esc(playerName(c.slot)); if (c.lbl._t !== txt){ c.lbl.innerHTML = txt; c.lbl._t = txt; }
    c.lbl.className = 'lbl'+(c.slot===G.slot?' me':'');
  });
  Object.values(npcs).forEach(np => {
    if (!G.started || G.focus || G.inside || !np.g.visible){ np.lbl.hidden = true; return; }
    np.lbl.classList.toggle('guide', !!(G.guide && G.guide.np === np));
    _v.set(np.x, 1.75, np.z).project(cam); np.lbl.hidden = false; np.lbl.style.left = ((_v.x+1)/2*W)+'px'; np.lbl.style.top = ((1-_v.y)/2*H)+'px';
    const txt = np.n.name + (G.guide && G.guide.np === np ? ' · 따라와!' : np.n.id==='kini' && G.me.kini && G.me.kini.on ? ' · 같이 가는 중' : ''); if (np.lbl._t !== txt){ np.lbl.textContent = txt; np.lbl._t = txt; }
  });
  if (bubbleEl && !bubbleEl.hidden && G.fishing){ _v.set(wx(G.fishing.ti),0.5,wz(G.fishing.tj)).project(cam); bubbleEl.style.left = ((_v.x+1)/2*W)+'px'; bubbleEl.style.top = ((1-_v.y)/2*H)+'px'; }
  // delivery arrow
  if (G.delivery && me && !G.focus){
    const D = G.delivery; _v.set(D.door[0], 0.5, D.door[1]).project(cam);
    let sx = (_v.x+1)/2*W, sy = (1-_v.y)/2*H; const cx = W/2, cy = H/2, pad = 46;
    const inside = sx>pad && sx<W-pad && sy>pad+60 && sy<H-pad-80;
    const ang = Math.atan2(sy-cy, sx-cx);
    if (!inside){ const kx = (W/2-pad)/Math.abs(Math.cos(ang)||1e-6), ky = (H/2-pad-70)/Math.abs(Math.sin(ang)||1e-6); const k = Math.min(kx,ky); sx = cx+Math.cos(ang)*k; sy = cy+Math.sin(ang)*k; }
    else sy -= 30;
    const a = $('#arrow'); a.hidden = false; a.style.left = sx+'px'; a.style.top = sy+'px'; a.style.transform = 'rotate('+(inside?180:(ang*180/Math.PI+90))+'deg)';
  } else $('#arrow').hidden = true;
}

/* =====================================================================
   v4 features: gathering, general store, bank, house interiors, animal-folk NPCs
   ===================================================================== */

/* ---------- gatherables ---------- */
const GATHER = {
  butterfly_w:{ name:'배추흰나비', cat:'bug', price:12, seasons:'spring summer', when:'day', c:'#ffffff' },
  butterfly_t:{ name:'호랑나비', cat:'bug', price:30, seasons:'spring summer', when:'day', c:'#ffd34e' },
  ladybug:{ name:'무당벌레', cat:'bug', price:10, seasons:'spring summer autumn', when:'day', c:'#ef5f6e' },
  bee:{ name:'꿀벌', cat:'bug', price:18, seasons:'spring', when:'day', c:'#f2b82a' },
  cicada:{ name:'매미', cat:'bug', price:25, seasons:'summer', when:'day', c:'#9a8a6a' },
  stag:{ name:'사슴벌레', cat:'bug', price:80, seasons:'summer', when:'night', c:'#6a4a3a' },
  firefly:{ name:'반딧불이', cat:'bug', price:60, seasons:'summer', when:'night', c:'#d8f070' },
  dragonfly:{ name:'고추잠자리', cat:'bug', price:20, seasons:'autumn', when:'day', c:'#ef6f4e' },
  cricket:{ name:'귀뚜라미', cat:'bug', price:22, seasons:'autumn', when:'night', c:'#8a6a4a' },
  mantis:{ name:'사마귀', cat:'bug', price:40, seasons:'autumn', when:'day', c:'#8fcf6a' },
  moth:{ name:'겨울자나방', cat:'bug', price:35, seasons:'winter', when:'any', c:'#d8d0e8' },
  snowbug:{ name:'눈꽃벌레', cat:'bug', price:45, seasons:'winter', when:'day', c:'#e8f4ff' },
  clam:{ name:'조개껍데기', cat:'shell', price:6, w:10, c:'#ffe6d6' },
  conch:{ name:'소라', cat:'shell', price:15, w:6, c:'#f2c8a8' },
  starfish:{ name:'불가사리', cat:'shell', price:20, w:4, c:'#ff9a7a' },
  coral:{ name:'산호 조각', cat:'shell', price:30, w:3, c:'#ff8fa6' },
  pearl:{ name:'진주', cat:'shell', price:120, w:1, c:'#fffaf0' },
  pinecone:{ name:'솔방울', cat:'forage', price:8, seasons:'all', c:'#b08a6a' },
  fern:{ name:'고사리', cat:'forage', price:14, seasons:'spring', c:'#8fcf7a' },
  berry:{ name:'산딸기', cat:'forage', price:18, seasons:'summer', c:'#ef5f7e' },
  mushroom:{ name:'버섯', cat:'forage', price:15, seasons:'autumn', c:'#e88a6a' },
  chestnut:{ name:'밤', cat:'forage', price:16, seasons:'autumn', c:'#a8704a' },
  camellia:{ name:'동백꽃', cat:'forage', price:20, seasons:'winter', c:'#ef5f6e' },
  clover:{ name:'네잎클로버', cat:'forage', price:50, seasons:'spring summer', c:'#6fcf7a', rare:true },
  worm:{ name:'지렁이', cat:'dig', price:3, w:6, c:'#e8a0a0' },
  potato:{ name:'감자', cat:'dig', price:12, w:6, c:'#d8b888' },
  pottery:{ name:'토기 조각', cat:'dig', price:40, w:3, c:'#c88a6a' },
  oldcoin:{ name:'옛날 동전', cat:'dig', price:60, w:2, c:'#e8c86a' },
  gem:{ name:'반짝 보석', cat:'dig', price:120, w:1, c:'#9fd8f0' },
  fossil:{ name:'공룡 화석', cat:'dig', price:150, w:1, c:'#efe6d6' },
  apple:{ name:'사과', cat:'tree', price:12, c:'#e2393b' },
  persimmon:{ name:'감', cat:'tree', price:12, c:'#ff8a1f' },
  cherry:{ name:'버찌', cat:'tree', price:10, c:'#e8455a' },
  orange:{ name:'귤', cat:'tree', price:14, c:'#ffa63a' },
  coconut:{ name:'코코넛', cat:'tree', price:30, c:'#a8784e' },
  maple_leaf:{ name:'단풍잎', cat:'tree', price:9, c:'#ff8a6a' },
  birch_bark:{ name:'자작나무 껍질', cat:'tree', price:11, c:'#f4ece0' },
  tulip:{ name:'튤립', cat:'flower', price:16, seasons:'spring summer autumn', c:'#ff9aae' },
  sunflower:{ name:'해바라기', cat:'flower', price:20, seasons:'spring summer autumn', c:'#ffd34e' },
  cosmos:{ name:'코스모스', cat:'flower', price:16, seasons:'spring summer autumn', c:'#f7a8d8' },
  lily:{ name:'백합', cat:'flower', price:22, seasons:'spring summer autumn', c:'#fff6d8' },
  rose:{ name:'장미', cat:'flower', price:24, seasons:'spring summer autumn', c:'#ff7f9a' },
  snowdrop:{ name:'설강화', cat:'flower', price:26, seasons:'winter', c:'#f4f8ff' },
};
const GCAT = { bug:'곤충', shell:'바닷가', forage:'숲 채집', dig:'땅속', tree:'나무 열매', flower:'꽃', crop:'농작물' };
const TOOLS = { net:{ name:'잠자리채', price:60, note:'곤충을 잡을 수 있어요' }, shovel:{ name:'삽', price:80, note:'반짝이는 땅을 팔 수 있어요' } };
const spots = new Map(); // tile key -> spot
let spotsGroup = null, spotsSig = '';
const hashStr = s => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const nightNow = () => { const h = hourNow(); return h >= 19 || h < 5; };
function availGather(cat){
  const s = season(), night = nightNow();
  return Object.entries(GATHER).filter(([id,g]) => g.cat===cat && (!g.seasons || g.seasons==='all' || g.seasons.includes(s)) && (!g.when || g.when==='any' || (g.when==='night')===night));
}
function weighted(list, r){ let tot = list.reduce((a,[,g]) => a+(g.w||(g.rare?1:6)),0), x = r()*tot; for (const [id,g] of list){ x -= g.w||(g.rare?1:6); if (x<=0) return id; } return list[0][0]; }
function buildSpots(force){
  const sig = today()+'|'+season()+'|'+(nightNow()?'n':'d');
  if (!force && sig === spotsSig) return; spotsSig = sig;
  spots.clear(); if (spotsGroup) scene.remove(spotsGroup); spotsGroup = new THREE.Group(); scene.add(spotsGroup);
  const r = rng(hashStr(sig));
  const free = (i,j,t) => inb(i,j) && tile[idx(i,j)]===t && !statics.has(key(i,j)) && !spots.has(key(i,j));
  const place = (cat, n, ok) => {
    const pool = availGather(cat); if (!pool.length) return;
    let tries = 0, made = 0;
    while (made < n && tries++ < 4000){ const i = 2+Math.floor(r()*(N-4)), j = 2+Math.floor(r()*(N-4)); if (!ok(i,j)) continue;
      const id = cat+'_'+made; spots.set(key(i,j), { sid:id, cat, item:weighted(pool, r), i, j }); made++; }
  };
  place('bug', 20, (i,j) => free(i,j,GRASS) || free(i,j,FLOWERF));
  place('shell', 14, (i,j) => free(i,j,SAND));
  place('forage', 14, (i,j) => free(i,j,GRASS) && [[1,0],[-1,0],[0,1],[0,-1]].some(([a,b]) => { const s = statics.get(key(i+a,j+b)); return s && s.kind==='tree'; }));
  place('dig', 10, (i,j) => free(i,j,GRASS));
  spots.forEach((sp,k) => { const g = spotMesh(sp); g.position.set(wx(sp.i), 0, wz(sp.j)); g.traverse(o => { o.userData.key = k; }); sp.g = g; spotsGroup.add(g); });
  refreshSpots(); rebuildPickables();
}
function spotMesh(sp){
  const g = new THREE.Group(), it = GATHER[sp.item];
  if (sp.cat === 'bug'){
    const b = new THREE.Group(); b.position.y = 0.55; g.add(b); g.userData.bug = b;
    M(new THREE.CapsuleGeometry(0.035, 0.08, 4, 8), shade(it.c,0.75), 0, 0, 0, b).rotation.x = Math.PI/2;
    const wm = new THREE.MeshToonMaterial({ color:soft(it.c), gradientMap:GRAD, side:THREE.DoubleSide });
    [-1,1].forEach(s => { const w = new THREE.Mesh(new THREE.CircleGeometry(0.1, 10), wm); w.position.set(0.06*s,0.02,0); w.rotation.set(-Math.PI/2, 0, 0); w.userData.wing = s; b.add(w); });
    if (sp.item === 'firefly') M(new THREE.SphereGeometry(0.05,8,6), matBulb, 0, -0.02, -0.06, b);
  } else if (sp.cat === 'shell'){
    M(new THREE.ConeGeometry(0.1, 0.16, 10), it.c, 0, 0.06, 0, g).rotation.z = 1.2;
    const sp2 = M(new THREE.OctahedronGeometry(0.06), '#ffffff', 0.1, 0.3, 0, g); sp2.castShadow = false; g.userData.spark = sp2;
  } else if (sp.cat === 'forage'){
    if (sp.item === 'mushroom'){ M(new THREE.CylinderGeometry(0.035,0.045,0.12,8), '#fff4e8', 0, 0.06, 0, g); M(new THREE.SphereGeometry(0.1,12,8,0,Math.PI*2,0,Math.PI/2), it.c, 0, 0.11, 0, g); }
    else { M(new THREE.SphereGeometry(0.12,10,8), '#a8dca0', 0, 0.08, 0, g).scale.set(1,0.6,1); for (let k=0;k<3;k++) M(new THREE.SphereGeometry(0.045,8,6), it.c, Math.cos(k*2.1)*0.08, 0.15, Math.sin(k*2.1)*0.08, g); }
    const sp2 = M(new THREE.OctahedronGeometry(0.05), '#ffffff', -0.1, 0.32, 0, g); sp2.castShadow = false; g.userData.spark = sp2;
  } else {
    const xm = TM('#b89a88'); [0.6,-0.6].forEach(a => { const m = M(new THREE.BoxGeometry(0.42,0.02,0.07), xm, 0, 0.02, 0, g); m.rotation.y = a; m.castShadow = false; });
    const sp2 = M(new THREE.OctahedronGeometry(0.06), '#fff3c0', 0, 0.25, 0, g); sp2.castShadow = false; g.userData.spark = sp2;
  }
  return g;
}
function refreshSpots(){ if (!G.me) return; const got = (G.me.daily && G.me.daily.got) || []; spots.forEach(sp => { if (sp.g) sp.g.visible = !got.includes(sp.sid); }); }
function spotAt(i,j){ const sp = spots.get(key(i,j)); if (!sp || !G.me) return null; const got = (G.me.daily && G.me.daily.got) || []; return got.includes(sp.sid) ? null : sp; }
function addItem(id, n){ G.me.inv = G.me.inv || {}; G.me.inv[id] = (G.me.inv[id]||0) + (n||1); G.me.gdex = G.me.gdex || {}; const isNew = !G.me.gdex[id]; G.me.gdex[id] = 1; return isNew; }
function gather(sp){
  ensureDaily(); G.me.daily.got = G.me.daily.got || [];
  const it = GATHER[sp.item]; const tools = G.me.tools || {};
  if (sp.cat === 'bug' && !tools.net){ toast('잠자리채가 있어야 잡을 수 있어요. 잡화점에서 팔아요'); return; }
  if (sp.cat === 'dig' && !tools.shovel){ toast('삽이 있어야 팔 수 있어요. 잡화점에서 팔아요'); return; }
  G.me.daily.got.push(sp.sid);
  const me = chars[G.slot]; doAnim(sp.cat==='bug' ? 'net' : sp.cat==='dig' ? 'dig' : 'pick');
  if (sp.cat === 'bug' && Math.random() < 0.22){ refreshSpots(); toast(it.name+'이(가) 날아가 버렸어요'); saveMe(); return; }
  const isNew = addItem(sp.item); refreshSpots(); saveMe();
  const verb = { bug:'잡았어요', shell:'주웠어요', forage:'캤어요', dig:'파냈어요' }[sp.cat];
  pop((isNew?'<div class="new">도감 새 등록</div>':'')+'<div class="sw" style="background:'+it.c+';width:40px;height:22px;margin:0 auto 4px"></div>'+it.name, it.name+'을(를) '+verb+'!<br><small>잡화점에서 도토리 '+it.price+'에 팔 수 있어요</small>');
}

/* ---------- furniture catalog ---------- */
const FURN = {
  bed:{ name:'포근한 침대', price:180, w:1, d:2, use:'rest' },
  wardrobe:{ name:'옷장', price:130, w:1, d:1, use:'ward' },
  mirror:{ name:'전신 거울', price:90, w:1, d:1, use:'mirror' },
  sofa:{ name:'솜사탕 소파', price:160, w:2, d:1 },
  chair:{ name:'원목 의자', price:40, w:1, d:1 },
  table:{ name:'동그란 탁자', price:70, w:1, d:1 },
  desk:{ name:'책상', price:90, w:2, d:1 },
  bookshelf:{ name:'책장', price:110, w:1, d:1 },
  lamp:{ name:'스탠드 조명', price:50, w:1, d:1 },
  plant:{ name:'몬스테라 화분', price:45, w:1, d:1 },
  cactus:{ name:'선인장', price:25, w:1, d:1 },
  tv:{ name:'텔레비전', price:150, w:1, d:1, use:'tv' },
  piano:{ name:'피아노', price:300, w:2, d:1, use:'piano' },
  fridge:{ name:'냉장고', price:140, w:1, d:1 },
  kitchen:{ name:'싱크대', price:160, w:2, d:1 },
  aquarium:{ name:'어항', price:200, w:1, d:1 },
  teddy:{ name:'큰 곰인형', price:120, w:1, d:1 },
  globe:{ name:'지구본', price:70, w:1, d:1 },
  xmas:{ name:'크리스마스 트리', price:220, w:1, d:1 },
  jack:{ name:'호박 랜턴', price:50, w:1, d:1 },
  rug_round:{ name:'동그란 러그', price:60, w:2, d:2, rug:true },
  rug_check:{ name:'체크 러그', price:60, w:2, d:2, rug:true },
  frame:{ name:'꽃 액자', price:40, w:1, d:1, wall:true },
  clock:{ name:'벽시계', price:60, w:1, d:1, wall:true },
  window:{ name:'동그란 창문', price:80, w:1, d:1, wall:true },
  garland:{ name:'가랜드', price:35, w:2, d:1, wall:true },
};
const WALLS = { wall_cream:{ name:'크림 벽지', price:0, c:'#fff3e2', p:'plain' }, wall_pink:{ name:'딸기우유 벽지', price:60, c:'#ffe0e8', p:'plain' }, wall_mint:{ name:'민트 벽지', price:60, c:'#dff5ea', p:'plain' }, wall_lav:{ name:'라벤더 벽지', price:60, c:'#ebe2fa', p:'plain' }, wall_dots:{ name:'땡땡이 벽지', price:90, c:'#fff0f4', c2:'#ffc6d6', p:'dots' }, wall_stripe:{ name:'줄무늬 벽지', price:90, c:'#e6f4fb', c2:'#c8e6f6', p:'stripe' }, wall_wood:{ name:'통나무 벽', price:120, c:'#f2dcc2', c2:'#e6c8a8', p:'plank' } };
const FLOORS = { floor_wood:{ name:'원목 마루', price:0, c:'#f0d6b8', c2:'#e6c8a6', p:'plank' }, floor_check:{ name:'체크 타일', price:80, c:'#fff6ee', c2:'#f2d8e6', p:'check' }, floor_pink:{ name:'분홍 카펫', price:90, c:'#ffdde6', p:'plain' }, floor_mint:{ name:'민트 카펫', price:90, c:'#d8f2e4', p:'plain' }, floor_stone:{ name:'돌바닥', price:110, c:'#ece6f0', c2:'#ddd4e6', p:'check' } };

/* ---------- interiors (v5: rooms of any size — homes, villagers' homes, shops) ---------- */
let IW = 8, ID = 6; const IX = 300, IZ = 0;
const iwx = x => IX + x - (IW-1)/2, iwz = z => IZ + z - (ID-1)/2;
const doorCols = () => [IW/2-1, IW/2];
let room = null;
function homeOf(p){
  if (!p.home) p.home = { wall:'wall_cream', floor:'floor_wood', items:[{ id:'bed', x:0, z:0, r:0 }, { id:'wardrobe', x:6, z:0, r:0 }, { id:'mirror', x:7, z:0, r:0 }, { id:'rug_round', x:3, z:2, r:0 }] };
  if (!p.furn) p.furn = { bed:1, wardrobe:1, mirror:1, rug_round:1 };
  return p.home;
}
function patTex(def, w, h){
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = def.c; g.fillRect(0,0,256,256);
  if (def.p === 'dots'){ g.fillStyle = def.c2; for (let y=16;y<256;y+=42) for (let x=(y/42%2)*21+12;x<256;x+=42){ g.beginPath(); g.arc(x,y,6,0,6.3); g.fill(); } }
  if (def.p === 'stripe'){ g.fillStyle = def.c2; for (let x=0;x<256;x+=48) g.fillRect(x,0,20,256); }
  if (def.p === 'plank'){ g.strokeStyle = def.c2; g.lineWidth = 4; for (let y=0;y<256;y+=42){ g.beginPath(); g.moveTo(0,y); g.lineTo(256,y); g.stroke(); for (let x=(y/42%2)*64;x<256;x+=128){ g.beginPath(); g.moveTo(x,y); g.lineTo(x,y+42); g.stroke(); } } }
  if (def.p === 'check'){ g.fillStyle = def.c2; for (let y=0;y<256;y+=64) for (let x=(y/64%2)*64;x<256;x+=128) g.fillRect(x,y,64,64); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w, h); t.anisotropy = 4; return t;
}
function furnMesh(id){
  const g = new THREE.Group(), F = FURN[id];
  switch (id){
    case 'bed': M(new THREE.BoxGeometry(0.9,0.3,1.8), '#f2dcc2', 0, 0.2, 0.5, g); M(new THREE.BoxGeometry(0.86,0.14,1.4), '#ffffff', 0, 0.42, 0.68, g); M(new THREE.BoxGeometry(0.88,0.16,1.0), '#ffc6d6', 0, 0.44, 0.85, g); M(new THREE.CapsuleGeometry(0.12,0.4,4,10), '#ffffff', 0, 0.5, -0.15, g).rotation.z = Math.PI/2; M(new THREE.BoxGeometry(0.95,0.8,0.12), '#e6c8a6', 0, 0.45, -0.38, g); break;
    case 'wardrobe': M(new THREE.BoxGeometry(0.9,1.7,0.6), '#f6e2cc', 0, 0.85, -0.1, g); M(new THREE.BoxGeometry(0.02,1.5,0.02), '#d8bca0', 0, 0.85, 0.21, g); [-0.08,0.08].forEach(x => M(new THREE.SphereGeometry(0.035,8,6), '#e8c86a', x, 0.9, 0.22, g)); break;
    case 'mirror': M(new THREE.CylinderGeometry(0.06,0.08,0.1,12), '#d8bca0', 0, 0.05, 0, g); M(new THREE.CapsuleGeometry(0.28,0.8,6,16), '#f6e2cc', 0, 0.95, -0.1, g).scale.set(1,1,0.15); M(new THREE.CapsuleGeometry(0.22,0.72,6,16), new THREE.MeshToonMaterial({ color:'#d8f0fa', gradientMap:GRAD, emissive:'#203040' }), 0, 0.95, -0.07, g).scale.set(1,1,0.1); break;
    case 'sofa': M(new THREE.BoxGeometry(1.8,0.35,0.8), '#cdbcf2', 0.5, 0.25, 0, g); M(new THREE.BoxGeometry(1.8,0.55,0.22), '#cdbcf2', 0.5, 0.55, -0.3, g); [-0.35,1.35].forEach(x => M(new THREE.CapsuleGeometry(0.14,0.5,4,10), '#bfaeea', x, 0.42, 0, g).rotation.x = Math.PI/2); M(new THREE.SphereGeometry(0.16,12,10), '#ffe6a3', 0.1, 0.55, -0.12, g).scale.set(1,1,0.5); break;
    case 'chair': M(new THREE.BoxGeometry(0.5,0.08,0.5), '#e6c8a6', 0, 0.42, 0, g); M(new THREE.BoxGeometry(0.5,0.5,0.07), '#e6c8a6', 0, 0.7, -0.22, g); [[-0.2,-0.2],[0.2,-0.2],[-0.2,0.2],[0.2,0.2]].forEach(([x,z]) => M(new THREE.CylinderGeometry(0.03,0.03,0.42,8), '#d8bca0', x, 0.21, z, g)); break;
    case 'table': M(new THREE.CylinderGeometry(0.42,0.42,0.06,24), '#f6e2cc', 0, 0.6, 0, g); M(new THREE.CylinderGeometry(0.06,0.1,0.6,10), '#d8bca0', 0, 0.3, 0, g); M(new THREE.CylinderGeometry(0.06,0.05,0.12,10), '#ffffff', 0.12, 0.69, 0.05, g); break;
    case 'desk': M(new THREE.BoxGeometry(1.8,0.07,0.6), '#f6e2cc', 0.5, 0.7, 0, g); [[-0.3],[1.3]].forEach(([x]) => M(new THREE.BoxGeometry(0.08,0.7,0.55), '#e6c8a6', x, 0.35, 0, g)); M(new THREE.BoxGeometry(0.4,0.3,0.05), '#cfe8f6', 0.5, 0.92, -0.15, g); M(new THREE.CylinderGeometry(0.05,0.05,0.12,8), '#ffb7c9', 1.0, 0.8, 0.05, g); break;
    case 'bookshelf': M(new THREE.BoxGeometry(0.85,1.6,0.4), '#e6c8a6', 0, 0.8, -0.2, g); for (let r=0;r<3;r++) for (let k=0;k<5;k++) M(new THREE.BoxGeometry(0.11,0.32,0.28), ['#ffb7c9','#cdbcf2','#8fd8b8','#ffe6a3','#a8d8f0'][(k+r)%5], -0.28+k*0.14, 0.32+r*0.48, -0.18, g); break;
    case 'lamp': M(new THREE.CylinderGeometry(0.15,0.18,0.05,16), '#d8bca0', 0, 0.03, 0, g); M(new THREE.CylinderGeometry(0.025,0.025,1.1,8), '#d8bca0', 0, 0.58, 0, g); M(new THREE.CylinderGeometry(0.16,0.26,0.28,18,1,true), new THREE.MeshToonMaterial({ color:'#fff3c0', emissive:'#6a5a30', gradientMap:GRAD, side:THREE.DoubleSide }), 0, 1.2, 0, g); break;
    case 'plant': M(new THREE.CylinderGeometry(0.2,0.15,0.35,16), '#ffd8c8', 0, 0.18, 0, g); for (let k=0;k<6;k++){ const l = M(new THREE.SphereGeometry(0.16,10,8), '#8fd8a0', Math.cos(k)*0.15, 0.55+k*0.06, Math.sin(k)*0.15, g); l.scale.set(1,0.35,0.7); l.rotation.y = k; } break;
    case 'cactus': M(new THREE.CylinderGeometry(0.15,0.12,0.2,14), '#ffd8c8', 0, 0.1, 0, g); M(new THREE.CapsuleGeometry(0.1,0.3,4,10), '#9fd8a8', 0, 0.45, 0, g); M(new THREE.CapsuleGeometry(0.05,0.12,4,8), '#9fd8a8', 0.13, 0.48, 0, g).rotation.z = -0.8; M(new THREE.SphereGeometry(0.04,8,6), '#ffb7c9', 0, 0.68, 0, g); break;
    case 'tv': M(new THREE.BoxGeometry(0.8,0.4,0.4), '#e6c8a6', 0, 0.2, -0.1, g); M(new THREE.BoxGeometry(0.85,0.55,0.08), '#6a5a7a', 0, 0.7, -0.1, g); M(new THREE.BoxGeometry(0.75,0.45,0.02), new THREE.MeshToonMaterial({ color:'#a8d8f0', emissive:'#2a4050', gradientMap:GRAD }), 0, 0.7, -0.05, g); break;
    case 'piano': M(new THREE.BoxGeometry(1.7,1.0,0.5), '#fff4f8', 0.5, 0.55, -0.15, g); M(new THREE.BoxGeometry(1.6,0.06,0.25), '#ffffff', 0.5, 0.75, 0.2, g); for (let k=0;k<10;k++) M(new THREE.BoxGeometry(0.05,0.03,0.14), '#5b4b78', -0.2+k*0.16, 0.79, 0.14, g); M(new THREE.BoxGeometry(0.7,0.4,0.35), '#ffd6e2', 0.5, 0.2, 0.55, g); break;
    case 'fridge': M(new THREE.BoxGeometry(0.75,1.7,0.65), '#e8f4fb', 0, 0.85, -0.05, g); M(new THREE.BoxGeometry(0.76,0.02,0.66), '#c8dce8', 0, 1.2, -0.05, g); M(new THREE.BoxGeometry(0.04,0.3,0.04), '#c8c0d8', 0.28, 1.45, 0.29, g); M(new THREE.BoxGeometry(0.04,0.4,0.04), '#c8c0d8', 0.28, 0.85, 0.29, g); break;
    case 'kitchen': M(new THREE.BoxGeometry(1.8,0.85,0.6), '#e2f4ea', 0.5, 0.43, -0.05, g); M(new THREE.BoxGeometry(1.84,0.06,0.64), '#ffffff', 0.5, 0.88, -0.05, g); M(new THREE.BoxGeometry(0.5,0.04,0.35), '#c8dce8', 0.2, 0.91, -0.05, g); M(new THREE.CylinderGeometry(0.12,0.12,0.03,16), '#6a5a7a', 1.0, 0.92, -0.05, g); break;
    case 'aquarium': M(new THREE.BoxGeometry(0.8,0.5,0.4), '#e6c8a6', 0, 0.25, -0.05, g); M(new THREE.BoxGeometry(0.75,0.5,0.38), new THREE.MeshToonMaterial({ color:'#a8e0f4', gradientMap:GRAD, transparent:true, opacity:0.6 }), 0, 0.75, -0.05, g); M(new THREE.SphereGeometry(0.06,10,8), '#ffa86a', -0.1, 0.78, -0.05, g).scale.set(1.5,1,0.6); M(new THREE.SphereGeometry(0.05,10,8), '#ffe6a3', 0.15, 0.68, -0.05, g).scale.set(1.5,1,0.6); break;
    case 'teddy': M(new THREE.SphereGeometry(0.3,16,12), '#e8c0a0', 0, 0.3, 0, g); M(new THREE.SphereGeometry(0.24,16,12), '#e8c0a0', 0, 0.7, 0, g); [-1,1].forEach(s => M(new THREE.SphereGeometry(0.08,10,8), '#e8c0a0', 0.17*s, 0.9, 0, g)); M(new THREE.SphereGeometry(0.08,10,8), '#fff0e0', 0, 0.66, 0.2, g); M(new THREE.SphereGeometry(0.1,10,8), '#ffb7c9', 0, 0.48, 0.18, g).scale.set(1.8,0.6,0.6); break;
    case 'globe': M(new THREE.CylinderGeometry(0.15,0.2,0.08,14), '#d8bca0', 0, 0.04, 0, g); M(new THREE.CylinderGeometry(0.02,0.02,0.4,8), '#d8bca0', 0, 0.25, 0, g); M(new THREE.SphereGeometry(0.26,18,14), '#a8d8f0', 0, 0.62, 0, g); M(new THREE.SphereGeometry(0.265,10,8,0,1.6,0.8,1.1), '#9fdcb4', 0, 0.62, 0, g); break;
    case 'xmas': M(new THREE.CylinderGeometry(0.08,0.1,0.2,8), '#c8a088', 0, 0.1, 0, g); [0.42,0.33,0.24].forEach((r,k) => M(new THREE.ConeGeometry(r,0.5,14), '#9fd8a8', 0, 0.45+k*0.32, 0, g)); M(new THREE.OctahedronGeometry(0.09), matBulb, 0, 1.4, 0, g); ['#ffb7c9','#ffe6a3','#a8d8f0','#ffc8b4'].forEach((c,k) => M(new THREE.SphereGeometry(0.045,8,6), c, Math.cos(k*1.7)*0.28, 0.55+k*0.15, Math.sin(k*1.7)*0.28, g)); break;
    case 'jack': M(new THREE.SphereGeometry(0.28,16,12), '#ffbf8a', 0, 0.22, 0, g).scale.set(1.15,0.85,1.15); M(new THREE.CylinderGeometry(0.03,0.04,0.14,8), '#9fd49a', 0, 0.47, 0, g); [[-0.1,0.28],[0.1,0.28]].forEach(([x,y]) => M(new THREE.ConeGeometry(0.05,0.08,3), matBulb, x, y, 0.29, g).rotation.x = Math.PI/2); break;
    case 'rug_round': { const m = M(new THREE.CylinderGeometry(0.95,0.95,0.02,32), '#ffb8cc', 0.5, 0.01, 0.5, g); m.castShadow = false; M(new THREE.TorusGeometry(0.8,0.03,6,32), '#ffffff', 0.5, 0.025, 0.5, g).rotation.x = Math.PI/2; } break;
    case 'rug_check': { const t = patTex({ c:'#fff3e2', c2:'#cfe8f6', p:'check' }, 2, 2); const m = new THREE.Mesh(new THREE.BoxGeometry(1.9,0.02,1.9), new THREE.MeshToonMaterial({ map:t, gradientMap:GRAD })); m.position.set(0.5,0.01,0.5); m.receiveShadow = true; g.add(m); } break;
    case 'frame': M(new THREE.BoxGeometry(0.6,0.5,0.05), '#f6e2cc', 0, 0, 0, g); M(new THREE.BoxGeometry(0.48,0.38,0.02), '#e2f4ea', 0, 0, 0.03, g); [['#ffb7c9',-0.08],['#ffe6a3',0.08],['#cdbcf2',0]].forEach(([c,x],k) => M(new THREE.SphereGeometry(0.05,8,6), c, x, 0.02-k*0.05, 0.05, g)); break;
    case 'clock': M(new THREE.CylinderGeometry(0.28,0.28,0.05,24), '#ffffff', 0, 0, 0, g).rotation.x = Math.PI/2; M(new THREE.TorusGeometry(0.28,0.03,8,24), '#cdbcf2', 0, 0, 0.01, g); M(new THREE.BoxGeometry(0.03,0.18,0.02), '#5b4b78', 0, 0.06, 0.04, g); M(new THREE.BoxGeometry(0.13,0.03,0.02), '#5b4b78', 0.05, 0, 0.04, g); break;
    case 'window': M(new THREE.CylinderGeometry(0.38,0.38,0.05,24), '#ffffff', 0, 0, 0, g).rotation.x = Math.PI/2; M(new THREE.CylinderGeometry(0.32,0.32,0.03,24), matWin, 0, 0, 0.02, g).rotation.x = Math.PI/2; M(new THREE.BoxGeometry(0.64,0.03,0.03), '#ffffff', 0, 0, 0.04, g); M(new THREE.BoxGeometry(0.03,0.64,0.03), '#ffffff', 0, 0, 0.04, g); break;
    case 'garland': for (let k=0;k<7;k++){ const f = M(new THREE.ConeGeometry(0.08,0.16,3), ['#ffb7c9','#ffe6a3','#a8d8f0','#cdbcf2','#8fd8b8'][k%5], -0.0+k*0.17, -0.06-Math.sin(k/6*Math.PI)*0.1, 0, g); f.rotation.z = Math.PI; } break;
    default: extraMesh(id, g);
  }
  return g;
}

function cellsOf(it){ const F = FURN[it.id], rot = (it.r||0) % 2 === 1; const w = rot ? F.d : F.w, d = rot ? F.w : F.d; const out = []; for (let a=0;a<w;a++) for (let b=0;b<d;b++) out.push([it.x+a, it.z+b]); return out; }
function buildRoom(H){
  if (room) scene.remove(room); room = new THREE.Group(); scene.add(room);
  const wd = WALLS[H.wall] || WALLS.wall_cream, fd = FLOORS[H.floor] || FLOORS.floor_wood;
  const floor = new THREE.Mesh(new THREE.BoxGeometry(IW, 0.2, ID), new THREE.MeshToonMaterial({ map:patTex(fd, IW/2, ID/2), gradientMap:GRAD })); floor.position.set(IX, -0.1, IZ); floor.receiveShadow = true; floor.userData.floor = true; room.add(floor);
  const wm = new THREE.MeshToonMaterial({ map:patTex(wd, IW/2, 1.2), gradientMap:GRAD });
  const back = new THREE.Mesh(new THREE.BoxGeometry(IW+0.3, 2.6, 0.15), wm); back.position.set(IX, 1.3, IZ - ID/2 - 0.07); back.receiveShadow = true; room.add(back);
  const wm2 = new THREE.MeshToonMaterial({ map:patTex(wd, ID/2, 1.2), gradientMap:GRAD });
  [-1,1].forEach(s => { const w = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.6, ID), wm2); w.position.set(IX + s*(IW/2+0.07), 1.3, IZ); w.receiveShadow = true; w.userData.wallSide = s; room.add(w); });
  M(new THREE.BoxGeometry(IW+0.3, 0.12, 0.2), '#ffffff', IX, 0.06, IZ - ID/2 + 0.02, room);
  const mat = M(new THREE.BoxGeometry(1.4, 0.03, 0.6), '#ffc8b4', IX, 0.015, IZ + ID/2 - 0.2, room); mat.castShadow = false;
  const lt = new THREE.PointLight('#ffe6c8', 0.22, Math.max(14, IW*1.6)); lt.position.set(IX, 3.2, IZ + 1); room.add(lt);
  if (H.title){ const s = signMesh(H.title, 2.4, 0.5, '#ffffff', H.titleC || '#e86a92'); s.position.set(IX, 2.25, IZ - ID/2 + 0.02); room.add(s); }
  H.items.forEach((it, n) => { const F = FURN[it.id]; if (!F) return; const g = F.fixture ? fixMesh(it) : furnMesh(it.id);
    if (F.wall){ g.position.set(iwx(it.x) + (F.w>1?0.5:0) - (it.id==='garland'?0.5:0), 1.5, IZ - ID/2 + 0.05); }
    else { g.position.set(iwx(it.x), 0, iwz(it.z)); g.rotation.y = -(it.r||0) * Math.PI/2; if ((it.r||0) % 4){ const c = cellsOf(it); const mx = Math.min(...c.map(q=>q[0])), mz = Math.min(...c.map(q=>q[1])); const r = (it.r||0)%4; const off = { 1:[0,(F.w-1)], 2:[(F.w-1),(F.d-1)], 3:[(F.d-1),0] }[r] || [0,0]; g.position.set(iwx(mx+off[0]), 0, iwz(mz+off[1])); } }
    if (it.tag){ const tg = signMesh(it.tag, 0.9, 0.24, '#fffaf4', '#7a6aa0'); tg.position.set((cellsOf(it).length>1 && !F.wall ? (Math.max(...cellsOf(it).map(q=>q[0]))-it.x)/2 : 0), 0.06, 0.48 + ((F.d||1)-1)); tg.rotation.x = -Math.PI/2.6; g.add(tg); }
    g.traverse(o => { o.userData.furn = n; }); room.add(g); });
  room.userData.home = H;
  if (G.inside && G.inside.clerkNp){ const c = G.inside.clerkNp; c.g.position.set(c.x, 0, c.z); room.add(c.g); }
}
function inBlocked(x, z){ // tile coords
  if (x < 0 || z < 0 || x >= IW || z >= ID) return true;
  const H = G.inside && G.inside.home; if (!H) return false;
  if (G.inside.clerkCell && G.inside.clerkCell[0]===x && G.inside.clerkCell[1]===z) return true;
  return H.items.some(it => FURN[it.id] && !FURN[it.id].rug && !FURN[it.id].wall && cellsOf(it).some(([a,b]) => a===x && b===z));
}
function canStandIn(wxp, wzp){
  const rr = 0.24, dc = doorCols();
  for (const [ox,oz] of [[-rr,-rr],[rr,-rr],[-rr,rr],[rr,rr]]){
    const x = Math.round(wxp + ox - IX + (IW-1)/2), z = Math.round(wzp + oz - IZ + (ID-1)/2);
    if (z >= ID && (x === dc[0] || x === dc[1])) continue; // doorway
    if (inBlocked(x, z)) return false;
  }
  return true;
}
function enterRoom(o){
  closePanel(); stopFishing(); if (dlg) endDialog();
  const me = chars[G.slot];
  G.inside = Object.assign({ editSel:null, back:[me.i, me.j] }, o); if (!o.keepYaw) G.inYaw = 0;
  IW = o.w || 8; ID = o.d || 6;
  buildRoom(o.home);
  me.x = IX - 0.5; me.z = IZ + ID/2 - 0.7; me.path = []; me.face = Math.PI; me.g.position.set(me.x, 0, me.z);
  camTarget.set(IX, 0, IZ);
  lastTimeKey = ''; applyTime(true);
  updateHud(); resize();
}
function enterHouse(slot){
  const owner = slot === G.slot ? G.me : Store.data.players[pid(slot)];
  if (!owner){ toast('아직 아무도 살지 않는 집이에요'); return; }
  const own = slot === G.slot, home = homeOf(own ? G.me : JSON.parse(JSON.stringify(owner)));
  enterRoom({ kind:'home', slot, own, canEdit:own, home, b:BUILD.find(x => x.kind==='house' && x.slot===slot), w:8, d:6 });
  toast(own ? '우리 집이에요. 오른쪽 위 "방 꾸미기"로 가구를 놓아요' : playerName(slot)+'네 집에 놀러 왔어요', 2600);
}
function exitHouse(){
  if (!G.inside) return; const me = chars[G.slot], b = G.inside.b;
  const [i,j] = T(b.door[0], b.door[1]); G.inside = null; G.decorate = null;
  if (room){ scene.remove(room); room = null; }
  charAt(me, i, j); me.face = 0; G.me.i = i; G.me.j = j; saveMe(); closePanel(); applyTime(true); updateHud(); resize();
  camTarget.set(me.x, 0, me.z);
  if (typeof kiniArrive === 'function') kiniArrive();
}
function furnAtFront(){
  const me = chars[G.slot]; const fx = Math.round(me.x + Math.sin(me.face)*0.8 - IX + (IW-1)/2), fz = Math.round(me.z + Math.cos(me.face)*0.8 - IZ + (ID-1)/2);
  const H = G.inside.home; const n = H.items.findIndex(it => FURN[it.id] && !FURN[it.id].wall && !FURN[it.id].rug && cellsOf(it).some(([a,b]) => a===fx && b===fz));
  const dc = doorCols(), atDoor = fz >= ID - 1 && (fx === dc[0] || fx === dc[1]) && me.z > IZ + ID/2 - 1.2;
  return { n, fx, fz, atDoor };
}
function useFurniture(n){
  const it = G.inside.home.items[n]; if (!it) return; const F = FURN[it.id];
  if (it.show) return showAct(it);
  if (F.use === 'play' || F.use === 'piano') return playInstrument(it.id);
  if (!G.inside.own){ toast(F.name+'이(가) 있어요'); return; }
  if (F.use === 'rest') return restAtHome();
  if (F.use === 'ward') return openWardrobe();
  if (F.use === 'mirror') return openMirror();
  if (F.use === 'tv'){ toast(['오늘의 날씨: 마을은 맑음!','요리 방송에서 사과 파이를 만들고 있어요','동물 다큐멘터리: 여우는 꼬리로 균형을 잡아요','토니의 마을 퀴즈: 귤나무는 어느 섬에 있을까요?','뉴스: 꽃섬 튤립밭이 활짝 피었대요'][Math.floor(Math.random()*5)]); return; }
  toast(F.name);
}
function restAtHome(){
  regenStamina(); const me = G.me, wait = (me.restAt||0) + ECON.restCooldown - Date.now();
  if (wait > 0){ toast('아직 졸리지 않아요 · '+Math.ceil(wait/60000)+'분 뒤에 쉴 수 있어요'); return; }
  me.stamina = Math.min(ECON.stamMax, me.stamina + ECON.restGain); me.restAt = Date.now(); me.stAt = Date.now(); saveMe(); updateHud(); pop('푹 잤어요', '체력 +'+ECON.restGain);
}
// decorating works for your own home (your furniture) and villagers' homes (free villager catalog)
const isVillagerRoom = () => G.inside && G.inside.kind === 'nhome';
const decorCount = id => isVillagerRoom() ? 99 : (G.me.furn[id]||0) - (typeof otherFloorsCount === 'function' ? otherFloorsCount(id) : 0);
function saveRoom(){ if (!G.inside) return; if (isVillagerRoom()) saveVillagerHome(G.inside.npc, G.inside.home); else saveMe(); }
function openDecorate(tab){
  if (!G.inside || !G.inside.canEdit) return;
  G.decorate = G.decorate || { sel:null, tab:'furn' }; if (tab) G.decorate.tab = tab;
  G.panel = 'decor'; const H = G.inside.home, D = G.decorate, vill = isVillagerRoom();
  const placed = {}; H.items.forEach(it => placed[it.id] = (placed[it.id]||0)+1);
  let body = (vill ? missionCard(G.inside.npc) : '') + '<div class="tabs"><button data-dt="furn" class="'+(D.tab==='furn'?'on':'')+'">가구</button><button data-dt="wall" class="'+(D.tab==='wall'?'on':'')+'">벽지</button><button data-dt="floor" class="'+(D.tab==='floor'?'on':'')+'">바닥</button></div>';
  if (D.tab === 'furn'){
    const own = vill ? Object.keys(FURN).filter(id => !FURN[id].fixture) : Object.keys(G.me.furn||{}).filter(id => FURN[id]);
    body += D.edit !== undefined && H.items[D.edit] ? '<div class="buybar"><span>'+esc(FURN[H.items[D.edit].id].name)+' 선택됨</span><span style="display:flex;gap:6px"><button id="rotB">돌리기</button><button class="bad" id="delB">넣기</button></span></div>' :
      '<p class="note">'+(vill ? '주민 가구 상자에서 마음껏 꺼내 쓸 수 있어요. ' : '')+'가구를 고르고 바닥을 탭하면 놓여요. 놓인 가구를 탭하면 돌리거나 다시 넣을 수 있어요. 벽 장식은 뒷벽에 걸려요.</p>';
    body += '<div class="grid">'+own.map(id => { const left = decorCount(id) - (placed[id]||0); return '<div class="cell'+(D.sel===id?' sel':'')+(left<=0?' no':'')+'" data-f="'+id+'">'+esc(FURN[id].name)+'<b>'+(vill ? (placed[id]?placed[id]+'개 놓음':'꺼내기') : left>0?'남은 '+left+'개':'모두 놓음')+'</b></div>'; }).join('')+'</div>';
    if (!own.length) body += '<p class="note">가진 가구가 없어요. 잡화점에서 사 오세요.</p>';
  } else {
    const DEF = D.tab==='wall' ? WALLS : FLOORS, cur = D.tab==='wall' ? H.wall : H.floor, ownSet = G.me.decos || {};
    body += '<div class="grid">'+Object.entries(DEF).filter(([id,d]) => vill || d.price===0 || ownSet[id]).map(([id,d]) => '<div class="cell'+(cur===id?' on':'')+'" data-w="'+id+'"><div class="sw" style="background:'+d.c+';box-shadow:inset 0 0 0 4px '+(d.c2||d.c)+'"></div>'+esc(d.name)+'</div>').join('')+'</div>'+(vill?'':'<p class="note">잡화점에서 벽지와 바닥재를 더 살 수 있어요.</p>');
  }
  openPanel(vill ? NPC_BY[G.inside.npc].name+'네 집 꾸미기' : '방 꾸미기', body, { half:true, closeLabel:'다 했어요' }); G.panel = 'decor';
  $('#pbody').querySelectorAll('[data-dt]').forEach(b => b.addEventListener('click', () => { D.edit = undefined; openDecorate(b.dataset.dt); }));
  $('#pbody').querySelectorAll('[data-f]').forEach(c => c.addEventListener('click', () => { D.sel = D.sel===c.dataset.f ? null : c.dataset.f; D.edit = undefined; openDecorate(); if (D.sel) toast('바닥을 탭해서 놓아요', 1300); }));
  $('#pbody').querySelectorAll('[data-w]').forEach(c => c.addEventListener('click', () => { if (D.tab==='wall') H.wall = c.dataset.w; else H.floor = c.dataset.w; buildRoom(H); saveRoom(); openDecorate(); }));
  const rb = $('#rotB'); if (rb) rb.addEventListener('click', () => { const it = H.items[D.edit]; const old = it.r||0; it.r = (old+1)%4; if (!fits(it, D.edit)){ it.r = old; toast('여기선 돌릴 수 없어요'); return; } buildRoom(H); saveRoom(); });
  const db = $('#delB'); if (db) db.addEventListener('click', () => { H.items.splice(D.edit, 1); D.edit = undefined; buildRoom(H); saveRoom(); openDecorate(); });
}
function fits(it, skip){
  const F = FURN[it.id], H = G.inside.home;
  if (F.wall){ if (it.z !== 0) return false; return !H.items.some((o,k) => k!==skip && FURN[o.id] && FURN[o.id].wall && cellsOf(o).some(([a]) => cellsOf(it).some(([b]) => a===b))) && cellsOf(it).every(([x]) => x>=0 && x<IW); }
  const cells = cellsOf(it); if (cells.some(([x,z]) => x<0||z<0||x>=IW||z>=ID)) return false;
  const dc = doorCols(); if (!F.rug && cells.some(([x,z]) => z===ID-1 && (x===dc[0]||x===dc[1]))) return false;
  return !H.items.some((o,k) => { if (k===skip || !FURN[o.id] || FURN[o.id].wall) return false; if (!!FURN[o.id].rug !== !!F.rug) return false; return cellsOf(o).some(([a,b]) => cells.some(([x,z]) => a===x && b===z)); });
}
function decorTap(x, z, furnIdx){
  const D = G.decorate, H = G.inside.home;
  if (furnIdx !== undefined && furnIdx !== null && !D.sel){ D.edit = furnIdx; openDecorate(); return; }
  if (!D.sel){ toast('먼저 놓을 가구를 골라요'); return; }
  const placed = H.items.filter(it => it.id===D.sel).length; if (decorCount(D.sel) <= placed){ toast('그 가구는 모두 놓았어요'); return; }
  const it = { id:D.sel, x, z:FURN[D.sel].wall ? 0 : z, r:0 };
  if (!fits(it)){ toast(FURN[D.sel].wall ? '벽 장식은 뒷벽에만 걸 수 있어요' : '여기엔 놓을 수 없어요'); return; }
  const me = chars[G.slot], px = Math.round(me.x - IX + (IW-1)/2), pz = Math.round(me.z - IZ + (ID-1)/2);
  if (!FURN[D.sel].wall && !FURN[D.sel].rug && cellsOf(it).some(([a,b]) => a===px && b===pz)){ toast('내가 서 있는 자리예요. 조금 비켜서 놓아요'); return; }
  H.items.push(it); buildRoom(H); saveRoom(); openDecorate();
}

/* ---------- general store & bank ---------- */
let shopTab = 'furn';
const BANK = { save:0.02, loan:0.03, loanMax:500, loanDays:7 };
function processBank(){
  const me = G.me; if (!me) return; me.bank = me.bank || { save:0, loan:0, tick:Date.now(), loanSince:null, repo:'' };
  const b = me.bank, days = Math.floor((Date.now() - (b.tick||Date.now())) / DAY);
  if (days > 0){
    const s0 = b.save, l0 = b.loan;
    b.save = Math.floor(b.save * Math.pow(1+BANK.save, days)); b.loan = Math.ceil(b.loan * Math.pow(1+BANK.loan, days)); b.tick += days*DAY;
    if (b.save > s0) pop('예금 이자', '통장에 이자가 붙었어요. 도토리 +'+(b.save-s0));
    if (b.loan > l0) pop('대출 이자', '대출 이자가 붙었어요. 갚을 돈 +'+(b.loan-l0), true);
  }
  if (b.loan > 0 && b.loanSince && Date.now() - b.loanSince > BANK.loanDays*DAY && b.repo !== today()){
    b.repo = today(); let need = b.loan; const fromSave = Math.min(b.save, need); b.save -= fromSave; need -= fromSave;
    const fromWallet = Math.min(Math.max(me.acorns,0), need); me.acorns -= fromWallet; need -= fromWallet;
    b.loan = need; let msg = '대출을 '+BANK.loanDays+'일 넘게 못 갚아서 은행이 통장과 지갑에서 '+(fromSave+fromWallet)+'개를 가져갔어요.';
    if (need > 0 && repossess(need)) msg += '<br>그래도 모자라서 물건을 압류했어요.';
    if (b.loan <= 0){ b.loan = 0; b.loanSince = null; }
    pop('은행 연체', msg, true);
  }
  saveMe();
}
function repossess(amount){
  const me = G.me; const owned = Object.keys(me.owned||{}).filter(id => ITEM[id] && ITEM[id].price > 0).sort((a,b) => ITEM[b].price - ITEM[a].price);
  if (!owned.length) return false; const id = owned[0], it = ITEM[id]; delete me.owned[id];
  Object.keys(me.wear).forEach(k => { if (me.wear[k] === id) delete me.wear[k]; }); if (me.ride === id) me.ride = null;
  if (!me.wear.top && !me.wear.set) me.wear.top = 'tee_w'; if (!me.wear.bottom && !me.wear.set) me.wear.bottom = 'jeans';
  const back = Math.round(it.price*0.5); if (me.bank) me.bank.loan = Math.max(0, me.bank.loan - back);
  pop('압류', '<b>'+esc(it.name)+'</b>을(를) 가져갔어요.', true); applyLook(chars[G.slot], me); return true;
}
function openBank(){
  processBank(); G.panel = 'bank'; const me = G.me, b = me.bank;
  const btns = (k, list) => '<div class="seg">'+list.map(v => '<button data-bk="'+k+':'+v+'">'+(v==='all'?'전부':v)+'</button>').join('')+'</div>';
  openPanel('은행 · 코코의 창구',
    '<div class="card"><div class="k"><span>지갑</span><b>도토리 '+me.acorns+'</b></div><div class="k"><span>통장</span><b>도토리 '+b.save+'</b></div><div class="k"><span>대출</span><b style="color:'+(b.loan?'var(--warn)':'inherit')+'">도토리 '+b.loan+'</b></div><span class="note">통장에 넣어 두면 하루에 '+Math.round(BANK.save*100)+'%씩 이자가 붙어요. 대출은 하루 '+Math.round(BANK.loan*100)+'% 이자, '+BANK.loanDays+'일 안에 갚지 않으면 통장·지갑에서 가져가고 모자라면 물건을 압류해요.</span></div>'+
    '<h3>예금하기</h3>'+btns('dep',[10,50,100,'all'])+'<h3>찾기</h3>'+btns('wd',[10,50,100,'all'])+
    '<h3>대출 (최대 '+BANK.loanMax+')</h3>'+btns('loan',[50,100,200])+'<h3>대출 갚기</h3>'+btns('pay',[50,100,'all']), { half:true });
  $('#pbody').querySelectorAll('[data-bk]').forEach(btn => btn.addEventListener('click', () => {
    const [k,v] = btn.dataset.bk.split(':');
    if (k==='dep'){ const n = v==='all' ? Math.max(0,me.acorns) : Math.min(Number(v), Math.max(0,me.acorns)); if (n<=0){ toast('넣을 도토리가 없어요'); return; } me.acorns -= n; b.save += n; toast('통장에 '+n+'개 넣었어요', 1200); }
    if (k==='wd'){ const n = v==='all' ? b.save : Math.min(Number(v), b.save); if (n<=0){ toast('통장이 비었어요'); return; } b.save -= n; me.acorns += n; if (me.acorns>=0){ me.debtSince=null; me.debtTick=null; } toast(n+'개 찾았어요', 1200); }
    if (k==='loan'){ const n = Math.min(Number(v), BANK.loanMax - b.loan); if (n<=0){ toast('대출 한도를 다 썼어요'); return; } b.loan += n; me.acorns += n; if (!b.loanSince) b.loanSince = Date.now(); if (me.acorns>=0){ me.debtSince=null; me.debtTick=null; } toast(n+'개를 빌렸어요. '+BANK.loanDays+'일 안에 갚아요', 1600); }
    if (k==='pay'){ const n = Math.min(v==='all' ? b.loan : Number(v), b.loan, Math.max(0,me.acorns)); if (n<=0){ toast(b.loan?'갚을 도토리가 없어요':'갚을 대출이 없어요'); return; } b.loan -= n; me.acorns -= n; if (!b.loan) b.loanSince = null; toast(n+'개 갚았어요', 1200); }
    saveMe(); updateHud(); openBank();
  }));
}

/* ---------- animal-folk NPCs ---------- */
const NPCS = [
  { id:'momo', name:'모모', kind:'토끼', job:'잡화점 주인', likes:['forage','shell'], gift:'plant', tic:'깡총',
    look:{ skin:'#ffe8da', hair:'bob', hairColor:'#fbf1ea', eyes:'round', mouth:'smile', animal:{ type:'rabbit', fur:'#fbf1ea', inner:'#ffc2d4' } },
    wear:{ set:'dress_floral', shoes:'loafer' }, work:'shop', hours:[9,19] },
  { id:'coco', name:'코코', kind:'고양이', job:'은행원', likes:['shell','dig'], gift:'clock', tic:'냥',
    look:{ skin:'#ffe2cc', hair:'short', hairColor:'#4a4250', eyes:'round', mouth:'cat', animal:{ type:'cat', fur:'#4a4250', inner:'#ffb3c6' } },
    wear:{ top:'shirt_tie', bottom:'pants_black', face:'round_black', shoes:'loafer' }, work:'bank', hours:[9,18] },
  { id:'dan', name:'단풍', kind:'여우', job:'모험가', likes:['bug','dig'], gift:'globe', tic:'지롱',
    look:{ skin:'#ffdcbf', hair:'spiky', hairColor:'#f29a5a', eyes:'smile', mouth:'open', animal:{ type:'fox', fur:'#f29a5a', inner:'#fff0e0' } },
    wear:{ top:'jacket_denim', bottom:'shorts_khaki', back:'backpack_yel', shoes:'boots_brown' }, work:null, hours:[7,21] },
];
const NPC_BY = Object.fromEntries(NPCS.map(n => [n.id, n]));
const npcs = {};
const LINES = {
  momo:{
    intro:['어서 와요! 난 잡화점을 하는 토끼 모모예요. 깡총!','{name}, 맞죠? 새로 온 이웃이 생겨서 귀가 쫑긋해졌어요. 앞으로 잘 부탁해요!'],
    morning:['좋은 아침이에요, {name}! 아침 이슬 맞은 풀잎 냄새가 너무 좋아요.','일찍 일어났네요? 나도 당근 주스 한 잔 마시고 가게 문 열 참이에요.','아침엔 귀가 제일 잘 들려요. 새소리가 오늘따라 신났어요!'],
    day:['오늘도 놀러 왔어요? 가게에 새 가구가 들어왔어요, 깡총!','점심 먹었어요? 난 클로버 샐러드를 먹었어요.','햇볕이 따뜻해서 귀가 축 늘어지는 날이네요~'],
    evening:['노을이 분홍색이에요. 내 귀 안쪽이랑 똑같은 색!','이제 가게 정리하려던 참이었어요. 오늘 하루는 어땠어요?','저녁엔 집에서 쿠키 굽는 게 내 낙이에요.'],
    night:['어머, 이 시간까지 안 잤어요? 토끼는 원래 일찍 자야 하는데… 하암.','밤하늘 별이 당근처럼 반짝여요. …아니, 그건 아닌가?'],
    debt:['{name}… 요즘 지갑 사정이 어려워 보여요. 외상은 금방 불어나니까 조심해요!','빚이 있을 땐 버섯이랑 조개를 모아서 팔아 봐요. 내가 값 잘 쳐줄게요!'],
    splurge:['오늘 쇼핑 많이 했죠? 장바구니가 무거워 보여요, 깡총.'],
    tired:['얼굴에 피곤하다고 쓰여 있어요. 집에 가서 침대에 누워 쉬어요!'],
    set:{ dino:['으앗, 공룡이다! …아, {name}였구나. 깜짝이야!'], bear:['곰돌이 잠옷! 꼭 안아 주고 싶을 만큼 귀여워요.'], hanbok_pink:['한복이 너무 곱다… 오늘 무슨 날이에요?'], hanbok_sky:['하늘색 한복이 정말 잘 어울려요!'], wizard:['마법사님! 당근이 하늘에서 떨어지게 해 주세요!'], astro:['우주에 다녀왔어요? 달에도 토끼가 산대요!'], princess:['공주님이 우리 가게에 오시다니, 영광이에요!'], _:['오늘 옷 정말 멋져요! 어디서 샀어요?'] },
    ride:['와, 탈것이다! 나도 한 번 태워 줘요, 깡총!'],
    spring:['봄이에요! 고사리가 쑥쑥 올라와요. 숲 근처를 잘 찾아봐요.'], summer:['여름엔 산딸기가 달콤해요. 나무 근처 덤불을 살펴봐요!'], autumn:['가을엔 버섯이 많이 나요. 나무 밑을 잘 봐요!'], winter:['겨울엔 동백꽃이 피어요. 빨간 꽃이 눈 속에서 예뻐요.'],
    chat0:['잡화점에선 곤충이나 조개를 사들여요. 모아 오면 도토리로 바꿔 줄게요!','삽이 있으면 반짝이는 땅을 팔 수 있어요. 가끔 보물이 나온대요.','코코는 숫자를 정말 좋아해요. 은행 장부를 외우고 다닌다니까요?','단풍이는 맨날 어디론가 뛰어다녀요. 꼬리가 바람개비 같아요.'],
    chat1:['사실 나 비밀이 있어요… 밤에 몰래 당근 케이크를 먹어요. 쉿!','{name}랑 이야기하면 귀가 저절로 쫑긋해져요. 좋다는 뜻이에요!','언젠가 바닷가에 꽃집을 내고 싶어요. 조개로 장식한 꽃집!'],
    chat2:['{name}는 이제 내 제일 친한 친구예요. 깡총깡총!','힘들 땐 언제든 가게에 와요. 따뜻한 차 한 잔 내줄게요.'],
    giftLike:['우와, 내가 이거 정말 좋아하는 거 어떻게 알았어요? 고마워요!'], giftOk:['고마워요! 소중히 간직할게요.'], tooMuch:['오늘은 이야기 많이 했네요. 내일 또 와요, 깡총!'], bye:['또 와요!','조심히 가요~'],
  },
  coco:{
    intro:['…안녕. 은행원 코코다냥. 계좌를 열 땐 나한테 오면 된다.','신규 주민 {name}, 확인했다. 도토리는 은행에 맡기는 게 제일 안전하다냥.'],
    morning:['좋은 아침. 오늘 예금 이자율은 어제와 같다냥.','아침 커피 없이는 계산이 안 된다. …우유 많이 넣은 걸로.'],
    day:['어서 와. 오늘도 성실하게 일하고 있나?','점심 시간에도 장부는 맞춰 둬야 한다냥.','햇볕 좋은 창가 자리는 내 거다. 양보 못 한다.'],
    evening:['곧 은행 문 닫는다. 볼일 있으면 서둘러라냥.','오늘 하루 수입과 지출, 정리해 봤나?'],
    night:['…이 시간엔 은행이 쉰다. 고양이는 밤에 산책하는 거다냥.','달빛 아래서 숫자 세기, 생각보다 낭만적이다.'],
    debt:['{name}, 지갑이 마이너스다. 외상은 하루 10%씩 불어난다냥. 빨리 갚아라.','빚이 사흘을 넘으면 압류다. 경고했다냥.'],
    loan:['대출 잔액이 남아 있다. 기한 안에 꼭 갚아라냥.'],
    splurge:['오늘 지출이 너무 많다. 가계부 쓰는 걸 추천한다냥.'],
    tired:['피곤해 보인다. 피곤하면 계산 실수가 늘어난다냥. 쉬어라.'],
    rich:['통장 잔고가 아주 훌륭하다. …조금 존경한다냥.'],
    set:{ tux:['턱시도라니. 나랑 잘 어울리는 복장이다냥.'], pirate:['해적은 은행 출입 금지다. …농담이다냥.'], _:['오늘 옷, 나쁘지 않다냥.'] },
    ride:['과속하지 마라. 사고 나면 보험금 처리가 복잡하다냥.'],
    spring:['봄엔 졸음이 쏟아진다냥… 하암.'], summer:['더우면 털이 무겁다. 바닷가 바람이 좋다냥.'], autumn:['가을은 결산의 계절이다냥.'], winter:['겨울엔 난로 옆이 최고다냥. 움직이기 싫다.'],
    chat0:['예금은 하루 2% 이자. 작지만 매일 쌓이면 크다냥.','조개 중에 진주가 제일 비싸다. 바닷가를 잘 살펴라.','모모는 시끄럽지만… 착하다냥. 이건 비밀이다.','단풍이가 또 땅을 파고 다닌다. 마을 길이 남아나질 않는다냥.'],
    chat1:['사실 나는 생선보다 우유를 더 좋아한다. 놀랐나냥?','{name}는 숫자에 밝은 편이다. 칭찬이다냥.','밤에 지붕 위에서 별을 보는 게 취미다. 같이 볼 테냐?'],
    chat2:['…{name}랑 있으면 편하다냥. 이것도 비밀이다.','네가 어려울 때 이자는 깎아 줄 수 없지만, 이야기는 들어 줄 수 있다냥.'],
    giftLike:['오… 이건 정말 좋아하는 거다냥. 고맙다.'], giftOk:['받아 두겠다. …고맙다냥.'], tooMuch:['오늘 대화량은 한도 초과다냥. 내일 다시 와라.'], bye:['그럼.','안전 운행, 아니 안전 보행하라냥.'],
  },
  dan:{
    intro:['오! 새 얼굴이다! 난 단풍, 이 섬의 모든 길을 아는 여우지롱!','{name}? 이름 좋다! 나랑 같이 보물 찾으러 갈래?'],
    morning:['일어났구나! 아침엔 곤충들이 느릿느릿해서 잡기 좋지롱.','방금 해 뜨는 거 봤어? 꼬리털이 주황색으로 반짝였어!'],
    day:['오늘은 어디로 모험 갈까? 난 바닷가에 갔다 왔지롱!','삽 있어? 땅에 반짝이는 표시 봤어? 그 밑에 뭔가 있어!','달리기 시합할래? …아, 오늘은 다리가 좀 아프지롱.'],
    evening:['저녁엔 귀뚜라미 소리가 들려. 노래 같지 않아?','노을 진 바다, 같이 보러 가자! 기차 타면 금방이지롱.'],
    night:['밤엔 반딧불이가 나와! 여름밤엔 꼭 찾아봐!','쉿, 밤에 몰래 탐험 중이야. 모모한텐 비밀이지롱.'],
    debt:['빚이 있다며? 땅 파면 옛날 동전이 나올지도 몰라! 힘내!'],
    splurge:['우와, 쇼핑 왕이네! 근데 코코가 알면 잔소리할걸?'],
    tired:['헥헥, 너도 지쳤구나. 나무 그늘에서 좀 쉬자.'],
    delivery:['배달 중이야? 지름길 알려 줄까? 기차가 제일 빠르지롱!'],
    set:{ dino:['크앙! 공룡이랑 여우 중에 누가 더 빠를까? 시합하자!'], astro:['우주 탐험가다! 나도 데려가 줘!'], pirate:['해적 선장님! 보물 지도 있어요?!'], wizard:['마법으로 꼬리 하나 더 만들어 줄 수 있어?'], _:['멋진데? 모험 가기 딱 좋은 옷이지롱!'] },
    ride:['우와 부릉부릉! 나보다 빠른 건 반칙이지롱!'],
    spring:['봄엔 꿀벌이 바빠! 꽃 근처에서 잠자리채를 휘둘러 봐.'], summer:['여름은 곤충의 계절! 매미랑 사슴벌레 다 잡아 보자!'], autumn:['가을엔 고추잠자리가 하늘에 가득해. 사마귀도 조심!'], winter:['겨울에도 눈꽃벌레가 있어. 하얘서 찾기 어렵지롱.'],
    chat0:['내 꼬리 만져 볼래? …안 돼, 간지러워!','섬을 한 바퀴 도는 기차, 하루에 몇 바퀴 도는지 세어 봤는데 세다가 잠들었지롱.','화석 파 본 적 있어? 공룡 뼈가 나오면 진짜 대박이야!','코코는 무섭게 생겼지만 사실 엄청 다정해. 내가 장담하지롱.'],
    chat1:['나 사실 바다 건너에서 왔어. 언젠간 다시 모험을 떠날 거야.','{name}랑 다니면 모험이 두 배로 재밌어!','모모네 쿠키 먹어 봤어? 당근 맛인데 의외로 맛있지롱.'],
    chat2:['우리 이제 모험 파트너지? 평생 같이 탐험하자!','내가 찾은 제일 소중한 보물? 음… 이 마을 친구들이지롱.'],
    giftLike:['우와아! 이거 내가 완전 좋아하는 거야! 최고지롱!'], giftOk:['고마워! 배낭에 잘 넣어 둘게!'], tooMuch:['오늘 너무 많이 떠들었다! 내일 또 모험 얘기하자!'], bye:['또 보자!','다음 모험 때 불러 줘!'],
  },
};
function npcLook(n){ return lookOf({ look:n.look, wear:n.wear }); }
/* ---------- dialogue ---------- */
const talkEl = () => $('#talk');
let dlg = null;
function relOf(id){ G.me.npc = G.me.npc || {}; return G.me.npc[id] = G.me.npc[id] || { f:0, met:false, last:'', today:0, gifted:'', quest:null, milestone:0 }; }
const pickL = arr => arr[Math.floor(Math.random()*arr.length)];
const fill = s => s.replace(/\{name\}/g, G.me.name);
function situational(id){
  const L = LINES[id], me = G.me, out = [];
  if (me.acorns < 0 && L.debt) out.push(pickL(L.debt));
  if (id==='coco' && me.bank && me.bank.loan > 0 && L.loan) out.push(pickL(L.loan));
  if (id==='coco' && me.bank && me.bank.save >= 500 && L.rich) out.push(pickL(L.rich));
  if (me.daily && me.daily.splurge && L.splurge) out.push(pickL(L.splurge));
  if (me.stamina < 25 && L.tired) out.push(pickL(L.tired));
  if (G.delivery && L.delivery) out.push(pickL(L.delivery));
  const set = me.wear && me.wear.set; if (set && L.set) out.push(pickL(L.set[set] || L.set._));
  if (me.ride && L.ride) out.push(pickL(L.ride));
  if (Math.random() < 0.5 && L[season()]) out.push(pickL(L[season()]));
  return out.slice(0, 2);
}
function talkTo(np, preset){
  if (!G.me || dlg) return; closePanel(); stopFishing();
  const id = np.n.id, L = LINES[id], rel = relOf(id), h = hourNow();
  np.talking = true; np.path = [];
  const me = chars[G.slot]; me.face = Math.atan2(np.x-me.x, np.z-me.z); me.path = [];
  const lines = [];
  if (np.sleep){ lines.push('…쿨쿨. (깊이 잠들어 있어요)'); return openDialog(np, lines, true); }
  doAnim('wave');
  if (preset){ preset.forEach(l => lines.push(l)); if (!rel.met){ rel.met = true; rel.last = today(); rel.today = 1; } saveMe(); return openDialog(np, lines); }
  if (id === 'kini' && !(G.me.kini && G.me.kini.on)){ const k = G.me.kiniTalk && G.me.kiniTalk.date === today() ? G.me.kiniTalk : { date:today(), n:0 }; k.n++; G.me.kiniTalk = k; }
  if (!rel.met){ rel.met = true; L.intro.forEach(l => lines.push(l)); rel.f += 1; rel.last = today(); rel.today = 1; }
  else if (rel.last !== today()){
    rel.last = today(); rel.today = 1; rel.f += 1;
    const band = h < 11 ? 'morning' : h < 17 ? 'day' : h < 21 ? 'evening' : 'night';
    lines.push(pickL(L[band])); situational(id).forEach(l => lines.push(l));
  } else {
    rel.today++;
    if (rel.today > 4) lines.push(pickL(L.tooMuch));
    else { const pool = L.chat0.concat(rel.f >= 5 ? L.chat1 : [], rel.f >= 12 ? L.chat2 : []); lines.push(pickL(pool)); if (Math.random() < 0.4) situational(id).slice(0,1).forEach(l => lines.push(l)); }
  }
  const ms = rel.f >= 12 ? 2 : rel.f >= 5 ? 1 : 0;
  if (ms > rel.milestone){ rel.milestone = ms; const gid = ms === 1 ? np.n.gift : 'teddy'; G.me.furn = G.me.furn || {}; G.me.furn[gid] = (G.me.furn[gid]||0)+1; lines.push(ms===1 ? '{name}, 우리 꽤 친해진 것 같아요. 이거 선물이에요! ('+FURN[gid].name+')' : '이건 우리 우정의 증표예요! ('+FURN[gid].name+')'); }
  if (id === 'kini' && !(G.me.kini && G.me.kini.on) && G.me.kiniTalk && G.me.kiniTalk.n >= 3){ G.me.kini = { on:true }; lines.push('있지… 나 {name} 따라다녀도 돼? …헤헤, 벌써 따라가는 중이야!', '내가 옆에 있으면 일할 때 행운이 따를 거야. 진짜야, 헤헤. 그만 따라오게 하려면 말 걸어서 알려 줘.'); }
  saveMe();
  openDialog(np, lines);
}
function openDialog(np, lines, sleeping){
  dlg = { np, lines:lines.map(fill), k:0, sleeping };
  const el = talkEl(); el.hidden = false;
  const pt = el.querySelector('.portrait'); pt.innerHTML = ''; pt.appendChild(npcPortrait(np.n));
  el.querySelector('.who').textContent = np.n.name + ' · ' + np.n.kind + ' ' + np.n.job;
  showLine();
}
function showLine(){
  const el = talkEl(), t = el.querySelector('.text'), ch = el.querySelector('.choices');
  ch.innerHTML = '';
  if (dlg.k < dlg.lines.length){
    const full = dlg.lines[dlg.k]; t.textContent = ''; let n = 0; clearInterval(dlg.typer);
    dlg.typing = true; dlg.typer = setInterval(() => { n += 2; t.textContent = full.slice(0, n); if (n >= full.length){ clearInterval(dlg.typer); dlg.typing = false; } }, 28);
    el.querySelector('.next').hidden = false;
    return;
  }
  el.querySelector('.next').hidden = true;
  if (dlg.sleeping){ endDialog(); return; }
  const id = dlg.np.n.id, rel = relOf(id);
  const opts = npcOptions(dlg.np);
  ch.innerHTML = opts.map(([k,l]) => '<button data-o="'+k+'">'+l+'</button>').join('');
  ch.querySelectorAll('[data-o]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); choose(b.dataset.o); }));
}
function nextLine(){
  if (!dlg) return;
  if (dlg.typing){ clearInterval(dlg.typer); dlg.typing = false; talkEl().querySelector('.text').textContent = dlg.lines[dlg.k]; return; }
  if (dlg.k < dlg.lines.length){ dlg.k++; showLine(); }
}
function sayMore(lines){ dlg.lines = lines.map(fill); dlg.k = 0; showLine(); }
function choose(o){
  if (chooseV5(o)) return;
  const np = dlg.np, id = np.n.id, L = LINES[id], rel = relOf(id);
  if (o === 'bye'){ sayMore([pickL(L.bye)]); dlg.closing = true; return; }
  if (o === 'chat'){ rel.today++; const pool = L.chat0.concat(rel.f >= 5 ? L.chat1 : [], rel.f >= 12 ? L.chat2 : []); sayMore([rel.today > 5 ? pickL(L.tooMuch) : pickL(pool)]); saveMe(); return; }
  if (o === 'gift'){
    const inv = Object.entries(G.me.inv||{}).filter(([k,n]) => n>0 && GATHER[k]);
    if (!inv.length){ sayMore(['줄 수 있는 물건이 없어요. (채집한 물건을 선물할 수 있어요)']); return; }
    if (rel.gifted === today()){ sayMore(['오늘은 벌써 선물 받았어요. 마음만 받을게요!']); return; }
    const ch = talkEl().querySelector('.choices');
    ch.innerHTML = inv.slice(0,8).map(([k,n]) => '<button data-g="'+k+'">'+GATHER[k].name+' ('+n+')</button>').join('') + '<button data-g="">그만두기</button>';
    talkEl().querySelector('.text').textContent = '무엇을 선물할까요?';
    ch.querySelectorAll('[data-g]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); const k = b.dataset.g; if (!k){ showLine(); return; }
      G.me.inv[k]--; rel.gifted = today(); const like = np.n.likes.includes(GATHER[k].cat); rel.f += like ? 3 : 1; saveMe(); sayMore([pickL(like ? L.giftLike : L.giftOk)]); }));
    return;
  }
  if (o === 'quest'){
    if (!rel.quest || rel.quest.day !== today()){
      const cat = pickL(np.n.likes), pool = availGather(cat).filter(([,g]) => !g.rare && g.price <= 60);
      if (!pool.length){ sayMore(['지금은 부탁할 게 없어요. 나중에 다시 물어봐 줘요!']); return; }
      const [item, g] = pickL(pool), n = 1 + Math.floor(Math.random()*2);
      rel.quest = { day:today(), item, n, done:false, reward:Math.round(g.price*n*1.6 + 20) }; saveMe();
      sayMore(['혹시 '+g.name+' '+n+'개만 구해 줄 수 있어요? 구해 오면 도토리 '+rel.quest.reward+'개 줄게요!']); return;
    }
    const q = rel.quest; if (q.done){ sayMore(['오늘 부탁은 벌써 들어줬어요. 정말 고마워요!']); return; }
    if ((G.me.inv[q.item]||0) >= q.n){ G.me.inv[q.item] -= q.n; q.done = true; rel.f += 3; earn(q.reward); sayMore(['와, '+GATHER[q.item].name+'! 고마워요! 약속한 도토리 '+q.reward+'개예요.']); }
    else sayMore([GATHER[q.item].name+' '+q.n+'개, 아직 모자라요. ('+(G.me.inv[q.item]||0)+'/'+q.n+') 천천히 구해 와요!']);
    return;
  }
}
function endDialog(){ if (!dlg) return; clearInterval(dlg.typer); dlg.np.talking = false; dlg = null; talkEl().hidden = true; }
function dialogTap(){ if (!dlg) return; if (dlg.k >= dlg.lines.length - 1 && dlg.closing && !dlg.typing){ endDialog(); return; } nextLine(); }

/* ---------- glue ---------- */
function featTick(dt, tsec){
  if (!G.started) return;
  npcTick(dt, tsec);
  if (spotsGroup){ spotsGroup.children.forEach(g => { const b = g.userData.bug; if (b){ b.position.y = 0.55 + Math.sin(tsec*3 + g.position.x)*0.12; b.position.x = Math.sin(tsec*1.3 + g.position.z)*0.25; b.rotation.y = tsec*1.3; b.children.forEach(w => { if (w.userData.wing) w.rotation.y = w.userData.wing * Math.sin(tsec*20)*0.9; }); } if (g.userData.spark){ g.userData.spark.rotation.y = tsec*2; g.userData.spark.scale.setScalar(0.6 + Math.abs(Math.sin(tsec*2.5 + g.position.x))*0.6); } }); }
}
let featLast = 0;
function featSlow(){ buildSpots(); refreshSpots(); }

/*INLINE:v5.js*/
$('#roomBtn').addEventListener('click', () => G.panel==='decor' ? closePanel() : openDecorate());
$('#talk').addEventListener('click', e => { if (e.target.closest('[data-o],[data-g]')) return; dialogTap(); });
/* ---- boot ---- */
Store.on('placed', syncPlaced);
Store.on('players', () => { if (!G.started) renderPick(); else syncOthers(); });
Store.on('mail', updateBadge);
Store.on('mode', () => { $('#storeStatus').textContent = Store.mode==='fb' ? '마을에 연결됐어요' : Store.mode==='db' ? '가족 마을에 연결됐어요' : '이 폰에 저장하는 마을이에요'; renderPick(); });
Store.on('loaded', () => { if (Store.mode === 'fb' && !G.started){ const S = window.DVNet.session; start(S.slot, Store.data.players[pid(S.slot)] ? '' : S.name); } });
resize(); buildWorld(); renderPick(); applyTime(true); placeTrain();
setInterval(syncPlaced, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && G.me){ applyTime(true); ensureDaily(); refreshFruit(); syncPlaced(); processDebt(); updateHud(); } });
requestAnimationFrame(frame);
Store.init();
window.__dv = { canStand:(x,z)=>canStand(x,z), charBlock:(x,z)=>charBlock(chars[G.slot],x,z), sitBench:(...a)=>sitBench(...a), sitSwing:(...a)=>sitSwing(...a), openPlot:(...a)=>openPlot(...a), openJobAgency:(...a)=>openJobAgency(...a), PLOTS, patients:()=>patients, hospitalize:(...a)=>hospitalize(...a), npcKnock:(...a)=>npcKnock(...a), callPolice:()=>callPolice(), restAtHome:()=>restAtHome(), npcWealth:(id)=>npcWealth(id), say:(...a)=>say(...a), startConvo:(...a)=>startConvo(...a), getTour:()=>G.tour, finishTour:(np)=>finishTour(np), knockdown, startRescue, boardBoat, ISLETS, REEFS, hiveShake, HIVE_TREES, takePhoto, jump, doAnim, islTrain, ISL_ST, bfs, SPAWN, blocked, openChest, startSwarm, holdTool, shakeTree, tick:(dt)=>{ stepControls(dt); if (chars[G.slot] && G.started) actionPose(chars[G.slot], dt, 0); featTick(dt, performance.now()/1000); }, renderer, scene, enterShop, enterNpcHome, farmAct, playInstrument, openMap, syncCrops, chooseV5, setYaw, CROPS, startGuide, frontTarget, actionPress, getDlg:()=>dlg, NPC_BY, pickFlower, showAct, villagerHome, homeChoice, IWD:()=>[IW,ID], room:()=>room, charAt, T, camTarget, BY, resize, tile, idx, statics, key, npcs, spots, talkTo, enterHouse, exitHouse, openStore, openBank, openDecorate, gather, setPitch, decorTap, G, Store, chars, start, openShop, openWardrobe, openJobs, startCafe, startSort, startDelivery, rideTrain, STATIONS, train, buyItem, spend, earn, equip, processDebt, openMirror, closePanel, onObjectTap };
Object.assign(window.__dv, { roof:()=>G.roof, openArchitect:()=>openArchitect(), gotoFloor:(f)=>gotoFloor(f), goRoof:()=>goRoof(), roofFall:(x,z)=>roofFall(x,z), useFurniture:(n)=>useFurniture(n), canStandIn:(x,z)=>canStandIn(x,z), decorTap2:(...a)=>decorTap(...a), archSpot:()=>archSpot, refreshHouses:()=>refreshHouses(), instPlayPose:(...a)=>instPlayPose(...a), patientTalk:(id)=>patientTalk(id), onTap:(x,y)=>onTap(x,y), sideStep:(...a)=>sideStep(...a), playerHidden:()=>playerHidden(), cops:()=>G.cops, swingSeatWorld:(...a)=>swingSeatWorld(...a), objMeshes, BUILD, isletAt });
})();
