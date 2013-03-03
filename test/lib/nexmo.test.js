var assert = require('assert');
var sinon = require('sinon');

var checkvist = require('../../lib/checkvist.js');

var nexmo = process.env.USE_INSTRUMENTED
    ? require('../../lib-cov/nexmo/controller.js')
    : require('../../lib/nexmo/controller.js');


describe('nexmo', function() {
    before(function() {
        sinon.stub(console, "info");
    });

    after(function() {
        console.info.restore();
    });

    describe('#configure()', function() {
        var path = '/route/';

        function configuredApp() {
            var spyApp = { head: sinon.spy(), get: sinon.spy() };
            nexmo(spyApp, path);
            return spyApp;
        }

        describe('HEAD handler', function() {
            var spyApp = configuredApp();

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
            var spyApp;
            var handler;
            var request = { param: sinon.stub(), body: '' };
            var response;
            var messageId = '12345';
            var taskContent = 'One task\nTwo task';

            beforeEach(function() {
                sinon.stub(checkvist, "pushTasks");
                spyApp = configuredApp();
                assert(spyApp.get.calledOnce);
                handler = spyApp.get.getCall(0).args[1];
                response = { send: sinon.spy() };
                request.param.withArgs("messageId").returns(messageId);
                request.param.withArgs("text").returns(taskContent);
            });

            afterEach(function() {
                checkvist.pushTasks.restore();
            });

            function act() {
                handler(request, response);
                assert(checkvist.pushTasks.calledOnce);
                return checkvist.pushTasks.getCall(0).args[0];
            }

            it ('should be set up for the correct path', function() {
                assert.equal(path, spyApp.get.getCall(0).args[0]);
            });

            it ('should pass the user ID to the callback', function() {
                var userId = '07890123456';

                request.param.withArgs("msisdn").returns(userId);

                var result = act();

                assert.equal(userId, result.userId);
            });

            it ('should pass the message ID to the callback', function() {
                var result = act();

                assert.equal(messageId, result.operationId);
            });

            it ('should pass the task content to the callback', function() {
                var result = act();

                assert.equal(taskContent, result.tasks)
            });

            it ('should pass response object to the callback', function() {
                act();

                assert.equal(response, checkvist.pushTasks.getCall(0).args[1]);
            });
        });
    });
});