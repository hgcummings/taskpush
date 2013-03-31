'use strict';

var userRepository = require('./userRepository.js');

exports.createClient = function createClient(channel) {
    var client = {};

    client.setUserId = function setUserId(userId) {
        if (client.userId) {
            // Should never happen
            console.warn('setUserId called twice on same client');
        }

        client.userId = userId;

        userRepository.getSettings(userId, function(error, data) {
            if (error) {
                channel.send('errorMessage', 'Error retrieving settings');
            } else {
                channel.send('userId', userId);
                channel.send('settings', data);
            }
        });
    };

    client.saveSettings = function saveSettings(settings) {
        if (!client.userId) {
            console.error('Attempt to save settings without userId');
            channel.send('errorMessage', 'Error saving settings');
        } else {
            userRepository.saveSettings(client.userId, settings, function(error) {
                if (error) {
                    channel.send('errorMessage', 'Error saving settings');
                } else {
                    channel.send('successMessage', 'Settings saved successfully');
                }
            });
        }
    };

    client.deleteSettings = function deleteSettings() {
        if (!client.userId) {
            console.error('Attempt to delete settings without userId');
            channel.send('errorMessage', 'Error saving settings');
        } else {
            userRepository.deleteSettings(client.userId, function(error) {
                if (error) {
                    channel.send('errorMessage', 'Error deleting settings');
                } else {
                    channel.send('successMessage', 'Settings deleted');
                    channel.send('userId', null);
                }
            });
        }
    };

    return client;
};