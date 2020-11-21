const mongoose = require('mongoose');

const AdminMasterSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type_master: {
        type: mongoose.Schema.ObjectId,
        ref: 'TypeMaster'
    },
    deleted: {
        type: Number,
        required: false,
        default: 0
    },
    created_date: {
        type: Date,
        default: Date.now,
        required: false
    },
})
module.exports = mongoose.model('AdminMaster', AdminMasterSchema);