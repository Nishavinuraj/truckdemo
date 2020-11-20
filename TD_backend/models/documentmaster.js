const mongoose = require('mongoose');

const DocumentMasterSchema = mongoose.Schema({
    name: {
        type: String,
        required: false
    }
});

const DocumentMaster = module.exports = mongoose.model('DocumentMaster', DocumentMasterSchema);