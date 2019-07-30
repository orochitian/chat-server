var router = require('express').Router();
var fileUploadModel = require('../model/fileUploadModel');
var formidable = require('formidable');
var fs = require('fs');
var path = require('path');
//  上传图片
router.post('/', (req, res) => {
    var userDir = "/fileupload/" + req.username;
    var uploadDir = userDir + '/photo';
    var form = new formidable.IncomingForm();
    form.uploadDir = uploadDir;
    //  是否保留上传文件拓展名
    form.keepExtensions = true;
    //  给文件加密
    form.hash = 'md5';
    //  支持多文件上传
    form.multiples = true;

    function uploadCallback(err, fields, files) {
        var file = files.file;
        //  给已上传文件的MD5值做持久化保存
        //  每次上传可以查询当前用户下，是否有相同文件。如果有把本次上传文件删除，返回数据库中文件地址。
        fileUploadModel.findOne({hash: file.hash, user: req.username}).then(fileUpload => {
            if( fileUpload ) {
                // console.log('发现相同文件！');
                fs.unlink(file.path, () => {
                    file.path = fileUpload.path;
                    res.success({
                        isRepeat: true,
                        file
                    });
                });
            } else {
                // console.log('添加文件');
                fileUploadModel.create({
                    path: file.path,
                    hash: file.hash,
                    name: file.name,
                    user: req.username
                }, err => {
                    res.success({
                        isRepeat: false,
                        file
                    });
                })
            }
        })
    }

    //  递归查询目录
    function mkDir(dir, callback) {
        //  判断当前路径是否存在
        fs.access(dir, err => {
            //  不存在尝试在当前的父级路径下创建这个路径
            if( err ) {
                fs.mkdir(dir, err => {
                    if( err ) {
                        mkDir(path.dirname(dir), callback);
                    } else {
                        mkDir(uploadDir, callback);
                    }
                });
            } else {
                callback();
            }
        })
    }
    //  判断上传文件路径是否存在，不存在先创建再上传
    mkDir(uploadDir, () => {
        form.parse(req, uploadCallback);
    });
});

//  获取图片列表
router.get('/getPhotos', async (req, res) => {
    var pageNum = req.query.pageNum * 1 || 1;
    var pageSize = req.query.pageSize * 1 || 8;
    var condition = req.query.search ? {name: {$regex: new RegExp(JSON.parse(req.query.search).title)}, user: req.session.username} : {user: req.session.username};
    var count = await fileUploadModel.countDocuments(condition);
    if( count === 0 ) {
        res.send({
            list: [],
            count: 0,
            pageNum: 1,
            pageSize,
            pageSizeOpts: [8, 16]
        });
        return;
    }
    if( pageSize * pageNum > count ) {
        pageNum = Math.ceil(count / pageSize);
    }
    var list = await fileUploadModel.find(condition, '-hash').sort('-_id').skip((pageNum-1) * pageSize).limit(pageSize);
    res.send({
        list,
        count,
        pageNum,
        pageSize,
        pageSizeOpts: [8, 16]
    });
});

//  删除指定图片
router.post('/deletePhoto', (req, res) => {
    fileUploadModel.findOneAndDelete({path: req.body.path}, err => {
        res.send('删除成功');
    });
    fs.unlink(req.body.path, err => {});
});

//  清空所有图片
router.get('/deleteAllPhotos', (req, res) => {
    var uploadDir = "/fileupload/" + req.session.username + '/photo';
    fileUploadModel.deleteMany({user: req.session.username}).then(() => {
        fs.access(uploadDir, err => {
            if( err ) {return;}
            fs.readdir(uploadDir, (err, files) => {
                if( err ) {
                    console.log(err);
                } else {
                    files.forEach((file, index) => {
                        fs.unlinkSync(uploadDir + '/' + file, err => {
                            if( err ) {
                                console.log(err)
                            } else {
                                console.log('删除了：' + file);
                            }
                        })
                    });
                    fs.rmdir(uploadDir, (err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            res.send(true);
                        }
                    });
                }
            })
        })
    })
});

module.exports = router;