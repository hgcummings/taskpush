'use strict';

var inboundMessage = require('./inbound-message.js');
var outbound = require('../checkvist.js');
var ipFilter = require('./ipFilter.js');
var tokenMiddleware = require('../auth/tokenMiddleware.js');

function configure(app, route, tokenSource) {
    // Nexmo will only use our URL if we respond to a GET and POST request with an HTTP 200
    // This can't be filtered by IP as the request comes from Nexmo's web servers, not their SMS gateway
    app.get(route, function(req, res) {
        res.send('', 200);
    });

    var filters = [ipFilter.checkIp, tokenMiddleware(tokenSource, inboundMessage)];
    app.post(route, filters, function(request, response) {
        var message = inboundMessage.parse(request);

        outbound.pushTasks(
            {
                userId: message.userId,
                operationId: message.operationId,
                tasks: message.content
            },
            response);
    });
}

module.exports = configure;