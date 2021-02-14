// Copyright 2021 Raymond Hulha, Licensed under Affero General Public License https://www.gnu.org/licenses/agpl-3.0.en.html
// https://github.com/rhulha/Instagib2

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const crypto = require('crypto');
const url = require('url');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

var rooms = {}; // <name_str,Room>
// var players_by_id = {};

class Room {
  constructor(name, private_) {
    this.name = name;
    this.private_ = private_;
    this.players = [];
  }
}

function broadcast(msg, skipClientWS) {
  wss.clients.forEach(function each(client) {
    if (client !== skipClientWS && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(msg));
    }
  });
}

class Player {
  constructor(id, name, room, color, ws) {
    this.id = id;
    this.name = name;
    Object.defineProperty(this, 'room', {value: 'static', writable: true});
    this.room = room;
    this.color = color;
    this.kills=0;
    Object.defineProperty(this, 'ws', {value: 'static', writable: true});
    this.ws = ws;
    this.x=0;
    this.y=0;
    this.z=0;
    this.rx=0;
    this.ry=0;
  }

  handleUpdate(msg) {
    if( !msg.startsWith("{")) {
      return;
    }
    msg = JSON.parse(msg);
    if (msg.cmd == "pos") {
      this.x = parseFloat(msg.pos.x); // parseFloat to sanitize user data.
      this.y = parseFloat(msg.pos.y);
      this.z = parseFloat(msg.pos.z);
      this.rx = parseFloat(msg.rot.x);
      this.ry = parseFloat(msg.rot.y);
    } else if (msg.cmd == "rail") {
      broadcast(msg, this.ws);
    } else if (msg.cmd == "selfkill") {
      this.kills--;
    } else if (msg.cmd == "hit") {
      this.kills++;
      broadcast(msg, this.ws);
    }
  }

  handleDisconnect() {
    console.log("player disconnected: ", this.name, this.room.name, this.id)
    broadcast({cmd:"disconnect", id: this.id}, this.ws);
    var index = this.room.players.indexOf(this);
    if (index > -1) {
      this.room.players.splice(index, 1);
    }
  }
}

var interval;

function sendPlayerPositions() {
  for( var room_name in rooms ) {
    var room = rooms[room_name];
    for( var player of room.players ) {
      if( player.ws.readyState === WebSocket.OPEN ) {
        var packet = {
          cmd: "packet",
          this_player_id: player.id,
          players: room.players
        }
        player.ws.send(JSON.stringify(packet));
      }
    }
  }
}
// TODO: clean up empty rooms over time.

interval = setInterval(sendPlayerPositions, 16);

wss.on('connection', (ws, req) => {
  var { query: { name, room, color } } = (req.url.length > 512 ? {query:{name:'hacker', room:'hacker', color:'red'}}: url.parse(req.url, true));
  var id = crypto.randomBytes(6).toString('hex');
  name = name.replace(/[^A-Za-z0-9]/g, '');
  room = room.replace(/[^A-Za-z0-9]/g, '');
  console.log('client connected', id, name, room, color);
  if( !rooms[room] ) {
    rooms[room] = new Room(room);
  }
  var player = new Player(id, (name?name:id), rooms[room], color, ws);
  rooms[room].players.push(player);
  ws.on('message', player.handleUpdate.bind(player));
  ws.on('close', player.handleDisconnect.bind(player));

});

app.use(express.static('web'));
app.use(express.static('icons'));

server.listen(8080, function() {
  console.log('Listening on %d', server.address().port);
});

process.on('SIGINT', function() {
  console.log('closing.');
  try {
    clearInterval(interval);
  } catch (error) {}
  try {
    wss.close();
    server.close();
  } catch (error) {}
  process.exit(1)
});

