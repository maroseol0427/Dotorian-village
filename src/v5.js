/* =====================================================================
   v5: islands, flower fields, farming, enterable shops, previews, instruments, Toni & Kini
   ===================================================================== */
function pickFlower(i,j){
  ensureDaily(); const k = key(i,j); if (G.me.daily.fl.includes(k)) return;
  const F = fieldAt(wx(i), wz(j)); const id = season()==='winter' ? 'snowdrop' : (F ? F.flower : 'tulip');
  G.me.daily.fl.push(k); const isNew = addItem(id); refreshFields(); saveMe(); doAnim('pick');
  if (isNew) pop('<div class="new">도감 새 등록</div><div class="sw" style="background:'+GATHER[id].c+';width:40px;height:22px;margin:0 auto 4px"></div>'+GATHER[id].name, GATHER[id].name+'을(를) 땄어요!<br><small>잡화점에서 도토리 '+GATHER[id].price+'</small>');
  else toast(GATHER[id].name+'을(를) 땄어요 · 가방에 '+G.me.inv[id]+'송이', 1400);
}
/*INLINE:v5a.js*/
/*INLINE:v5b.js*/
/*INLINE:v5c.js*/
/*INLINE:v5d.js*/
/*INLINE:v6a.js*/
/*INLINE:v6b.js*/
/*INLINE:v6c.js*/
/*INLINE:v6d.js*/
/*INLINE:v7a.js*/
/*INLINE:v7b.js*/
/*INLINE:v7c.js*/
/*INLINE:v7d.js*/
/*INLINE:v7e.js*/
/*INLINE:v7g.js*/
/*INLINE:v8a.js*/
/*INLINE:v8b.js*/
/*INLINE:v9a.js*/
/*INLINE:v9b.js*/
/*INLINE:v10a.js*/
/*INLINE:v11a.js*/
/*INLINE:v12a.js*/
/*INLINE:v12b.js*/
/*INLINE:v13a.js*/
/*INLINE:v14a.js*/
