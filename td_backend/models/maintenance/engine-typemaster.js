const mongoose = require('mongoose');

let multidestSchema = mongoose.Schema({
    jobworkname:{type:String,required: false},
    kmtolerance:{type:Number,required: false}
});
const EnginemasterSchema = mongoose.Schema({
    enginetype: {
        type: String,
        required: false
    },
    multidest:[multidestSchema]
})
const Enginemaster = module.exports = mongoose.model('Enginemaster', EnginemasterSchema);