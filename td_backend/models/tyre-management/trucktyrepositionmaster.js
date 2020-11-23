const mongoose = require('mongoose');
let multidestSchema = mongoose.Schema({
    posno:{type:String,required: false},
    postyre:{type:String,required: false},
});
const TrucktyrepositionmasterSchema = mongoose.Schema({
   
    tyretypename: {
        type: String,
        required: false
    },
    tyre: {
        type: String,
        required: false
    },
    multidest:[multidestSchema]
})
const Trucktyrepositionmaster = module.exports = mongoose.model('Trucktyrepositionmaster', TrucktyrepositionmasterSchema);