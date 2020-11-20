const mongoose = require('mongoose');
let transactiondetailsSchema = mongoose.Schema({
    date: { type: String, required: false },
    accounttype: { type: String, required: false },
    accountname: { type: String, required: false },
    amount: { type: Number, required: false },
    paymenttype: { type: String, required: false },
    paymentmode: { type: String, required: false },
    remark: { type: String, required: false },
    kmreading: { type: String, required: false },
});

const BilltySchema = mongoose.Schema({
    site: {
        type: String,
        required: false
    },
    actualweight: {
        type: Number,
        required: false
    },
    mannualaweight: {
        type: String,
        required: false
    },
    mannual: {
        type: String,
        required: false
    },
    grade: {
        type: String,
        required: false
    },
    tplrno: {
        type: String,
        required: false
    },
    lrno: {
        type: String,
        required: false
    },
    truckno: {
        type: String,
        required: false
    },
    newamount: {
        type: Number,
        required: false
    },
    newrate: {
        type: Number,
        required: false
    },
    newkm: {
        type: String,
        required: false
    },
    newinvoiceno: {
        type: String,
        required: false
    },
    newinvoicedt: {
        type: String,
        required: false
    },
    newgatepass: {
        type: String,
        required: false
    },
    lrdate: {
        type: Date,
        default: Date.now,
        required: false
    },
    from: {
        type: String,
        required: false
    },
    to: {
        type: String,
        required: false
    },
    mannualtodest: {
        type: String,
        required: false
    },

    substation: {
        type: String,
        required: false
    },
    fmno: {
        type: String,
        required: false
    },
    ppaymentmode: {
        type: String,
        required: false
    },
    loadingdate: {
        type: String,
        required: false
    },
    unloadingdate: {
        type: String,
        required: false
    },
    consigner: {
        type: String,
        required: false
    },


    consignne: {
        type: String,
        required: false
    },

    third: {
        type: String,
        required: false
    },

    actualweigt: {
        type: Number,
        required: false
    },
    calculatedweight: {
        type: String,
        required: false
    },
    contains: {
        type: String,
        required: false
    },

    unit: {
        type: String,
        required: false
    },

    rate: {
        type: Number,
        required: false
    },

    tyre: {
        type: String,
        required: false
    },

    spi: {
        type: String,
        required: false
    },

    cweight: {
        type: Number,
        required: false
    },
    vamount: {
        type: Number,
        required: false
    },
    tkmr: {
        type: String,
        required: false
    },
    panno: {
        type: String,
        required: false
    },
    ownername: {
        type: String,
        required: false
    },
    drivername: {
        type: String,
        required: false
    },
    vehicletype: {
        type: String,
        required: false
    },
    diesaldate: {
        type: Date,
        required: false
    },
    dtransactiontype: {
        type: String,
        required: false
    },
    diesalaccountname: {
        type: String,
        required: false
    },
    mannualpetrolpump: {
        type: String,
        required: false
    },
    dqty: {
        type: Number,
        required: false
    },
    mannualdqty: {
        type: String,
        required: false
    },
    drate: {
        type: Number,
        required: false
    },
    damount: {
        type: Number,
        required: false
    },
    unloadingaddress: {
        type: String,
        required: false
    },
    contactperson: {
        type: String,
        required: false
    },
    phoneno: {
        type: String,
        required: false
    },
    poddate: {
        type: String,
        required: false
    },
    podpendings: {
        type: String,
        required: false
    },
    podok: {
        type: String,
        required: false
    },
    podremarks: {
        type: String,
        required: false
    },
    billno: {
        type: Number,
        required: false
    },
    billdate: {
        type: String,
        required: false
    },
    billremarks: {
        type: String,
        required: false
    },
    paymentcharge: {
        type: Number,
        required: false
    },
    finalamount: {
        type: Number,
        required: false
    },
    user: {
        type: String,
        required: false
    },
    key: {
        type: String,
        required: false
    },
    packages: {
        type: String,
        required: false
    },
    newdate: {
        type: String,
        required: false
    },
    tcc: {
        type: String,
        required: false
    },
    truckexpences: {
        type: Number,
        required: false
    },
    mannualroadexp: {
        type: String,
        required: false
    },

    unloadingexpences: {
        type: Number,
        required: false
    },
    unloadingtype: {
        type: String,
        required: false
    },
    actualulexpences: {
        type: Number,
        required: false
    },
    totaltruckexpences: {
        type: Number,
        required: false
    },
    ordernumber: {
        type: String,
        required: false
    },
    brockername: {
        type: String,
        required: false
    },
    currentlocation: {
        type: String,
        required: false
    },
    tripsstatus: {
        type: String,
        required: false
    },
    remark: {
        type: String,
        required: false
    },
    product: {
        type: String,
        required: false
    },
    completed: {
        type: String,
        default: "No",
        required: true
    },
    transactiondetails: [transactiondetailsSchema]
});


const Billty = module.exports = mongoose.model('billties', BilltySchema);