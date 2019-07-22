let messageModel = require('./model/messageModel');

let sockets = {}

module.exports = io => {
    io.on('connection', socket => {
        socket.on('single chat', username => {
            sockets[username] = socket;
        });
        socket.on('sendMessage', (req) => {
            messageModel.create({to: req.to, from: req.from, msg: req.msg}, err => {
                if( err ) {
                    console.log(err);
                } else {
                    sockets[req.from].emit('newMessage', {to: req.to, from: req.from, msg: req.msg});
                    if( req.to in sockets ) {
                        sockets[req.to].emit('newMessage', {to: req.to, from: req.from, msg: req.msg});
                    }
                }
            });
        });
    });
};


