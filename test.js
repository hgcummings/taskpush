'use strict';

var Mocha = require('mocha');
var jake = require('jake');

var mocha = new Mocha({
    ui: 'bdd',
    reporter: 'spec',
    globals: ['define', 'window']
});

new jake.FileList()
    .include('./test/**/*.js')
    .forEach(function(file) { mocha.addFile(file); });

mocha.run();