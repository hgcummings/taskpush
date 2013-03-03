var assert = require('assert');
var sinon = require('sinon');
var store = process.env.USE_INSTRUMENTED ? require('../../lib-cov/dynamo.js') : require('../../lib/dynamo.js');
var outbound =
    process.env.USE_INSTRUMENTED ? require('../../lib-cov/checkvist.js') : require('../../lib/checkvist.js');
var controller =
    process.env.USE_INSTRUMENTED ? require('../../lib-cov/controller.js') : require('../../lib/controller.js');

describe('controller', function() {
    describe('#pushTasks(message, response)', function() {
        var userId = '1';
        var operationId = '2';

        var settings = 'Dummy user settings';
        var response = 'Dummy response';

        var stubSettings;
        var pushTaskStub

        function buildMessage(tasks) {
            return {
                userId: userId,
                operationId: operationId,
                tasks: tasks
            };
        }

        beforeEach(function() {
            stubSettings = sinon.stub(store, 'getSettings');
            stubSettings.withArgs(userId).returns(settings);
            pushTaskStub = sinon.stub(outbound, 'pushTask');
        });

        afterEach(function() {
            stubSettings.restore();
            pushTaskStub.restore();
        });

        it('should push task to correct user', function() {
            // Act
            controller.pushTasks(buildMessage(['A task']), response);

            // Assert
            assert(pushTaskStub.calledOnce);
            var args = pushTaskStub.getCall(0).args;
            assert.equal(settings, args[0]);
            assert.equal(operationId, args[1]);
            assert.equal('A task', args[2]);
            assert.equal(response, args[3]);
        });

        it ('should push multiple tasks', function() {

            // Act
            controller.pushTasks(buildMessage(['A task', 'Another task'], response));

            // Assert
            assert(pushTaskStub.calledTwice);
            assert.equal('A task', pushTaskStub.getCall(0).args[2]);
            assert.equal('Another task', pushTaskStub.getCall(1).args[2]);
        })
    });
});