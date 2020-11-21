const mongoose = require('mongoose');
const BillingsSchema = mongoose.Schema({
    billno: {
        type: String,
        required: false
    },
    billdate: {
        type: Date,
        default: Date.now,
        required: false
    },
    lrdate: {
        type: Date,
        default: Date.now,
        required: false
    },
    fromdate: {
        type: String,
        required: false
    },
    todate: {
        type: String,
        required: false
    },
    site: {
        type: String,
        required: false
    },
    accountname: {
        type: String,
        required: false
    },
    billname: {
        type: String,
        required: false
    },
    billadr: {
        type: String,
        required: false
    },
    replace: {
        type: String,
        required: false
    },
    with: {
        type: String,
        required: false
    },
    lrno: {
        type: String,
        required: false
    },
    destination: {
        type: String,
        required: false
    },
    packages: {
        type: Number,
        required: false
    },
    weightkg: {
        type: Number,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    tbbamount: {
        type: Number,
        required: false
    },
    load: {
        type: Number,
        required: false
    },
    unload: {
        type: Number,
        required: false
    },
    haltdays: {
        type: Number,
        required: false
    },
    haltamt: {
        type: Number,
        required: false
    },
    remarks: {
        type: Number,
        required: false
    },
    lrrate: {
        type: Number,
        required: false
    },
    st: {
        type: Number,
        required: false
    },
    bill_subtotal:  {
        type: Number,
        required: false
    },
    bill_cgst:  {
        type: Number,
        required: false
    },
    bill_sgst:  {
        type: Number,
        required: false
    },
    bill_igst:  {
        type: Number,
        required: false
    },
    bill_total: {
        type: Number,
        required: false
    }
});
const Billings = module.exports = mongoose.model('Billings', BillingsSchema);