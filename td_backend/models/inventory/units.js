const mongoose = require('mongoose');
const UnitsSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    deleted: {
        type: Boolean,
        required: false,
        default: false
    },
});


const Units = module.exports = mongoose.model('Units', UnitsSchema);