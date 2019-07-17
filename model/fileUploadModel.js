var mongo = require('mongoose');

var fileUploadSchema = new mongo.Schema({
    path: String,
    hash: String,
    user: String,
    name: String
}, {
    timestamps: true
});

var fileUpload = mongo.model('fileUpload', fileUploadSchema);

module.exports = fileUpload;