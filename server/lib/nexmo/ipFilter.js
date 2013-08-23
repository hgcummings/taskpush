'use strict';

var Netmask = require('netmask').Netmask;

// See https://nexmo.zendesk.com/entries/23181071-Source-IP-subnet-for-incoming-traffic-in-REST-API
var whitelist = new Netmask('174.36.197.192/28');

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

    if (whitelist.contains(lastForwardedIp)) {
        next();
    } else {
        console.info('Stopped processing request from non-whitelisted IP: ' + lastForwardedIp +
            ' (Forward chain:' + request.header('X-Forwarded-For') +')');
        // Should really return a 404 here, but we need to send back a 200 to nexmo's *web* servers (which aren't on the
        // same subnet as the whitelisted gateway servers) in order for them to recognise our endpoint as a valid one.
        response.send('', 200);
    }
}

exports.checkIp = checkIp;