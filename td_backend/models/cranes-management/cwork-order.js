const mongoose = require('mongoose');

let multidestSchema = mongoose.Schema({   
    ctype:{type:String,required: false},
    clocatoin:{type:String,required: false},
    qty:{type:String,required: false},
    unit:{type:String,required: false},
    price:{type:String,required: false},
    discount:{type:String,required: false},
    cgst:{type:String,required: false},
    sgst:{type:String,required: false},
    igst:{type:String,required: false},
    total:{type:String,required: false}
  
});

const CworkorderSchema = mongoose.Schema({    
    site: {
        type: String,
        required: false
    }, 
    wo_number: {
        type: String,
        required: false
    },
    wo_type: {
        type: String,
        required: false
    },
    wo_date: {
        type: Date,
        required: false
    },    
    vendor: {
        type: String,
        required: false
    },
    quotrefno: {
        type: String,
        required: false
    },
    wsa: {
        type: String,
        required: false
    },
    sow: {
        type: String,
        required: false
    },
    ras: {
        type: String,
        required: false
    },
    narration: {
        type: String,
        required: false
    },
    rounded_off: {
        type: String,
        required: false
    },
    gross_amount: {
        type: String,
        required: false
    },
    cgst_amount: {
        type: String,
        required: false
    },
    sgst_amount: {
        type: String,
        required: false
    },
    igst_amount: {
        type: String,
        required: false
    },
    net_amount: {
        type: String,
        required: false
    },
    total_amount: {
        type: String,
        required: false
    },
    round_off_type: {
        type: String,
        required: false
    },
    user: {
        type: String,
        required: false
    }, 
    Cworkorder_items:[multidestSchema]

})
const Cworkorder = module.exports = mongoose.model('Cworkorder', CworkorderSchema);
