'use strict'

var Netmask = require('netmask').Netmask;

var block = new Netmask('174.36.197.192/28');

function checkIp(request, response, next) {
    console.log('Incoming request forwarded for: ' + request.header('x-forwarded-for'));
    if (block.contains(request.ip)) {
        next();
    } else {
        console.log('Blocked request from: ' + request.ip);
        response.send('', 404);
    }
}

exports.checkIp = checkIp;