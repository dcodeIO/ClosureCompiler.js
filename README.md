ClosureCompiler.js - Closure Compiler for node.js [![Build Status](https://travis-ci.org/dcodeIO/ClosureCompiler.js.png?branch=master)](https://travis-ci.org/dcodeIO/ClosureCompiler.js)
=================================================

Automatically downloads and installs [Closure Compiler](https://developers.google.com/closure/compiler/) and provides
bindings and a convenient command line utility to run it.

Installation
------------

ClosureCompiler.js requires a Java Runtime Environment to be installed and correctly set up. Correctly set up means that
at least one of the following conditions is met:

* **JRE:** Add the jre/bin directory to your PATH environment variable
* **JDK:** Set the JAVA_HOME environment variable to point to the jdk directory (not jdk/bin)

Install: `npm -g install closurecompiler` (this will automatically test for Java)

ClosureCompiler
---------------
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
Usage:   cc [sourceFiles ...] [--option=value --flagOption ...] [> outFile]
```

#### Available options ####

Actually `cc` supports all the command line options of Closure Compiler, except `--js` and `--js_output_file`.

* [See the output of cc --help](https://github.com/dcodeIO/ClosureCompiler.js/blob/master/OPTIONS.md).

License (ClosureCompiler.js and Closure Compiler itself)
--------------------------------------------------------
Apache License, Version 2.0 - http://www.apache.org/licenses/LICENSE-2.0.html
