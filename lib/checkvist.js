var request = require('request');
var store = require('./dynamo.js');

function pushTasks(message, response) {
    store.getSettings(message.userId, function(userSettings) {
        var httpAuth =
            'Basic ' + new Buffer(userSettings.checkvist.username + ':' + userSettings.checkvist.apiKey).toString('base64');
        var httpUrl = "https://checkvist.com/checklists/" + userSettings.checkvist.listId + "/import.json";

        request.post(
            {
                headers : { 'Authorization': httpAuth },
                url: httpUrl,
                body: "import_content=" + message.tasks
            },
            function(error, cvResponse, body) {
                if (error) {
                    // This indicates a transport error rather than an error response from checkvist
                    console.error({ type: "response", operationId: message.operationId, error: error});
                    response.send("", 500);
                } else {
                    console.info({ type: "response", operationId: message.operationId, body: body});
                    // Pass checkvist response code back to the caller, so they can retry if necessary
                    response.send("", cvResponse.statusCode);
                }
            }
        );
    }, function(error) {
        console.error({ type: "storeResponse", operationId: message.operationId, error: error});
        response.send("", 500);
    });
}

exports.pushTasks = pushTasks;