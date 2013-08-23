'use strict';

var Netmask = require('netmask').Netmask;

// See https://nexmo.zendesk.com/entries/23181071-Source-IP-subnet-for-incoming-traffic-in-REST-API
var whitelists = [new Netmask('174.36.197.192/28') , new Netmask('119.81.44.13/30')];

function checkIp(request, response, next) {
    // Only look at the last non-local IP in the chain, since this is set by the host router
    // The rest of the chain could come from anywhere (and would be trivial to spoof)
    var forwardChain = request.header('X-Forwarded-For').split(',');
    var lastForwardedIp = forwardChain.pop();
    var localSubnet;

    if (process.env.LOCAL_SUBNET) {
        localSubnet = new Netmask(process.env.LOCAL_SUBNET);
    }

    if (localSubnet && localSubnet.contains(lastForwardedIp) && forwardChain.length) {
        lastForwardedIp = forwardChain.pop();
    }

    for (var i = 0; i < whitelists.length; ++i) {
        if (whitelists[i].contains(lastForwardedIp)) {
            next();
            return;
        }
    }

    console.info('Blocked request from: ' + lastForwardedIp +
        ' (Forward chain:' + request.header('X-Forwarded-For') +')');
    response.send('', 404);
}

exports.checkIp = checkIp;