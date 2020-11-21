const mongoose = require('mongoose');

const AccdataentrySchema = mongoose.Schema({
    site: {
        type: String,
        required: true
    }, ade_type: {
        type: String,
        required: true
    }, ade_number: {
        type: Number,
        required: true
    }, ade_date: {
        type: Date,
        required: true
    }, payment_type: {
        type: String,
        required: true
    }, against: {
        type: String,
        required: true
    }, department: {
        type: String,
        required: true
    }, draccount_name: {
        type: String,
        required: true
    }, craccount_name: {
        type: String,
        required: true
     }, amount: {
        type: Number,
        required: true
    }, remarks: {
        type: String,
        required: false
    }, user: {
        type: String,
        required: false
    }
});


const Accdataentry = module.exports = mongoose.model('Accdataentry', AccdataentrySchema);