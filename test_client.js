// Copyright 2021 Raymond Hulha, Licensed under Affero General Public License https://www.gnu.org/licenses/agpl-3.0.en.html
// https://github.com/rhulha/Instagib2

const fs = require('fs');
const WebSocket = require('ws');

var server_hostname = "instagib.me:80";
server_hostname = "localhost:8080"

var lines1=fs.readFileSync('player_log1.txt', 'utf8').split("\r\n");
var lines2=fs.readFileSync('player_log2.txt', 'utf8').split("\r\n");
var lines3=fs.readFileSync('player_log3.txt', 'utf8').split("\r\n");

class TestClient {

    constructor(name, color, lines) {
        this.name=name||"Bot";
        this.color=color;
        this.lines=lines;
        this.lines_pos = Math.floor(Math.random() * lines.length-1) + 1;
        this.ws = new WebSocket('ws://'+server_hostname+'/websocket?name='+name+'&room=Test'+'&color='+color);
        this.ws.on('open', this.sendPosToServer.bind(this) );
        this.ws.on('message', function incoming(data) {
            //console.log(data);
        });
    }

    sendPosToServer() {
        console.log('SetTimeout, setStuffSlowly');
        var interval = setInterval((() => {
            var line = this.lines[this.lines_pos++ % this.lines.length];
            if (line === undefined)
                return;
            this.ws.send(line);
        }).bind(this), 16);
    }

    // clearInterval(interval)    
}

new TestClient("Bot1", "red", lines1);
new TestClient("Bot4", "green", lines1);
new TestClient("Bot5", "blue", lines1);
new TestClient("Bot2", "white", lines2);
new TestClient("Bot3", "yellow", lines3);

