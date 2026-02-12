const fs = require("fs");
const path = require("path");
const base = path.resolve("apps/os-pm/app/(dashboard)");

function writeFile(rel, content) {
  const fp = path.join(base, rel);
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, content, "utf8");
  console.log("Created:", rel, "(" + content.length + " chars)");
}

// Read content from numbered temp files
for (let i = 1; i <= 8; i++) {
  const meta = JSON.parse(fs.readFileSync(path.resolve("tmp/f" + i + ".json"), "utf8"));
  writeFile(meta.path, meta.content);
}
