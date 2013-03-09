'use strict';

var express = require('express');
var app = express();

app.use(express.bodyParser());

require('./lib/nexmo/controller.js')(app, '/nexmo/');

var port = process.env.PORT || 5000;
app.enable('trust proxy');
app.listen(port, function() {
    console.log('Listening on ' + port);
});