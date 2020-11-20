const mongoose = require('mongoose');

const AccountsTransactionSchema = mongoose.Schema({
    site: {
        type: String,
        required: false
    }, voucher_type: {
        type: String,
        required: false
    }, voucher_no: {
        type: Number,
        required: false
    }, tdate: {
        type: Date,
        required: false
    }, account_head: {
        type: String,
        required: false
    }, payment_type: {
        type: String,
        required: false
    }, against: {
        type: String,
        required: false
    }, account_name: {
        type: String,
        required: false
    }, debit: {
        type: Number,
        required: false
    }, credit: {
        type: Number,
        required: false
    }, naration: {
        type: String,
        required: false
    }, user: {
        type: String,
        required: false
    }
    
 
});


const AccountsTransaction = module.exports = mongoose.model('AccountsTransaction', AccountsTransactionSchema);