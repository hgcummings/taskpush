'use strict';

var assert = require('assert');
var sinon = require('sinon');
var request = require('request');

var store = require('../../lib/dynamo.js');
var checkvist = require('../../lib/checkvist.js');

describe('checkvist', function() {
    var stubSettings;

    var message = {
        userId: '1',
        operationId: '2',
        tasks: 'One task\nTwo task'
    };

    var userSettings = {
        checkvist: {
            username: 'test@example.com',
            apiKey: 'api_key',
            listId: 'checklist_id'
        }
    };

    before(function() {
        sinon.stub(console, 'info');
        sinon.stub(console, 'error');
        stubSettings = sinon.stub(store, 'getSettings');
        stubSettings.withArgs(message.userId, sinon.match.func).callsArgWith(1, null, userSettings);
    });

    after(function() {
        console.info.restore();
        console.error.restore();
        stubSettings.restore();
    });

    describe('#pushTasks()', function() {
        var response;
        var requestPostStub;

        beforeEach(function() {
            response = { send: sinon.spy() };
            requestPostStub = sinon.stub(request, 'post');
        });

        afterEach(function() {
            requestPostStub.restore();
        });

        function act() {
            checkvist.pushTasks(message, response);
            assert(requestPostStub.calledOnce);
        }

        function requestArgs() {
            return requestPostStub.getCall(0).args[0];
        }

        function fakeResponse(error, response, body) {
            requestPostStub.getCall(0).args[1](error, response, body);
        }

        it('should make a POST to the correct URL', function() {
            act();

            assert.equal('https://checkvist.com/checklists/checklist_id/import.json', requestArgs().url);
        });

        it('should specify the task content in the request body', function() {
            act();

            assert.equal('import_content=' + message.tasks, requestArgs().body);
        });

        it('should authenticate the request', function() {
            act();

            var authHeader = requestArgs().headers.Authorization;
            assert.equal('Basic ', authHeader.substr(0, 6));
            var encodedAuthDetails = authHeader.substr(6);
            var plainTextAuthDetails = new Buffer(encodedAuthDetails, 'base64').toString();
            assert.equal('test@example.com:api_key', plainTextAuthDetails);
        });

        it('returns a 500 response if unable to load user settings', function() {
            stubSettings.withArgs('X', sinon.match.func).callsArgWith(1, 'error');

            checkvist.pushTasks({ userId: 'X', operationId: 'O' }, response);

            assert(response.send.calledOnce);
            assert.equal('', response.send.getCall(0).args[0]);
            assert.equal(500, response.send.getCall(0).args[1]);
        });

        it('should return an empty 500 response in the case of a transport error', function() {
            act();

            fakeResponse('Transport error');

            assert(response.send.calledOnce);
            assert.equal('', response.send.getCall(0).args[0]);
            assert.equal(500, response.send.getCall(0).args[1]);
        });

        it ('should return an empty response with the status code of the 3rd-party response', function() {
            act();

            var responseFromCheckvist = {
                statusCode: 418 // I'm a teapot.
            };

            fakeResponse(null, responseFromCheckvist, '');

            assert(response.send.calledOnce);
            assert.equal('', response.send.getCall(0).args[0]);
            assert.equal(responseFromCheckvist.statusCode, response.send.getCall(0).args[1]);
        });

    });
});