var express = require('express');

var app = express();
var uuid = require('node-uuid');

app.use(express.bodyParser());

var httpAuth = 'Basic ' + new Buffer(process.env.CV_USERNAME + ':' + process.env.CV_API_KEY).toString('base64');
var httpUrl = "http://checkvist.com/checklists/" + process.env.LIST_ID + "/tasks.json";

var pushTask = function(req, res){
    var id = req.param("messageId", uuid.v1());
    console.info({ type: "request", identifier: id, query: req.query, body: req.body});

    var taskReq = require('request');
    req.param("text").split("\n").forEach(function(taskContent) {
        taskReq.post(
            {
                headers : { 'Authorization': httpAuth },
                url: httpUrl,
                body: "task[content]=" + taskContent + " ^ASAP"
            },
            function(error, response, body) {
                if (error) {
                    // This indicates a transport error rather than an error response from checkvist
                    console.error({ type: "response", identifier: id, error: error});
                    res.send("", 500);
                } else {
                    console.info({ type: "response", identifier: id, body: body});
                    // Always send an empty response, since we don't want to pay for a return message
                    // Pass checkvist response code back to the caller, so they can retry if necessary
                    res.send("", response.statusCode);
                }
            }
        );
    });
};

// Nexmo will only use our URL if we respond to a HEAD request with an HTTP 200
app.head('/tasks/', function(req, res) {
    res.send("", 200);
});
app.get('/tasks/', pushTask);
app.post('/tasks/', pushTask);

var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});