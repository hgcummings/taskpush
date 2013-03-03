var outbound = require('./checkvist.js');
var store = require('./dynamo.js');

function pushTasks(userId, operationId, tasks){
    var response = 200;
    var settings = store.getSettings(userId);

    tasks.forEach(function(task) {
        if (response >=200 && response < 300) {
            response = outbound.pushTask(settings, operationId, task);
        }
    });

    return response;
}

exports.pushTasks = pushTasks;