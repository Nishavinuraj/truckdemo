const mongoose = require('mongoose');

const multidestSchema = mongoose.Schema({
    date_of_fitment: {
        type: String,
        required: false
    }, 
    fitment_km: {
        type: Number,
        required: false
    },
    tyre_no: {
        type: String,
        required: false
    }, 
    positionname: {
        type: String,
        required: false
    },
    pno: {
        type: Number,
        required: false
    },
    nsd: {
        type: Number,
        required: false
    }, 
    rtd: {
        type: Number,
        required: false
    }
});


const TruckInspectionSchema = mongoose.Schema({
    truck_no: {
        type: String,
        required: false
    },
    idate: {
        type: Date,
        default: Date.now,
        required: false
    },
    km_reading: {
        type: Number,
        required: false
    },

    remarks: {
        type: String,
        required: false
    },
    user: {
        type: String,
        required: false
    },
    observations: [{
        type: String,
        required: false
    }],
    recommendations: [{
        type: String,
        required: false
    }],
    inspections: [multidestSchema]
});

const TruckInspection = module.exports = mongoose.model('TruckInspection', TruckInspectionSchema);



