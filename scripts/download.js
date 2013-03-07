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
 * ClosureCompiler.js Download Script (c) 2013 Daniel Wirtz <dcode@dcode.io>
 * Released under the Apache License, Version 2.0
 * see: https://github.com/dcodeIO/ClosureCompiler.js for details
 */

/**
 * URL do download closure from.
 * @type {string}
 */
var DOWNLOAD_URL = "http://closure-compiler.googlecode.com/files/compiler-latest.zip";

/**
 * File name to store the downloaded file.
 * @type {string}
 */
var DOWNLOAD_FILE = __dirname+"/../compiler/compiler.zip";

console.log("Setting output directory permissions");
require("fs").chmodSync(__dirname+"/../compiler", 0755);

/**
 * Downloads a file from the given URL.
 * @param {string} downloadUrl Download URL
 * @param {string} filename Output file name
 * @param {function} callback
 */
function download(downloadUrl, filename, callback) {
    console.log("Downloading: "+downloadUrl+" ...");
    var url = require("url").parse(downloadUrl);
    var out = require("fs").createWriteStream(filename, { flags: 'w', mode: 0666 });
    var bytes = 0, mBytes = 0;
    var req = require("http").request({
       "hostname": url["host"],
       "method": "GET",
       "path": url["path"]
    }, function(res) {
        if (res.statusCode != 200) {
            throw(new Error("Download failed: Status "+res.statusCode));
        }
        res.on("data", function(chunk) {
            bytes += chunk.length;
            mBytes += chunk.length;
            if (mBytes > 500000) {
                console.log("  "+parseInt(bytes/1024, 10)+" kb");
                mBytes = 0;
            }
            out.write(chunk);
        });
        
        res.on("end", function() {
            console.log("  "+parseInt(bytes/1024, 10)+" kb");
            console.log("  Complete.\n");
            callback();
        });
    });
    req.on("error", function(e) {
        console.log("  ERROR: "+e);
    });
    req.end();
}

/**
 * Unpacks a file.
 * @param {string} filename File name
 * @param {function} callback
 */
function unpack(filename, callback) {
    console.log("Unzipping: "+filename+" ...");
    var stream = require("fs").createReadStream(filename);
    stream.on("close", function() {
        console.log("  Complete.\n");
        callback();
    });
    var ext = require("unzip").Extract({
        path: "compiler/"
    });
    ext.on("finish", function() {
        console.log("  Complete.\n");
        callback();
    });
    stream.pipe(ext);
}

// Run it
download(DOWNLOAD_URL, DOWNLOAD_FILE, function() {
    unpack(DOWNLOAD_FILE, function() {
        console.log("Deleting intermediate file ...");
        try { require("fs").unlinkSync(DOWNLOAD_FILE); } catch (e) {}
        console.log("  Complete.\n");
        console.log("Installation complete.");
    }.bind(this));
}.bind(this));
