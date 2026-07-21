const fs=require("fs"),p=require("path"),b=p.join(process.cwd(),"apps/os-pm/app/(dashboard)");
function w(r,b64){fs.writeFileSync(p.join(b,r),Buffer.from(b64,"base64").toString("utf8"),"utf8");console.log("OK:",r);}
