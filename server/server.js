'use strict';

var express = require('express');
var path = require('path');
var forceHttps = require('./forceHttps.js');

var server;

exports.TEST_PORT = 5000;

exports.start = function(callback) {
    var app = express();

    app.use(forceHttps);
    app.use(express.bodyParser());
    app.use(express.static(path.resolve(__dirname + '/../client')));

    var port = process.env.PORT || exports.TEST_PORT;
    server = app.listen(port, callback);

    var words = require('./lib/auth/words.js');
    var tokenSource = require('./lib/auth/tokenSource.js')(words.ADJECTIVES, words.NOUNS);

    require('./lib/nexmo/controller.js')(app, '/nexmo/', tokenSource);
    require('./lib/auth/controller.js')(server, tokenSource);
};

exports.stop = function(callback) {
    server.close(callback);
};