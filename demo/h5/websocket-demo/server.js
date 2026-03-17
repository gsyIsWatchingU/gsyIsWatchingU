// 引入WebSocket库
const WebSocket = require('ws');

// 创建WebSocket服务器，监听端口8080
const wss = new WebSocket.Server({ port: 8080 });

console.log('WebSocket服务器已启动，端口：8080');

// 当有客户端连接时触发
wss.on('connection', function connection(ws) {
    console.log('新客户端已连接');
    
    // 当收到客户端消息时触发
    ws.on('message', function incoming(message) {
        console.log('收到消息: %s', message);
        
        // 将消息转换为字符串
        const messageStr = message.toString();
        
        // 广播消息给所有连接的客户端
        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(`服务器: ${messageStr}`);
            }
        });
    });
    
    // 发送欢迎消息给新连接的客户端
    ws.send('欢迎连接WebSocket服务器！');
    
    // 当连接关闭时触发
    ws.on('close', function() {
        console.log('客户端已断开连接');
    });
});