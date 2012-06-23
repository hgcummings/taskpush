var express = require('express');

var app = express.createServer(express.logger());

app.use(express.bodyParser());

app.post('/tasks/', function(req, res){
  console.log("Incoming request:");
  console.log(req.body);

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
      body: "task[content]=" + req.body.message
    }, function(error, response, body) {
      console.log("Response from checkvist:");
      if (error) {
        console.log(error);
        res.send("", 500);
      } else {
        // Always send an empty response, since we don't want to pay for a return message
        console.log(body);
        res.send("", response.statusCode);
      }
  });
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});