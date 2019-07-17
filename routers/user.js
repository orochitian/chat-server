var router = require('express').Router();
var userModel = require('../model/userModel');

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
    let user = await userModel.findOne({username: req.body.username});
    let self = await userModel.findById(req.session.userId);
    console.log(user);
    console.log(req.session.userId);
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

        res.send({
            code: 200,
            data: user
        });
    }
});

module.exports = router;