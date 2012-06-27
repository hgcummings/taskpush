var express = require('express');

var app = express.createServer(express.logger());
var uuid = require('node-uuid');

app.use(express.bodyParser());

app.post('/tasks/', function(req, res){
  console.info(req.body);

  var taskReq = require('request'),
   username = "username",
   password = "password",
   auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64'),
   url = "http://checkvist.com/checklists/checklist_id/tasks.json";

  taskReq.post({
  	  headers : {
        'Authorization': auth
  	  },
      url: url,
      body: "task[content]=" + req.param("message")
    }, function(error, response, body) {
      var id = req.param("id", uuid.v1());
      if (error) {
        // This indicates a transport error rather than an error response from checkvist
        console.error(id + ": " + error);
        res.send("", 500);
      } else {
        // Always send an empty response, since we don't want to pay for a return message
        console.info(id + ": " + body);
        // Pass checkvist response code back to the caller, so they can retry if necessary
        res.send("", response.statusCode);
      }
  });
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});