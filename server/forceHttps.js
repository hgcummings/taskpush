'use strict';

module.exports = function forceHttps(request, response, next) {
    if (request.host === 'localhost' || request.secure) {
        next();
    } else {
        response.setHeader('Location', process.env.ROOT_URL + request.url);
        response.send('', 301);
    }
};