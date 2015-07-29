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
 * @license ClosureCompiler.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
 * Released under the Apache License, Version 2.0
 * see: https://github.com/dcodeIO/ClosureCompiler.js for details
 */
(function(global) {
    
    if (typeof require != 'function' || !module || !module.exports || !process) {
        throw(new Error("ClosureCompiler.js can only be used within node.js"));
    }

    // Dependencies
    var path = require("path"),
        fs = require("fs"),
        child_process = require("child_process"),
        once = require('one-time'),
        concat = require('bl');

    if (!fs.existsSync) fs.existsSync = path.existsSync; // node < 0.8
    
    /**
     * Constructs a new ClosureCompiler instance.
     * @exports ClosureCompiler
     * @class Closure Compiler binding.
     * @param {Object.<string,*>=} options Compilation options
     * @constructor
     */
    var ClosureCompiler = function(options) {

        /**
         * Compilation options.
         * @type {Object.<string, *>}
         */
        this.options = typeof options === 'object' && options ? options : {};
    };

    /**
     * Validates an option.
     * @param {string} name Option name
     * @param {string} actual Actual value
     * @param {Array} expected Expected values
     * @throw {Error} If the option is invalid
     * @return {string} Validated option
     * @private
     */
    ClosureCompiler._assertOption = function(name, actual, expected) {
        if (expected.indexOf(actual) < 0) {
            throw("Illegal "+name+" value: "+actual+" ("+expected+" expected)");
        }
    };

    /**
     * Java extension, e.g. '.exe' on windows.
     * @type {string}
     * @expose
     */
    ClosureCompiler.JAVA_EXT = process.platform == 'win32' ? '.exe' : '';

    /**
     * Gets the path of the global java executable.
     * @return {string} Absolute path to or "java(.exe)" if not determinable
     * @expose
     */
    ClosureCompiler.getGlobalJava = function() {
        var java = null;
        
        if (process.env["JAVA_HOME"]) {
            java = path.join(process.env["JAVA_HOME"], "bin", "java"+ClosureCompiler.JAVA_EXT);
            if (!fs.existsSync(java)) {
                java = null;
            }
        } 
        if (!java) {
            java = "java";
        }
        return java;
    };
    
    /**
     * Gets the path of the bundled java executable.
     * @return {string} Absolute path to "java(.exe)"
     * @expose
     */
    ClosureCompiler.getBundledJava = function() {
        return path.normalize(path.join(__dirname, "jre", "bin", "java"+ClosureCompiler.JAVA_EXT));
    };

    /**
     * Tests if java is callable.
     * @param {string} java Path to java
     * @param {function(boolean, Error)} callback Callback function
     * @expose
     */
    ClosureCompiler.testJava = function(java, callback) {
        child_process.exec('"'+java+'" -version', {}, function(error, stdout, stderr) {
            stderr += "";
            if (stderr.match(/1\.[7-8]+/)) {
                callback(true, null);
            } else if (stderr.indexOf("version \"") >= 0) {
                callback(false, new Error("Not Java 7"));
            } else {
                callback(false, error);
            }
        });
    };

    /**
     * Compiles one or more scripts through a new instance of ClosureCompiler.
     * @param {string|Array.<string>} files File or an array of files to compile
     * @param {Object.<string,*|Array>} options Any options Closure Compiler supports. If an option can occur
     *  multiple times, simply supply an array. Externs can additionally point to a directory to include all *.js files
     *  in it.
     * @param {ReadStream} stdin Optional read stream to use as stdin for closure compiler
     * @param {function(Error,string)} callback Callback called with the error, if any, and the compiled code
     * @throws {Error} If the file cannot be compiled
     * @expose
     */
    ClosureCompiler.compile = function(files, options, stdin, callback) {
        if (arguments.length < 4) {
            callback = stdin;
            stdin = null;
        }
        new ClosureCompiler(options).compile(files, stdin, callback);
    };

    /**
     * Compiles one or more scripts through this instance of ClosureCompiler.
     * @param {string|Array.<string>} files File or an array of files to compile
     * @param {ReadStream} stdin Optional read stream to use as stdin for closure compiler
     * @param {function((Error|string),string)} callback Callback called with the error, if any, and the compiled code.
     *  If no error occurred, error contains the string output from stderr besides the result.
     * @throws {Error} If the file cannot be compiled
     * @expose
     */
    ClosureCompiler.prototype.compile = function(files, stdin, callback) {
        if (arguments.length < 3) {
            callback = stdin;
            stdin = null;
        }

        // Convert all option keys to lower case
        var options = {};
        var keys = Object.keys(this.options);
        for (var i=0; i<keys.length; i++) {
            options[keys[i].toLowerCase()] = this.options[keys[i]];
        }
        delete options["js"];
        delete options["js_output_file"];

        var xms = options["Xms"] || null,
            xmx = options["Xmx"] || "1024m";
        delete options["Xms"];
        delete options["Xmx"];
        
        // -XX:+TieredCompilation speeds up compilation for Java 1.7.
        // Previous -d32 was for Java 1.6 only.
        // Compiler now requires Java 1.7 and this flag does not need detection.
        var args = ['-XX:+TieredCompilation'];
            if (xms) args.push('-Xms'+xms);
            args.push(
                '-Xmx'+xmx,
                '-jar', __dirname+'/compiler/compiler.jar'
            );

        // Source files
        if (!(files instanceof Array)) {
            files = [files];
        }
        for (i=0; i<files.length; i++) {
            if (typeof files[i] != 'string') {
                throw(new Error("Illegal source file: "+files[i]));
            }
            if (files[i].indexOf('"') >= 0) {
                args.push('--js=' + files[i]);
            } else {
                stat = fs.statSync(files[i]);
                if (!stat.isFile()) {
                    throw (new Error("Source file not found: " + files[i]));
                }
                args.push('--js', files[i]);
            }
        }
        
        // Externs files
        if (!options.externs) options.externs = [];
        if (!(options.externs instanceof Array)) {
            options.externs = [options.externs];
        }
        var externs = [];
        var j, stat;
        for (i=0; i<options.externs.length; i++) {
            if (typeof options.externs[i] != 'string' || options.externs[i] == "") {
                throw(new Error("Externs directive does not point to a file or directory: "+options.externs[i]));
            }
            if (options.externs[i].toLowerCase() == "node") {
                options.externs[i] = __dirname+"/node_modules/closurecompiler-externs";
            }
            stat = fs.statSync(options.externs[i]);
            if (stat.isDirectory()) {
                // Use all files in that directory
                var dfiles = fs.readdirSync(options.externs[i]);
                for (j=0; j<dfiles.length; j++) {
                    var fname = options.externs[i]+"/"+dfiles[j];
                    var fstats = fs.statSync(fname);
                    if (fstats.isFile() && path.extname(fname).toLowerCase() == '.js') {
                        externs.push(fname);
                    }
                }
            } else if (stat.isFile()) {
                externs.push(options.externs[i]);
            } else {
                throw(new Error("Externs file not found: "+options.externs[i]));
            }
        }
        delete options["externs"];
        for (i=0; i<externs.length; i++) {
            args.push('--externs', externs[i]);
        }
        
        // Convert any other options to command line arguments
        keys = Object.keys(options);
        for (i=0; i<keys.length; i++) {
            var key = keys[i];
            var value = options[keys[i]];
            if (!/[a-zA-Z0-9_]+/.test(key)) {
                throw(new Error("Illegal option: "+key));
            }
            if (value === true) { // Only once
                args.push('--'+key);
            } else if (value === false) {
                // Skip
            } else { // Multiple times
                if (!(value instanceof Array)) {
                    value = [value];
                }
                for (j=0; j<value.length; j++) {
                    if (!/[^\s]*/.test(value[j])) {
                        throw(new Error("Illegal value for option "+key+": "+value[j]));
                    }
                    args.push('--'+key, value[j]);
                }
            }
        }
        
        // Executes a command
        function exec(cmd, args, stdin, callback) {
            var cb = once(callback);
            var stdout = concat();
            var stderr = concat();

            var process = child_process.spawn(cmd, args, {
                stdio: [stdin || 'ignore', 'pipe', 'pipe']
            });
            process.stdout.pipe(stdout);
            process.stderr.pipe(stderr);
            process.on('error', cb);
            process.on('exit', function(code, signal) {
              var err;
              if (code !== 0) {
                err = new Error(code);
                err.code = code;
                err.signal = signal;
              }
              cb(err, stdout, stderr);
            });
            process.on('error', function (err) {
              callback(err, stdout, stderr);
            });
        }

        // Run it
        function run(java, args) {
            exec(java, args, stdin, function(error, stdout, stderr) {
                if (stdout.length > 0 || stderr.length > 0) { // If we get output, error basically just contains a copy of stderr
                    callback(stderr+"", stdout+"");
                } else {
                    callback(error, null);
                }
            });
        }
        
        // Try any other global java
        ClosureCompiler.testJava(ClosureCompiler.getGlobalJava(), function(ok) {
            if (ok) {
                run(ClosureCompiler.getGlobalJava(), args);
            } else {
                // If there is no global java, try the bundled one
                ClosureCompiler.testJava(ClosureCompiler.getBundledJava(), function(ok) {
                    if (ok) {
                        run(ClosureCompiler.getBundledJava(), args);
                    } else {
                        throw(new Error("Java is not available, neither the bundled nor a global one."));
                    }
                });
            }
        });
    };

    /**
     * Returns a string representation of this object.
     * @returns {string} String representation as of "ClosureCompiler"
     * @expose
     */
    ClosureCompiler.prototype.toString = function() {
        return "ClosureCompiler";
    };
    
    module["exports"] = ClosureCompiler;
    
})(this);
