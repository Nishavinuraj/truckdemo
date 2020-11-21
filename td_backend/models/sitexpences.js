const mongoose = require('mongoose');

let multidestSchema = mongoose.Schema({
    destination: { type:String, required: false },
    spi: { type:String, required: false },
    km: { type:String, required: false },
    newtoll: { type:String, required: false },
    newbhatta:{ type:String, required: false },
    loading:{ type:String, required: false },
    newmisc:{ type:String, required: false },
    newtotal:{ type:String, required: false },
});

const SitexpencesSchema = mongoose.Schema({

    site: {
        type: String,
        required: false
    },
    status: {
        type: String,
        required: false
    },

    multidest:[multidestSchema]


})
const Sitexpences = module.exports = mongoose.model('Sitexpences', SitexpencesSchema);