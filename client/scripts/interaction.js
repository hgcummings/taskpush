require(['jquery', 'settings', 'bootstrap'], function($, settings) {
    'use strict';

    var subscription = settings.viewModel.settings.subscribe(function(settings) {
        if (settings) {
            window.setTimeout(function() {
                $('.icon-question-sign').popover({ delay: { show: 0, hide: 1000 } });
                subscription.dispose();
            }, 0);
        }
    });
});