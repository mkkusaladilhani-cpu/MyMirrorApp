const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Serve static files from current folder
app.use(express.static(__dirname));

http.listen(3000, () => {
  console.log('Signaling server running on port 3000');
});
