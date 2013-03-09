'use strict';

var inboundMessage = require('./inbound-message.js');
var outbound = require('../checkvist.js');
var ipFilter = require('./ipFilter.js');

function configure(app, route) {
    // Nexmo will only use our URL if we respond to a HEAD request with an HTTP 200
    // This can't be filtered by IP as the request comes from Nexmo's web servers, not their SMS gateway
    app.head(route, function(req, res) {
        res.send('', 200);
    });

    app.post(route, ipFilter.checkIp, function(request, response) {
        outbound.pushTasks(
            inboundMessage.parse(request),
            response);
    });
}

module.exports = configure;