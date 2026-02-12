const fs=require("fs"),p=require("path");
const B=p.resolve("apps/os-pm/app/(dashboard)");
const parts={};
function add(rel,content){parts[rel]=Buffer.from(content).toString("base64");}
function save(){fs.writeFileSync(p.resolve("tmp/parts.json"),JSON.stringify(parts));console.log(Object.keys(parts).length+" files saved");}

// === File 1: punch-list/page.tsx ===
add("punch-list/page.tsx", require("fs").readFileSync(p.resolve("tmp/f1.tsx"),"utf8"));
