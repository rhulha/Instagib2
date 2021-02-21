// Copyright 2021 Raymond Hulha, Licensed under Affero General Public License https://www.gnu.org/licenses/agpl-3.0.en.html
// https://github.com/rhulha/Instagib2

const winston = require('winston');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const crypto = require('crypto');
const url = require('url');
const basicAuth = require('express-basic-auth');

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

app.use(basicAuth({
  users: { q3dm17: 'q3dm17' },
  challenge: true
}));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.get("/rooms", (request, response) => {
  var sorted_rooms = Object.values(rooms).filter(r=>!r.private_ && r.players.length>0 && r.players.length<r.maxPlayers)
                            .sort((a,b)=>b.players.length-a.players.length)
                            .map(e=>{return {name:e.name, player:e.players.length}});
  response.json(sorted_rooms);
});

/** @Type {Object.<string:Room>} */
var rooms = {};
// var players_by_id = {};

class Room {
  constructor(name, private_) {
    this.name = name;
    this.maxPlayers = 128;
    if(name.slice(-1)>0)
      this.maxPlayers=parseInt(name.slice(-1), 10);
    logger.info("Room created with name and maxPlayers: " + name + ", " + this.maxPlayers);
    this.private_ = private_;
    this.players = [];
  }
}

function broadcast(msg, skipClientWS) {
  wss.clients.forEach((client) => {
    if (client !== skipClientWS && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(msg));
    }
  });
}

function broadcastRoom(room, msg, skipClientWS) {
  room.players.forEach((player) => {
    if (player.ws !== skipClientWS && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify(msg));
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
    Object.defineProperty(this, 'room', {value: 'static', writable: true}); // Don't send room to clients, since it is the Room object and it leads to a circular JSON.
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
    this.run=false;
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
      this.run = (msg.run?true:false);
    } else if (msg.cmd == "rail") {
      msg.color = this.color;
      if( !msg.color || msg.color.length < 3)
        logger.error("ERROR: COLOR MISSING!!!", this.id, this.name, this.room);
      broadcastRoom(this.room, msg, this.ws);  // TODO: harden data
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
      broadcastRoom(this.room, msg, this.ws);  // TODO: harden data

      msg = {
        cmd: "hit",
        pos: {x: randomEnmemy.x, y: randomEnmemy.y, z: randomEnmemy.z}, 
        id: randomEnmemy.id,
        source_id: this.id
      };
      broadcastRoom(this.room, msg, this.ws);  // TODO: harden data

    } else if (msg.cmd == "fragself") {
      this.frags--;
    } else if (msg.cmd == "powerup") {
      this.frags+=3;
      broadcastRoom(this.room, msg, this.ws);  // TODO: harden data
    } else if (msg.cmd == "respawn") {
      msg = {cmd:"respawn"};
      msg.id = this.id;
      broadcastRoom(this.room, msg, this.ws);
    } else if (msg.cmd == "hit") {
      this.frags++;
      msg.source_id = this.id;
      broadcastRoom(this.room, msg, this.ws);  // TODO: harden data
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
          room: room_name,
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
  if(!name)
    name="Player";
  if(!room)
    room="TheLongestYard";
  name = name.replace(/[^A-Za-z0-9]/g, '');
  room = room.replace(/[^A-Za-z0-9]/g, '');
  if(!color || color.length < 3)
    color = "yellow";
  else
    color = color.replace(/[^A-Za-z0-9]/g, '');
  if(!room || room.length < 1)
    room = "TheLongestYard";
  logger.info('client connected' + id +", " + name + ", " + room + ", " + color);
  if( !rooms[room] ) {
    rooms[room] = new Room(room);
  }
  if(rooms[room].players.length >= rooms[room].maxPlayers) {
    room="RoomIsFull";
    if( !rooms[room] ) {
      rooms[room] = new Room(room);
    }
  }
  var player = new Player(id, (name?name:id), rooms[room], color, ws);
  rooms[room].players.push(player);
  ws.on('message', player.handleUpdate.bind(player));
  ws.on('close', player.handleDisconnect.bind(player));

});

app.use(express.static('web'));
app.use(express.static('icons'));
if (process.env.PORT == "80" ) {
  app.use(express.static('dist'));
} else {
  app.use(express.static('src'));
}

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

