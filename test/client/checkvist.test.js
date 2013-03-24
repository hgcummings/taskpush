'use strict';

var sinon = require('sinon');
var assert = require('assert');
var helpers = require('./helpers.js');

describe('checkvist', function () {
    var checkvistModule;



    var mock = {};

    before(function() {
        sinon.stub(console, 'info');
        global.define = sinon.spy();
        require('../../client/scripts/checkvist.js');
        checkvistModule = global.define.getCall(0).args[1];
    });

    beforeEach(function() {
        mock.jQ = { ajax: sinon.spy() };
        mock.ko = helpers.createMockKo();
        mock.settings = {
            viewModel: {
                settings: mock.ko.observable(),
                errorMessage: mock.ko.observable()
            }
        };

        checkvistModule(mock.jQ, mock.ko, mock.settings);
    });

    after(function() {
        delete global.define;
        delete global.window;
        console.info.restore();
    });

    it ('should initialise a hasCheckvist property on the viewModel', function() {
        assert(mock.settings.viewModel.hasCheckvist);
        assert(!mock.settings.viewModel.hasCheckvist());
    });

    function testUpdateSettings(settings) {
        assert(mock.settings.viewModel.settings.subscribe.calledOnce);
        var callback = mock.settings.viewModel.settings.subscribe.getCall(0).args[0];
        callback(settings);
    }

    describe('on changes to checkvist settings', function() {
        var dummyUsername = 'test@example.com';
        var dummyApiKey = 'secret';
        var dummySettings;

        beforeEach(function() {
            dummySettings = {
                checkvist: {
                    username: mock.ko.observable(dummyUsername),
                    apiKey: mock.ko.observable(dummyApiKey)
                }
            };

            testUpdateSettings(dummySettings);
        });

        function verifyAuthenticatedWithCheckvist(count) {
            /* jshint camelcase: false */
            assert.equal(count, mock.jQ.ajax.callCount);
            var options = mock.jQ.ajax.getCall(count - 1).args[0];

            assert.equal(options.url, 'https://checkvist.com/auth/login.json');
            assert.equal(dummyUsername, options.data.username);
            assert.equal(dummyApiKey, options.data.remote_key);
        }

        it('should authenticate with checkvist', function() {
            verifyAuthenticatedWithCheckvist(1);
        });

        function testUpdateProperty(property) {
            assert(property.subscribe.calledOnce);
            var callback = property.subscribe.firstCall.args[0];
            callback();
        }

        it('should re-authenticate when username changes', function() {
            testUpdateProperty(dummySettings.checkvist.username);
            verifyAuthenticatedWithCheckvist(2);
        });

        it('should re-authenticate when api key changes', function() {
            testUpdateProperty(dummySettings.checkvist.apiKey);
            verifyAuthenticatedWithCheckvist(2);
        });

        it('should set hasCheckvist to false if username removed', function() {
            assert(mock.jQ.ajax.calledOnce);
            dummySettings.checkvist.username('');

            mock.settings.viewModel.hasCheckvist(true);
            testUpdateProperty(dummySettings.checkvist.username);

            assert(mock.jQ.ajax.calledOnce);
            assert(!mock.settings.viewModel.hasCheckvist());
        });

        it('should set hasCheckvist to false if API Key removed', function() {
            assert(mock.jQ.ajax.calledOnce);
            dummySettings.checkvist.apiKey('');

            mock.settings.viewModel.hasCheckvist(true);
            testUpdateProperty(dummySettings.checkvist.apiKey);

            assert(mock.jQ.ajax.calledOnce);
            assert(!mock.settings.viewModel.hasCheckvist());
        });

        describe('on successful authentication', function() {
            var dummyToken = 'foobar';

            beforeEach(function() {
                assert(mock.jQ.ajax.calledOnce);
                var options = mock.jQ.ajax.getCall(0).args[0];
                options.success(dummyToken);
            });

            it('should retrieve task lists', function() {
                assert(mock.jQ.ajax.calledTwice);
                var options = mock.jQ.ajax.getCall(1).args[0];

                assert.equal(options.url, 'https://checkvist.com/checklists.json');
                assert.equal(dummyToken, options.data.token);

                var dummyLists = {};
                options.success(dummyLists);

                assert.equal(dummyLists, dummySettings.checkvist.lists);
                assert(mock.settings.viewModel.hasCheckvist());
            });

            it('should record an error if task lists cannot be retrieved', function() {
                assert(mock.jQ.ajax.calledTwice);
                var options = mock.jQ.ajax.getCall(1).args[0];

                mock.settings.viewModel.hasCheckvist(true);

                options.error();

                assert(!mock.settings.viewModel.hasCheckvist());
                assert(mock.settings.viewModel.errorMessage());
            });
        });

        it('should record an error if authentication fails', function() {
            assert(mock.jQ.ajax.calledOnce);
            var options = mock.jQ.ajax.getCall(0).args[0];


            mock.settings.viewModel.hasCheckvist(true);

            options.error();

            assert(!mock.settings.viewModel.hasCheckvist());
            assert(mock.settings.viewModel.errorMessage());
        });
    });

    it('should set hasCheckvist to false if settings are not present', function() {
        mock.settings.viewModel.hasCheckvist(true);
        testUpdateSettings();
        assert(!mock.settings.viewModel.hasCheckvist());
    });

    it('should set hasCheckvist to false if settings do not contain checkvist settings', function() {
        mock.settings.viewModel.hasCheckvist(true);
        testUpdateSettings({});
        assert(!mock.settings.viewModel.hasCheckvist());
    });

    it('should create observable username and apiKey properties on checkvist settings if not present', function() {
        var emptySettings = { checkvist: {} };

        testUpdateSettings(emptySettings);

        assert(emptySettings.checkvist.username.subscribe);
        assert(emptySettings.checkvist.apiKey.subscribe);
    });
});