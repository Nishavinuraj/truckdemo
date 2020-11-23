const mongoose = require('mongoose');
const brokermasterSchema = mongoose.Schema({
    site:{
        type: String,
        required: false
    },
    brokername:{
        type: String,
        required: false
    },
    mobileno: {
        type: String,
        required: false
    },
    panno: {
        type: String,
        required: false
    },
    address: {
        type: String,
        required: false
    },
    city: {
        type: String,
        required: false
    },
    state: {
        type: String,
        required: false
    },
    pinno: {
        type: String,
        required: false
    }
});

const Brokermaster = module.exports = mongoose.model('Brokermaster', brokermasterSchema);