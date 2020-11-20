const mongoose = require('mongoose');

const VendorMasterSchema = mongoose.Schema({
    name: {
        type: String,
        required: false
    },
    address: {
        type: String,
        required: false
    },
    location: {
        type: String,
        required: false
    },
    vendor_type: {
        type: String,
        required: false
    },
    specialized_in: {
        type: String,
        required: false
    },
    mobile_no: {
        type: String,
        required: false
    },
    contact_person: {
        type: String,
        required: false
    },
    gst_no: {
        type: String,
        required: false
    },
    condition: {
        type: String,
        required: false
    },
    remarks: {
        type: String,
        required: false
    },
    rating: {
        type: Number,
        required: false
    },
    statename: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: false
    }

});

const VendorMaster = module.exports = mongoose.model('VendorMaster', VendorMasterSchema);