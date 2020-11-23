const mongoose = require('mongoose');

const TruckMaintenanceSchema = mongoose.Schema({

    srno: {
        type: Number,
        required: false
    },
    taname: {
        type: String,
        required: false
    },
    truckno: {
        type: String,
        required: false
    },
    particulars : {
        type: String,
        required: false
    },
    status: {
        type: String,
        required: false
    },
    last_location: {
        type: String,
        required: false
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    time: {
        type: Date,
        default: Date.now,
        required: true
    },
    assign: {
        type: String,
        required: false
    },
    km_reading: {
        type: String,
        required: false
    },
    remarks: {
        type: String,
        required: false
    },
    job_time: {
        type: Date,
        required: false
    },
    accept: {
        type: String,
        default: "No",
        required: true
    }
})
const TruckMaintenance = module.exports = mongoose.model('TruckMaintenance', TruckMaintenanceSchema);