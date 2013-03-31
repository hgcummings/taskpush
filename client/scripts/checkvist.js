define(['jquery', 'knockout', 'settings'], function($, ko, settings) {
    'use strict';

    var viewModel = settings.viewModel;

    viewModel.checkvist = {
        loaded: ko.observable(false),
        loading: ko.observable(false),
        valid: ko.observable(null),
        usernameState: ko.observable(''),
        apiKeyState: ko.observable(''),
        validate: function () {
            if (!viewModel.settings().checkvist.username()) {
                viewModel.checkvist.usernameState('error');
            }
            if (!viewModel.settings().checkvist.apiKey()) {
                viewModel.checkvist.apiKeyState('error');
            }
        }
    };

    var messages = {
        authenticationFailed: 'Unable to connect to checkvist. Please check your credentials.',
        retrievingListsFailed: 'Error retrieving task lists from checkvist. Please try again later.'
    };

    viewModel.settings.subscribe(function(settings) {
        if (settings && settings.checkvist) {
            var updateCheckvist = function updateCheckvist() {
                if (settings.checkvist.username() && settings.checkvist.apiKey()) {
                    var sourceUsername = settings.checkvist.username();
                    var sourceApiKey = settings.checkvist.apiKey();

                    var isCurrent = function () {
                        return sourceUsername === viewModel.settings().checkvist.username() &&
                            sourceApiKey === viewModel.settings().checkvist.apiKey();
                    };

                    viewModel.checkvist.loading(true);
                    viewModel.errorMessages.remove(messages.authenticationFailed);

                    $.ajax({
                        url: 'https://checkvist.com/auth/login.json',
                        dataType: 'jsonp',
                        data: {
                            'username': settings.checkvist.username(),
                            'remote_key': settings.checkvist.apiKey()
                        },
                        // Note that must specify a timeout when using JSONP, else the error callback will never fire
                        timeout: 1000,
                        error: function() {
                            if (!isCurrent()) {
                                return;
                            }

                            viewModel.checkvist.loading(false);
                            viewModel.checkvist.loaded(false);
                            viewModel.errorMessages.push(messages.authenticationFailed);

                            viewModel.checkvist.usernameState('warning');
                            viewModel.checkvist.apiKeyState('warning');
                        },
                        success: function(token) {
                            if (!isCurrent()) {
                                return;
                            }

                            viewModel.errorMessages.remove(messages.retrievingListsFailed);
                            viewModel.checkvist.usernameState('success');
                            viewModel.checkvist.apiKeyState('success');

                            $.ajax({
                                url: 'https://checkvist.com/checklists.json',
                                dataType: 'jsonp',
                                data: {
                                    token: token
                                },
                                timeout: 1000,
                                error: function() {
                                    if (!isCurrent()) {
                                        return;
                                    }

                                    viewModel.checkvist.loading(false);
                                    viewModel.checkvist.loaded(false);
                                    viewModel.errorMessages.push(messages.retrievingListsFailed);
                                },
                                success: function(data) {
                                    if (!isCurrent()) {
                                        return;
                                    }

                                    settings.checkvist.lists = data;
                                    viewModel.checkvist.loading(false);
                                    viewModel.checkvist.loaded(true);
                                }
                            });
                        }
                    });
                } else {
                    viewModel.checkvist.loaded(false);
                }
            };

            settings.checkvist.username = settings.checkvist.username || ko.observable();
            settings.checkvist.apiKey = settings.checkvist.apiKey || ko.observable();

            settings.checkvist.username.subscribe(updateCheckvist);
            settings.checkvist.apiKey.subscribe(updateCheckvist);

            updateCheckvist();
        } else {
            viewModel.checkvist.loaded(false);
        }
    });
});