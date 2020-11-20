const mongoose = require('mongoose');

let multidestSchema = mongoose.Schema({
    destination:{type:String,required: false},
    spi:{type:String,required: false},
    km:{type:String,required: false},
    freight:{type:String,required: false},
    startdate:{type:String,required: false},
    enddate:{type:String,required: false},
});

const RateSchema = mongoose.Schema({
    name: {
        type: String,
        required: false
    },

    site: {
        type: String,
        required: false
    },
    status: {
        type: String,
        required: false
    },  rateby: {
        type: String,
        required: false
    },
    multidest:[multidestSchema]


})
const Rate = module.exports = mongoose.model('Rate', RateSchema);