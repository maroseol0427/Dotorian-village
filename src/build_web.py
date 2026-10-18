import re,os,shutil
D='/tmp/claude-0/-home-claude/f5142491-c864-5006-b10b-6167252dacfe/scratchpad/'
def inline(text):
    return re.sub(r'/\*INLINE:([\w.]+)\*/', lambda m: inline(open(D+m.group(1)).read()), text)
src=inline(open(D+'game.src.html').read())
pick_old=src[src.index('<div id="pick">'):src.index('</div>', src.index('id="storeStatus"'))+6]
pick_new='''<div id="pick">
  <h1>도토리 마을</h1>
  <p>Dotorian village · 이웃들과 함께 사는 작은 섬마을</p>
  <div id="authBox" class="authbox"><p class="anote">불러오는 중…</p></div>
  <div id="cards" hidden></div>
  <div class="storeStatus" id="storeStatus"></div>
  <a class="adminLink" href="admin.html">관리자</a>
</div>'''
src=src.replace(pick_old,pick_new,1)
three='<script src="https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js"></script>'
FB='''<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-database-compat.js"></script>
<script src="firebase-config.js"></script>
<script>'''+open(D+'net.js').read()+'''</script>'''
assert three in src
web=src.replace(three, three+'\n'+FB,1)
HEAD='''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#cfeef8">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="도토리 마을">
<link rel="manifest" href="manifest.json">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="icon-180.png">
<style>html,body{margin:0;height:100%;overflow:hidden;overscroll-behavior:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}</style>
'''
web=HEAD+web.replace('<style>','</head><body>\n<style>',1)+'\n</body></html>'

os.makedirs(D+'web',exist_ok=True); os.makedirs(D+'web_test',exist_ok=True)
open(D+'web/index.html','w').write(web)
for f in ['admin.html','admin.js','database.rules.json','firebase-config.js','catalog.js','manifest.json','icon-192.png','icon-512.png','icon-180.png']: shutil.copy(D+'web_src/'+f, D+'web/'+f)
# test copies: local three + mock firebase
MOCK='<script src="../fb/mockfb.js"></script>'
t=web.replace(three,'<script src="../t/node_modules/three/build/three.min.js"></script>',1)
t=re.sub(r'<script src="https://www.gstatic.com/firebasejs/[^"]+"></script>\n?','',t).replace('<script src="firebase-config.js"></script>', MOCK+'<script src="firebase-config.js"></script>',1)
open(D+'web_test/index.html','w').write(t)
a=open(D+'web_src/admin.html').read(); a=re.sub(r'<script src="https://www.gstatic.com/firebasejs/[^"]+"></script>\n?','',a).replace('<script src="firebase-config.js"></script>', MOCK+'<script src="firebase-config.js"></script>',1)
open(D+'web_test/admin.html','w').write(a)
for f in ['admin.js','firebase-config.js','catalog.js','manifest.json','icon-192.png']: shutil.copy(D+'web_src/'+f, D+'web_test/'+f)
print('web built', len(web))
