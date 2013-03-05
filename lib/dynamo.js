var aws = require('aws-sdk');

aws.config.update({
    accessKeyId: process.env.AWS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET,
    region: process.env.AWS_REGION });

var dynamoDb = new aws.DynamoDB();

function getSettings(userId, callback) {
    dynamoDb.client.getItem(
        {
            TableName: 'checkvist-users',
            Key: { HashKeyElement: { 'N': userId } }
        },
        function(error, data) {
            if (error) {
                callback(error, null);
            } else {
                callback(null, {
                    checkvist: {
                        username: data.Item.username.S,
                        apiKey: data.Item.apiKey.S,
                        listId: data.Item.listId.S
                    }
                });
            }
        }
    );
}

exports.getSettings = getSettings;