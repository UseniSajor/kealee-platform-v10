var fs = require("fs");
var name = process.argv[2];
var mode = process.argv[3] || "w";
var dir = "services/api/src/modules/pm/";
var chunks = [];
process.stdin.on("data", function(c) { chunks.push(c); });
process.stdin.on("end", function() {
  var content = Buffer.concat(chunks).toString("utf8");
  if (mode === "a") {
    fs.appendFileSync(dir + name, content);
  } else {
    fs.writeFileSync(dir + name, content);
  }
  console.log((mode === "a" ? "Appended" : "Created") + " " + name + ": " + content.length + " bytes");
});