'use strict';

var Netmask = require('netmask').Netmask;

var block = new Netmask('174.36.197.192/28');

function checkIp(request, response, next) {
    var lastForwardedIp = request.header('X-Forwarded-For').split(',').pop();
    if (block.contains(lastForwardedIp)) {
        next();
    } else {
        console.log('Blocked request from: ' + lastForwardedIp);
        response.send('', 404);
    }
}

exports.checkIp = checkIp;