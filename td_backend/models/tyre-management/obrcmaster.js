const mongoose = require('mongoose');

const ObRcMastersSchema = mongoose.Schema({

    orname: {
        type: String,
        required: false
    },
    desc: {
        type: String,
        required: false
    }

});


const ObRcMasters = module.exports = mongoose.model('ObRcMaster', ObRcMastersSchema);