var path = require('path');
var ISTANBUL = path.resolve('./node_modules/.bin/istanbul');
var COVERAGE_OPTS = '--lines 95 --statements 90 --branches 80 --functions 90';

var print_opts = {printStdout: true, printStderr: true};

desc('Run tests and check test coverage');
task('default', ['test:cover', 'test:check-coverage'], {async: true}, complete);

namespace('test', function() {
    desc('Run tests without coverage');
    task('no-cov', {async: true}, function(args) {
        var command = "test/run.js";
        jake.exec(command, complete, print_opts);
    });

    desc('Run tests with test coverage');
    task('cover', {async: true}, function() {
        var command = ISTANBUL + " cover test.js";
        jake.exec(command, complete, print_opts);
    });

    desc('Check test coverage');
    task('check-coverage', {async: true}, function() {
        var command = ISTANBUL + " check-coverage " + COVERAGE_OPTS;
        jake.exec(command, complete, print_opts);
    });

    desc('Run acceptance tests');
    task('acceptance', {async: true}, function() {
        var command = "test/run.js -T acceptance --timeout 30000";
        jake.exec(command, complete, print_opts);
    });
});