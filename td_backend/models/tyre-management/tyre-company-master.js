const mongoose = require('mongoose');

let multidestSchema = mongoose.Schema({   
    brand:{type:String,required: false},
    tyre_size:{type:String,required: false},
    tyre_type:{type:String,required: false},
    nsd:{type:String,required: false}
});

const TyrecmsSchema = mongoose.Schema({    
    coname: {
        type: String,
        required: false
    },
    user: {
        type: String,
        required: false
    },   
    tcm_items:[multidestSchema]

})
const Tyrecms = module.exports = mongoose.model('Tyrecm', TyrecmsSchema);