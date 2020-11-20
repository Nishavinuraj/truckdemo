const mongoose = require('mongoose');

const BrandSchema = mongoose.Schema({
    name: {
        type: String,
        required: false
    }, value: {
        type: String,
        required: false
    }
});

const Brand = module.exports = mongoose.model('Brand', BrandSchema);