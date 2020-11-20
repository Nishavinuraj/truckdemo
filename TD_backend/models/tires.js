const mongoose = require('mongoose');
const TireSchema = mongoose.Schema({
    name: {
        type: String,
        required: false
    },
    tamount: {
        type: Number,
        required: false
    }

});


const Tires = module.exports = mongoose.model('Tires', TireSchema);