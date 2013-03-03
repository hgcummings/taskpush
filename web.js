var express = require('express');
var controller = require('controller');

var app = express();

app.use(express.bodyParser());

require('./lib/nexmo/policy.js')
    .configure(app, '/tasks/', controller.pushTasks);

var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});