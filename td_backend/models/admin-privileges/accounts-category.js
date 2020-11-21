const mongoose = require('mongoose');
const AccountcategorySchema = mongoose.Schema({
    catname: {
        type: String,
        required: true
    },
    cattype: {
        type: String,
        required: false
    },
    undergroup: {
        type: String,
        required: false
    },
    accounts: {
        type: String,
        required: false
    }
    ,
    drcr: {
        type: String,
        required: false
    }
});


const Accountcategory = module.exports = mongoose.model('Accountcategory', AccountcategorySchema);