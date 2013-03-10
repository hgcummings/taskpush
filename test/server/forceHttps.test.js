'use strict';

var assert = require('assert');
var sinon = require('sinon');

var forceHttps = require('../../server/forceHttps.js');

describe('forceHttps', function() {
    var spyNext;
    var response;

    beforeEach(function() {
        spyNext = sinon.spy();
        response = { send: sinon.spy(), setHeader: sinon.spy() };
    });

    function MockRequest(host, secure) {
        this.host = host;
        this.secure = secure;
        this.header = sinon.stub();
        this.header.withArgs('X-Forwarded-Proto').returns(secure ? 'https' : 'http');
    }

    function verifyHasNoEffect() {
        assert(spyNext.calledOnce);
        assert(response.send.notCalled);
        assert(response.setHeader.notCalled);
    }

    it('should have no effect on localhost', function() {
        var request = new MockRequest('localhost', false);
        forceHttps(request, response, spyNext);
        verifyHasNoEffect();
    });

    it('should have no effect on secure requests', function() {
        var request = new MockRequest('test.example.com', true);
        forceHttps(request, response, spyNext);
        verifyHasNoEffect();
    });

    it('should redirect insecure requests to the corresponding secure URL', function() {
        var secureRootUrl = 'https://test.example.com';
        var oldRootUrl = process.env.ROOT_URL;
        process.env.ROOT_URL = secureRootUrl;
        var dummyUrl = '/route/';
        var request = new MockRequest('test.example.com', false);
        request.url = dummyUrl;

        forceHttps(request, response, spyNext);

        assert(spyNext.notCalled);
        assert(response.send.calledOnce);
        assert(response.setHeader.calledOnce);
        assert.equal('Location', response.setHeader.getCall(0).args[0]);
        assert.equal(secureRootUrl + dummyUrl, response.setHeader.getCall(0).args[1]);
        assert.equal(301, response.send.getCall(0).args[1]);

        process.env.ROOT_URL = oldRootUrl;
    });
});