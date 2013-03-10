'use strict';

var assert = require('assert');

describe('tokenStore', function() {
    var ADJECTIVES = ['honey','sexual'];
    var NOUNS = ['badger','weasel'];

    var tokenRepo;

    var dummyObjects = [{}, {}, {}, {}, {}];

    beforeEach(function() {
        tokenRepo = require('../../../../server/lib/auth/tokenStore.js')(ADJECTIVES, NOUNS);
    });

    describe('getToken()', function() {
        it('should return an adjective noun token', function(done) {
            tokenRepo.getToken({}, function(error, token) {
                assert.equal(null, error);
                var words = token.split(' ');
                assert.equal(2, words.length);
                assert(ADJECTIVES.indexOf(words[0]) !== -1);
                assert(NOUNS.indexOf(words[1]) !== -1);
                done();
            });
        });

        it ('should return a different token for each object', function(done) {
            var tokens = [];

            function verifyUniqueToken(i) {
                tokenRepo.getToken(dummyObjects[i], function (error, newToken) {
                    assert.equal(null, error);

                    tokens.forEach(function (token) {
                        assert.notEqual(token, newToken);
                    });

                    tokens.push(newToken);

                    if (tokens.length === 4) {
                        done();
                    }
                });
            }

            for (var i = 0; i < 4; i++) {
                verifyUniqueToken(i);
            }
        });

        it('should return an error if unable to find an available token', function(done) {
            function verifyExpectedError() {
                tokenRepo.getToken(dummyObjects[i], function (error) {
                    if (i < 4) {
                        assert.equal(null, error);
                    } else {
                        assert(error);
                        done();
                    }
                });
            }

            for (var i = 0; i < 5; i++) {
                verifyExpectedError();
            }
        });

        function saturateTokenStore(callback) {
            var tokens = [];

            function getAndStoreToken(i) {
                tokenRepo.getToken(dummyObjects[i], function (error, newToken) {
                    assert.equal(null, error);
                    tokens[i] = newToken;

                    if (tokens.length === 4) {
                        callback(tokens);
                    }
                });
            }

            for (var i = 0; i < 4; i++) {
                getAndStoreToken(i);
            }
        }

        it('releasing a token allows it to be re-used', function() {
            saturateTokenStore(function(tokens) {
                var tokenToRelease = tokens[0];
                tokenRepo.releaseToken(tokenToRelease, dummyObjects[0]);
                tokenRepo.getToken({}, function(error, newToken) {
                    assert.equal(null, error);
                    assert.equal(tokenToRelease, newToken);
                });
            });
        });

        it('releasing a token without passing in the correct owning object has no effect', function() {
            saturateTokenStore(function(tokens) {
                tokenRepo.releaseToken(tokens[0], dummyObjects[1]);
                tokenRepo.getToken({}, function(error, newToken) {
                    assert(error);
                    assert.equal(null, newToken);
                });
            });
        });
    });
});