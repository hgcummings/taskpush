'use strict';

var assert = require('assert');
var sinon = require('sinon');

var settingsClient = require('../../../server/lib/settingsClient.js');
var userRepository = require('../../../server/lib/userRepository.js');

describe('settingsClient', function() {
    var dummyUserId = '447890123456';
    var spyChannel;
    var client;
    var dummySettings = {};
    var getSettingsStub;
    var saveSettingsStub;

    beforeEach(function() {
        spyChannel = { send: sinon.spy() };
        client = settingsClient.createClient(spyChannel);
        getSettingsStub = sinon.stub(userRepository, 'getSettings');
        saveSettingsStub = sinon.stub(userRepository, 'saveSettings');
    });

    afterEach(function() {
        getSettingsStub.restore();
        saveSettingsStub.restore();
    });

    describe('setUserId', function() {
        it('should store the userId on the client object', function() {
            client.setUserId(dummyUserId);

            assert.equal(dummyUserId, client.userId);
        });

        it('should pass userId back to the client along with existing settings', function() {
            client.setUserId(dummyUserId);

            var getSettings = getSettingsStub.withArgs(dummyUserId, sinon.match.func);
            assert(getSettings.calledOnce);
            var callback = getSettings.getCall(0).args[1];
            callback(null, dummySettings);

            assert(spyChannel.send.withArgs('userId', dummyUserId).calledOnce);
            assert(spyChannel.send.withArgs('settings', dummySettings).calledOnce);
        });

        it('should pass errors back to the client', function() {
            client.setUserId(dummyUserId);

            var getSettings = getSettingsStub.withArgs(dummyUserId, sinon.match.func);
            assert(getSettings.calledOnce);
            var callback = getSettings.getCall(0).args[1];

            var dummyError = {};
            callback(dummyError, null);

            assert(spyChannel.send.withArgs('errorMessage', sinon.match.string).calledOnce);
        });
    });

    describe('saveSettings', function() {
        var dummySettings = {};

        function testSaveSettings() {
            client.setUserId(dummyUserId);

            client.saveSettings(dummySettings);

            var expectedSaveSettings = saveSettingsStub.withArgs(dummyUserId, dummySettings, sinon.match.func);
            assert(expectedSaveSettings.calledOnce);

            return expectedSaveSettings.getCall(0).args[2];
        }

        it('should persist settings against the userId', function() {
            testSaveSettings();
        });

        it('should send a success message on a successful save', function() {
            var callback = testSaveSettings();

            callback();

            assert(spyChannel.send.withArgs('successMessage', sinon.match.string).calledOnce);
        });

        it('should send an error message on failure', function() {
            var callback = testSaveSettings();

            callback({});

            assert(spyChannel.send.withArgs('errorMessage', sinon.match.string).calledOnce);
        });
    });
});