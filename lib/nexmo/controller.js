'use strict';

var inboundMessage = require('./inbound-message.js');
var outbound = require('../checkvist.js');
var ipFilter = require('./ipFilter.js');

function configure(app, route) {
    // Nexmo will only use our URL if we respond to a HEAD request with an HTTP 200
    app.head(route, ipFilter.checkIp, function(req, res) {
        res.send('', 200);
    });

    app.post(route, ipFilter.checkIp, function(request, response) {
        outbound.pushTasks(
            inboundMessage.parse(request),
            response);
    });
}

module.exports = configure;