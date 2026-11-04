const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:process.argv[3]?+process.argv[3]:1});
await p.goto('file://'+process.cwd()+'/affiche.html');await p.waitForTimeout(300);await p.screenshot({path:process.argv[2]});await b.close()})();
