module.exports = function (tokenSource, messageParser) {
    'use strict';

    return function(request, response, next) {
        var message = messageParser.parse(request);
        var client = tokenSource.getObjectForToken(message.content);
        if (client) {
            tokenSource.releaseToken(message.content, client);
            client.setUserId(message.userId);
            response.send('', 200);
        } else {
            next();
        }
    };
};