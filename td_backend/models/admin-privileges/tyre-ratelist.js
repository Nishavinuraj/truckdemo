const mongoose = require('mongoose');

let multidestSchema = mongoose.Schema({   
    name:{type:String,required: false},
    item_id:{type:String,required: false},
    location:{type:String,required: false},
    price:{type:String,required: false}
});

const TyreratelistsSchema = mongoose.Schema({    
    trl_date: {
        type: Date,
        required: true
    },
    company_name: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
    }, 
    tyre_type: {
        type: String,
        required: true
    },    
    nsd: {
        type: String,
        required: false
    },
    tyre_size: {
        type: String,
        required: false
    },
    trl_items:[multidestSchema]

})
const Tyreratelists = module.exports = mongoose.model('Tyreratelist', TyreratelistsSchema);