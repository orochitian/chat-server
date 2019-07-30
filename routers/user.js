var router = require('express').Router();
var userModel = require('../model/userModel');
var friendModel = require('../model/friendModel');
var messageModel = require('../model/messageModel');
var friendRequestModel = require('../model/friendRequestModel');

//  方便删除好友关系   可随时删除
router.get('/deleteFriends', (req, res) => {
    friendModel.updateMany({}, {list: []}, err => {
        if( !err ) {
            res.success();
        }
    })
})

//  添加好友
router.post('/addFriend', async (req, res) => {
    //  不需要查询全部字段，所以可以指定要查询的字段
    let filters = 'username';

    let user = await userModel.findOne({username: req.body.username}, filters);
    if( !user ) {   //  查询目标用户是否存在
        res.fail('没有这个用户，再好好想想');
    } else if( user.username === req.username ) {   //  判断目标用户是否是自己
        res.fail('无法添加自己为好友');
    } else {
        //  查询目标用户是否已经是好友
        let friend = await friendModel.findOne({username: req.username});
        for( let i=0; i<friend.list.length; i++ ) {
            if( friend.list[i] === req.body.username ) {
                res.fail('你们已经是好友了');
                return;
            }
        }
        //  查询是否已申请过目标用户的好友请求
        let friendRequest = await friendRequestModel.findOne({$or: [{from: req.body.username, to: req.username}, {from: req.username, to: req.body.username}]});
        if( friendRequest ) {
            res.fail('已申请过了，请等待好友通过');
            return;
        }
        let me = await userModel.findOne({username: req.username}, 'icon');
        let resParams = {
            from: req.username,
            to: req.body.username,
            mark: req.body.mark,
            icon: me.icon
        }
        //  派发好友申请事件
        req.sockets[req.body.username].emit('friend request', resParams);
        friendRequestModel.create(resParams).then(() => {
            res.success();
        });
    }
});

//  获取好友申请列表
router.get('/friendRequestList', (req, res) => {
    friendRequestModel.find({to: req.username}, '-_id -__v -updatedAt').then(list => {
        res.success(list);
    });
});

//  通过处理好友申请
router.post('/friendRequestHandle', (req, res) => {
    //  删除这条请求
    friendRequestModel.findOneAndDelete({to: req.body.to, from: req.body.from}).then(() => {
        //  如果同意，同时给双方添加对方为好友
        if( req.body.accept ) {
            friendModel.findOneAndUpdate({username: req.body.to}, {$push: {list: req.body.from}}, err => {});
            friendModel.findOneAndUpdate({username: req.body.from}, {$push: {list: req.body.to}}, err => {});
            req.sockets[req.body.from].emit('friend request result', true);
            req.sockets[req.body.to].emit('friend request result', true);
        } else {
            req.sockets[req.body.from].emit('friend request result', false);
        }
        res.success();
    });
});

//  获取好友列表
router.get('/getFriendList', async (req, res) => {
    let friend = await friendModel.findOne({username: req.username});
    let friends = await userModel.find({
        username: {
            $in: friend.list
        }
    }, 'username nickname icon mood');
    res.success(friends);
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