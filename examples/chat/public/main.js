$(document).ready(function () {
  'use strict'

  var localVideo = document.getElementById('localVideo');
  var remoteVideo = document.getElementById('remoteVideo');

  var callButton = document.getElementById('callButton');
  var hangupButton = document.getElementById('hangupButton');

  callButton.onclick = call;
  hangupButton.onclick = hangup;

  var offerOptions = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
  };

  var socket = io();
  var pc;

  function gotStream(stream) {
    localVideo.srcObject = stream;
    pc.addStream(stream);
  }

  function call() {

    pc = new RTCPeerConnection({ "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] });
    pc.onaddstream = gotRemoteStream;
    pc.onicecandidate = function (e) {
      onIceCandidate(e);
    };

    navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    }).then(gotStream).catch(function (e) {
      alert('getUserMedia() error: ' + e.name);
    });

    pc.createOffer(offerOptions).then(onCreateOfferSuccess);
    callButton.disabled = true;
  }


  socket.on('offerRecieved', function (data) {
    var desc = data.desc;

    pc = pc ? pc : new RTCPeerConnection({ "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] });
    pc.onicecandidate = function (e) {
      onIceCandidate(e);
    };
    pc.onaddstream = gotRemoteStream;

    pc.setRemoteDescription(desc).then(function () { console.log('OK') });

    pc.createAnswer().then(onCreateAnswerSuccess)

  });

  socket.on('answerRecieved', function (data) {
    var desc = data.desc;

    pc.setRemoteDescription(desc).then(function () { console.log('OK') });
  });

  function onCreateAnswerSuccess(desc) {
    pc.setLocalDescription(desc).then(
      function () {
        socket.emit('answer', { desc: desc });
      });
  }

  function onCreateOfferSuccess(desc) {
    pc.setLocalDescription(desc).then(
      function () {
        socket.emit('offer', { desc: desc });
      });
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

  function onIceCandidate(event) {
    if (event.candidate) {
      pc.addIceCandidate(new RTCIceCandidate(event.candidate))
        .then(function () {
          onAddIceCandidateSuccess(pc);
        },
        function (err) {
          onAddIceCandidateError(pc, err);
        });
    }
  }

  function onAddIceCandidateSuccess(pc) {
    console.log(pc + ' addIceCandidate success');
  }

  function onAddIceCandidateError(pc, error) {
    console.log(pc + ' failed to add ICE Candidate: ' + error.toString());
  }

});