const mongoose = require('mongoose');
let multidestSchema = mongoose.Schema({
    unloadingaddress:{type:String,required: false},
    contactperson:{type:String,required: false},
    phoneno:{type:String,required: false}
  
});


const CaddressSchema = mongoose.Schema({
    site: {
        type: String,
        required: false
    },
    name: {
        type: String,
        required: false
    },
    mobile: {
        type: String,
        required: false
    },
    gst: {
        type: String,
        required: false
    },
    multidest:[multidestSchema]


})
const Caddress = module.exports = mongoose.model('Caddress', CaddressSchema);