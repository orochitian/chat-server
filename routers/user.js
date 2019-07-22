var router = require('express').Router();
var userModel = require('../model/userModel');
var friendModel = require('../model/friendModel');
var messageModel = require('../model/messageModel');

//  添加好友
router.post('/addFriend', async (req, res) => {
    //  不需要查询全部字段，所以可以指定要查询的字段
    let filters = 'username';
    let user = await userModel.findOne({username: req.body.username}, filters);
    let self = await userModel.findById(req.session.userId, filters);
    if( !user ) {
        res.json({
            code: 404,
            msg: '没有这个用户，再好好想想'
        });
    } else if( user.username === self.username ) {
        res.json({
            code: 201,
            msg: '无法添加自己为好友'
        });
    } else {
        let friend = await friendModel.findOne({username: self.username});
        for( let i=0; i<friend.list.length; i++ ) {
            if( friend.list[i].username === req.body.username ) {
                res.send({
                    code: 202,
                    msg: '你们已经是好友了'
                });
                return;
            }
        }
        //  如果添加成功，同时给双方添加对方为好友
        friendModel.findOneAndUpdate({username: req.body.username}, {$push: {list: self}}, err => {});
        friendModel.findOneAndUpdate({username: self.username}, {$push: {list: user}}, err => {});
        res.send({
            code: 200,
            data: user
        });
    }
});

//  获取好友列表
router.get('/getFriendList', async (req, res) => {
    let friend = await friendModel.findOne({username: req.username});
    res.success(friend);
});

//  获取聊天记录
router.get('/getMessageHistory', async (req, res) => {
    let messages = await messageModel.find().or([
        {
            to: req.query.username,
            from: req.username
        },
        {
            to: req.username,
            from: req.query.username
        }
    ]);
    res.success({
        user: req.username,
        messages
    });
});

//  聊天
router.post('/sendMessage', async (req, res) => {

});

module.exports = router;