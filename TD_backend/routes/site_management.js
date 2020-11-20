var express = require('express');
var router = express.Router();
var async = require('async');
var moment = require('moment');

var Billty = require('../models/billties');
var Billing = require('../models/billing');
var Tires = require('../models/tires');
var Trucks = require('../models/trucks');
var TruckDivert = require('../models/truckdivert');
var FT = require('../models/fleetstarget');

var moment = require('moment');

router.get('/principal_billing', function(req, res, next) {
    var page, limit, offset,
        reqArray, data, truckNoArray, tanameArray;
    var BulltyLrnoArray = []; 
    var BullingLrnoArray = [];

    matchCondition = {};

    // page = req.query.page ? req.query.page : 1;
    // limit = req.query.limit ? req.query.limit: 50;
    // offset = (page - 1) * limit;
    
    data = [];
    
    var countTotal = function (matchCondition, cb) {
        console.log("matchCondition >>>", matchCondition);
        Billty.find(matchCondition).count().then(function(totalCount) {
            cb(false, totalCount);
        }).catch(function(err) {
            cb(err);
        });
    };

    var fetchData = function (matchCondition, cb) {
        Billty.find(matchCondition).select('lrno lrdate to packages actualweight contains newamount consigner').sort({ lrdate: 1 }).then(function(result) {
            result.forEach( r => {                        
                BulltyLrnoArray.push(r.lrno);
            });

            console.log("Billty  >>>>",BulltyLrnoArray);
            cb(false, result);
        }).catch(function(err) {
            cb(err);
        });

        
    };

    // Match Condition For year
    if(req.query.site) {
        matchCondition.site = req.query.site;
    }
    // Match Condition For Tyre
    if(req.query.bill_date) {
        matchCondition.billdate = req.query.bill_date;
    }

    // Match Condition For Tyre
    if(req.query.bill_no) {
        // matchCondition.billno = req.query.bill_no;
    }

    //match Condition For TruckNo
    if(req.query.consigner) {
        matchCondition.consigner = req.query.consigner;
    }

    if(req.query.start_date) {
        matchCondition.lrdate = req.query.start_date;
    }

    if(req.query.end_date && req.query.start_date) {
        matchCondition.lrdate = {
            $gte: req.query.start_date,
            $lte: moment(req.query.end_date, "YYYY-MM-DD").add('days', 1)
        };
    }


    Billing.find({}).sort({ lrdate: -1 }).then(function(billingResult) {

        billingResult.forEach( rr => {                 
            BullingLrnoArray.push(rr.lrno);
        });

        matchCondition.lrno = { $nin: BullingLrnoArray };

        countTotal(matchCondition, function (err, totalResult) {
            if(err) {
                console.log(err);
                return res.status(500).send(err);
            }

            fetchData(matchCondition, function (err, result) {
                if(err) {console.log(err);
                    return res.status(500).send(err);
                }
                result.total = totalResult;
                res.send(result);
            });
        });
        
    }).catch(function(err) {
        console.log('Error')
    });
    

    
    

});

router.get('/ownfleet_truck_report/:truck_no', function(req, res, next) {

    var getFleetTarget = function () {
        return function (cb) {
            FT.findOne({truckno: req.params.truck_no}).then(function (results) { 
                cb(false, results);
            }).catch(function (err) {
                console.log(err);
                cb(err, false);
            });
        };
    };

    var getBilltyData = function () {
        return function (cb) {
            Billty.aggregate([
                {
                    $match: {truckno: req.params.truck_no}
                },
                {
                      $project: {
                        lrdate: {$month: "$lrdate"},
                        finalamount: 1,
                        damount: 1,
                        newamount: 1
                    }
                },
                {
                    $group: {
                        _id: "$lrdate",
                        finalamount: {
                          $sum: "$finalamount"
                        },
                        damount: {
                          $sum: "$damount"
                        },
                        newamount: {
                          $sum: "$newamount"
                        },
                        trips: {
                            $sum: 1
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        month: "$_id",
                        trips: "$trips",
                        finalamount: "$finalamount",
                        damount: "$damount",
                        newamount: "$newamount"
                    }
                }
            ]).then(function (results) { 
                cb(false, results);
            }).catch(function (err) {
                console.log(err);
                cb(err, false);
            });
        };
    };

    var getEdexData = function () {

    };

    var getTruckDivertData = function () {
        return function (cb) {
            TruckDivert.aggregate([
                {
                    $match: {truckno: req.params.truck_no}
                },
                {
                      $project: {
                        tddate: {$month: "$tddate"},
                        tamt: 1
                    }
                },
                {
                    $group: {
                        _id: "$tddate",
                        tamt: {
                          $sum: "$tamt"
                        }
                    }
                },
                {
                    $project: {
                          _id: 0,
                        month: "$_id",
                        tamt: "$tamt"
                    }
                }
            ]).then(function (results) {
                cb(false, results);
            }).catch(function (err) {
                console.log(err);
                cb(err, false);
            });
        };
    };

    async.parallel([
        getFleetTarget(),
        getBilltyData(),
        getTruckDivertData()
    ], (err, results) => {
        
        var finalData = [], fleet_target_data = results[0].toJSON(), billty_data = [], truck_divert_data = [];

        fleet_target_data.months.forEach(m => {
            var month_number = Number(moment(m.name, 'MMMM').format('M'));

            // add trip, achieved, income and some expenses from billty data
            results[1].forEach(r => {
                if(r.month === month_number) {
                    m.trips = r.trips;
                    m.achieved = Number(r.finalamount.toFixed(2));
                    m.income = m.achieved;
                    m.expenses = Number(r.damount.toFixed(2)) + Number(r.newamount.toFixed(2));
                }
            });

            results[2].forEach(r => {
                if(r.month === month_number) {
                    m.expenses = m.expenses + Number(r.tamt.toFixed(2));
                }
            });

            var profit = m.income - m.expenses;
            m.profit = Number(profit.toFixed(2));
        });

        res.send(fleet_target_data);
    });
});

module.exports = router;