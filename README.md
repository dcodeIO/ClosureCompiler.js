![ClosureCompiler.js - Closure Compiler for node.js](https://raw.github.com/dcodeIO/ClosureCompiler.js/master/ClosureCompiler.png)
=================================================

The all-round carefree package. Automatically downloads and sets up [Closure Compiler](https://developers.google.com/closure/compiler/)
and a JRE built from [OpenJDK](http://openjdk.java.net) if required. No environment variables to set, works out of
the box.

*-- „Stop uglifying, be a man!“*

Installation
------------

Install: `npm -g install closurecompiler`

Installing globally is recommended if no global JRE is available and the bundled JRE needs to be downloaded, which is
about 45mb large.

ClosureCompiler API
-------------------
The API is quite simple and fully explained in a few lines of code:

```javascript
var ClosureCompiler = require("closurecompiler");

ClosureCompiler.compile(
    ['file1.js', 'file2.js'],
    {
        // Options in the API exclude the "--" prefix
        compilation_level: "ADVANCED_OPTIMIZATIONS",
        
        // Capitalization does not matter 
        Formatting: "PRETTY_PRINT",
        
        // If you specify a directory here, all files inside are used
        externs: ["externs/file3.js", "externs/contrib/"],
        
        // ^ As you've seen, multiple options with the same name are
        //   specified using an array.
        ...
    },
    function(error, result) {
        if (result) {
            // Write result to file
            // Display error (warnings from stderr)
        } else {
            // Display error...
         }
    }
);
```

Command line utility
--------------------

```bash
Usage:   ccjs sourceFiles ... [--option=value --flagOption ...] [> outFile]
```

#### Available options ####

The API and `ccjs` support all the command line options of Closure Compiler except `--js` and `--js_output_file`.

* [See the output of ccjs --help](https://github.com/dcodeIO/ClosureCompiler.js/blob/master/OPTIONS.md).

Usage with Grunt
----------------
To simply include ClosureCompiler.js as a [Grunt](http://gruntjs.com/) task, see: [grunt-closurecompiler](https://github.com/dcodeIO/grunt-closurecompiler)

Externs for `ADVANCED_OPTIMIZATIONS`
------------------------------------
* [Closure Compiler official](http://code.google.com/p/closure-compiler/source/browse/externs)
* [Closure Compiler contrib](http://code.google.com/p/closure-compiler/source/browse/contrib/externs)
* [Closure Compiler common libraries](https://code.google.com/p/closure-compiler/wiki/ExternsForCommonLibraries)

*-- „Be a hero!“*

#### Externs for node.js ####
ClosureCompiler.js depends on the [closurecompiler-externs](https://npmjs.org/package/closurecompiler-externs) package,
an npm distribution of [node.js Closure Compiler Externs](https://github.com/dcodeIO/node.js-closure-compiler-externs),
which includes externs for all of node's core modules. As a result, specifiying `--externs=node` automatically includes
all node.js specific externs in your compile step. If you are using non-core modules, you may still need
[additional externs](https://github.com/dcodeIO/node.js-closure-compiler-externs/tree/master/contrib) for these. 

Updating
--------
To update ClosureCompiler.js and/or the underlying Closure Compiler package, just run `npm update`. This will
automatically download and set up the latest version of Closure Compiler to be used by ClosureCompiler.js.

#### Using custom Closure Compiler builds ####
If you want to use a custom Closure Compiler build for whatever reason, just replace the files in the `compiler/`
directory.

Documentation
-------------
* [View documentation](http://htmlpreview.github.com/?http://github.com/dcodeIO/ClosureCompiler.js/master/docs/ClosureCompiler.html)

Tests [![Build Status](https://travis-ci.org/dcodeIO/ClosureCompiler.js.png?branch=master)](https://travis-ci.org/dcodeIO/ClosureCompiler.js)
-----
* [View source](https://github.com/dcodeIO/ClosureCompiler.js/blob/master/tests/test.js)
* [View report](https://travis-ci.org/dcodeIO/ClosureCompiler.js)

Contributors
------------
Feross Aboukhadijeh

License
-------

#### ClosureCompiler.js and Closure Compiler itself ####
Apache License, Version 2.0 - http://www.apache.org/licenses/LICENSE-2.0.html

#### Rhino ####
MPL 2.0 License - https://developer.mozilla.org/en-US/docs/Rhino/License

#### Bundled JRE ####
Binary License for OpenJDK - http://openjdk.java.net/legal/binary-license-2007-05-08.html

This package is not officially supported by Google, Mozilla or Oracle. All rights belong to their respective owners.
