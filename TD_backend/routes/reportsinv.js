var express = require('express');
var router = express.Router();
var async = require('async');
var moment = require('moment');
var momentTZ = require('moment-timezone');
var Itemmaster = require('../models/inventory/items-master')
var Itemledger = require('../models/inventory/itemledger')
var Scrapledger = require('../models/inventory/scrapledger')
var moment = require('moment');
var Materialrs = require('../models/inventory/material-receipt');
var TruckTyreMasters = require('../models/tyre-management/tyre-master');
var Trucktyrepositionmaster = require('../models/tyre-management/trucktyrepositionmaster')
var Trucks = require('../models/trucks');
var Truckinspections = require('../models/tyre-management/truck-inspection');

// mainArray.push(obj);

router.get('/site_balance_stock', function(req, res, next) {
    var accountsArray = [];
    var mainArray = [];
   
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
        
        // if(req.query.item_name) {
        //     matchCondition.name = req.query.item_name;
        // }

        return matchCondition;
    };

    // used to calculate balance using previous records before start date if start date is specified
    var calculateOpeningBalanceUsingOldRecords = function (defaultOpeningBalance, defaultItemType, defaultAccount, cb) {
        // var matchCond = {avoudt: {$lt: new Date(req.query.start_date)}};
        var matchCond = {avoudt: {$lt: moment(req.query.start_date, 'YYYY-MM-DD').format("YYYY-MM-DD")}};

        if(req.query.site_name){
            matchCond.site = req.query.site_name;
        } 
        
        if(defaultAccount) {
            matchCond.itemname = defaultAccount;
        }

       

        Itemledger.find(matchCond).sort({'avoudt': 1}).then(function (nameresults) {
            var data = [];
            nameresults.forEach(r => {
                defaultOpeningBalance = (Number(r.dqty ? r.dqty : 0) + defaultOpeningBalance) - Number(r.cqty ? r.cqty : 0);
            });
            var accType;
            if(defaultItemType){
                accType = defaultItemType

            } else {
                accType = defaultOpeningBalance > 0 ? 'Debit' : 'Credit'
            }
            cb(false, {type: accType, opening_balance: defaultOpeningBalance});
        }).catch(function (err) {
            console.log(err);
            cb(err, false);
        });
    };

    var findRecords = function (openingBalance, dataAccount, cb) {
        var closing_balance = openingBalance.opening_balance;
        var matchCond = getMatchCondition();
        
        if(dataAccount) {
            matchCond.itemname = dataAccount;
        }
        if(req.query.site_name) {
            matchCond.site = req.query.site_name;
        }
        Itemledger.find(matchCond).sort({'avoudt': 1}).then(function (nameresults) {
            var data = [];
            nameresults.forEach(r => {
                if (r.itemname) {
                    var dqty = r.dqty ? r.dqty : 0;
                    var cqty = r.cqty ? r.cqty : 0;
                    // console.log(r.adebtamt, r.crdtamt, closing_balance);
                    closing_balance = (closing_balance + Number(dqty)) - Number(cqty);
                    // console.log("closing >>>", r.avoudt);
                    var obj = {
                        site: r.site,
                        itemname: r.itemname,
                        date: moment(r.avoudt).format('DD/MM/YYYY'),
                        // particular: r.arefno,
                        dr: r.dqty,
                        cr: r.cqty,
                        closing: closing_balance.toFixed(2)
                    }
                    data.push(obj);
                }
            });
            cb(false, data);
            // cb(false, {records: data, closing_balance: Math.abs(closing_balance.toFixed(2)), type: closing_balance > 0 ? 'Credit' : 'Debit'});
        }).catch(function (err) {
            console.log(err.stack);
            cb(err, false);
        });
    };

    var calculateLedger = function(nameData) {
        return function (callback) {
            
            Itemmaster.findOne({"name": nameData}).then(r => {
                var vopbal = 0;
                var name = nameData;
                if(r) {
                    name = name;
                    console.log(r.name);
                    vopbal = 0;
                    vopbal = vopbal + Number(r.oq ? r.oq : 0);
                    itemType = "Debit";
                    
                } else {
                    vopbal = 0;
                }
                rvopbal = vopbal;
                rrvopbal = rvopbal;

                if(req.query.start_date) {
                    calculateOpeningBalanceUsingOldRecords(rvopbal, itemType, name, function (err, newOpeningBalance) {
                        if(err) {
                            return res.status(500).send(err);
                        }
                        findRecords(newOpeningBalance, name, function (err, results) {
                            if(err) {
                                return res.status(500).send(err);
                            }

                            var closingBalance;
                            if(results && results.length > 0) {
                                closingBalance = Number(results[results.length - 1].closing)
                            } else {
                                closingBalance = 0;
                            }
                            let stcData = {
                                item_name: name,
                                // dr: closingBalance < 0 ? closingBalance : 0,
                                // dr: closingBalance > 0 ? closingBalance : 0,
                                dr: closingBalance ? closingBalance : 0,
                                site_name: results.length > 0  ? results[0].site : '',
                            }
                            callback(false, stcData);
                        });
                    });
                } else {
                    findRecords(vopbal, name, function (err, results) {
                        if(err) {
                            return res.status(500).send(err);
                        }

                        var closingBalance;
                        if(results && results.length > 0) {
                            closingBalance = results && results.length > 0 ? Number(results[results.length - 1].closing) : 0;
                        } else {
                            closingBalance = 0;
                        }
                        let stcData = {
                            item_name: name,
                            dr: closingBalance ? closingBalance : 0,
                            site_name: results.length > 0  ? results[0].site : '',
                        }
                        callback(false, stcData);
                    });
                }
            }).catch(err => {
                console.log(err.stack);
                callback(err, null);
            });
        };
    };


    if(req.query.item_name) {
        matchCondition.name = req.query.item_name;
    }

    Itemmaster.find(matchCondition).then(function(resultData) {
        
        var nameArray = [];
        resultData.forEach(a => {
            nameArray.push(a.name);
        });
        // console.log("resultData >>>>>>>>>>>", nameArray);

        var matchConditionItem = {
            "itemname": { $in:  nameArray }
        };


        if (req.query.site_name) {
            matchConditionItem.site = req.query.site_name;
        }

        console.log("resultData 1 >>>>>>>>>>>", matchConditionItem);
        
        Itemledger.find(matchConditionItem).distinct('itemname').then(function(result) {
            var resultsArray = [];
            result.forEach(a => {
                var stcData = calculateLedger(a)
                resultsArray.push(stcData);
            });
            async.parallel(resultsArray, function(err, asyncResult) {
                console.log("ERROR >>> ", err);
                var retValues = [];
                asyncResult.forEach(result=>{
                    // if(!(result.cr==0 && result.dr==0)){
                    //     retValues.push(result);
                    // } 
                    if(!(result.dr==0)){
                        retValues.push(result);
                    } 

                })
                res.send({ "result": retValues });  
            });
        }).catch(function(err) {
            console.log(err.stack);
            res.send(err);
        });

    }).catch(function(err) {
        res.send(err);
    });
    
});

router.get('/mileage_report', function(req, res, next) {


    var calculateOther = function(data) {
        var matchCond = {};
        if(req.query.truck_no){
            matchCond['vehicle_no'] = req.query.truck_no;
        }
    
        if(data.tp){
            matchCond['tyreposition'] = data.tp;
        }
        return function (callback) {
            TruckTyreMasters.find(matchCond).then((fromResults) => {
                // console.log(" Tyre Master data  >>>>", fromResults);
                var coname = '';
                var brand = ''
                var tyretype = ''
                var fitment_km = ''
                var price = ''

                fromResults.forEach( r => {
                    coname = r.company_name;
                    brand = r.brand;
                    tyretype = r.tyre_type;
                    fitment_km = r.fitment_km;
                    price = r.price;
                });

                // per mm wearing =  (dc / used nsd)
                // user perc = 100/nsd * used nsd
                // cost per mm = (price / nsd) / per mm wearing
                // estimate projection  = nsd * per mm wearing

                data.coname = coname;
                data.brand = brand;
                data.tyretype = tyretype;
                data.fitment_km = fitment_km;
                data.dc = data.runkm - data.fitment_km;
                data.price = price;

                data.usedperc = ((100/data.nsd) * data.usednsd).toFixed(2);
                data.pmmw = (data.dc / data.usednsd).toFixed(2);
                data.cpkm = ((data.price / data.nsd) / data.pmmw).toFixed(2);
                data.ep = (data.nsd * data.pmmw).toFixed(2);

                callback(false, data);
                }).catch(err => {
                console.log(err.stack);
                callback(err, null);
            });
        };
    };

    matchCondition = {};
    if (req.query.truck_no) {
        matchCondition.truck_no = {
            $eq: req.query.truck_no
        };
    }

    Truckinspections.find(matchCondition).then(function(result) {
        Truckinspections.findOne(matchCondition).sort({idate:-1}).limit(1).then(function(result) {
            var runkm = Number(result.km_reading);
            var mainArray = [];
            result.inspections.forEach(r => {
                var obj = {
                    "pno": parseInt(r.pno),
                    "tp": r.positionname,
                    "tyreno": r.tyre_no,
                    "nsd": r.nsd,
                    "rtd": r.rtd,
                    "usednsd": (r.nsd - r.rtd).toFixed(2),
                    "runkm": runkm,
                    "dc": 0,
                    "pmmw":0,
                    "usedperc":0,
                    "cpkm":0,
                    "ep":0
                };
                mainArray.push(calculateOther(obj));
            });
            async.parallel(mainArray, function(err, asyncResult) {
                res.send({ "result": asyncResult });  
            });
        }).catch(function(err) {
            res.send(err);
        });




    }).catch(function(err) {
        res.send(err);
    });
})


router.get('/dealer_wise_purchase', function(req, res, next) {
    var matchCondition = {};


    if (req.query.vendor) {
        var vendorName = req.query.vendor ;
        matchCondition = { "vendor": new RegExp('^' + vendorName, 'i') };
    }
    if (req.query.item_name) {
        var itemName = req.query.item_name ;
        itemName = itemName.replace('(', '\\(');
        itemName = itemName.replace(')', '\\)');
        matchCondition = { 'materialr_items.name': new RegExp('^' + itemName, 'i') };
    }

    console.log('matchcondition >>>>', matchCondition);

    Materialrs.find(matchCondition).then(function(result) {
        var listArray = [];
        result.forEach(r => {
            // console.log(r);
            multidest = r.materialr_items;
            multidest.forEach(i => {
                obj = {
                    "mr_date": r.mr_date,
                    "vendor": r.vendor,
                    "name": i.name,
                    "qty": i.qty,
                    "price": i.price,
                    "amount": (i.qty * i.price ).toFixed(2)
                }
                listArray.push(obj);
            });            
        });

        console.log('listArray >>>>', listArray);

        res.send({"result": listArray});


    }).catch(function(err) {
        res.send(err);
    });

});

router.get('/tyre_removal_report', function(req, res, next) {
    matchCondition = {};
    if (req.query.tyre_no) {
        matchCondition.tyre_no = {
            $eq: req.query.tyre_no
        };

    }

    else if (req.query.start_date && req.query.end_date) {
            var start = momentTZ(req.query.start_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD');
            var end = momentTZ(req.query.end_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD');
            var startDate = new Date(start);
            var endDate = new Date(end)
            startDate.setUTCHours(00,00,00,000);
            endDate.setUTCHours(23,59,59,999);
            matchCondition.rs_date = {
                // $eq: req.query.start_date
                $gte: startDate,
                $lte: endDate
            };
    }
    TruckTyreMasters.find(matchCondition).sort({'date_of_fitment': -1}).then(function(result) {

        console.log('matchcondition >>>>', matchCondition);

        var mainArray = [];
        var sno = 1;
        result.forEach(r => {
            var obj = {
                "sno": sno,
                "tyre_no": r.tyre_no,
                "vehicle_no": r.vehicle_no,
                "tyre_type": r.tyre_type,
                "date_of_fitment": r.date_of_fitment,
                "rs_date": r.rs_date,  
                "company_name": r.company_name,
                "brand": r.brand,
                "tyreposition": r.tyreposition,
                "price": r.price,
                "kmrun": Number(r.removekm) - Number(r.fitment_km),
                "cpkm": (r.price / (Number(r.removekm) - Number(r.fitment_km)) ).toFixed(2)
            }

            sno = sno + 1; 
            mainArray.push(obj);
        });
        
        console.log('mainArray >>>>', mainArray);
        
        res.send({ "result": mainArray });

        // async.parallel(mainArray, function(err, asyncResult) {
        //     res.send({ "result": asyncResult });  
        // });
    }).catch(function(err) {
        res.send(err);
    });
});


router.get('/site_balance_scrap_stock', function(req, res, next) {
    var accountsArray = [];
    var mainArray = [];
   
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
        
        // if(req.query.item_name) {
        //     matchCondition.name = req.query.item_name;
        // }

        return matchCondition;
    };

    // used to calculate balance using previous records before start date if start date is specified
    var calculateOpeningBalanceUsingOldRecords = function (defaultOpeningBalance, defaultItemType, defaultAccount, cb) {
        // var matchCond = {avoudt: {$lt: new Date(req.query.start_date)}};
        var matchCond = {avoudt: {$lt: moment(req.query.start_date, 'YYYY-MM-DD').format("YYYY-MM-DD")}};

        if(req.query.site_name){
            matchCond.site = req.query.site_name;
        } 
        
        if(defaultAccount) {
            matchCond.itemname = defaultAccount;
        }

       

        Scrapledger.find(matchCond).sort({'avoudt': 1}).then(function (nameresults) {
            var data = [];
            nameresults.forEach(r => {
                defaultOpeningBalance = (Number(r.dqty ? r.dqty : 0) + defaultOpeningBalance) - Number(r.cqty ? r.cqty : 0);
            });
            var accType;
            if(defaultItemType){
                accType = defaultItemType

            } else {
                accType = defaultOpeningBalance > 0 ? 'Debit' : 'Credit'
            }
            cb(false, {type: accType, opening_balance: defaultOpeningBalance});
        }).catch(function (err) {
            console.log(err);
            cb(err, false);
        });
    };

    var findRecords = function (openingBalance, dataAccount, cb) {
        var closing_balance = openingBalance.opening_balance;
        var matchCond = getMatchCondition();
        
        if(dataAccount) {
            matchCond.itemname = dataAccount;
        }
        if(req.query.site_name) {
            matchCond.site = req.query.site_name;
        }
        Scrapledger.find(matchCond).sort({'avoudt': 1}).then(function (nameresults) {
            var data = [];
            nameresults.forEach(r => {
                if (r.itemname) {
                    var dqty = r.dqty ? r.dqty : 0;
                    var cqty = r.cqty ? r.cqty : 0;
                    // console.log(r.adebtamt, r.crdtamt, closing_balance);
                    closing_balance = (closing_balance + Number(dqty)) - Number(cqty);
                    // console.log("closing >>>", r.avoudt);
                    var obj = {
                        site: r.site,
                        itemname: r.itemname,
                        date: moment(r.avoudt).format('DD/MM/YYYY'),
                        // particular: r.arefno,
                        dr: r.dqty,
                        cr: r.cqty,
                        closing: closing_balance.toFixed(2)
                    }
                    data.push(obj);
                }
            });
            cb(false, data);
            // cb(false, {records: data, closing_balance: Math.abs(closing_balance.toFixed(2)), type: closing_balance > 0 ? 'Credit' : 'Debit'});
        }).catch(function (err) {
            console.log(err.stack);
            cb(err, false);
        });
    };

    var calculateLedger = function(nameData) {
        return function (callback) {
            
            Itemmaster.findOne({"name": nameData}).then(r => {
                var vopbal = 0;
                var name = nameData;
                if(r) {
                    name = name;
                    console.log(r.name);
                    vopbal = 0;
                    vopbal = vopbal + Number(r.oq ? r.oq : 0);
                    itemType = "Debit";
                    
                } else {
                    vopbal = 0;
                }
                rvopbal = vopbal;
                rrvopbal = rvopbal;

                if(req.query.start_date) {
                    calculateOpeningBalanceUsingOldRecords(rvopbal, itemType, name, function (err, newOpeningBalance) {
                        if(err) {
                            return res.status(500).send(err);
                        }
                        findRecords(newOpeningBalance, name, function (err, results) {
                            if(err) {
                                return res.status(500).send(err);
                            }

                            var closingBalance;
                            if(results && results.length > 0) {
                                closingBalance = Number(results[results.length - 1].closing)
                            } else {
                                closingBalance = 0;
                            }
                            let stcData = {
                                item_name: name,
                                // dr: closingBalance < 0 ? closingBalance : 0,
                                // dr: closingBalance > 0 ? closingBalance : 0,
                                dr: closingBalance ? closingBalance : 0,
                                site_name: results.length > 0  ? results[0].site : '',
                            }
                            callback(false, stcData);
                        });
                    });
                } else {
                    findRecords(vopbal, name, function (err, results) {
                        if(err) {
                            return res.status(500).send(err);
                        }

                        var closingBalance;
                        if(results && results.length > 0) {
                            closingBalance = results && results.length > 0 ? Number(results[results.length - 1].closing) : 0;
                        } else {
                            closingBalance = 0;
                        }
                        let stcData = {
                            item_name: name,
                            dr: closingBalance ? closingBalance : 0,
                            site_name: results.length > 0  ? results[0].site : '',
                        }
                        callback(false, stcData);
                    });
                }
            }).catch(err => {
                console.log(err.stack);
                callback(err, null);
            });
        };
    };

    if(req.query.item_name) {
        matchCondition.name = req.query.item_name;
    }


    Itemmaster.find(matchCondition).then(function(resultData) {
        
        var nameArray = [];
        resultData.forEach(a => {
            nameArray.push(a.name);
        });
        // console.log("resultData >>>>>>>>>>>", nameArray);

        var matchConditionItem = {
            "itemname": { $in:  nameArray }
        };


        if (req.query.site_name) {
            matchConditionItem.site = req.query.site_name;
        }

        console.log("resultData 1 >>>>>>>>>>>", matchConditionItem);
        
        Scrapledger.find(matchConditionItem).distinct('itemname').then(function(result) {
            var resultsArray = [];
            result.forEach(a => {
                var stcData = calculateLedger(a)
                resultsArray.push(stcData);
            });
            async.parallel(resultsArray, function(err, asyncResult) {
                console.log("ERROR >>> ", err);
                var retValues = [];
                asyncResult.forEach(result=>{
                    if(!(result.cr==0 && result.dr==0)){
                        retValues.push(result);
                    } 
                })
                res.send({ "result": retValues });  
            });
        }).catch(function(err) {
            console.log(err.stack);
            res.send(err);
        });

    }).catch(function(err) {
        res.send(err);
    });
    
});

// router.get('/site_balance_scrap_stock', function(req, res, next) {
//     var accountsArray = [];
//     var mainArray = [];
   
//     var rvopbal = 0;
//     var matchCondition = {};
//     var rrvopbal, itemType;

//     var getMatchCondition = function () {
//         var matchCondition = {};

//         if(req.query.start_date) {
//             matchCondition.avoudt = req.query.start_date;
//         }
        
//         if(req.query.end_date && req.query.start_date) {
//             var startDate = moment(req.query.start_date, 'YYYY-MM-DD').format("YYYY-MM-DD");
//             var endDate = moment(req.query.end_date, 'YYYY-MM-DD').format("YYYY-MM-DD");
//             matchCondition.avoudt = {
//                 $gte: startDate,
//                 $lte: endDate
//             };
//         }

//         if ( req.query.start_date == req.query.end_date ) {
//             var startDate = moment(req.query.start_date, 'YYYY-MM-DD').format("YYYY-MM-DD");
//             matchCondition.avoudt = startDate;
//         } 

//         if(req.query.site_name){
//             matchCondition.site = req.query.site_name;
//         } 
        
//         // if(req.query.item_name) {
//         //     matchCondition.name = req.query.item_name;
//         // }

//         return matchCondition;
//     };

//     // used to calculate balance using previous records before start date if start date is specified
//     var calculateOpeningBalanceUsingOldRecords = function (defaultOpeningBalance, defaultItemType, defaultAccount, cb) {
//         // var matchCond = {avoudt: {$lt: new Date(req.query.start_date)}};
//         var matchCond = {avoudt: {$lt: moment(req.query.start_date, 'YYYY-MM-DD').format("YYYY-MM-DD")}};

//         if(req.query.site_name){
//             matchCond.site = req.query.site_name;
//         } 
        
//         if(defaultAccount) {
//             matchCond.itemname = defaultAccount;
//         }

//         Scrapledger.find(matchCond).sort({'avoudt': 1}).then(function (nameresults) {
//             var data = [];
//             nameresults.forEach(r => {
//                 defaultOpeningBalance = (Number(r.cqty ? r.cqty : 0) + defaultOpeningBalance) - Number(r.dqty ? r.dqty : 0);
//             });
//             var accType;
//             if(defaultItemType){
//                 accType = defaultItemType

//             } else {
//                 accType = defaultOpeningBalance > 0 ? 'Credit' : 'Debit'
//             }
//             cb(false, {type: accType, opening_balance: defaultOpeningBalance});
//         }).catch(function (err) {
//             console.log(err);
//             cb(err, false);
//         });
//     };

//     var findRecords = function (openingBalance, dataAccount, cb) {
//         var closing_balance = openingBalance.opening_balance;
//         var matchCond = getMatchCondition();
//         if(dataAccount) {
//             matchCond.itemname = dataAccount;
//         }
//         if(req.query.site_name) {
//             matchCond.site = req.query.site_name;
//         }
//         Scrapledger.find(matchCond).sort({'avoudt': 1}).then(function (nameresults) {
//             var data = [];
//             nameresults.forEach(r => {
//                 if (r.itemname) {
//                     var dqty = r.dqty ? r.dqty : 0;
//                     var cqty = r.cqty ? r.cqty : 0;
//                     // console.log(r.adebtamt, r.crdtamt, closing_balance);
//                     closing_balance = (closing_balance + Number(cqty)) - Number(dqty);
//                     // console.log("closing >>>", r.avoudt);
//                     var obj = {
//                         site: r.site,
//                         itemname: r.itemname,
//                         date: moment(r.avoudt).format('DD/MM/YYYY'),
//                         // particular: r.arefno,
//                         dr: r.dqty,
//                         cr: r.cqty,
//                         closing: closing_balance.toFixed(2)
//                     }
//                     data.push(obj);
//                 }
//             });
//             cb(false, data);
//             // cb(false, {records: data, closing_balance: Math.abs(closing_balance.toFixed(2)), type: closing_balance > 0 ? 'Credit' : 'Debit'});
//         }).catch(function (err) {
//             console.log(err.stack);
//             cb(err, false);
//         });
//     };

//     var calculateLedger = function(nameData) {
//         return function (callback) {
            
//             Itemmaster.findOne({"name": nameData}).then(r => {
//                 var vopbal = 0;
//                 var name = nameData;
//                 if(r) {
//                     name = name;
//                     console.log(r.name);
//                     vopbal = 0;
//                     vopbal = vopbal + Number(r.oq ? r.oq : 0);
//                     itemType = "Debit";
                    
//                 } else {
//                     vopbal = 0;
//                 }
//                 rvopbal = vopbal;
//                 rrvopbal = rvopbal;

//                 if(req.query.start_date) {
//                     calculateOpeningBalanceUsingOldRecords(rvopbal, itemType, name, function (err, newOpeningBalance) {
//                         if(err) {
//                             return res.status(500).send(err);
//                         }
//                         findRecords(newOpeningBalance, name, function (err, results) {
//                             if(err) {
//                                 return res.status(500).send(err);
//                             }

//                             var closingBalance;
//                             if(results && results.length > 0) {
//                                 closingBalance = Number(results[results.length - 1].closing)
//                             } else {
//                                 closingBalance = 0;
//                             }
//                             callback(false, {
//                                 item_name: name,
//                                 dr: closingBalance < 0 ? Math.abs(closingBalance) : 0,
//                                 cr: closingBalance > 0 ? Math.abs(closingBalance) : 0,
//                                 site_name: results.length > 0  ? results[0].site : '',
//                             });
//                         });
//                     });
//                 } else {
//                     findRecords(vopbal, name, function (err, results) {
//                         if(err) {
//                             return res.status(500).send(err);
//                         }

//                         var closingBalance;
//                         if(results && results.length > 0) {
//                             closingBalance = results && results.length > 0 ? Number(results[results.length - 1].closing) : 0;
//                         } else {
//                             closingBalance = 0;
//                         }
//                         callback(false, {
//                             item_name: name,
//                             dr: closingBalance < 0 ? Math.abs(closingBalance) : 0,
//                             cr: closingBalance > 0 ? Math.abs(closingBalance) : 0,
//                             site_name: results.length > 0  ? results[0].site : '',
//                         });
//                     });
//                 }
//             }).catch(err => {
//                 console.log(err.stack);
//                 callback(err, null);
//             });
//         };
//     };


//     Itemmaster.find().then(function(resultData) {
        
//         var nameArray = [];
//         resultData.forEach(a => {
//             nameArray.push(a.name);
//         });
//         // console.log("resultData >>>>>>>>>>>", nameArray);

//         var matchConditionItem = {
//             "itemname": { $in:  nameArray }
//         };


//         if (req.query.site_name) {
//             matchConditionItem.site = req.query.site_name;
//         }

//         console.log("resultData 1 >>>>>>>>>>>", matchConditionItem);
        
//         Scrapledger.find(matchConditionItem).distinct('itemname').then(function(result) {
//             var resultsArray = [];
//             result.forEach(a => {
//                 resultsArray.push(calculateLedger(a));
//             });
//             async.parallel(resultsArray, function(err, asyncResult) {
//                 console.log("ERROR >>> ", err);
//                 res.send({ "result": asyncResult });  
//             });
//         }).catch(function(err) {
//             console.log(err.stack);
//             res.send(err);
//         });

//     }).catch(function(err) {
//         res.send(err);
//     });
    
// });


// router.get('/site_balance_scrap_stock', function(req, res, next) {
//     var accountsArray = [];
//     var mainArray = [];
   
//     var rvopbal = 0;
//     var matchCondition = {};
//     var rrvopbal, itemType;

//     var getMatchCondition = function () {
//         var matchCondition = {};

//         if(req.query.start_date) {
//             matchCondition.avoudt = req.query.start_date;
//         }
        
//         if(req.query.end_date && req.query.start_date) {
//             var startDate = moment(req.query.start_date, 'YYYY-MM-DD').format("YYYY-MM-DD");
//             var endDate = moment(req.query.end_date, 'YYYY-MM-DD').format("YYYY-MM-DD");
//             matchCondition.avoudt = {
//                 $gte: startDate,
//                 $lte: endDate
//             };
//         }

//         if ( req.query.start_date == req.query.end_date ) {
//             var startDate = moment(req.query.start_date, 'YYYY-MM-DD').format("YYYY-MM-DD");
//             matchCondition.avoudt = startDate;
//         } 

//         if(req.query.site_name){
//             matchCondition.site = req.query.site_name;
//         } 
        
//         // if(req.query.item_name) {
//         //     matchCondition.name = req.query.item_name;
//         // }

//         return matchCondition;
//     };

//     // used to calculate balance using previous records before start date if start date is specified
//     var calculateOpeningBalanceUsingOldRecords = function (defaultOpeningBalance, defaultItemType, defaultAccount, cb) {
//         // var matchCond = {avoudt: {$lt: new Date(req.query.start_date)}};
//         var matchCond = {avoudt: {$lt: moment(req.query.start_date, 'YYYY-MM-DD').format("YYYY-MM-DD")}};

//         if(req.query.site_name){
//             matchCond.site = req.query.site_name;
//         } 
        
//         if(defaultAccount) {
//             matchCond.itemname = defaultAccount;
//         }

//         Scrapledger.find(matchCond).sort({'avoudt': 1}).then(function (nameresults) {
//             var data = [];
//             nameresults.forEach(r => {
//                 defaultOpeningBalance = (Number(r.cqty ? r.cqty : 0) + defaultOpeningBalance) - Number(r.dqty ? r.dqty : 0);
//             });
//             var accType;
//             if(defaultItemType){
//                 accType = defaultItemType

//             } else {
//                 accType = defaultOpeningBalance > 0 ? 'Credit' : 'Debit'
//             }
//             cb(false, {type: accType, opening_balance: defaultOpeningBalance});
//         }).catch(function (err) {
//             console.log(err);
//             cb(err, false);
//         });
//     };

//     var findRecords = function (openingBalance, dataAccount, cb) {
//         var closing_balance = openingBalance.opening_balance;
//         var matchCond = getMatchCondition();
//         if(dataAccount) {
//             matchCond.itemname = dataAccount;
//         }
//         if(req.query.site_name) {
//             matchCond.site = req.query.site_name;
//         }
//         Scrapledger.find(matchCond).sort({'avoudt': 1}).then(function (nameresults) {
//             var data = [];
//             nameresults.forEach(r => {
//                 if (r.itemname) {
//                     var dqty = r.dqty ? r.dqty : 0;
//                     var cqty = r.cqty ? r.cqty : 0;
//                     // console.log(r.adebtamt, r.crdtamt, closing_balance);
//                     closing_balance = (closing_balance + Number(cqty)) - Number(dqty);
//                     // console.log("closing >>>", r.avoudt);
//                     var obj = {
//                         site: r.site,
//                         itemname: r.itemname,
//                         date: moment(r.avoudt).format('DD/MM/YYYY'),
//                         // particular: r.arefno,
//                         dr: r.dqty,
//                         cr: r.cqty,
//                         closing: closing_balance.toFixed(2)
//                     }
//                     data.push(obj);
//                 }
//             });
//             cb(false, data);
//             // cb(false, {records: data, closing_balance: Math.abs(closing_balance.toFixed(2)), type: closing_balance > 0 ? 'Credit' : 'Debit'});
//         }).catch(function (err) {
//             console.log(err.stack);
//             cb(err, false);
//         });
//     };

//     var calculateLedger = function(nameData) {
//         return function (callback) {
            
//             Itemmaster.findOne({"name": nameData}).then(r => {
//                 var vopbal = 0;
//                 var name = nameData;
//                 if(r) {
//                     name = name;
//                     console.log(r.name);
//                     vopbal = 0;
//                     vopbal = vopbal + Number(r.oq ? r.oq : 0);
//                     itemType = "Debit";
                    
//                 } else {
//                     vopbal = 0;
//                 }
//                 rvopbal = vopbal;
//                 rrvopbal = rvopbal;

//                 if(req.query.start_date) {
//                     calculateOpeningBalanceUsingOldRecords(rvopbal, itemType, name, function (err, newOpeningBalance) {
//                         if(err) {
//                             return res.status(500).send(err);
//                         }
//                         findRecords(newOpeningBalance, name, function (err, results) {
//                             if(err) {
//                                 return res.status(500).send(err);
//                             }

//                             var closingBalance;
//                             if(results && results.length > 0) {
//                                 closingBalance = Number(results[results.length - 1].closing)
//                             } else {
//                                 closingBalance = 0;
//                             }
//                             callback(false, {
//                                 item_name: name,
//                                 dr: closingBalance < 0 ? Math.abs(closingBalance) : 0,
//                                 cr: closingBalance > 0 ? Math.abs(closingBalance) : 0,
//                                 site_name: results.length > 0  ? results[0].site : '',
//                             });
//                         });
//                     });
//                 } else {
//                     findRecords(vopbal, name, function (err, results) {
//                         if(err) {
//                             return res.status(500).send(err);
//                         }

//                         var closingBalance;
//                         if(results && results.length > 0) {
//                             closingBalance = results && results.length > 0 ? Number(results[results.length - 1].closing) : 0;
//                         } else {
//                             closingBalance = 0;
//                         }
//                         callback(false, {
//                             item_name: name,
//                             dr: closingBalance < 0 ? Math.abs(closingBalance) : 0,
//                             cr: closingBalance > 0 ? Math.abs(closingBalance) : 0,
//                             site_name: results.length > 0  ? results[0].site : '',
//                         });
//                     });
//                 }
//             }).catch(err => {
//                 console.log(err.stack);
//                 callback(err, null);
//             });
//         };
//     };


//     Itemmaster.find().then(function(resultData) {
        
//         var nameArray = [];
//         resultData.forEach(a => {
//             nameArray.push(a.name);
//         });
//         // console.log("resultData >>>>>>>>>>>", nameArray);

//         var matchConditionItem = {
//             "itemname": { $in:  nameArray }
//         };


//         if (req.query.site_name) {
//             matchConditionItem.site = req.query.site_name;
//         }

//         console.log("resultData 1 >>>>>>>>>>>", matchConditionItem);
        
//         Scrapledger.find(matchConditionItem).distinct('itemname').then(function(result) {
//             var resultsArray = [];
//             result.forEach(a => {
//                 resultsArray.push(calculateLedger(a));
//             });
//             async.parallel(resultsArray, function(err, asyncResult) {
//                 console.log("ERROR >>> ", err);
//                 res.send({ "result": asyncResult });  
//             });
//         }).catch(function(err) {
//             console.log(err.stack);
//             res.send(err);
//         });

//     }).catch(function(err) {
//         res.send(err);
//     });
    
// });


// router.get('/site_balance_scrap_stock', function(req, res, next) {
//     var accountsArray = [];
//     var mainArray = [];
   
//     var rvopbal = 0;
//     var matchCondition = {};
//     var rrvopbal, itemType;

//     var getMatchCondition = function () {
//         var matchCondition = {};

//         if(req.query.start_date) {
//             matchCondition.avoudt = req.query.start_date;
//         }
        
//         if(req.query.end_date && req.query.start_date) {
//             var startDate = moment(req.query.start_date, 'YYYY-MM-DD').format("YYYY-MM-DD");
//             var endDate = moment(req.query.end_date, 'YYYY-MM-DD').format("YYYY-MM-DD");
//             matchCondition.avoudt = {
//                 $gte: startDate,
//                 $lte: endDate
//             };
//         }

//         if ( req.query.start_date == req.query.end_date ) {
//             var startDate = moment(req.query.start_date, 'YYYY-MM-DD').format("YYYY-MM-DD");
//             matchCondition.avoudt = startDate;
//         } 

//         if(req.query.site_name){
//             matchCondition.site = req.query.site_name;
//         } 
        
//         // if(req.query.item_name) {
//         //     matchCondition.name = req.query.item_name;
//         // }

//         return matchCondition;
//     };

//     // used to calculate balance using previous records before start date if start date is specified
//     var calculateOpeningBalanceUsingOldRecords = function (defaultOpeningBalance, defaultItemType, defaultAccount, cb) {
//         // var matchCond = {avoudt: {$lt: new Date(req.query.start_date)}};
//         var matchCond = {avoudt: {$lt: moment(req.query.start_date, 'YYYY-MM-DD').format("YYYY-MM-DD")}};

//         if(req.query.site_name){
//             matchCond.site = req.query.site_name;
//         } 
        
//         if(defaultAccount) {
//             matchCond.itemname = defaultAccount;
//         }

//         Scrapledger.find(matchCond).sort({'avoudt': 1}).then(function (nameresults) {
//             var data = [];
//             nameresults.forEach(r => {
//                 defaultOpeningBalance = (Number(r.cqty ? r.cqty : 0) + defaultOpeningBalance) - Number(r.dqty ? r.dqty : 0);
//             });
//             var accType;
//             if(defaultItemType){
//                 accType = defaultItemType

//             } else {
//                 accType = defaultOpeningBalance > 0 ? 'Credit' : 'Debit'
//             }
//             cb(false, {type: accType, opening_balance: defaultOpeningBalance});
//         }).catch(function (err) {
//             console.log(err);
//             cb(err, false);
//         });
//     };

//     var findRecords = function (openingBalance, dataAccount, cb) {
//         var closing_balance = openingBalance.opening_balance;
//         var matchCond = getMatchCondition();
//         if(dataAccount) {
//             matchCond.itemname = dataAccount;
//         }
//         if(req.query.site_name) {
//             matchCond.site = req.query.site_name;
//         }
//         Scrapledger.find(matchCond).sort({'avoudt': 1}).then(function (nameresults) {
//             var data = [];
//             nameresults.forEach(r => {
//                 if (r.itemname) {
//                     var dqty = r.dqty ? r.dqty : 0;
//                     var cqty = r.cqty ? r.cqty : 0;
//                     // console.log(r.adebtamt, r.crdtamt, closing_balance);
//                     closing_balance = (closing_balance + Number(cqty)) - Number(dqty);
//                     // console.log("closing >>>", r.avoudt);
//                     var obj = {
//                         site: r.site,
//                         itemname: r.itemname,
//                         date: moment(r.avoudt).format('DD/MM/YYYY'),
//                         // particular: r.arefno,
//                         dr: r.dqty,
//                         cr: r.cqty,
//                         closing: closing_balance.toFixed(2)
//                     }
//                     data.push(obj);
//                 }
//             });
//             cb(false, data);
//             // cb(false, {records: data, closing_balance: Math.abs(closing_balance.toFixed(2)), type: closing_balance > 0 ? 'Credit' : 'Debit'});
//         }).catch(function (err) {
//             console.log(err.stack);
//             cb(err, false);
//         });
//     };

//     var calculateLedger = function(nameData) {
//         return function (callback) {
            
//             Itemmaster.findOne({"name": nameData}).then(r => {
//                 var vopbal = 0;
//                 var name = nameData;
//                 if(r) {
//                     name = name;
//                     console.log(r.name);
//                     vopbal = 0;
//                     vopbal = vopbal + Number(r.oq ? r.oq : 0);
//                     itemType = "Debit";
                    
//                 } else {
//                     vopbal = 0;
//                 }
//                 rvopbal = vopbal;
//                 rrvopbal = rvopbal;

//                 if(req.query.start_date) {
//                     calculateOpeningBalanceUsingOldRecords(rvopbal, itemType, name, function (err, newOpeningBalance) {
//                         if(err) {
//                             return res.status(500).send(err);
//                         }
//                         findRecords(newOpeningBalance, name, function (err, results) {
//                             if(err) {
//                                 return res.status(500).send(err);
//                             }

//                             var closingBalance;
//                             if(results && results.length > 0) {
//                                 closingBalance = Number(results[results.length - 1].closing)
//                             } else {
//                                 closingBalance = 0;
//                             }
//                             callback(false, {
//                                 item_name: name,
//                                 dr: closingBalance < 0 ? Math.abs(closingBalance) : 0,
//                                 cr: closingBalance > 0 ? Math.abs(closingBalance) : 0,
//                                 site_name: results.length > 0  ? results[0].site : '',
//                             });
//                         });
//                     });
//                 } else {
//                     findRecords(vopbal, name, function (err, results) {
//                         if(err) {
//                             return res.status(500).send(err);
//                         }

//                         var closingBalance;
//                         if(results && results.length > 0) {
//                             closingBalance = results && results.length > 0 ? Number(results[results.length - 1].closing) : 0;
//                         } else {
//                             closingBalance = 0;
//                         }
//                         callback(false, {
//                             item_name: name,
//                             dr: closingBalance < 0 ? Math.abs(closingBalance) : 0,
//                             cr: closingBalance > 0 ? Math.abs(closingBalance) : 0,
//                             site_name: results.length > 0  ? results[0].site : '',
//                         });
//                     });
//                 }
//             }).catch(err => {
//                 console.log(err.stack);
//                 callback(err, null);
//             });
//         };
//     };


//     Itemmaster.find().then(function(resultData) {
        
//         var nameArray = [];
//         resultData.forEach(a => {
//             nameArray.push(a.name);
//         });
//         // console.log("resultData >>>>>>>>>>>", nameArray);

//         var matchConditionItem = {
//             "itemname": { $in:  nameArray }
//         };


//         if (req.query.site_name) {
//             matchConditionItem.site = req.query.site_name;
//         }

//         console.log("resultData 1 >>>>>>>>>>>", matchConditionItem);
        
//         Scrapledger.find(matchConditionItem).distinct('itemname').then(function(result) {
//             var resultsArray = [];
//             result.forEach(a => {
//                 resultsArray.push(calculateLedger(a));
//             });
//             async.parallel(resultsArray, function(err, asyncResult) {
//                 console.log("ERROR >>> ", err);
//                 res.send({ "result": asyncResult });  
//             });
//         }).catch(function(err) {
//             console.log(err.stack);
//             res.send(err);
//         });

//     }).catch(function(err) {
//         res.send(err);
//     });
    
// });

module.exports = router;