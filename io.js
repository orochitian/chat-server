let messageModel = require('./model/messageModel');

//  维护当前所有聊天的socket
let sockets = {}

module.exports = io => {
    io.on('connection', socket => {
        //  如果有用户点了聊天，就在sockets里存储当前socket，由于用户名唯一，就用用户名做为key值
        socket.on('single chat', username => {
            sockets[username] = socket;
        });
        //  接收聊天信息
        socket.on('sendMessage', (req) => {
            //  在消息表中存储该消息，包含：发送人、接收人、消息体
            messageModel.create({to: req.to, from: req.from, msg: req.msg}, err => {
                if( err ) {
                    console.log(err);
                } else {
                    //  给当前发送人先推送该消息
                    sockets[req.from].emit('newMessage', {to: req.to, from: req.from, msg: req.msg});
                    //  如果接收人在当前sockets组中，那么将单独向他推送一条信息
                    if( req.to in sockets ) {
                        sockets[req.to].emit('newMessage', {to: req.to, from: req.from, msg: req.msg});
                    }
                }
            });
        });
    });
};


