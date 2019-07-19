var router = require('express').Router();
var userModel = require('../model/userModel');
var friendModel = require('../model/friendModel');
var messageModel = require('../model/messageModel');

//  获取用户列表
router.get('/getUserList', (req, res) => {
    var pageNum = req.query.pageNum * 1 || 1;
    var pageSize = req.query.pageSize * 1 || 10;
    userModel.find({}).estimatedDocumentCount().then(count => {
        if( count === 0 ) {
            res.json({
                users: [],
                pageNum: 1,
                pageSize,
                count
            });
            return;
        }
        if( pageSize * pageNum > count ) {
            pageNum = Math.ceil(count / pageSize);
        }
        userModel.find().skip((pageNum-1) * pageSize).limit(pageSize).then(users => {
            res.json({
                users,
                pageNum: pageNum || 1,
                pageSize,
                count
            });
        });
    });
});

//  编辑用户
router.post('/updateUser', (req, res) => {
    userModel.findByIdAndUpdate(req.body._id, req.body, err => {
        if( !err ) {
            res.send('用户编辑成功！');
        } else {
            res.status(401).send('用户编辑失败！');
        }
    });
});

//  获取用户详情
router.get('/detail', (req, res) => {
    userModel.findById(req.session.userId).then(user => {
        res.send(user);
    });
});

//  删除用户
router.post('/delUser', (req, res) => {
    //  mongoose 建议使用delete删除  而不是remove
    userModel.findByIdAndDelete(req.body._id, err => {
        if( !err ) {
            res.send('用户删除成功！');
        } else {
            res.status(401).send('用户删除失败！');
        }
    });
});

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
    let friend = await friendModel.findOne({username: req.session.username});
    res.send(friend.list);
});

//  获取聊天记录
router.get('/getMessageHistory', async (req, res) => {
    let messages = await messageModel.find().or([
        {
            to: req.query.username,
            from: req.session.username
        },
        {
            to: req.session.username,
            from: req.query.username
        }
    ]);
    res.send({
        user: req.session.username,
        messages
    });
});

//  聊天
router.post('/sendMessage', async (req, res) => {
    io.emit('sendMessage')
    // messageModel.create({to: req.body.username, from: req.session.username, msg: req.body.msg}, err => {
    //     if( err ) {
    //         console.log(err);
    //     } else {
    //         res.send(req.body.msg);
    //     }
    // });
});

module.exports = router;