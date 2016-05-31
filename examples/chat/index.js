// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('../..')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom


io.on('connection', function (socket) {
  console.log('connected');

  socket.on('offer', function (data) {
    console.log(data.desc.type);
    socket.broadcast.emit('offerRecieved', {desc: data.desc});    
  });
  
  socket.on('answer', function (data) {
    console.log(data.desc.type);
    socket.broadcast.emit('answerRecieved', {desc: data.desc});    
  })

});
