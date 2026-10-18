import re,sys
D='/tmp/claude-0/-home-claude/f5142491-c864-5006-b10b-6167252dacfe/scratchpad/'
def inline(text):
    def r(m):
        return inline(open(D+m.group(1)).read())
    return re.sub(r'/\*INLINE:([\w.]+)\*/', r, text)
src=inline(open(D+'game.src.html').read())
open(D+'dotvillage.html','w').write(src)
open(D+'test2.html','w').write(src.replace('https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js','t/node_modules/three/build/three.min.js'))
print('built', len(src))
