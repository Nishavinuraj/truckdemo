const mongoose = require('mongoose');
const ScrapledgerSchema = mongoose.Schema({
    site: {
        type: String,
        required: false
    },itemname: {
        type: String,
        required: false
    },avouno: {
        type: Number,
        required: false
    },arefno: {
        type: String,
        required: false
    },adoctp: {
        type: String,
        required: false
    }
    ,adebtamt: {
        type: String,
        required: false
    },acrdtamt: {
        type: String,
        required: false
    },avoudt: {
        type: String,
        required: false
    },
    dqty: {
        type: String,
        required: false
    },cqty: {
        type: String,
        required: false
    },mrtype: {
        type: String,
        required: false
    },pname: {
        type: String,
        required: false
    },username: {
        type: String,
        required: false
    },user: {
        type: String,
        required: false
    },filetype: {
        type: String,
        required: false
    },dept: {
        type: String,
        required: false
    },
    scrap_id: {type: String, required: true}
});


const Scrapledger = module.exports = mongoose.model('Scrapledger', ScrapledgerSchema);

