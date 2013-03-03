var inboundMessage = require('./inbound-message.js');
var outbound = require('../checkvist.js');

function configure(app, route) {
    // Nexmo will only use our URL if we respond to a HEAD request with an HTTP 200
    app.head(route, function(req, res) {
        res.send("", 200);
    });

    app.get(route, function(request, response) {
        outbound.pushTasks(
            inboundMessage.parse(request),
            response);
    });
}

module.exports = configure;