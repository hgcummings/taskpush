'use strict';

var assert = require('assert');
var sinon = require('sinon');
var io = require('socket.io');

var controller = require('../../../../server/lib/auth/controller.js');
var settingsClient = require('../../../../server/lib/settingsClient.js');

describe('auth/controller', function() {
    describe('configure', function() {
        var listenSpy;
        var mockIo;
        var mockSocket;
        var dummyServer = {};
        var mockTokenSource;
        var createClientStub;
        var mockClient;

        beforeEach(function() {
            mockIo = { sockets: { on: sinon.spy() } };
            mockSocket = { emit: sinon.spy(), on: sinon.spy() };
            mockTokenSource = { getToken: sinon.spy(), releaseToken: sinon.spy() };
            listenSpy = sinon.stub(io, 'listen');
            listenSpy.withArgs(dummyServer).returns(mockIo);
            controller(dummyServer, mockTokenSource);
            mockClient = { saveSettings: sinon.spy() };
            createClientStub = sinon.stub(settingsClient, 'createClient');
            createClientStub.returns(mockClient);
        });

        afterEach(function() {
            listenSpy.restore();
            createClientStub.restore();
        });

        it('should set up a socket listening on the server of the parent application', function() {
            assert(listenSpy.calledOnce);
            assert.equal(dummyServer, listenSpy.getCall(0).args[0]);
        });

        function eventCallback(object, event) {
            var onEvent = object.on.withArgs(event, sinon.match.func);
            assert(onEvent.calledOnce);

            return onEvent.getCall(0).args[1];
        }

        function respondToGetToken(error, token) {
            var callback = eventCallback(mockIo.sockets, 'connection');

            callback(mockSocket);
            assert(mockTokenSource.getToken.calledOnce);

            mockTokenSource.getToken.getCall(0).args[1](error, token);
        }

        it ('should retrieve a token for the lifetime fo the connection', function() {
            var dummyToken = 'sexual weasel';
            respondToGetToken(null, dummyToken);

            var objectAssociatedWithToken = mockTokenSource.getToken.getCall(0).args[0];

            var callback = eventCallback(mockSocket, 'disconnect');
            callback(mockSocket);

            assert(mockTokenSource.releaseToken.withArgs(dummyToken, objectAssociatedWithToken).calledOnce);
        });

        it('should send the token back to the socket on connection', function() {
            var dummyToken = 'honey badger';
            respondToGetToken(null, dummyToken);

            assert(mockSocket.emit.calledOnce);
            assert.equal('token', mockSocket.emit.getCall(0).args[0]);
            assert.equal(dummyToken, mockSocket.emit.getCall(0).args[1]);
        });

        it('should chain errors back to the socket', function() {
            var error = new Error('an error occured');
            respondToGetToken(error, null);

            assert(mockSocket.emit.calledOnce);
            assert.equal('errorMessage', mockSocket.emit.getCall(0).args[0]);
            assert.equal('an error occured', mockSocket.emit.getCall(0).args[1]);
        });

        it('should setup a callback for saving settings', function() {
            respondToGetToken(null, 'sexual weasel');
            var callback = mockSocket.on.withArgs('settings').getCall(0).args[1];
            var dummySettings = {};
            callback(dummySettings);
            assert(mockClient.saveSettings.withArgs(dummySettings).calledOnce);
        });
    });
});