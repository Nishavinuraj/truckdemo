const mongoose = require('mongoose');

let multidestSchema = mongoose.Schema({   
    worktobedone:{type:String,required: false},
    lastdoneon:{type:Date,required: false},
    remarks:{type:String,required: false},
    nextduekm:{type:Number,required: false}
});


const JobworksSchema = mongoose.Schema({    
    site: {
        type: String,
        required: false
    }, 
    job_number: {
        type: String,
        required: false
    },
    job_type: {
        type: String,
        required: false
    },
    job_date: {
        type: Date,
        required: false
    },    
    vendor: {
        type: String,
        required: false
    },
    truck_no: {
        type: String,
        required: false
    },
    enginetype: {
        type: String,
        required: false
    },
    mannualenginetype: {
        type: String,
        required: false
    },
    km_reading: {
        type: Number,
        default: 0,
        required: false
    },
    jobremarks: {
        type: String,
        required: false
    },
    bill_amount: {
        type: Number,
        required: false
    },
    app_amount: {
        type: Number,
        required: false
    },
    job_remarks: {
        type: String,
        required: false
    },
    user: {
        type: String,
        required: false
    },   
    job_items:[multidestSchema]

})
const Jobworks = module.exports = mongoose.model('Jobwork', JobworksSchema);