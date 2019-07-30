var router = require('express').Router();
var formidable = require('formidable');
var fs = require('fs');
var path = require('path');

//  上传图片
router.post('/', (req, res) => {
    var uploadDir = "/uploadImages/" + req.username;
    var form = new formidable.IncomingForm();
    form.uploadDir = uploadDir;
    //  是否保留上传文件拓展名
    form.keepExtensions = true;
    //  给文件加密
    form.hash = 'md5';
    //  支持多文件上传
    form.multiples = true;

    //  上传完成后的回调
    function uploadCallback(err, fields, files) {
        var file = files.file;
        //  每次上传完成后，将图片重命名为它的MD5值。通过MD5值可以保证图片的唯一性。
        let path = uploadDir + '/' + file.hash + '.' + file.name.split('.')[1];
        fs.rename(file.path, path, err => {
            if( !err ) {
                res.success(path);
            }
        });
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

module.exports = router;