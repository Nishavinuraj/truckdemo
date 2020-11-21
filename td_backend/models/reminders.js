const mongoose = require('mongoose');

let filesSchema = mongoose.Schema({
    documentname: {
        type: String,
        required: false
    },
    attachdocument: {
        type: String,
        required: false
    },
    startdate: {
        type: Date,
        required: false
    },
    enddate: {
        type: Date,
        required: false
    },
    fdate: {
        type: Date,
        default: Date.now,
        required: true
    },
    status: {
        type: String,
        default: "",
        required: true
    },
    remarks: {
        type: String,
        default: "",
        required: true
    }
    
});

const RemindersSchema = mongoose.Schema({
    truckno: {
        type: String,
        required: false
    },
    files: [filesSchema] 
});

const Reminders = module.exports = mongoose.model('Reminders', RemindersSchema);