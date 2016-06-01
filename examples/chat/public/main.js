$(document).ready(function () {
  'use strict'

  var localVideo = document.getElementById('localVideo');
  var remoteVideo = document.getElementById('remoteVideo');

  var callButton = document.getElementById('callButton');
  var hangupButton = document.getElementById('hangupButton');
  var startButton = document.getElementById('startButton');

  callButton.onclick = call;
  hangupButton.onclick = hangup;
  startButton.onclick = start;

  var offerOptions = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
  };

  var socket = io();
  var localStream;
  var pc;
  var pc1;
  var servers = { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] };

  function gotStream(stream) {
    console.log('Received local stream');
    localVideo.srcObject = stream;
    localStream = stream;
    callButton.disabled = false;
    pc = new RTCPeerConnection(servers);
    pc.addStream(localStream);
  }

  function start() {
    navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    }).then(gotStream).catch(function (e) {
      alert('getUserMedia() error: ' + e.name);
    });
  }

  function call() {

    pc.onicecandidate = function (e) {
      onIceCandidate(e);
    }
    pc.onaddstream = gotRemoteStream;
    pc.createOffer(offerOptions).then(onCreateOfferSuccess);
    callButton.disabled = true;
  }


  socket.on('offerRecieved', function (data) {
    console.log('offerRecieved');
    var desc = data.desc;
    var pc1 = data.candidate;

    pc = pc ? pc : new RTCPeerConnection(servers);

    pc.onaddstream = gotRemoteStream;
    pc.onicecandidate = function (e) {
      onIceCandidate(e);
    }
    pc.setRemoteDescription(desc).then(function () { console.log('Remote Description is set based on offer') });

    pc.createAnswer().then(onCreateAnswerSuccess)

  });

  socket.on('answerRecieved', function (data) {
    var desc = data.desc;
    var pc1 = data.candidate;
    console.log('answerRecieved');
    pc.setRemoteDescription(desc).then(function () { console.log('Remote Description is set based on answer') });
  });

  function onCreateAnswerSuccess(desc) {
    console.log('Answer created');
    pc.setLocalDescription(desc).then(function () { console.log('local description is set after answer creation'); });
    socket.emit('answer', { desc: desc, candidate: pc });
  }

  function onCreateOfferSuccess(desc) {
    console.log('Offer created');
    pc.setLocalDescription(desc).then(function () { console.log('local description is set after offer creation'); });
    socket.emit('offer', { desc: desc, candidate: pc });
  }

  function gotRemoteStream(e) {
    remoteVideo.srcObject = e.stream;
  }

  function hangup() {
    pc.close();
    pc = null;
    hangupButton.disabled = true;
    callButton.disabled = false;
  }

  function onAddIceCandidateSuccess(pc) {
    console.log(pc + ' addIceCandidate success');
  }

  function onAddIceCandidateError(pc, error) {
    console.log(pc + ' failed to add ICE Candidate: ' + error.toString());
  }

  function onIceCandidate(event) {
    if (event.candidate) {
      socket.emit('candidate', { candidate: event.candidate });
    }
  }

  socket.on('candidateRecieved', function (data) {
    pc.addIceCandidate(new RTCIceCandidate(data.candidate))
      .then(function () {
        onAddIceCandidateSuccess(pc);
      },
      function (err) {
        onAddIceCandidateError(pc, err);
      });
  })


});