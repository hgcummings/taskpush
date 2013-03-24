define(['knockout', 'socket.io', 'koMapping'], function(ko, io, map) {
    'use strict';

    var ViewModel = function() {
        var self = this;
        var socket;

        self.loadingToken = ko.observable(false);
        self.token = ko.observable();
        self.started = ko.observable(false);
        self.phoneNumber = ko.observable();
        self.settings = ko.observable();
        self.fatal = ko.observable();
        self.loaded = true;

        self.errorMessage = ko.observable();
        self.successMessage = ko.observable();

        function clearData() {
            self.settings(undefined);
            self.phoneNumber(undefined);
            self.token(undefined);
            self.errorMessage(undefined);
            self.successMessage(undefined);
        }

        self.cancel = function () {
            clearData();
            self.started(false);
            socket.disconnect();
        };

        self.initialise = function() {
            self.started(true);
            self.loadingToken(true);

            if (socket) {
                socket.socket.reconnect();
            } else {
                socket = io.connect('', {
                    'sync disconnect on unload': false
                });
                window.addEventListener('beforeUnload', function() {
                    self.cancel();
                });
            }

            socket.on('token', function (data) {
                self.started(true);
                self.errorMessage(undefined);
                self.loadingToken(false);
                self.token(data);
            });

            socket.on('userId', function (data) {
                self.token(null);
                self.phoneNumber(data);
            });

            socket.on('settings', function (data) {
                self.settings(map.fromJS(data));
            });

            socket.on('errorMessage', function(data) {
                self.errorMessage(data);
            });

            socket.on('successMessage', function(data) {
                self.successMessage(data);
            });

            socket.on('reconnect', function() {
                clearData();
                self.errorMessage(undefined);
            });

            socket.on('disconnect', function() {
                clearData();
                if (self.started()) {
                    self.loadingToken(true);
                    self.errorMessage('Disconnected from server. Attempting to reconnect...');
                }
            });

            function fatal() {
                clearData();
                self.fatal(true);
                self.errorMessage('Unable to connect to server. Please try again later.');
            }

            socket.on('connect_failed', function() {
                fatal();
            });

            socket.on('reconnect_failed', function() {
                fatal();
            });
        };

        self.saveSettings = function() {
            socket.emit('settings', map.toJS(self.settings()));
        };
    };

    var viewModel = new ViewModel();

    return {
        viewModel: viewModel,
        init: function() {
            ko.applyBindings(viewModel);
        }
    };
});