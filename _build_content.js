var fs = require("fs");
var files = {};

// Helper to build file from template
function F() { this.lines = []; }
F.prototype.l = function(s) { this.lines.push(s); return this; };
F.prototype.b = function() { this.lines.push(""); return this; };
F.prototype.toString = function() { return this.lines.join("
"); };

// We will add file builders in subsequent appends
