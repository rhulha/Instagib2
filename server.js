const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
  // const location = url.parse(ws.upgradeReq.url, true);
  // You might use location.query.access_token to authenticate or share sessions
  // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

  console.log('client connected');

  ws.on('message', function incoming(message) {
    //console.log('received: %s', message);
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

