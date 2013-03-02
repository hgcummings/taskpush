var express = require('express');

var app = express();
var uuid = require('node-uuid');

app.use(express.bodyParser());

var pushTask = function(req, res){
  var id = req.param("id", uuid.v1());
  console.info({ type: "request", identifier: id, query: req.query, body: req.body});

  var taskReq = require('request'),
   username = "username",
   password = "password",
   auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64'),
   url = "http://checkvist.com/checklists/checklist_id/tasks.json";

  req.param("text").split("\n").forEach(function(taskContent) {
    taskReq.post(
      {
    	  headers : { 'Authorization': auth },
        url: url,
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