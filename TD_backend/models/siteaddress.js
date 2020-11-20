const mongoose = require('mongoose');

const SiteAddressSchema = mongoose.Schema({
    site: {
        type: String,
        required: false
    },
    address: {
        type: String,
        required: false
    },
    phone_numbers: {
        type: String,
        required: false
    }
})
module.exports = mongoose.model('Siteaddress', SiteAddressSchema);
