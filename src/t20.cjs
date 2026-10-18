const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader','--ignore-gpu-blocklist']});
const vp = process.env.LAND ? {width:844,height:390} : {width:390,height:844};
const p=await b.newPage({viewport:vp});
const errs=[]; p.on('pageerror',e=>errs.push('PE '+e.message+' '+(e.stack||'').split('\n')[1])); p.on('console',m=>{ if(m.type()==='error' && !m.text().includes('ERR_TUNNEL')) errs.push(m.text()); });
await p.addInitScript(()=>{ try{ localStorage.setItem('dv.settings', JSON.stringify({time:'day',season:'real'})); }catch(e){} });
await p.goto('file://'+process.cwd()+'/test2.html'); await p.waitForTimeout(1500);
await p.click('[data-s="0"]'); await p.waitForTimeout(800); await p.evaluate(()=>__dv.closePanel());
global.p=p; global.W=ms=>p.waitForTimeout(ms);
global.tp=(x,z,face)=>p.evaluate(([x,z,f])=>{ const [i,j]=__dv.T(x,z); const c=__dv.chars[__dv.G.slot]; __dv.charAt(c,i,j); if(f!=null) c.face=f; __dv.camTarget.set(c.x,0,c.z); }, [x,z,face]);
global.shot=n=>p.screenshot({path:'v6_'+n+'.png'});
try{ await eval('(async()=>{'+require('fs').readFileSync(process.argv[2],'utf8')+'})()'); }catch(e){ errs.push('SCRIPT '+e.message); }
console.log('errors:', JSON.stringify(errs.slice(0,12),null,1));
await b.close();})();
