'use strict';

var assert = require('assert');
var sinon = require('sinon');

var checkvist = require('../../../server/lib/checkvist.js');
var nexmo = require('../../../server/lib/nexmo/controller.js');

describe('nexmo', function() {
    before(function() {
        sinon.stub(console, 'info');
    });

    after(function() {
        console.info.restore();
    });

    describe('configure', function() {
        var path = '/route/';

        function configuredApp() {
            var spyApp = { get: sinon.spy(), post: sinon.spy() };
            var spyTokenSource = { getObjectForToken: sinon.spy(), checkToken: sinon.spy() };
            nexmo(spyApp, path, spyTokenSource);
            return spyApp;
        }

        var VALID_IP = '174.36.197.200';
        var INVALID_IP = '173.194.70.102';
        var LOCAL_IP = '10.10.2.50';

        describe('GET handler', function() {
            var spyApp = configuredApp();

            before(function() {
                assert(spyApp.get.calledOnce);
            });

            it ('should be set up for the correct path', function() {
                assert.equal(path, spyApp.get.getCall(0).args[0]);
            });

            it ('should return an empty HTTP OK response', function() {
                var handler = spyApp.get.getCall(0).args[1];

                var request = { header: sinon.stub() };
                var response = { send: sinon.spy() };
                handler(request, response);

                assert(response.send.calledOnce);
                assert.equal(200, response.send.getCall(0).args[1]);
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

            function stubForwardedForHeader(ipAddresses) {
                request.header.withArgs('X-Forwarded-For').returns(ipAddresses);
            }

            beforeEach(function() {
                sinon.stub(checkvist, 'pushTasks');
                spyApp = configuredApp();
                assert(spyApp.post.calledOnce);
                middleware = spyApp.post.getCall(0).args[1];
                handler = spyApp.post.getCall(0).args[2];
                response = { send: sinon.spy() };
                stubForwardedForHeader(VALID_IP);
                request.param.withArgs('messageId').returns(messageId);
                request.param.withArgs('text').returns(taskContent);
            });

            afterEach(function() {
                checkvist.pushTasks.restore();
            });

            function callEndpoint(request, response) {
                middleware[0](request, response, function() { handler(request, response); });
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

            it ('should respond if last IP in the forward chain is whitelisted', function() {
                stubForwardedForHeader(INVALID_IP + ', ' + VALID_IP);
                var result = act();
                assert(result);
            });

            it ('should respond if last IP is local and penultimate IP is whitelisted', function() {
                stubForwardedForHeader(VALID_IP + ', ' + LOCAL_IP);
                var oldLocalSubnet = process.env.LOCAL_SUBNET;
                process.env.LOCAL_SUBNET = '10.10.2.0/24';
                var result = act();
                assert(result);
                if (oldLocalSubnet === undefined) {
                    delete process.env.LOCAL_SUBNET;
                } else {
                    process.env.LOCAL_SUBNET = oldLocalSubnet;
                }
            });

            function verifyBlocked() {
                assert(checkvist.pushTasks.notCalled);
                assert(response.send.calledOnce);
                assert.equal('', response.send.getCall(0).args[0]);
                assert.equal(200, response.send.getCall(0).args[1]);
            }

            it ('should return an empty response for non-authorised IP address', function() {
                stubForwardedForHeader(INVALID_IP);
                callEndpoint(request, response);
                verifyBlocked();
            });

            it ('should return an empty response if last IP in the forward chain is not whitelisted', function() {
                stubForwardedForHeader(VALID_IP + ', ' + INVALID_IP);
                callEndpoint(request, response);
                verifyBlocked();
            });
        });
    });
});