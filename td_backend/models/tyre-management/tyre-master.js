const mongoose = require('mongoose');

const TruckTyreMasterSchema = mongoose.Schema({

    tyre_no: {
        type: String,
        required: false
    },
    purchase_type: {
        type: String,
        required: false
    },
    bill_no: {
        type: Number,
        required: false
    },
    bill_date: {
        type: Date,
        required: false
    },
    dealer_name: {
        type: String,
        required: false
    },
    price: {
        type: Number,
        required: false
    }, 
    company_name: {
        type: String,
        required: false
    },
    brand: {
        type: String,
        required: false
    }, 
    tyre_type: {
        type: String,
        required: false
    },
    nsd: {
        type: String,
        required: false
    },
    rtd: {
        type: String,
        required: false
    },
    date_of_fitment: {
        type: Date,
        required: false
    },
    fitment_km: {
        type: Number,
        required: false
    },
    tyre_size: {
        type: String,
        required: false
    },
    vehicle_no: {
        type: String,
        required: false
    },
    tyrestatus: {
        type: String,
        required: false
    },
    rs_date: {
        type: Date,
        required: false
    },
    tyreposition: {
        type: String,
        required: false
    },
    removekm: {
        type: Number,
        required: false
    },
    user: {
        type: String,
        required: false
    }

});


const TruckTyreMaster = module.exports = mongoose.model('TruckTyreMaster', TruckTyreMasterSchema);