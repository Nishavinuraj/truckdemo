const mongoose = require('mongoose');
const TruckdivertSchema = mongoose.Schema({
   
    site: {type: String,required: false},
    receiptno: {type: String,required: false},
    tddate: {type: String,required: false},
    lrno: {type: String,required: false},
    truckno: {type: String,required: false},
    actualweight: {type: Number,required: false},
    fdesti: {type: String,required: false},
    diverto: {type: String,required: false},
    rate: {type: Number,required: false},
    pamt: {type: Number,required: false},
    tamt: {type: Number,required: false},
    precdate: {type: String,required: false},
    precamt: {type: Number,required: false},
    ppaymenttype: {type: String,required: false},
    ppaymentmode: {type: String,required: false},
    tpaiddate: {type: String,required: false},
    tpaidamt: {type: Number,required: false},
    tpaymenttype: {type: String,required: false},
    tpaymentmode: {type: String,required: false},
    user: {type: String,required: false}

})

const Truckdivert = module.exports = mongoose.model('Truckdivert', TruckdivertSchema);