const fs=require("fs"),p=require("path");
const B=p.resolve("apps/os-pm/app/(dashboard)");
function W(r,c){const f=p.join(B,...r.split("/"));fs.mkdirSync(p.dirname(f),{recursive:true});fs.writeFileSync(f,c,"utf8");console.log("W:",r,c.length);}
module.exports={W};
