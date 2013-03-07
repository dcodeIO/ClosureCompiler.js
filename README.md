ClosureCompiler.js - Closure Compiler for node.js [![Build Status](https://travis-ci.org/dcodeIO/ClosureCompiler.js.png?branch=master)](https://travis-ci.org/dcodeIO/ClosureCompiler.js)
=================================================

The all-round carefree package. Includes [Closure Compiler](https://developers.google.com/closure/compiler/) and 
downloads a JRE built from [OpenJDK](http://openjdk.java.net) if required. No environment variables to set, works out of
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
    ['file1.js', 'file2.js',
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
        if (error) {
            // Display error...
        } else {
            // Write result to file...
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

Externs for `ADVANCED_OPTIMIZATIONS`
------------------------------------
* [Closure Compiler official](http://code.google.com/p/closure-compiler/source/browse/externs)
* [Closure Compiler contrib](http://code.google.com/p/closure-compiler/source/browse/contrib/externs)
* [Closure Compiler common libraries](https://code.google.com/p/closure-compiler/wiki/ExternsForCommonLibraries)
* [node.js Closure Compiler externs](https://github.com/dcodeIO/node.js-closure-compiler-externs)

*-- „Be a hero!“*

License (ClosureCompiler.js and Closure Compiler itself)
--------------------------------------------------------
Apache License, Version 2.0 - http://www.apache.org/licenses/LICENSE-2.0.html

License (JRE)
-------------
Binary License for OpenJDK - http://openjdk.java.net/legal/binary-license-2007-05-08.html

This package is not officially supported by Google or Oracle. All rights belong to their respective owners.
