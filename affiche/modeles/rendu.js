const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
for(const [v,h,n] of [[1,1350,'1-hero-produit'],[2,1350,'2-catalogue'],[3,1350,'3-vendeur-et-paires'],[4,1920,'4-statut-whatsapp']]){
const p=await b.newPage({viewport:{width:1080,height:h},deviceScaleFactor:+(process.argv[2]||1)});
await p.goto('file://'+__dirname+'/modeles.html?v='+v);await p.waitForTimeout(300);await p.screenshot({path:__dirname+'/'+n+'.png'});await p.close()}
await b.close()})();
