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
 * ClosureCompiler.js Test4Java Script (c) 2013 Daniel Wirtz <dcode@dcode.io>
 * Released under the Apache License, Version 2.0
 * see: https://github.com/dcodeIO/ClosureCompiler.js for details
 */

var fs = require("fs"),
    java = process.env["JAVA_HOME"] ? process.env["JAVA_HOME"]+"/bin/java" : "java";

if (!fs.existsSync(java)) {
    java = "java";
}

require("child_process").exec('"'+java+'" -version', function(error, stdout, stderr) {
    var res = ""+stdout+stderr;
    var exp = /java version "([^"]+)"/;
    var match;
    if (error || (match = exp.exec(res)) === null) {
        console.log("");
        console.log("  ClosureCompiler.js cannot find Java at:\n\n    "+java+"\n");
        console.log("  Please install Java and make sure one of the following conditions is met:");
        console.log("");
        console.log("    a) JRE: Add the jre/bin directory to your PATH environment variable");
        console.log("    b) JDK: Set the JAVA_HOME environment variable to point to the\n       jdk directory (not jdk/bin)");
        console.log("");
        console.log("  You can get Java at: http://www.java.com");
        process.exit(1);
    }
    console.log("Java "+match[1]+" is installed.");
    process.exit(0);
});
