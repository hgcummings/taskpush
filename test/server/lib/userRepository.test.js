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

    describe('getSettings', function() {
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

    describe('saveSettings', function() {
        function verifySaveSettingsFails(settings, done) {
            userRepository.saveSettings('447890123456', settings, function(error) {
                assert(error);
                assert(stubClient.putItem.notCalled);
                done();
            });
        }

        var validSettings;

        beforeEach(function() {
            stubClient.putItem = sinon.spy();

            validSettings = {
                userId: '447817530243',
                checkvist: {
                    username: 'test@example.com',
                    apiKey: 'secret',
                    listId: 123456
                }
            };
        });

        it ('should persist valid settings', function() {
            // Technically also a success callback, but the code we're
            // testing isn't responsible for calling it in that case
            var errorCallback = sinon.spy();
            userRepository.saveSettings('447890123456', validSettings, errorCallback);
            assert(errorCallback.notCalled);
            assert(stubClient.putItem.calledOnce);
        });

        it ('should raise an error for settings missing checkvist settings', function(done) {
            delete validSettings.checkvist;
            verifySaveSettingsFails(validSettings, done);
        });

        it ('should raise an error for settings missing username', function(done) {
            delete validSettings.checkvist.username;
            verifySaveSettingsFails(validSettings, done);
        });

        it ('should raise an error for settings missing apiKey', function(done) {
            delete validSettings.checkvist.apiKey;
            verifySaveSettingsFails(validSettings, done);
        });

        it ('should raise an error for settings missing listId', function(done) {
            delete validSettings.checkvist.listId;
            verifySaveSettingsFails(validSettings, done);
        });
    });

    describe('deleteSettings', function() {
        before(function() {
            stubClient.deleteItem = sinon.stub();
        });

        it('should chain errors back to the caller', function(done) {
            var dummyError = 'Something has gone wrong!';
            stubClient.deleteItem.callsArgWith(1, dummyError);

            userRepository.deleteSettings('', function(error, deleted) {
                assert.equal(dummyError, error);
                assert.equal(null, deleted);
                done();
            });
        });
    });
});