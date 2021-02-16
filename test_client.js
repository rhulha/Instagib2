// Copyright 2021 Raymond Hulha, Licensed under Affero General Public License https://www.gnu.org/licenses/agpl-3.0.en.html
// https://github.com/rhulha/Instagib2

const fs = require('fs');
const WebSocket = require('ws');

var server_hostname = "instagib.me:80";
server_hostname = "localhost:8080";
//server_hostname = "best-strengthened-beef.glitch.me";

var lines1=fs.readFileSync('player_log1.txt', 'utf8').split("\r\n");
var lines2=fs.readFileSync('player_log2.txt', 'utf8').split("\r\n");
var lines3=fs.readFileSync('player_log3.txt', 'utf8').split("\r\n");

class TestClient {

    constructor(name, room, color, lines) {
        this.name=name||"Bot";
        this.room=room;
        this.color=color;
        this.lines=lines;
        this.lines_pos = Math.floor(Math.random() * lines.length-1) + 1;
        var url = 'ws://'+server_hostname+'/websocket?name='+name+'&room='+room+'&color='+color;
        console.log(url);
        this.ws = new WebSocket(url);
        this.ws.sendObjAsJSON=function(obj){this.send(JSON.stringify(obj))};
        this.ws.on('open', this.setupComms.bind(this) );
        this.ws.on('message', function incoming(data) {
            //console.log(data);
        });
    }

    setupComms() {
        console.log('setting up communication.');
        
        this.ivpos = setInterval((() => {
            var line = this.lines[this.lines_pos++ % this.lines.length];
            if (line === undefined)
                return;
            this.ws.send(line);
        }).bind(this), 16);

        this.ivshoot = setInterval((() => {
            this.ws.sendObjAsJSON({cmd:"rail_random"});
        }).bind(this), 4000+Math.floor(Math.random() * 8000) + 1 );
    }

    // clearInterval(interval)    
}

new TestClient("Bot1 Ralf",   "Test6", "ff0000", lines1);
new TestClient("Bot2 Walter", "Test6", "ffffff", lines1);
new TestClient("Bot3 Yarn",   "Test6", "ffff00", lines1);
new TestClient("Bot4 Gustav", "Test6", "00ff00", lines1);
new TestClient("Bot5 Bart",   "Test6", "0000ff", lines1);

