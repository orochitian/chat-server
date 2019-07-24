var mongo = require('mongoose');

const setting = {
    type: String,
    default: ''
}

var userSchema = new mongo.Schema({
    username: setting,
    password: setting,
    nickname: setting,
    icon: setting,
    sex: setting,
    birthday: setting,
    bloodType: setting,
    job: setting,
    hometown: setting,
    address: setting,
    school: setting,
    email: setting,
    tel: setting,
    mood: setting,
    desc: setting,
    token: setting
}, {
    timestamps: { createdAt: 'created_at' }
});

var user = mongo.model('user', userSchema);

module.exports = user;