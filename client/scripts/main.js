(function() {
    'use strict';

    requirejs.config({
        paths: {
            'knockout' : '//ajax.aspnetcdn.com/ajax/knockout/knockout-2.2.1',
            'koMapping'  : '//cdnjs.cloudflare.com/ajax/libs/knockout.mapping/2.3.5/knockout.mapping',
            'bootstrap': '//netdna.bootstrapcdn.com/twitter-bootstrap/2.3.1/js/bootstrap.min',
            'socket.io': '/socket.io/socket.io'
        }
    });

    require(['settings', 'checkvist', 'interaction'], function(settings) {
        settings.init();
    });
}());