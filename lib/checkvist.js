var request = require('request');

function pushTask(userSettings, operationId, taskContent) {
    var httpAuth =
        'Basic ' + new Buffer(userSettings.checkvist.username + ':' + userSettings.checkvist.apiKey).toString('base64');
    var httpUrl = "http://checkvist.com/checklists/" + userSettings.checkvist.checklistId + "/tasks.json";

    request.post(
        {
            headers : { 'Authorization': httpAuth },
            url: httpUrl,
            body: "task[content]=" + taskContent
        },
        function(error, response, body) {
            if (error) {
                // This indicates a transport error rather than an error response from checkvist
                console.error({ type: "response", operationId: operationId, error: error});
                return 500;
            } else {
                console.info({ type: "response", operationId: operationId, body: body});
                // Pass checkvist response code back to the caller, so they can retry if necessary
                return response.statusCode;
            }
        }
    );
}

exports.pushTask = pushTask;