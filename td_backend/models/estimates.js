const mongoose = require('mongoose');
const EstimatesSchema = mongoose.Schema({
    product: [{
        type: String,
        required: false
    }],
    productQty: [{
        type: Number,
        required: false
    }],
    creationDate: {
        type: Date,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    }
    ,
    vendors: [{
        type: String,
        required: true
    }]
    ,
    remark: {
        type: String,
        required: false
    },
    status: {
        type: String,
        required: true
    },
    isDeleted: {
        type: Boolean,
        required: true
    }

});


const Estimates = module.exports = mongoose.model('Estimates', EstimatesSchema);