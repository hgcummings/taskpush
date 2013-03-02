function getTasksFor(request) {
    return request.param("text").split("\n");
}

function configure(app, route, callback) {
    // Nexmo will only use our URL if we respond to a HEAD request with an HTTP 200
    app.head(route, function(req, res) {
        res.send("", 200);
    });
    app.get(route, function(req, res) {
        var operationId = req.param("messageId");
        console.info({ type: "request", operationId: operationId, query: req.query, body: req.body});
        res.send("", callback(operationId, getTasksFor(req), res));
    });
}

exports.configure = configure;