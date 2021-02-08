// Copyright 2021 Raymond Hulha, Licensed under Affero General Public License https://www.gnu.org/licenses/agpl-3.0.en.html

const fs = require('fs');
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
  constructor(id, name, room, ws) {
    this.id = id;
    this.name = name;
    this.kills=0;
    Object.defineProperty(this, 'room', {value: 'static', writable: true});
    this.room = room;
    Object.defineProperty(this, 'ws', {value: 'static', writable: true});
    this.ws = ws;
    this.x=0;
    this.y=0;
    this.z=0;
    this.rx=0;
    this.ry=0;
  }

  handleUpdate(msg) {
    msg = JSON.parse(msg);
    if (msg.cmd == "pos") {
      this.x = msg.pos.x;
      this.y = msg.pos.y;
      this.z = msg.pos.z;
      this.rx = msg.rot.x;
      this.ry = msg.rot.y;
    } else if (msg.cmd == "rail") {
      broadcast(msg, this.ws);
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
          this_player_id:player.id,
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
  const { query: { name, room } } = url.parse(req.url, true);
  var id = crypto.randomBytes(16).toString('hex');
  console.log('client connected', name, room, id);
  if( !rooms[room] ) {
    rooms[room] = new Room(room);
  }
  var player = new Player(id, (name?name:id), rooms[room], ws);
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

