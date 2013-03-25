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
                errorMessages: mock.ko.observableArray()
            }
        };

        checkvistModule(mock.jQ, mock.ko, mock.settings);
    });

    after(function() {
        delete global.define;
        delete global.window;
        console.info.restore();
    });

    it ('should initialise a checkvist.loaded property on the viewModel', function() {
        assert(mock.settings.viewModel.checkvist.loaded);
        assert(!mock.settings.viewModel.checkvist.loaded());
    });

    function testUpdateSettings(settings) {
        assert(mock.settings.viewModel.settings.subscribe.calledOnce);
        mock.settings.viewModel.settings(settings);
        var callback = mock.settings.viewModel.settings.subscribe.getCall(0).args[0];
        callback(settings);
    }

    function createDummySettings(username, apiKey) {
        return {
            checkvist: {
                username: mock.ko.observable(username),
                apiKey: mock.ko.observable(apiKey)
            }
        };
    }

    describe('on changes to checkvist settings', function() {
        var dummyUsername = 'test@example.com';
        var dummyApiKey = 'secret';
        var dummySettings;

        beforeEach(function() {
            dummySettings = createDummySettings(dummyUsername, dummyApiKey);

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

        it('should set checkvist.loaded to false if username removed', function() {
            assert(mock.jQ.ajax.calledOnce);
            dummySettings.checkvist.username('');

            mock.settings.viewModel.checkvist.loaded(true);
            testUpdateProperty(dummySettings.checkvist.username);

            assert(mock.jQ.ajax.calledOnce);
            assert(!mock.settings.viewModel.checkvist.loaded());
        });

        it('should set checkvist.loaded to false if API Key removed', function() {
            assert(mock.jQ.ajax.calledOnce);
            dummySettings.checkvist.apiKey('');

            mock.settings.viewModel.checkvist.loaded(true);
            testUpdateProperty(dummySettings.checkvist.apiKey);

            assert(mock.jQ.ajax.calledOnce);
            assert(!mock.settings.viewModel.checkvist.loaded());
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
                assert(mock.settings.viewModel.checkvist.loaded());
            });

            it('should record an error if task lists cannot be retrieved', function() {
                assert(mock.jQ.ajax.calledTwice);
                var options = mock.jQ.ajax.getCall(1).args[0];

                mock.settings.viewModel.checkvist.loaded(true);

                options.error();

                assert(!mock.settings.viewModel.checkvist.loaded());
                assert(mock.settings.viewModel.errorMessages.push.calledOnce);
            });
        });

        it('should record an error if authentication fails', function() {
            assert(mock.jQ.ajax.calledOnce);
            var options = mock.jQ.ajax.getCall(0).args[0];

            mock.settings.viewModel.checkvist.loaded(true);

            options.error();

            assert(!mock.settings.viewModel.checkvist.loaded());
            assert(mock.settings.viewModel.errorMessages.push.calledOnce);
        });
    });

    it('should set checkvist.loaded to false if settings are not present', function() {
        mock.settings.viewModel.checkvist.loaded(true);
        testUpdateSettings();
        assert(!mock.settings.viewModel.checkvist.loaded());
    });

    it('should set checkvist.loaded to false if settings do not contain checkvist settings', function() {
        mock.settings.viewModel.checkvist.loaded(true);
        testUpdateSettings({});
        assert(!mock.settings.viewModel.checkvist.loaded());
    });

    it('should create observable username and apiKey properties on checkvist settings if not present', function() {
        var emptySettings = { checkvist: {} };

        testUpdateSettings(emptySettings);

        assert(emptySettings.checkvist.username.subscribe);
        assert(emptySettings.checkvist.apiKey.subscribe);
    });

    describe('validate', function() {
        it ('should set fields to error state when empty', function() {
            mock.settings.viewModel.settings(createDummySettings('',''));
            mock.settings.viewModel.checkvist.validate();
            assert.equal('error', mock.settings.viewModel.checkvist.usernameState());
            assert.equal('error', mock.settings.viewModel.checkvist.apiKeyState());
        });

        it ('should not change existing state when fields have data', function() {
            mock.settings.viewModel.settings(createDummySettings('test@example.com','secret'));

            var dummyState = 'fieldy';

            mock.settings.viewModel.checkvist.usernameState(dummyState);
            mock.settings.viewModel.checkvist.apiKeyState(dummyState);

            mock.settings.viewModel.checkvist.validate();
            assert.equal(dummyState, mock.settings.viewModel.checkvist.usernameState());
            assert.equal(dummyState, mock.settings.viewModel.checkvist.apiKeyState());
        });
    });

    describe('callbacks arrive out of order', function() {
        it('should ignore no-longer relevant authentication callback', function() {
            testUpdateSettings(createDummySettings('firstUsername', 'firstApiKey'));
            assert(mock.jQ.ajax.calledOnce);
            var options = mock.jQ.ajax.getCall(0).args[0];

            mock.settings.viewModel.settings(createDummySettings('secondApiKey', 'secondUsername'));

            options.error();
            assert(mock.settings.viewModel.errorMessages.push.notCalled);

            options.success('token');
            assert(mock.jQ.ajax.calledOnce);
        });

        it('should ignore no-longer relevant list retrieval callback', function() {
            testUpdateSettings(createDummySettings('firstUsername', 'firstApiKey'));
            assert(mock.jQ.ajax.calledOnce);
            var options = mock.jQ.ajax.getCall(0).args[0];
            options.success('token');
            assert(mock.jQ.ajax.calledTwice);
            options = mock.jQ.ajax.getCall(1).args[0];

            mock.settings.viewModel.settings(createDummySettings('secondApiKey', 'secondUsername'));

            options.error();
            assert(mock.settings.viewModel.errorMessages.push.notCalled);

            options.success({});
            assert(mock.jQ.ajax.calledTwice);
            assert(mock.settings.viewModel.checkvist.loading());
        });
    });
});