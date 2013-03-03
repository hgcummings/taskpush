var outbound = require('./checkvist.js');
var store = require('./dynamo.js');

function pushTasks(message){
    var response = 200;
    var settings = store.getSettings(message.userId);

    message.tasks.forEach(function(task) {
        if (response >=200 && response < 300) {
            response = outbound.pushTask(settings, message.operationId, task);
        }
    });

    return response;
}

exports.pushTasks = pushTasks;