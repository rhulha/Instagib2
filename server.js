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
  constructor(name, private) {
    this.name = name;
    this.private = private;
    this.players = [];
  }
}

class Player {
  constructor(id, name, room, ws) {
    this.id = id;
    this.name = name;
    this.room = room;
    this.ws = ws;
    this.x=0;
    this.y=0;
    this.z=0;
    this.rx=0;
    this.ry=0;
  }

  handleUpdate(update) {
    if( this.id !== update.id) {
      console.log("this.id !== update.id");
    } else {
      this.x = update.pos.x;
      this.y = update.pos.y;
      this.z = update.pos.z;
      this.rx = update.rot.x;
      this.ry = update.rot.y;
    }
  }
}

var interval;

function sendPlayerPositions() {
  for( var room_name of rooms ) {
    var room = rooms[room_name];
    for( var player in room.players ) {
      if( player.ws.readyState === WebSocket.OPEN ) {
        player.ws.send(JSON.stringify(room.players));
      }
    }
  }
}
// TODO: clean up empty rooms over time.

interval = setInterval(sendPlayerPositions, 16);


wss.on('connection', (ws, req) => {
  console.log('client connected');
  const { query: { name, room } } = url.parse(req.url, true);

  var id = crypto.randomBytes(16).toString('hex');
  var player = new Player(id, name?name:id, room, ws);
  if( !rooms[room] ) {
    rooms[room] = new Room(room);
  }
  rooms[room].players.push(player);
  ws.on('message', player.handleUpdate.bind(player));

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

