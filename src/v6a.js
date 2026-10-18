/* =====================================================================
   v6: action poses & tools, jump, photos, train knockback & open cars, island line,
       bugs & beehives, fire station & hospital rescues, harbor/boats/islets
   ===================================================================== */
/* ---------- action poses (hands move with what you do) ---------- */
const ANIM_DUR = { shake:0.75, hit:0.65, pick:0.6, net:0.6, dig:0.85, water:1.0, wave:0.8, tap:0.4, cheer:0.7, open:0.8, eat:0.8 };
const ANIM_TOOL = { net:'net', dig:'shovel', water:'can' };
function doAnim(type){ G.anim = { type, t:0, dur:ANIM_DUR[type] || 0.6 }; }
function toolProp(id){
  const g = new THREE.Group();
  if (id === 'net'){ M(GC('tp_netS', () => new THREE.CylinderGeometry(0.014,0.014,0.75,6)), '#c8a088', 0, -0.37, 0, g); const ring = M(GC('tp_netR', () => new THREE.TorusGeometry(0.13,0.012,6,16)), '#9fdcc4', 0, -0.86, 0, g); ring.rotation.y = Math.PI/2; const bag = M(GC('tp_netB', () => new THREE.ConeGeometry(0.12,0.2,12,1,true)), new THREE.MeshToonMaterial({ color:'#eef8f4', gradientMap:GRAD, transparent:true, opacity:0.75, side:THREE.DoubleSide }), 0.1, -0.86, 0, g); bag.rotation.z = Math.PI/2; }
  else if (id === 'shovel'){ M(GC('tp_shS', () => new THREE.CylinderGeometry(0.014,0.014,0.55,6)), '#c8a088', 0, -0.28, 0, g); M(GC('tp_shB', () => new THREE.BoxGeometry(0.14,0.17,0.02)), '#c8c0d8', 0, -0.62, 0, g); M(GC('tp_shH', () => new THREE.BoxGeometry(0.12,0.025,0.025)), '#c8a088', 0, -0.02, 0, g); }
  else if (id === 'can'){ const b = M(GC('tp_canB', () => new THREE.CylinderGeometry(0.08,0.09,0.15,12)), '#8fc8f0', 0, -0.06, 0.06, g); const sp = M(GC('tp_canS', () => new THREE.CylinderGeometry(0.01,0.018,0.16,6)), '#8fc8f0', 0, -0.06, 0.18, g); sp.rotation.x = Math.PI/2.4; }
  else if (id === 'rod'){ M(GC('tp_rod', () => new THREE.CylinderGeometry(0.01,0.014,1.1,6)), '#8a5a34', 0, -0.55, 0, g); }
  return g;
}
function syncToolProp(c, want){
  if (c.propModel === c.model && c.propId === want) return;
  if (c.prop && c.prop.parent) c.prop.parent.remove(c.prop);
  c.prop = null; c.propId = want; c.propModel = c.model;
  if (want && c.model && c.model.userData.arms){ c.prop = toolProp(want); c.prop.position.set(0, -0.24, 0.02); c.model.userData.arms[1].add(c.prop); }
}
function actionPose(c, dt, tsec){
  const U = c.model && c.model.userData; if (!U || !U.arms) return;
  elevTick(c);
  const A = G.anim; let tool = (G.me.tool && (TOOLS[G.me.tool] || G.me.tool === 'rod')) ? G.me.tool : null;
  if (G.fishing) tool = null;
  if (A){ A.t += dt; const k = Math.min(1, A.t / A.dur), s = Math.sin(k*Math.PI);
    if (ANIM_TOOL[A.type]) tool = ANIM_TOOL[A.type];
    switch (A.type){
      case 'shake': U.arms[0].rotation.x = U.arms[1].rotation.x = -2.7 + Math.sin(A.t*28)*0.3; U.arms[0].rotation.z = -0.2; U.arms[1].rotation.z = 0.2; break;
      case 'hit': { const ph = (A.t*3.1) % 1; U.arms[1].rotation.x = -2.6 + ph*2.2; U.arms[0].rotation.x = -0.6; break; }
      case 'pick': case 'open': c.model.position.y -= 0.12*s; U.legs[0].rotation.x = U.legs[1].rotation.x = -0.5*s; U.arms[0].rotation.x = U.arms[1].rotation.x = (A.type==='open' ? -2.4 : -1.2)*s; U.head.rotation.x = 0.25*s; break;
      case 'net': U.arms[1].rotation.x = -2.6 + k*2.0; U.arms[1].rotation.z = 0.6 - k*1.0; U.arms[0].rotation.x = -0.4; break;
      case 'dig': { const ph = (A.t*2.4) % 1; U.arms[0].rotation.x = U.arms[1].rotation.x = -1.6 + Math.sin(ph*Math.PI)*0.9; c.model.position.y -= 0.05*s; break; }
      case 'water': U.arms[1].rotation.x = -1.3; U.arms[1].rotation.z = 0.15*Math.sin(A.t*6); if (c.prop) c.prop.rotation.x = 0.5*s; break;
      case 'wave': U.arms[1].rotation.x = -2.8; U.arms[1].rotation.z = 0.35 + Math.sin(A.t*16)*0.35; break;
      case 'tap': U.arms[1].rotation.x = -1.5*s; break;
      case 'cheer': U.arms[0].rotation.x = U.arms[1].rotation.x = -2.9*s; U.arms[0].rotation.z = -0.4*s; U.arms[1].rotation.z = 0.4*s; break;
      case 'eat': U.arms[1].rotation.x = -2.2*s; U.head.rotation.x = -0.1*s; break;
    }
    if (A.t >= A.dur){ G.anim = null; U.arms[0].rotation.z = U.arms[1].rotation.z = 0; U.head.rotation.x = 0; if (c.prop) c.prop.rotation.x = 0; }
  } else if (tool && !c.ride && !G.music){ U.arms[1].rotation.x = Math.min(U.arms[1].rotation.x, -0.35); }
  syncToolProp(c, tool);
  // jump
  if (c.jump){ c.jump.t += dt; const jt = c.jump.t / 0.55; c.jy = jt < 1 ? Math.sin(jt*Math.PI)*0.75 : 0; if (jt >= 1){ c.jump = null; c.jy = 0; } U.legs[0].rotation.x = U.legs[1].rotation.x = c.jy > 0.05 ? -0.5 : U.legs[0].rotation.x; if (c.jy > 0.05 && !A) U.arms[0].rotation.x = U.arms[1].rotation.x = -2.2; }
}
function jump(){
  if (!G.started || G.ride || G.mini || dlg || G.boat || G.down || (G.panel && G.panel !== 'build')) return;
  const me = chars[G.slot]; if (!me || me.jump) return;
  me.jump = { t:0 }; playSfx('jump');
  const k = npcs.kini; if (k && G.me.kini && G.me.kini.on && k.g.visible) k.jump = { t:-0.18 };
}
function npcJumpTick(dt){
  Object.values(npcs).forEach(np => { if (!np.jump) return; np.jump.t += dt; if (np.jump.t < 0) return; const jt = np.jump.t / 0.55; np.model.position.y += jt < 1 ? Math.sin(jt*Math.PI)*0.6 : 0; if (jt >= 1) np.jump = null; });
}
/* tiny sound effects */
function playSfx(kind){
  const ac = audio(); if (!ac) return; const t = ac.currentTime, out = ac.createGain(); out.gain.value = 0.35; out.connect(ac.destination);
  if (kind === 'jump'){ const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(380, t); o.frequency.exponentialRampToValueAtTime(820, t+0.14); g.gain.setValueAtTime(0.4, t); g.gain.exponentialRampToValueAtTime(0.001, t+0.18); o.connect(g); g.connect(out); o.start(t); o.stop(t+0.2); }
  else if (kind === 'shutter'){ hit(ac, out, t, 'hat', 0.6); hit(ac, out, t+0.07, 'snare', 0.3); }
  else if (kind === 'bonk'){ hit(ac, out, t, 'kick', 1); hit(ac, out, t, 'snare', 0.6); }
  else if (kind === 'buzz'){ const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.value = 190; const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 30; lg.gain.value = 30; l.connect(lg); lg.connect(o.frequency); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.12, t+0.05); g.gain.exponentialRampToValueAtTime(0.0001, t+0.6); o.connect(g); g.connect(out); o.start(t); l.start(t); o.stop(t+0.65); l.stop(t+0.65); }
  else if (kind === 'ouch'){ const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(700, t); o.frequency.exponentialRampToValueAtTime(300, t+0.2); g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t+0.25); o.connect(g); g.connect(out); o.start(t); o.stop(t+0.3); }
  else if (kind === 'siren'){ for (let k=0;k<4;k++){ const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(k%2?660:880, t+k*0.35); g.gain.setValueAtTime(0.18, t+k*0.35); g.gain.exponentialRampToValueAtTime(0.001, t+k*0.35+0.33); o.connect(g); g.connect(out); o.start(t+k*0.35); o.stop(t+k*0.35+0.34); } }
  else if (kind === 'chest'){ [0,0.1,0.2].forEach((d,k) => tone(ac, out, t+d, MIDI(72+k*4), 0, 'triangle', 0.005, 0.5, 0.4)); }
  else if (kind === 'splash'){ hit(ac, out, t, 'shake', 0.6); hit(ac, out, t+0.05, 'snare', 0.3); }
}
/* holding a tool (from the bag) */
function holdTool(id){ G.me.tool = G.me.tool === id ? null : id; saveMe(); toast(G.me.tool ? (id==='rod'?'낚싯대':TOOLS[id].name)+'을(를) 손에 들었어요. 앞에 아무것도 없을 때 행동 버튼을 눌러 봐요' : '도구를 내려놓았어요', 2200); }
function toolAction(){
  const id = G.me.tool;
  if (id === 'net'){ doAnim('net'); toast('휙! 허공을 갈랐어요. 날아다니는 곤충을 바라보고 휘둘러요', 1600); }
  else if (id === 'shovel'){ doAnim('dig'); toast('푹푹… 흙만 나왔어요. X 표시를 찾아 파 봐요', 1600); }
  else if (id === 'can'){ doAnim('water'); toast('쪼르르~ 밭에 가서 물을 줘요', 1400); }
  else if (id === 'rod'){ doAnim('tap'); toast('물을 바라보고 행동 버튼을 누르면 낚시해요', 1400); }
}

/* ---------- photo mode ---------- */
let lastPhoto = null;
function takePhoto(){
  const ui = $('#hud'); renderer.render(scene, cam);
  let url; try{ url = canvas.toDataURL('image/png'); }catch(e){ toast('사진을 찍을 수 없어요'); return; }
  const img = new Image(); img.onload = () => {
    const w = img.width, h = img.height, pad = Math.round(Math.min(w,h)*0.035), cv = document.createElement('canvas'); cv.width = w + pad*2; cv.height = h + pad*2 + pad*2.2;
    const g = cv.getContext('2d'); g.fillStyle = '#fffaf4'; g.fillRect(0,0,cv.width,cv.height); g.drawImage(img, pad, pad);
    // labels of people in the shot
    const sx = w / window.innerWidth;
    g.font = Math.round(13*sx)+'px Jua, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    document.querySelectorAll('#labels .lbl').forEach(l => { if (l.hidden || !l.textContent) return; const x = parseFloat(l.style.left)*sx + pad, y = parseFloat(l.style.top)*sx + pad - 10*sx; if (!(x>0 && y>0)) return; const tw = g.measureText(l.textContent).width + 16*sx; g.fillStyle = 'rgba(255,250,244,.92)'; g.beginPath(); g.roundRect ? g.roundRect(x-tw/2, y-10*sx, tw, 20*sx, 10*sx) : g.rect(x-tw/2, y-10*sx, tw, 20*sx); g.fill(); g.fillStyle = '#5b4b78'; g.fillText(l.textContent, x, y); });
    const d = new Date(); g.fillStyle = '#5b4b78'; g.font = Math.round(pad*1.1)+'px Jua, sans-serif'; g.textAlign = 'left';
    g.fillText('도토리 마을 · '+G.me.name, pad, h + pad*2.1); g.textAlign = 'right'; g.fillStyle = '#8a7ca6';
    g.fillText(d.getFullYear()+'.'+(d.getMonth()+1)+'.'+d.getDate()+' '+SEASONS[season()], cv.width - pad, h + pad*2.1);
    lastPhoto = cv; showPhoto(cv.toDataURL('image/png'));
  }; img.src = url;
  const fl = $('#flash'); fl.hidden = false; fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go'); setTimeout(() => { fl.hidden = true; }, 500);
  playSfx('shutter');
}
function showPhoto(src){
  const el = $('#photo'); el.hidden = false; el.querySelector('img').src = src;
  $('#photoMsg').textContent = '';
}
$('#photoBtn').addEventListener('click', () => { if (!G.started) return; takePhoto(); });
$('#photoClose').addEventListener('click', () => { $('#photo').hidden = true; });
$('#photoSave').addEventListener('click', async () => {
  if (!lastPhoto) return; const d = new Date(), pad2 = n => String(n).padStart(2,'0');
  const filename = 'dotvillage_'+d.getFullYear()+pad2(d.getMonth()+1)+pad2(d.getDate())+'_'+pad2(d.getHours())+pad2(d.getMinutes())+pad2(d.getSeconds())+'.png';
  const blob = await new Promise(r => lastPhoto.toBlob(r, 'image/png'));
  let dl = null; try{ if (window.claude && claude.use) dl = await claude.use('downloads'); }catch(e){ dl = null; }
  if (dl){ try{ await dl.save({ filename, data:blob }); $('#photoMsg').textContent = '사진을 저장했어요!'; return; }catch(e){ if (e && e.code === 'declined'){ $('#photoMsg').textContent = '저장을 취소했어요.'; return; } } }
  try{ const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); $('#photoMsg').textContent = '저장했어요. 안 되면 사진을 길게 눌러 저장해요.'; }
  catch(e){ $('#photoMsg').textContent = '사진을 길게 눌러 저장해요.'; }
});
$('#jumpBtn').addEventListener('click', jump);
window.addEventListener('keydown', e => { if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; if (e.key === 'j' || e.key === 'J' || e.key === 'Shift') jump(); if (e.key === 'p' || e.key === 'P') takePhoto(); });
