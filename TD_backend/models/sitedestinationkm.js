const mongoose = require('mongoose');
const sitedestinationkmSchema = mongoose.Schema({
    site:{
        type: String,
        required: false
    },
    destination:{
        type: String,
        required: false
    },
    km:{
        type: Number,
        required: false
    }
});


const Sitedestinationkm = module.exports = mongoose.model('Sitedestinationkm', sitedestinationkmSchema);