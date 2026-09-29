// Renders every game item into one picture sheet for the admin gift picker.
// Run after build: NODE_PATH=$(npm root -g) node tools/admin-sprites.js src/brand index.html && python3 tools/admin-sprites.py
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const p=await (await b.newContext({viewport:{width:1400,height:900},deviceScaleFactor:1})).newPage();
p.on('pageerror',e=>console.log('ERR',e.message));
await p.route('**/rest/v1/rpc/**',r=>r.fulfill({status:200,contentType:'application/json',body:'null'}));
await p.route(/financialmodelingprep|jsdelivr/,r=>r.abort());
await p.goto('file://'+require('path').resolve(process.argv[3]||'index.html'));await p.waitForTimeout(1500);
const info=await p.evaluate(()=>{
  const cells=[];
  for(const it of ITEMS){ if(it.type==='coins'||it.type==='title') continue; try{cells.push({k:it.id,h:itemFace(it,true),n:it.name,t:it.type,r:it.r||null,d:it.desc||null})}catch(e){} }
  for(const [id,pt] of Object.entries(PET)){ if(ITEM[id]) continue; try{cells.push({k:(pt.exotic?'xpet_'+id.replace(/^x_/,''):'pet_'+id),h:'<span class="face art-face big">'+petArt(id)+'</span>',n:pt.name,t:'pet',r:pt.r||null,perk:pt.perk,b:pt.base,ic:pt.ic||null})}catch(e){} }
  for(const pk of PACKS){ try{cells.push({k:'pack:'+pk.id,h:'<span class="sp-pack" style="--a:'+pk.art[0]+';--b:'+pk.art[1]+'">'+packSVG(pk,1)+'</span>',n:pk.name,t:'pack',d:pk.blurb||null})}catch(e){} }
  const C=16,S=80;
  document.body.innerHTML='';
  const st=document.createElement('style');st.textContent=`html,body{margin:0;background:transparent!important}body::before,body::after{display:none!important}#sp{position:absolute;left:0;top:0;display:grid;grid-template-columns:repeat(${C},${S}px);grid-auto-rows:${S}px;background:transparent}#sp>div{width:${S}px;height:${S}px;display:grid;place-items:center;overflow:hidden}#sp .face{transform:scale(1);margin:0!important}#sp .face.big{width:${S-8}px!important;height:${S-8}px!important;font-size:44px}#sp .face svg{width:100%;height:100%}.sp-pack{width:${S-12}px;height:${S-8}px;display:block}.sp-pack svg{width:100%;height:100%}`;
  document.head.appendChild(st);
  const g=document.createElement('div');g.id='sp';g.innerHTML=cells.map(c=>'<div>'+c.h+'</div>').join('');document.body.appendChild(g);
  const rows=Math.ceil(cells.length/C);
  return {C,S,rows,cells:cells.map((c,i)=>{const o={k:c.k,n:c.n,t:c.t,i};if(c.r)o.r=c.r;if(c.perk){o.perk=c.perk;o.b=c.b}if(c.d)o.d=String(c.d).replace(/<[^>]+>/g,'').slice(0,140);return o})};
});
await p.setViewportSize({width:info.C*info.S,height:info.rows*info.S});
await p.waitForTimeout(600);
await p.locator('#sp').screenshot({path:process.argv[2]+'/sprites.png',omitBackground:true});
require('fs').writeFileSync(process.argv[2]+'/admin-items.json',JSON.stringify(info));
console.log(info.cells.length,'cells',info.rows,'rows', Object.entries(info.cells.reduce((a,c)=>(a[c.t]=(a[c.t]||0)+1,a),{})).join(' '));
await b.close()})();
