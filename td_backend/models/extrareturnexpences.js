const mongoose = require('mongoose');

let multidestSchema = mongoose.Schema({
    acname:{type:String,required: false},
    acamt:{type:String,required: false},
    billing:{type:String,required: false},
    billamt:{type:String,required: false},
});

const ExtrareturnexpencesSchema = mongoose.Schema({
   
    site: {type: String,required: false},
    receiptno: {type: String,required: false},
    eredate: {type: String,required: false},
    lrno: {type: String,required: false},
    truckno: {type: String,required: false},
    drivername: {type: String,required: false},
    paymenttype: {type: String,required: false},
    paymentmode: {type: String,required: false},

    multidest:[multidestSchema]


})
const Extrareturnexpences = module.exports = mongoose.model('Extrareturnexpences', ExtrareturnexpencesSchema);