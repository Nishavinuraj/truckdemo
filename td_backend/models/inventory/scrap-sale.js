const mongoose = require('mongoose');

let multidestSchema = mongoose.Schema({   
    name:{type:String,required: false},
    item_id:{type:String,required: false},
    qty:{type:String,required: false},
    unit:{type:String,required: false},
    price:{type:String,required: false},
    godown:{type:String,required: false},
    total:{type:String,required: false}
});

const ScrapsSchema = mongoose.Schema({    
    ss_number: {
        type: String,
        required: false
    },
    ss_type: {
        type: String,
        required: false
    },
    site: {
        type: String,
        required: false
    }, 
    ss_date: {
        type: Date,
        required: false
    },    
    vendor: {
        type: String,
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
    scraps_items:[multidestSchema]

})
const Scraps = module.exports = mongoose.model('Scrap', ScrapsSchema);