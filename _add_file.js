var fs = require("fs");
var name = process.argv[2];
var chunks = [];
process.stdin.on("data", function(c) { chunks.push(c); });
process.stdin.on("end", function() {
  var content = Buffer.concat(chunks).toString("utf8");
  var b64 = Buffer.from(content).toString("base64");
  var line = "addFile(" + JSON.stringify(name) + ", " + JSON.stringify(b64) + ");";
  fs.appendFileSync("_pm_gen.js", line + String.fromCharCode(10));
  console.log("Encoded " + name + ": " + content.length + " bytes");
});
