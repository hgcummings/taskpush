'use strict';

var assert = require('assert');
var sinon = require('sinon');

var checkvist =
    process.env.USE_INSTRUMENTED ? require('../../lib-cov/checkvist.js') : require('../../lib/checkvist.js');

var nexmo = process.env.USE_INSTRUMENTED ?
    require('../../lib-cov/nexmo/controller.js') : require('../../lib/nexmo/controller.js');

describe('nexmo', function() {
    before(function() {
        sinon.stub(console, 'info');
    });

    after(function() {
        console.info.restore();
    });

    describe('#configure()', function() {
        var path = '/route/';

        function configuredApp() {
            var spyApp = { head: sinon.spy(), post: sinon.spy() };
            nexmo(spyApp, path);
            return spyApp;
        }

        var VALID_IP = '174.36.197.200';
        var INVALID_IP = '173.194.70.102';

        describe('HEAD handler', function() {
            var spyApp = configuredApp();

            before(function() {
                assert(spyApp.head.calledOnce);
            });

            function verifyReturnCode(ipAddress, statusCode) {
                var middleware = spyApp.head.getCall(0).args[1];
                var handler = spyApp.head.getCall(0).args[2];

                var request = { header: sinon.stub() };
                var response = { send: sinon.spy() };
                request.header.withArgs('X-Forwarded-For').returns(ipAddress);
                middleware(request, response, function() { handler(request, response); });

                assert(response.send.calledOnce);
                assert.equal(statusCode, response.send.getCall(0).args[1]);
            }

            it ('should be set up for the correct path', function() {
                assert.equal(path, spyApp.head.getCall(0).args[0]);
            });

            it ('should return an empty HTTP OK response', function() {
                verifyReturnCode(VALID_IP, 200);
            });

            it ('should return a 404 for non-authorised IP address', function() {
                verifyReturnCode(INVALID_IP, 404);
            });

            it ('should return an empty HTTP OK response if last IP in chain is whitelisted', function() {
                verifyReturnCode(INVALID_IP + ', ' + VALID_IP, 200);
            });

            it ('should return a 404 if last IP in chain is not whitelisted', function() {
                verifyReturnCode(VALID_IP + ', ' + INVALID_IP, 404);
            });
        });

        describe('POST handler', function() {
            var spyApp;
            var handler;
            var request = { param: sinon.stub(), body: '', header: sinon.stub() };
            var response;
            var messageId = '12345';
            var taskContent = 'One task\nTwo task';
            var middleware;

            beforeEach(function() {
                sinon.stub(checkvist, 'pushTasks');
                spyApp = configuredApp();
                assert(spyApp.post.calledOnce);
                middleware = spyApp.post.getCall(0).args[1];
                handler = spyApp.post.getCall(0).args[2];
                response = { send: sinon.spy() };
                request.header.withArgs('X-Forwarded-For').returns(VALID_IP);
                request.param.withArgs('messageId').returns(messageId);
                request.param.withArgs('text').returns(taskContent);
            });

            afterEach(function() {
                checkvist.pushTasks.restore();
            });

            function callEndpoint(request, response) {
                middleware(request, response, function() { handler(request, response); });
            }

            function act() {
                callEndpoint(request, response);
                assert(checkvist.pushTasks.calledOnce);
                return checkvist.pushTasks.getCall(0).args[0];
            }

            it ('should be set up for the correct path', function() {
                assert.equal(path, spyApp.post.getCall(0).args[0]);
            });

            it ('should pass the user ID to the callback', function() {
                var userId = '07890123456';

                request.param.withArgs('msisdn').returns(userId);

                var result = act();

                assert.equal(userId, result.userId);
            });

            it ('should pass the message ID to the callback', function() {
                var result = act();

                assert.equal(messageId, result.operationId);
            });

            it ('should pass the task content to the callback', function() {
                var result = act();

                assert.equal(taskContent, result.tasks);
            });

            it ('should pass response object to the callback', function() {
                act();

                assert.equal(response, checkvist.pushTasks.getCall(0).args[1]);
            });

            it ('should return a 404 for non-authorised IP address', function() {
                request.header.withArgs('X-Forwarded-For').returns(INVALID_IP);
                callEndpoint(request, response);
                assert(checkvist.pushTasks.notCalled);
                assert(response.send.calledOnce);
                assert.equal(404, response.send.getCall(0).args[1]);
            });
        });
    });
});