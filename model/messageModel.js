var mongo = require('mongoose');

var Schema = new mongo.Schema({
    from: String,
    to: String,
    msg: String
}, {
    timestamps: { createdAt: 'created_at' }
});

module.exports = mongo.model('message', Schema);