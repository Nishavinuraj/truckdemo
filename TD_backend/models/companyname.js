const mongoose = require('mongoose');

const CompanyNameSchema = mongoose.Schema({
    name: {
        type: String,
        required: false
    }, value: {
        type: String,
        required: false
    }
});

const CompanyName = module.exports = mongoose.model('CompanyName', CompanyNameSchema);