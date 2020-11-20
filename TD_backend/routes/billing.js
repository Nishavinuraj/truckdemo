var express = require('express');
var router = express.Router();
var async = require('async');
var moment = require('moment');
var Tires = require('../models/tires');
var Billing = require('../models/billing');
var AccountsLedger = require('../models/accountsledger');
var Billty = require('../models/billties');
var SiteAddress = require('../models/siteaddress');

router.get('/billing_list', function(req, res, next) {
    Billing.aggregate([{
        $group: {
            _id: {site: "$site", accountname: "$accountname", billno: "$billno", billdate: "$billdate"},
            total: { 
                $sum: "$tbbamount" 
            },
            count:{
                $sum: 1
            }            
        }
    },
    { $sort: { billdate: 1 } },]).then(function(result) {
        console.log(result);
        res.send(result);
    }).catch(function(err) {
        res.send(err);
    });
})

router.get('/billing_maxnum', function(req, res, next) {
    var billingNoArray = [];
    Billing.find({site: req.query.site, accountname: req.query.accountname}).then(function(result) {
        result.forEach(r =>{
            if(r.billno){
                r.billno = r.billno;
            }
            else{
                r.billno = 0;
            }
            billingNoArray.push(r.billno);
        });
        var max_of_billno = Math.max.apply(Math, billingNoArray);
        max_of_billno = max_of_billno + 1;
        max_of_billno = max_of_billno ? max_of_billno: 1;
        res.send({max_billno: max_of_billno});
    }).catch(function(err) {
        res.send(err);
    });
})

router.get('/bill_number_data', function(req, res, next) {
    var billingArray = [];
    Billing.find({billno: req.query.bill_no, site: req.query.site_name, accountname: req.query.account_name}).sort({ lrdate: 1 }).then(function(result) {  
        result.forEach(r =>{
            if(r.load){
                r.load = r.load;
            }
            else{
                r.load = 0;
            }

            if(r.unload){
                r.unload = r.unload;
            }
            else{
                r.unload = 0;
            }

            if(r.haltamt){
                r.haltamt = r.haltamt;
            }
            else{
                r.haltamt = 0;
            }

            var billamt = Number(r.tbbamount) + Number(r.load) + Number(r.unload) + Number(r.haltamt);
            if(billamt){
                billamt = billamt;
            }
            else{
                billamt = 0;
            }
            
            obj = {
                bill_no: r.billno,
                lr_no : r.lrno,
                lr_date : r.lrdate,
                bill_date : r.billdate,
                destination : r.destination,
                pkgs : r.packages,
                wt_kgs : r.weightkg,
                description : r.description,
                tbb_amount : r.tbbamount,
                lchrg : r.load,
                ulchrg : r.unload,
                hdays : r.haltdays,
                hamt : r.haltamt,
                bill_amt : billamt,
                cgst: r.bill_cgst,
                sgst: r.bill_sgst,
                igst: r.bill_igst,
            };
            billingArray.push(obj);
        });
        res.send(billingArray);
    }).catch(function(err) {
        res.send(err);
    });
})

router.post('/insert_bill', function(req, res, next) {

    // var d = new Billing(req.body);

    // d.save(function (err, save) {
    //     console.log("err  >>>",err);
    //     console.log("save  >>>",save);
    //     res.send({"message": "Added..!"}); 
    // });

    Billing.insertMany(req.body).then((result) => {
        res.send({"message": "Added..!"}); 
    }).catch((err) => {
        res.send({"message": err}); 
    });
})

router.delete('/bill_delete', function(req, res, next) {
    var billData = [];
    var totalBill = 0;
    Billing.find({ billno: req.query.bill_no,  lrno: req.query.lr_no}).then(function(result) {
        console.log(result); 
        result.forEach( r => {
            totalBill = Number(r.tbbamount) + Number(r.load) + Number(r.unload) + Number(r.haltamt);

            if(r.bill_cgst){
                var cgst = (Number(r.bill_cgst) * totalBill) / 100;
                totalBill = totalBill + cgst;
            }
            if(r.bill_sgst){
                var sgst = (Number(r.bill_sgst) * totalBill) / 100;
                totalBill = totalBill + sgst;
            }
            if(r.bill_igst){
                var igst = (Number(r.bill_igst) * totalBill) / 100;
                totalBill = totalBill + igst;
            }
            
        });

        billData.push(result);
        console.log("totalBillAmt >>>>>",totalBill); 

        
        Billing.deleteOne({ billno: req.query.bill_no,  lrno: req.query.lr_no}).then(function(Result) {
            
            Billing.find({ billno: req.query.bill_no,  lrno: req.query.lr_no}).then(function(addResult) {

                addResult.forEach( rr => {
                    if(r.bill_total){                        
                        totalBill = Number(totalBill) - Number(r.bill_total);
                    }                    
                });

                Billing.update({ billno: req.query.bill_no,  lrno: req.query.lr_no}, {bill_total: totalBill}, function(err, raw) {
                    if (err) {
                      res.send(err);
                    } else {
                        res.send({"message": 'deleted..!'});
                    }
                  });
            
            }).catch(function(err) {
                res.send(err);
            });

        }).catch(function(err) {
            res.send(err);
        });
    }).catch(function(err) {
        res.send(err);
    });

    
})

router.put('/update_bill', function(req, res, next) {
    try {
        Billing.updateOne(
            { 
                billno: req.query.billno,  
                lrno: req.query.lrno
            }, {
                load: req.body.load,
                unload: req.body.unload,
                haltdays: req.body.haltdays,
                haltamt: req.body.haltamt,
                
            }).then(function (result) {
                res.send({"result": "Updated...!"});
        }).catch(function(err) {
            console.log("err >>>>>", err);
            res.send(err);
        });
     } catch (e) {
        res.send(err);
     }
})

router.delete('/bill_delete_by_bill_no', function(req, res, next) {
    Billing.deleteMany({ billno: req.query.bill_no, site: req.query.site, accountname: req.query.accountname}).then(function(Result) {
        res.send({"message": 'deleted..!'});
    }).catch(function(err) {
        res.send(err);
    });
})

router.delete('/delete_principle_billing_posting', function(req, res, next) {

    AccountsLedger.deleteMany({ "avouno" : req.query.bill_no, "adoctp" : "pbill", "branch": req.query.branch }).then(function(Result) {
        res.send({"message": 'deleted..!'});
    }).catch(function(err) {
        res.send(err);
    });
     
});

router.get('/manikgarh_report_bill', function(req, res, next) {
    var billingArray = [];

    var findRecords = function(billData) {
        return function (callback) {
            Billty.findOne({ lrno: billData.lrno, site: billData.site }, function(err, billty) {

                var newinvoiceDT =  '--';

                if(billty.newinvoicedt){
                    newinvoiceDT = moment(billty.newinvoicedt).format("DD.MM.YYYY");
                }

                var obj = {
                    "srno": billData.srno,
                    "lrno": billData.lrno,
                    "site": billData.site,
                    "amount": billData.amount ? billData.amount: 0.00,
                    "vehicle_no": billty.truckno ? billty.truckno: '--',
                    "delivery_challan": billty.newgatepass ? billty.newgatepass: '--',
                    "invoice_no": billty.newinvoiceno ? billty.newinvoiceno: '--',
                    "invoice_date": newinvoiceDT,
                    "destination": billty.to ? billty.to: '--',
                    "weight": billty.actualweight.toFixed(2) ? billty.actualweight.toFixed(2): 0.00,
                    "rate": billty.newrate ? billty.newrate: 0,
                };
                callback(false, obj);
            }); 
        }
    };


    // SiteAddress.findOne({ site: req.query.site_name }).then(function(siteResult) {  

    //     site_address = "";
    //     site_phone_numbers = "";

    //     if (siteResult) {
    //         site_address = siteResult.address;
    //         site_phone_numbers =  siteResult.phone_numbers;
    //     }

        // console.log("siteResult >>>", siteResult);

        Billing.find({billno: req.query.bill_no, site: req.query.site_name, accountname: req.query.account_name}).then(function(result) {  
            // console.log("result >>>", result);  
            i = 1
            sgst = 0;
            cgst = 0;

            var bill_date = "";

            result.forEach(r =>{
                // var billamt = Number(r.tbbamount) + Number(r.load) + Number(r.unload) + Number(r.haltamt);          
                
                obj = {
                    srno: i,
                    lrno: r.lrno,
                    site: r.site,
                    amount: r.tbbamount
                };
                billingArray.push(findRecords(obj));
                i = i+1;

                sgst = r.bill_sgst;
                cgst = r.bill_cgst;
                bill_date = r.billdate;
            });

            if(bill_date) {
                bill_date = moment(bill_date).format("DD.MM.YYYY");
            } else {
                bill_date = moment().format("DD.MM.YYYY");
            }

            async.parallel(billingArray, function(err, asyncResult) {
                console.log("err >>>", err);
                var totalWeight = 0;
                var totalAmount = 0;
                var todayDate = moment().format("DD.MM.YYYY");
                asyncResult.forEach(element => {
                    totalWeight = Number(totalWeight) + Number(element.weight);
                    totalAmount = Number(totalAmount) + Number(element.amount);
                    element.amount = element.amount.toFixed(2);
                });

                sgstTotal = (totalAmount * sgst) / 100;
                cgstTotal = (totalAmount * cgst) / 100;

                mainTotal = totalAmount + sgstTotal + cgstTotal;
                invoiceNo = req.query.invoice_no;

                res.render('manikgarh_report_bill.pug', 
                { 
                    "result": asyncResult, 
                    "total": asyncResult.length, 
                    "totalWeight": totalWeight.toFixed(2), 
                    "totalAmount": totalAmount.toFixed(2),
                    "mainTotal": mainTotal.toFixed(2),
                    "sgst": sgst, 
                    "cgst": cgst, 
                    "sgstTotal": sgstTotal.toFixed(2), 
                    "cgstTotal": cgstTotal.toFixed(2), 
                    "billDate": bill_date,
                    "invoiceNo": invoiceNo,
                    // "site_address": site_address,
                    // "site_phone_numbers": site_phone_numbers

                }); 
            });
        }).catch(function(err) {
            console.log("err >>>", err);
            res.send(err);
        });
    // }).catch(function(err) {
    //     res.send(err);
    // });
})

router.get('/utcl_report_bill', function(req, res, next) {
    var billingArray = [];

    var findRecords = function(billData) {
        return function (callback) {
            Billty.findOne({ lrno: billData.lrno, site: billData.site }, function(err, billty) {

                var lrDate =  '--';

                if(billty.lrdate){
                    lrDate = moment(billty.lrdate).format("DD.MM.YYYY");
                }

                var obj = {
                    "srno": billData.srno,
                    "bill_no": billty.newinvoiceno ? billty.newinvoiceno: '--',
                    "lrno": billData.lrno,
                    "lrdate": lrDate,
                    "consignne": billty.consignne,
                    "destination": billty.to ? billty.to: '--',
                    "truckno": billty.truckno ? billty.truckno: '--',
                    "qty": billty.actualweight ? billty.actualweight: 0.00,
                    "rate": billty.newrate ? billty.newrate: 0,
                    "amount": billData.amount ? billData.amount: 0.00,
                    // "delivery_challan": billty.newgatepass ? billty.newgatepass: '--',
                };
                callback(false, obj);
            }); 
        }
    };


    SiteAddress.findOne({ site: req.query.site_name }).then(function(siteResult) {  
        console.log("siteResult >>>>>>", siteResult);

        site_address = "";
        site_phone_numbers = "";

        if (siteResult) {
            site_address = siteResult.address;
            site_phone_numbers =  siteResult.phone_numbers;
        }

        Billing.find({billno: req.query.bill_no, site: req.query.site_name, accountname: req.query.account_name}).then(function(result) {  
            console.log("Here >>>>>>", siteResult);
            i = 1
            sgst = 0;
            cgst = 0;
            var bill_date = "";

            result.forEach(a =>{ 
                bill_date = a.billdate;

                if(bill_date) {
                    if("If >>>", bill_date);
                    bill_date = moment(bill_date).format("DD.MM.YYYY");
                } else {
                    if("Else >>>", bill_date);
                    bill_date = moment().format("DD.MM.YYYY");
                }
            });

            result.forEach(r =>{
                // var billamt = Number(r.tbbamount) + Number(r.load) + Number(r.unload) + Number(r.haltamt);          
                
                obj = {
                    srno: i,
                    lrno: r.lrno,
                    site: r.site,
                    amount: r.tbbamount
                };
                

                billingArray.push(findRecords(obj));
                i = i+1;

                sgst = r.bill_sgst;
                cgst = r.bill_cgst;


                
            });

            async.parallel(billingArray, function(err, asyncResult) {
                var totalQTY = 0;
                var totalAmount = 0;
                
                asyncResult.forEach(element => {
                    totalQTY = Number(totalQTY) + Number(element.qty);
                    totalAmount = Number(totalAmount) + Number(element.amount);
                    element.amount = element.amount.toFixed(2);
                });

                sgstTotal = (totalAmount * sgst) / 100;
                cgstTotal = (totalAmount * cgst) / 100;

                mainTotal = totalAmount + sgstTotal + cgstTotal;
                invoiceNo = req.query.invoice_no;

                res.render('utcl_report_bill.pug', 
                { 
                    "result": asyncResult, 
                    "total": asyncResult.length, 
                    "totalQTY": totalQTY.toFixed(2), 
                    "totalAmount": totalAmount.toFixed(2),
                    "mainTotal": mainTotal.toFixed(2),
                    "sgst": sgst, 
                    "cgst": cgst, 
                    "sgstTotal": sgstTotal.toFixed(2), 
                    "cgstTotal": cgstTotal.toFixed(2), 
                    "billDate": bill_date,
                    "invoiceNo": invoiceNo,
                    "site_address": site_address,
                    "site_phone_numbers": site_phone_numbers
                }); 
            });
        }).catch(function(err) {
            res.send(err);
        });
    }).catch(function(err) {
        console.log("err >>>", err);
        res.send(err);
    });
})

router.get('/acc_report_bill', function(req, res, next) {
    var billingArray = [];

    var findRecords = function(billData) {
        return function (callback) {
            Billty.findOne({ lrno: billData.lrno, site: billData.site }, function(err, billty) {

                var lrDate =  '--';

                if(billty.lrdate){
                    lrDate = moment(billty.lrdate).format("DD.MM.YYYY");
                }

                var newinvoiceDT =  '--';

                if(billty.newinvoicedt){
                    newinvoiceDT = moment(billty.newinvoicedt).format("DD.MM.YYYY");
                }

                qty_fix = billty.actualweight ? billty.actualweight: 0;

                var obj = {
                    "srno": billData.srno,
                    "customer_no": "",
                    "customer_name": billty.consignne,
                    "do_no": billty.newinvoiceno ? billty.newinvoiceno: '--',
                    "do_date": newinvoiceDT,
                    "truckno": billty.truckno ? billty.truckno: '--',
                    "grade": billData.grade,
                    "destination": billty.to ? billty.to: '--',
                    "qty": Number(qty_fix).toFixed(2),
                    "rate": billty.rate ? billty.rate: 0,
                    "amount": billData.amount ? billData.amount: 0.00,
                    
                    "lrno": billData.lrno,
                    // "delivery_challan": billty.newgatepass ? billty.newgatepass: '--',
                };
                callback(false, obj);
            }); 
        }
    };


    SiteAddress.findOne({ site: req.query.site_name }).then(function(siteResult) {  
        console.log("siteResult >>>>>>", siteResult);

        site_address = "";
        site_phone_numbers = "";

        if (siteResult) {
            site_address = siteResult.address;
            site_phone_numbers =  siteResult.phone_numbers;
        }

        Billing.find({billno: req.query.bill_no, site: req.query.site_name, accountname: req.query.account_name}).then(function(result) {  
            console.log("Here >>>>>>", siteResult);
            i = 1
            sgst = 0;
            cgst = 0;
            var bill_date = "";

            var gradeList = [];
            result.forEach(r =>{
                // var billamt = Number(r.tbbamount) + Number(r.load) + Number(r.unload) + Number(r.haltamt);          
                
                obj = {
                    srno: i,
                    lrno: r.lrno,
                    site: r.site,
                    amount: r.tbbamount,
                    grade: r.description
                };

                gradeList.push(r.description);
                billingArray.push(findRecords(obj));
                i = i+1;

                sgst = r.bill_sgst;
                cgst = r.bill_cgst;

                bill_date = r.billdate;
            });


            if(bill_date) {
                bill_date = moment(bill_date).format("DD.MM.YYYY");
            } else {
                bill_date = moment().format("DD.MM.YYYY");
            }


            async.parallel(billingArray, function(err, asyncResult) {
                


                // --------------  First Page
                var firstResult = [];

                uniqueArray = gradeList.filter(function(elem, pos) {
                    return gradeList.indexOf(elem) == pos;
                })
                // console.log("gradeList >>>", uniqueArray);

                var s = 1;
                uniqueArray.forEach(ua => {
                    var fTotalQTY = 0;
                    var fTotalAmount = 0;
                    asyncResult.forEach(ar => {
                        if(ua == ar.grade){
                            fTotalQTY = Number(fTotalQTY) + Number(ar.qty);
                            fTotalAmount = Number(fTotalAmount) + Number(ar.amount);
                        }
                    });

                    var first_obj = {
                        "srno": s,
                        "grade": ua,
                        "qty": fTotalQTY.toFixed(2),
                        "amount": fTotalAmount.toFixed(2)
                    };
                    firstResult.push(first_obj);
                    s = s + 1;
                });

                console.log("firstResult >>>", firstResult);



                // --------------  Second Page
                var totalQTY = 0;
                var totalAmount = 0;
                var todayDate = moment().format("DD.MM.YYYY");
                asyncResult.forEach(element => {
                    totalQTY = Number(totalQTY) + Number(element.qty);
                    totalAmount = Number(totalAmount) + Number(element.amount);
                    element.amount = Number(element.amount).toFixed(2);
                });

                sgstTotal = (totalAmount * sgst) / 100;
                cgstTotal = (totalAmount * cgst) / 100;

                mainTotal = totalAmount + sgstTotal + cgstTotal;
                invoiceNo = req.query.invoice_no;

                res.render('acc_report_bill.pug', 
                { 
                    "first_page": firstResult,
                    "result": asyncResult, 
                    "total": asyncResult.length, 
                    "sub_total": firstResult.length,
                    "totalQTY": totalQTY.toFixed(2), 
                    "totalAmount": totalAmount.toFixed(2),
                    "mainTotal": mainTotal.toFixed(2),
                    "sgst": sgst, 
                    "cgst": cgst, 
                    "sgstTotal": sgstTotal.toFixed(2), 
                    "cgstTotal": cgstTotal.toFixed(2), 
                    "billDate": bill_date,
                    "invoiceNo": invoiceNo,
                    "site_address": site_address,
                    "site_phone_numbers": site_phone_numbers
                }); 
            });
        }).catch(function(err) {
            res.send(err);
        });
    }).catch(function(err) {
        res.send(err);
    });
})


module.exports = router;