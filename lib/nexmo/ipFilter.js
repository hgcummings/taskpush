'use strict';

var Netmask = require('netmask').Netmask;

// See https://nexmo.zendesk.com/entries/23181071-Source-IP-subnet-for-incoming-traffic-in-REST-API
var whitelist = new Netmask('174.36.197.192/28');

function checkIp(request, response, next) {
    // Only look at the last IP in the chain, since this is set by the Heroku router
    // The rest of the chain could come from anywhere (and would be trivial to spoof)
    var lastForwardedIp = request.header('X-Forwarded-For').split(',').pop();
    if (whitelist.contains(lastForwardedIp)) {
        next();
    } else {
        console.log('Blocked request from: ' + lastForwardedIp);
        response.send('', 404);
    }
}

exports.checkIp = checkIp;