var express = require('express');
var app = express();
var mongo = require('mongoose');
var bodyParser = require('body-parser');
var userModel = require('./model/userModel');
var friendModel = require('./model/friendModel');
var history = require('connect-history-api-fallback');
let jwt = require('jsonwebtoken');
let http = require('http').createServer(app);
let sockets = require('./io')(require('socket.io')(http));

app.use('*', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, token");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Credentials", true);
    if( req.method === 'OPTIONS' ) {
        return res.send(true);
    }
    res.loginInvalid = () => {
        res.send({code: 401, msg: '登录状态已失效'});
    }
    res.success = (data = {}) => {
        res.send({code: 200, data});
    }
    res.fail = msg => {
        res.send({code: 201, msg});
    }
    next();
});

app.use(history({index: '/'}));

app.use( '/uploadImages', express.static('/uploadImages') );
app.use( '/static', express.static('./dist/static') );

app.use( bodyParser.urlencoded({extended : true}) );
app.use( bodyParser.json({limit: '1mb'}) );



// app.use(session({
//     secret : 'ryan lee',
//     resave : true,
//     saveUninitialized : true
// }));

app.get('/', (req, res) => {
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(__dirname + "/dist/index.html");
});

//  登录
app.post('/login', (req, res) => {
    userModel.findOne(req.body).then(user => {
        if( user ) {
            //  登录成功随机生成token并更新用户表
            jwt.sign({username: req.body.username}, new Date() + Math.random(), (err, token) => {
                if( !err ) {
                    userModel.findOneAndUpdate(req.body, {token}, {fields: '-password -__v -_id -updatedAt'}).then(user => {
                        if( user ) {
                            user.token = token;
                            res.success(user);
                        } else {
                            res.fail('用户名或密码错误');
                        }
                    });
                } else {
                    res.fail('token生成失败：', err);
                }
            });
        } else {
            res.fail('用户名或密码错误');
        }
    });
});


//  登出
app.get('/logout', (req, res) => {
    res.success();
});

//  注册
app.post('/regist', (req, res) => {
    userModel.find({username: req.body.username}).then(user => {
        if( user.length < 1 ) {
            friendModel.create({username: req.body.username, list: []}, err => {});
            userModel.create(req.body, err => {
                res.success();
            });
        } else {
            res.fail('该用户名已存在');
        }
    });
});

//  验证登录状态
app.use((req, res, next) => {
    //  连token都没有，就是没登录
    if( !req.headers.token || req.headers.token === 'null' || req.headers.token === 'undefined' ) {
        res.loginInvalid()
    } else {
        userModel.findOne({token: req.headers.token}).then(user => {
            if( user ) {
                req.username = user.username;
                req.sockets = sockets;
                next();
            } else {
                res.loginInvalid()
            }
        });
    }
});


app.use('/user', require('./routers/user'));
app.use('/upload', require('./routers/upload'));

/*
*  mongod --dbpath=/opt/db --bind_ip=0.0.0.0
*  lirui:lirui0814@132.232.119.153:27017/vue
* */
mongo.connect('mongodb://localhost:27017/vue', { useNewUrlParser: true, useFindAndModify: false }, err => {
    if( err ) {
        console.log('数据库启动失败：', err);
    } else {
        http.listen('80', err => {
            err ? console.log('服务器启动失败：', err) : console.log('服务器端口：80');
        })
    }
})
