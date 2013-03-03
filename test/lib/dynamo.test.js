var assert = require('assert');
var dynamo = process.env.USE_INSTRUMENTED ? require('../../lib-cov/dynamo.js') : require('../../lib/dynamo.js');

describe('dynamo', function() {
   describe('#getSettings(userId)', function() {
       it('should return settings required for posting a task', function() {
           var result = dynamo.getSettings('');

           assert(result.checkvist);
           assert(result.checkvist.hasOwnProperty('apiKey'));
           assert(result.checkvist.hasOwnProperty('checklistId'));
           assert(result.checkvist.hasOwnProperty('username'));
       })
   });
});