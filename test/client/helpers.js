'use strict';

var sinon = require('sinon');

exports.createMockKo = function() {
    return {
        applyBindings: sinon.spy(),
        observable: function (init) {
            var currentValue = init;

            function obs() {
                if (arguments.length > 0) {
                    currentValue = arguments[0];
                    return obs;
                } else {
                    return currentValue;
                }
            }

            obs.subscribe = sinon.spy();
            obs.initialValue = init;
            return obs;
        }
    };
};