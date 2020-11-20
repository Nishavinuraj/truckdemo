const mongoose = require('mongoose');
const JoborderSchema = mongoose.Schema({
    site: {
        type: String,
        required: false
    },
    jono: {
        type: String,
        required: false
    },
    deliverydate: {
        type: String,
        required: false
    },
    vender: {
        type: String,
        required: false
    },

    department: {
        type: String,
        required: false
    },

    oq: {
        type: String,
        required: false
    },gst: {
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
    }



    ,


    ok: {
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


const Itemmaster = module.exports = mongoose.model('Itemmaster', ItemmasterSchema);