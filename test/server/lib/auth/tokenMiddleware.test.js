'use strict';

var assert = require('assert');
var sinon = require('sinon');
var tokenMiddleware = require('../../../../server/lib/auth/tokenMiddleware.js');

describe('tokenMiddleware', function() {
    var stubTokenSource = { getObjectForToken: sinon.stub() };
    var stubMessageParser = { parse: sinon.stub() };
    var dummyRequest = {};
    var spyResponse;
    var tokenFilter;
    var dummyMessage = {};
    var spyNext;

    before(function() {
        tokenFilter = tokenMiddleware(stubTokenSource, stubMessageParser);
        stubMessageParser.parse.withArgs(dummyRequest).returns(dummyMessage);
    });

    beforeEach(function() {
        dummyMessage.userId = '447890123456';
        spyResponse = { send: sinon.spy(), next: sinon.spy() };
        spyNext = sinon.spy();
    });

    afterEach(function() {
        delete dummyMessage.content;
        delete dummyMessage.userId;
    });

    describe('when message content matches a token', function() {
        var spyClient;

        beforeEach(function() {
            dummyMessage.content = 'shaving yak';
            spyClient = { setUserId: sinon.spy() };
            stubTokenSource.releaseToken = sinon.spy();
            stubTokenSource.getObjectForToken.withArgs(dummyMessage.content).returns(spyClient);
            tokenFilter(dummyRequest, spyResponse, spyNext);
        });

        it('should release the token', function() {
            assert(stubTokenSource.releaseToken.withArgs(dummyMessage.content, spyClient).calledOnce);
        });

        it('should set the userId on the client associated with the token', function() {
            assert(spyClient.setUserId.withArgs(dummyMessage.userId).calledOnce);
        });

        it('should return an OK response to the caller', function() {
            assert(spyResponse.send.calledOnce);
            assert.equal('', spyResponse.send.getCall(0).args[0]);
            assert.equal(200, spyResponse.send.getCall(0).args[1]);
        });

        it('should not delegate to the next handler', function(){
            assert(!spyNext.called);
        });
    });

    it('should strip extraneous whitespace from the token text', function() {
        dummyMessage.content = ' spacey sparrow ';
        tokenFilter(dummyRequest, spyResponse, spyNext);
        assert(stubTokenSource.getObjectForToken.withArgs('spacey sparrow').calledOnce);
    });

    it('should put the token text into lower case', function() {
        dummyMessage.content = 'cAsEy CaMeL';
        tokenFilter(dummyRequest, spyResponse, spyNext);
        assert(stubTokenSource.getObjectForToken.withArgs('casey camel').calledOnce);
    });

    it('should pass through requests that do not match a valid token', function() {
        tokenFilter(dummyRequest, spyResponse, spyNext);

        assert(!spyResponse.send.called);
        assert(spyNext.calledOnce);
    });
});