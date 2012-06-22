var express = require('express');

var app = express.createServer(express.logger());

app.use(express.bodyParser());

app.post('/tasks/', function(req, res){
  console.log(req.body.message);

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
      if (error) {
        console.log(error);
        res.send(500);
      } else {
      	res.send("");
      }
  });
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});