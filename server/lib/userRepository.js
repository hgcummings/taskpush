'use strict';

var aws = require('aws-sdk');

aws.config.update({
    accessKeyId: process.env.AWS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET,
    region: process.env.AWS_REGION
});

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
                var settings = {
                    checkvist: {}
                };

                if (data.Item) {
                    settings.checkvist.username = data.Item.username.S;
                    settings.checkvist.apiKey = data.Item.apiKey.S;
                    settings.checkvist.listId = data.Item.listId.S;
                }

                callback(null, settings);
            }
        }
    );
}

function saveSettings(userId, settings, callback) {
    dynamoDb.client.putItem(
        {
            TableName: 'checkvist-users',
            Item: {
                'userId': { 'N': userId },
                'username': { 'S': settings.checkvist.username },
                'apiKey': { 'S': settings.checkvist.apiKey },
                'listId': { 'S': settings.checkvist.listId.toString() }
            }
        },
        callback
    );
}

exports.getSettings = getSettings;
exports.saveSettings = saveSettings;