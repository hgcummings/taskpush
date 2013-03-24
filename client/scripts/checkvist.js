define(['jquery', 'knockout', 'settings'], function($, ko, settings) {
    'use strict';

    var viewModel = settings.viewModel;
    viewModel.hasCheckvist = ko.observable(false);

    viewModel.settings.subscribe(function(settings) {
        if (settings && settings.checkvist) {
            var updateCheckvist = function updateCheckvist() {
                if (settings.checkvist.username() && settings.checkvist.apiKey()) {
                    $.ajax({
                        url: 'https://checkvist.com/auth/login.json',
                        dataType: 'jsonp',
                        data: {
                            'username': settings.checkvist.username(),
                            'remote_key': settings.checkvist.apiKey()
                        },
                        // Note that must specify a timeout when using JSONP, else the error callback will never fire
                        timeout: 2000,
                        error: function() {
                            viewModel.hasCheckvist(false);
                            viewModel.errorMessage('Unable to connect to checkvist. Please check your credentials.');
                        },
                        success: function(token) {
                            $.ajax({
                                url: 'https://checkvist.com/checklists.json',
                                dataType: 'jsonp',
                                data: {
                                    token: token
                                },
                                timeout: 2000,
                                error: function() {
                                    viewModel.hasCheckvist(false);
                                    viewModel.errorMessage('Error retrieving task lists from checkvist. Please try again later.');
                                },
                                success: function(data) {
                                    settings.checkvist.lists = data;
                                    viewModel.hasCheckvist(true);
                                }
                            });
                        }
                    });
                } else {
                    viewModel.hasCheckvist(false);
                }
            };

            settings.checkvist.username = settings.checkvist.username || ko.observable();
            settings.checkvist.apiKey = settings.checkvist.apiKey || ko.observable();

            settings.checkvist.username.subscribe(updateCheckvist);
            settings.checkvist.apiKey.subscribe(updateCheckvist);

            updateCheckvist();
        } else {
            viewModel.hasCheckvist(false);
        }
    });
});