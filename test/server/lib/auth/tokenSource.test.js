'use strict';

var assert = require('assert');

describe('tokenSource', function() {
    var ADJECTIVES = ['honey','sexual'];
    var NOUNS = ['badger','weasel'];

    var tokenSource;

    var dummyObjects = [{}, {}, {}, {}, {}];

    beforeEach(function() {
        tokenSource = require('../../../../server/lib/auth/tokenSource.js')(ADJECTIVES, NOUNS);
    });

    describe('getToken()', function() {
        it('should return an adjective noun token', function(done) {
            tokenSource.getToken({}, function(error, token) {
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
                tokenSource.getToken(dummyObjects[i], function (error, newToken) {
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
                tokenSource.getToken(dummyObjects[i], function (error) {
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

    });

    describe('releaseToken()', function() {
        function saturateTokenSource(callback) {
            var tokens = [];

            function getAndStoreToken(i) {
                tokenSource.getToken(dummyObjects[i], function (error, newToken) {
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

        it('should allow the token to be re-used if the correct owning object is passed in', function() {
            saturateTokenSource(function(tokens) {
                var tokenToRelease = tokens[0];
                tokenSource.releaseToken(tokenToRelease, dummyObjects[0]);
                tokenSource.getToken({}, function(error, newToken) {
                    assert.equal(null, error);
                    assert.equal(tokenToRelease, newToken);
                });
            });
        });

        it('should have no effect if the incorrect owning object is passed in', function() {
            saturateTokenSource(function(tokens) {
                tokenSource.releaseToken(tokens[0], dummyObjects[1]);
                tokenSource.getToken({}, function(error, newToken) {
                    assert(error);
                    assert.equal(null, newToken);
                });
            });
        });
    });

    describe('getObjectForToken', function() {
        it('should return the object assigned to the specified token', function() {
            var assignedToken;
            tokenSource.getToken(dummyObjects[0], function(error, token) {
                assignedToken = token;
            });

            assert.equal(dummyObjects[0], tokenSource.getObjectForToken(assignedToken));
        });

        it('should return undefined for an unrecognised token', function() {
            tokenSource.getToken(dummyObjects[0], function() {});

            var result = tokenSource.getObjectForToken('pink panther');

            assert.equal('undefined', typeof result);
        });
    });
});