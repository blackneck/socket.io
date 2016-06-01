// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('../..')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

app.use(express.static(__dirname + '/public'));


io.on('connection', function (socket) {
  console.log('connected');

  socket.on('offer', function (data) {
    console.log(data.desc.type);
    socket.broadcast.emit('offerRecieved', { desc: data.desc, candidate: data.candidate });
  });

  socket.on('answer', function (data) {
    console.log(data.desc.type);
    socket.broadcast.emit('answerRecieved', { desc: data.desc, candidate: data.candidate });
  });

  socket.on('candidate', function (data) {
    console.log(data.candidate);
    socket.broadcast.emit('candidateRecieved', { candidate: data.candidate });
  });

});
