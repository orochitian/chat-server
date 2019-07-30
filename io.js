let messageModel = require('./model/messageModel');

//  维护当前所有聊天的socket
let sockets = {}

module.exports = io => {
    io.on('connection', socket => {
        socket.on('join', username => {
            socket.user = username;
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

        //  有用户离开，从sockets集合中释放
        socket.on('disconnect', (ev) => {
            delete sockets[socket.user];
        });
    });
    return sockets;
};


