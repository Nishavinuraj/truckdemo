const mongoose = require('mongoose');

let multidestSchema = mongoose.Schema({
    exname:{type:String,required: false},
    amount:{type:String,required: false},
});

const SitexpensesSchema = mongoose.Schema({

    site: {
        type: String,
        required: false
    },
    status: {
        type: String,
        required: false
    },
    destination: {
        type:String,
        required: false
    },
    tyre: {
        type:String,
        required: false
    },
    km: {
        type:String,
        required: false
    },
    diesel: {
        type:String,
        required: false
    },

    multidest:[multidestSchema]


})
const Sitexpenses = module.exports = mongoose.model('Sitexpenses', SitexpensesSchema);