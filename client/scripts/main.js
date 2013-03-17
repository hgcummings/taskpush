(function() {
    'use strict';

    requirejs.config({
        paths: {
            'knockout' : '//ajax.aspnetcdn.com/ajax/knockout/knockout-2.2.1',
            'socket.io': '/socket.io/socket.io'
        }
    });

    require(['settings'], function(settings) {
        settings.init();
    });
}());