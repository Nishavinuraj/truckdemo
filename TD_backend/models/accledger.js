const mongoose = require('mongoose');
const AccledgerSchema = mongoose.Schema({
    branch: {
        type: String,
        required: false
    },accountname: {
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
        type: Number,
        required: false
    },acrdtamt: {
        type: Number,
        required: false
    },avoudt: {
        type: Date,
        required: false
    },pname: {
        type: String,
        required: false
    },dcrname: {
        type: String,
        required: false
    },username: {
        type: String,
        required: false
    },catname: {
        type: String,
        required: false
    },groupname: {
        type: String,
        required: false
    },flag: {
        type: Number,
        required: false
    },user: {
        type: String,
        required: false
    },avoudtnew: {
        type: String,
        required: false
    },
    accounts_id: {type: String, required: true}
});



const Accledger = module.exports = mongoose.model('Accledger', AccledgerSchema);