const mongoose = require('mongoose');
const GpsRateMasterSchema = mongoose.Schema({
    destination: {
        type: String,
        unique : true,
        dropDups: true,
        required: false
    },
    eight_mt: {
        type: String,
        required: false
    },
    twentyone_mt: {
        type: String,
        required: false
    },
    twentyfive_mt: {
        type: String,
        required: false
    },

    thirtythree_mt: {
        type: String,
        required: false
    },
    
});


const Trucks = module.exports = mongoose.model('GpsRateMaster', GpsRateMasterSchema);