var express = require('express');
var router = express.Router();
var async = require('async');
var moment = require('moment');
var Account = require('../models/accounts');
var Billty = require('../models/billties');
var Sitexpences = require('../models/sitexpences');
var momentTZ = require('moment-timezone');
var Ratelist = require('../models/rates');
var SiteAddress = require('../models/siteaddress');


router.get('/one', function(req, res, next) {
   
    var mainArray = [];

    var findRecords = function(lr_no) {
        return function (callback) {
            Billty.findOne({ lrno: lr_no }, function(err, billty) {
                var total = 0;
                var newtotal = 0;
                var values = {};

                var billty_json = billty.toJSON();
                billty_json.lrdate = moment(billty.lrdate).format("DD/MM/YYYY");
                
                for(var i=0; i<billty.transactiondetails.length; i++ ) {
                    total = Number(total) + billty.transactiondetails[i].amount; 
                }
            
                var okthen = Number(total) + billty.damount;
                if (err) {
                    console.log(err);
                } else {
                    Account.findOne({accountname:billty.consigner},(err, resadd) => {
                    
                        if(billty.vehicletype == "Company"){
                        Sitexpences.findOne({site:billty.site},(err, sitexes) => {
                            if(sitexes) {
                                Ratelist.findOne({site:billty.site, name:billty.consigner},(err, ratelist) => {
                                    for(var i=0;i<sitexes.multidest.length;i++){
                                                                        
                                        if(billty.to == sitexes.multidest[i].destination){
                                            
                                            if(billty.spi == sitexes.multidest[i].spi){
                                                values = sitexes.multidest[i]
                                            }                
                                        }      
                                    }
            
                                    var obj = {
                                        "user": billty.user,
                                        // "pass": pass,
                                        "values": values,
                                        "billty": billty_json,
                                        "resadd": resadd,
                                        "total": total,
                                        "newtotal": newtotal,
                                        "okthen": okthen
                                    };
                                    callback(false, obj);

                                });
                            } else {
                                var obj = {
                                    "user": billty.user,
                                    // "pass": pass,
                                    "values": {},
                                    "billty": billty_json,
                                    "resadd": resadd,
                                    "total": total,
                                    "newtotal": newtotal,
                                    "okthen": okthen
                                };
                                callback(false, obj);
                            }
                        });
                        } else {
                            var obj =  {
                                "user": billty.user,
                                // "pass": pass,
                                "values": {},
                                "billty": billty_json,
                                "resadd": resadd,
                                "total": total,
                                "newtotal": newtotal,
                                "okthen": okthen
                            };
                            callback(false, obj);
                        }
                    });
                    }
            }); 
        }
    };

    var startDate = momentTZ(req.query.start_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD');
    var endDate = momentTZ(req.query.end_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD');
    
    var matchCondition = {
        lrno: { $gte: req.query.from_lrno, $lte: req.query.to_lrno},
        site: req.query.site_name,
        lrdate: { $gte: new Date(startDate), $lte: new Date(endDate)}
    };

    SiteAddress.findOne({ site: req.query.site_name }).then(function(siteResult) {  
        console.log("siteResult >>>>>>", siteResult);

        site_address = "";
        site_phone_numbers = "";

        if (siteResult) {
            site_address = siteResult.address;
            site_phone_numbers =  siteResult.phone_numbers;
        }
        Billty.find(matchCondition).sort({'lrno': 1}).then(function(result) {

            result.forEach( r => {
                lrNo = r.lrno;
                mainArray.push(findRecords(lrNo));
            });
            // res.render('billty_invoice_one.pug'); 

            async.parallel(mainArray, function(err, asyncResult) {
                console.log("ERROR >>> ", err);
                // res.send({ "result": asyncResult }); 

                console.log("asyncResult >>> ", asyncResult);
                if (req.query.flag == 0) {
                    res.render('billty_invoice_one.pug', { "result": asyncResult, "total": asyncResult.length, "site_address": site_address, "site_phone_numbers": site_phone_numbers }); 
                }

                if (req.query.flag == 1) {
                    res.render('billty_invoice_one_with_content.pug', { "result": asyncResult, "total": asyncResult.length, "site_address": site_address, "site_phone_numbers": site_phone_numbers }); 
                }
            });
        }).catch(function(err) {
            res.send(err);
        });
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/two', function(req, res, next) {

    SiteAddress.findOne({ site: req.query.site_name }).then(function(siteResult) {  
        console.log("siteResult >>>>>>", siteResult);

        site_address = "";
        site_phone_numbers = "";

        if (siteResult) {
            site_address = siteResult.address;
            site_phone_numbers =  siteResult.phone_numbers;
        }
 
        Billty.findOne({ lrno: req.query.from_lrno, site: req.query.site_name }, function(err, billty) {
            var total = 0;
            var newtotal = 0;
            var values = {};

            var billty_json = billty.toJSON();
            billty_json.lrdate = moment(billty.lrdate).format("DD/MM/YYYY");
            
            for(var i=0; i<billty.transactiondetails.length; i++ ) {
                total = Number(total) + billty.transactiondetails[i].amount; 
            }
        
            var okthen = Number(total) + billty.damount;
            if (err) {
                console.log(err);
            } else {
                Account.findOne({accountname:billty.consigner},(err, resadd) => {
                
                    if(billty.vehicletype == "Company"){
                    Sitexpences.findOne({site:billty.site},(err, sitexes) => {
                        if(sitexes) {
                            Ratelist.findOne({site:billty.site, name:billty.consigner},(err, ratelist) => {
                                for(var i=0;i<sitexes.multidest.length;i++){
                                                                    
                                    if(billty.to == sitexes.multidest[i].destination){
                                        
                                        if(billty.spi == sitexes.multidest[i].spi){
                                            values = sitexes.multidest[i]
                                        }                
                                    }      
                                }
        
                                if (req.query.flag == 0) {
                                    res.render('billty_invoice_two.pug', {
                                        "user": billty.user,
                                        // "pass": pass,
                                        "values": values,
                                        "billty": billty_json,
                                        "resadd": resadd,
                                        "total": total,
                                        "newtotal": newtotal,
                                        "okthen": okthen
                                    });
                                }

                                if (req.query.flag == 1) {
                                    res.render('billty_invoice_two_with_content.pug', {
                                        "user": billty.user,
                                        // "pass": pass,
                                        "values": values,
                                        "billty": billty_json,
                                        "resadd": resadd,
                                        "total": total,
                                        "newtotal": newtotal,
                                        "okthen": okthen,
                                        "site_address": site_address,
                                        "site_phone_numbers": site_phone_numbers
         
                                    });
                                }
                            });
                        } else {

                            if (req.query.flag == 0) {
                                res.render('billty_invoice_two.pug', {
                                    "user": billty.user,
                                    // "pass": pass,
                                    "values": {},
                                    "billty": billty_json,
                                    "resadd": resadd,
                                    "total": total,
                                    "newtotal": newtotal,
                                    "okthen": okthen,
                                        "site_address": site_address,
                                        "site_phone_numbers": site_phone_numbers
                                });
                            }

                            if (req.query.flag == 1) {
                                res.render('billty_invoice_two_with_content.pug', {
                                    "user": billty.user,
                                    // "pass": pass,
                                    "values": {},
                                    "billty": billty_json,
                                    "resadd": resadd,
                                    "total": total,
                                    "newtotal": newtotal,
                                    "okthen": okthen,
                                    "site_address": site_address,
                                    "site_phone_numbers": site_phone_numbers
                                });
                            }
                        }
                    });
                    } else {

                        if (req.query.flag == 0) {
                            res.render('billty_invoice_two.pug', {
                                "user": billty.user,
                                // "pass": pass,
                                "values": {},
                                "billty": billty_json,
                                "resadd": resadd,
                                "total": total,
                                "newtotal": newtotal,
                                "okthen": okthen
                            });
                        }

                        if (req.query.flag == 1) {
                            res.render('billty_invoice_two_with_content.pug', {
                                "user": billty.user,
                                // "pass": pass,
                                "values": {},
                                "billty": billty_json,
                                "resadd": resadd,
                                "total": total,
                                "newtotal": newtotal,
                                "okthen": okthen,
                                "site_address": site_address,
                                "site_phone_numbers": site_phone_numbers
                            });
                        }
                    }
                });
                }
        });
    });
});


module.exports = router;