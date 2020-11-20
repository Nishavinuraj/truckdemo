const mongoose = require('mongoose');

let multidestSchema = mongoose.Schema({   
    name:{type:String,required: false},
    item_id:{type:String,required: false},
    qty:{type:String,required: false},
    unit:{type:String,required: false},
    price:{type:String,required: false},
    refund:{type:String,required: true},
    mat_type:{type:String,required: false},
    ref_qty:{type:String,required: false},
    godown:{type:String,required: false},
    total:{type:String,required: false}
  
});

const MaterialisSchema = mongoose.Schema({    
    mi_number: {
        type: String,
        required: false
    },
    mi_type: {
        type: String,
        required: false
    },
    site: {
        type: String,
        required: false
    }, 
    mi_date: {
        type: Date,
        required: false
    },    
    department: {
        type: String,
        required: false
    },
    issuedby: {
        type: String,
        required: false
    },
    issuedfor: {
        type: String,
        required: false
    },
    mcreading: {
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
    materiali_items:[multidestSchema]

})
const Materialis = module.exports = mongoose.model('Materiali', MaterialisSchema);
