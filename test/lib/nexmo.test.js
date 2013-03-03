var assert = require('assert');
var sinon = require('sinon');

var nexmo =
    process.env.USE_INSTRUMENTED ? require('../../lib-cov/nexmo/policy.js') : require('../../lib/nexmo/policy.js');

describe('nexmo', function() {
    before(function() {
        sinon.stub(console, "info");
    });

    after(function() {
        console.info.restore();
    });

    describe('#configure()', function() {
        var path = '/route/';

        function configuredApp(callback) {
            var spyApp = { head: sinon.spy(), get: sinon.spy() };
            nexmo.configure(spyApp, path, callback);
            return spyApp;
        }

        describe('HEAD handler', function() {
            var spyApp = configuredApp(null);

            before(function() {
                assert(spyApp.head.calledOnce);
            });

            it ('should be set up for the correct path', function() {
                assert.equal(path, spyApp.head.getCall(0).args[0]);
            });

            it ('should return an empty HTTP OK response', function() {
                var handler = spyApp.head.getCall(0).args[1];

                var response = { send: sinon.spy() };
                handler(null, response);

                assert(response.send.calledOnce);
                assert.equal(200, response.send.getCall(0).args[1]);
            });
        });

        describe('GET handler', function() {
            var callback;
            var spyApp;
            var handler;
            var request = { param: sinon.stub(), body: '' };
            var response;
            var messageId = '12345';

            function arrange(messageText) {
                callback = sinon.stub();
                spyApp = configuredApp(callback);
                assert(spyApp.get.calledOnce);
                handler = spyApp.get.getCall(0).args[1];
                response = { send: sinon.spy() };
                request.param.withArgs("messageId").returns(messageId);
                request.param.withArgs("text").returns(messageText);
            }

            function act() {
                handler(request, response);
                assert(callback.calledOnce);
                return callback.getCall(0).args[0];
            }

            it ('should be set up for the correct path', function() {
                arrange();

                assert.equal(path, spyApp.get.getCall(0).args[0]);
            });

            it ('should pass the user ID to the callback', function() {
                var userId = '07890123456';

                arrange('');
                request.param.withArgs("msisdn").returns(userId);

                var result = act();

                assert.equal(userId, result.userId);
            });

            it ('should pass the message ID to the callback', function() {
                arrange('');

                var result = act();

                assert.equal(messageId, result.operationId);
            });

            it ('should pass a single task to the callback', function() {
                arrange('A task');

                var result = act();

                assert.deepEqual(['A task'], result.tasks)
            });

            it ('should pass a list of line-separated tasks to the callback', function() {
                arrange('A task\nAnother task');

                var result = act();

                assert.deepEqual(["A task", "Another task"], result.tasks);
            });

            it ('should return empty response with response code returned from callback', function() {
                arrange('');
                var responseCode = 418; // I'm a teapot.
                callback.returns(responseCode);

                act();

                assert(response.send.calledOnce);
                assert.equal(responseCode, response.send.getCall(0).args[1]);
            });
        });
    });
});