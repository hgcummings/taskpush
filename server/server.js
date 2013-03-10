'use strict';

var express = require('express');
var path = require('path');

var server;

exports.TEST_PORT = 5000;

exports.start = function(callback) {
    var app = express();

    app.use(express.bodyParser());
    app.use(express.static(path.resolve(__dirname + '/../client')));

    require('./lib/nexmo/controller.js')(app, '/nexmo/');

    var port = process.env.PORT || exports.TEST_PORT;
    server = app.listen(port, callback);
};

exports.stop = function(callback) {
    server.close(callback);
};