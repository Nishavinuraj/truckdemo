const mongoose = require('mongoose');

let multidestSchema = mongoose.Schema({
    destination:{type:String,required: false},
    spi:{type:String,required: false},
    km:{type:String,required: false},
    freight:{type:String,required: false},
    startdate:{type:String,required: false},
    enddate:{type:String,required: false},
});

const PlantRatesListSchema = mongoose.Schema({
    srno: {
        type: Number,
        required: false
    },
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
    },  
    rateby: {
        type: String,
        required: false
    },
    date_from: {
        type: Date,
        required: false
    },
    date_to: {
        type: Date,
        required: false
    },

    multidest:[multidestSchema]


})
const PlantRatesList = module.exports = mongoose.model('PlantRatesList', PlantRatesListSchema);