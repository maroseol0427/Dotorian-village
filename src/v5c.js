/* ---------- music: hand instruments & furniture instruments (WebAudio) ---------- */
let AC = null, playingUntil = 0;
function audio(){ if (!AC){ try{ AC = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){ return null; } } if (AC.state === 'suspended') AC.resume(); return AC; }
const MIDI = n => 440*Math.pow(2, (n-69)/12);
const TUNES = [
  { name:'작은 별', n:[60,60,67,67,69,69,67,0,65,65,64,64,62,62,60,0] },
  { name:'메리의 어린 양', n:[64,62,60,62,64,64,64,0,62,62,62,0,64,67,67,0] },
  { name:'도토리 왈츠', n:[67,64,64,0,65,62,62,0,60,62,64,65,67,67,67,0] },
  { name:'꽃섬 산책', n:[60,64,67,72,71,67,64,0,62,65,69,72,71,67,62,0] },
  { name:'바닷바람', n:[72,69,67,64,67,69,72,0,74,72,69,67,69,67,64,0] },
];
const INST_NAME = { piano:'피아노', drums:'드럼', harp:'하프', xylophone:'실로폰', ukulele:'우쿨렐레', violin:'바이올린', flute:'플루트', tambourine:'탬버린', trumpet:'트럼펫', maracas:'마라카스' };
function noiseBuf(ac){ if (ac._nb) return ac._nb; const b = ac.createBuffer(1, ac.sampleRate*0.5, ac.sampleRate), d = b.getChannelData(0); for (let k=0;k<d.length;k++) d[k] = Math.random()*2-1; return ac._nb = b; }
function tone(ac, out, t, f, dur, type, att, dec, gain, opts){
  const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  if (opts && opts.vib){ const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = opts.vib; lg.gain.value = f*0.012; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t+dur+dec+0.1); }
  let node = o; if (opts && opts.lp){ const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = opts.lp; o.connect(fl); node = fl; }
  node.connect(g); g.connect(out);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(gain, t+att);
  if (opts && opts.sus){ g.gain.setValueAtTime(gain, t+dur); g.gain.exponentialRampToValueAtTime(0.0001, t+dur+dec); o.start(t); o.stop(t+dur+dec+0.05); }
  else { g.gain.exponentialRampToValueAtTime(0.0001, t+att+dec); o.start(t); o.stop(t+att+dec+0.05); }
}
function hit(ac, out, t, kind, gain){
  if (kind === 'kick'){ const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(45, t+0.2); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t+0.28); o.connect(g); g.connect(out); o.start(t); o.stop(t+0.3); return; }
  const s = ac.createBufferSource(); s.buffer = noiseBuf(ac); const f = ac.createBiquadFilter(), g = ac.createGain();
  f.type = kind === 'snare' ? 'bandpass' : 'highpass'; f.frequency.value = kind === 'snare' ? 1800 : kind === 'shake' ? 6000 : 7000;
  const len = kind === 'snare' ? 0.16 : kind === 'shake' ? 0.06 : 0.05;
  s.connect(f); f.connect(g); g.connect(out); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t+len); s.start(t); s.stop(t+len+0.02);
}
function playInstrument(id){
  const ac = audio(); const now = performance.now();
  if (now < playingUntil){ return; }
  const name = INST_NAME[id] || '악기';
  if (!ac){ toast('♪ '+name+' 연주! (소리를 낼 수 없는 기기예요)'); return; }
  const out = ac.createGain(); out.gain.value = 0.5; out.connect(ac.destination);
  const t0 = ac.currentTime + 0.05, beat = id === 'violin' || id === 'flute' || id === 'harp' ? 0.34 : 0.27;
  const tune = TUNES[Math.floor(Math.random()*TUNES.length)];
  if (id === 'drums' || id === 'tambourine' || id === 'maracas'){
    const pat = id === 'drums' ? ['kick','hat','snare','hat','kick','kick','snare','hat'] : ['shake','0','shake','shake','shake','0','shake','shake'];
    for (let k=0;k<16;k++){ const p = pat[k%8]; if (p !== '0') hit(ac, out, t0 + k*0.22, p, p==='kick' ? 0.9 : id==='maracas' ? 0.35 : 0.45); if (id==='tambourine' && k%4===0) hit(ac, out, t0+k*0.22, 'hat', 0.4); }
    playingUntil = now + 16*220;
  } else {
    tune.n.forEach((n, k) => { if (!n) return; const t = t0 + k*beat, f = MIDI(n);
      if (id === 'piano'){ tone(ac, out, t, f, 0, 'triangle', 0.005, 1.1, 0.45); tone(ac, out, t, f*2, 0, 'sine', 0.005, 0.6, 0.12); }
      else if (id === 'harp'){ tone(ac, out, t, f, 0, 'sine', 0.004, 1.6, 0.45); tone(ac, out, t, f*2, 0, 'triangle', 0.004, 0.5, 0.1); }
      else if (id === 'xylophone'){ tone(ac, out, t, f*2, 0, 'sine', 0.002, 0.4, 0.5); tone(ac, out, t, f*8, 0, 'sine', 0.001, 0.06, 0.12); }
      else if (id === 'ukulele'){ tone(ac, out, t, f, 0, 'triangle', 0.003, 0.5, 0.45, { lp:2400 }); tone(ac, out, t, f*1.5, 0, 'sine', 0.003, 0.25, 0.08); }
      else if (id === 'violin') tone(ac, out, t, f, beat*0.85, 'sawtooth', 0.07, 0.12, 0.16, { lp:1900, vib:5.5, sus:true });
      else if (id === 'flute') tone(ac, out, t, f*2, beat*0.8, 'sine', 0.05, 0.1, 0.35, { vib:5, sus:true });
      else if (id === 'trumpet') tone(ac, out, t, f, beat*0.75, 'square', 0.03, 0.08, 0.13, { lp:2200, sus:true });
      else tone(ac, out, t, f, 0, 'triangle', 0.005, 0.8, 0.4); });
    playingUntil = now + tune.n.length*beat*1000;
  }
  toast('♪ '+name+(tune && !['drums','tambourine','maracas'].includes(id) ? ' · 〈'+tune.name+'〉' : '')+' 연주 중', 2400);
  G.music = { t:0, until:(playingUntil-now)/1000, inst:id };
  // neighbours enjoy the music
  const me = chars[G.slot]; if (me && !G.inside){ Object.values(npcs).forEach(np => { if (!np.g.visible || Math.hypot(np.x-me.x, np.z-me.z) > 5) return; const rel = relOf(np.n.id); if (rel.heard !== today()){ rel.heard = today(); rel.f += 1; saveMe(); setTimeout(() => toast(np.n.name+': 우와, 멋진 연주! 박수 짝짝짝', 2000), 2600); } }); }
}
function noteFx(dt){
  const M2 = G.music; if (!M2) return; M2.t += dt; if (M2.t > M2.until){ G.music = null; return; }
  M2.acc = (M2.acc||0) + dt; if (M2.acc < 0.35) return; M2.acc = 0;
  const me = chars[G.slot]; if (!me) return; _v.set(me.x, 1.5, me.z).project(cam);
  const el = document.createElement('div'); el.className = 'note'; el.textContent = Math.random() < 0.5 ? '♪' : '♫';
  el.style.left = ((_v.x+1)/2*window.innerWidth + (Math.random()-0.5)*40)+'px'; el.style.top = ((1-_v.y)/2*window.innerHeight)+'px'; el.style.color = ['#ff8fa6','#8fc8f0','#9fdcb4','#ffd36a','#b8a8f0'][Math.floor(Math.random()*5)];
  $('#labels').appendChild(el); setTimeout(() => el.remove(), 1600);
  if (me.model && me.model.userData.arms) me.model.userData.arms[1].rotation.x = -0.9 + Math.sin(M2.t*12)*0.35;
}
const heldInstrument = () => { const h = G.me && G.me.wear && G.me.wear.hand; return h && ITEM[h] && ITEM[h].cat === 'music' ? h : null; };

/* ---------- farming (농장섬) ---------- */
const cropKey = (i,j) => 'farm_'+wx(i)+'_'+wz(j);
function cropGrowth(p, now){ now = now || Date.now(); const s = Math.max(p.tAt||0, p.wAt||0), e = Math.min(now, (p.wAt||0) + DAY); return (p.g||0) + Math.max(0, e - s)/3600000; }
function cropState(p){ const C = CROPS[p.c], g = cropGrowth(p), frac = g / C.hours, wetLeft = (p.wAt||0) + DAY - Date.now(); return { C, g, frac, ripe:frac >= 1, wet:wetLeft > 0, wetLeft, stage: frac >= 1 ? 3 : frac >= 0.45 ? 2 : frac > 0.02 ? 1 : 0 }; }
function farmLabel(i,j){ const PL = typeof plotAt === 'function' && plotAt(wx(i), wz(j)); if (PL){ const own = Store.data.placed['plot_'+PL.id]; if (!own || own.owner !== G.slot || Store.data.placed['job_'+PL.id]) return '밭 구경'; } const p = Store.data.placed[cropKey(i,j)]; if (!p) return '심기'; const s = cropState(p); if (s.ripe) return '수확'; return s.wetLeft < 18*3600000 ? '물 주기' : '살펴보기'; }
const hrs = h => h >= 1 ? Math.ceil(h)+'시간' : Math.max(1, Math.round(h*60))+'분';
function farmAct(i,j){
  const k = cropKey(i,j), p = Store.data.placed[k]; G.me.seeds = G.me.seeds || {};
  const PL = typeof plotAt === 'function' && plotAt(wx(i), wz(j)); if (PL){ const own = Store.data.placed['plot_'+PL.id]; if (!own){ toast(PL.name+'은(는) 아직 주인이 없어요. 앞 표지판에서 살 수 있어요'); return; } if (own.owner !== G.slot){ toast((own.name||'가족')+'네 밭이에요'); return; } if (Store.data.placed['job_'+PL.id]){ toast('알바생이 이 밭에서 일하는 중이에요'); return; } }
  if (!p){
    const own = Object.entries(G.me.seeds).filter(([,n]) => n > 0);
    if (!own.length){ toast('씨앗이 없어요. 모모네 잡화점에서 씨앗을 사 와요'); return; }
    G.panel = 'seedpick';
    openPanel('무엇을 심을까요?', '<div class="grid">'+own.map(([id,n]) => '<div class="cell" data-seed="'+id+'"><div class="sw" style="background:'+CROPS[id].c+'"></div>'+CROPS[id].name+'<b>'+n+'개 · '+CROPS[id].hours+'시간</b></div>').join('')+'</div><p class="note">심은 뒤 물을 줘야 자라기 시작해요. 물은 하루 동안 효과가 있어요.</p>', { half:true });
    $('#pbody').querySelectorAll('[data-seed]').forEach(c => c.addEventListener('click', () => { const id = c.dataset.seed; if (!(G.me.seeds[id] > 0)) return; G.me.seeds[id]--; saveMe(); closePanel();
      const now = Date.now(), wet = !!G.me.tools.can; Store.setPlaced(k, { t:'crop', c:id, at:now, g:0, tAt:now, wAt: wet ? now : 0, by:G.slot, byName:G.me.name });
      doAnim('pick'); toast(CROPS[id].name+' 씨앗을 심었어요'+(wet ? ' · 물도 줬어요!' : ' · 물뿌리개로 물을 줘야 자라요'), 2200); setTimeout(syncCrops, 50); }));
    return;
  }
  const s = cropState(p);
  if (s.ripe){ const n = s.C.yield, isNew = addItem('c_'+p.c, n); Store.delPlaced(k); saveMe(); doAnim('pick');
    pop((isNew?'<div class="new">도감 새 등록</div>':'')+'<div class="sw" style="background:'+s.C.c+';width:40px;height:22px;margin:0 auto 4px"></div>'+s.C.name+' '+n+'개', '수확했어요!'+(p.by!==G.slot?'<br><small>'+esc(p.byName||'가족')+'이(가) 심은 작물이에요</small>':'')+'<br><small>잡화점에서 하나에 도토리 '+s.C.price+'</small>'); setTimeout(syncCrops, 50); return; }
  if (s.wetLeft < 18*3600000){
    if (!G.me.tools.can){ toast('물뿌리개가 있어야 물을 줄 수 있어요. 잡화점에서 팔아요'); return; }
    const now = Date.now(); Store.setPlaced(k, Object.assign({}, p, { g:cropGrowth(p, now), tAt:now, wAt:now }));
    doAnim('water'); G.splash = { t:0, x:wx(i), z:wz(j) }; toast(s.C.name+'에 물을 줬어요 · 다 자라려면 '+hrs(s.C.hours - s.g)+' 더', 2200); setTimeout(syncCrops, 50); return;
  }
  toast(s.C.name+' · 다 자라려면 '+hrs(s.C.hours - s.g)+' 더 · 흙이 촉촉해요 ('+hrs(s.wetLeft/3600000)+' 동안)', 2600);
}
let cropRoot = null, soilMesh = null; const cropMeshes = new Map();
function buildSoil(){
  const cells = []; for (let j=0;j<N;j++) for (let i=0;i<N;i++) if (tile[idx(i,j)] === FARM) cells.push([i,j]);
  const m = new THREE.InstancedMesh(GC('soil', () => new THREE.BoxGeometry(0.88, 0.1, 0.88)), TM('#ffffff'), cells.length);
  cells.forEach(([i,j],n) => { _o.position.set(wx(i), 0.04, wz(j)); _o.scale.set(1,1,1); _o.rotation.set(0,0,0); _o.updateMatrix(); m.setMatrixAt(n, _o.matrix); m.setColorAt(n, new THREE.Color('#e2c09a')); });
  m.receiveShadow = true; m.userData.cells = cells; return m;
}
function cropModel(p, st){
  const g = new THREE.Group(), C = CROPS[p.c], leaf = '#8fcf7a';
  if (st.stage === 0){ M(SPH(0.06, 8, 6), '#a07a5a', 0, 0.1, 0, g).scale.set(1.4, 0.5, 1.4); return g; }
  if (st.stage === 1){ [-1,1].forEach(s => { const l = M(SPH(0.07, 8, 6), '#a8dc8a', 0.05*s, 0.17, 0, g); l.scale.set(1.3, 0.4, 0.8); l.rotation.z = 0.5*s; }); M(GC('sprout', () => new THREE.CylinderGeometry(0.01,0.01,0.1,5)), '#9fd49a', 0, 0.12, 0, g); return g; }
  if (st.stage === 2){ for (let k=0;k<5;k++){ const a = k/5*Math.PI*2; const l = M(SPH(0.11, 10, 8), leaf, Math.cos(a)*0.09, 0.2, Math.sin(a)*0.09, g); l.scale.set(1.2, 0.45, 0.7); l.rotation.y = -a; } if (p.c==='corn') M(GC('cstalk', () => new THREE.CylinderGeometry(0.03,0.04,0.5,6)), '#9fd49a', 0, 0.3, 0, g); return g; }
  switch (p.c){
    case 'turnip': M(SPH(0.14, 12, 10), C.c, 0, 0.16, 0, g).scale.set(1, 0.9, 1); M(SPH(0.1, 10, 8), '#c8a8e8', 0, 0.22, 0, g).scale.set(1.1, 0.5, 1.1); for (let k=0;k<4;k++){ const l = M(SPH(0.09, 8, 6), leaf, Math.cos(k*1.6)*0.06, 0.38, Math.sin(k*1.6)*0.06, g); l.scale.set(0.6, 1.3, 0.4); } break;
    case 'carrot': M(GC('carrot', () => new THREE.ConeGeometry(0.07, 0.16, 10)), C.c, 0, 0.12, 0, g).rotation.x = Math.PI; for (let k=0;k<5;k++){ const l = M(SPH(0.07, 8, 6), leaf, Math.cos(k*1.3)*0.05, 0.34, Math.sin(k*1.3)*0.05, g); l.scale.set(0.5, 1.6, 0.4); l.rotation.z = Math.cos(k)*0.4; } break;
    case 'strawberry': M(SPH(0.2, 12, 10), leaf, 0, 0.16, 0, g).scale.set(1.3, 0.55, 1.3); for (let k=0;k<6;k++){ const a = k*1.05; M(GC('berry', () => new THREE.ConeGeometry(0.045, 0.09, 8)), C.c, Math.cos(a)*0.18, 0.16, Math.sin(a)*0.18, g).rotation.x = Math.PI; } break;
    case 'tomato': M(GC('stake', () => new THREE.CylinderGeometry(0.015,0.015,0.7,5)), '#c8a088', 0.06, 0.35, -0.06, g); M(SPH(0.16, 10, 8), leaf, 0, 0.35, 0, g).scale.set(1, 1.4, 1); [[0.1,0.3,0.1],[-0.1,0.42,0.08],[0.05,0.5,-0.1],[-0.06,0.24,-0.1]].forEach(([x,y,z]) => M(SPH(0.065, 10, 8), C.c, x, y, z, g)); break;
    case 'corn': M(GC('cstalk2', () => new THREE.CylinderGeometry(0.035,0.045,0.8,6)), '#9fd49a', 0, 0.4, 0, g); [-1,1].forEach(s => { const l = M(SPH(0.16, 8, 6), leaf, 0.1*s, 0.5, 0, g); l.scale.set(1.2, 0.2, 0.4); l.rotation.z = 0.5*s; }); M(GC('cob', () => new THREE.CapsuleGeometry(0.05, 0.14, 4, 8)), C.c, 0.07, 0.55, 0.03, g).rotation.z = -0.4; break;
    case 'pumpkin': M(SPH(0.24, 14, 12), C.c, 0, 0.2, 0, g).scale.set(1.15, 0.8, 1.15); M(GC('pstem', () => new THREE.CylinderGeometry(0.025,0.03,0.1,6)), '#8fcf7a', 0, 0.42, 0, g); M(SPH(0.1, 8, 6), leaf, 0.22, 0.12, 0.12, g).scale.set(1.4, 0.3, 1); break;
  }
  return g;
}
function syncCrops(){
  if (!cropRoot){ cropRoot = new THREE.Group(); scene.add(cropRoot); }
  if (!soilMesh){ soilMesh = buildSoil(); scene.add(soilMesh); }
  const P = Store.data.placed, seen = new Set();
  soilMesh.userData.cells.forEach(([i,j],n) => { const k = cropKey(i,j), p = P[k]; let col = '#e2c09a';
    if (p && CROPS[p.c]){ const st = cropState(p); col = st.wet ? '#b8906c' : '#e2c09a'; seen.add(k); const sig = p.c+st.stage;
      const cur = cropMeshes.get(k); if (!cur || cur.sig !== sig){ if (cur) cropRoot.remove(cur.g); const g = cropModel(p, st); g.position.set(wx(i), 0, wz(j)); cropRoot.add(g); cropMeshes.set(k, { g, sig }); } }
    soilMesh.setColorAt(n, new THREE.Color(col)); });
  soilMesh.instanceColor.needsUpdate = true;
  cropMeshes.forEach((v,k) => { if (!seen.has(k)){ cropRoot.remove(v.g); cropMeshes.delete(k); } });
}

/* ---------- villagers' homes & the decorating mission ---------- */
const NH_REQ = {
  toni:{ theme:'포근한 책방', need:['bookshelf','desk','lamp'], wall:'wall_mint', reward:420, ask:'내 집을 책 읽기 좋은 포근한 책방처럼 꾸며 줄래? 책장, 책상, 스탠드 조명이 꼭 있었으면 좋겠어. 벽지는 민트색으로!' },
  kini:{ theme:'귀여운 놀이방', need:['teddy','rug_round','garland'], wall:'wall_pink', reward:380, ask:'있지… 우리 집을 놀이방처럼 꾸며 줄래? 큰 곰인형이랑 동그란 러그, 가랜드! 벽은 분홍색이면 좋겠어.' },
  momo:{ theme:'꽃향기 가득한 방', need:['plant','cactus','frame'], wall:'wall_dots', reward:400, ask:'우리 집을 꽃향기 가득한 방으로 만들어 줄래요? 화분, 선인장, 꽃 액자! 벽지는 땡땡이로요, 깡총!' },
  coco:{ theme:'조용한 서재', need:['bookshelf','clock','globe'], floor:'floor_stone', reward:450, ask:'우리 집을 조용한 서재로 만들어 줄 수 있나냥? 책장, 벽시계, 지구본은 필수다. 바닥은 돌바닥으로.' },
  dan:{ theme:'모험가의 아지트', need:['globe','aquarium','window'], wall:'wall_wood', reward:430, ask:'내 집을 모험가의 아지트로 꾸며 줘! 지구본, 어항, 동그란 창문! 벽은 통나무 벽이 멋있겠지롱!' },
  bobo:{ theme:'아늑한 부엌', need:['kitchen','fridge','table'], floor:'floor_check', reward:470, ask:'우리 집을 아늑한 부엌으로 만들어 줄래요, 곰? 싱크대, 냉장고, 탁자! 바닥은 체크 타일로 부탁해요.' },
  pang:{ theme:'대나무 휴식방', need:['plant','sofa','tv'], wall:'wall_mint', reward:400, ask:'일 끝나고 쉴 방이 필요해, 팡! 화분, 소파, 텔레비전! 벽은 대나무 같은 민트색으로.' },
  mong:{ theme:'구름 침실', need:['bed','rug_check','lamp'], wall:'wall_stripe', reward:390, ask:'우리 집을 구름 위 침실처럼 꾸며 줄래요, 메에? 침대, 체크 러그, 스탠드! 벽은 하늘색 줄무늬로요~' },
  bori:{ theme:'역무원 휴게실', need:['sofa','tv','clock'], floor:'floor_wood', reward:410, ask:'우리 셋이 쉬는 숙소를 휴게실처럼 꾸며 주실 수 있나요, 멍? 소파, 텔레비전, 벽시계가 있으면 좋겠어요!' },
};
const NH_MIN = 6;
function villagerHome(npc){ const d = Store.data.placed['nh_'+npc]; if (d && d.items) return JSON.parse(JSON.stringify(d)); return { t:'nhome', npc, wall:'wall_cream', floor:'floor_wood', items:[{ id:'bed', x:0, z:0, r:0 }] }; }
function saveVillagerHome(npc, H){ const doc = JSON.parse(JSON.stringify(H)); doc.t = 'nhome'; doc.npc = npc; doc.at = Date.now(); doc.by = G.slot; Store.setPlaced('nh_'+npc, doc); }
function missionCheck(npc, H){
  const R = NH_REQ[npc]; if (!R) return { ok:false, missing:[] }; const have = new Set(H.items.map(it => it.id)), missing = [];
  R.need.forEach(id => { if (!have.has(id)) missing.push(FURN[id].name); });
  if (R.wall && H.wall !== R.wall) missing.push(WALLS[R.wall].name);
  if (R.floor && H.floor !== R.floor) missing.push(FLOORS[R.floor].name);
  if (H.items.length < NH_MIN) missing.push('가구 '+(NH_MIN - H.items.length)+'개 더');
  return { ok:!missing.length, missing };
}
function missionCard(npc){
  const R = NH_REQ[npc], H = G.inside.home, c = missionCheck(npc, H), have = new Set(H.items.map(it => it.id));
  const li = (ok, t) => '<span style="color:'+(ok?'var(--mint-dk)':'var(--ink-soft)')+'">'+(ok?'✔ ':'○ ')+t+'</span>';
  return '<div class="card"><div class="k"><b>'+esc(NPC_BY[npc].name)+'의 부탁 · '+R.theme+'</b><span>도토리 '+R.reward+'</span></div><div class="legend">'+R.need.map(id => li(have.has(id), FURN[id].name)).join('')+(R.wall?li(H.wall===R.wall, WALLS[R.wall].name):'')+(R.floor?li(H.floor===R.floor, FLOORS[R.floor].name):'')+li(H.items.length>=NH_MIN, '가구 '+NH_MIN+'개 이상 ('+H.items.length+')')+'</div>'+(H.done ? '<span class="note">이미 완성한 집이에요. 더 예쁘게 꾸며도 돼요.</span>' : c.ok ? '<span class="note" style="color:var(--mint-dk)">다 됐어요! '+esc(NPC_BY[npc].name)+'에게 가서 알려 주세요.</span>' : '<span class="note">다 꾸미면 '+esc(NPC_BY[npc].name)+'에게 말을 걸어 알려 주세요.</span>')+'</div>';
}
function enterNpcHome(npc){
  const n = NPC_BY[npc], home = villagerHome(npc), canEdit = !!(G.me.nhm && G.me.nhm[npc]);
  IW = 8; ID = 6;
  let ownerNp = null; const np = npcs[npc];
  if (np && np.sleep){ const g = new THREE.Group(), model = npcModel(n, 'sleep'); g.add(model); g.traverse(o => { o.userData.clerk = true; }); model.rotation.z = 0; const bed = home.items.find(it => it.id==='bed' && !(it.r%2)); ownerNp = { n, g, model, x: bed ? iwx(bed.x) : iwx(1.5), z: bed ? iwz(bed.z+1)+0.25 : iwz(1.5), path:[], face:0, bed:!!bed, talking:false, sleep:true, clerk:true, lbl:makeLabel(n.name+' · 쿨쿨') }; }
  enterRoom({ kind:'nhome', npc, own:false, canEdit, home, b:NHOME[npc], w:8, d:6, clerkNp:ownerNp });
  toast(canEdit ? n.name+'네 집이에요. 오른쪽 위 "방 꾸미기"로 꾸며 줄 수 있어요' : n.name+'네 집에 놀러 왔어요'+(ownerNp?' · 쉿, 자고 있어요':''), 2600);
}
Store.on('placed', () => {
  if (G.started) syncCrops();
  if (G.inside && G.inside.kind === 'nhome' && G.panel !== 'decor'){ const d = Store.data.placed['nh_'+G.inside.npc]; if (d && d.at && d.at !== G.inside.home.at){ G.inside.home = villagerHome(G.inside.npc); buildRoom(G.inside.home); } }
});
function homeChoice(np){
  const id = np.n.home, R = NH_REQ[id], H = villagerHome(id), nm = np.n.name;
  G.me.nhm = G.me.nhm || {};
  if (H.done) return ['우리 집, '+(H.doneByName||'가족')+'이(가) 정말 예쁘게 꾸며 줬어요! 언제든 놀러 와요.'];
  if (!G.me.nhm[id]){ G.me.nhm[id] = 1; saveMe(); return [R.ask, '가구는 우리 집 상자에 있는 걸 마음껏 써도 돼요. 우리 집에 들어가서 오른쪽 위 "방 꾸미기"를 눌러 주세요!', '다 꾸미면 저한테 와서 알려 주세요. 보답으로 도토리 '+R.reward+'개 드릴게요!']; }
  const c = missionCheck(id, H);
  if (!c.ok) return ['아직 조금 모자라요… '+c.missing.join(', ')+'! 천천히 해 줘요.'];
  H.done = true; H.doneBy = G.slot; H.doneByName = G.me.name; saveVillagerHome(id, H);
  const rel = relOf(np.n.id); rel.f += 6; earn(R.reward);
  setTimeout(() => pop('집 꾸미기 완성!', nm+'네 집 · '+R.theme+'<br>도토리 +'+R.reward+' · 친밀도 UP'), 400);
  return ['우와아… 이게 정말 우리 집이에요?! 꿈에 그리던 '+R.theme+'예요!', '정말 고마워요, {name}! 약속한 도토리 '+R.reward+'개예요!'];
}

/* ---------- map ---------- */
function openMap(){
  G.panel = 'map';
  openPanel('마을 지도', '<canvas id="mapCv" width="660" height="660"></canvas><div class="legend"><span><i style="background:#5fb894"></i>나</span><span><i style="background:#ffb7c9"></i>가족</span><span><i style="background:#ffd36a"></i>주민</span><span><i style="background:#9a86e0"></i>건물</span></div><p class="note">지도를 탭하면 그곳으로 걸어가요.</p>', { half:false });
  drawMap();
  $('#mapCv').addEventListener('click', e => {
    const cv = $('#mapCv'), r = cv.getBoundingClientRect(), sc = N / r.width; const i = Math.round((e.clientX - r.left)*sc - 0.5), j = Math.round((e.clientY - r.top)*sc - 0.5);
    if (!inb(i,j)) return; closePanel(); if (G.inside || G.boat){ toast(G.boat ? '배를 타고 있을 땐 방향키로 움직여요' : '밖에 나가서 이동해요'); return; }
    let ti = i, tj = j; if (blocked(ti,tj)){ let best = null, bd = 1e9; for (let a=-4;a<=4;a++) for (let b=-4;b<=4;b++){ const ii = i+a, jj = j+b; if (inb(ii,jj) && !blocked(ii,jj) && a*a+b*b < bd){ bd = a*a+b*b; best = [ii,jj]; } } if (!best){ toast('거기는 갈 수 없어요'); return; } [ti,tj] = best; }
    walkTo(ti, tj);
  });
}
function drawMap(){
  const cv = $('#mapCv'); if (!cv) return; const g = cv.getContext('2d'), s = cv.width / N;
  const col = { 0:'#a8dcf0', 1:'#fbeccc', 2:'#c6ecb0', 3:'#f6e4c8', 4:'#e2cdb8', 5:'#ece6f4', 6:'#e8cfb2', 7:'#ffc6dc', 8:'#e2c09a' };
  for (let j=0;j<N;j++) for (let i=0;i<N;i++){ g.fillStyle = col[tile[idx(i,j)]]; g.fillRect(i*s, j*s, s+0.5, s+0.5); }
  statics.forEach((st,k) => { const [i,j] = k.split('_').map(Number); if (st.kind === 'tree'){ g.fillStyle = '#8fcf8a'; g.beginPath(); g.arc((i+0.5)*s, (j+0.5)*s, s*0.45, 0, 7); g.fill(); } else if (st.kind !== 'rock'){ g.fillStyle = st.kind==='house' ? ROOFS[st.slot] : st.kind==='nhouse' ? (NH_STYLE[st.npc]||{}).roof || '#c9b6f0' : '#c9b6f0'; g.fillRect(i*s, j*s, s, s); } });
  g.font = (s*3.6)+'px Jua, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#5b4b78'; g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = s*0.8; g.lineJoin = 'round';
  ISLANDS.forEach(I => { const x = (I.cx+C+0.5)*s, y = (I.cz+C - (I.id==='main' ? 11 : I.id==='forest' ? 17 : 12))*s; g.strokeText(I.name, x, y); g.fillText(I.name, x, y); });
  g.font = (s*2.1)+'px Jua, sans-serif'; g.lineWidth = s*0.6;
  BUILD.forEach(b => { if (b.kind==='mailbox') return; const nm = b.name || (b.kind==='house' ? playerName(b.slot)+'네' : b.kind==='nhouse' ? (NH_STYLE[b.npc]||{}).sign : ''); if (nm){ g.strokeText(nm, (b.cx+C+0.5)*s, (b.cz+C-1.7)*s); g.fillText(nm, (b.cx+C+0.5)*s, (b.cz+C-1.7)*s); } });
  const dot = (x, z, c, r) => { g.fillStyle = '#fff'; g.beginPath(); g.arc((x+C+0.5)*s, (z+C+0.5)*s, r+1.5, 0, 7); g.fill(); g.fillStyle = c; g.beginPath(); g.arc((x+C+0.5)*s, (z+C+0.5)*s, r, 0, 7); g.fill(); };
  Object.values(npcs).forEach(np => { if (np.g.visible) dot(np.x, np.z, '#ffd36a', s*0.6); });
  Object.values(chars).forEach(c => { if (c.g.visible && c.slot !== G.slot) dot(c.x, c.z, '#ffb7c9', s*0.75); });
  const me = chars[G.slot]; if (me && !G.inside) dot(me.x, me.z, '#5fb894', s*0.95);
}
