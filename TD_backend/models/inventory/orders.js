const mongoose = require('mongoose');

let multidestSchema = mongoose.Schema({   
    name:{type:String,required: false},
    item_id:{type:String,required: false},
    qty:{type:String,required: false},
    unit:{type:String,required: false},
    price:{type:String,required: false},
    discount:{type:String,required: false},
    cgst:{type:String,required: false},
    sgst:{type:String,required: false},
    igst:{type:String,required: false},
    total:{type:String,required: false}
});

const OrdersSchema = mongoose.Schema({    
    order_number: {
        type: String,
        required: false
    },
    order_type: {
        type: String,
        required: false
    },
    site: {
        type: String,
        required: false
    }, 
    order_date: {
        type: String,
        required: false
    },    
    delivery_date: {
        type: String,
        required: false
    },
    vendor: {
        type: String,
        required: false
    },
    job_type: {
        type: String,
        required: false
    },
    department: {
        type: String,
        required: false
    },
    narration: {
        type: String,
        required: false
    },
    terms_and_conditions: {
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
    order_items:[multidestSchema]

})
const Orders = module.exports = mongoose.model('Order', OrdersSchema);