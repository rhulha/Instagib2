const fs = require('fs');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

var lines;
var lines_pos=0;

fs.readFile('player_log.txt', 'utf8', function(err, contents) {
  lines = contents.split("\r\n");
});

var player_log = "";
var interval;

function setStuffSlowly(ws) {
  console.log('SetTimeout, setStuffSlowly');
  interval = setInterval(()=>{
    var line = lines[lines_pos++%lines.length];
    if(line === undefined)
      clearInterval(interval);
    //console.log(line);
    try {
      ws.send(line);
    } catch (error) {}
  }, 36); // original 16
}

function handleMsg(msg) {
  // console.log('received: %s', message);
  // player_log += message + "\r\n";
  var jsn = JSON.parse(msg);
  if( jsn.cmd ) {
    if( jsn.cmd === "sendTestData") {
      console.log('received: %s', "sendTestData");
      clearInterval(interval);
      lines_pos=0;
      setStuffSlowly(this);
    }
  }
  wss.clients.forEach((client) => {
    if (client !== this && client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

function setupWS(ws) {
  ws.on('message', handleMsg.bind(ws));
}


wss.on('connection', (ws, request) => {
  //const ip = request.socket.remoteAddress;
  console.log('client connected');
  setupWS(ws);

  wss.clients.forEach((client) => {
    if (client !== this && client.readyState === WebSocket.OPEN) {
      client.send({cmd:"newCon"});
    }
  });
});

app.use(express.static('web'));
app.use(express.static('icons'));

server.listen(8080, function() {
  console.log('Listening on %d', server.address().port);
});

process.on('SIGINT', function() {
  console.log('closing.');
  /*fs.writeFile('player_log.txt', player_log, function (err) {
    if (err) return console.log(err);
    console.log('writing player_log.');
  });*/
  try {
    clearInterval(interval);
  } catch (error) {}
  try {
    wss.close();
    server.close();
  } catch (error) {}
  process.exit(1)
});

