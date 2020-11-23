const mongoose = require('mongoose');
const LogbookSchema = mongoose.Schema({
    wono: {
        type: Number,
        required: true
    },
    pname: {
        type: String,
        required: false
    },
    ctype: {
        type: String,
        required: false
    },
    clocation: {
        type: String,
        required: false
    },
    lbdate: {
        type: Date,
        default: Date.now,
        required: true
    },
    Start: {
        type: String,
        required: false
    },
    stop: {
        type: String,
        required: false
    },
    lunchhrs: {
        type: String,
        required: false
    },
    totalhrs: {
        type: String,
        required: false
    },
    remarks: {
        type: String,
        required: false
    }

});


const Logbook = module.exports = mongoose.model('Logbook', LogbookSchema);