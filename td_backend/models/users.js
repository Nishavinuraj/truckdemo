const mongoose = require('mongoose');
let permissionsSchema = mongoose.Schema({
    pname: {
        type: String,
        required: false
    },
    pvalue: {
        type: String,
        required: false
    }
});

const UsercreationSchema = mongoose.Schema({
    name: {
        type: String,
        required: false
    },password: {
        type: String,
        required: false
    },tpassword: {
        type: String,
        required: false
    },site: {
        type: String,
        required: false
    },role: {
        type: String,
        required: false
    },
    permissions:[permissionsSchema] 
    
 
});


const Users = module.exports = mongoose.model('Users', UsercreationSchema);