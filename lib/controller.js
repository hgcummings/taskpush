var outbound = require('./checkvist.js');
var store = require('./dynamo.js');

function pushTasks(message, response){
    var settings = store.getSettings(message.userId);

    message.tasks.forEach(function(task) {
        outbound.pushTask(settings, message.operationId, task, response);
    });
}

exports.pushTasks = pushTasks;