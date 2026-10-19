/* ================= v12b: 배경음악 20곡 (WebAudio로 직접 연주) — 시간·계절·장소·이벤트에 맞춰 자동으로, 또는 직접 골라서 ================= */

const SCALES = { major:[0,2,4,5,7,9,11], minor:[0,2,3,5,7,8,10], hminor:[0,2,3,5,7,8,11], dorian:[0,2,3,5,7,9,10] };
// prog: scale degrees (1 = tonic). lead/pad/bass/drum = sound + pattern styles. seed makes each melody its own.
const BGM_TRACKS = [
  { id:'morning', name:'도토리 마을의 아침', mood:'아침', bpm:100, key:60, scale:'major', meter:4, prog:[1,5,6,4], progB:[4,5,3,6], lead:'marimba', pad:'arp', bass:'bounce', drum:'soft', seed:11 },
  { id:'stroll', name:'햇살 산책', mood:'낮', bpm:112, key:67, scale:'major', meter:4, prog:[1,4,5,1], progB:[6,4,2,5], lead:'square', pad:'comp', bass:'bounce', drum:'pop', seed:23 },
  { id:'nap', name:'오후의 낮잠', mood:'오후', bpm:82, key:65, scale:'major', meter:4, prog:[1,3,4,5], progB:[6,3,4,4], lead:'flute', pad:'pad', bass:'half', drum:'none', seed:37 },
  { id:'sunset', name:'노을 지는 길', mood:'저녁', bpm:76, key:62, scale:'major', meter:4, prog:[1,6,4,5], progB:[4,1,2,5], lead:'epiano', pad:'pad', bass:'half', drum:'brush', seed:41 },
  { id:'lullaby', name:'별빛 자장가', mood:'밤', bpm:66, key:69, scale:'major', meter:3, prog:[1,4,1,5], progB:[6,4,2,5], lead:'musicbox', pad:'waltz', bass:'waltz', drum:'none', seed:53 },
  { id:'firefly', name:'반딧불 숲', mood:'여름밤', bpm:72, key:64, scale:'dorian', meter:4, prog:[1,4,1,7], progB:[3,4,5,1], lead:'flute', pad:'pad', bass:'half', drum:'none', seed:61 },
  { id:'spring', name:'봄 꽃바람', mood:'봄', bpm:104, key:64, scale:'major', meter:4, prog:[1,4,6,5], progB:[2,5,1,6], lead:'whistle', pad:'arp', bass:'bounce', drum:'soft', seed:71 },
  { id:'beach', name:'여름 바닷가', mood:'여름', bpm:120, key:65, scale:'major', meter:4, prog:[1,4,5,4], progB:[6,5,4,5], lead:'pluck', pad:'reggae', bass:'bounce', drum:'island', seed:83 },
  { id:'leaves', name:'가을 낙엽 왈츠', mood:'가을', bpm:96, key:57, scale:'minor', meter:3, prog:[1,4,7,3], progB:[6,2,5,1], lead:'epiano', pad:'waltz', bass:'waltz', drum:'none', seed:97 },
  { id:'snow', name:'겨울 눈송이', mood:'겨울', bpm:88, key:72, scale:'major', meter:4, prog:[1,5,6,3], progB:[4,1,4,5], lead:'bell', pad:'pad', bass:'half', drum:'sleigh', seed:101 },
  { id:'home', name:'우리 집이 최고야', mood:'집 안', bpm:80, key:65, scale:'major', meter:4, prog:[1,6,2,5], progB:[4,3,2,5], lead:'epiano', pad:'pad', bass:'walk', drum:'brush', seed:113 },
  { id:'mall', name:'몽실 쇼핑몰', mood:'쇼핑몰', bpm:118, key:62, scale:'major', meter:4, prog:[4,5,3,6], progB:[2,5,1,1], lead:'square', pad:'comp', bass:'walk', drum:'pop', seed:127, sev:true },
  { id:'cafe', name:'보보 카페 보사노바', mood:'카페', bpm:92, key:67, scale:'major', meter:4, prog:[2,5,1,6], progB:[4,7,3,6], lead:'whistle', pad:'bossa', bass:'bossa', drum:'bossa', seed:131, sev:true },
  { id:'bank', name:'은행 시계탑', mood:'은행·가게', bpm:100, key:60, scale:'major', meter:4, prog:[1,4,2,5], progB:[6,2,5,1], lead:'marimba', pad:'comp', bass:'half', drum:'tick', seed:139 },
  { id:'clinic', name:'병원의 쉼표', mood:'병원', bpm:68, key:65, scale:'major', meter:4, prog:[1,4,1,5], progB:[4,6,4,5], lead:'musicbox', pad:'pad', bass:'half', drum:'none', seed:149 },
  { id:'train', name:'칙칙폭폭 기차 여행', mood:'기차', bpm:132, key:62, scale:'major', meter:4, prog:[1,1,4,5], progB:[6,4,5,5], lead:'square', pad:'comp', bass:'bounce', drum:'train', seed:157 },
  { id:'plaza', name:'광장 축제', mood:'광장', bpm:126, key:67, scale:'major', meter:4, prog:[1,5,4,5], progB:[6,4,1,5], lead:'pluck', pad:'arp', bass:'bounce', drum:'pop', seed:163 },
  { id:'halloween', name:'할로윈 호박등', mood:'할로윈', bpm:108, key:57, scale:'hminor', meter:4, prog:[1,6,4,5], progB:[1,4,6,5], lead:'spooky', pad:'arp', bass:'bounce', drum:'soft', seed:173 },
  { id:'lulu', name:'루루의 선물 상자', mood:'루루', bpm:110, key:72, scale:'major', meter:3, prog:[1,4,5,1], progB:[6,4,5,5], lead:'bell', pad:'waltz', bass:'waltz', drum:'none', seed:181 },
  { id:'dream', name:'꿈나라 구름', mood:'새벽', bpm:58, key:60, scale:'major', meter:4, prog:[1,4,6,4], progB:[1,3,4,5], lead:'flute', pad:'pad', bass:'whole', drum:'none', seed:191 },
];
const BGM_BY = Object.fromEntries(BGM_TRACKS.map((t, i) => [t.id, i]));

/* ---------- composing (once per track, deterministic) ---------- */
function bgmRng(seed){ let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const RHY4 = [[2,2,2,2],[3,1,2,2],[2,1,1,2,2],[4,2,2],[2,2,4],[1,1,2,1,1,2],[3,1,4],[2,2,3,1],[6,2],[8]];
const RHY3 = [[2,2,2],[4,2],[2,4],[3,1,2],[1,1,2,2],[6]];
function compose(T){
  if (T.c) return T.c;
  const R = bgmRng(T.seed), sc = SCALES[T.scale], spb = 2, bar = T.meter * spb, rhy = T.meter === 3 ? RHY3 : RHY4;
  const deg = (d, oct) => { const i = d - 1, o = Math.floor(i / 7); return T.key + sc[((i % 7) + 7) % 7] + 12*(o + (oct || 0)); };
  const chordOf = d => [deg(d), deg(d + 2), deg(d + 4)].concat(T.sev ? [deg(d + 6)] : []);
  const pick = a => a[Math.floor(R()*a.length)];
  // melody for one 4-bar phrase over a progression
  const phrase = (prog, motif) => {
    const out = []; let cur = deg(1, 1) + 0;
    prog.forEach((d, b) => {
      const ch = chordOf(d).map(n => n + 12), r = (motif && b < 2) ? motif[b] : pick(rhy), notes = []; let pos = 0;
      r.forEach((len, k) => {
        let n;
        if (k === 0 || len >= 4){ n = ch.reduce((best, c) => Math.abs(c - cur) < Math.abs(best - cur) ? c : best, ch[0]); if (R() < 0.3) n = pick(ch); }
        else { const steps = sc.map(s => s + T.key + 12).concat(sc.map(s => s + T.key + 24)); const idx = steps.indexOf(steps.reduce((bst, s) => Math.abs(s - cur) < Math.abs(bst - cur) ? s : bst, steps[0])); n = steps[Math.max(0, Math.min(steps.length - 1, idx + pick([-2,-1,-1,1,1,2])))]; }
        if (R() < 0.08 && k > 0) n = null; // breath
        notes.push({ pos, len, n }); if (n) cur = n; pos += len;
      });
      if (b === prog.length - 1){ const last = notes[notes.length - 1]; last.n = ch[0]; } // land on the chord root
      out.push({ r, notes });
    });
    return out;
  };
  const A = phrase(T.prog), A2 = phrase(T.prog, [A[0].r, A[1].r]), B = phrase(T.progB), A3 = phrase(T.prog, [A[0].r, A[1].r]);
  A2[0] = A[0]; A2[1] = A[1]; A3[0] = A[0]; A3[1] = A[1];
  const bars = [], progAll = T.prog.concat(T.prog, T.progB, T.prog), mel = A.concat(A2, B, A3);
  progAll.forEach((d, b) => bars.push({ chord:chordOf(d), root:deg(d, -1), mel:mel[b].notes }));
  return T.c = { bars, bar, spb, steps:bars.length * bar };
}

/* ---------- sounds ---------- */
let bgmOut = null;
function leadNote(ac, t, f, dur, kind, g){
  const o = bgmOut;
  switch (kind){
    case 'marimba': tone(ac, o, t, f, 0, 'triangle', 0.004, 0.45, 0.32*g); tone(ac, o, t, f*4, 0, 'sine', 0.002, 0.08, 0.05*g); break;
    case 'musicbox': tone(ac, o, t, f*2, 0, 'sine', 0.002, 0.9, 0.25*g); tone(ac, o, t, f*6, 0, 'sine', 0.001, 0.2, 0.04*g); break;
    case 'bell': tone(ac, o, t, f*2, 0, 'sine', 0.002, 1.2, 0.2*g); tone(ac, o, t, f*2*2.76, 0, 'sine', 0.002, 0.35, 0.05*g); break;
    case 'flute': tone(ac, o, t, f*2, dur*0.9, 'sine', 0.06, 0.12, 0.2*g, { vib:5, sus:true }); break;
    case 'whistle': tone(ac, o, t, f*2, dur*0.85, 'sine', 0.025, 0.08, 0.17*g, { vib:6, sus:true }); break;
    case 'square': tone(ac, o, t, f, dur*0.7, 'square', 0.01, 0.06, 0.07*g, { lp:1700, sus:true }); break;
    case 'pluck': tone(ac, o, t, f, 0, 'triangle', 0.003, 0.32, 0.3*g, { lp:2600 }); tone(ac, o, t, f*2, 0, 'sine', 0.003, 0.12, 0.06*g); break;
    case 'epiano': tone(ac, o, t, f, 0, 'sine', 0.006, 1.0, 0.26*g); tone(ac, o, t, f*2, 0, 'triangle', 0.004, 0.3, 0.05*g); break;
    case 'spooky': tone(ac, o, t, f, dur*0.85, 'triangle', 0.03, 0.15, 0.2*g, { vib:7, sus:true, lp:2000 }); break;
  }
}
function padChord(ac, t, ch, dur, g){ ch.forEach(n => tone(ac, bgmOut, t, MIDI(n), dur*0.95, 'triangle', 0.25, 0.4, 0.035*g, { lp:1100, sus:true })); }
function stab(ac, t, ch, g, len){ ch.forEach(n => tone(ac, bgmOut, t, MIDI(n), len || 0, 'triangle', 0.005, 0.18, 0.05*g, { lp:1800 })); }
function bassNote(ac, t, n, dur, g){ tone(ac, bgmOut, t, MIDI(n), dur*0.8, 'triangle', 0.01, 0.12, 0.2*g, { lp:600, sus:true }); }
const DRUMS = {
  soft:  { 4:['k...h...k.k.h...'] }, pop:{ 4:['k.h.s.h.k.hks.h.'] }, brush:{ 4:['k..hs..hk..hs.hh'] }, island:{ 4:['k..sh.k.k..sh.s.'] },
  sleigh:{ 4:['hhhhhhhhhhhhhhhh'] }, bossa:{ 4:['k..h.sh.k.h..sh.'] }, tick:{ 4:['h...h...h...h...'] }, train:{ 4:['khshkhshkhshkhsh'] }, none:{},
};
function drum(ac, t, ch, g){ if (ch === 'k') hit(ac, bgmOut, t, 'kick', 0.35*g); else if (ch === 's') hit(ac, bgmOut, t, 'snare', 0.12*g); else if (ch === 'h') hit(ac, bgmOut, t, 'hat', 0.06*g); }

function playStep(ac, T, step, t){
  const C = compose(T), sd = 60 / T.bpm / C.spb, bi = Math.floor(step / C.bar), s = step % C.bar, B = C.bars[bi];
  const swing = (T.drum === 'bossa' || T.lead === 'epiano') && s % 2 ? sd*0.12 : 0, tt = t + swing;
  B.mel.forEach(m => { if (m.pos === s && m.n) leadNote(ac, tt, MIDI(m.n), m.len*sd, T.lead, 1); });
  const beat = s / C.spb, onBeat = s % C.spb === 0;
  switch (T.pad){
    case 'pad': if (s === 0) padChord(ac, t, B.chord, C.bar*sd, 1); break;
    case 'arp': { const ch = B.chord.concat([B.chord[0] + 12]); tone(ac, bgmOut, t, MIDI(ch[s % ch.length]), 0, 'sine', 0.004, 0.3, 0.06, {}); break; }
    case 'comp': if (s % 4 === 2) stab(ac, tt, B.chord, 1); break;
    case 'reggae': if (s % 4 === 2) stab(ac, t, B.chord.map(n => n + 12), 1.1); break;
    case 'waltz': if (onBeat && beat > 0) stab(ac, t, B.chord, 0.9); break;
    case 'bossa': if ([0,3,6,10,13].includes(s % 16)) stab(ac, t, B.chord, 0.8); break;
  }
  switch (T.bass){
    case 'whole': if (s === 0) bassNote(ac, t, B.root, C.bar*sd, 1); break;
    case 'half': if (s % (C.bar/2) === 0) bassNote(ac, t, s ? B.root + 7 : B.root, C.bar/2*sd, 1); break;
    case 'bounce': if (onBeat) bassNote(ac, t, beat % 2 ? B.root + 7 : B.root, sd*1.6, 1); break;
    case 'walk': if (onBeat) bassNote(ac, tt, B.root + [0, 4, 7, 9][beat % 4], sd*1.8, 1); break;
    case 'waltz': if (s === 0) bassNote(ac, t, B.root, sd*2, 1); break;
    case 'bossa': if (s === 0 || s === 3 || s === 4) bassNote(ac, t, s === 0 ? B.root : B.root + 7, sd*1.4, 1); break;
  }
  const D = DRUMS[T.drum] && DRUMS[T.drum][4]; if (D){ const pat = D[0]; drum(ac, t, pat[(step % 16)], 1); }
}

/* ---------- player ---------- */
const BGM = (() => { let st = {}; try{ st = JSON.parse(LS.get('dv.bgm', '{}')) || {}; }catch(e){} return { on:st.on !== false, vol:st.vol == null ? 0.6 : st.vol, pick:st.pick == null ? null : st.pick, cur:-1, step:0, nextT:0, switching:0, unlocked:false }; })();
function bgmSave(){ LS.set('dv.bgm', JSON.stringify({ on:BGM.on, vol:BGM.vol, pick:BGM.pick })); }
function autoTrack(){
  const h = hourNow(), s = season(), me = chars[G.slot];
  if (G.rescue || (G.inside && G.inside.shop === 'hospital')) return BGM_BY.clinic;
  if (lulu && (lulu.mode === 'visit') && G.me && G.me.welcome) return BGM_BY.lulu;
  if (G.ride) return BGM_BY.train;
  if (G.inside){ const I = G.inside; if (I.kind === 'home' || I.kind === 'nhome') return BGM_BY.home; if (I.shop === 'mall') return BGM_BY.mall; if (I.shop === 'cafe') return BGM_BY.cafe; return BGM_BY.bank; }
  if (h < 5) return BGM_BY.dream;
  if (HW_ON && (h >= 17 || h < 5)) return BGM_BY.halloween;
  if (h >= 20) return s === 'summer' ? BGM_BY.firefly : BGM_BY.lullaby;
  if (h >= 17) return BGM_BY.sunset;
  if (me && Math.hypot(me.x - wx(SPAWN[0]), me.z - wz(SPAWN[1])) < 7 && h >= 11) return BGM_BY.plaza;
  if (h < 9) return BGM_BY.morning;
  if (h >= 14.5) return HW_ON && s === 'autumn' && h >= 15.5 ? BGM_BY.halloween : BGM_BY.nap;
  const day = new Date().getDate(); // alternate the daytime song with the season's song
  if ((day + Math.floor(h)) % 2) return { spring:BGM_BY.spring, summer:BGM_BY.beach, autumn:BGM_BY.leaves, winter:BGM_BY.snow }[s] ?? BGM_BY.stroll;
  return BGM_BY.stroll;
}
function bgmTarget(){ return BGM.vol * 0.55 * (G.music ? 0.15 : 1) * (document.hidden ? 0 : 1); }
function bgmTick(){
  if (!BGM.unlocked || !AC || !G.started) return; const ac = AC;
  if (!bgmOut){ bgmOut = ac.createGain(); bgmOut.gain.value = 0; bgmOut.connect(ac.destination); }
  if (!BGM.on || document.hidden){ bgmOut.gain.setTargetAtTime(0, ac.currentTime, 0.25); if (!BGM.on) return; }
  const want = BGM.pick != null ? BGM.pick : autoTrack();
  if (want !== BGM.cur && !BGM.switching){
    if (BGM.cur < 0){ BGM.cur = want; BGM.step = 0; BGM.nextT = ac.currentTime + 0.15; }
    else { BGM.switching = ac.currentTime + 1.0; bgmOut.gain.setTargetAtTime(0, ac.currentTime, 0.25); }
  }
  if (BGM.switching){ if (ac.currentTime < BGM.switching) return; BGM.switching = 0; BGM.cur = want; BGM.step = 0; BGM.nextT = ac.currentTime + 0.1; }
  if (!document.hidden) bgmOut.gain.setTargetAtTime(bgmTarget(), ac.currentTime, 0.4);
  const T = BGM_TRACKS[BGM.cur], C = compose(T), sd = 60 / T.bpm / C.spb;
  if (BGM.nextT < ac.currentTime - 0.5) BGM.nextT = ac.currentTime + 0.05; // tab was asleep
  while (BGM.nextT < ac.currentTime + 0.3){ playStep(ac, T, BGM.step, BGM.nextT); BGM.nextT += sd; BGM.step = (BGM.step + 1) % C.steps; }
  if (G.panel === 'bgm'){ const el = $('#bgmNow'); if (el){ const txt = '♪ ' + T.name + (BGM.pick == null ? ' · 자동' : ''); if (el.textContent !== txt) el.textContent = txt; } }
}
setInterval(bgmTick, 90);
document.addEventListener('pointerdown', () => { if (!BGM.unlocked){ BGM.unlocked = true; audio(); } else if (AC && AC.state === 'suspended') AC.resume(); }, true);
document.addEventListener('keydown', () => { if (!BGM.unlocked){ BGM.unlocked = true; audio(); } }, true);

function openBgm(){
  G.panel = 'bgm';
  const cur = BGM_TRACKS[BGM.cur];
  openPanel('배경음악', '<div class="buybar"><span id="bgmNow">'+(cur ? '♪ '+esc(cur.name) : '♪ 화면을 한 번 터치하면 시작해요')+'</span><button class="go" id="bgmOn">'+(BGM.on ? '끄기' : '켜기')+'</button></div>'+
    '<div class="chatin" style="align-items:center"><span class="note" style="flex:0 0 auto;margin:0">소리</span><input type="range" id="bgmVol" min="0" max="1" step="0.05" value="'+BGM.vol+'" style="flex:1;padding:0;border:0;background:none"></div>'+
    '<div class="grid"><div class="cell'+(BGM.pick == null ? ' on' : '')+'" data-bt="auto"><div class="sw" style="background:linear-gradient(90deg,#ffd6a8,#c8b0f8)"></div>자동 선곡<b>시간·장소에 맞춰</b></div>'+
    BGM_TRACKS.map((t, i) => '<div class="cell'+(BGM.pick === i ? ' on' : '')+'" data-bt="'+i+'"><div class="sw" style="background:hsl('+(i*37 % 360)+',70%,82%)"></div>'+esc(t.name)+'<b>'+esc(t.mood)+'</b></div>').join('')+'</div>'+
    '<p class="note">자동 선곡은 아침·낮·저녁·밤, 계절, 집·가게·카페·기차·병원, 할로윈, 루루가 찾아올 때마다 음악이 바뀌어요. 악기를 연주하면 배경음악이 작아져요.</p>', { half:true });
  $('#bgmOn').addEventListener('click', () => { BGM.on = !BGM.on; BGM.unlocked = true; audio(); bgmSave(); openBgm(); });
  $('#bgmVol').addEventListener('input', e => { BGM.vol = Number(e.target.value); bgmSave(); });
  $('#pbody').querySelectorAll('[data-bt]').forEach(el => el.addEventListener('click', () => { BGM.unlocked = true; audio(); BGM.on = true; BGM.pick = el.dataset.bt === 'auto' ? null : Number(el.dataset.bt); bgmSave(); openBgm(); }));
}
menuPop.addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (b && b.dataset.m === 'bgm') openBgm(); });

// test helper: render a track offline and measure loudness
window.__bgmRender = async (i, secs) => { const T = BGM_TRACKS[i], C = compose(T), sr = 22050, oc = new OfflineAudioContext(1, sr*secs, sr); const keep = bgmOut; bgmOut = oc.createGain(); bgmOut.gain.value = 0.55; bgmOut.connect(oc.destination);
  const sd = 60 / T.bpm / C.spb; let t = 0.05, st = 0; while (t < secs - 0.5){ playStep(oc, T, st, t); t += sd; st = (st + 1) % C.steps; }
  const buf = await oc.startRendering(); bgmOut = keep; const d = buf.getChannelData(0); let pk = 0, sq = 0; for (let k = 0; k < d.length; k++){ const v = Math.abs(d[k]); if (v > pk) pk = v; sq += v*v; } return { name:T.name, peak:+pk.toFixed(3), rms:+Math.sqrt(sq/d.length).toFixed(4), wav: i === window.__wavI ? Array.from(d.filter((_, k) => k % 1 === 0)) : null }; };
