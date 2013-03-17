'use strict';

var assert = require('assert');
var sinon = require('sinon');

var aws = require('aws-sdk');

describe('userRepository', function() {
    var userRepository;
    var stubClient = {};

    before(function() {
        var ddbConstructorStub = sinon.stub(aws, 'DynamoDB');
        ddbConstructorStub.returns({ client: stubClient });

        var requirePath = '../../../server/lib/userRepository.js';
        delete(require.cache[require.resolve(requirePath)]);
        userRepository = require(requirePath);
    });

    after(function() {
        aws.DynamoDB.restore();
    });

    describe('#getSettings(userId)', function() {
        var userName = 'test@example.com';
        var apiKey = 'foo';
        var checklistId = 'bar';

        var dummyResponse = {
            Item: {
                username: { S: userName },
                apiKey: { S: apiKey },
                listId: { S: checklistId }
            }
        };

        before(function() {
            stubClient.getItem = sinon.stub();
        });

        it('should chain errors back to the caller', function() {
            var dummyError = 'Something has gone wrong!';
            stubClient.getItem.callsArgWith(1, dummyError, null);

            userRepository.getSettings('', function(error, settings) {
                assert.equal(dummyError, error);
                assert.equal(null, settings);
            });
        });

        it('should return settings required for posting a task', function() {
            stubClient.getItem.callsArgWith(1, null, dummyResponse);

            userRepository.getSettings('', function(error, settings) {
                assert.equal(null, error);

                assert(settings.checkvist);
                assert(settings.checkvist.hasOwnProperty('apiKey'));
                assert(settings.checkvist.hasOwnProperty('listId'));
                assert(settings.checkvist.hasOwnProperty('username'));
            });
        });
    });
});