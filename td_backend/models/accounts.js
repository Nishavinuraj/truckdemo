const mongoose = require('mongoose');
const AccountsmasterSchema = mongoose.Schema({
    accountname: {
        type: String,
        required: false
    },
    site: {
        type: String,
        required: false
    },
    category: {
        type: String,
        required: false
    },
    group: {
        type: String,
        required: false
    },
    accounttype: {
        type: String,
        required: false
    },
    gstnumber: {
        type: String,
        required: false
    }
    ,
    panno: {
        type: String,
        required: false
    },
    vcode: {
        type: String,
        required: false
    },
    contactpersonname: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: false
    },
    mobile1: {
        type: String,
        required: false
    },mobile2: {
        type: String,
        required: false
    },bstreet1: {
        type: String,
        required: false
    },bstreet2: {
        type: String,
        required: false
    },bcity: {
        type: String,
        required: false
    },bstate: {
        type: String,
        required: false
    },bzip: {
        type: String,
        required: false
    },bcountry: {
        type: String,
        required: false
    },bphone: {
        type: String,
        required: false
    },sstreet1: {
        type: String,
        required: false
    },sstreet2: {
        type: String,
        required: false
    },scity: {
        type: String,
        required: false
    },sstate: {
        type: String,
        required: false
    },szip: {
        type: String,
        required: false
    },scountry: {
        type: String,
        required: false
    },sphone: {
        type: String,
        required: false
    },opbal: {
        type: String,
        required: false
    },ocrdr: {
        type: String,
        required: false
    },clbal: {
        type: String,
        required: false
    },cdrcr: {
        type: String,
        required: false
    }
});


const Account = module.exports = mongoose.model('Account', AccountsmasterSchema);