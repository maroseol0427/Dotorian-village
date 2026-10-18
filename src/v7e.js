/* ---------- newcomers arrive at 마을역 one by one ---------- */
const NEWCOMERS = ['n1','n2','n3','n4','n5'];
NPCS.push(
  { id:'n1', name:'구름', kind:'고양이', job:'화가 지망생', likes:['flower','shell'], gift:'frame', home:'n1', hours:[7,22], newcomer:true, notYet:true,
    look:{ skin:'#fff0e8', hair:'short', hairColor:'#b8b4c8', eyes:'round', mouth:'cat', animal:{ type:'cat', fur:'#b8b4c8', inner:'#ffc6d6' } }, wear:{ top:'stripe_navy', bottom:'pants_beige', hat:'beret', shoes:'loafer' } },
  { id:'n2', name:'도담', kind:'여우', job:'꼬마 요리사', likes:['crop','tree'], gift:'kitchen', home:'n2', hours:[7,22], newcomer:true, notYet:true,
    look:{ skin:'#ffdcbf', hair:'spiky', hairColor:'#ef7f4a', eyes:'star', mouth:'open', animal:{ type:'fox', fur:'#ef7f4a', inner:'#fff0e0' } }, wear:{ set:'chef' } },
  { id:'n3', name:'나무', kind:'곰', job:'목수', likes:['tree','forage'], gift:'chair', home:'n3', hours:[6,21], newcomer:true, notYet:true,
    look:{ skin:'#ffe2cc', hair:'short', hairColor:'#8a6040', eyes:'smile', mouth:'smile', beard:true, animal:{ type:'bear', fur:'#8a6040', inner:'#e8c8a0' } }, wear:{ set:'overalls', hat:'straw' } },
  { id:'n4', name:'솜이', kind:'토끼', job:'노래하는 가수', likes:['flower','bug'], gift:'piano', home:'n4', hours:[8,23], newcomer:true, notYet:true,
    look:{ skin:'#fff0f4', hair:'twin', hairColor:'#ffc6dc', eyes:'star', mouth:'smile', animal:{ type:'rabbit', fur:'#ffd6e6', inner:'#ff9ab8' } }, wear:{ set:'dress_floral', hat:'flower_crown' } },
  { id:'n5', name:'판도', kind:'판다', job:'여행 사진가', likes:['shell','dig'], gift:'globe', home:'n5', hours:[7,22], newcomer:true, notYet:true,
    look:{ skin:'#fff2ea', hair:'short', hairColor:'#ffffff', eyes:'round', mouth:'open', animal:{ type:'panda', fur:'#ffffff', inner:'#5a5060' } }, wear:{ top:'hoodie_yel', bottom:'shorts_khaki', back:'backpack_red', shoes:'sneaker_r' } },
);
NPCS.forEach(n => { NPC_BY[n.id] = n; });
const lostLines = ['여기가 어디지…','지도를 거꾸로 들었나…?','저기요… 혹시 이 마을 사세요?','기차에서 내렸는데 길을 모르겠어요…','짐이 너무 무거워…'];
const nlines = (intro, chat0, settle, extra) => Object.assign({
  intro, morning:['좋은 아침이에요!','새 동네 아침은 공기가 달라요.'], day:['마을이 점점 익숙해져요.','오늘은 어디 가 볼까?'], evening:['노을이 정말 예뻐요.'], night:['이 마을 밤하늘 최고예요.'],
  chat0, chat1:['{name} 덕분에 이 마을이 좋아졌어요.','처음 만난 날 기억나요? 길 잃고 헤매던 날!'], chat2:['{name}는 제 첫 친구이자 제일 친한 친구예요.'],
  giftLike:['우와, 제가 제일 좋아하는 거예요!'], giftOk:['고마워요!'], tooMuch:['오늘은 여기까지! 또 봐요.'], bye:['또 만나요!','안녕~'], lost:lostLines, settle,
}, extra || {});
Object.assign(LINES, {
  n1:nlines(['저… 오늘 이사 온 구름이에요. 그림 그리러 왔는데 길을 잃었어요…'], ['이 마을 풍경, 전부 그림으로 남기고 싶어요.','꽃섬 튤립밭을 그리는 중이에요.'], ['정말 고마워요! 이제 북쪽 동네 제 집으로 갈게요. 언제든 놀러 와요!']),
  n2:nlines(['안녕! 나 도담이야. 요리 배우러 왔는데… 카페가 어디야?'], ['보보 아저씨한테 요리 배우는 중이야!','농장섬 채소로 수프 끓일 거야.'], ['고마워! 북쪽 동네에 내 집이 생겼어. 맛있는 거 해 줄게!']),
  n3:nlines(['험험, 목수 나무라고 하오. 일거리를 찾아 왔는데 마을이 넓구먼.'], ['벤치가 삐걱거리면 나한테 말하시오.','숲밭섬 나무들이 참 튼튼하오.'], ['고맙소! 이제 내 집으로 가서 연장을 풀겠소.']),
  n4:nlines(['안녕하세요~ 노래하는 솜이예요! 무대를 찾아 왔는데 여긴 어디예요?'], ['오늘은 기차역 앞에서 노래했어요!','악기 연주 들려주면 같이 노래할게요~'], ['고마워요! 집에서 노래 연습할게요, 랄라~']),
  n5:nlines(['찰칵! 아, 안녕하세요. 여행 사진가 판도예요. 길을 잃어서 사진만 찍고 있었어요…'], ['무인도 사진 찍으러 가고 싶어요!','사진 찍기 버튼 눌러 봤어요? 저도 좋아해요!'], ['고마워요! 이 마을 사진첩을 만들 거예요. 집에서 정리할게요!']),
});
const LANDMARKS = [
  { id:'plaza', name:'광장', x:0, z:0, say:'여기가 마을 한가운데구나!' }, { id:'mall', name:'몽실 쇼핑몰', x:9, z:8, say:'쇼핑몰이다! 옷 사러 와야지.' },
  { id:'bank', name:'은행', x:10, z:-1, say:'도토리는 여기 맡기면 되는구나.' }, { id:'cafe', name:'보보 카페', x:-9, z:9, say:'맛있는 냄새가 나요!' },
  { id:'shop', name:'모모네 잡화점', x:-9, z:3, say:'가구가 엄청 많아요!' }, { id:'harbor', name:'항구', x:14, z:-15, say:'배다! 바다 냄새~' },
  { id:'tulip', name:'꽃섬 튤립밭', x:-34, z:-8, say:'우와, 꽃밭이 너무 예뻐요!' }, { id:'farm', name:'농장섬 밭', x:36, z:7, say:'채소가 쑥쑥 자라고 있네요.' },
  { id:'hosp', name:'병원', x:45, z:15, say:'아프면 여기 오면 되겠다.' }, { id:'forest', name:'숲밭섬', x:0, z:-50, say:'숲이 엄청 울창해요!' },
  { id:'beach', name:'야자섬 바닷가', x:6, z:35, say:'야자수다! 휴양지 같아요.' }, { id:'jobk', name:'JOB꼬리아', x:-5, z:-22, say:'일자리 구할 땐 여기!' },
];
function ncMeta(){ return Store.data.placed.meta_newcomers || { settled:[], day:'' }; }
function newcomerState(){
  const M = ncMeta(), settled = M.settled || []; let next = NEWCOMERS.find(id => !settled.includes(id));
  if (next && settled.length && M.day === today()) next = null;
  NEWCOMERS.forEach(id => { const n = NPC_BY[id]; const wasNot = n.notYet;
    if (settled.includes(id)){ n.notYet = false; n.lost = false; delete n.post; }
    else if (id === next){ n.notYet = false; n.lost = true; n.post = [-1 + NEWCOMERS.indexOf(id) % 3, -18]; }
    else { n.notYet = true; n.lost = false; delete n.post; }
  });
}
Store.on('placed', newcomerState); newcomerState();
// lost newcomers look around and ask for help
const _npcOptions7 = npcOptions;
npcOptions = function(np){
  const n = np.n;
  if (n.lost){ return G.tour && G.tour.np === np ? [['tourstat','어디 남았지?'],['bye','잠깐만!']] : [['tour','마을 구경시켜 줄게!'],['chat','이야기하기'],['bye','잘 가']]; }
  return _npcOptions7(np);
};
const _talkTo7 = talkTo;
talkTo = function(np, preset){
  if (np && np.n && np.n.lost && !preset){
    const L = LINES[np.n.id], rel = relOf(np.n.id);
    if (G.tour && G.tour.np === np){ if (G.tour.seen.length >= 3) return finishTour(np); return _talkTo7(np, ['아직 '+(3-G.tour.seen.length)+'곳 더 보고 싶어요! 앞장서 주세요.']); }
    if (!rel.met){ rel.met = true; rel.f += 1; return _talkTo7(np, L.intro.concat(['혹시… 이 마을 구경 좀 시켜 줄 수 있어요? 명소 세 군데만 알려 주면 정말 고마울 것 같아요!'])); }
    return _talkTo7(np, [pickL(L.lost), '마을 명소 세 군데만 보여 주세요… 부탁해요!']);
  }
  return _talkTo7(np, preset);
};
const _chooseV6b = chooseV6;
chooseV6 = function(o){
  if (o === 'tour'){ const np = dlg.np; G.tour = { np, seen:[], t:0 }; np.path = []; sayMore(['정말요?! 고마워요! 졸졸 따라갈게요. 명소 근처로 데려가 주세요!']); dlg.closing = true; toast('마을 구경 미션! '+np.n.name+'에게 명소 3곳을 보여 주세요 (광장, 쇼핑몰, 꽃밭, 항구…)', 3200); return true; }
  if (o === 'tourstat'){ const T2 = G.tour; sayMore(['지금까지 본 곳: '+(T2.seen.map(id => LANDMARKS.find(l => l.id===id).name).join(', ') || '아직 없어요')+'. '+(3-T2.seen.length)+'곳 남았어요!']); return true; }
  if (o === 'svc' && G.inside && G.inside.shop === 'police'){ sayMore(['탈것으로 주민을 치면 출동해서 벌금 도토리 100개를 받아요.', '다친 주민은 병원에 10분 동안 입원해요. 병실이 꽉 차면 자기 집에서 쉬어요.', '기차 선로도 조심! 두 번 연속 치이면 기절해요.']); return true; }
  if (o === 'svc' && G.inside && G.inside.shop === 'jobk'){ endDialog(); openJobAgency(); return true; }
  return _chooseV6b(o);
};
function tourTick(dt){
  const T2 = G.tour; if (!T2) return; const np = T2.np, me = chars[G.slot]; if (!me) return;
  if (!np.n.lost || np.hidden){ G.tour = null; return; }
  if (G.inside || G.ride || G.boat){ np.g.visible = false; return; }
  // follow the guide
  np.override = false;
  const d = Math.hypot(me.x-np.x, me.z-np.z);
  if (d > 14){ const [i,j] = nearestFree(me.x - Math.sin(me.face)*1.4, me.z - Math.cos(me.face)*1.4); np.i = i; np.j = j; np.x = wx(i); np.z = wz(j); np.path = []; }
  else if (d > 1.8){ T2.rp = (T2.rp||0) - dt; if (T2.rp <= 0 || !np.path.length){ T2.rp = 0.6; const p = bfs(np.i, np.j, (i,j) => Math.abs(i-me.i)+Math.abs(j-me.j) <= 1 && !(i===me.i && j===me.j)); np.path = p ? p.slice(0, 40) : []; } }
  else np.path = [];
  // landmarks
  T2.t += dt; if (T2.t < 0.5) return; T2.t = 0;
  LANDMARKS.forEach(L => { if (T2.seen.includes(L.id) || T2.seen.length >= 3) return; if (Math.hypot(me.x-L.x, me.z-L.z) < 5 && d < 7){ T2.seen.push(L.id); say(np, L.say, 3000); toast(L.name+' 소개 완료! ('+T2.seen.length+'/3)', 2000); doAnim('cheer');
    if (T2.seen.length >= 3) setTimeout(() => toast(np.n.name+'에게 말을 걸어 마무리해요!', 2600), 2200); } });
}
function finishTour(np){
  const id = np.n.id, M = ncMeta(); const settled = (M.settled || []).concat([id]);
  Store.setPlaced('meta_newcomers', { settled, day:today(), by:G.slot });
  G.tour = null; relOf(id).f += 8; earn(1000); saveMe();
  setTimeout(() => pop('마을 구경 미션 완료!', np.n.name+'이(가) 마을 주민이 됐어요<br>도토리 +1000 · 호감도 UP'), 500);
  np.n.lost = false; delete np.n.post;
  return _talkTo7(np, ['보여 준 곳들 전부 마음에 들어요! 이 마을로 오길 정말 잘했어요.', LINES[id].settle[0], '이건 고마움의 표시예요. 도토리 1000개!']);
}
// lost ones mumble
let lostT = 6;
function lostTick(dt){ lostT -= dt; if (lostT > 0) return; lostT = 9; NEWCOMERS.forEach(id => { const np = npcs[id]; if (np && np.n.lost && np.g.visible && !(G.tour && G.tour.np === np) && !np.talking) say(np, pickL(lostLines), 2600); }); }

/* ---------- 숲밭섬 plots: buy at the sign, hire a part-timer at JOB꼬리아 ---------- */
const PLOT_PRICE = 1500, JOB_FEE = 10;
function openPlot(P){
  G.panel = 'plot'; const own = Store.data.placed['plot_'+P.id], job = Store.data.placed['job_'+P.id];
  let body = '<div class="card"><div class="k"><b>숲밭섬 '+P.name+'</b><span>50칸 (10×5)</span></div>';
  if (!own) body += '<span>아직 주인이 없는 밭이에요. 사면 표지판에 이름이 적혀요. 직접 농사짓거나 JOB꼬리아에서 알바생을 구할 수 있어요.</span><button class="go" id="buyPlot">도토리 '+PLOT_PRICE+'에 사기</button>';
  else if (own.owner === G.slot){ body += '<span>'+esc(own.name)+'님의 밭이에요.</span>';
    if (job){ const st = jobState(job); body += '<span class="note">알바생이 '+CROPS[job.crop].name+' 농사 중 · '+job.cycle+'/2회차 · '+(st.ripe ? '수확 중!' : '다 자라려면 '+hrs(st.left)+'')+'<br>받을 수확물: '+(job.box||0)+'개</span>'+(job.done || job.box ? '<button class="go" id="collect">수확물 받기</button>' : ''); }
    else body += '<span class="note">씨앗을 직접 심어도 되고, JOB꼬리아(도토리섬 북쪽)에서 알바생을 구하면 50칸을 심고 두 번 수확까지 해 줘요.</span>'; }
  else body += '<span>'+esc(own.name||'가족')+'님의 밭이에요.</span>';
  openPanel('밭 표지판', body+'</div>', { half:true });
  const bp = $('#buyPlot'); if (bp) bp.addEventListener('click', () => { if (Store.data.placed['plot_'+P.id]){ toast('방금 누가 샀어요!'); return; } if (G.me.acorns < PLOT_PRICE){ toast('도토리가 모자라요'); return; } G.me.acorns -= PLOT_PRICE; updateHud(); saveMe(); Store.setPlaced('plot_'+P.id, { t:'plot', owner:G.slot, name:G.me.name, at:Date.now() }); pop('밭 구매!', '숲밭섬 '+P.name+'의 주인이 됐어요'); doAnim('cheer'); setTimeout(() => openPlot(P), 300); });
  const cb = $('#collect'); if (cb) cb.addEventListener('click', () => collectJob(P));
}
function jobState(job){ const C = CROPS[job.crop], g = (Date.now() - job.plantedAt)/3600000; return { C, g, frac:g/C.hours, ripe:g >= C.hours, left:C.hours - g }; }
function collectJob(P){ const job = Store.data.placed['job_'+P.id]; if (!job || !job.box){ toast('아직 받을 수확물이 없어요'); return; } addItem('c_'+job.crop, job.box); const n = job.box; if (job.done) Store.delPlaced('job_'+P.id); else Store.setPlaced('job_'+P.id, Object.assign({}, job, { box:0 })); saveMe(); pop('수확물 도착!', CROPS[job.crop].name+' '+n+'개를 받았어요'); closePanel(); }
function openJobAgency(){
  G.panel = 'jobk'; const mine = PLOTS.filter(P => { const o = Store.data.placed['plot_'+P.id]; return o && o.owner === G.slot; });
  let body = '<p class="note">알바비 도토리 '+JOB_FEE+'개 + 씨앗 50개를 맡기면, 알바생이 내 밭 50칸에 심고 물 주고 <b>두 번 수확</b>까지 해 줘요. (한 번에 50개씩, 모두 100개) 수확물은 밭 표지판에서 받아요.</p>';
  if (!mine.length) body += '<div class="card"><span>숲밭섬에 내 밭이 없어요. 먼저 밭 표지판에서 밭을 사 주세요.</span></div>';
  mine.forEach(P => { const job = Store.data.placed['job_'+P.id];
    body += '<div class="card"><div class="k"><b>'+P.name+'</b><span>'+(job ? '알바생 일하는 중' : '비어 있음')+'</span></div>';
    if (job){ const st = jobState(job); body += '<span class="note">'+CROPS[job.crop].name+' · '+job.cycle+'/2회차 · 받을 수확물 '+(job.box||0)+'개'+(job.done?' · 다 끝났어요!':'')+'</span>'; }
    else { const seeds = Object.entries(G.me.seeds||{}).filter(([,n]) => n >= 50);
      body += seeds.length ? '<div class="seg">'+seeds.map(([id,n]) => '<button data-hire="'+P.id+':'+id+'">'+CROPS[id].name+' 씨앗 맡기기 ('+n+'개 있음)</button>').join('')+'</div>' : '<span class="note">같은 씨앗이 50개 이상 있어야 해요. 잡화점에서 사 와요.</span>'; }
    body += '</div>'; });
  openPanel('JOB꼬리아 · 알바생 모집', body, { half:true });
  $('#pbody').querySelectorAll('[data-hire]').forEach(b => b.addEventListener('click', () => {
    const [pidx, crop] = b.dataset.hire.split(':'), P = PLOTS.find(x => x.id === pidx);
    const busy = []; for (let z=P.z0; z<=P.z1; z++) for (let x=P.x0; x<=P.x1; x++) if (Store.data.placed['farm_'+x+'_'+z]) busy.push(1);
    if (busy.length){ toast('밭에 직접 심은 작물이 '+busy.length+'칸 있어요. 먼저 수확하거나 비워 주세요'); return; }
    if (G.me.acorns < JOB_FEE){ toast('알바비가 모자라요'); return; }
    if (!(G.me.seeds[crop] >= 50)){ toast('씨앗이 모자라요'); return; }
    G.me.seeds[crop] -= 50; spend(JOB_FEE); saveMe();
    Store.setPlaced('job_'+P.id, { t:'job', crop, cycle:1, plantedAt:Date.now(), box:0, done:false, owner:G.slot, ownerName:G.me.name });
    pop('알바생 출동!', P.name+'에 '+CROPS[crop].name+' 50칸을 심으러 갔어요<br><small>다 자라면 알바생이 수확해서 표지판에 맡겨 둬요</small>'); openJobAgency(); }));
}
// part-timers' work: grow, harvest, replant once, then finish
let jobRoot = null; const jobMeshes = new Map(), workers = {};
function jobTick(dt, tsec){
  PLOTS.forEach(P => { const job = Store.data.placed['job_'+P.id];
    if (job && !job.done && !Store.readOnly){ const st = jobState(job); if (st.ripe && (job.owner === G.slot || !Store.data.players[pid(job.owner)] || Date.now() - (Store.data.players[pid(job.owner)].at||0) > 600000)){
      const add = 50, nj = Object.assign({}, job, { box:(job.box||0) + add });
      if (job.cycle >= 2){ nj.done = true; nj.plantedAt = job.plantedAt; } else { nj.cycle = 2; nj.plantedAt = Date.now(); }
      Store.setPlaced('job_'+P.id, nj); if (job.owner === G.slot) toast('알바생이 '+P.name+'에서 '+st.C.name+' '+add+'개를 수확했어요!', 2600); } }
    // the worker
    let w = workers[P.id];
    if (job && !job.done){ if (!w){ const n = { bunny:null, look:{ skin:'#ffe2cc', hair:'short', hairColor:'#c8a080', eyes:'smile', mouth:'open', animal:{ type:'dog', fur:'#c8a080', inner:'#f2d2b0' } }, wear:{ set:'overalls', hat:'straw' } };
        const g = new THREE.Group(), m = Char3D.build(THREE, npcLook(n)); g.add(m); scene.add(g); const can = toolProp('can'); can.position.set(0,-0.24,0.02); m.userData.arms[1].add(can);
        const lbl = makeLabel('알바생'); w = workers[P.id] = { g, m, lbl, t:Math.random()*10 }; }
      w.t += dt; const L = (P.x1-P.x0), row = Math.floor(w.t/ (L/1.2)) % 5, pos = (w.t*1.2) % L, x = P.x0 + (row % 2 ? L - pos : pos), z = P.z0 + row;
      w.g.position.set(x, 0, z); w.g.rotation.y = row % 2 ? -Math.PI/2 : Math.PI/2; const U = w.m.userData, s2 = Math.sin(w.t*10)*0.5; U.legs[0].rotation.x = s2; U.legs[1].rotation.x = -s2; U.arms[1].rotation.x = -1.2;
      w.g.visible = !G.inside;
      if (G.inside || G.focus){ w.lbl.hidden = true; } else { _v.set(x, 1.7, z).project(cam); w.lbl.hidden = _v.z > 1; w.lbl.style.left = ((_v.x+1)/2*window.innerWidth)+'px'; w.lbl.style.top = ((1-_v.y)/2*window.innerHeight)+'px'; } }
    else if (w){ scene.remove(w.g); w.lbl.remove(); delete workers[P.id]; }
  });
}
function syncJobCrops(){
  if (!jobRoot){ jobRoot = new THREE.Group(); scene.add(jobRoot); }
  const seen = new Set();
  PLOTS.forEach(P => { const job = Store.data.placed['job_'+P.id]; if (!job || job.done) return; const st = jobState(job), stage = st.ripe ? 3 : st.frac >= 0.45 ? 2 : st.frac > 0.02 ? 1 : 0;
    for (let z=P.z0; z<=P.z1; z++) for (let x=P.x0; x<=P.x1; x++){ const k = 'j_'+x+'_'+z, sig = job.crop+stage+job.cycle; seen.add(k); const cur = jobMeshes.get(k); if (cur && cur.sig === sig) continue; if (cur) jobRoot.remove(cur.g); const g = cropModel({ c:job.crop }, { stage }); g.position.set(x, 0, z); jobRoot.add(g); jobMeshes.set(k, { g, sig }); }
    if (soilMesh) soilMesh.userData.cells.forEach(([i,j],n) => { if (plotAt(wx(i), wz(j)) === P) soilMesh.setColorAt(n, new THREE.Color('#b8906c')); });
  });
  if (soilMesh && soilMesh.instanceColor) soilMesh.instanceColor.needsUpdate = true;
  jobMeshes.forEach((v,k) => { if (!seen.has(k)){ jobRoot.remove(v.g); jobMeshes.delete(k); } });
}
const _syncCrops5 = syncCrops;
syncCrops = function(){ _syncCrops5(); syncJobCrops(); };
