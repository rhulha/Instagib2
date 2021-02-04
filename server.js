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


function setStuffSlowly(client) {
  console.log('SetTimeout, setStuffSlowly');
  var interval = setInterval(()=>{
    var line = lines[lines_pos++%lines.length];
    if(line === undefined)
      clearInterval(interval);
    //console.log(line);
    try {
      client.send(line);
    } catch (error) {}
  }, 16);
}

wss.on('connection', function connection(ws, request, client) {
  //const ip = request.socket.remoteAddress;
  console.log('client connected');

  for (let clnt of wss.clients) 
    setTimeout(()=>setStuffSlowly(clnt), 5000);

    ws.on('message', function incoming(message) {
    // console.log('received: %s', message);
    // player_log += message + "\r\n";
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});



app.use(express.static('web'));

server.listen(8080, function() {
  console.log('Listening on %d', server.address().port);
});

process.on('SIGINT', function() {
  console.log('closing.');
  /*fs.writeFile('player_log.txt', player_log, function (err) {
    if (err) return console.log(err);
    console.log('writing player_log.');
  });*/
  wss.close();
  server.close();
});

