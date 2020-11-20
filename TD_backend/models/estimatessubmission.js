
const mongoose = require('mongoose');
const EstimatesSubmissionSchema = mongoose.Schema({
    product: [{
        type: String,
        required: false
    }],
    productQty: [{
        type: Number,
        required: false
    }],
    estimateId: {
        type: String,
        required: false
    },
    estimateDate: {
        type: Date,
        required: false
    },
    receivedDate: {
        type: Date,
        required: false
    },
    vendor: {
        type: String,
        required: true
    }
    ,
    remark: {
        type: String,
        required: false
    },
    otherDetails: {
        type: String,
        required: false
    },
    status:{
        type:String,
        required:true
    },
    totalPrice: {
        type: Number,
        required: false
    },
    total: {
        type: Number,
        required: true
    },
    referenceSubmissionId:{
        type:String,
    }

});


const EstimatesSubmission = module.exports = mongoose.model('Estimatessubmission', EstimatesSubmissionSchema);