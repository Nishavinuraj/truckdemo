const mongoose = require('mongoose');

const SiteprofileSchema = mongoose.Schema({
    site: {
        type: String,
        required: true
    },
    consignor: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    from: {
        type: String,
        required: true
    },
    godown: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    gstno: {
        type: String,
        required: false
    },
    siteaddress: {
        type: String,
        required: false
    },
    phoneno: {
        type: String,
        required: false
    },
    emailid: {
        type: String,
        required: false
    },
    custcareno: {
        type: String,
        required: false
    },

})
module.exports = mongoose.model('Siteprofile', SiteprofileSchema);
