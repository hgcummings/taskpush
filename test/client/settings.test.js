'use strict';

var sinon = require('sinon');
var assert = require('assert');

describe('settings', function () {
    var settings;
    var viewModel;

    var mockKo;
    var mockIo;
    var socket;

    var settingsModule;

    before(function() {
        global.define = sinon.spy();
        require('../../client/scripts/settings.js');
        settingsModule = global.define.getCall(0).args[1];
    });

    after(function() {
        delete global.define;
    });

    beforeEach(function () {
        mockKo = {
            applyBindings: sinon.spy(),
            observable: function (init) {
                var currentValue = init;

                function obs() {
                    if (arguments.length > 0) {
                        currentValue = arguments[0];
                        return obs;
                    } else {
                        return currentValue;
                    }
                }

                obs.initialValue = init;
                return obs;
            }
        };

        socket = { on: sinon.spy(), emit: sinon.spy() };
        mockIo = { connect: sinon.stub() };
        mockIo.connect.returns(socket);

        settings = settingsModule(mockKo, mockIo);
        settings.init();
        assert(mockKo.applyBindings.calledOnce);
        viewModel = mockKo.applyBindings.getCall(0).args[0];
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
                var callback = socket.on.withArgs('token').getCall(0).args[1];
                var dummyToken = 'sexual weasel';
                callback(dummyToken);
                assert.equal(false, viewModel.loadingToken());
                assert.equal(dummyToken, viewModel.token());
            });

            it('should setup a callback for receiving a userId', function() {
                var callback = socket.on.withArgs('userId').getCall(0).args[1];
                var dummyUserId = '447897123456';
                callback(dummyUserId);
                assert.equal(null, viewModel.token());
                assert.equal(dummyUserId, viewModel.phoneNumber());
            });

            it('should setup a callback for receiving a userId', function() {
                var callback = socket.on.withArgs('settings').getCall(0).args[1];
                var dummySettings = {};
                callback(dummySettings);
                assert.equal(dummySettings, viewModel.settings());
            });

            it('should setup a callback for receiving an error message', function() {
                var callback = socket.on.withArgs('error').getCall(0).args[1];
                var dummyMessage = 'Error!';
                callback(dummyMessage);
                assert.equal(dummyMessage, viewModel.errorMessage());
            });

            it('should setup a callback for receiving a success message', function() {
                var callback = socket.on.withArgs('success').getCall(0).args[1];
                var dummyMessage = 'Success!';
                callback(dummyMessage);
                assert.equal(dummyMessage, viewModel.successMessage());
            });
        });

        describe('saveSettings', function() {
            it('should save settings', function() {
                viewModel.initialise();

                var dummySettings = {};
                viewModel.settings(dummySettings);

                viewModel.saveSettings();

                assert(socket.emit.withArgs('settings', dummySettings).calledOnce);
            });
        });

        describe('cancel', function() {
            it('should reload the page', function() {
                global.window = { location: { reload: sinon.spy() } };

                viewModel.cancel();

                assert(global.window.location.reload.calledOnce);
                delete global.window;
            });
        });
    });
});