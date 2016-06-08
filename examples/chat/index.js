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

var offers = [];
var clients = [];
var participants = [];

io.on('connection', function (socket) {
  console.log('connected');
  clients.push(socket);
  console.log(clients.length);

  if (offers.length > 0 && clients.length > 1) {
    socket.emit('offerRecieved', { desc: offers.pop(), participant: participants.pop() });
  }

  socket.on('disconnect', function () {
    console.log('disconnected');
    var i = clients.indexOf(socket);
    clients.splice(i, 1);
    offers = [];
  })

  socket.on('offer', function (data) {
    offers.push(data.desc);
    participants.push(data.participant);
    console.log(data.desc.type);
    console.log(data.participant);
    if (clients.length > 1) {
      socket.broadcast.emit('offerRecieved', { desc: offers.pop(), participant: participants.pop() });
    }
  });

  socket.on('answer', function (data) {
    console.log(data.desc.type);
    console.log(data.participant);
    socket.broadcast.emit('answerRecieved', { desc: data.desc, participant: data.participant });
  });

  socket.on('candidate', function (data) {
    socket.broadcast.emit('candidateRecieved', { candidate: data.candidate });
  });

  socket.on('leave', function (data) {
    var participant = data.participant;
    var i = participants.indexOf(participant);
    participants.splice(i, 1);
    socket.broadcast.emit('userLeft', { participant: participant });
  });

});

