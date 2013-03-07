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
    
    if ((typeof window != 'undefined' && !!window.window) || typeof require != 'function') {
        throw(new Error("ClosureCompiler.js can only be used within node.js"));
    }
    
    /**
     * Constructs a new ClosureCompiler.
     * @exports ClosureCompiler.
     * @class Bindings for Closure Compiler.
     * @constructor
     */
    var ClosureCompiler = function() {

        /**
         * Java command.
         * @type {string}
         */
        this.java = ClosureCompiler.getJava();
    };

    /**
     * Validates an option.
     * @param {string} name Option name
     * @param {string} actual Actual value
     * @param {Array} expected Expected values
     * @throw {Error} If the option is invalid
     * @return {string} Validated option
     */
    ClosureCompiler.assertOption = function(name, actual, expected) {
        if (expected.indexOf(actual) < 0) {
            throw("Illegal "+name+" value: "+actual+" ("+expected+" expected)");
        }
    };
    
    /**
     * Gets the path of the java executable.
     * @returns {string} Path to java
     */
    ClosureCompiler.getJava = function() {
        // Requires scripts/configure.js to have done its job.
        if ((/^win/i).test(process.platform)) {
            return __dirname+"/jre/bin/java.exe";
        }
        return __dirname+"/jre/bin/java";
    };

    /**
     * Compiles one or more scripts through a new instance of Closure Compiler.
     * @param {string|Array.<string>} files File or an array of files to compile
     * @param {Object.<string,*|Array>} options Any options Closure Compiler supports. If an option can occur
     *  multiple times, simply supply an array. Externs can additionally point to a directory to include all *.js files
     *  in it.
     * @param {function(Error,string)} callback Callback called with the error, if any, and the compiled code
     * @throws {Error} If the file cannot be compiled
     */
    ClosureCompiler.compile = function(files, options, callback) {
        new ClosureCompiler().compile(files, options, callback);
    };

    /**
     * Compiles one or more scripts through this instance of Closure Compiler.
     * @param {string|Array.<string>} files File or an array of files to compile
     * @param {Object.<string,*|Array>} options Any options Closure Compiler supports. If an option can occur
     *  multiple times, simply supply an array. Externs can additionally point to a directory to include all *.js files 
     *  in it.
     * @param {function(Error,string)} callback Callback called with the error, if any, and the compiled code
     * @throws {Error} If the file cannot be compiled
     */
    ClosureCompiler.prototype.compile = function(files, options, callback) {
        options = options || {};

        // Convert all option keys to lower case
        var temp = {};
        var keys = Object.keys(options);
        for (var i=0; i<keys.length; i++) {
            temp[keys[i].toLowerCase()] = options[keys[i]];
        }
        options = temp;
        delete options["js"];
        delete options["js_output_file"];
        
        var path = require("path"),
            fs = require("fs"),
            util = require("util"),
            child_process = require("child_process");
        var args = '-jar "'+__dirname+'/compiler/compiler.jar"';
        
        // Source files
        if (!(files instanceof Array)) {
            files = [files];
        }
        for (i=0; i<files.length; i++) {
            if (typeof files[i] != 'string' || files[i].indexOf('"') >= 0) {
                throw("Illegal source file: "+files[i]);
            }
            stat = fs.statSync(files[i]);
            if (!stat.isFile()) {
                throw("Source file not found: "+files[i]);
            }
            args += ' --js "'+files[i]+'"';
        }
        
        // Externs files
        if (!options.externs) options.externs = [];
        if (!(options.externs instanceof Array)) {
            options.externs = [options.externs];
        }
        var externs = [];
        var j, stat;
        for (i=0; i<options.externs.length; i++) {
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
                throw("Externs file not found: "+options.externs[i]);
            }
        }
        delete options["externs"];
        for (i=0; i<externs.length; i++) {
            args += ' --externs "'+externs[i]+'"';
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
                args += ' --'+key;
            } else if (value === false) {
                // Skip
            } else { // Multiple times
                if (!(value instanceof Array)) {
                    value = [value];
                }
                for (j=0; j<value.length; j++) {
                    if (!/[^\s]*/.test(value)) {
                        throw(new Error("Illegal value for option "+key+": "+value));
                    }
                    args += ' --'+key+' '+value;
                }
            }
        }

        // Run it
        var cmd = '"'+this.java+'" '+args;
        child_process.exec(cmd, {
            maxBuffer: 20*1024*1024
        }, function(error, stdout, stderr) {
            if (stderr.length > 0) {
                callback(new Error(""+stderr), null)
            } else if (error) {
                callback(error, null);
            } else {
                callback(null, ""+stdout);
            }
        });
    };

    /**
     * Returns a string representation of this object.
     * @returns {string} String representation as of "ClosureCompiler"
     */
    ClosureCompiler.prototype.toString = function() {
        return "ClosureCompiler";
    };
    
    module.exports = ClosureCompiler;
    
})(this);