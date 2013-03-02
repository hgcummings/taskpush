var request = require('request');

var httpAuth = 'Basic ' + new Buffer(process.env.CV_USERNAME + ':' + process.env.CV_API_KEY).toString('base64');
var httpUrl = "http://checkvist.com/checklists/" + process.env.LIST_ID + "/tasks.json";

function pushTask(taskContent, operationId) {
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
};

exports.pushTask = pushTask;