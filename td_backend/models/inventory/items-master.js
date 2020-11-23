const mongoose = require('mongoose');
const ItemmastersSchema = mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    name: {
        type: String,
        unique: true,
        required: true
    },
    itemcategory: {
        type: String,
        required: false
    },
    itemtype: {
        type: String,
        required: true
    },
    unit: {
        type: String,
        required: false
    },
    oq: {
        type: Number,
        default: 0,
        required: false
    },
    gst: {
        type: String,
        required: false
    },
    hsncode: {
        type: String,
        required: false
    },
    srate: {
        type: String,
        required: false
    },
    sdescription: {
        type: String,
        required: false
    },
    prate: {
        type: String,
        required: false
    },
    pdescription: {
        type: String,
        required: false
    },
    rate: {
        type: String,
        required: false
    },
    value: {
        type: String,
        required: false
    },
    godown: {
        type: String,
        required: false
    }
});


const Itemmasters = module.exports = mongoose.model('Itemmaster', ItemmastersSchema);