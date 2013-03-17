'use strict';

var settingsClient = require('../settingsClient.js');

function configure(server, tokenSource) {
    var io = require('socket.io').listen(server);

    io.sockets.on('connection', function(socket) {
        var client = settingsClient.createClient({
            send: socket.emit.bind(socket)
        });

        tokenSource.getToken(client, function(error, token) {
            if (error) {
                socket.emit('error', error.message);
            } else {
                socket.on('disconnect', function() {
                    tokenSource.releaseToken(token, client);
                });

                socket.emit('token', token);

                socket.on('settings', function(settings) {
                    client.saveSettings(settings);
                });
            }
        });
    });
}

module.exports = configure;