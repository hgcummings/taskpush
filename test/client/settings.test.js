'use strict';

var sinon = require('sinon');
var assert = require('assert');
var helpers = require('./helpers.js');

describe('settings', function () {
    var settings;
    var viewModel;

    var mockKo;
    var mockIo;
    var mockSocket;

    var settingsModule;

    before(function() {
        sinon.stub(console, 'info');
        global.define = sinon.spy();
        require('../../client/scripts/settings.js');
        settingsModule = global.define.getCall(0).args[1];
    });

    after(function() {
        delete global.define;
        delete global.window;
        console.info.restore();
    });

    beforeEach(function () {
        var dummyMapping = {
            toJS: function(data) { return data; },
            fromJS: function(data) { return data; }
        };

        mockSocket = {
            on: sinon.spy(),
            emit: sinon.spy(),
            disconnect: sinon.spy(),
            socket: { reconnect: sinon.spy() }
        };
        mockIo = { connect: sinon.stub() };
        mockIo.connect.returns(mockSocket);

        mockKo = helpers.createMockKo();

        settings = settingsModule(mockKo, mockIo, dummyMapping);
        settings.init();
        assert(mockKo.applyBindings.calledOnce);
        viewModel = mockKo.applyBindings.getCall(0).args[0];

        global.window = { addEventListener: sinon.spy() };
    });

    describe('init', function () {
        it('should bind a ViewModel', function () {
            assert(viewModel);
        });
    });

    describe('ViewModel', function () {
        it ('should initialise flag properties to false', function() {
            assert(viewModel.started.initialValue === false);
            assert(viewModel.loadingToken.initialValue === false);
        });

        describe('initialise', function() {
            beforeEach(function() {
                viewModel.initialise();
            });

            it('should set loadingToken and started to true', function() {
                assert.equal(true, viewModel.loadingToken());
                assert.equal(true, viewModel.started());
            });

            it('should connect to the socket', function() {
                assert(mockIo.connect.calledOnce);
                assert.equal('', mockIo.connect.getCall(0).args[0]);
            });

            it('should setup a callback for receiving a token', function() {
                var callback = mockSocket.on.withArgs('token').getCall(0).args[1];
                var dummyToken = 'sexual weasel';
                callback(dummyToken);
                assert.equal(false, viewModel.loadingToken());
                assert.equal(dummyToken, viewModel.token());
            });

            it('should setup a callback for receiving a userId', function() {
                var callback = mockSocket.on.withArgs('userId').getCall(0).args[1];
                var dummyUserId = '447897123456';
                callback(dummyUserId);
                assert.equal(null, viewModel.token());
                assert.equal(dummyUserId, viewModel.phoneNumber());
            });

            it('should setup a callback for receiving a userId', function() {
                var callback = mockSocket.on.withArgs('settings').getCall(0).args[1];
                var dummySettings = {};
                callback(dummySettings);
                assert.equal(dummySettings, viewModel.settings());
            });

            it('should setup a callback for receiving an error message', function() {
                var callback = mockSocket.on.withArgs('errorMessage').getCall(0).args[1];
                var dummyMessage = 'Error!';
                callback(dummyMessage);
                assert.equal(dummyMessage, viewModel.errorMessages.push.getCall(0).args[0]);
            });

            it('should setup a callback for receiving a success message', function() {
                var callback = mockSocket.on.withArgs('successMessage').getCall(0).args[1];
                var dummyMessage = 'Success!';
                callback(dummyMessage);
                assert.equal(dummyMessage, viewModel.successMessage());
            });

            it('should setup a callback for handling connection failure', function() {
                var callback = mockSocket.on.withArgs('connect_failed').getCall(0).args[1];
                callback();
                assert(viewModel.fatal());
            });

            it('should setup a callback for handling reconnection failure', function() {
                var callback = mockSocket.on.withArgs('reconnect_failed').getCall(0).args[1];
                callback();
                assert(viewModel.fatal());
            });

            function testClearData(event) {
                viewModel.settings({});
                viewModel.phoneNumber('447890123456');
                viewModel.token('dirty duck');

                var callback = mockSocket.on.withArgs(event).getCall(0).args[1];
                callback();

                assert(!viewModel.settings());
                assert(!viewModel.phoneNumber());
                assert(!viewModel.token());
            }

            it('should setup a callback to clear data on reconnect', function() {
                testClearData('reconnect');
            });

            it('should setup a callback to silently clear data on disconnect voluntarily', function() {
                viewModel.cancel();
                testClearData('disconnect');
                assert(!viewModel.errorMessages.called);
            });

            it('should setup a callback to show error when disconnected involuntarily', function() {
                testClearData('disconnect');
                assert(viewModel.errorMessages.push.calledOnce);
            });

            it('should register a handler to disconnect when the browser window is closed', function() {
                var expectedCall = global.window.addEventListener.withArgs('beforeUnload', sinon.match.func);
                assert(expectedCall.calledOnce);

                var callback = expectedCall.getCall(0).args[1];
                callback();

                assert(mockSocket.disconnect.calledOnce);
            });
        });

        describe('saveSettings', function() {
            it('should save settings', function() {
                viewModel.initialise();

                var dummySettings = {};
                viewModel.settings(dummySettings);

                viewModel.saveSettings();

                assert(mockSocket.emit.withArgs('settings', dummySettings).calledOnce);
            });
        });

        describe('cancel', function() {
            it('should disconnect from the socket', function() {
                viewModel.initialise();
                viewModel.cancel();

                assert(mockSocket.disconnect.calledOnce);
            });

            it('should cause the next connect to be a reconnect', function() {
                viewModel.initialise();
                viewModel.cancel();
                viewModel.initialise();
                assert(mockSocket.socket.reconnect.calledOnce);
            });
        });
    });
});