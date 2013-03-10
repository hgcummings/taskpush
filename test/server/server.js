'use strict';

var assert = require('assert');
var http = require('http');

var server = require('../../server/server.js');

describe('server', function() {
    before(function() {
        server.start();
    });

    after(function() {
        server.stop();
    });

    function getResponse(route, callback) {
        var request = http.get('http://localhost:' + server.TEST_PORT + route);
        request.on('response', function (response) {
            var receivedData = '';
            response.setEncoding('utf8');

            response.on('data', function (chunk) {
                receivedData += chunk;
            });
            response.on('end', function () {
                callback(response, receivedData);
            });
        });
    }

    it('should serve the homepage', function(done) {
        getResponse('/', function(response, receivedData) {
            assert.equal(200, response.statusCode);
            assert(receivedData.indexOf('Taskpush') !== -1);
            done();
        });
    });
});