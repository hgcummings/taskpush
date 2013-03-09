'use strict'

var Netmask = require('netmask').Netmask;

var block = new Netmask('174.36.197.192/28');

function checkIp(request, response, next) {
    if (block.contains(request.ip)) {
        next();
    } else {
        response.send('', 404);
    }
}

exports.checkIp = checkIp;