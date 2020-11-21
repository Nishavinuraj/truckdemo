const mongoose = require('mongoose');
const IssuedbiesSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    deleted: {
        type: Boolean,
        required: false,
        default: false
    },
});


const Issuedbies = module.exports = mongoose.model('Issuedbie', IssuedbiesSchema);