
const mongoose = require('mongoose');
const EstimatesProdSubmissionSchema = mongoose.Schema({
    product: {
        type: String,
        required: false
    },
    productQty: {
        type: Number,
        required: false
    },
    estimateId: {
        type: String,
        required: false
    },
    unit: {
        type: String,
        required: true
    },
    unitRate: {
        type: Number,
        required: false
    },
    discount: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    cgst: {
        type: Number,
        required: true
    },
    sgst: {
        type: Number,
        required: true
    },
    igst: {
        type: Number,
        required: true
    },
    stockStatus: {
        type: String,
        required: true
    },
    referenceEsSubmissionId:{
        type:String,
    }

});


const EstimatesProdSubmission = module.exports = mongoose.model('EstimatesProdSubmission', EstimatesProdSubmissionSchema);