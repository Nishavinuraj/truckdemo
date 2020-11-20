const mongoose = require('mongoose');
const JobworkmastersSchema = mongoose.Schema({
    jobworkname:{
        type: String,
        required: false
    }
});


const Jobworkmasters = module.exports = mongoose.model('Jobworkmaster', JobworkmastersSchema);