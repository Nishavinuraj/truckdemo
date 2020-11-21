const mongoose = require('mongoose');
const TruckSchema = mongoose.Schema({
    vtype: {
        type: String,
        required: false
    },
    ownername: {
        type: String,
        required: false
    },
    truckno: {
        type: String,
        required: false
    },
    type: {
        type: String,
        required: false
    },
    gps: {
        type: String,
        required: false
    },
    spi: {
        type: String,
        required: false
    },
    purchasedate: {
        type: String,
        required: false
    },
    salesdate: {
        type: String,
        required: false
    },
    taname: {
        type: String,
        required: false
    },
    drivername: {
        type: String,
        required: false
    }
    ,
    status: {
        type: String,
        required: false
    } ,
    newaddress: {
        type: String,
        required: false
    },
    newpan: {
        type: String,
        required: false
    },
    newaadhar: {
        type: String,
        required: false
    },
    newmobile: {
        type: String,
        required: false
    },
    newcontactp: {
        type: String,
        required: false
    },
    newcmobile: {
        type: String,
        required: false
    },
    newcarring: {
        type: String,
        required: false
    },
    newengine: {
        type: String,
        required: false
    },
    enginetype: {
        type: String,
        required: false
    },
    newchasis: {
        type: String,
        required: false
    },
    newinsurancefrom: {
        type: String,
        required: false
    },
    newfitnessfrom: {
        type: String,
        required: false
    },
    newpermitfrom: {
        type: String,
        required: false
    },
    newpucfrom: {
        type: String,
        required: false
    },
    newinsuranceto: {
        type: String,
        required: false
    },
    newfitnessto: {
        type: String,
        required: false
    },
    newpermitto: {
        type: String,
        required: false
    },
    newpucto: {
        type: String,
        required: false
    },
    newcommision: {
        type: String,
        required: false
    },
    newrates: {
        type: String,
        required: false
    },
    newpaymentcharge: {
        type: String,
        required: false
    },
    newbilltycharge: {
        type: String,
        required: false
    }
});


const Trucks = module.exports = mongoose.model('Trucks', TruckSchema);