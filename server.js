// Copyright 2021 Raymond Hulha, Licensed under Affero General Public License https://www.gnu.org/licenses/agpl-3.0.en.html
// https://github.com/rhulha/Instagib2

const winston = require('winston');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const crypto = require('crypto');
const url = require('url');

const myFormat = winston.format.printf(({ level, message, timestamp }) => `${timestamp} ${level}: ${message}`);

const transports = {
  console: new winston.transports.Console({ level: 'info' }),
  file: new winston.transports.File({ filename: 'stdout.log' })
};

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), myFormat),
  transports: [transports.console, transports.file]
});


const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

/** @Type {Object.<string:Room>} */
var rooms = {};
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
    if( !id || id.length < 4)
      throw "id missing";
    if( !name || name.length <= 0)
      throw "name missing";
    if( !room instanceof Room)
      throw "room not instanceof Room";
    if( !color || color.length < 3)
      throw "color missing";
    if( !ws instanceof WebSocket)
     throw "websocket missing";
    this.id = id;
    this.name = name;
    Object.defineProperty(this, 'room', {value: 'static', writable: true});
    this.room = room;
    this.color = color;
    this.frags=0;
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
      msg.color = this.color;
      if( !msg.color || msg.color.length < 3)
        logger.error("ERROR: COLOR MISSING!!!", this.id, this.name, this.room);
      broadcast(msg, this.ws);  // TODO: harden data
    } else if (msg.cmd == "rail_random") {
      msg.color = this.color;
      var randomEnmemy;
      // try 5 times to get another player than one self from the same room.
      // this might fail if we are the only player.
      for(var i=0; i<5; i++) {
        randomEnmemy = this.room.players[Math.floor(Math.random() * this.room.players.length)];
        if( randomEnmemy.id != this.id)
          break;
      }
      if( randomEnmemy.id == this.id) {
        logger.info("did not find a randomEnmemy", this.id);
        return;
      }
      msg = {
        cmd: "rail",
        color: this.color,
        start: {x: this.x, y: this.y, z: this.z}, 
        end: {x: randomEnmemy.x, y: randomEnmemy.y, z: randomEnmemy.z}, 
      };
      broadcast(msg, this.ws);  // TODO: harden data

      msg = {
        cmd: "hit",
        pos: {x: randomEnmemy.x, y: randomEnmemy.y, z: randomEnmemy.z}, 
        id: randomEnmemy.id,
        source_id: this.id
      };
      broadcast(msg, this.ws);  // TODO: harden data

    } else if (msg.cmd == "fragself") {
      this.frags--;
    } else if (msg.cmd == "powerup") {
      this.frags+=3;
      broadcast(msg, this.ws);  // TODO: harden data
    } else if (msg.cmd == "hit") {
      this.frags++;
      msg.source_id = this.id;
      broadcast(msg, this.ws);  // TODO: harden data
    }
  }

  handleDisconnect() {
    logger.info("player disconnected: ", this.name, this.room.name, this.id)
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
  if(!color)
    color = "yellow";
  else
    color = color.replace(/[^A-Za-z0-9]/g, '');
  logger.info('client connected', id, name, room, color);
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

server.listen(process.env.PORT || 8080, function() {
  logger.info('Listening on ' + server.address().port);
});

process.on('SIGINT', function() {
  logger.info('closing.');
  try {
    clearInterval(interval);
  } catch (error) {}
  try {
    wss.close();
    server.close();
  } catch (error) {}
  process.exit(1)
});

