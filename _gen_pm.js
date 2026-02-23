var fs=require("fs");var dir=process.cwd()+"/services/api/src/modules/pm/";function w(n,c){fs.writeFileSync(dir+n,c,"utf8");console.log("Created:",n,c.length,"bytes");}
