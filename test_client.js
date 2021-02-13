// Copyright 2021 Raymond Hulha, Licensed under Affero General Public License https://www.gnu.org/licenses/agpl-3.0.en.html
// https://github.com/rhulha/Instagib2

const fs = require('fs');
const WebSocket = require('ws');

const client = new WebSocket('ws://localhost:8080/websocket?name=Bot&room=Test');

var lines;
var lines_pos = 0;

fs.readFile('player_log.txt', 'utf8', function (err, contents) {
    lines = contents.split("\r\n");
});

var player_log = "";


function sendStuffSlowly(client) {
    console.log('SetTimeout, setStuffSlowly');
    var interval = setInterval(() => {
        var line = lines[lines_pos++ % lines.length];
        if (line === undefined)
            clearInterval(interval);
        //console.log(line);
        client.send(line);
    }, 16);
}


client.on('open', function open() {
    sendStuffSlowly(client);
    // ws.send('something');
});

client.on('message', function incoming(data) {
    //console.log(data);
});

