const mongoose = require('mongoose');

let multidestSchema = mongoose.Schema({
    vendername:{type:String,required: false},
    company:{type:String,required: false},
    mobileno:{type:String,required: false},
    email:{type:String,required: false},
    startdate:{type:String,required: false},
    enddate:{type:String,required: false},
    status:{type:String,required: false}
});
const PetrolSchema = mongoose.Schema({
    site: {
        type: String,
        required: false
    },
    multidest:[multidestSchema]
})
const Petrol = module.exports = mongoose.model('Petrol', PetrolSchema);