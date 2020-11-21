const mongoose = require('mongoose');
const tyrepositionmasterSchema = mongoose.Schema({
    positionname:{
        type: String,
        required: false
    }
});


const Tyrepositionmaster = module.exports = mongoose.model('Tyrepositionmaster', tyrepositionmasterSchema);