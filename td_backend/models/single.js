const mongoose = require('mongoose');
const SingleSchema = mongoose.Schema({
    name: {
        type: String,
        required: false
    },
    field: {
        type: String,
        required: false
    }
});


const Single = module.exports = mongoose.model('Single', SingleSchema);