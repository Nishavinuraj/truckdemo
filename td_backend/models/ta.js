const mongoose = require('mongoose');
const TaSchema = mongoose.Schema({
    name: {
        type: String,
        required: false
    },
    mobile1: {
        type: String,
        required: false
    },
    mobile2: {
        type: String,
        required: false
    },
    status: {
        type: String,
        required: false
    }
});


const Ta = module.exports = mongoose.model('Ta', TaSchema);