const mongoose = require('mongoose');

const StateindiaSchema = mongoose.Schema({
    statename: {
        type: String,
        required: false
    }
});

const Stateindia = module.exports = mongoose.model('Stateindia', StateindiaSchema);