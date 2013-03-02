var express = require('express');
var app = express();

app.use(express.bodyParser());

var inbound = require('./lib/nexmo.js');
var outbound = require('./lib/checkvist.js');

var pushTasks = function(id, tasks){
    var response = 200;

    tasks.forEach(function(task) {
        if (response >=200 && response < 300) {
            response = outbound.pushTask(task);
        }
    });

    return response;
};

inbound.configure(app, '/tasks/', pushTasks);

var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});