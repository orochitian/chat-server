var router = require('express').Router();
var userModel = require('../model/userModel');
var friendModel = require('../model/friendModel');
var messageModel = require('../model/messageModel');

//  添加好友
router.post('/addFriend', async (req, res) => {
    //  不需要查询全部字段，所以可以指定要查询的字段
    let filters = 'username';
    let user = await userModel.findOne({username: req.body.username}, filters);
    if( !user ) {
        res.fail('没有这个用户，再好好想想');
    } else if( user.username === req.username ) {
        res.fail('无法添加自己为好友');
    } else {
        let friend = await friendModel.findOne({username: req.username});
        for( let i=0; i<friend.list.length; i++ ) {
            if( friend.list[i].username === req.body.username ) {
                res.fail('你们已经是好友了');
                return;
            }
        }
        //  如果添加成功，同时给双方添加对方为好友
        friendModel.findOneAndUpdate({username: req.body.username}, {$push: {list: {username: req.username}}}, err => {});
        friendModel.findOneAndUpdate({username: req.username}, {$push: {list: {username: user.username}}}, err => {});
        res.success(user);
    }
});

//  获取好友列表
router.get('/getFriendList', async (req, res) => {
    let friend = await friendModel.findOne({username: req.username});
    res.success(friend);
});

//  获取聊天记录
router.get('/getMessageHistory', async (req, res) => {
    let skipNum = req.query.pageNum || 1;
    let sliceStart = -20 * skipNum;
    let sliceEnd = -20 * ( skipNum - 1 );
    sliceEnd > -1 ? sliceEnd = undefined : '';
    let messages = await messageModel.find({}, 'to from msg -_id').or([
        {
            to: req.query.username,
            from: req.username
        },
        {
            to: req.username,
            from: req.query.username
        }
    ]);
    let lastCount = messages.length + sliceStart;
    let result = messages.slice(sliceStart, sliceEnd);
    if( skipNum > 1 ) {
        result.reverse();
    }
    res.success({
        user: req.username,
        messages: result,
        lastCount
    });
});

//  获取用户详情
router.get('/getUser', (req, res) => {
    //  如果传username就按username查，如果没有，就查当前用户
    let condition;
    if( req.query.username ) {
        condition = { username: req.query.username };
    } else {
        condition = { token: req.headers.token }
    }
    userModel.findOne(condition).then(user => {
        if( user ) {
            res.success(user);
        } else {
            res.fail('无法找到该用户');
        }
    })
});

//  编辑资料
router.post('/update', (req, res) => {
    userModel.findOneAndUpdate({token: req.headers.token}, req.body).then(user => {
        if( user ) {
            res.success();
        } else {
            res.fail('用户更新失败，请重试');
        }
    })
});

module.exports = router;