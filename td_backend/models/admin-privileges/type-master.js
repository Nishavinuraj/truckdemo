const mongoose = require('mongoose');

const TypeMasterSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
})
module.exports = mongoose.model('TypeMaster', TypeMasterSchema);
