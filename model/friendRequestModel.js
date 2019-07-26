var mongo = require('mongoose');

var Schema = new mongo.Schema({
    from: String,
    to: String,
    mark: String,
    icon: String
}, {
    timestamps: { createdAt: 'created_at' }
});

module.exports = mongo.model('friendRequest', Schema);