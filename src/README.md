# 도토리 마을 원본 소스

배포 파일(저장소 루트의 index.html 등)은 이 폴더의 원본을 합쳐서 만든 결과물이에요.

- `game.src.html` + `char3d2.js`(캐릭터) + `items.js`(옷·아이템) + `main.js`(본체) + `v5.js`가 불러오는 `v5a~v10a.js`(기능 추가분)
- `net.js`: 웹 버전 구글 로그인·Firebase 연결 / `web_src/`: 관리자 페이지·규칙·manifest·아이콘
- 빌드: `python3 build.py`(Claude 아티팩트용 dotvillage.html + test2.html) → `python3 build_web.py`(web/ 배포용, web_test/ 가짜 Firebase 테스트용)
  - 두 스크립트 맨 위 `D=` 경로를 이 폴더 위치로 바꿔서 실행해요.
- 테스트: Playwright. `t20.cjs <스크립트>`(단일), `tweb.cjs`(관리자+2명 실시간). `fb/mockfb.js`는 테스트용 가짜 Firebase.
- `gencat.js`: 관리자 선물 목록(`web_src/catalog.js`) 다시 만들기.
