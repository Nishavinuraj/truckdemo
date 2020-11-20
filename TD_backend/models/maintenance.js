const mongoose = require('mongoose');

const MaintenanceSchema = mongoose.Schema({

    taname: {
        type: String,
        required: false
    },
    truckno: {
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
    truck_maintenance : {
        type: String,
        required: false
    },
    truck_particulars : {
        type: String,
        required: false
    },
    tyre_maintenance : {
        type: String,
        required: false
    },
    tyre_particulars : {
        type: String,
        required: false
    },
    remarks: {
        type: String,
        required: false
    },

    // accept: {
    //     type: String,
    //     default: "No",
    //     required: true
    // }
})
const Maintenance = module.exports = mongoose.model('Monitoring', MaintenanceSchema);