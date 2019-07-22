module.exports = {
    //  登录失效返回
    loginInvalid(res) {
        res.json({ code: 401, msg: '未登录！' });
    },
    //  成功返回
    success(res, data, msg) {
        res.json({ code: 200, data, msg });
    }
}