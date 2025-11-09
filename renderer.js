const { desktopCapturer } = require('electron');
const io = require('socket.io-client');
const socket = io('http://localhost:3000'); // Signaling server URL

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const shareBtn = document.getElementById('shareBtn');
const stopBtn = document.getElementById('stopBtn');

let localStream;
let peerConnection;
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

shareBtn.onclick = async () => {
  const sources = await desktopCapturer.getSources({ types: ['screen'] });
  localStream = await navigator.mediaDevices.getUserMedia({
    video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: sources[0].id } },
    audio: false
  });
  localVideo.srcObject = localStream;

  peerConnection = new RTCPeerConnection(config);
  peerConnection.onicecandidate = e => { if (e.candidate) socket.emit('ice-candidate', e.candidate); };
  peerConnection.ontrack = e => { remoteVideo.srcObject = e.streams[0]; };
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('offer', offer);
};

stopBtn.onclick = () => {
  localStream.getTracks().forEach(track => track.stop());
  localVideo.srcObject = null;
};

socket.on('offer', async offer => {
  peerConnection = new RTCPeerConnection(config);
  peerConnection.onicecandidate = e => { if (e.candidate) socket.emit('ice-candidate', e.candidate); };
  peerConnection.ontrack = e => { remoteVideo.srcObject = e.streams[0]; };
  if (localStream) localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', answer);
});

socket.on('answer', async answer => { await peerConnection.setRemoteDescription(answer); });
socket.on('ice-candidate', async candidate => { await peerConnection.addIceCandidate(candidate); });
