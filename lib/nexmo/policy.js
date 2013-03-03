var inboundMessage = require('./inbound-message.js');

function configure(app, route, callback) {
    // Nexmo will only use our URL if we respond to a HEAD request with an HTTP 200
    app.head(route, function(req, res) {
        res.send("", 200);
    });

    app.get(route, function(req, res) {
        res.send("", callback(inboundMessage.parse(req)));
    });
}

exports.configure = configure;