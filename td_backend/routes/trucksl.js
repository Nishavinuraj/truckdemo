var express = require('express');
var router = express.Router();
var async = require('async');
var moment = require('moment');
var momentTZ = require('moment-timezone');
var Itemmasters = require('../models/inventory/items-master');
var Truckledger = require('../models/inventory/truckledger');
var moment = require('moment');


router.get('/ledger', function(req, res, next) {
    var rvopbal = 0;
    var matchCondition = {};
    var rrvopbal, itemType;

    var getMatchCondition = function () {
        var matchCondition = {};

        if(req.query.start_date) {
            matchCondition.avoudt = req.query.start_date;
        }
        
        if(req.query.end_date && req.query.start_date) {
            var startDate = moment(req.query.start_date, 'YYYY-MM-DD').format("YYYY-MM-DD");
            var endDate = moment(req.query.end_date, 'YYYY-MM-DD').format("YYYY-MM-DD");
            matchCondition.avoudt = {
                $gte: startDate,
                $lte: endDate
            };
        }

        if ( req.query.start_date == req.query.end_date ) {
            var startDate = moment(req.query.start_date, 'YYYY-MM-DD').format("YYYY-MM-DD");
            matchCondition.avoudt = startDate;
        } 
        
        if(req.query.site_name){
            matchCondition.site = req.query.site_name;
        } 
        
        if(req.query.truck_no) {
            matchCondition.truckno = req.query.truck_no;
        }

        if(req.query.item_name) {
            matchCondition.itemaccname = req.query.item_name;
        }


        return matchCondition;
    };

    console.log('matchcondition >>>>>>>>>>>>>>', matchCondition);

    // used to calculate balance using previous records before start date if start date is specified
    var calculateOpeningBalanceUsingOldRecords = function (defaultOpeningBalance, defaultItemType, cb) {

        if(req.query.start_date) {
            // var startDate = moment(req.query.start_date, 'YYYY-MM-DD').format("YYYY-MM-DD");
            var matchCond = {avoudt: {$lt: moment(req.query.start_date, 'YYYY-MM-DD').format("YYYY-MM-DD")}};
        }

        if(req.query.site_name){
            matchCond.site = req.query.site_name;
        } 
        
        if(req.query.truck_no) {
            matchCond.truckno = req.query.truck_no;
        }

        if(req.query.item_name) {
            matchCond.itemaccname = req.query.item_name;
        }

        
        console.log("Old Records matchcond  >>>", matchCond);
        console.log("Old Records matchcond  >>>", req.query.item_name);
        console.log("defaultOpeningBalance   >>>", defaultOpeningBalance);
        console.log("DefaultItemType  >>>", defaultItemType);

        Truckledger.find(matchCond).sort({'avoudt': 1}).then(function (trucknoresults) {
            var data = [];
            trucknoresults.forEach(r => {
                defaultOpeningBalance = (Number(r.adebtamt ? r.adebtamt : 0) + defaultOpeningBalance) - Number(r.acrdtamt ? r.acrdtamt : 0);
            });
            var accType;
            if(defaultItemType){
                accType = defaultItemType

            } else {
                accType = defaultOpeningBalance > 0 ? 'Debit' : 'Credit'
            }
            cb(false, {type: accType, opening_balance: defaultOpeningBalance});
        }).catch(function (err) {
            // console.log(err);
            cb(err, false);
        });
    };
    
    var findRecords = function (openingBalance, cb) {
        
        console.log("FindRecords  >>>", openingBalance);

        var closing_balance = openingBalance.opening_balance;
        var matchCond = getMatchCondition();
        
        console.log("FindRecords matchCond >>>", matchCond);

        Truckledger.find(matchCond).sort({'avoudt': 1}).then(function (trucknoresults) {
            var data = [];

            trucknoresults.forEach(r => {
                if (r.site && r.truckno) {
                    var debtqty = r.adebtamt ? r.adebtamt : 0;
                    var crdtqty = r.acrdtamt ? r.acrdtamt : 0;
                    closing_balance = (closing_balance + Number(debtqty)) - Number(crdtqty);
                    var obj = {
                        site: r.site,
                        date: moment(r.avoudt).format('DD/MM/YYYY'),
                        particular: r.arefno,
                        dr: r.adebtamt,
                        cr: r.acrdtamt,
                        closing: Math.abs(closing_balance.toFixed(2))
                    }
                    data.push(obj);
                }
            });
            
            cb(false, {records: data, closing_balance: Math.abs(closing_balance), type: closing_balance > 0 ? 'Debit' : 'Credit'});
        }).catch(function (err) {
            // console.log(err);
            cb(err, false);
        });
    };

    console.log(" Truck NO >>>>>>", req.query.truck_no);

    if(req.query.truck_no) {
        matchCondition.name = req.query.truck_no;
    }
    
    if(req.query.item_name) {
        matchCondition.name = req.query.item_name;
    }
    
    Itemmasters.find(matchCondition).then(results => {
        var vopbal = 0;
        var truckno = '';
        // console.log("results  >>>", results);
        if(results) {


            if(!results[0]) {
                vopbal = 0;
            } else {
                truckno = results[0].truckno;
                console.log(results[0].ocrdr);
                vopbal = 0;
                vopbal = vopbal + Number(results[0].oq ? results[0].oq : 0);
                itemType = "Debit";
            }
            
        } else {
            vopbal = 0;
        }
        rvopbal = vopbal;
        rrvopbal = rvopbal;   // give for send res in opning_balance        
        
        // by defualt no opening balance to define 
        rrvopbal = 0
        rvopbal = 0
        itemType = "Debit"
        
        if(req.query.start_date) {
            calculateOpeningBalanceUsingOldRecords(rvopbal,itemType, function (err, newOpeningBalance) {
                if(err) {
                    return res.status(500).send(err);
                }
                
                console.log("old records Opening Balance from item ledger  >>>", newOpeningBalance);

                findRecords(newOpeningBalance, function (err, results) {
                    if(err) {
                        return res.status(500).send(err);
                    }

                    res.send({                      
                        opening_balance: newOpeningBalance,
                        results: results.records,
                        closing_balance : results.closing_balance,
                        account_type : results.type
                    });
                });
            });
        } else {
            findRecords(vopbal, function (err, results) {
                if(err) {
                    return res.status(500).send(err);
                }

                res.send({
                    opening_balance: {type: rrvopbal && rrvopbal > 0 ? 'Debit' : 'Credit', opening_balance: rrvopbal ? rrvopbal : 0},
                    results: results.records,
                    closing_balance : results.closing_balance,
                    account_type : results.type,
                });
            });
        }

    }).catch(err => {
        // console.log(err);
        res.send("err");
    });


});

module.exports = router;
