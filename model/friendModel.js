var mongo = require('mongoose');

var Schema = new mongo.Schema({
    username: String,
    list: Array
});

module.exports = mongo.model('friend', Schema);