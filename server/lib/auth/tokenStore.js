'use strict';

require('./words.js');

function getRandomElement(array) {
    return array[Math.floor((Math.random() * array.length))];
}

module.exports = function createTokenSource(adjectives, nouns) {
    var tokenSource = {};
    var assignedTokens = {};

    tokenSource.getToken = function(object, callback) {
        var tries = 0;
        var token;
        do {
            token = getRandomElement(adjectives) + ' ' + getRandomElement(nouns);

            if (++tries > 100) {
                // This should never happen, unless we're leaking tokens somehow
                return callback(new Error('Not enough tokens available'), null);
            }
        } while(assignedTokens.hasOwnProperty(token));
        assignedTokens[token] = object;
        callback(null, token);
    };

    tokenSource.releaseToken = function(token, object) {
        if (assignedTokens[token] === object) {
            delete assignedTokens[token];
        }
    };

    tokenSource.getObjectAssignedForToken = function(token) {
        return assignedTokens[token];
    };

    return tokenSource;
};