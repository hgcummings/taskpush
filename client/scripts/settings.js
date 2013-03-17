define(['knockout', 'socket.io'], function(ko, io) {
    'use strict';

    var ViewModel = function() {
        var self = this;
        var socket;

        self.loadingToken = ko.observable(false);
        self.token = ko.observable();
        self.started = ko.observable(false);
        self.phoneNumber = ko.observable();
        self.settings = ko.observable();
        self.loaded = true;

        self.errorMessage = ko.observable();
        self.successMessage = ko.observable();

        self.cancel = function() {
            window.location.reload();
        };

        self.initialise = function() {
            self.started(true);
            self.loadingToken(true);
            socket = io.connect('');

            socket.on('token', function (data) {
                self.loadingToken(false);
                self.token(data);
            });

            socket.on('userId', function (data) {
                self.token(null);
                self.phoneNumber(data);
            });

            socket.on('settings', function (data) {
                self.settings(data);
            });

            socket.on('error', function(data) {
                self.errorMessage(data);
            });

            socket.on('success', function(data) {
                self.successMessage(data);
            });
        };

        self.saveSettings = function() {
            socket.emit('settings', self.settings());
        };
    };

    return {
        init: function() {
            var viewModel = new ViewModel();
            ko.applyBindings(viewModel);
        }
    };
});