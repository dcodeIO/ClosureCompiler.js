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
	child_process = require("child_process"),
    pkg = require(__dirname+"/../package.json"),
    zlib = require("zlib"),
    tar = require("tar");

console.log("Configuring ClosureCompiler.js "+pkg.version+" ...\n");

// Closure Compiler download url
var ccUrl = "http://dl.google.com/closure-compiler/compiler-latest.tar.gz";

// Temporary file for the download
var ccTempFile = path.normalize(path.join(__dirname, "..", "compiler", "compiler.tar.gz"));

// Gets the platform postfix for downloads
function platformPostfix() {
    if (/^win/.test(process.platform)) {
        return process.arch == 'x64' ? 'win64' : 'win32';
    } else if (/^darwin/.test(process.platform)) {
        return 'osx64';
    }
    // This might not be ideal, but we don't have anything else and there is always a chance that it will work
    return process.arch == 'x64' ? 'linux64' : 'linux32';
}

// Bundled JRE download url
var jrePrefix = "https://storage.googleapis.com/google-code-archive-downloads/v2/code.google.com/bundled-openjdk-jre/OpenJDK-JRE-7u6_24-";
var jrePostfix = ".tar.gz";
var jreUrl = jrePrefix+platformPostfix()+jrePostfix;

// Temporary file for the download
var jreTempFile = path.normalize(path.join(__dirname, "..", "jre", "jre.tar.gz"));

if (!fs.existsSync) fs.existsSync = path.existsSync; // node < 0.8

console.log("  Downloading "+ccUrl+" ...");
var lastBytes = 0, currentBytes = 0, mb = 1024*1024;
download(ccUrl, ccTempFile, function(error, bytes) {
    if (error) {
        console.log("  ✖ Download failed: "+error+"\n");
        fail();
    }
    console.log("  ✔ Download complete: "+ccTempFile+" ("+parseInt(bytes/mb, 10)+" mb)\n");
    setTimeout(function() {
        console.log("  Unpacking "+ccTempFile+" ...");
        unpack(ccTempFile, function(error) {
            if (error) {
                console.log("  ✖ Unpack failed: "+error+"\n");
                fail();
            }
            setTimeout(function() { // Let the entry callbacks finish
                console.log("  ✔ Unpack complete.\n");
                configure_jre();
            }, 1000);
        }, function(entry) {
            console.log("  | "+entry["path"]);
        });
    }, 1000);
}, function(bytes, total) {
    currentBytes += bytes;
    if (currentBytes == bytes || currentBytes - lastBytes >= mb) {
        console.log("  | "+parseInt(currentBytes/mb, 10)+" / "+(total > 0 ? parseInt(total/mb, 10) : "???")+" mb");
        lastBytes = currentBytes;
    }
});

/**
 * Configures the JRE.
 */
function configure_jre() {
    console.log("  Configuring JRE ...");

    var mb = 1024*1024;

    // Test if there is already a global Java so we don't need to download anything
    ClosureCompiler.testJava(ClosureCompiler.getGlobalJava(), function(ok) {
        if (ok) {
            console.log("  ✔ Global Java is available, perfect!\n");
            // Travis CI for example has one, so we save their bandwidth. And Google's. And yours. And...
            finish();
        } else {
            if (fs.existsSync(path.join(__dirname, "..", "jre", "bin"))) {
                console.log("  ✖ Global Java not found or outdated, testing bundled JRE ...\n");
                runTest(true);
            } else {
                console.log("  ✖ Global Java not found or outdated, downloading bundled JRE ...");
                console.log("    Downloading "+jreUrl+" ...");
                lastBytes = 0; currentBytes = 0;
                download(jreUrl, jreTempFile, function(error, bytes) {
                    if (error) {
                        console.log("    ✖ Download failed: "+error+"\n");
                        fail();
                    }
                    console.log("    ✔ Download complete: "+jreTempFile+" ("+parseInt(bytes/mb, 10)+" mb)\n");
                    setTimeout(function() {
                        console.log("      Unpacking "+jreTempFile+" ...");
                        unpack(jreTempFile, function(error) {
                            if (error) {
                                console.log("      ✖ Unpack failed: "+error+"\n");
                                fail();
                            }
                            setTimeout(function() { // Let the entry callbacks finish
                                console.log("      ✔ Unpack complete.\n");
                                configure();
                                runTest(true);
                            }, 1000);
                        }, function(entry) {
                            console.log("      | "+entry["path"]);
                        });
                    }, 1000);
                }, function(bytes, total) {
                    currentBytes += bytes;
                    if (currentBytes == bytes || currentBytes - lastBytes >= mb) {
                        console.log("    | "+parseInt(currentBytes/mb, 10)+" / "+(total > 0 ? parseInt(total/mb, 10) : "???")+" mb");
                        lastBytes = currentBytes;
                    }
                });
            }
        }
    });
}

/**
 * Downloads a file.
 * @param {string} downloadUrl
 * @param {string} filename
 * @param {function(?Error,number)} callback
 * @param {function(number)=} ondata
 */
function download(downloadUrl, filename, callback, ondata) {
    var url = require("url").parse(downloadUrl);
    var out = require("fs").createWriteStream(filename, { flags: 'w', encoding: null, mode: 0666 });
    var bytes = 0, total = -1;
    var options = {
        "hostname" : url["host"],
        "method" : "GET",
        "path" : url["path"],
        "agent" : false
    }

    // Reconfigure request options if an HTTP proxy setting exists
    if (process.env.http_proxy) {
        var http_proxy = require("url").parse(process.env.http_proxy);
        options["hostname"] = http_proxy["hostname"];
        options["port"] = http_proxy["port"];
        options["path"] = url["href"];
        options["headers"] = {
            "Host" : url["host"]
        };
    }

    var req = require(path.join(__dirname, "..", "lib", "follow-redirects.js")).http.request(options,
                                                                                             function(res) {
        if (res.headers["content-length"]) {
            total = parseInt(res.headers["content-length"], 10);
        }
        if (res.statusCode != 200) {
            res.setEncoding(null);
            callback(new Error("Download failed: HTTP status code "+res.statusCode), -1);
            return;
        }
        res.on("data", function(chunk) {
            bytes += chunk.length;
            if (ondata) ondata(chunk.length, total);
            out.write(chunk);
        });

        res.on("end", function() {
            callback(null, bytes);
        });
    });
    req.on("error", function(e) {
        callback(e, -1);
    });
    req.end();
}

/**
 * Unpacks a file in place.
 * @param {string} filename File name
 * @param {function(?Error)} callback
 * @param {function(Object)=} entryCallback
 */
function unpack(filename, callback, entryCallback) {
    var input = fs.createReadStream(filename, { flags: 'r', encoding: null }),
        files = {},
        dir = path.dirname(filename),
        returned = false,
        to = null;

    // Finishs the unpack if all files are done
    function maybeFinish() {
        if (to !== null) clearTimeout(to);
        to = setTimeout(function() {
            var alldone = true;
            var names = Object.keys(files);
            for (var i=0; i<names.length; i++) {
                if (!files[names[i]]["done"]) {
                    alldone = false;
                    break;
                }
            }
            if (alldone && !returned) {
                returned = true;
                callback(null);
            }
        }, 1000);
    }

    input.pipe(zlib.createGunzip()).pipe(tar.Parse()).on("entry", function(entry) {
        if (entryCallback) entryCallback(entry);
        if (entry["type"] == 'File') {
            files[entry["path"]] = fs.createWriteStream(path.join(dir, entry["path"]), { flags: 'w', encoding: null });
            entry.pipe(files[entry["path"]]);
            entry.on("end", function() {
                files[entry["path"]].end();
                files[entry["path"]]["done"] = true;
                maybeFinish();
            });
        } else if (entry["type"] == "Directory") {
            try {
                fs.mkdirSync(path.join(dir, entry["path"]));
            } catch (e) {
                if (!fs.existsSync(path.join(dir, entry["path"]))) {
                    if (!returned) {
                        returned = true;
                        callback(e);
                    }
                }
            }
        }
    }).on("error", function(e) {
        if (!returned) {
            returned = true;
            callback(e);
        }
    });
}

/**
 * Configures our bundled Java.
 */
function configure() {
    var java = path.normalize(path.join(__dirname, "..", "jre", "bin", "java"+ClosureCompiler.JAVA_EXT));
    console.log("  Configuring bundled JRE for platform '"+platformPostfix()+"' ...");
    if (!/^win/.test(process.platform)) {
        var jre = path.normalize(path.join(__dirname, "..", "jre"));
        console.log("  | 0755 "+jre);
        fs.chmodSync(jre, 0755);
        console.log("  | 0755 "+path.join(jre, "bin"));
        fs.chmodSync(path.join(jre, "bin"), 0755);
        console.log("  | 0755 "+java);
        fs.chmodSync(java, 0755);
        console.log("  Complete.\n");
    } else {
        console.log("  Complete (not necessary).\n");
    }
}

/**
 * Runs the final test.
 * @param {boolean=} ensureBundled
 */
function runTest(ensureBundled) {
    console.log("  Testing bundled Java ...");
    console.log("  | exec "+ClosureCompiler.getBundledJava());
    ClosureCompiler.testJava(ClosureCompiler.getBundledJava(), function(ok, err) {
        if (ok) {
            console.log("  ✔ Successfully called bundled Java!\n");
            finish();
        } else {
            if (ensureBundled) {
                console.log("  ✖ Failed to call bundled java:");
                console.log("-----\n"+err+"\n-----");
                console.log("  ✖ Trying global java instead ...");
            } else {
                console.log("  ✖ Failed to call bundled java, trying global java instead ...");
            }
            console.log("    | exec "+ClosureCompiler.getGlobalJava()+"\n");
            ClosureCompiler.testJava(ClosureCompiler.getGlobalJava(), function(ok, err) {
                if (ok) {
                    console.log("    ✔ Successfully called global Java!\n");
                    finish();
                } else {
                    console.log("    ✖ Failed to call global Java.\n");
                    fail();
                }
            });
        }
    });
}

/**
 * Cleans up.
 */
function cleanUp() {
    try { fs.unlinkSync(ccTempFile); } catch (e) {}
    try { fs.unlinkSync(jreTempFile); } catch (e) {}
    // ...your harddrive's space.
}

/**
 * Fails.
 */
function fail() {
    cleanUp();
    console.log("  ✖ Unfortunately, ClosureCompiler.js could not be configured.");
    console.log("    See: https://github.com/dcodeIO/ClosureCompiler.js (create an issue maybe)\n");
    process.exit(1);
}

/**
 * Finishes.
 */
function finish() {
    cleanUp();
    console.log("  ✔ ClosureCompiler.js has successfully been configured!\n");
}
