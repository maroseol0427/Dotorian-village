/* ================= v13: 꾸미기 아이템 50종 — 설명, 비구름 친구 둥실둥실 ================= */
Object.assign(DESC, {
  t_berry:'딸기가 콕콕 박힌 분홍 티셔츠.', t_puffer:'몽글몽글 따뜻한 패딩. 입체 누빔!', t_vest:'셔츠 위에 아가일 무늬 니트 조끼.', t_rainbow:'여섯 가지 색 무지개 스웨터.', t_cloud:'하늘색 바탕에 몽실 구름.', t_collar:'동그란 카라에 분홍 단추.',
  b_tutu:'두 겹 튀튀에 진주 장식. 발레리나처럼!', b_balloon:'풍선처럼 부푼 귀여운 치마.', b_cargo:'주머니가 양옆에 달린 바지.',
  set_bee:'줄무늬 몸통 + 더듬이 + 투명 날개. 붕붕!', set_penguin:'부리 달린 후드 + 주황 발. 뒤뚱뒤뚱.', set_berry:'딸기 모자에 딸기 풍선 치마, 빨간 구두까지.', set_frog:'개구리 눈이 달린 초록 우비 세트.', set_prince:'금빛 견장 재킷 + 망토 + 왕관.', set_idol:'반짝이 무대의상 + 튀튀 + 마이크!',
  h_bonnet:'리본 끈이 달린 레트로 보닛.', h_frog:'눈알이 동그란 개구리 모자.', h_chick:'머리 위에 병아리가 앉아 있어요. 삐약!', h_sunflower:'얼굴 둘레에 해바라기 꽃잎.', h_phones:'귀에 하트가 그려진 헤드폰.', h_bucket:'끈 장식 버킷햇.', h_muffs:'복슬복슬 털 귀마개.', h_santa:'방울 달린 산타 모자.', h_berry:'씨앗까지 그려진 딸기 모자.',
  f_starsun:'별 모양 분홍 선글라스.', f_monocle:'금색 줄이 달린 외눈 안경.', f_whiskers:'볼에 고양이 수염을 그려요.', f_cheek:'양 볼에 하트 스티커.',
  s_bunny:'귀가 쫑긋한 토끼 슬리퍼.', s_bear:'곰돌이 얼굴 슬리퍼.', s_roller:'바퀴 달린 롤러스케이트.', s_maryjane:'끈 달린 빨간 구두.',
  k_bear:'곰돌이 얼굴 배낭.', k_bfly:'반투명 파스텔 나비 날개.', k_turtle:'등에 거북이 등껍질!', k_foxtail:'끝이 하얀 복슬 꼬리.', k_dragon:'보라색 꼬마 용 날개.',
  n_wand:'반짝이 별 요술봉.', n_cotton:'분홍·하늘 구름 솜사탕.', n_pinwheel:'네 가지 색 바람개비.', n_boba:'펄이 가득한 흑당 버블티.', n_cat:'꼬리 달린 고양이 인형.', n_lantern:'은은하게 빛나는 종이 등불.', n_heartb:'하트 모양 풍선.', n_mic:'아이돌 마이크.',
  acc_starband:'별 세 개가 달린 머리띠.', acc_lei:'알록달록 꽃 목걸이.', acc_scarf:'하얀 줄무늬 목도리.', acc_cherry:'귀에 달랑달랑 체리 두 알.', acc_cloud:'머리 위에 둥실 떠서 비를 뿌리는 구름 친구.',
});
function cloudTick(dt, tsec){ Object.values(chars).forEach(c => { const g = c.model && c.model.userData.cloud; if (!g || !c.g.visible) return; g.position.y = 1.66 + Math.sin(tsec*2.2 + (c.slot || 0))*0.04; g.rotation.y = Math.sin(tsec*0.8)*0.3; }); }
const _featTick13 = featTick;
featTick = function(dt, tsec){ _featTick13(dt, tsec); cloudTick(dt, tsec); };
