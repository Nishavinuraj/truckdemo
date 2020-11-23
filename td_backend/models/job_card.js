const mongoose = require('mongoose');


let job_detailsSchema = mongoose.Schema({
    work_be_done: {
        type: String,
        required: false
    },
    last_done_on: {
        type: Date,
        default: Date.now,
        required: false
    },
    remarks: {
        type: String,
        required: false
    },
    qty: {
        type: Number,
        required: false
    },
    scrap_qty: {
        type: Number,
        required: false
    },
    next_due_km: {
        type: String,
        required: false
    },
    rate: {
        type: Number,
        required: false
    },
    gst: {
        type: Number,
        required: false
    },
    amount: {
        type: Number,
        required: false
    }
});

const JobCardSchema = mongoose.Schema({
    date: {
        type: Date,
        required: false
    },
    jobno: {
        type: Number,
        required: false
    },
    srno: {
        type: Number,
        required: false
    },
    truckno: {
        type: String,
        required: false
    },
    km_reading: {
        type: String,
        required: false
    },
    vendor_name: {
        type: String,
        required: false
    },
    remarks: {
        type: String,
        require: false
    },
    bill_amount: {
        type: Number,
        required: false
    },
    app_amount: {
        type: Number,
        required: false
    },
    bill: {
        type: String,
        required: false
    },
    job_details: [job_detailsSchema] 
});

const JobCard = module.exports = mongoose.model('JobCard', JobCardSchema);