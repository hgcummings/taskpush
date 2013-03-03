var outbound = require('./checkvist.js');
var store = require('./dynamo.js');

function pushTasks(message, res){
    var settings = store.getSettings(message.userId);

    message.tasks.forEach(function(task) {
        outbound.pushTask(settings, message.operationId, task, res);
    });
}

exports.pushTasks = pushTasks;