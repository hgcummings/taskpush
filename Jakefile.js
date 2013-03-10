'use strict';

var fs = require('fs');
var path = require('path');
var ISTANBUL = path.resolve('./node_modules/.bin/istanbul');
var COVERAGE_OPTS = '--lines 95 --statements 90 --branches 90 --functions 90';
var jshint = require('jshint').JSHINT;

var printOpts = {printStdout: true, printStderr: true};

desc('Run jake test and jake lint');
task('default', ['lint', 'check-coverage']);

desc('Run tests with test coverage');
task('cover', {async: true}, function() {
    var command = ISTANBUL + ' cover test.js -x test.js';
    jake.exec(command, complete, printOpts);
});

desc('Check test coverage');
task('check-coverage', ['cover'], {async: true}, function() {
    var command = ISTANBUL + ' check-coverage ' + COVERAGE_OPTS;
    jake.exec(command, complete, printOpts);
});

desc('Run jshint against src and test directories');
task('lint', function() {
    var fileList = new jake.FileList();

    fileList.include('Jakefile.js');
    fileList.include('server/**/*.js');
    fileList.include('test/**/*.js');

    var options = {
        bitwise: true,
        camelcase: true,
        curly: true,
        eqeqeq: true,
        forin: true,
        immed: true,
        indent: 4,
        latedef: true,
        newcap: true,
        noarg: true,
        noempty: true,
        nonew: true,
        plusplus: false,
        quotmark: true,
        undef: true,
        unused: true,
        strict: true,
        trailing: true,
        maxparams: 3,
        maxdepth: 3,
        globalstrict: true
    };

    var globals = {
        /* node.js */
        'Buffer': false,
        'process': false,
        'console': false,
        '__dirname': false,
        /* require */
        'require': false,
        'module': false,
        'exports': false,
        /* Jake */
        'jake': false,
        'desc': false,
        'task': false,
        'complete': false,
        'fail': false,
        /* Mocha */
        'describe': false,
        'before': false,
        'beforeEach': false,
        'it': false,
        'afterEach': false,
        'after': false
    };

    var errors = 0;

    fileList.forEach(function (file) {
        var filePassed = jshint(fs.readFileSync(file, 'utf8'), options, globals);
        if (!filePassed) {
            console.log(file);
            jshint.errors.forEach(function(error) {
                ++errors;
                if (error) {
                    if (error.line && error.evidence) {
                        console.log(error.line + ': ' + error.evidence.trim());
                    }
                    console.log('   ' + error.reason);
                }
            });
        }
    });
    if (errors) {
        console.log('Linting failed: ' + errors + ' errors');
        fail();
    }
});