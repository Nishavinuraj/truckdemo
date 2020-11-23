var express = require('express');
var router = express.Router();
var Billing = require('../models/billing');
var Account = require('../models/accounts');
var AccountsLedger = require('../models/accountsledger');
var moment = require('moment');
var async = require('async');

router.get('/account_info', function(req, res, next) {

    var calculateLedger = function(bankData) {
        return function (callback) {
            // logic here
            AccountsLedger.find({accountname: bankData.accountname}).then(function(result) {
                result.forEach(r => {
                    // console.log(r.accountname, " >> Adding >> ", r.adebtamt);
                    // console.log(r.accountname, " >> Removing >> ", r.acrdtamt);
                    bankData.vopbal = bankData.vopbal + Number(r.adebtamt) - Number(r.acrdtamt);
                });
                callback(false, bankData.vopbal);
            }).catch(function(err) {
                // console.log("Error");
                callback(err, null);
            });
        };
    };

	Account.find({category: "Bank Accounts"}).then(function(result) {
        var reqArray = [];
        
        result.forEach(r => {
            // // console.log(r);
            var vopbal = 0;
            if(r.ocrdr === "Debit"){
                vopbal = vopbal + Number(r.opbal);
            } else{
                vopbal = vopbal - Number(r.opbal);
            }
            r.vopbal = vopbal;
            // console.log(r.accountname, " >> ", r.vopbal);
            reqArray.push(calculateLedger(r));
        });
        async.parallel(reqArray, function(err, result) {
            // console.log(result);
            var sum = 0;
            result.forEach(r => {
                sum += r;
            });
            res.send({total_balance: sum});
        });




        // // console.log(bankName);


        // res.send(result);
    }).catch(function(err) {
        // console.log(err);
        res.send(err);
    });
});

router.get('/cash_balance', function(req, res, next) {

    var calculateLedger = function(bankData) {
        return function (callback) {
            // logic here
            AccountsLedger.find({accountname: bankData.accountname}).then(function(result) {
                result.forEach(r => {
                    // console.log(r.accountname, " >> Adding >> ", r.adebtamt);
                    // console.log(r.accountname, " >> Removing >> ", r.acrdtamt);
                    bankData.vopbal = bankData.vopbal + Number(r.adebtamt) - Number(r.acrdtamt);
                });
                callback(false, bankData.vopbal);
            }).catch(function(err) {
                // console.log("Error");
                callback(err, null);
            });
            
        };
    };

	Account.find({category: "Cash-in-hand"}).then(function(result) {
        var reqArray = [];
        // console.log("Result >>>>>",result);
        result.forEach(r => {
            // // console.log(r);
            var vopbal = 0;
            if(r.ocrdr === "Debit"){
                vopbal = vopbal + Number(r.opbal);
            } else{
                vopbal = vopbal - Number(r.opbal);
            }
            r.vopbal = vopbal;
            // // console.log(r.accountname, " >> ", r.vopbal);
            reqArray.push(calculateLedger(r));
        });
        async.parallel(reqArray, function(err, result) {
            // console.log(result);
            var sum = 0;
            result.forEach(r => {
                sum += r;
            });
            res.send({total_balance: sum});
        });




        // // console.log(bankName);


        // res.send(result);
    }).catch(function(err) {
        // console.log(err);
        res.send(err);
    });
});

router.get('/billing', function(req, res, next) {

    var calculateLedger = function(bankData) {
        return function (callback) {
            // logic here
            AccountsLedger.find({accountname: bankData.accountname}).then(function(result) {
                result.forEach(r => {
                    // console.log(r.accountname, " >> Adding >> ", r.adebtamt);
                    // console.log(r.accountname, " >> Removing >> ", r.acrdtamt);
                    bankData.vopbal = bankData.vopbal + Number(r.adebtamt) - Number(r.acrdtamt);
                });
                callback(false, bankData.vopbal);
            }).catch(function(err) {
                // console.log("Error");
                callback(err, null);
            });
            
        };
    };

	Account.find({category: "Sundry Debtors"}).then(function(result) {
        var reqArray = [];
        
        result.forEach(r => {
            // // console.log(r);
            var vopbal = 0;
            if(r.ocrdr === "Debit"){
                vopbal = vopbal + Number(r.opbal);
            } else{
                vopbal = vopbal - Number(r.opbal);
            }

            // // console.log(">>>>>>",vopbal);
            if(!vopbal){
                r.vopbal = 0;
                // console.log("NAN");
            }
            else{
                r.vopbal = vopbal;
                // console.log("vopbal");
            }


            // console.log(r.accountname, " >> ", r.vopbal);
            reqArray.push(calculateLedger(r));
        });
        async.parallel(reqArray, function(err, result) {
            // console.log(result);
            var sum = 0;
            result.forEach(r => {
                sum += r;
            });
            res.send({total_balance: sum});
        });

        // res.send(result);
    }).catch(function(err) {
        // console.log(err);
        res.send(err);
    });
});

router.get('/chart/account_info', function(req, res, next) {
    var todayDate = moment.utc('00:00:00', 'HH:MM:SS').startOf('day');
    var startOfMonth = moment.utc('00:00:00', 'HH:MM:SS').startOf('month');
    var startOfYear = moment.utc('00:00:00', 'HH:MM:SS').startOf('year');
    // console.log("startOfMonth >>>>>>>",startOfMonth);
    // console.log("startOfYear  >>>>>>>",startOfYear);

    var calculateLedger = function(bankData) {
        return function (callback) {
            var matchCondition = {};
            // if(req.query.period == 'today') {
            //     matchCondition.avoudt = todayDate.toDate();
            // } else if(req.query.period == 'month') {
            //     matchCondition.avoudt = {
            //         $gte: startOfMonth.toDate(),
            //         $lte: todayDate.toDate()
            //     };
            // } else if (req.query.period == 'year') {
            //     matchCondition.avoudt =  {
            //         $gte: startOfYear.toDate(),
            //         $lte: todayDate.toDate()
            //     };
            // } else {
            //     matchCondition.avoudt = todayDate.toDate();
            // }
            // logic here
            matchCondition.accountname = bankData.accountname;
            console.log(matchCondition);
            AccountsLedger.find(matchCondition).then(function(result) {
                // console.log("Records >>> ", result);
                result.forEach(r => {
                    console.log(r.accountname, " >> Adding >> ", r.adebtamt);
                    console.log(r.accountname, " >> Removing >> ", r.acrdtamt);
                    bankData.vopbal = bankData.vopbal + Number(r.adebtamt) - Number(r.acrdtamt);
                });
                callback(false, {accountname: bankData.accountname, balance: bankData.vopbal});
            }).catch(function(err) {
                // console.log("Error");
                callback(err, null);
            });
            
        };
    };

	Account.find({category: "Bank Accounts"}).then(function(result) {
        var reqArray = [];
        result.forEach((r, i) => {
            // console.log(r);
            var vopbal = 0;
            if(r.ocrdr === "Debit") {
                vopbal = vopbal + Number(r.opbal);
            } else{
                vopbal = vopbal - Number(r.opbal);
            }
            r.vopbal = vopbal;
            console.log(r.accountname, " >> ", r.vopbal);
            reqArray.push(calculateLedger(r));
        });
        async.parallel(reqArray, function(err, result) {
            // console.log(err);
            res.send(result);
        });




        // // console.log(bankName);


        // res.send(result);
    }).catch(function(err) {
        // console.log(err);
        res.send(err);
    });
});

router.get('/chart/billing', function(req, res, next) {

    var todayDate = moment().format('YYYY-MM-DD') + "T00:00:00Z";
    var startOfMonth = moment().startOf('month').format('YYYY-MM-DD')+ "T00:00:00Z";
    var startOfYear = moment().startOf('year').format('YYYY-MM-DD')+ "T00:00:00Z";
    // console.log("startOfMonth >>>>>>>",startOfMonth);
    // console.log("startOfYear  >>>>>>>",startOfYear);

    var matchCondition = "";
    // if(req.query.period == 'today'){
    //     matchCondition = { lrdate: new Date(todayDate)};
    // } else if(req.query.period == 'month') {
    //     matchCondition = {
    //         lrdate : {"$gte": new Date(startOfMonth),
    //                   "$lte": new Date(todayDate)}
    //       }
    // } else if (req.query.period == 'year') {
    //     matchCondition = {
    //         lrdate : {"$gte": new Date(startOfYear),
    //                   "$lte": new Date(todayDate)}
    //       }
    // } else {
    //     matchCondition = { lrdate: new Date(todayDate)};
    // }

    var calculateLedger = function(bankData) {
        return function (callback) {
            // logic here
            AccountsLedger.find({accountname: bankData.accountname}).then(function(result) {
                result.forEach(r => {
                    // console.log(r.accountname, " >> Adding >> ", r.adebtamt);
                    // console.log(r.accountname, " >> Removing >> ", r.acrdtamt);
                    bankData.vopbal = bankData.vopbal + Number(r.adebtamt) - Number(r.acrdtamt);
                });
                callback(false, {accountname: bankData.accountname, balance: bankData.vopbal});
            }).catch(function(err) {
                // console.log("Error");
                callback(err, null);
            });
            
        };
    };

	Account.find({category: "Sundry Debtors"}).then(function(result) {
        var reqArray = [];
        
        result.forEach(r => {
            // // console.log(r);
            var vopbal = 0;
            if(r.ocrdr === "Debit"){
                vopbal = vopbal + Number(r.opbal);
            } else{
                vopbal = vopbal - Number(r.opbal);
            }
            
            if(!vopbal){
                r.vopbal = 0;
                // console.log("NAN");
            }
            else{
                r.vopbal = vopbal;
                // console.log("vopbal");
            }
            // console.log(r.accountname, " >> ", r.vopbal);
            reqArray.push(calculateLedger(r));
        });
        async.parallel(reqArray, function(err, result) {
            // console.log(err);
            res.send(result);
        });




        // // console.log(bankName);


        // res.send(result);
    }).catch(function(err) {
        // console.log(err);
        res.send(err);
    });
});

router.get('/chart/cash_balance', function(req, res, next) {

    var todayDate = moment().format('YYYY-MM-DD') + "T00:00:00Z";
    var startOfMonth = moment().startOf('month').format('YYYY-MM-DD')+ "T00:00:00Z";
    var startOfYear = moment().startOf('year').format('YYYY-MM-DD')+ "T00:00:00Z";
    // console.log("startOfMonth >>>>>>>",startOfMonth);
    // console.log("startOfYear  >>>>>>>",startOfYear);

    var matchCondition = "";
    // if(req.query.period == 'today'){
    //     matchCondition = { lrdate: new Date(todayDate)};
    // } else if(req.query.period == 'month') {
    //     matchCondition = {
    //         lrdate : {"$gte": new Date(startOfMonth),
    //                   "$lte": new Date(todayDate)}
    //       }
    // } else if (req.query.period == 'year') {
    //     matchCondition = {
    //         lrdate : {"$gte": new Date(startOfYear),
    //                   "$lte": new Date(todayDate)}
    //       }
    // } else {
    //     matchCondition = { lrdate: new Date(todayDate)};
    // }

    var calculateLedger = function(bankData) {
        return function (callback) {
            // logic here
            AccountsLedger.find({accountname: bankData.accountname}).then(function(result) {
                result.forEach(r => {
                    // console.log(r.accountname, " >> Adding >> ", r.adebtamt);
                    // console.log(r.accountname, " >> Removing >> ", r.acrdtamt);
                    bankData.vopbal = bankData.vopbal + Number(r.adebtamt) - Number(r.acrdtamt);
                });
                callback(false, {accountname: bankData.accountname, balance: bankData.vopbal});
            }).catch(function(err) {
                // console.log("Error");
                callback(err, null);
            });
            
        };
    };

	Account.find({category: "Cash-in-hand"}).then(function(result) {
        var reqArray = [];
        
        result.forEach(r => {
            // // console.log(r);
            var vopbal = 0;
            if(r.ocrdr === "Debit"){
                vopbal = vopbal + Number(r.opbal);
            } else{
                vopbal = vopbal - Number(r.opbal);
            }
            r.vopbal = vopbal;
            // console.log(r.accountname, " >> ", r.vopbal);
            reqArray.push(calculateLedger(r));
        });
        async.parallel(reqArray, function(err, result) {
            // console.log(err);
            res.send(result);
        });




        // // console.log(bankName);


        // res.send(result);
    }).catch(function(err) {
        // console.log(err);
        res.send(err);
    });
});


module.exports = router;