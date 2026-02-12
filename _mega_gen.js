const fs=require("fs"),p=require("path");
const b=p.join(process.cwd(),"apps/os-pm/app/(dashboard)");
function w(r,c){c=c.replace(/«/g,"<").replace(/»/g,">");fs.writeFileSync(p.join(b,r),c,"utf8");console.log("OK:",r,c.length,"ch");}

// File data will be added by subsequent appends
