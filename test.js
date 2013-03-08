'use strict';

var Mocha = require('mocha');
var jake = require('jake');

var mocha = new Mocha({
    ui: 'bdd',
    reporter: 'spec'
});

var fileList = new jake.FileList();
fileList.include('./test/**/*.js');

fileList.forEach(function (file) {
    mocha.addFile(file);
});

mocha.run();