const mongoose = require('mongoose');

let multidestSchema = mongoose.Schema({
    tyre:{type:Number,required: false},
    tcc:{type:Number,required: false},
    tavg:{type:Number,required: false}
});
const TruckaverageSchema = mongoose.Schema({
    site: {
        type: String,
        required: false
    },
    multidest:[multidestSchema]
})
const Truckaverage = module.exports = mongoose.model('Truckaverage', TruckaverageSchema);