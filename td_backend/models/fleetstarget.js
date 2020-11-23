const mongoose = require('mongoose');

let monthSchema = mongoose.Schema({
    name: { type:String, required: false},
    target: { type:String, required: false},
});

const FleetstargetSchema = mongoose.Schema({
        fyear: {String,required: false},
        tyre: {String,required: false},
        months: [monthSchema],
        truckno:{type:String,required: false},
        year: {
                type: String,
                required: false
            }
})
const Fleetstarget = module.exports = mongoose.model('Fleetstarget', FleetstargetSchema);