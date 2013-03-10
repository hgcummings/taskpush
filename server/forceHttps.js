'use strict';

module.exports = function forceHttps(request, response, next) {
    console.info(request.host);
    console.info(request.protocol);
    if (request.host === 'localhost' || request.secure) {
        next();
    } else {
        response.setHeader('Location', process.env.ROOT_URL + request.url);
        response.send('', 301);
    }
};