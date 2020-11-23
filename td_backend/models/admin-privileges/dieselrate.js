const mongoose = require('mongoose');
const DieselrateSchema = mongoose.Schema({
    site: {
        type: String,
        required: false
    },
    vendername: {
        type: String,
        required: false
    },
    date: {
        type: String,
        required: false
    },
    rate: {
        type: String,
        required: false
    },
    username: {
        type: String,
        required: false
    }
    
   
});


const Dieselrate = module.exports = mongoose.model('Dieselrate', DieselrateSchema);