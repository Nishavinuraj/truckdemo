const mongoose = require('mongoose');
const AccountsledgerSchema = mongoose.Schema({
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
        default: Date.now,
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
    },
    accounts_id: {type: String, required: true}
});



const Accountsledger = module.exports = mongoose.model('Accountsledger', AccountsledgerSchema);