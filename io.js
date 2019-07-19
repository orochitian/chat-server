let messageModel = require('./model/messageModel');

module.exports = io => {
    io.on('connection', socket => {
        socket.on('sendMessage', (req) => {
            messageModel.create({to: req.to, from: req.from, msg: req.msg}, err => {
                if( err ) {
                    console.log(err);
                } else {
                    socket.emit('newMessage', {to: req.to, from: req.from, msg: req.msg});
                }
            });
        });
    });
};


