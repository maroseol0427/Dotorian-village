const c = await p.evaluate(()=>window.DV_CATALOG());
require('fs').writeFileSync('web_src/catalog.js', 'window.DV_CATALOG = ' + JSON.stringify(c) + ';\n');
console.log(c.items.length, c.furn.length, c.seeds.length);
