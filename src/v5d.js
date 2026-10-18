/* ---------- villagers on the move: homes, shops, stations, Toni's tours, Kini tagging along ---------- */
function nearestFree(x, z){
  const [ci,cj] = T(Math.round(x), Math.round(z));
  for (let r=0;r<8;r++) for (let a=-r;a<=r;a++) for (let b=-r;b<=r;b++){ if (Math.max(Math.abs(a),Math.abs(b)) !== r) continue; const i = ci+a, j = cj+b; if (inb(i,j) && !blocked(i,j)) return [i,j]; }
  return [ci,cj];
}
const npcAtWork = n => { if (!n.work) return false; const h = hourNow(); return h >= n.hours[0] && h < n.hours[1]; };
const npcAsleep = n => { const h = hourNow(); return n.staff ? (h >= 23 || h < 6) : (h >= 22 || h < (n.wander ? 7 : 6)); };
function npcAnchor(n){
  if (n.staff){ const st = STATIONS.find(s => s.id === n.staff); return st.id === 'east' ? [st.px-1, st.pz+2] : [st.px+2, st.pz+1]; }
  if (n.guide) return n.spot;
  if (n.post) return n.post;
  if (n.work && npcAtWork(n)) return [BY[n.work].door[0], BY[n.work].door[1]+1];
  const b = NHOME[n.home]; return b ? [b.door[0], b.door[1]+1] : [0,0];
}
function spawnNpcs(){
  NPCS.forEach(n => {
    const g = new THREE.Group(); const model = npcModel(n); g.add(model); scene.add(g);
    g.traverse(o => { o.userData.npc = n.id; });
    const lbl = document.createElement('div'); lbl.className = 'lbl npc'; $('#labels').appendChild(lbl);
    const [ax, az] = npcAnchor(n), [i,j] = nearestFree(ax, az);
    npcs[n.id] = { n, g, model, lbl, i, j, x:wx(i), z:wz(j), path:[], face:0, walkT:0, wait:Math.random()*3, talking:false, sleep:false, hidden:false };
    g.position.set(wx(i), 0, wz(j));
  });
  if (G.me.kini && G.me.kini.on) kiniArrive();
  rebuildPickables();
}
const WANDER = {
  dan:[[0,0],[-6,9],[8,10],[-12,-6],[11,-10],[-39,2],[-40,-6],[34,8],[40,1],[6,34],[2,40],[-4,12]],
  kini:[[-40,-2],[-36,-4],[-44,4],[-20,2],[0,3],[-6,6],[7,2],[20,9],[36,6],[42,2],[6,33],[10,36],[2,37],[-38,6]],
};
function npcGoal(np){
  const n = np.n; let cx, cz, rad;
  if (n.staff || n.post){ [cx,cz] = npcAnchor(n); rad = 1; }
  else if (n.guide){ [cx,cz] = n.spot; rad = 2; }
  else if (WANDER[n.id]){ const pts = WANDER[n.id]; const p = pts[Math.floor(Date.now()/(n.id==='kini'?45000:40000) + (n.id==='kini'?3:0)) % pts.length]; cx = p[0]; cz = p[1]; rad = 3; }
  else { const b = NHOME[n.home]; cx = b.door[0]; cz = b.door[1]+1; rad = 3; }
  for (let k=0;k<20;k++){ const x = cx + Math.round((Math.random()*2-1)*rad), z = cz + Math.round((Math.random()*2-1)*rad); const [i,j] = T(x,z); if (inb(i,j) && !blocked(i,j)) return [i,j]; }
  return null;
}
function npcWalk(np, dt, speed){
  const [ti,tj] = np.path[0], tx = wx(ti), tz = wz(tj), dx = tx-np.x, dz = tz-np.z, dist = Math.hypot(dx,dz), step = speed*dt;
  np.face = Math.atan2(dx,dz);
  if (dist <= step){ np.x = tx; np.z = tz; np.i = ti; np.j = tj; np.path.shift(); return false; }
  np.x += dx/dist*step; np.z += dz/dist*step; return true;
}
function npcTick(dt, tsec){
  const me = chars[G.slot];
  Object.values(npcs).forEach(np => {
    if (np.override){ np.g.visible = !G.inside; return; }
    const n = np.n, wasHidden = np.hidden;
    np.sleep = npcAsleep(n);
    const following = n.id === 'kini' && G.me.kini && G.me.kini.on;
    if (following && np.sleep){ G.me.kini.on = false; saveMe(); toast('끼니가 졸려서 집으로 돌아갔어요. 내일 또 놀아요!', 2600); }
    np.hidden = np.sleep || npcAtWork(n) || isPatient(n.id) || !!n.notYet;
    if (wasHidden && !np.hidden){ const [ax,az] = npcAnchor(n), [i,j] = nearestFree(ax,az); np.i = i; np.j = j; np.x = wx(i); np.z = wz(j); np.path = []; }
    let moving = false;
    if (!np.hidden && !np.talking){
      if (G.guide && G.guide.np === np) moving = guideStep(np, dt);
      else if (following && me && !G.inside && !G.ride){
        const d = Math.hypot(me.x-np.x, me.z-np.z);
        if (d > 14){ const [i,j] = nearestFree(me.x - Math.sin(me.face)*1.2, me.z - Math.cos(me.face)*1.2); np.i = i; np.j = j; np.x = wx(i); np.z = wz(j); np.path = []; }
        else if (d > 1.7){ np.repath = (np.repath||0) - dt; if (np.repath <= 0 || !np.path.length){ np.repath = 0.6; const p = bfs(np.i, np.j, (i,j) => Math.abs(i-me.i)+Math.abs(j-me.j) <= 1 && !(i===me.i && j===me.j)); np.path = p ? p.slice(0, 40) : []; } }
        else np.path = [];
        if (np.path.length) moving = npcWalk(np, dt, d > 4 ? 4.2 : 3.3);
        else np.face = Math.atan2(me.x-np.x, me.z-np.z);
      }
      else if (np.path.length){ moving = npcWalk(np, dt, (G.tour && G.tour.np === np) ? 3.6 : n.bunny ? 2.0 : 1.7); if (!np.path.length) np.wait = 2 + Math.random()*5; }
      else if ((np.wait -= dt) <= 0){
        const goal = npcGoal(np); np.wait = 3;
        if (goal){ const p = bfs(np.i, np.j, (i,j) => i===goal[0] && j===goal[1]); if (p && p.length < 140) np.path = p; }
      }
    }
    if (np.talking && me) np.face = Math.atan2(me.x-np.x, me.z-np.z);
    let dr = np.face - np.g.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); np.g.rotation.y += dr*Math.min(1, dt*10);
    np.walkT = moving ? np.walkT + dt*(n.bunny ? 13 : 11) : 0;
    const U = np.model.userData, sw = moving ? Math.sin(np.walkT)*0.6 : 0;
    U.legs[0].rotation.x = sw; U.legs[1].rotation.x = -sw; U.arms[0].rotation.x = -sw*0.8; U.arms[1].rotation.x = np.talking ? -0.5 + Math.sin(tsec*6)*0.25 : sw*0.8;
    np.model.position.y = n.bunny ? (moving ? Math.abs(Math.sin(np.walkT))*0.12 : Math.sin(tsec*2.4)*0.012) : (moving ? Math.abs(Math.sin(np.walkT))*0.04 : Math.sin(tsec*2)*0.008);
    if (U.ears) U.ears.forEach((e,k) => { e.rotation.x = Math.sin(tsec*3 + k)*0.08 + (moving ? -0.15 : 0); });
    U.head.rotation.z = Math.sin(tsec*1.5 + np.x)*0.04;
    np.g.position.set(np.x, 0, np.z);
    np.g.visible = !G.inside && !np.hidden;
  });
}
function npcNear(){
  const me = chars[G.slot]; if (!me || G.inside) return null;
  const fx = me.x + Math.sin(me.face)*0.9, fz = me.z + Math.cos(me.face)*0.9;
  let best = null, bd = 0.95;
  Object.values(npcs).forEach(np => { if (!np.g.visible) return; const d = Math.hypot(np.x-fx, np.z-fz); if (d < bd){ bd = d; best = np; } });
  return best;
}
function kiniArrive(){
  const np = npcs.kini, me = chars[G.slot]; if (!np || !me || !(G.me.kini && G.me.kini.on)) return;
  const [i,j] = nearestFree(me.x - Math.sin(me.face)*1.2, me.z - Math.cos(me.face)*1.2); np.i = i; np.j = j; np.x = wx(i); np.z = wz(j); np.path = [];
}
function kiniMult(){
  if (!(G.me.kini && G.me.kini.on) || !npcs.kini || npcs.kini.hidden) return 1;
  ensureDaily(); const d = G.me.daily; d.kb = d.kb || 0; if (d.kb >= 10) return 1; d.kb++; return 2;
}

/* Toni's guided tours */
const GUIDE = [
  { id:'island', t:'섬 소개', at:null, lines:['우리 마을엔 섬이 네 개 있어! 지금 있는 가운데 섬이 도토리섬이야. 쇼핑몰, 잡화점, 은행, 카페, 물류센터, 기차가 다 여기 있어.','서쪽 다리를 건너면 꽃섬! 꽃밭이 가득하고 나랑 끼니, 모모네 집이 있어.','동쪽은 농장섬. 밭에서 농사를 지을 수 있고 귤나무가 많아. 단풍이, 보보, 팡팡이 살아.','남쪽은 야자섬. 모래사장에서 조개를 줍고 야자수를 흔들면 코코넛이 떨어져. 코코, 몽실이, 역무원 강아지들이 살아.','지도 버튼을 누르면 마을 전체를 볼 수 있고, 지도를 탭하면 그곳으로 걸어가!'] },
  { id:'camera', t:'화면 조작', at:null, lines:['방향키로 걷고, 무언가를 바라보면서 행동 버튼을 누르면 상호작용해!','화면을 한 손가락으로 좌우로 밀면 카메라가 빙글 돌아가. 두 손가락으로 위아래로 밀면 내려다보는 각도가 바뀌고, 벌리면 확대돼.','컴퓨터에선 마우스 휠을 누른 채로 위아래로 움직이면 각도가, 휠을 굴리면 확대가 돼. 나침반 버튼을 누르면 정면으로 돌아와!'] },
  { id:'fish', t:'낚시', at:[-5,11], lines:['여기 연못이 보이지? 물을 바라보고 행동 버튼을 누르면 낚싯대를 던져.','찌가 움직이고 느낌표가 뜨면 재빨리 화면을 탭! 너무 빨라도, 너무 늦어도 놓쳐.','계절과 시간마다 나오는 물고기가 달라. 밤에만 나오는 뱀장어랑 메기도 있어. 가방에서 물고기 도감을 확인해 봐!'] },
  { id:'bug', t:'곤충·채집', at:[-3,4], lines:['풀밭에 팔랑팔랑 날아다니는 게 곤충이야. 잠자리채가 있어야 잡을 수 있어.','반짝이는 표시는 버섯이나 산딸기 같은 숲 채집물이야. 모래사장의 반짝임은 조개!','땅에 X 표시가 있으면 삽으로 파 봐. 화석이나 보석이 나올지도 몰라!','채집물은 매일 새로 생겨. 잡화점에서 팔거나 주민에게 선물할 수 있어.'] },
  { id:'tree', t:'나무·열매', at:[-9,-4], lines:['나무를 바라보고 행동 버튼을 누르면 흔들 수 있어. 사과, 감, 귤, 버찌, 코코넛, 솔방울이 떨어져!','나무마다 하루에 한 번씩 열매가 열려. 벚나무, 단풍나무, 소나무, 자작나무, 귤나무, 야자수… 섬마다 자라는 나무가 달라.','겨울엔 소나무, 귤나무, 야자수만 열매를 줘. 떨어진 건 가방에 들어가고 잡화점에서 팔 수 있어.'] },
  { id:'flower', t:'꽃밭', at:[-37,-8], lines:['짜잔, 꽃섬 튤립밭이야! 꽃밭 안에서 꽃을 바라보고 행동 버튼을 누르면 꽃을 딸 수 있어.','꽃밭마다 튤립, 해바라기, 코스모스, 백합, 장미가 펴. 한 칸에 하루 한 번씩 딸 수 있어.','겨울엔 하얀 설강화가 피어. 꽃은 비싸게 팔리고 주민들이 선물로 좋아해!'] },
  { id:'farm', t:'농사', at:[36,7], lines:['여기가 농장섬 밭이야! 갈색 흙 칸을 바라보고 행동 버튼을 누르면 씨앗을 심어.','씨앗은 모모네 잡화점에서 팔아. 물뿌리개로 물을 주면 그때부터 하루 동안 쑥쑥 자라.','물을 안 주면 자라지 않으니까 매일 물을 줘! 다 자라면 수확해서 팔 수 있어. 가족 모두 같은 밭을 같이 써.'] },
  { id:'job', t:'돈 벌기', at:[2,13], lines:['여기는 팡팡이네 물류센터야. 들어가서 팡팡이에게 말을 걸면 택배 분류랑 배달 일을 할 수 있어.','카페에선 보보 아저씨네 음료 주문 알바를 할 수 있어. 일하면 체력을 쓰고 도토리를 받아.','일을 망치면 벌금이 있고, 하루에 너무 많이 쓰면 일당이 줄어. 끼니를 데리고 다니면 일할 때 행운이 따른대!'] },
  { id:'mall', t:'쇼핑몰·옷', at:[9,8], lines:['여긴 몽실이네 쇼핑몰이야! 안에 들어가면 옷걸이, 진열대, 마네킹에 물건이 진열돼 있어.','진열대를 바라보고 행동 버튼을 누르면 그 종류 물건을 볼 수 있어. 고르면 내 캐릭터가 크게 확대돼서 입어 볼 수 있어!','탈의실에서는 가진 옷을 갈아입을 수 있어. 악기랑 탈것도 여기서 팔아.'] },
  { id:'shop', t:'잡화점', at:[-9,3], lines:['모모네 잡화점이야. 안에 가구가 하나하나 전시돼 있어서 바라보고 누르면 모양이 빙글빙글 보여.','씨앗, 도구, 벽지도 팔고, 채집한 물건이나 농작물은 계산대의 모모에게 팔 수 있어.'] },
  { id:'bank', t:'은행', at:[10,-1], lines:['도토리 은행이야. 코코에게 맡기면 하루 2% 이자가 붙어.','대출도 되지만 하루 3% 이자에 7일 안에 갚아야 해. 늦으면 압류! 코코가 퇴근하면 ATM을 써.'] },
  { id:'train', t:'기차', at:[6,-12], lines:['여기는 마을역! 역무원 강아지에게 말을 걸거나 승강장에서 행동 버튼을 누르면 기차를 탈 수 있어.','기차는 도토리섬을 빙글 도는데, 마을역·쇼핑몰역·일터역에 서. 표는 도토리 '+ECON.fare+'개야.'] },
  { id:'home', t:'우리 집 꾸미기', at:'myhome', lines:['여기가 {name}네 집이야! 들어가서 오른쪽 위 "방 꾸미기"를 누르면 가구를 놓을 수 있어.','침대에서 자면 체력이 회복되고, 옷장이랑 거울도 쓸 수 있어. 가구는 잡화점에서 사 와!'] },
  { id:'nhome', t:'주민 집 꾸미기', at:[-34,-4], lines:['주민들은 모두 자기 집이 있어. 이건 모모네 집이야.','주민에게 말을 걸어 "집 꾸며 줄까?"를 고르면 집 꾸미기를 부탁해. 주민 가구 상자는 공짜야!','부탁한 가구와 벽지를 다 놓고 6개 이상 꾸민 다음 주민에게 알려 주면 도토리를 300~500개나 줘!'] },
  { id:'music', t:'악기 연주', at:null, lines:['쇼핑몰에서 우쿨렐레, 바이올린, 플루트, 탬버린, 트럼펫, 마라카스를 팔아. 손에 들고 앞에 아무것도 없을 때 행동 버튼을 누르면 연주해!','잡화점에선 피아노, 드럼, 하프, 실로폰 같은 가구 악기도 팔아. 바라보고 행동 버튼을 누르면 연주할 수 있어.','근처 주민이 연주를 들으면 좋아해서 친해져!'] },
  { id:'kini', t:'끼니', at:'kini', lines:['저기 끼니가 있다! 끼니는 마을 여기저기를 돌아다녀.','끼니에게 자꾸 말을 걸면 졸졸 따라와. 끼니랑 함께 일하면 신기하게도 행운이 따라와!','그만 따라오게 하고 싶으면 말을 걸어서 "그만 따라와"를 고르면 돼.'] },
];
function guideDest(t){
  if (t.at === 'myhome'){ const b = BUILD.find(x => x.kind==='house' && x.slot===G.slot); return [b.door[0], b.door[1]+1]; }
  if (t.at === 'kini'){ const k = npcs.kini; return k && !k.hidden ? [Math.round(k.x)+1, Math.round(k.z)] : null; }
  return t.at;
}
function startGuide(np, id){
  const t = GUIDE.find(g => g.id === id); if (!t) return;
  const dest = guideDest(t);
  if (!dest){ sayMore(t.lines.slice()); return; }
  const [di,dj] = nearestFree(dest[0], dest[1]);
  if (Math.abs(np.i-di)+Math.abs(np.j-dj) <= 2){ sayMore(t.lines.slice()); return; }
  const p = bfs(np.i, np.j, (i,j) => i===di && j===dj);
  if (!p){ sayMore(t.lines.slice()); return; }
  G.guide = { np, t, path:p, wait:0, far:0 };
  np.path = []; sayMore(['좋아, '+t.t+'에 대해 알려 줄게! 나를 따라와!']); dlg.closing = true;
}
function guideStep(np, dt){
  const Gd = G.guide, me = chars[G.slot]; if (!me) return false;
  const d = Math.hypot(me.x-np.x, me.z-np.z);
  if (G.inside || G.ride){ return false; }
  if (d > 40){ Gd.far += dt; if (Gd.far > 50){ G.guide = null; toast('토니: 앗, 길을 잃었나 봐. 다음에 다시 물어봐!', 2600); } return false; }
  Gd.far = 0;
  if (Gd.path.length){
    if (d > 6){ np.face = Math.atan2(me.x-np.x, me.z-np.z); Gd.wait += dt; if (Gd.wait > 1.5){ Gd.wait = -6; toast('토니가 기다리고 있어요. 따라가요!', 1600); } return false; }
    np.path = Gd.path; const mv = npcWalk(np, dt, 2.9); Gd.path = np.path; np.path = []; return mv;
  }
  np.face = Math.atan2(me.x-np.x, me.z-np.z);
  if (d < 3 && !dlg && !G.panel){ const t = Gd.t; G.guide = null; talkTo(np, t.lines.slice()); }
  return false;
}

/* dialogue options per villager */
function npcOptions(np){
  const n = np.n, id = n.id, rel = relOf(id), opts = [];
  if (n.guide) opts.push(['guide','알려 줘!']);
  if (np.clerk && G.inside && G.inside.shop){ opts.push(['svc', SHOP_SVC[G.inside.shop]]); if (G.inside.shop === 'cafe') opts.push(['menu','음료 주문']); }
  if (n.staff) opts.push(['ticket','기차표 사기']);
  if (id === 'kini'){ if (G.me.kini && G.me.kini.on) opts.push(['unfollow','그만 따라와']); else if (kiniTalks() >= 2) opts.push(['follow','같이 가자!']); }
  opts.push(['chat','이야기하기'], ['gift','선물하기']);
  if (!n.staff && id !== 'kini') opts.push(['quest', rel.quest && rel.quest.day===today() && !rel.quest.done ? '부탁한 것 주기' : '부탁 있어?']);
  if (n.extraOpts) n.extraOpts(np).forEach(o => opts.push(o));
  if (n.home && NH_REQ[n.home] && !np.sleep){ const H = villagerHome(n.home); opts.push(['home', H.done ? '집 구경 얘기' : (G.me.nhm||{})[n.home] ? '집 다 꾸몄어!' : '집 꾸며 줄까?']); }
  if (id === 'kini' && G.me.kini && G.me.kini.on) opts.push(['with','같이 가자']); else opts.push(['bye','잘 가']);
  return opts;
}
function kiniTalks(){ const k = G.me.kiniTalk || {}; return k.date === today() ? k.n : 0; }
function chooseV5(o){
  const np = dlg.np, id = np.n.id;
  if (o === 'guide'){
    const ch = talkEl().querySelector('.choices'); talkEl().querySelector('.text').textContent = '무엇이 궁금해? 고르면 직접 데려가서 알려 줄게!';
    ch.innerHTML = GUIDE.map(t => '<button data-gt="'+t.id+'">'+t.t+'</button>').join('') + '<button data-gt="">괜찮아</button>';
    ch.querySelectorAll('[data-gt]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); const k = b.dataset.gt; if (!k){ showLine(); return; } startGuide(np, k); }));
    return true;
  }
  if (o === 'svc'){ const kind = G.inside.shop; endDialog(); shopService(kind); return true; }
  if (o === 'menu'){ endDialog(); openCafeMenu(); return true; }
  if (o === 'ticket'){ const st = STATIONS.find(s => s.id === np.n.staff); endDialog(); openStation(st); return true; }
  if (o === 'home'){ sayMore(homeChoice(np)); return true; }
  if (o === 'follow'){ G.me.kini = { on:true }; saveMe(); sayMore(['정말?! 헤헤, 같이 가자! 내가 옆에 있으면 행운이 따를 거야!']); return true; }
  if (o === 'with'){ sayMore([pickL(['응! 같이 가자!','헤헤, 어디로 갈까?','꼭 붙어 다닐게!'])]); dlg.closing = true; return true; }
  if (o === 'unfollow'){ G.me.kini = { on:false }; saveMe(); sayMore(['응… 알았어. 다음에 또 같이 다니자!']); return true; }
  if (typeof chooseV6 === 'function' && chooseV6(o)) return true;
  return false;
}

/* glue: per-frame extras */
const _featTick0 = featTick;
featTick = function(dt, tsec){
  _featTick0(dt, tsec);
  noteFx(dt); pvTick(dt);
  const ins = G.inside;
  if (ins && ins.clerkNp){ const c = ins.clerkNp, me = chars[G.slot], U = c.model.userData;
    if (!c.sleep && me){ const want = Math.atan2(me.x-c.x, me.z-c.z); let dr = want - c.g.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); c.g.rotation.y += dr*Math.min(1, dt*6); }
    else if (c.sleep){ c.g.rotation.y = 0; c.model.rotation.x = -Math.PI/2; c.model.position.y = c.bed ? 0.52 : 0.14; }
    if (!c.sleep){ U.arms[1].rotation.x = c.talking ? -0.5 + Math.sin(tsec*6)*0.25 : Math.sin(tsec*1.2)*0.05; c.model.position.y = Math.sin(tsec*2)*0.01; if (U.ears) U.ears.forEach((e,k) => e.rotation.x = Math.sin(tsec*3+k)*0.08); }
    if (c.lbl){ if (G.focus){ c.lbl.hidden = true; } else { _v.set(c.x, c.sleep ? 0.9 : 1.75, c.z).project(cam); c.lbl.hidden = false; c.lbl.style.left = ((_v.x+1)/2*window.innerWidth)+'px'; c.lbl.style.top = ((1-_v.y)/2*window.innerHeight)+'px'; } }
  }
  if (G.panel === 'map'){ G.mapT = (G.mapT||0) + dt; if (G.mapT > 0.5){ G.mapT = 0; drawMap(); } }
};
const _featSlow0 = featSlow;
featSlow = function(){ _featSlow0(); G.slowN = (G.slowN||0) + 1; if (G.slowN % 5 === 0){ refreshFields(); } if (G.slowN % 30 === 0) syncCrops(); };

function npcPortrait(n){
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128; const g = cv.getContext('2d');
  const ell = (x,y,rx,ry,c,rot) => { g.fillStyle = c; g.beginPath(); g.ellipse(x,y,rx,ry,rot||0,0,Math.PI*2); g.fill(); };
  const eyes = (y, big) => { [50,78].forEach(x => { ell(x,y,big?6:4.5,big?7.5:6,'#3a2e4a'); ell(x-1.8,y-2.6,big?2.2:1.6,big?2.4:1.8,'#fff'); }); };
  if (n.bunny){ const B = n.bunny;
    [[-1,46],[1,82]].forEach(([s,x]) => { ell(x,30,11,30,B.fur,0.18*s); ell(x,32,5.5,22,B.inner,0.18*s); });
    ell(64,82,42,36,B.fur); ell(64,96,24,14,B.belly||B.fur); eyes(80,true);
    g.globalAlpha = .55; ell(38,94,8,4.5,'#ff9eb0'); ell(90,94,8,4.5,'#ff9eb0'); g.globalAlpha = 1;
    g.fillStyle = '#ff8fa6'; g.beginPath(); g.moveTo(60,90); g.quadraticCurveTo(64,87,68,90); g.quadraticCurveTo(64,95,60,90); g.fill();
    if (B.bow){ ell(88,20,9,6,B.bow,0.5); ell(100,26,9,6,B.bow,-0.5); ell(94,23,4,4,B.bow); }
    if (B.scarf){ g.fillStyle = B.scarf; g.fillRect(30,114,68,10); }
    return cv; }
  const L = n.look, A = L.animal || {}, fur = A.fur || L.hairColor;
  if (A.type==='rabbit'){ ell(46,22,10,28,fur,-0.15); ell(82,22,10,28,fur,0.15); ell(46,24,5,20,A.inner,-0.15); ell(82,24,5,20,A.inner,0.15); }
  else if (A.type==='cat' || A.type==='fox'){ [-1,1].forEach(s => { g.fillStyle = fur; g.beginPath(); g.moveTo(64+s*22,46); g.lineTo(64+s*40,(A.type==='fox'?8:18)); g.lineTo(64+s*44,52); g.fill(); }); }
  else if (A.type==='bear'){ [-1,1].forEach(s => { ell(64+s*32,40,13,13,fur); ell(64+s*32,40,7,7,A.inner); }); }
  else if (A.type==='panda'){ [-1,1].forEach(s => ell(64+s*32,40,13,13,'#5a5060')); }
  else if (A.type==='sheep'){ [-1,1].forEach(s => ell(64+s*42,70,14,7,A.inner||'#f6d6c8',0.2*s)); }
  ell(64,70,40,38,L.hairColor); ell(64,76,34,30,L.skin); g.fillStyle = L.hairColor; g.beginPath(); g.ellipse(64,54,38,18,0,Math.PI,0); g.fill();
  if (A.type==='sheep') for (let k=0;k<7;k++) ell(34+k*10,40+Math.sin(k)*4,9,9,fur);
  if (A.type==='dog'){ [-1,1].forEach(s => ell(64+s*38,64,11,24,shade(fur,0.92),-0.25*s)); }
  if (A.type==='panda'){ ell(50,77,9,11,'#5a5060',-0.4); ell(78,77,9,11,'#5a5060',0.4); }
  eyes(76, false);
  ell(64,86,3,2.2,A.type==='fox'||A.type==='dog'||A.type==='bear'||A.type==='panda'?'#5a3a3a':'#ff9eb0'); g.globalAlpha = .5; ell(42,88,7,4,'#ff9eb0'); ell(86,88,7,4,'#ff9eb0'); g.globalAlpha = 1;
  if (n.staff){ g.fillStyle = '#3c6fd1'; g.beginPath(); g.ellipse(64,40,34,12,0,Math.PI,0); g.fill(); g.fillRect(64,38,40,5); }
  return cv;
}
