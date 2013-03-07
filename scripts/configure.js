/*
 Copyright 2013 Daniel Wirtz <dcode@dcode.io>

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * ClosureCompiler.js: Configure Script (c) 2013 Daniel Wirtz <dcode@dcode.io>
 * Released under the Apache License, Version 2.0
 * see: https://github.com/dcodeIO/ClosureCompiler.js for details
 */

var fs = require("fs"),
    path = require("path"),
	child_process = require("child_process");

console.log("Configuring ClosureCompiler.js for platform '"+process.platform+"' ...\n");
var jre = path.normalize(__dirname+path.sep+".."+path.sep+"jre");
console.log("  0755 "+jre);
fs.chmodSync(jre, 0755);
var dirname, ext = "";
if ((/^win/i).test(process.platform)) {
    dirname = "bin_windows";
    ext = ".exe";
} else if ((/^darwin/i).test(process.platform)) {
    dirname = "bin_mac";
} else {
    dirname = "bin_linux";
}
var from = path.normalize(__dirname+path.sep+".."+path.sep+"jre"+path.sep+dirname);
var to = path.normalize(__dirname+path.sep+".."+path.sep+"jre"+path.sep+"bin");
var java = to+path.sep+"java"+ext;

console.log("  '"+from+"' -> '"+to+"'");
fs.renameSync(from, to);
console.log("  0755 "+java);
fs.chmodSync(java, 0755);

console.log('  exec "'+java+'" -version');
child_process.exec('"'+java+'" -version', {}, function(error, stdout, stderr) {
	if ((""+stderr).indexOf("openjdk version") >= 0) {
		console.log("  ✔ Successfully called java");
	} else {
		console.log("  ✖ Failed to call '"+java+"': "+error+stderr);
	}
});

console.log("\n");
