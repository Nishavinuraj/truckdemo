const mongoose = require('mongoose');
const TruckavgsSchema = mongoose.Schema({
    tyre: {
        type: String,
        required: true
    },
    tcc: {
        type: String,
        required: true
    },
    tavg: {
        type: String,
        required: true
    },
    site: {
        type: String,
        required: true
    }
});


const Truckavgs = module.exports = mongoose.model('Truckavgs', TruckavgsSchema);