const mongoose = require('mongoose');

const WorkToBeDoneSchema = mongoose.Schema({
    name: {
        type: String,
        required: false
    }, value: {
        type: String,
        required: false
    }
});

const WorkToBeDone = module.exports = mongoose.model('WorkToBeDone', WorkToBeDoneSchema);