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

var ClosureCompiler = require(__dirname+"/../ClosureCompiler.js"),
    fs = require("fs"),
    path = require("path"),
	child_process = require("child_process");

// Basically: Rename the platform's bin_* directory to bin and set necessary file permissions
var to = path.normalize(__dirname+path.sep+".."+path.sep+"jre"+path.sep+"bin");
var java = to+path.sep+"java"+ClosureCompiler.JAVA_EXT;

if (fs.existsSync(__dirname+"/../jre/bin")) {
    console.log("ClosureCompiler.js's bundled JRE is already configured\n");
} else {
    console.log("Configuring ClosureCompiler.js's bundled JRE for platform '"+process.platform+"' ...\n");
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
    console.log("  '"+from+"' -> '"+to+"'");
    fs.renameSync(from, to);
    console.log("  0755 "+java);
    fs.chmodSync(java, 0755);
}

// Ok, let's do a test...
console.log("  exec "+java+"\n");
ClosureCompiler.testJava(java, function(ok) {
    if (ok) {
        console.log("  ✔ Successfully called bundled java\n");
    } else {
        console.log("  ✖ Failed to call bundled java, trying global java instead...\n");
        console.log("  exec "+ClosureCompiler.getGlobalJava()+"\n");
        ClosureCompiler.testJava(ClosureCompiler.getGlobalJava(), function(ok) {
            if (ok) {
                console.log("  ✔ Successfully called global java\n");
            } else {
                console.log("  ✖ Failed to call global java, giving up.\n");
                process.exit(1);
            }
        });
    }
});
