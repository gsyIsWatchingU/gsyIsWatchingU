const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// 提供静态文件
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Socket.io连接处理
io.on('connection', (socket) => {
  console.log('用户已连接');
  
  // 监听客户端消息
  socket.on('chat message', (msg) => {
    console.log('消息: ' + msg);
    // 广播给所有客户端
    io.emit('chat message', msg);
  });
  
  // 断开连接
  socket.on('disconnect', () => {
    console.log('用户已断开');
  });
});

// 启动服务器
http.listen(3222, () => {
  console.log('服务器运行在 http://localhost:3222');
});