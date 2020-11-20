const mongoose = require('mongoose');
const jwremindersSchema = mongoose.Schema({
    site: {
        type: String,
        required: false
    }, 
    job_date: {
        type: Date,
        required: true
    },
    vendor: {
        type: String,
        required: true
    },
    truck_no: {
        type: String,
        required: true
    },
    worktobedone: {
        type: String,
        required: true
    },
    nextduekm: {
        type: Number,
        default: 0,
        required: false
    },
    km_reading: {
        type: Number,
        default: 0,
        required: false
    },
    ckm_reading: {
        type: Number,
        default: 0,
        required: false
    },
    isDone: {
        type: Boolean,
        default: false,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    remarks: {
        type: String,
        required: true
    },

    jobwork_id: {type: String, required: true}
});


const jwreminders = module.exports = mongoose.model('Jwreminder', jwremindersSchema);