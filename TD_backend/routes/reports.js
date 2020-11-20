var express = require('express');
var router = express.Router();
var async = require('async');
var moment = require('moment');
var momentTZ = require('moment-timezone');
var Billty = require('../models/billties');
var Tires = require('../models/tires');
var Trucks = require('../models/trucks');
var TruckDivert = require('../models/truckdivert');
var FT = require('../models/fleetstarget');
var Accounts = require('../models/accounts');
var AccountsLedger = require('../models/accountsledger');
var PlantsTruckPosition = require('../models/plantstruckposition');
// var moment = require('moment');
var Tires = require('../models/tires');
var Jwreminders = require('../models/maintenance/job-workreminders');

router.get('/truck_dest_details', function (req, res, next) {
    Billty.findOne({truckno:req.query.truckno}).sort({lrdate:-1}).then(function(result){

            let data = {};
            data.tkmr = result ? result.tkmr : 0;
            data.newkm = result ? result.newkm : 0;
        
            res.send({"result":data})
    })
});


router.get('/max_lrno', function (req, res, next) {
    PlantsTruckPosition.findOne({site:req.query.site}).sort({lrno:-1}).then(function(result){
        if(result){
            res.send({"lrno":result.lrno+1})
        } else {
            res.send({"lrno":1})
        }
    })
});

router.get('/lrwise_truck_positions/:site/:bool', function (req, res, next) {
    PlantsTruckPosition.find({site:req.params.site,isBilltyGen:(req.params.bool==='true')}).sort({lrno:-1}).then(function(result){
        res.send({"result":result})

    })
});

router.put('/update_truck_positions_bilty_gen/', function (req, res, next) {
    var condition = { lrno: req.body.lrno,site:req.body.site,truckno:req.body.truckno};
    console.log(condition)
    PlantsTruckPosition.update(condition, {isBilltyGen: true}, function(err, raw) {
        res.send({"message": "Updated...!"});
    }).catch(function(err) {
        res.send(err);
    });
});


router.put('/update_km_reading_job_work_reminder/', function (req, res, next) {
    var condition = { truckno:req.body.truckno,isDone: false};
    console.log(condition)
    Jwreminders.updateMany(condition, {ckm_reading:req.body.tkmr}, function(err, raw) {
        res.send({"message": "Updated...!"});
    }).catch(function(err) {
        res.send(err);
    });
});


router.put('/update_truck_engine_type/', function (req, res, next) {
    var condition = { truckno: req.body.truckno};
    console.log(condition)
    Trucks.update(condition, {enginetype: req.body.enginetype}, function(err, raw) {
        res.send({"message": "Updated...!"});
    }).catch(function(err) {
        res.send(err);
    });
});

router.put('/update_false_truck_positions_bilty_gen/', function (req, res, next) {
    var condition = { lrno: req.body.lrno,site:req.body.site,truckno:req.body.truckno};
    console.log(condition)
    PlantsTruckPosition.update(condition, {isBilltyGen: false}, function(err, raw) {
        res.send({"message": "Updated...!"});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/ega', function (req, res, next) {
    matchCondition = {};

    var getBilltyData = function (matchCondition, cb) {
        Billty.aggregate([
            {
                $match: matchCondition,
            },
            {
                $group: {
                    _id : {
                        site: '$site',
                        to: '$to'
                    },
                    expenses:{ $sum: '$totaltruckexpences'},
                    earning:{ $sum: '$newamount'},
                    dieselamount:{ $sum: '$damount'},
                    trips: {
                        $sum: 1
                    }
                }
            },

        ]).sort({ _id: 1 }).then(function (results) {

            

            console.log("count");
            console.log(results.length);
            results.forEach(r => {
                if(!r.earning){
                    r.earning = 0;
                }

                if(!r.dieselamount){
                    r.dieselamount = 0
                }

                if(!r.expenses){
                    r.expenses=0;
                }
                r.balance = (Number(r.earning.toFixed(2)) - Number(r.dieselamount.toFixed(2)) - Number(r.expenses.toFixed(2)))
                
                r.balance = r.balance ? r.balance.toFixed(2):r.balance;
                r.dieselamount = r.dieselamount ? r.dieselamount.toFixed(2): r.dieselamount;
                r.km = 0;
               r.costPerkM = 0;
               var per = 0;
               if(r.earning){
                   per = (r.balance * 100)/r.earning;
               }
               r.per = per;
               if(per > 20){
                   r.value = 'Excellent'
               } else if(per > 15){
                    r.value = "Good"
               }
               else if (per > 0) {
                r.value = "Average"
               }
                else {
                    r.value = "Average"
                }

            });
            var data = results;
            console.log(results);
            cb(false, data);
        }).catch(function (err) {
            console.log(err);
            cb(err, false);
        });

    };
    
    matchCondition.vehicletype='Company'
    matchCondition.newamount={
        $exists:true,
        $ne:null
    }
    if (req.query.year && req.query.site) {
        startYear = req.query.year + "-"+req.query.month+"-01";
        endYear = req.query.year + "-"+req.query.month+"-31";

        matchCondition.site = {
            $eq: req.query.site,
        };
        matchCondition.lrdate = {
            // $eq: req.query.start_date
            $gte: new Date(startYear),
            $lte: new Date(endYear)
        };
    }
    getBilltyData(matchCondition, function (err, result) {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        console.log(matchCondition);
        console.log(req.query);
        res.send(result);
    });
});

router.get('/monthly-balance-chart', function (req, res, next) {
    matchCondition = {};

    var getBilltyData = function (matchCondition, cb) {
        Billty.aggregate([
            {
                $match: matchCondition,
            },
            {
                $group: {
                    _id : {
                        month:{"$arrayElemAt":[{"$split":[{"$toString":"$lrdate"},"-"]},1]},
                        year:{"$arrayElemAt":[{"$split":[{"$toString":"$lrdate"},"-"]},0]},
                        site: '$site'
                    },
                    expenses:{ $sum: '$totaltruckexpences'},
                    earning:{ $sum: '$newamount'},
                    dieselamount:{ $sum: '$damount'},
                }
            },

        ]).sort({ _id: 1 }).then(function (results) {

            results.forEach(r => {
                if(!r.earning){
                    r.earning = 0;
                }

                if(!r.dieselamount){
                    r.dieselamount = 0
                }

                if(!r.expenses){
                    r.expenses=0;
                }
                r.balance = (Number(r.earning.toFixed(2)) - Number(r.dieselamount.toFixed(2)) - Number(r.expenses.toFixed(2)))
                r.balance = r.balance ? r.balance.toFixed(2):r.balance;
                r.dieselamount = r.dieselamount ? r.dieselamount.toFixed(2): r.dieselamount;

            });
            var data = results;
            cb(false, data);
        }).catch(function (err) {
            console.log(err);
            cb(err, false);
        });

    };
    console.log(req.query.year)
    matchCondition.vehicletype='Company'
    matchCondition.newamount={
        $exists:true,
        $ne:null
    }
    if (req.query.year) {

        startYear = req.query.year + "-01-01";
        endYear = (parseInt(req.query.year)+1) + "-01-01";

        matchCondition.lrdate = {
            // $eq: req.query.start_date
            $gte: new Date(startYear),
            $lte: new Date(endYear)
        };
    }

    if(req.query.site){
        matchCondition.site = {
            $eq: req.query.site,
        };
    }

    getBilltyData(matchCondition, function (err, result) {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        console.log(matchCondition);
        console.log(req.query);
        console.log(result)
        res.send(result);
    });
});

router.get('/under-performance-truck-report', function (req, res, next) {
    matchCondition = {};

    var getBilltyData = function (matchCondition, cb) {
        Billty.aggregate([
            {
                $match: matchCondition,
            },
            {
                $group: {
                    _id : {
                        truckno: '$truckno',
                        tyre: '$tyre'
                    },
                    expenses:{ $sum: '$totaltruckexpences'},
                    earning:{ $sum: '$newamount'},
                    dieselamount:{ $sum: '$damount'},
                    km:{ $sum: '$newkm'},
                    trips: {
                        $sum: 1
                    }
                }
            },

        ]).sort({ _id: 1 }).then(function (results) {

            results.forEach(r => {
                if(!r.earning){
                    r.earning = 0;
                }

                if(!r.dieselamount){
                    r.dieselamount = 0
                }

                if(!r.expenses){
                    r.expenses=0;
                }
               r.balance = (Number(r.earning.toFixed(2)) - Number(r.dieselamount.toFixed(2)) - Number(r.expenses.toFixed(2)))
               r.balance = r.balance ? r.balance.toFixed(2):r.balance;
               r.dieselamount = r.dieselamount ? r.dieselamount.toFixed(2): r.dieselamount;

            //    r.km = 0;
               r.maintenance = 0;
               r.target=0;
               r.value = '';
            });
            var data = results;
            cb(false, data);
        }).catch(function (err) {
            console.log(err);
            cb(err, false);
        });

    };
    
    matchCondition.vehicletype='Company'
    if (req.query.year && req.query.tyre) {
        startYear = req.query.year + "-"+req.query.month+"-01";
        endYear = req.query.year + "-"+req.query.month+"-31";

        matchCondition.tyre = {
            $eq: req.query.tyre,
        };

        
        matchCondition.lrdate = {
            // $eq: req.query.start_date
            $gte: new Date(startYear),
            $lte: new Date(endYear)
        };
    }

    getBilltyData(matchCondition, function (err, result) {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        console.log(matchCondition);
        console.log(req.query);
        Tires.find().then(function(tyrems){
            tyrems.forEach(tyrem=>{
                if(tyrem){
                    result.forEach(r=>{
                        if(r._id.tyre == tyrem.name){
                            r.target = tyrem.tamount
                            if(r.balance >= tyrem.tamount){
                                r.value = "Excellent"
                            } else{
                                r.value = "Under Performance"
                            }
                        }
                    })  
             }
            })   
            res.send(result); 
        }) 
        
    });
});

router.get('/under-performance-truck-report-site', function (req, res, next) {
    matchCondition = {};

    var getBilltyData = function (matchCondition, cb) {
        Billty.aggregate([
            {
                $match: matchCondition,
            },
            {
                $group: {
                    _id : {
                        truckno: '$truckno',
                        tyre: '$tyre'
                    },
                    expenses:{ $sum: '$totaltruckexpences'},
                    earning:{ $sum: '$newamount'},
                    dieselamount:{ $sum: '$damount'},
                    km:{ $sum: '$newkm'},
                    trips: {
                        $sum: 1
                    }
                }
            },

        ]).sort({ _id: 1 }).then(function (results) {

            results.forEach(r => {
                if(!r.earning){
                    r.earning = 0;
                }

                if(!r.dieselamount){
                    r.dieselamount = 0
                }

                if(!r.expenses){
                    r.expenses=0;
                }
               r.balance = (Number(r.earning.toFixed(2)) - Number(r.dieselamount.toFixed(2)) - Number(r.expenses.toFixed(2)))
               r.balance = r.balance ? r.balance.toFixed(2):r.balance;
               r.dieselamount = r.dieselamount ? r.dieselamount.toFixed(2): r.dieselamount;

            //    r.km = 0;
               r.maintenance = 0;
               r.target=0;
               r.value = '';
            });
            var data = results;
            cb(false, data);
        }).catch(function (err) {
            console.log(err);
            cb(err, false);
        });

    };
    
    matchCondition.vehicletype='Company'
    if (req.query.year && req.query.tyre) {
        startYear = req.query.year + "-"+req.query.month+"-01";
        endYear = req.query.year + "-"+req.query.month+"-31";

        matchCondition.tyre = {
            $eq: req.query.tyre,
        };

        matchCondition.site = {
            $eq: req.query.site,
        };
        
        matchCondition.lrdate = {
            // $eq: req.query.start_date
            $gte: new Date(startYear),
            $lte: new Date(endYear)
        };
    }

    getBilltyData(matchCondition, function (err, result) {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        console.log(matchCondition);
        console.log(req.query);
        Tires.find().then(function(tyrems){
            tyrems.forEach(tyrem=>{
                if(tyrem){
                    result.forEach(r=>{
                        if(r._id.tyre == tyrem.name){
                            r.target = tyrem.tamount
                            if(r.balance >= tyrem.tamount){
                                r.value = "Excellent"
                            } else{
                                r.value = "Under Performance"
                            }
                        }
                    })  
             }
            })   
            res.send(result); 
        }) 
        
    });
});

router.get('/dispatch_summary_site_wise_monthly', function (req, res, next) {

    matchCondition = {};

    var getBilltyData = function (matchCondition, cb) {
        Billty.aggregate([
            {
                $match: matchCondition,
            },
            {
                $group: {
                    _id: { $substr: ['$lrdate', 5, 2] },
                    trips: {
                        $sum: 1
                    },
                    tons: {
                        $sum: '$actualweight'
                    },
                    OT: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Company"] }, 1, 0]
                        }
                    },
                    AT: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Attached"] }, 1, 0]
                        }
                    },
                    CTons: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Company"] }, "$actualweight", 0]
                        }
                    },
                    ATons: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Attached"] }, "$actualweight", 0]
                        }
                    },
                    Co_Amt: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Company"] }, "$newamount", 0]
                        }
                    },
                    Co_Expences: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Company"] }, "$totaltruckexpences", 0]
                        }
                    },
                    Co_D_Amount: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Company"] }, "$damount", 0]
                        }
                    },
                    A_Amt: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Attached"] }, "$newamount", 0]
                        }
                    },
                    A_Expences: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Attached"] }, "$totaltruckexpences", 0]
                        }
                    },
                    VA_Amt: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Company"] }, "$vamount", 0]
                        }
                    },
                    AA_Amt: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Attached"] }, "$vamount", 0]
                        }
                    },
                    A_D_Amt: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Attached"] }, "$damount", 0]
                        }
                    }
                }
            },

        ]).sort({ _id: 1 }).then(function (results) {

            var month = new Array();
            month[1] = "January";
            month[2] = "February";
            month[3] = "March";
            month[4] = "April";
            month[5] = "May";
            month[6] = "June";
            month[7] = "July";
            month[8] = "August";
            month[9] = "September";
            month[10] = "October";
            month[11] = "November";
            month[12] = "December";

            // console.log("count");
            // console.log(results.length);
            results.forEach(r => {
                var re_commision = r.Co_Amt - r.VA_Amt ;
                // var exp = r.Co_Expences + r.Co_D_Amount;
                // var companyProfit = r.VA_Amt - exp
                // var finalProfit = companyProfit + re_commision;

                // r.Co_profit = finalProfit;
                // r.A_profit = r.A_Amt - r.AA_Amt;
                // r.net_profit = Number(finalProfit) + Number(r.A_Amt - r.AA_Amt);


                r.Co_profit = re_commision;
                r.A_profit = r.A_Amt - r.AA_Amt;
                r.net_profit = Number(re_commision) + Number(r.A_Amt - r.AA_Amt);
                console.log("r.A_Amt  >>>>>", r.A_Amt);
                console.log("r.AA_Amt  >>>>>", r.AA_Amt);

                // r.Co_profit = r.Co_Amt - r.Co_D_Amount - r.Co_Expences;
                // r.A_profit = r.A_Amt - r.A_D_Amt - r.A_Expences;
                // r.net_profit = r.Co_profit + r.A_profit;
                r.o_ratio = (r.OT / r.trips) * 100;
                r.a_ratio = (r.AT / r.trips) * 100;

                r.month = month[parseInt(r._id)];
                // console.log("month name");
                // console.log(r.month);
            });
            var data = results;
            console.log(results);
            cb(false, data);
        }).catch(function (err) {
            console.log(err);
            cb(err, false);
        });

    };

    if (req.query.year && req.query.site) {
        startYear = req.query.year + "-01-01";
        endYear = req.query.year + "-12-31";

        matchCondition.site = {
            $eq: req.query.site,
        };
        matchCondition.lrdate = {
            // $eq: req.query.start_date
            $gte: new Date(startYear),
            $lte: new Date(endYear)
        };
    }

    console.log('MatchCondition >>>>', matchCondition);

    getBilltyData(matchCondition, function (err, result) {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        console.log(matchCondition);
        console.log(req.query);
        res.send(result);
    });

});

router.get('/dispatch_summary_site_wise', function (req, res, next) {
    var page, limit, offset, reqArray, data, siteArray, tanameArray, matchConditionTA;

    page = req.query.page ? req.query.page : 1;
    limit = req.query.limit ? req.query.limit : 50;
    offset = (page - 1) * limit;

    // reqArray = [];
    data = [];
    matchCondition = {};


    var fetchData = function (matchCondition, cb) {
        Billty.find(matchCondition).sort({ lrdate: 1, lrno: 1 }).then(function (result) {
            var resultArray = [];
            result.forEach(r => {
                

                if (r.ownername == "GL") {
                    // var re_commision = r.newamount - r.vamount ;
                    // var exp = r.totaltruckexpences + r.damount;
                    // var companyProfit = r.vamount - exp
                    // var finalProfit = (companyProfit + re_commision).toFixed(2);
                    // console.log("GL  >>>>>", companyProfit, " + " , re_commision, " = ", finalProfit);
                    obj = {
                        "LR_Date": r.lrdate,
                        "G_I_No": r.newgatepass,
                        "LrNo": r.lrno,
                        "From": r.from,
                        "Destination": r.to,
                        "Consignne": r.consignne,
                        "Truckno": r.truckno,
                        "Ownername": r.ownername,
                        // "Vehicletype":r.vehicletype,
                        "km" : r.newkm,
                        "C_WT": r.cweight,
                        "C_Rate": r.newrate,
                        "C_Freight": r.newamount,
                        "P_Rate": r.rate,
                        "P_Freight": r.vamount,
                        "Commision": (r.newamount - r.vamount ).toFixed(2),
                        "gps": 0,
                        "GL_Adv": r.totaltruckexpences,
                        "Ex_EXp":0,
                        "Party_Adv": r.padvance,
                        "D_Qty": r.dqty,
                        "D_Amt": r.damount,
                        "Profit": (r.newamount - r.vamount ).toFixed(2),  
                    };
                } else {
                    // console.log("Other  >>>>>", r.ownername);
                    obj = {
                        "LR_Date": r.lrdate,
                        "G_I_No": r.newgatepass,
                        "LrNo": r.lrno,
                        "From": r.from,
                        "Destination": r.to,
                        "Consignne": r.consignne,
                        "Truckno": r.truckno,
                        "Ownername": r.ownername,
                        // "Vehicletype":r.vehicletype,
                        "km" : r.newkm,
                        "C_WT": r.cweight,
                        "C_Rate": r.newrate,
                        "C_Freight": r.newamount,
                        "P_Rate": r.rate,
                        "P_Freight": r.vamount,
                        "Commision": (r.newamount - r.vamount ).toFixed(2),
                        "gps": 0,
                        "GL_Adv": r.totaltruckexpences,
                        "Ex_EXp":0,
                        "Party_Adv": r.padvance,
                        "D_Qty": r.dqty,
                        "D_Amt": r.damount,
                        "Profit": (r.newamount - r.vamount ).toFixed(2),  
                    };
                }
                
                resultArray.push(obj)
            })
            cb(false, resultArray);
            // cb(false, result);
        }).catch(function (err) {
            cb(err);
        });
    };


    var end = momentTZ(req.query.end_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD');
    var endDate = new Date(end)
    endDate.setUTCHours(23,59,59,999);
    matchCondition.lrdate = {
        // $lte: new Date(momentTZ(req.query.end_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD')),
        $gte: new Date(momentTZ(req.query.start_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD')),
        $lte: endDate
    };

    matchCondition.site = {
        $eq: req.query.site,
    };
    // }

    if (req.query.start_date && req.query.site) {
        // matchCondition.lrdate = {
        //     // new Date(req.query.start_date),
        // };
        matchCondition.site = {
            $eq: req.query.site,
        };
    }


    fetchData(matchCondition, function (err, result) {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        res.send(result);
    });

});


router.get('/dispatch_summary', function (req, res, next) {

    var page, limit, offset, reqArray, data, siteArray, tanameArray, matchConditionTA;

    page = req.query.page ? req.query.page : 1;
    limit = req.query.limit ? req.query.limit : 50;
    offset = (page - 1) * limit;

    matchCondition = {};

    var fetchData = function (matchCondition, cb) {
       
        console.log(' Match Condition >>>>>>>>> test', matchCondition);

        // Billty.find(matchCondition).skip(offset).limit(100).then(function(result) {
        Billty.aggregate([
            {
                $match: matchCondition,
            }, {
                $group: {
                    _id: "$site",
                    trip: {
                        $sum: 1
                    },
                    ton: {
                        $sum: '$actualweight'
                    },
                    // net_profit: {(r.newamount - r.vamount )
                    //     $sum: 0
                    // },
                    Co_Trips: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Company"] }, 1, 0]
                        }
                    },
                    A_Trips: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Attached"] }, 1, 0]
                        }
                    },
                    Co_Tons: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Company"] }, "$actualweight", 0]
                        }
                    },
                    A_Tons: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Attached"] }, "$actualweight", 0]
                        }
                    },
                    Co_Amt: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Company"] }, "$newamount", 0]
                        }
                    },
                    Co_Advance: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Company"] }, "$Padvance", 0]
                        }
                    },
                    Co_Expences: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Company"] }, "$totaltruckexpences", 0]
                        }
                    },
                    Co_D_Qty: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Company"] }, "$dqty", 0]
                        }
                    },
                    Co_D_Amount: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Company"] }, "$damount", 0]
                        }
                    },
                    A_Amt: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Attached"] }, "$newamount", 0]
                        }
                    },
                    VA_Amt: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Company"] }, "$vamount", 0]
                        }
                    },
                    AA_Amt: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Attached"] }, "$vamount", 0]
                        }
                    },
                    A_Expences: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Attached"] }, "$totaltruckexpences", 0]
                        }
                    },
                    A_Ex_Expences: {
                        $sum: 0
                    },
                    A_D_Qty: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Attached"] }, "$dqty", 0]
                        }
                    },
                    A_D_Amt: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Attached"] }, "$damount", 0]
                        }
                    }

                }
                
            },
            { "$sort": { "_id": 1 } }
        ]).then(function (result) {
            var data = result;
            // console.log(" >>> ", result);
            result.forEach(r => {

                console.log("site  >>>", r._id)

                
                // console.log(r.A_D_Amt);
                // console.log(r.A_Expences)
                
                var re_commision = r.Co_Amt - r.VA_Amt ;
                r.Co_profit = re_commision;
                r.A_profit = r.A_Amt - r.AA_Amt;
                r.net_profit = Number(re_commision) + Number(r.A_Amt - r.AA_Amt);
                r.o_ratio = (100 * r.Co_Trips) / r.trip;
                r.A_ratio = (100 * r.A_Trips) / r.trip;

            });
            cb(false, data);
        }).catch(function (err) {
            cb(err);
        })
    };
    
    
    var calculatePlantsTruckPosition = function(s) {
        return function (callback) {
            var data = {};
            PlantsTruckPosition.find({"site": s, "status": "Active"}).then((fromResults) => {
                var totalCC = 0;
                var totalTruck = 0;
                var placed = 0;
                var dispatch = 0;
                fromResults.forEach(p => {
                    if ( p.placedtime == null && p.billtytime == null ) {
                        totalTruck = totalTruck + 1;
                        totalCC = totalCC + p.cc;
                        // console.log("placedtime >>>", p.placedtime);
                        // console.log("billtytime >>>", p.billtytime);
                        // console.log("totalTruck >>>");
                    } else if ( p.placedtime != null && p.billtytime == null ) {
                        placed = placed + 1;
                        // console.log("placed >>>");
                    } else {
                        dispatch = dispatch + 1 
                        // console.log("placedtime >>>", p.placedtime);
                        // console.log("billtytime >>>", p.billtytime);
                        // console.log("dispatch >>>");
                    }
                });

                data._id = s; 
                data.truck_at_site = totalTruck;
                data.cc = totalCC;
                data.placed = placed;
                data.dispatch = dispatch;

                callback(false, data);
            }).catch(err => {
                console.log(err.stack);
                callback(err, null);
            });
        };
    };

    // if (req.query.start_date && req.query.end_date) {
    //     var start = momentTZ(req.query.start_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD');
    //     var end = momentTZ(req.query.end_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD');
    //     matchCondition.lrdate = {
    //         // $eq: req.query.start_date
    //         $gte: new Date(start),
    //         $lte: new Date(end)
    //     };

    // }

    if (req.query.start_date && req.query.end_date) {
        var start = momentTZ(req.query.start_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD');
        var end = momentTZ(req.query.end_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD');
        var startDate = new Date(start);
        var endDate = new Date(end)
        startDate.setUTCHours(00,00,00,000);
        endDate.setUTCHours(23,59,59,999);

        console.log('startdate >>>>>>>', startDate);
        console.log('enddate >>>>>>>', endDate);
    
        matchCondition.lrdate = {
            $gte: startDate,
            $lte: endDate
            // $gte: new Date(req.query.start_date),
            // $lte: endDate


            // $lte: new Date(req.query.end_date)

        };
    }

    fetchData(matchCondition, function (err, result) {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        // res.send(result);
        

        PlantsTruckPosition.aggregate( [ { $group : { _id : "$site" } } ] ).then((sitesResults) => {
            var sitesArray = [];
            sitesResults.forEach(r => {
                sitesArray.push(calculatePlantsTruckPosition(r._id));
            });
            
            async.parallel(sitesArray, function(err, asyncResult) {
                var finalArray = result;
                asyncResult.forEach(m => {
                    var flag = 0;
                    finalArray.forEach(f => {                    
                        if(f._id == m._id) {
                            console.log("Both  Same >>> ", m.site);
                            f.truck_at_site = m.truck_at_site;
                            f.cc = m.cc;
                            f.placed = m.placed;
                            f.dispatch = m.dispatch;
                            flag = 1
                        } 
                    });

                    if (flag == 0) {
                        finalArray.push(m);
                    }
                });
                console.log("ERROR >>> ", err);
                res.send({ "result": finalArray });  
            });
    
        }).catch(err => {
            console.log(err.stack);
            res.send(err);
        });

    });

});

router.get('/dispatch_summary_site', function (req, res, next) {

    var page, limit, offset, reqArray, data, siteArray, tanameArray, matchConditionTA;

    page = req.query.page ? req.query.page : 1;
    limit = req.query.limit ? req.query.limit : 50;
    offset = (page - 1) * limit;

    matchCondition = {};

    var fetchData = function (matchCondition, cb) {
       
        console.log(' Match Condition >>>>>>>>>', matchCondition);

        // Billty.find(matchCondition).skip(offset).limit(100).then(function(result) {
        Billty.aggregate([
            {
                $match: matchCondition,
            }, {
                $group: {
                    _id: "$site",
                    trip: {
                        $sum: 1
                    },
                    ton: {
                        $sum: '$actualweight'
                    },
                    // net_profit: {(r.newamount - r.vamount )
                    //     $sum: 0
                    // },
                    Co_Trips: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Company"] }, 1, 0]
                        }
                    },
                    A_Trips: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Attached"] }, 1, 0]
                        }
                    },
                    Co_Tons: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Company"] }, "$actualweight", 0]
                        }
                    },
                    A_Tons: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Attached"] }, "$actualweight", 0]
                        }
                    },
                    Co_Amt: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Company"] }, "$newamount", 0]
                        }
                    },
                    Co_Advance: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Company"] }, "$Padvance", 0]
                        }
                    },
                    Co_Expences: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Company"] }, "$totaltruckexpences", 0]
                        }
                    },
                    Co_D_Qty: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Company"] }, "$dqty", 0]
                        }
                    },
                    Co_D_Amount: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Company"] }, "$damount", 0]
                        }
                    },
                    A_Amt: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Attached"] }, "$newamount", 0]
                        }
                    },
                    VA_Amt: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Company"] }, "$vamount", 0]
                        }
                    },
                    AA_Amt: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Attached"] }, "$vamount", 0]
                        }
                    },
                    A_Expences: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Attached"] }, "$totaltruckexpences", 0]
                        }
                    },
                    A_Ex_Expences: {
                        $sum: 0
                    },
                    A_D_Qty: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Attached"] }, "$dqty", 0]
                        }
                    },
                    A_D_Amt: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Attached"] }, "$damount", 0]
                        }
                    }

                }
                
            },
            { "$sort": { "_id": 1 } }
        ]).then(function (result) {
            var data = result;
            // console.log(" >>> ", result);
            result.forEach(r => {

                console.log("site  >>>", r._id)

                
                // console.log(r.A_D_Amt);
                // console.log(r.A_Expences)
                
                var re_commision = r.Co_Amt - r.VA_Amt ;
                r.Co_profit = re_commision;
                r.A_profit = r.A_Amt - r.AA_Amt;
                r.net_profit = Number(re_commision) + Number(r.A_Amt - r.AA_Amt);
                r.o_ratio = (100 * r.Co_Trips) / r.trip;
                r.A_ratio = (100 * r.A_Trips) / r.trip;

            });
            cb(false, data);
        }).catch(function (err) {
            cb(err);
        })
    };
    
    
    var calculatePlantsTruckPosition = function(s) {
        return function (callback) {
            var data = {};
            PlantsTruckPosition.find({"site": s, "status": "Active"}).then((fromResults) => {
                var totalCC = 0;
                var totalTruck = 0;
                var placed = 0;
                var dispatch = 0;
                fromResults.forEach(p => {
                    if ( p.placedtime == null && p.billtytime == null ) {
                        totalTruck = totalTruck + 1;
                        totalCC = totalCC + p.cc;
                        // console.log("placedtime >>>", p.placedtime);
                        // console.log("billtytime >>>", p.billtytime);
                        // console.log("totalTruck >>>");
                    } else if ( p.placedtime != null && p.billtytime == null ) {
                        placed = placed + 1;
                        // console.log("placed >>>");
                    } else {
                        dispatch = dispatch + 1 
                        // console.log("placedtime >>>", p.placedtime);
                        // console.log("billtytime >>>", p.billtytime);
                        // console.log("dispatch >>>");
                    }
                });

                data._id = s; 
                data.truck_at_site = totalTruck;
                data.cc = totalCC;
                data.placed = placed;
                data.dispatch = dispatch;

                callback(false, data);
            }).catch(err => {
                console.log(err.stack);
                callback(err, null);
            });
        };
    };

    if (req.query.start_date && req.query.end_date) {
        var start = momentTZ(req.query.start_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD');
        var end = momentTZ(req.query.end_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD');
        matchCondition.lrdate = {
            $gte: new Date(start),
            $lte: new Date(end)
        };
    }

    if (req.query.site) {
        matchCondition.site = req.query.site;
    }

    console.log('matchCondition =====>', matchCondition);

    fetchData(matchCondition, function (err, result) {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        // res.send(result);
        

        PlantsTruckPosition.aggregate( [ 
            {
                $match: matchCondition,
            },            
            { $group : { _id : "$site" } } ] ).then((sitesResults) => {
            var sitesArray = [];
            sitesResults.forEach(r => {
                sitesArray.push(calculatePlantsTruckPosition(r._id));
            });
            
            async.parallel(sitesArray, function(err, asyncResult) {
                var finalArray = result;
                asyncResult.forEach(m => {
                    var flag = 0;
                    finalArray.forEach(f => {                    
                        if(f._id == m._id) {
                            console.log("Both  Same >>> ", m.site);
                            f.truck_at_site = m.truck_at_site;
                            f.cc = m.cc;
                            f.placed = m.placed;
                            f.dispatch = m.dispatch;
                            flag = 1
                        } 
                    });

                    if (flag == 0) {
                        finalArray.push(m);
                    }
                });
                console.log("ERROR >>> ", err);
                res.send({ "result": finalArray });  
            });
    
        }).catch(err => {
            console.log(err.stack);
            res.send(err);
        });

    });

});

router.get('/agentwise_ownfleet_report', function (req, res, next) {
    var page, limit, offset, reqArray, data, truckNoArray, tanameArray, matchConditionTA;

    page = req.query.page ? req.query.page : 1;
    limit = req.query.limit ? req.query.limit : 50;
    offset = (page - 1) * limit;

    reqArray = [];
    data = [];
    truckNoArray = [];
    tanameArray = [];
    matchCondition = {};
    matchConditionTA = "";

    var countTotal = function (matchCondition, cb) {
        Billty.find(matchCondition).count().then(function (totalCount) {
            cb(false, totalCount);
        }).catch(function (err) {
            cb(err);
        });
    };

    var fetchData = function (matchCondition, cb) {
        // Billty.find(matchCondition).skip(offset).limit(100).then(function(result) {
        Billty.aggregate([
            {
                $match: matchCondition,
            }, {
                $group: {
                    _id: "$site",
                    mton: { $sum: "$actualweight" },
                    dqty: { $sum: "$dqty" },
                    damt: { $sum: "$damount" },
                    finalamount: { $sum: "$finalamount" },
                    damount: { $sum: "$damount" },
                    newamount: { $sum: "$totaltruckexpences" },
                    maint: { $sum: "$maint" },
                    tyre: { $first: "$tyre" },
                    tcc: { $first: "$tcc" },
                    total: {
                        $sum: 1
                    },
                    Co_Tons: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Company"] }, "$actualweight", 0]
                        }
                    },
                }
            }, {
                $sort: { "total": 1 }
            }, {
                "$skip": offset
            }, {
                "$limit": 100
            }]).then(function (result) {

                var data = result;
                result.forEach(r => {
                    // console.log(r.mton);

                    result.forEach(gr => {
                        if (r._id === gr._id) {
                            r.trips = gr.total;
                        }
                    });
                    var dAmount24, amount23,
                        amountdetail,
                        amountSum,
                        amount,
                        profit,
                        net_bal,
                        obj;
                    dAmount24 = r.damount;
                    amount23 = r.newamount

                    amountSum = Number(amount23) + Number(dAmount24);

                    amount = Number(amountSum.toFixed(2));
                    profit_row = Number(r.finalamount) - Number(amount);
                    net_bal_row = Number(profit_row) - Number(r.maint);

                    profit = profit_row.toFixed(2)
                    net_bal = net_bal_row.toFixed(2)
                    r.amount = amount;
                    r.profit = profit;
                    if (net_bal) {
                        r.net_bal = 0;
                    }
                    else {
                        r.net_bal = net_bal;
                    }


                    truckNoArray.push(r._id);  // _id as truckNo
                });

                // get Truck traffic agent name 
                Trucks.find({ truckno: { $in: truckNoArray } }).then(function (trucksResult) {

                    trucksResult.forEach(tr => {
                        data.forEach((r, i) => {
                            if (tr.truckno == r._id) {
                                data[i].taname = tr.taname; // add traffic agent name
                                //console.log(" >> ", data);
                            }
                        });
                    });

                    data.forEach(r => {
                        console.log(r);
                        finalamount = Number(r.finalamount.toFixed(2))
                        obj = {
                            "site": r._id,
                            "trips": r.trips,
                            "mton": r.mton,
                            "dqty": r.dqty,
                            "damt": r.damt,
                            "finalamount": finalamount,
                            "amount": r.amount,
                            "tyre": r.tyre,
                            "tcc": r.tcc,
                            "taname": r.taname,
                            "maint": "",
                            "profit": r.profit,
                            "net_bal": r.net_bal,
                            "c_ton": r.Co_Tons
                        };
                        reqArray.push(obj);
                    });
                    cb(false, { results: reqArray });
                }).catch(function (err) {
                    cb(err);
                });

            }).catch(function (err) {
                cb(err);
            });
    };

    var trafficAgentWiseData = function (matchCondition, cb) {

        // get trucks by traffic agent name 
        Trucks.find({ taname: req.query.traffic_agent }).then(function (trucksResult) {
            var truckIds = [];
            trucksResult.forEach(t => {
                truckIds.push(t.truckno);
            });

            matchCondition.truckno = { $in: truckIds };

            Billty.find(matchCondition).count().then(function (totalCount) {
                Billty.find(matchCondition).skip(offset).limit(limit).then(function (result) {

                    var data = [];

                    result.forEach(r => {
                        data.push(r.toJSON());
                    });

                    Billty.aggregate([{
                        $group: {
                            _id: "$truckno",
                            total: {
                                $sum: 1
                            }
                        }
                    }]).then(function (groupedResult) {
                        data.forEach(r => {
                            groupedResult.forEach(gr => {
                                if (r.truckno === gr._id) {
                                    r.trips = gr.total;
                                }
                            });
                            var dAmount24,
                                amountdetail,
                                amountSum,
                                amount,
                                profit,
                                net_bal,
                                obj;
                            dAmount24 = r.damount;
                            amountdetail = r.totaltruckexpences;
                            // console.log(r.damount);
                            // amountdetail = r.transactiondetails;

                            // amountdetail.forEach(rr => {
                            //     amountSum = Number(rr.amount) + Number(dAmount24);
                            //     // console.log("amount24 >>>", dAmount24);
                            //     // console.log("amount23 >>>", rr.amount);
                            //     // console.log("SUM >>>", amountSum);
                            //     // console.log("-----");
                            // });
                            amount = Number(amountSum.toFixed(2));
                            profit = Number(r.finalamount) - Number(amount);
                            net_bal = Number(profit) - Number(r.maint);
                            obj = {
                                "truckno": r.truckno,
                                "trips": r.trips,
                                "finalamount": r.finalamount,
                                "amount": amount,
                                "tyre": r.tyre,
                                "tcc": r.tcc,
                                "taname": req.query.traffic_agent,
                                "maint": "",
                                "profit": profit.toFixed(2),
                                "net_bal": net_bal
                            };
                            reqArray.push(obj);
                        });
                        cb(false, { results: reqArray, total: totalCount });
                    }).catch(function (err) {
                        cb(err);
                    });
                }).catch(function (err) {
                    cb(err);
                });
            }).catch(function (err) {
                cb(err);
            });
        }).catch(function (err) {
            cb(err);
        });
    };

    // Match Condition For year
    if (req.query.year) {
        //matchCondition.lrdate = Number(req.query.year);
        //2019-02-06T00:00:00.000+0000

        startYear = req.query.year + "-01-01";
        endYear = req.query.year + "-12-31";

        matchCondition.lrdate = {
            $gte: new Date(startYear),
            $lte: new Date(endYear)

        };
        // console.log(matchCondition);
    }
    // Match Condition For Tyre
    if (req.query.tyre) {
        matchCondition.tyre = req.query.tyre;
    }
    //match Condition For TruckNo
    if (req.query.truck_no) {
        matchCondition.truckno = req.query.truck_no;
    }
    //match Condition For Traffic Agent
    if (req.query.traffic_agent) {
        trafficAgentWiseData(matchCondition, function (err, result) {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            res.send(result);
        });
    } else {
        countTotal(matchCondition, function (err, totalResult) {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            fetchData(matchCondition, function (err, result) {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                result.total = totalResult;
                res.send(result);
            });
        });
    }

});

router.get('/own_fleet_report_by_site_monthly', function (req, res, next) {
    matchCondition = {};
    var getBilltyData = function (matchCondition, cb) {
        Billty.aggregate([
            {
                $match: matchCondition,
            },
            {
                $group:{
                    _id: { $substr: ['$lrdate', 5, 2] },
                    trips: {
                        $sum: 1
                    },
                    tons: {
                        $sum: '$actualweight'
                    },
                    JSTC: {
                        $sum: 0
                    },
                    other: {
                        $sum: 0
                    },
                    party: {
                        $sum: '$padvance'
                    },
                    dqty: {
                        $sum: "$dqty"
                    },
                    damt: {
                        $sum: "$damount"
                    },
                }
            }
        ]).sort({ _id: 1 }).then(function (results){
            var month = new Array();
            month[1] = "January";
            month[2] = "February";
            month[3] = "March";
            month[4] = "April";
            month[5] = "May";
            month[6] = "June";
            month[7] = "July";
            month[8] = "August";
            month[9] = "September";
            month[10] = "October";
            month[11] = "November";
            month[12] = "December";

            results.forEach(r => {
                r.month = month[parseInt(r._id)];
            })
            var data = results;
            cb(false, data);
        }).catch(function (err) {
            console.log(err);
            cb(err, false);
        });
        
    };

    if (req.query.site) {
        //todo update using param
        startYear =  "2019-01-01";
        endYear = "2019-12-31";

        matchCondition.site = {
            $eq: req.query.site
        };
        matchCondition.lrdate = {
            $lte: new Date(momentTZ(endYear, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD')),
            $gte: new Date(momentTZ(startYear, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD'))
        };
        matchCondition.vehicletype = {
            $eq: 'Company'
        };
    }

    getBilltyData(matchCondition, function (err, result) {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        console.log(matchCondition);
        res.send(result);
    });

});

router.get('/own_fleet_report_by_site', function (req, res, next) {
    matchCondition = {};
    var getBilltyData = function (matchCondition, cb) {
        Billty.find(matchCondition).sort({ lrdate: 1 ,truckno: 1 }).then(function(results){
            var resultArray = [];
            results.forEach(r => {
                // todo chheck parameters 
                obj = {
                    "lrdate": r.lrdate,
                    "newgatepass": r.newgatepass,
                    "lrno": r.lrno,
                    "from": r.from,
                    "to": r.to,
                    "consignne": r.consignne,
                    "truckno": req.truckno,
                    "km" : 0,
                    "cweight": r.cweight,
                    "newrate": r.newrate,
                    "newamount": r.newamount,
                    "rate": r.rate,
                    "vamount": r.vamount,
                    "dqty": r.dqty,
                    "damount": r.damount,
                    "totaltruckexpences": r.totaltruckexpences,
                    "padvance": r.padvance,
                    "ownername": r.ownername,
                    "truckno": r.truckno
                };
                resultArray.push(obj)
            })
            
            cb(false, resultArray);
        }).catch(function (err) {
            cb(err);
        });
        
    };

    if (req.query.site) {
        matchCondition.lrdate = {
            //$eq: new Date('2019-03-02')
            $lte: new Date(momentTZ(req.query.end_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD')),
            $gte: new Date(momentTZ(req.query.start_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD'))
        };
        matchCondition.site = {
            $eq: req.query.site
        };
        matchCondition.vehicletype = {
            $eq: 'Company'
        };
    }


    getBilltyData(matchCondition, function (err, result) {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        console.log(' Match Vinu Condition ',matchCondition);
        res.send(result);
    });

});

router.get('/sitewise_own_fleet_report', function (req, res, next) {

    matchCondition = {};
    var getBilltyData = function (matchCondition, cb) {
        Billty.aggregate([
            {
                $match: matchCondition,
            }, {
                $group: {
                    _id: '$site',
                    trips: {
                        $sum: 1
                    },
                    tons: {
                        $sum: '$actualweight'
                    },
                    jstc: {
                        $sum: '$totaltruckexpences'
                    },
                    other: {
                        $sum: 0
                    },
                    party: {
                        $sum: 0
                    },
                    jstc: {
                        $sum: "$padvance"
                    },
                    dqty: {
                        $sum: "$dqty"
                    },
                    damt: {
                        $sum: "$damount"
                    },
                    newamt: {
                        $sum: "$newamount"
                    },
                    vamt: {
                        $sum: "$vamount"
                    },
                    finalamount: { $sum: "$finalamount" },
                    damount: { $sum: "$damount" },

                }
            },
            { "$sort": { "_id": 1 } }
        ]).then(function (results) {
            results.forEach(r => {
                amountSum = r.damt + r.jstc
                profit = r.newamt - r.vamt
                r.profit = profit.toFixed(2)
            });
            var data = results;
            console.log(results);
            cb(false, data);
        }).catch(function (err) {
            console.log(err);
            cb(err, false);
        });
    };

    if (req.query.start_date) {
        var start = momentTZ(req.query.start_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD');
        var end = momentTZ(req.query.end_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD');
        matchCondition.lrdate = {
            $gte: new Date(start),
            $lte: new Date(end)
        };
        matchCondition.vehicletype = {
            $eq: 'Company'
        };
    }

    getBilltyData(matchCondition, function (err, result) {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        console.log(matchCondition);
        res.send(result);
    });
});

router.get('/sitewise_ownfleet_report', function (req, res, next) {
    var page, limit, offset, reqArray, data, truckNoArray, tanameArray, matchConditionTA;

    page = req.query.page ? req.query.page : 1;
    limit = req.query.limit ? req.query.limit : 50;
    offset = (page - 1) * limit;

    reqArray = [];
    data = [];
    truckNoArray = [];
    tanameArray = [];
    matchCondition = {};
    matchConditionTA = "";

    var countTotal = function (matchCondition, cb) {
        Billty.find(matchCondition).count().then(function (totalCount) {
            cb(false, totalCount);
        }).catch(function (err) {
            cb(err);
        });
    };

    var fetchData = function (matchCondition, cb) {
        // Billty.find(matchCondition).skip(offset).limit(100).then(function(result) {
        Billty.aggregate([
            {
                $match: matchCondition,
            }, {
                $group: {
                    _id: "$site",
                    mton: { $sum: "$actualweight" },
                    dqty: { $sum: "$dqty" },
                    damt: { $sum: "$damount" },
                    finalamount: { $sum: "$finalamount" },
                    damount: { $sum: "$damount" },
                    newamount: { $sum: "$totaltruckexpences" },
                    Party: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Company"] }, "$padvance", 0]
                        }
                    },
                    maint: { $sum: "$maint" },
                    tyre: { $first: "$tyre" },
                    tcc: { $first: "$tcc" },
                    total: {
                        $sum: 1
                    },
                    Co_Tons: {
                        "$sum": {
                            "$cond": [{ "$eq": ["$vehicletype", "Company"] }, "$actualweight", 0]
                        }
                    },
                }
            }, {
                $sort: { "total": 1 }
            }, {
                "$skip": offset
            }, {
                "$limit": 100
            }]).then(function (result) {

                var data = result;
                result.forEach(r => {
                    // console.log(r.mton);

                    result.forEach(gr => {
                        if (r._id === gr._id) {
                            r.trips = gr.total;
                        }
                    });
                    var dAmount24, amount23,
                        amountdetail,
                        amountSum,
                        amount,
                        profit,
                        net_bal,
                        obj;
                    dAmount24 = r.damount;
                    amount23 = r.newamount

                    amountSum = Number(amount23) + Number(dAmount24);

                    amount = Number(amountSum.toFixed(2));
                    profit_row = Number(r.finalamount) - Number(amount);
                    net_bal_row = Number(profit_row) - Number(r.maint);

                    profit = profit_row.toFixed(2)
                    net_bal = net_bal_row.toFixed(2)
                    r.amount = amount;
                    r.profit = profit;
                    if (net_bal) {
                        r.net_bal = 0;
                    }
                    else {
                        r.net_bal = net_bal;
                    }


                    truckNoArray.push(r._id);  // _id as truckNo
                });

                // get Truck traffic agent name 
                Trucks.find({ truckno: { $in: truckNoArray } }).then(function (trucksResult) {

                    trucksResult.forEach(tr => {
                        data.forEach((r, i) => {
                            if (tr.truckno == r._id) {
                                data[i].taname = tr.taname; // add traffic agent name
                                //console.log(" >> ", data);
                            }
                        });
                    });

                    data.forEach(r => {
                        finalamount = Number(r.finalamount.toFixed(2))
                        obj = {
                            "site": r._id,
                            "trips": r.trips,
                            "mton": r.mton,
                            "dqty": r.dqty,
                            "damt": r.damt,
                            "finalamount": finalamount,
                            "amount": r.amount,
                            "tyre": r.tyre,
                            "tcc": r.tcc,
                            "taname": r.taname,
                            "maint": "",
                            "profit": r.profit,
                            "net_bal": r.net_bal,
                            "c_ton": r.Co_Tons
                        };
                        reqArray.push(obj);
                    });
                    cb(false, { results: reqArray });
                }).catch(function (err) {
                    cb(err);
                });

            }).catch(function (err) {
                cb(err);
            });
    };

    var trafficAgentWiseData = function (matchCondition, cb) {

        // get trucks by traffic agent name 
        Trucks.find({ taname: req.query.traffic_agent }).then(function (trucksResult) {
            var truckIds = [];
            trucksResult.forEach(t => {
                truckIds.push(t.truckno);
            });

            matchCondition.truckno = { $in: truckIds };

            Billty.find(matchCondition).count().then(function (totalCount) {
                Billty.find(matchCondition).skip(offset).limit(limit).then(function (result) {

                    var data = [];

                    result.forEach(r => {
                        data.push(r.toJSON());
                    });

                    Billty.aggregate([{
                        $group: {
                            _id: "$truckno",
                            total: {
                                $sum: 1
                            }
                        }
                    }]).then(function (groupedResult) {
                        data.forEach(r => {
                            groupedResult.forEach(gr => {
                                if (r.truckno === gr._id) {
                                    r.trips = gr.total;
                                }
                            });
                            var dAmount24,
                                amountdetail,
                                amountSum,
                                amount,
                                profit,
                                net_bal,
                                obj;
                            dAmount24 = r.damount;
                            amountdetail = r.totaltruckexpences;
                            // console.log(r.damount);
                            // amountdetail = r.transactiondetails;

                            // amountdetail.forEach(rr => {
                            //     amountSum = Number(rr.amount) + Number(dAmount24);
                            //     // console.log("amount24 >>>", dAmount24);
                            //     // console.log("amount23 >>>", rr.amount);
                            //     // console.log("SUM >>>", amountSum);
                            //     // console.log("-----");
                            // });
                            amount = Number(amountSum.toFixed(2));
                            profit = Number(r.finalamount) - Number(amount);
                            net_bal = Number(profit) - Number(r.maint);
                            obj = {
                                "truckno": r.truckno,
                                "trips": r.trips,
                                "finalamount": r.finalamount,
                                "amount": amount,
                                "tyre": r.tyre,
                                "tcc": r.tcc,
                                "taname": req.query.traffic_agent,
                                "maint": "",
                                "profit": profit.toFixed(2),
                                "net_bal": net_bal

                            };
                            reqArray.push(obj);
                        });
                        cb(false, { results: reqArray, total: totalCount });
                    }).catch(function (err) {
                        cb(err);
                    });
                }).catch(function (err) {
                    cb(err);
                });
            }).catch(function (err) {
                cb(err);
            });
        }).catch(function (err) {
            cb(err);
        });
    };

    // Match Condition For year
    if (req.query.year) {
        //matchCondition.lrdate = Number(req.query.year);
        //2019-02-06T00:00:00.000+0000

        startYear = req.query.year + "-01-01";
        endYear = req.query.year + "-12-31";

        matchCondition.lrdate = {
            $gte: new Date(startYear),
            $lte: new Date(endYear)

        };
        // console.log(matchCondition);
    }
    // Match Condition For Tyre
    if (req.query.tyre) {
        matchCondition.tyre = req.query.tyre;
    }
    //match Condition For TruckNo
    if (req.query.truck_no) {
        matchCondition.truckno = req.query.truck_no;
    }
    //match Condition For Traffic Agent
    if (req.query.traffic_agent) {
        trafficAgentWiseData(matchCondition, function (err, result) {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            res.send(result);
        });
    } else {
        countTotal(matchCondition, function (err, totalResult) {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            fetchData(matchCondition, function (err, result) {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                console.log(result);
                result.total = totalResult;
                res.send(result);
            });
        });
    }

});

router.get('/ownfleet_report', function (req, res, next) {
    var page, limit, offset, reqArray, data, truckNoArray, tanameArray, matchConditionTA;

    page = req.query.page ? req.query.page : 1;
    limit = req.query.limit ? req.query.limit : 50;
    offset = (page - 1) * limit;

    reqArray = [];
    data = [];
    truckNoArray = [];
    tanameArray = [];
    matchCondition = {};
    matchConditionTA = "";

    var countTotal = function (matchCondition, cb) {
        Billty.find(matchCondition).count().then(function (totalCount) {
            cb(false, totalCount);
        }).catch(function (err) {
            cb(err);
        });
    };

    var fetchData = function (matchCondition, cb) {
        // Billty.find(matchCondition).skip(offset).limit(100).then(function(result) {
        Billty.aggregate([
            {
                $match: matchCondition,
            }, {
                $group: {
                    _id: "$truckno",
                    mton: { $sum: "$actualweight" },
                    dqty: { $sum: "$dqty" },
                    damt: { $sum: "$damount" },
                    finalamount: { $sum: "$finalamount" },
                    damount: { $sum: "$damount" },
                    newamount: { $sum: "$totaltruckexpences" },
                    maint: { $sum: "$maint" },
                    tyre: { $first: "$tyre" },
                    tcc: { $first: "$tcc" },
                    total: {
                        $sum: 1
                    }
                }
            }, {
                $sort: { "total": 1 }
            }, {
                "$skip": offset
            }, {
                "$limit": 100
            }]).then(function (result) {

                var data = result;
                result.forEach(r => {
                    // console.log(r.mton);

                    result.forEach(gr => {
                        if (r._id === gr._id) {
                            r.trips = gr.total;
                        }
                    });
                    var dAmount24, amount23,
                        amountdetail,
                        amountSum,
                        amount,
                        profit,
                        net_bal,
                        obj;
                    dAmount24 = r.damount;
                    amount23 = r.newamount

                    amountSum = Number(amount23) + Number(dAmount24);

                    amount = Number(amountSum.toFixed(2));
                    profit_row = Number(r.finalamount) - Number(amount);
                    net_bal_row = Number(profit_row) - Number(r.maint);

                    profit = profit_row.toFixed(2)
                    net_bal = net_bal_row.toFixed(2)
                    r.amount = amount;
                    r.profit = profit;
                    if (net_bal) {
                        r.net_bal = 0;
                    }
                    else {
                        r.net_bal = net_bal;
                    }


                    truckNoArray.push(r._id);  // _id as truckNo
                });

                // get Truck traffic agent name 
                Trucks.find({ truckno: { $in: truckNoArray } }).then(function (trucksResult) {

                    trucksResult.forEach(tr => {
                        data.forEach((r, i) => {
                            if (tr.truckno == r._id) {
                                data[i].taname = tr.taname; // add traffic agent name
                                //console.log(" >> ", data);
                            }
                        });
                    });

                    data.forEach(r => {
                        finalamount = Number(r.finalamount.toFixed(2))
                        obj = {
                            "truckno": r._id,
                            "trips": r.trips,
                            "mton": r.mton,
                            "dqty": r.dqty,
                            "damt": r.damt,
                            "finalamount": finalamount,
                            "amount": r.amount,
                            "tyre": r.tyre,
                            "tcc": r.tcc,
                            "taname": r.taname,
                            "maint": "",
                            "profit": r.profit,
                            "net_bal": r.net_bal
                        };
                        reqArray.push(obj);
                    });
                    cb(false, { results: reqArray });
                }).catch(function (err) {
                    cb(err);
                });

            }).catch(function (err) {
                cb(err);
            });
    };

    var trafficAgentWiseData = function (matchCondition, cb) {

        // get trucks by traffic agent name 
        Trucks.find({ taname: req.query.traffic_agent }).then(function (trucksResult) {
            var truckIds = [];
            trucksResult.forEach(t => {
                truckIds.push(t.truckno);
            });

            matchCondition.truckno = { $in: truckIds };

            Billty.find(matchCondition).count().then(function (totalCount) {
                Billty.find(matchCondition).skip(offset).limit(limit).then(function (result) {

                    var data = [];

                    result.forEach(r => {
                        data.push(r.toJSON());
                    });

                    Billty.aggregate([{
                        $group: {
                            _id: "$truckno",
                            total: {
                                $sum: 1
                            }
                        }
                    }]).then(function (groupedResult) {
                        data.forEach(r => {
                            groupedResult.forEach(gr => {
                                if (r.truckno === gr._id) {
                                    r.trips = gr.total;
                                }
                            });
                            var dAmount24,
                                amountdetail,
                                amountSum,
                                amount,
                                profit,
                                net_bal,
                                obj;
                            dAmount24 = r.damount;
                            amountdetail = r.totaltruckexpences;
                            // console.log(r.damount);
                            // amountdetail = r.transactiondetails;

                            // amountdetail.forEach(rr => {
                            //     amountSum = Number(rr.amount) + Number(dAmount24);
                            //     // console.log("amount24 >>>", dAmount24);
                            //     // console.log("amount23 >>>", rr.amount);
                            //     // console.log("SUM >>>", amountSum);
                            //     // console.log("-----");
                            // });
                            amount = Number(amountSum.toFixed(2));
                            profit = Number(r.finalamount) - Number(amount);
                            net_bal = Number(profit) - Number(r.maint);
                            obj = {
                                "truckno": r.truckno,
                                "trips": r.trips,
                                "finalamount": r.finalamount,
                                "amount": amount,
                                "tyre": r.tyre,
                                "tcc": r.tcc,
                                "taname": req.query.traffic_agent,
                                "maint": "",
                                "profit": profit.toFixed(2),
                                "net_bal": net_bal
                            };
                            reqArray.push(obj);
                        });
                        cb(false, { results: reqArray, total: totalCount });
                    }).catch(function (err) {
                        cb(err);
                    });
                }).catch(function (err) {
                    cb(err);
                });
            }).catch(function (err) {
                cb(err);
            });
        }).catch(function (err) {
            cb(err);
        });
    };

    // Match Condition For year
    if (req.query.year) {
        //matchCondition.lrdate = Number(req.query.year);
        //2019-02-06T00:00:00.000+0000

        startYear = req.query.year + "-01-01";
        endYear = req.query.year + "-12-31";

        matchCondition.lrdate = {
            $gte: new Date(startYear),
            $lte: new Date(endYear)

        };
        // console.log(matchCondition);
    }
    // Match Condition For Tyre
    if (req.query.tyre) {
        matchCondition.tyre = req.query.tyre;
    }
    //match Condition For TruckNo
    if (req.query.truck_no) {
        matchCondition.truckno = req.query.truck_no;
    }
    //match Condition For Traffic Agent
    if (req.query.traffic_agent) {
        trafficAgentWiseData(matchCondition, function (err, result) {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            res.send(result);
        });
    } else {
        countTotal(matchCondition, function (err, totalResult) {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            fetchData(matchCondition, function (err, result) {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err);
                }
                result.total = totalResult;
                res.send(result);
            });
        });
    }

});

router.get('/ownfleet_truck_report/:truck_no', function (req, res, next) {

    var getFleetTarget = function () {
        return function (cb) {
            FT.findOne({ truckno: req.params.truck_no }).then(function (results) {
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
                    $match: { truckno: req.params.truck_no }
                },
                {
                    $project: {
                        lrdate: { $month: "$lrdate" },
                        finalamount: 1,
                        cweight: 1,
                        dqty: 1,
                        damount: 1,
                        totaltruckexpences: 1,
                    }
                },
                {
                    $group: {
                        _id: "$lrdate",
                        finalamount: {
                            $sum: "$finalamount"
                        },
                        cweight: {
                            $sum: "$cweight"
                        },

                        dqty: {
                            $sum: "$dqty"
                        },

                        damount: {
                            $sum: "$damount"
                        },
                        totaltruckexpences: {
                            $sum: "$totaltruckexpences"
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
                        cweight: "$cweight",
                        finalamount: "$finalamount",
                        dqty: "$dqty",
                        damount: "$damount",
                        totaltruckexpences: "$totaltruckexpences"
                    }
                }
            ]).then(function (results) {
                console.log(results)
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
                    $match: { truckno: req.params.truck_no }
                },
                {
                    $project: {
                        tddate: { $month: "$tddate" },
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

        var fleet_target_data;
        // console.log(results);
        if (results[0]) {
            fleet_target_data = results[0].toJSON();
        } else {
            fleet_target_data = {
                "truckno": req.params.truck_no,
                "months": [
                    {
                        "name": "January",
                        "target": "0"
                    },
                    {
                        "name": "February",
                        "target": "0"
                    },
                    {
                        "name": "March",
                        "target": "0"
                    },
                    {
                        "name": "April",
                        "target": "0"
                    },
                    {
                        "name": "May",
                        "target": "0"
                    },
                    {
                        "name": "June",
                        "target": "0"
                    },
                    {
                        "name": "July",
                        "target": "0"
                    },
                    {
                        "name": "August",
                        "target": "0"
                    },
                    {
                        "name": "September",
                        "target": "0"
                    },
                    {
                        "name": "October",
                        "target": "0"
                    },
                    {
                        "name": "November",
                        "target": "0"
                    },
                    {
                        "name": "December",
                        "target": "0"
                    }
                ],
            };
        }

        var finalData = [], billty_data = [], truck_divert_data = [];

        fleet_target_data.months.forEach(m => {
            var month_number = Number(moment(m.name, 'MMMM').format('M'));

            // add trip, achieved, income and some expenses from billty data
            results[1].forEach(r => {
                if (r.month === month_number) {
                    m.trips = r.trips;
                    m.cweight = r.cweight;
                    m.dqty = r.dqty;
                    m.damount = r.damount;
                    m.achieved = Number(r.finalamount.toFixed(2));
                    m.income = m.achieved;
                    m.expenses = Number(r.damount.toFixed(2)) + Number(r.totaltruckexpences.toFixed(2));
                }
            });

            results[2].forEach(r => {
                if (r.month === month_number) {
                    m.expenses = m.expenses + Number(r.tamt.toFixed(2));
                }
            });

            var profit = m.income - m.expenses;
            m.profit = Number(profit.toFixed(2));
        });

        res.send(fleet_target_data);
    });
});

router.get('/billty_latest', function(req, res, next) {

    var queryBillty = Billty.find({"truckno": req.query.truck_no}).sort({lrdate: -1}).limit(10)
    queryBillty.then(function(result) {
        
        var listArray = [];
        result.forEach(r => {
            obj = { "id": r._id, "lrdate": r.lrdate };
            listArray.push(r);
        });

        res.send({"results": listArray,"total" : result.length});
        // res.send({"results": paginate(listArray, limit, page),"total" : result.length});
    }).catch(function(err) {
        res.send(err);
    });
})

// router.get('/trial_balance_check', function(req, res, next) {
//     var matchCondition = {};
//     var mainArray = [];
//     function onlyUnique(value, index, self) { 
//         return self.indexOf(value) === index;
//     }

   
//     matchCondition.opbal={
//         $exists:true,
//         $ne:null
//     }    

//     if(req.query.site_name) {
//         matchCondition.site = req.query.site_name;
//     }

//     var fetchData = function (matchCondition, cb) {
       
//         // console.log('matchCondition >>> 1', matchCondition);

//         Accounts.find(matchCondition).distinct('accountname').then(function(result) {
//             var mainListArray = [];
//             var accountnameArray = [];  // all destinations array site wise
//             var uniqueAccountnameArray = [];

//             result.forEach(r => {
//                 accountnameArray.push(r);
//                 // mainListArray.push(r);
//             });

//             console.log('accountnameArray >>> opening balance', accountnameArray);

//             var matchCondition_al = {avoudt: {$lte: new Date(req.query.start_date)}, accountname: {$ne: ''}};
//             if(req.query.site_name) {
//                 matchCondition_al.branch = req.query.site_name;
//             }
            
//             // console.log('matchCondition_al >>>2', matchCondition_al);
        
//             AccountsLedger.find(matchCondition_al).distinct('accountname').then(function(result) {

//                 result.forEach(r => {
//                     accountnameArray.push(r);
//                 });
        

//                 // console.log('accountnameArray >>>> 1', accountnameArray);

//                 uniqueAccountnameArray = accountnameArray.filter(onlyUnique);
                
//                 uniqueAccountnameArray.forEach(j => {
//                     mainListArray.push(j);
//                 });

//                 // console.log('Unique  >>>> 0', mainListArray);
//                 // cb(false, { result: mainListArray });
//                 cb(false, mainListArray );

//             }).catch(function(err) {
//                 console.log(err);
//                 res.send(err);
//             });
            
//         }).catch(function(err) {
//             console.log(err);
//             res.send(err);
//         });
//     };

//     var findRecords = function (defaultOpeningBalance, defaultAccountType, defaultAccount, cb) {

//         console.log(' opening balance FR >>>>', defaultOpeningBalance);
//         console.log(' account type FR >>>>', defaultAccountType);
//         console.log(' account name  FR >>>>',  defaultAccount);


//         var closing_balance = defaultOpeningBalance;
//         var matchCond = {avoudt: {$lte: new Date(req.query.start_date)}};
//         // var matchCond = getMatchCondition();
//         if(defaultAccount) {
//             matchCond.accountname = defaultAccount;
//         }
//         AccountsLedger.find(matchCond).sort({'avoudt': 1}).then(function (accountNameresults) {
//             var data = [];
//             accountNameresults.forEach(r => {
//                 if (r.branch && r.accountname) {
//                     var debtamt = r.adebtamt ? r.adebtamt : 0;
//                     var crdtamt = r.acrdtamt ? r.acrdtamt : 0;
//                     closing_balance = (closing_balance + Number(crdtamt)) - Number(debtamt);
//                     var obj = {
//                         branch: r.branch,
//                         accountname: r.accountname,
//                         date: moment(r.avoudt).format('DD/MM/YYYY'),
//                         particular: r.arefno,
//                         dr: r.adebtamt,
//                         cr: r.acrdtamt,
//                         closing: Math.abs(closing_balance.toFixed(2))
//                     }
//                     data.push(obj);
//                 }
//             });
            
//             cb(false, {records: data, closing_balance: Math.abs(closing_balance.toFixed(2)), type: closing_balance > 0 ? 'Credit' : 'Debit'});
//         }).catch(function (err) {
//             console.log(err);
//             cb(err, false);
//         });
//     };


//     fetchData(matchCondition, function (err, result) {
//         if (err) {
//             console.log(err);
//             return res.status(500).send(err);
//         }

//         var AccountNameFinalArray = [];
//         result.forEach(r => {
//             AccountNameFinalArray.push(r);
//         });

//         console.log('AccountNameFinalArray >>>> ', AccountNameFinalArray);

//         // async.parallel(AccountNameFinalArray, function(err, asyncResult) {
//         //     console.log("ERROR >>> ", err);

//             var accountNameArray = [];
//             accountNameArray = AccountNameFinalArray;
    
//             console.log('fetchdata Unique Data >>>> 0', accountNameArray);
    
//             var matchConditionAcc = {
//                 "accountname": { $in:  accountNameArray }
//             };
    
//             if (req.query.site_name) {
//                 matchConditionAcc.site = req.query.site_name;
//             }
    
//             console.log('accounts condition >>>>>>>>>>>', matchConditionAcc);
    
//             Accounts.find(matchConditionAcc).then(result => {
//                 result.forEach( r => {
//                     var vopbal = 0;
//                     var accountName = '';
//                     if(r) {
//                         if(!r) {
//                             vopbal = 0;
//                         } else {
//                             accountName = r.accountname;
//                             // console.log(r.ocrdr);
//                             vopbal = 0;
//                             if (r.ocrdr === "Debit") {
//                                 vopbal = vopbal + Number(r.opbal ? r.opbal : 0);
//                                 accountType = "Debit";
//                                 // console.log("Debit.....");
//                             } else {
//                                 vopbal = vopbal - Number(r.opbal ? r.opbal : 0);
//                                 accountType = "Credit";
//                                 // console.log("Credit.....");
//                             }
//                         }
                        
//                     } else {
//                         vopbal = 0;
//                     }
//                     rvopbal = vopbal;
//                     rrvopbal = rvopbal;
    
//                     if(req.query.start_date) {
                        
//                         console.log(' opening balance 1 >>>>', rvopbal);
//                         console.log(' account type 1 >>>>', accountType);
//                         console.log(' account name  1 >>>>', r.accountname);
    
    
//                         findRecords(rvopbal, accountType, r.accountname, function (err, results) {
    
//                             if(err) {
//                                 return res.status(500).send(err);
//                             }
    
//                             var accountObj = {                      
//                                 opening_balance: rrvopbal,
//                                 results: results.records,
//                                 closing_balance : results.closing_balance,
//                                 account_type : results.type
//                             }
//                             res.send({ "result": accountObj });
//                             mainArray.push(accountObj);
//                             // console.log('mainArray', mainArray);
//                         });
//                     } 
//                 });
//             }).catch(err => {
//                 console.log(err);
//                 res.send("err");
//             });    

//         //     res.send({ "result": mainArray });  
//         // });




//     });

// });

// router.get('/trial_balance_testing', function(req, res, next) {
//     var accountsArray = [];
//     var mainArray = [];

//     var rvopbal = 0;
//     var matchCondition = {};
//     var rrvopbal, accountType;

//     var getMatchCondition = function () {
//         var matchCondition = {};
//         if(req.query.start_date) {
//             matchCondition.avoudt = req.query.start_date;
//         }
        
//         if(req.query.end_date && req.query.start_date) {
//             matchCondition.avoudt = {
//                 $gte: new Date(req.query.start_date),
//                 $lte: new Date(req.query.end_date)
//             };
//         }
//         if(req.query.site_name){
//             matchCondition.branch = req.query.site_name;
//         } 
        
//         // if(req.query.account_name) {
//         //     matchCondition.accountname = req.query.account_name;
//         // }

//         return matchCondition;
//     };

//     // used to calculate balance using previous records before start date if start date is specified
//     var calculateOpeningBalanceUsingOldRecords = function (defaultOpeningBalance, defaultAccountType, defaultAccount, cb) {
//         var matchCond = {avoudt: {$lt: new Date(req.query.start_date)}};
//         if(req.query.site_name){
//             matchCond.branch = req.query.site_name;
//         } 
        
//         if(defaultAccount) {
//             matchCond.accountname = defaultAccount;
//         }

//         AccountsLedger.find(matchCond).sort({'avoudt': 1}).then(function (accountNameresults) {
//             var data = [];
//             accountNameresults.forEach(r => {
//                 defaultOpeningBalance = (Number(r.acrdtamt ? r.acrdtamt : 0) + defaultOpeningBalance) - Number(r.adebtamt ? r.adebtamt : 0);
//             });
//             var accType;
//             if(defaultAccountType){
//                 accType = defaultAccountType

//             } else {
//                 accType = defaultOpeningBalance > 0 ? 'Credit' : 'Debit'
//             }

//             cb(false, {type: accType, opening_balance: defaultOpeningBalance});
//         }).catch(function (err) {
//             console.log(err);
//             cb(err, false);
//         });
//     };

//     // var findRecords = function (openingBalance, dataAccount, cb) {
//     var findRecords = function (defaultOpeningBalance, defaultAccountType, defaultAccount, cb) {
//         var closing_balance = defaultOpeningBalance;
//         var matchCond = {avoudt: {$lte: new Date(req.query.start_date)}};
//         // var matchCond = getMatchCondition();
//         if(defaultAccount) {
//             matchCond.accountname = defaultAccount;
//         }
//         AccountsLedger.find(matchCond).sort({'avoudt': 1}).then(function (accountNameresults) {
//             var data = [];
//             accountNameresults.forEach(r => {
//                 if (r.branch && r.accountname) {
//                     var debtamt = r.adebtamt ? r.adebtamt : 0;
//                     var crdtamt = r.acrdtamt ? r.acrdtamt : 0;
//                     closing_balance = (closing_balance + Number(crdtamt)) - Number(debtamt);
//                     var obj = {
//                         branch: r.branch,
//                         accountname: r.accountname,
//                         date: moment(r.avoudt).format('DD/MM/YYYY'),
//                         particular: r.arefno,
//                         dr: r.adebtamt,
//                         cr: r.acrdtamt,
//                         closing: Math.abs(closing_balance.toFixed(2))
//                     }
//                     data.push(obj);
//                 }
//             });
            
//             cb(false, {records: data, closing_balance: Math.abs(closing_balance.toFixed(2)), type: closing_balance > 0 ? 'Credit' : 'Debit'});
//         }).catch(function (err) {
//             console.log(err);
//             cb(err, false);
//         });
//     };

//     if(req.query.account_name) {
//         matchCondition.accountname = req.query.account_name;
//     }

//     Accounts.find({}).then(result => {
//         result.forEach( r => {
//             var vopbal = 0;
//             var accountName = '';
//             if(r) {
//                 if(!r) {
//                     vopbal = 0;
//                 } else {
//                     accountName = r.accountname;
//                     // console.log(r.ocrdr);
//                     vopbal = 0;
//                     if(r.ocrdr === "Debit"){
//                         vopbal = vopbal + Number(r.opbal ? r.opbal : 0);
//                         accountType = "Debit";
//                         // console.log("Debit.....");
//                     } else{
//                         vopbal = vopbal - Number(r.opbal ? r.opbal : 0);
//                         accountType = "Credit";
//                         // console.log("Credit.....");
//                     }
//                 }
                
//             } else {
//                 vopbal = 0;
//             }
//             rvopbal = vopbal;
//             rrvopbal = rvopbal;

//             if(req.query.start_date) {
//                 // calculateOpeningBalanceUsingOldRecords(rvopbal, accountType, r.accountname, function (err, newOpeningBalance) {
//                 //     if(err) {
//                 //         return res.status(500).send(err);
//                 //     }
//                     // findRecords(newOpeningBalance, function (err, results) {
//                         findRecords(rvopbal, accountType, r.accountname, function (err, results) {
//                         if(err) {
//                             return res.status(500).send(err);
//                         }

//                         var accountObj = {                      
//                             opening_balance: newOpeningBalance,
//                             results: results.records,
//                             closing_balance : results.closing_balance,
//                             account_type : results.type
//                         }
//                         res.send({ "result": accountObj });
//                         mainArray.push(accountObj);
//                     });
//                 // });
//             } else {
//                 findRecords(vopbal, r.accountname, function (err, results) {
//                     if(err) {
//                         return res.status(500).send(err);
//                     }

//                     var accountObj = {
//                         opening_balance: {type: rrvopbal && rrvopbal > 0 ? 'Credit' : 'Debit', opening_balance: rrvopbal ? rrvopbal : 0},
//                         results: results.records,
//                         closing_balance : results.closing_balance,
//                         account_type : results.type,
//                     }
//                     res.send({ "result": accountObj });
//                     mainArray.push(accountObj);
//                 });
//             }
//         });

//     }).catch(err => {
//         console.log(err);
//         res.send("err");
//     });

// });


// router.get('/trial_balance_new', function(req, res, next) {
//     var accountsArray = [];
//     var mainArray = [];
   
//     var rvopbal = 0;
//     var matchCondition = {};
//     var rrvopbal, accountType;


//     var findRecords = function (defaultOpeningBalance, defaultAccountType, defaultAccount, cb) {

//         console.log(' opening balance FR >>>>', defaultOpeningBalance);
//         console.log(' account type FR >>>>', defaultAccountType);
//         console.log(' account name  FR >>>>',  defaultAccount);


//         var closing_balance = defaultOpeningBalance;
//         if(req.query.start_date) {
//             var matchCond = {avoudt: {$lte: moment(req.query.start_date, 'YYYY-MM-DD').format("YYYY-MM-DD")}};
//         }
//         if(req.query.site_name){
//             matchCond.branch = req.query.site_name;
//         } 
        
//         if(defaultAccount) {
//             matchCond.accountname = defaultAccount;
//         }
//         console.log(' matchCond >>>>',  matchCond);

//         AccountsLedger.find(matchCond).sort({'avoudt': 1}).then(function (accountNameresults) {
//             console.log(' true >>>>');
//             var data = [];
//             var odebtamt = 0 
//             var ocrdtamt = 0
//             if(defaultAccountType === "Debit"){
//                 odebtamt = defaultOpeningBalance
//             } else{
//                 ocrdtamt = defaultOpeningBalance
//             }
//             accountNameresults.forEach(r => {
//                 odebtamt = Number(odebtamt) + Number(r.adebtamt ? r.adebtamt : 0);
//                 ocrdtamt = Number(ocrdtamt) + Number(r.acrdtamt ? r.acrdtamt : 0);
//             });

//             if (odebtamt > ocrdtamt) {
//                 odebtamt = Number(odebtamt) - Number(ocrdtamt)
//                 ocrdtamt = 0 
//             } else {
//                 odebtamt = 0 
//                 ocrdtamt  = Number(ocrdtamt) - Number(odebtamt)
//             }

//             cb(false, {accname: defaultAccount, dr: Math.abs(odebtamt.toFixed(2)), cr: Math.abs(ocrdtamt.toFixed(2))});
//             // cb(false, {records: data, closing_balance: Math.abs(closing_balance.toFixed(2)), type: closing_balance > 0 ? 'Credit' : 'Debit'});
//         }).catch(function (err) {
//             console.log(err);
//             cb(err, false);
//         });
//     };


//     if(req.query.site_name) {
//         var matchCondition = {site: req.query.site_name};
//     }
    
//     // console.log(" matchCondition >>>>>>", matchCondition);
    
//     Accounts.find(matchCondition).then(result => {
        
//         // console.log(" result >>>>>>", result);

//         result.forEach( r => {
//             var vopbal = 0;
//             var accountName = '';
//             var site = '';
//             if(r) {
//                 if(!r) {
//                     vopbal = 0;
//                 } else {
//                     accountName = r.accountname;
//                     site = r.site;
//                     vopbal = 0;
//                     if(r.ocrdr === "Debit"){
//                         vopbal = vopbal + Number(r.opbal ? r.opbal : 0);
//                         accountType = "Debit";
//                         // console.log("Debit.....");
//                     } else{
//                         vopbal = vopbal - Number(r.opbal ? r.opbal : 0);
//                         accountType = "Credit";
//                         // console.log("Credit.....");
//                     }
//                 }
                
//             } else {
//                 vopbal = 0;
//             }
//             rvopbal = vopbal;
//             rrvopbal = rvopbal;

//             console.log(' opening balance 1 >>>>', rvopbal);
//             console.log(' account type 1 >>>>', accountType);
//             console.log(' account name  1 >>>>', r.accountname);

//             if(req.query.start_date) {
//                 findRecords(rvopbal, accountType, r.accountname, function (err, results) {
    
//                     if(err) {
//                         return res.status(500).send(err);
//                     }

//                     console.log('Final Results', results);
                    
//                     var accountObj = {                      
//                         // opening_balance: rrvopbal,
//                         results: results.records,
//                         // closing_balance : results.closing_balance,
//                         // account_type : results.type
//                     }
//                     res.send({ "result": accountObj });
//                     // mainArray.push(accountObj);
//                 });
//             } else {
//                 console.log('False');
//                 // findRecords(vopbal, r.accountname, function (err, results) {
//                 //     if(err) {
//                 //         return res.status(500).send(err);
//                 //     }

//                 //     var accountObj = {
//                 //         opening_balance: {type: rrvopbal && rrvopbal > 0 ? 'Credit' : 'Debit', opening_balance: rrvopbal ? rrvopbal : 0},
//                 //         results: results.records,
//                 //         closing_balance : results.closing_balance,
//                 //         account_type : results.type,
//                 //     }
//                 //     res.send({ "result": accountObj });
//                 //     mainArray.push(accountObj);
//                 // });
//             }
//         });

//     }).catch(err => {
//         console.log(err);
//         res.send("err");
//     });

// });

// router.get('/trial_balance', function(req, res, next) {
//     var accountsArray = [];
//     var mainArray = [];
   
//     var rvopbal = 0;
//     var matchCondition = {};
//     var rrvopbal, accountType;

//     var getMatchCondition = function () {
//         var matchCondition = {};
//         if(req.query.start_date) {
//             matchCondition.avoudt = req.query.start_date;
//         }
        
//         if(req.query.end_date && req.query.start_date) {
//             matchCondition.avoudt = {
//                 $gte: new Date(req.query.start_date),
//                 $lte: new Date(req.query.end_date)
//             };
//         }
//         if(req.query.site_name){
//             matchCondition.branch = req.query.site_name;
//         } 
        
//         // if(req.query.account_name) {
//         //     matchCondition.accountname = req.query.account_name;
//         // }

//         return matchCondition;
//     };

//     // used to calculate balance using previous records before start date if start date is specified
//     var calculateOpeningBalanceUsingOldRecords = function (defaultOpeningBalance, defaultAccountType, defaultAccount, cb) {
//         var matchCond = {avoudt: {$lt: new Date(req.query.start_date)}};
//         if(req.query.site_name){
//             matchCond.branch = req.query.site_name;
//         } 
        
//         if(defaultAccount) {
//             matchCond.accountname = defaultAccount;
//         }

//         AccountsLedger.find(matchCond).sort({'avoudt': 1}).then(function (accountNameresults) {
//             var data = [];
//             accountNameresults.forEach(r => {
//                 defaultOpeningBalance = (Number(r.acrdtamt ? r.acrdtamt : 0) + defaultOpeningBalance) - Number(r.adebtamt ? r.adebtamt : 0);
//             });
//             var accType;
//             if(defaultAccountType){
//                 accType = defaultAccountType

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
//         var closing_balance = openingBalance;
//         var matchCond = getMatchCondition();
//         if(dataAccount) {
//             matchCond.accountname = dataAccount;
//         }
//         AccountsLedger.find(matchCond).sort({'avoudt': 1}).then(function (accountNameresults) {
//             var data = [];
//             accountNameresults.forEach(r => {
//                 if (r.branch && r.accountname) {
//                     var debtamt = r.adebtamt ? r.adebtamt : 0;
//                     var crdtamt = r.acrdtamt ? r.acrdtamt : 0;
//                     // console.log(r.adebtamt, r.crdtamt, closing_balance);
//                     closing_balance = (closing_balance + Number(crdtamt)) - Number(debtamt);
//                     // console.log("closing >>>", r.avoudt);
//                     var obj = {
//                         branch: r.branch,
//                         accountname: r.accountname,
//                         date: moment(r.avoudt).format('DD/MM/YYYY'),
//                         particular: r.arefno,
//                         dr: r.adebtamt,
//                         cr: r.acrdtamt,
//                         closing: Math.abs(closing_balance.toFixed(2))
//                     }
//                     data.push(obj);
//                 }
//             });
            
//             cb(false, {records: data, closing_balance: Math.abs(closing_balance.toFixed(2)), type: closing_balance > 0 ? 'Credit' : 'Debit'});
//         }).catch(function (err) {
//             console.log(err);
//             cb(err, false);
//         });
//     };

//     if(req.query.account_name) {
//         matchCondition.accountname = req.query.account_name;
//     }

//     Accounts.find({}).then(result => {
//         result.forEach( r => {
//             var vopbal = 0;
//             var accountName = '';
//             if(r) {
//                 if(!r) {
//                     vopbal = 0;
//                 } else {
//                     accountName = r.accountname;
//                     // console.log(r.ocrdr);
//                     vopbal = 0;
//                     if(r.ocrdr === "Debit"){
//                         vopbal = vopbal + Number(r.opbal ? r.opbal : 0);
//                         accountType = "Debit";
//                         // console.log("Debit.....");
//                     } else{
//                         vopbal = vopbal - Number(r.opbal ? r.opbal : 0);
//                         accountType = "Credit";
//                         // console.log("Credit.....");
//                     }
//                 }
                
//             } else {
//                 vopbal = 0;
//             }
//             rvopbal = vopbal;
//             rrvopbal = rvopbal;
//             // var dataObj = {
//             //     "accountType": accountType,
//             //     "accountname": r.accountname,
//             //     "rvopbal": rvopbal,
//             //     "rrvopbal": rrvopbal
//             // }
//             // accountsArray.push(dataObj);

//             if(req.query.start_date) {
//                 calculateOpeningBalanceUsingOldRecords(rvopbal, accountType, r.accountname, function (err, newOpeningBalance) {
//                     if(err) {
//                         return res.status(500).send(err);
//                     }
//                     findRecords(newOpeningBalance, function (err, results) {
//                         if(err) {
//                             return res.status(500).send(err);
//                         }

//                         var accountObj = {                      
//                             opening_balance: newOpeningBalance,
//                             results: results.records,
//                             closing_balance : results.closing_balance,
//                             account_type : results.type
//                         }
//                         res.send({ "result": accountObj });
//                         mainArray.push(accountObj);
//                     });
//                 });
//             } else {
//                 findRecords(vopbal, r.accountname, function (err, results) {
//                     if(err) {
//                         return res.status(500).send(err);
//                     }

//                     var accountObj = {
//                         opening_balance: {type: rrvopbal && rrvopbal > 0 ? 'Credit' : 'Debit', opening_balance: rrvopbal ? rrvopbal : 0},
//                         results: results.records,
//                         closing_balance : results.closing_balance,
//                         account_type : results.type,
//                     }
//                     res.send({ "result": accountObj });
//                     mainArray.push(accountObj);
//                 });
//             }
//         });
//         // accountsArray.forEach( account => {  
            
//         // });

//         // async.parallel(mainArray, function(err, asyncResult) {
//         //     res.send({ "result": mainArray });  
//         // });

             

//     }).catch(err => {
//         console.log(err);
//         res.send("err");
//     });

// });

// router.get('/site_trial_balance', function(req, res, next) {
//     var accountsArray = [];
//     var mainArray = [];
   
//     var rvopbal = 0;
//     var matchCondition = {};
//     var rrvopbal, accountType;

//     var getMatchCondition = function () {
//         var matchCondition = {};
//         if(req.query.start_date) {
//             matchCondition.avoudt = req.query.start_date;
//         }
        
//         if(req.query.end_date && req.query.start_date) {
//             matchCondition.avoudt = {
//                 $gte: new Date(req.query.start_date),
//                 $lte: new Date(req.query.end_date)
//             };
//         }
//         if(req.query.site_name){
//             matchCondition.branch = req.query.site_name;
//         } 
        
//         if(req.query.account_name) {
//             matchCondition.accountname = req.query.account_name;
//         }

//         return matchCondition;
//     };

//     // used to calculate balance using previous records before start date if start date is specified
//     var calculateOpeningBalanceUsingOldRecords = function (defaultOpeningBalance, defaultAccountType, defaultAccount, cb) {
//         var matchCond = {avoudt: {$lt: new Date(req.query.start_date)}};
//         if(req.query.site_name){
//             matchCond.branch = req.query.site_name;
//         } 
        
//         if(defaultAccount) {
//             matchCond.accountname = defaultAccount;
//         }

//         AccountsLedger.find(matchCond).sort({'avoudt': 1}).then(function (accountNameresults) {
//             var data = [];
//             accountNameresults.forEach(r => {
//                 defaultOpeningBalance = (Number(r.acrdtamt && r.acrdtamt != "NaN" ? r.acrdtamt : 0) + defaultOpeningBalance) - Number(r.adebtamt && r.adebtamt != "NaN" ? r.adebtamt : 0);
//             });
//             var accType;
//             if(defaultAccountType){
//                 accType = defaultAccountType

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
//             matchCond.accountname = dataAccount;
//         }
//         if(req.query.site_name) {
//             matchCond.branch = req.query.site_name;
//         }
//         AccountsLedger.find(matchCond).sort({'avoudt': 1}).then(function (accountNameresults) {
//             var data = [];
//             accountNameresults.forEach(r => {
//                 if (r.accountname) {
//                     var debtamt = r.adebtamt && r.adebtamt != "NaN" ? r.adebtamt : 0;
//                     var crdtamt = r.acrdtamt && r.acrdtamt != "NaN" ? r.acrdtamt : 0;
//                     // console.log(r.adebtamt, r.crdtamt, closing_balance);
//                     closing_balance = (closing_balance + Number(crdtamt)) - Number(debtamt);
//                     // console.log("closing >>>", r.avoudt);
//                     var obj = {
//                         branch: r.branch,
//                         accountname: r.accountname,
//                         date: moment(r.avoudt).format('DD/MM/YYYY'),
//                         // particular: r.arefno,
//                         dr: r.adebtamt,
//                         cr: r.acrdtamt,
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

//     var calculateLedger = function(accountNameData) {
//         return function (callback) {
//             Accounts.findOne({"accountname": accountNameData}).then(r => {
//                 var vopbal = 0;
//                 var accountName = r && r.accountname ? r.accountname : accountNameData;
//                 var accountType;
//                 if(r) {
                    
//                     accountName = r.accountname;
//                     // console.log(r.ocrdr);
//                     vopbal = 0;
//                     if(r.ocrdr === "Debit"){
//                         vopbal = vopbal + Number(r.opbal ? r.opbal : 0);
//                         accountType = "Debit";
//                         // console.log("Debit.....");
//                     } else{
//                         vopbal = vopbal - Number(r.opbal ? r.opbal : 0);
//                         accountType = "Credit";
//                         // console.log("Credit.....");
//                     }
                    
//                 } else {
//                     vopbal = 0;
//                 }
//                 rvopbal = vopbal;
//                 rrvopbal = rvopbal;
//                 // var dataObj = {
//                 //     "accountType": accountType,
//                 //     "accountname": r.accountname,
//                 //     "rvopbal": rvopbal,
//                 //     "rrvopbal": rrvopbal
//                 // }
//                 // accountsArray.push(dataObj);
                
//                 if(req.query.start_date) {
//                     calculateOpeningBalanceUsingOldRecords(rvopbal, accountType, accountName, function (err, newOpeningBalance) {
//                         if(err) {
//                             return res.status(500).send(err);
//                         }
//                         findRecords(newOpeningBalance, accountName, function (err, results) {
//                             if(err) {
//                                 return res.status(500).send(err);
//                             }

//                             // var accountObj = {                      
//                             //     opening_balance: newOpeningBalance,
//                             //     results: results.records,
//                             //     closing_balance : results.closing_balance,
//                             //     account_type : results.type
//                             // }
//                             // res.send({ "result": results });l
//                             // mainArray.push(results);

//                             var closingBalance;
//                             if(results && results.length > 0) {
//                                 closingBalance = Number(results[results.length - 1].closing)
//                             } else {
//                                 closingBalance = 0;
//                             }
//                             callback(false, {
//                                 account_name: accountName,
//                                 dr: closingBalance < 0 ? Math.abs(closingBalance) : 0,
//                                 cr: closingBalance > 0 ? Math.abs(closingBalance) : 0,
//                                 site_name: results.length > 0  ? results[0].branch : '',
//                             });
//                         });
//                     });
//                 } else {
//                     findRecords(vopbal, r.accountname, function (err, results) {
//                         if(err) {
//                             return res.status(500).send(err);
//                         }

//                         // var accountObj = {
//                         //     opening_balance: {type: rrvopbal && rrvopbal > 0 ? 'Credit' : 'Debit', opening_balance: rrvopbal ? rrvopbal : 0},
//                         //     results: results.records,
//                         //     closing_balance : results.closing_balance,
//                         //     account_type : results.type,
//                         // }
//                         var closingBalance;
//                         if(results && results.length > 0) {
//                             closingBalance = results && results.length > 0 ? Number(results[results.length - 1].closing) : 0;
//                         } else {
//                             closingBalance = 0;
//                         }
//                         callback(false, {
//                             account_name: r.accountname,
//                             dr: closingBalance < 0 ? Math.abs(closingBalance) : 0,
//                             cr: closingBalance > 0 ? Math.abs(closingBalance) : 0,
//                             site_name: results.length > 0  ? results[0].branch : '',
//                         });
//                     });
//                 }
//             }).catch(err => {
//                 console.log(err.stack);
//                 callback(err, null);
//             });
//         };
//     };

//     var matchCond = {accountname: {$ne: ''}};
//     if(req.query.site_name) {
//         matchCond.branch = req.query.site_name;
//     }
    
//     console.log("matchCond >>> ", matchCond);
  
//     AccountsLedger.find(matchCond).distinct('accountname').then(function(result) {
//         var resultsArray = [];
//         result.forEach(a => {
//             resultsArray.push(calculateLedger(a));
//         });
//         async.parallel(resultsArray, function(err, asyncResult) {
//             console.log("ERROR >>> ", err);
//             res.send({ "result": asyncResult });  
//         });

//     }).catch(function(err) {
//         res.send(err);
//     });
// });

// router.get('/site_trial_balance_new', function(req, res, next) {
//     var accountsArray = [];
//     var mainArray = [];
   
//     var rvopbal = 0;
//     var matchCondition = {};
//     var rrvopbal, accountType;

//     var getMatchCondition = function () {
//         var matchCondition = {};
//         if(req.query.start_date) {
//             matchCondition.avoudt = req.query.start_date;
//         }
        
//         if(req.query.end_date && req.query.start_date) {
//             matchCondition.avoudt = {
//                 $gte: new Date(req.query.start_date),
//                 $lte: new Date(req.query.end_date)
//             };
//         }
//         if(req.query.site_name){
//             matchCondition.branch = req.query.site_name;
//         } 
        
//         if(req.query.account_name) {
//             matchCondition.accountname = req.query.account_name;
//         }

//         return matchCondition;
//     };

//     // used to calculate balance using previous records before start date if start date is specified
//     var calculateOpeningBalanceUsingOldRecords = function (defaultOpeningBalance, defaultAccountType, defaultAccount, cb) {
//         var matchCond = {avoudt: {$lt: new Date(req.query.start_date)}};
//         if(req.query.site_name){
//             matchCond.branch = req.query.site_name;
//         } 
        
//         if(defaultAccount) {
//             matchCond.accountname = defaultAccount;
//         }

//         AccountsLedger.find(matchCond).sort({'avoudt': 1}).then(function (accountNameresults) {
//             var data = [];
//             accountNameresults.forEach(r => {
//                 defaultOpeningBalance = (Number(r.acrdtamt && r.acrdtamt != "NaN" ? r.acrdtamt : 0) + defaultOpeningBalance) - Number(r.adebtamt && r.adebtamt != "NaN" ? r.adebtamt : 0);
//             });
//             var accType;
//             if(defaultAccountType){
//                 accType = defaultAccountType

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
//             matchCond.accountname = dataAccount;
//         }
//         if(req.query.site_name) {
//             matchCond.branch = req.query.site_name;
//         }
//         AccountsLedger.find(matchCond).sort({'avoudt': 1}).then(function (accountNameresults) {
//             var data = [];
//             accountNameresults.forEach(r => {
//                 if (r.accountname) {
//                     var debtamt = r.adebtamt && r.adebtamt != "NaN" ? r.adebtamt : 0;
//                     var crdtamt = r.acrdtamt && r.acrdtamt != "NaN" ? r.acrdtamt : 0;
//                     // console.log(r.adebtamt, r.crdtamt, closing_balance);
//                     closing_balance = (closing_balance + Number(crdtamt)) - Number(debtamt);
//                     // console.log("closing >>>", r.avoudt);
//                     var obj = {
//                         branch: r.branch,
//                         accountname: r.accountname,
//                         date: moment(r.avoudt).format('DD/MM/YYYY'),
//                         // particular: r.arefno,
//                         dr: r.adebtamt,
//                         cr: r.acrdtamt,
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

//     var calculateLedger = function(accountNameData) {
//         return function (callback) {
//             Accounts.findOne({"accountname": accountNameData}).then(r => {
//                 var vopbal = 0;
//                 var accountName = r && r.accountname ? r.accountname : accountNameData;
//                 var accountType;
//                 if(r) {
                    
//                     accountName = r.accountname;
//                     // console.log(r.ocrdr);
//                     vopbal = 0;
//                     if(r.ocrdr === "Debit"){
//                         vopbal = vopbal + Number(r.opbal ? r.opbal : 0);
//                         accountType = "Debit";
//                         // console.log("Debit.....");
//                     } else{
//                         vopbal = vopbal - Number(r.opbal ? r.opbal : 0);
//                         accountType = "Credit";
//                         // console.log("Credit.....");
//                     }
                    
//                 } else {
//                     vopbal = 0;
//                 }
//                 rvopbal = vopbal;
//                 rrvopbal = rvopbal;

//                 // var dataObj = {
//                 //     "accountType": accountType,
//                 //     "accountname": r.accountname,
//                 //     "rvopbal": rvopbal,
//                 //     "rrvopbal": rrvopbal
//                 // }
//                 // accountsArray.push(dataObj);
                
//                 if(req.query.start_date) {
//                     calculateOpeningBalanceUsingOldRecords(rvopbal, accountType, accountName, function (err, newOpeningBalance) {
//                         if(err) {
//                             return res.status(500).send(err);
//                         }
//                         findRecords(newOpeningBalance, accountName, function (err, results) {
//                             if(err) {
//                                 return res.status(500).send(err);
//                             }

//                             // var accountObj = {                      
//                             //     opening_balance: newOpeningBalance,
//                             //     results: results.records,
//                             //     closing_balance : results.closing_balance,
//                             //     account_type : results.type
//                             // }
//                             // res.send({ "result": results });l
//                             // mainArray.push(results);
//                             var closingBalance;
//                             if(results && results.length > 0) {
//                                 closingBalance = Number(results[results.length - 1].closing)
//                             } else {
//                                 closingBalance = 0;
//                             }
//                             callback(false, {
//                                 account_name: accountName,
//                                 dr: closingBalance < 0 ? Math.abs(closingBalance) : 0,
//                                 cr: closingBalance > 0 ? Math.abs(closingBalance) : 0,
//                                 site_name: results.length > 0  ? results[0].branch : '',
//                             });
//                         });
//                     });
//                 } else {
//                     findRecords(vopbal, r.accountname, function (err, results) {
//                         if(err) {
//                             return res.status(500).send(err);
//                         }

//                         // var accountObj = {
//                         //     opening_balance: {type: rrvopbal && rrvopbal > 0 ? 'Credit' : 'Debit', opening_balance: rrvopbal ? rrvopbal : 0},
//                         //     results: results.records,
//                         //     closing_balance : results.closing_balance,
//                         //     account_type : results.type,
//                         // }
//                         var closingBalance;
//                         if(results && results.length > 0) {
//                             closingBalance = results && results.length > 0 ? Number(results[results.length - 1].closing) : 0;
//                         } else {
//                             closingBalance = 0;
//                         }
//                         callback(false, {
//                             account_name: r.accountname,
//                             dr: closingBalance < 0 ? Math.abs(closingBalance) : 0,
//                             cr: closingBalance > 0 ? Math.abs(closingBalance) : 0,
//                             site_name: results.length > 0  ? results[0].branch : '',
//                         });
//                     });
//                 }
//             }).catch(err => {
//                 console.log(err.stack);
//                 callback(err, null);
//             });
//         };
//     };

//     var matchCond = {accountname: {$ne: ''}};
//     if(req.query.site_name) {
//         matchCond.branch = req.query.site_name;
//     }
    
//     console.log("matchCond >>> ", matchCond);
    
//     AccountsLedger.find(matchCond).distinct('accountname').then(function(result) {
//         var resultsArray = [];
//         result.forEach(a => {
//             resultsArray.push(calculateLedger(a));
//         });
//         async.parallel(resultsArray, function(err, asyncResult) {
//             console.log("ERROR >>> ", err);
//             res.send({ "result": asyncResult });  
//         });

//     }).catch(function(err) {
//         res.send(err);
//     });
// });

// router.get('/site_monthly_outstanding', function(req, res, next) {
//     var accountsArray = [];
//     var mainArray = [];
   
//     var rvopbal = 0;
//     var matchCondition = {};
//     var rrvopbal, accountType;

//     var getMatchCondition = function () {
//         var matchCondition = {};
//         if(req.query.start_date) {
//             matchCondition.avoudt = req.query.start_date;
//         }
        
//         if(req.query.end_date && req.query.start_date) {
//             matchCondition.avoudt = {
//                 $gte: new Date(req.query.start_date),
//                 $lte: new Date(req.query.end_date)
//             };
//         }
//         if(req.query.site_name){
//             matchCondition.branch = req.query.site_name;
//         } 
        
//         if(req.query.account_name) {
//             matchCondition.accountname = req.query.account_name;
//         }

//         return matchCondition;
//     };

//     // used to calculate balance using previous records before start date if start date is specified
//     var calculateOpeningBalanceUsingOldRecords = function (defaultOpeningBalance, defaultAccountType, defaultAccount, cb) {
//         var matchCond = {avoudt: {$lt: new Date(req.query.start_date)}};
//         if(req.query.site_name){
//             matchCond.branch = req.query.site_name;
//         } 
        
//         if(defaultAccount) {
//             matchCond.accountname = defaultAccount;
//         }

//         AccountsLedger.find(matchCond).sort({'avoudt': 1}).then(function (accountNameresults) {
//             var data = [];
//             accountNameresults.forEach(r => {
//                 defaultOpeningBalance = (Number(r.acrdtamt ? r.acrdtamt : 0) + defaultOpeningBalance) - Number(r.adebtamt ? r.adebtamt : 0);
//             });
//             var accType;
//             if(defaultAccountType){
//                 accType = defaultAccountType

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
//             matchCond.accountname = dataAccount;
//         }
//         if(req.query.site_name) {
//             matchCond.branch = req.query.site_name;
//         }
//         AccountsLedger.find(matchCond).sort({'avoudt': 1}).then(function (accountNameresults) {
//             var data = [];
//             accountNameresults.forEach(r => {
//                 if (r.accountname) {
//                     var debtamt = r.adebtamt ? r.adebtamt : 0;
//                     var crdtamt = r.acrdtamt ? r.acrdtamt : 0;
//                     // console.log(r.adebtamt, r.crdtamt, closing_balance);
//                     closing_balance = (closing_balance + Number(crdtamt)) - Number(debtamt);
//                     // console.log("closing >>>", r.avoudt);
//                     var obj = {
//                         branch: r.branch,
//                         accountname: r.accountname,
//                         date: moment(r.avoudt).format('DD/MM/YYYY'),
//                         // particular: r.arefno,
//                         dr: r.adebtamt,
//                         cr: r.acrdtamt,
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

//     var calculateLedger = function(accountNameData) {
//         return function (callback) {
            
//             Accounts.findOne({"accountname": accountNameData}).then(r => {
//                 var vopbal = 0;
//                 var accountName = accountNameData;
//                 if(r) {
                    
//                     accountName = accountName;
//                     // console.log(r.ocrdr);
//                     vopbal = 0;
//                     if(r.ocrdr === "Debit"){
//                         vopbal = vopbal + Number(r.opbal ? r.opbal : 0);
//                         accountType = "Debit";
//                         // console.log("Debit.....");
//                     } else{
//                         vopbal = vopbal - Number(r.opbal ? r.opbal : 0);
//                         accountType = "Credit";
//                         // console.log("Credit.....");
//                     }
                    
//                 } else {
//                     vopbal = 0;
//                 }
//                 rvopbal = vopbal;
//                 rrvopbal = rvopbal;

//                 if(req.query.start_date) {
//                     calculateOpeningBalanceUsingOldRecords(rvopbal, accountType, accountName, function (err, newOpeningBalance) {
//                         if(err) {
//                             return res.status(500).send(err);
//                         }
//                         findRecords(newOpeningBalance, accountName, function (err, results) {
//                             if(err) {
//                                 return res.status(500).send(err);
//                             }

//                             // var accountObj = {                      
//                             //     opening_balance: newOpeningBalance,
//                             //     results: results.records,
//                             //     closing_balance : results.closing_balance,
//                             //     account_type : results.type
//                             // }
//                             // res.send({ "result": results });l
//                             // mainArray.push(results);
//                             var closingBalance;
//                             if(results && results.length > 0) {
//                                 closingBalance = Number(results[results.length - 1].closing)
//                             } else {
//                                 closingBalance = 0;
//                             }
//                             callback(false, {
//                                 account_name: accountName,
//                                 dr: closingBalance < 0 ? Math.abs(closingBalance) : 0,
//                                 cr: closingBalance > 0 ? Math.abs(closingBalance) : 0,
//                                 site_name: results.length > 0  ? results[0].branch : '',
//                             });
//                         });
//                     });
//                 } else {
//                     findRecords(vopbal, accountName, function (err, results) {
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
//                             account_name: accountName,
//                             dr: closingBalance < 0 ? Math.abs(closingBalance) : 0,
//                             cr: closingBalance > 0 ? Math.abs(closingBalance) : 0,
//                             site_name: results.length > 0  ? results[0].branch : '',
//                         });
//                     });
//                 }
//             }).catch(err => {
//                 console.log(err.stack);
//                 callback(err, null);
//             });
//         };
//     };

//     if (req.query.category == "") {
//         var matchConditionCategory = {
//             "$or": [{
//                 "category": "Sundry Creditors"
//             } , {
//                 "category": "Sundry Debtors"
//             }]
//         };
//         if(req.query.site_name) {
//             matchConditionCategory.site = req.query.site_name;
//         }
//     } else {
//         var matchConditionCategory = { "category": req.query.category };
//         if(req.query.site_name) {
//             matchConditionCategory.site = req.query.site_name;
//         }
    
//     }


//     // console.log('Account >>>', matchConditionCategory);


//     Accounts.find(matchConditionCategory).then(function(resultData) {

//         var accountNameArray = [];
//         resultData.forEach(a => {
//             accountNameArray.push(a.accountname);
//         });
        
//         // console.log("resultData >>>>>>>>>>> 2", accountNameArray);
        
//         var matchConditionAcc = {
//             "accountname": { $in:  accountNameArray }
//         };


//         if (req.query.site_name) {
//             matchConditionAcc.branch = req.query.site_name;
//         }

//         // console.log("resultData 1 >>>>>>>>>>>", matchConditionAcc);
        
//         AccountsLedger.find(matchConditionAcc).distinct('accountname').then(function(result) {
//             var resultsArray = [];
//             result.forEach(a => {
//                 resultsArray.push(calculateLedger(a));
//             });
//             async.parallel(resultsArray, function(err, asyncResult) {
//                 console.log("ERROR >>> ", err);
//                 // res.send({ "result": asyncResult });  
//                 var retValues = [];
//                 asyncResult.forEach(result=>{
//                     if(!(result.cr==0 && result.dr==0)){
//                         retValues.push(result);
//                     } 

//                 })
//                 res.send({ "result": retValues });  

//             });
//         }).catch(function(err) {
//             console.log(err.stack);
//             res.send(err);
//         });

//     }).catch(function(err) {
//         res.send(err);
//     });
    
// });



router.get('/sitewise_summary_lrno', function (req, res, next) {
    var page, limit, offset, reqArray, data, siteArray, tanameArray, matchConditionTA;

    page = req.query.page ? req.query.page : 1;
    limit = req.query.limit ? req.query.limit : 50;
    offset = (page - 1) * limit;

    // reqArray = [];
    data = [];
    matchCondition = {};
    function onlyUnique(value, index, self) { 
        return self.indexOf(value) === index;
    }


    var fetchData = function (matchCondition, cb) {
       console.log(matchCondition);
    //    matchCondition.site = "BELA MP"
        Billty.find(matchCondition).then(function (result) {
            var data = []
    
            result.forEach(r => {
                var obj = {
                    "site": r.site,
                    "date":r.lrdate,
                    "lrno": r.lrno,
                    "truckno": r.truckno,
                    "from": r.from,
                    "destination": r.to,
                    "cc": r.tcc,                
                };
                data.push(obj);
            });
            cb(false, { results: data });
        }).catch(function (err) {
            cb(err);
        })
    };

    var calculatePlantsTruckPosition = function(matchConditionPTP, data) {
        return function (callback) {

            var inMatchConditionPTP = {};
            inMatchConditionPTP.pdate = matchConditionPTP.lrdate;
            inMatchConditionPTP.truckno = data.truckno;
            inMatchConditionPTP.status =  "Active";
            
            
            // console.log("------------>", inMatchConditionPTP);
            PlantsTruckPosition.find(inMatchConditionPTP).then((fromResults) => {
                
                // console.log("inMatchConditionPTP >>>", inMatchConditionPTP.truckno);
                // console.log("fromResults >>>", fromResults);
                // console.log("-----------");
                if(fromResults[0]) {
                    data.srno = fromResults[0].srno;
                    data.timein = fromResults[0].timein;
                    data.placedtime = fromResults[0].placedtime;
                    data.billtytime = fromResults[0].billtytime;
                } else {
                    data.srno = "";
                    data.timein = "";
                    data.placedtime = "";
                    data.billtytime = "";
                }

                callback(false, data);
                }).catch(err => {
                console.log(err.stack);
                callback(err, null);
            });
        };
    };

    if (req.query.start_date && req.query.end_date) {
        var start = momentTZ(req.query.start_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD');
        var end = momentTZ(req.query.end_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD');
        matchCondition.lrdate = {
            // $eq: req.query.start_date
            $gte: new Date(start),
            $lte: new Date(end)
        };
    }


    fetchData(matchCondition, function (err, result) {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }

        var resultArray = result.results;
        var billtyArray = [];
        
        resultArray.forEach(a => {
            matchCondition.site = a._id;
            billtyArray.push(calculatePlantsTruckPosition(matchCondition, a));
        });

        async.parallel(billtyArray, function(err, asyncResult) {
            console.log("ERROR >>> ", err);

            var sites = [];
            asyncResult.forEach(s => {
                sites.push(s.site);
            });
            var uniqueSites = sites.filter( onlyUnique );
            var mainResult = [];
            uniqueSites.forEach( u => {
                // console.log("Sites >>> ", u);
                var siteResult = [];
                asyncResult.forEach( ar => {
                     
                    if ( ar.site == u) {
                        // console.log("  Yes");
                        siteResult.push(ar);
                    }   
                });

                var obj = {"plantName": u, "siteResult": siteResult };
                // console.log("obj  >>>", obj);
                mainResult.push(obj);
            });
            
            res.send({ "result": mainResult });  
        });

    });

});

router.get('/sitewise_summary', function (req, res, next) {
    var matchCondition = {status: "Active"};

    if (req.query.start_date && req.query.end_date) {
        // var start = momentTZ(req.query.start_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD');
        // var end = momentTZ(req.query.end_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD');
        var endDate = moment(req.query.end_date).format("YYYY-MM-DD");
        matchCondition.pdate = {
            // $eq: req.query.start_date
            $gte: new Date(req.query.start_date),
            $lte: endDate+"T23:00:00.000Z"
        };
    }

    if ( req.query.start_date == req.query.end_date ) {
        var startDate = moment(req.query.start_date).format("YYYY-MM-DD");
        console.log(">>>>>>HERE");
        matchCondition.pdate = {
            $gte: startDate+"T00:00:00.000Z",
            $lte: startDate+"T23:00:00.000Z"
        };
    } 

    if ( !req.query.start_date) {
        matchCondition = {"status": "Active"};    }

    function onlyUnique(value, index, self) { 
        return self.indexOf(value) === index;
    }

    var calculateBillty= function(data) {
        return function (callback) {
            var lrDate = moment(data.date, "YYYY-MM-DD").format("YYYY-MM-DD");
            // console.log( "No >>>>>>>>>>>>>>", data.srno, " ", data.truckno, "site -", data.site , "lrdate", lrDate);
            
            var inMatchConditionPTP = { "truckno": data.truckno, "site": data.site, "lrdate": lrDate};
            Billty.findOne(inMatchConditionPTP).then((fromResults) => {
                
                if (fromResults) {
                    console.log( "Yes >>>>>>>>>>>>>>", data.srno);
                    data.lrno = fromResults.lrno;
                } else {
                    console.log( "No >>>>>>>>>>>>>>", data.srno);
                    data.lrno = "-";
                    // console.log(data.srno, "No >>>>", data.truckno , " - ", data.site, " date", data.date);
                }

                
                // data.lrdate = fromResults.lrdate;
                // data.Bill_Site = fromResults.site;

                callback(false, data);
                }).catch(err => {
                console.log(err.stack);
                callback(err, null);
            });
        };
    };
    

    PlantsTruckPosition.find({}).then(function(result) {
        var listArray = [];
        result.forEach(r => {
            var  pDate = moment(r.pdate).format('YYYY-MM-DD');
            var obj = {
                "date": pDate,
                "srno": r.srno,
                "truckno": r.truckno,
                "site": r.site,
                "cc": r.cc,
                "destination": r.destination,
                "timein": r.timein,
                "placedtime": r.placedtime,
                "billtytime": r.billtytime,                
            }          
            listArray.push(calculateBillty(obj));
        });


        // async.parallel(listArray, function(err, asyncResult) {            
        //     res.send({ "result": asyncResult });  
        // });
        async.parallel(listArray, function(err, asyncResult) {
            console.log("ERROR >>> ", err);

            var sites = [];
            asyncResult.forEach(s => {
                sites.push(s.site);
            });
            var uniqueSites = sites.filter( onlyUnique );
            var mainResult = [];
            uniqueSites.forEach( u => {

                var siteResult = [];
                asyncResult.forEach( ar => {
                     
                    if ( ar.site == u ) {
                        siteResult.push(ar);
                    }   
                });
                var obj = {"plantName": u, "siteResult": siteResult };
                mainResult.push(obj);
            });
            
            res.send({ "result": mainResult });  
        });
        // res.send({"results": listArray });
    }).catch(function(err) {
        res.send(err);
    });
});



router.get('/trialbalance_new', function(req, res, next) {
    var accountsArray = [];
    var mainArray = [];
   
    var rvopbal = 0;
    var matchCondition = {};
    var rrvopbal, accountType;

    var getMatchCondition = function () {
        var matchCondition = {};

        if(req.query.start_date) {
            matchCondition.avoudt = req.query.start_date;
        }
        
        if(req.query.end_date && req.query.start_date) {
            matchCondition.avoudt = {
                $gte: new Date(req.query.start_date),
                $lte: new Date(req.query.end_date)
            };
        }
        if(req.query.site_name){
            matchCondition.branch = req.query.site_name;
        } 
        
        if(req.query.account_name) {
            matchCondition.accountname = req.query.account_name;
        }

        return matchCondition;
    };
    
    

    // used to calculate balance using previous records before start date if start date is specified
    var calculateOpeningBalanceUsingOldRecords = function (defaultOpeningBalance, defaultAccountType, defaultAccount, cb) {
        var matchCond = {avoudt: {$lte: moment(req.query.start_date, 'YYYY-MM-DD').format("YYYY-MM-DD")}};
        if(req.query.site_name){
            matchCond.branch = req.query.site_name;
        } 
        
        if(defaultAccount) {
            matchCond.accountname = defaultAccount;
        }
        
        // console.log('matchConditionSite >>>>', matchCond);

        AccountsLedger.find(matchCond).sort({'avoudt': 1}).then(function (accountNameresults) {
            // var data = [];
            // accountNameresults.forEach(r => {
            //     defaultOpeningBalance = (Number(r.acrdtamt ? r.acrdtamt : 0) + defaultOpeningBalance) - Number(r.adebtamt ? r.adebtamt : 0);
            // });
            // var accType;
            // if(defaultAccountType){
            //     accType = defaultAccountType

            // } else {
            //     accType = defaultOpeningBalance > 0 ? 'Credit' : 'Debit'
            // }

            // console.log(' true >>>>');
            var data = [];
            var odebtamt = 0 
            var ocrdtamt = 0
            var alBranch = ''
            var alaccountName = ''
            var closing_balance = 0
            if(defaultAccountType === "Debit"){
                odebtamt = defaultOpeningBalance
            } else{
                ocrdtamt = defaultOpeningBalance
            }
            accountNameresults.forEach(r => {
                alBranch = r.branch;
                alaccountName = r.accountname;
                odebtamt = Number(odebtamt) + Number(r.adebtamt ? r.adebtamt : 0);
                ocrdtamt = Number(ocrdtamt) + Number(r.acrdtamt ? r.acrdtamt : 0);
            });
            var accType;
            if (odebtamt > ocrdtamt) {
                odebtamt = Number(odebtamt) - Number(ocrdtamt)
                ocrdtamt = 0 
                accType = 'Debit'
                closing_balance = odebtamt
            } else {
                odebtamt = 0 
                ocrdtamt  = Number(ocrdtamt) - Number(odebtamt)
                accType = 'Credit'
                closing_balance = ocrdtamt
            }
            var obj = {
                branch: alBranch,
                accountname: alaccountName,
                dr: odebtamt,
                cr: ocrdtamt,
                closing: closing_balance.toFixed(2)
            }
            data.push(obj);

            // console.log('data >>>', data);


            cb(false, data);
        }).catch(function (err) {
            console.log(err);
            cb(err, false);
        });
    };

    var findRecords = function (openingBalance, dataAccount, cb) {
        var closing_balance = openingBalance.opening_balance;
        var matchCond = getMatchCondition();
        if(dataAccount) {
            matchCond.accountname = dataAccount;
        }
        if(req.query.site_name) {
            matchCond.branch = req.query.site_name;
        }
        AccountsLedger.find(matchCond).sort({'avoudt': 1}).then(function (accountNameresults) {
            var data = [];
            accountNameresults.forEach(r => {
                if (r.accountname) {
                    var debtamt = r.adebtamt ? r.adebtamt : 0;
                    var crdtamt = r.acrdtamt ? r.acrdtamt : 0;
                    // console.log(r.adebtamt, r.crdtamt, closing_balance);
                    closing_balance = (closing_balance + Number(crdtamt)) - Number(debtamt);
                    // console.log("closing >>>", r.avoudt);
                    var obj = {
                        branch: r.branch,
                        accountname: r.accountname,
                        date: moment(r.avoudt).format('DD/MM/YYYY'),
                        // particular: r.arefno,
                        dr: r.adebtamt,
                        cr: r.acrdtamt,
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

    var calculateLedger = function(accountNameData) {
        return function (callback) {
            
            Accounts.findOne({"accountname": accountNameData}).then(r => {
                var vopbal = 0;
                var accountName = accountNameData;
                if(r) {
                    
                    accountName = accountName;
                    // console.log(r.ocrdr);
                    vopbal = 0;
                    if(r.ocrdr === "Debit"){
                        vopbal = vopbal + Number(r.opbal ? r.opbal : 0);
                        accountType = "Debit";
                        // console.log("Debit.....");
                    } else{
                        vopbal = vopbal - Number(r.opbal ? r.opbal : 0);
                        accountType = "Credit";
                        // console.log("Credit.....");
                    }
                    
                } else {
                    vopbal = 0;
                }
                rvopbal = vopbal;
                rrvopbal = rvopbal;

                // console.log(' opening balance  >>>>', vopbal);
                // console.log(' account type  >>>>', accountType);
                // console.log(' account name  >>>>',  accountName);
        
                if(req.query.start_date) {
                    calculateOpeningBalanceUsingOldRecords(rvopbal, accountType, accountName, function (err, results) {
                        if(err) {
                            return res.status(500).send(err);
                        }
                        // console.log('results >>>> ', results );

                        var closingBalance;
                        if(results && results.length > 0) {
                            closingBalance = Number(results[results.length - 1].closing)
                        } else {
                            closingBalance = 0;
                        }
                            // account_name: accountName,
                            // dr: closingBalance < 0 ? Math.abs(closingBalance) : 0,
                            // cr: closingBalance > 0 ? Math.abs(closingBalance) : 0,
                            // site_name: results.length > 0  ? results[0].branch : '',
                        
                            // console.log('closing balance >>>> ', closingBalance );
                            // console.log('accountname >>>> ', accountName );

                        callback(false, {
                            account_name: accountName, 
                            dr: Math.abs(results[0].dr.toFixed(2)),
                            cr: Math.abs(results[0].cr.toFixed(2))

                        });
                    });
                } else {
                    // findRecords(vopbal, accountName, function (err, results) {
                    //     if(err) {
                    //         return res.status(500).send(err);
                    //     }

                    //     var closingBalance;
                    //     if(results && results.length > 0) {
                    //         closingBalance = results && results.length > 0 ? Number(results[results.length - 1].closing) : 0;
                    //     } else {
                    //         closingBalance = 0;
                    //     }
                    //     callback(false, {
                    //         account_name: accountName,
                    //         dr: closingBalance < 0 ? Math.abs(closingBalance) : 0,
                    //         cr: closingBalance > 0 ? Math.abs(closingBalance) : 0,
                    //         site_name: results.length > 0  ? results[0].branch : '',
                    //     });
                    // });
                }
            }).catch(err => {
                console.log(err.stack);
                callback(err, null);
            });
        };
    };

    var matchConditionSite = {}; 

    if(req.query.site_name) {
        var matchConditionSite = {site: req.query.site_name};
    }
    // console.log('matchConditionSite >>>>', matchConditionSite);

    Accounts.find(matchConditionSite).then(function(resultData) {
        
        var accountNameArray = [];
        resultData.forEach(a => {
            accountNameArray.push(a.accountname);
        });
        
        // console.log("resultData matchConditonSite >>>>>>>>>>>", accountNameArray);
        
        var matchConditionAcc = {
            "accountname": { $in:  accountNameArray }
        };


        if (req.query.site_name) {
            matchConditionAcc.branch = req.query.site_name;
        }

        // console.log("resultData 1 >>>>>>>>>>>", matchConditionAcc);
        
        AccountsLedger.find(matchConditionAcc).distinct('accountname').then(function(result) {
            
            // console.log("Accounts LEdger >>>>>>>>>>>", result);

            var resultsArray = [];
            result.forEach(a => {
                resultsArray.push(calculateLedger(a));
            });

            // console.log ('resultsArray>>>>>>> Vinu ', resultsArray);
            // res.send({ "result": resultsArray });
            async.parallel(resultsArray, function(err, asyncResult) {
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

router.get('/site_monthly_outstanding', function(req, res, next) {
    var accountsArray = [];
    var mainArray = [];
   
    var rvopbal = 0;
    var matchCondition = {};
    var rrvopbal, accountType;

    var calculateOpeningBalanceUsingOldRecords = function (defaultOpeningBalance, defaultAccountType, defaultAccount, cb) {
        var matchCond = {avoudt: {$lte: moment(req.query.start_date, 'YYYY-MM-DD').format("YYYY-MM-DD")}};
        if(req.query.site_name){
            matchCond.branch = req.query.site_name;
        } 
        
        if(defaultAccount) {
            matchCond.accountname = defaultAccount;
        }
        
        console.log('matchConditionSite >>>>', matchCond);

        AccountsLedger.find(matchCond).sort({'avoudt': 1}).then(function (accountNameresults) {
            console.log(' true >>>>');
            var data = [];
            var odebtamt = 0 
            var ocrdtamt = 0
            var alBranch = ''
            var alaccountName = ''
            var closing_balance = 0
            if(defaultAccountType === "Debit"){
                odebtamt = defaultOpeningBalance
            } else{
                ocrdtamt = defaultOpeningBalance
            }
            accountNameresults.forEach(r => {
                alBranch = r.branch;
                alaccountName = r.accountname;
                odebtamt = Number(odebtamt) + Number(r.adebtamt ? r.adebtamt : 0);
                ocrdtamt = Number(ocrdtamt) + Number(r.acrdtamt ? r.acrdtamt : 0);
            });
            var accType;
            if (odebtamt > ocrdtamt) {
                odebtamt = Number(odebtamt) - Number(ocrdtamt)
                ocrdtamt = 0 
                accType = 'Debit'
                closing_balance = odebtamt
            } else {
                odebtamt = 0 
                ocrdtamt  = Number(ocrdtamt) - Number(odebtamt)
                accType = 'Credit'
                closing_balance = ocrdtamt
            }
            var obj = {
                branch: alBranch,
                accountname: alaccountName,
                dr: odebtamt,
                cr: ocrdtamt,
                closing: closing_balance.toFixed(2)
            }
            data.push(obj);

            console.log('data >>>', data);


            cb(false, data);
        }).catch(function (err) {
            console.log(err);
            cb(err, false);
        });
    };

    var calculateLedger = function(accountNameData) {
        return function (callback) {
            
            Accounts.findOne({"accountname": accountNameData}).then(r => {
                var vopbal = 0;
                var accountName = accountNameData;
                if(r) {
                    
                    accountName = accountName;
                    // console.log(r.ocrdr);
                    vopbal = 0;
                    if(r.ocrdr === "Debit"){
                        vopbal = vopbal + Number(r.opbal ? r.opbal : 0);
                        accountType = "Debit";
                        // console.log("Debit.....");
                    } else{
                        vopbal = vopbal - Number(r.opbal ? r.opbal : 0);
                        accountType = "Credit";
                        // console.log("Credit.....");
                    }
                    
                } else {
                    vopbal = 0;
                }
                rvopbal = vopbal;
                rrvopbal = rvopbal;

                if(req.query.start_date) {
                    calculateOpeningBalanceUsingOldRecords(rvopbal, accountType, accountName, function (err, results) {
                        if(err) {
                            return res.status(500).send(err);
                        }
                        console.log('results >>>> ', results );

                        var closingBalance;
                        if(results && results.length > 0) {
                            closingBalance = Number(results[results.length - 1].closing)
                        } else {
                            closingBalance = 0;
                        }
                            console.log('closing balance >>>> ', closingBalance );
                            console.log('accountname >>>> ', accountName );

                        callback(false, {
                            account_name: accountName, 
                            dr: Math.abs(results[0].dr.toFixed(2)),
                            cr: Math.abs(results[0].cr.toFixed(2))

                        });
                    });
                } else {
                    // findRecords(vopbal, accountName, function (err, results) {
                    //     if(err) {
                    //         return res.status(500).send(err);
                    //     }

                    //     var closingBalance;
                    //     if(results && results.length > 0) {
                    //         closingBalance = results && results.length > 0 ? Number(results[results.length - 1].closing) : 0;
                    //     } else {
                    //         closingBalance = 0;
                    //     }
                    //     callback(false, {
                    //         account_name: accountName,
                    //         dr: closingBalance < 0 ? Math.abs(closingBalance) : 0,
                    //         cr: closingBalance > 0 ? Math.abs(closingBalance) : 0,
                    //         site_name: results.length > 0  ? results[0].branch : '',
                    //     });
                    // });
                }
            }).catch(err => {
                console.log(err.stack);
                callback(err, null);
            });
        };
    };

    if (req.query.category == "") {
        var matchConditionCategory = {
            "$or": [{
                "category": "Sundry Creditors"
            } , {
                "category": "Sundry Debtors"
            }]
        };
        if(req.query.site_name) {
            matchConditionCategory.site = req.query.site_name;
        }
    } else {
        var matchConditionCategory = { "category": req.query.category };
        if(req.query.site_name) {
            matchConditionCategory.site = req.query.site_name;
        }
    
    }


    Accounts.find(matchConditionCategory).then(function(resultData) {
        
        var accountNameArray = [];
        resultData.forEach(a => {
            accountNameArray.push(a.accountname);
        });
        
        // console.log("resultData matchConditonSite >>>>>>>>>>>", accountNameArray);
        
        var matchConditionAcc = {
            "accountname": { $in:  accountNameArray }
        };


        if (req.query.site_name) {
            matchConditionAcc.branch = req.query.site_name;
        }

        // console.log("resultData 1 >>>>>>>>>>>", matchConditionAcc);
        
        AccountsLedger.find(matchConditionAcc).distinct('accountname').then(function(result) {
            
            // console.log("Accounts LEdger >>>>>>>>>>>", result);

            var resultsArray = [];
            result.forEach(a => {
                resultsArray.push(calculateLedger(a));
            });

            console.log ('resultsArray>>>>>>> Vinu', resultsArray);

            async.parallel(resultsArray, function(err, asyncResult) {

                console.log ('asyncResult>>>>>>> ', asyncResult);

                console.log("ERROR >>> Vinu", err);
                // res.send({ "result": asyncResult });  
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

module.exports = router;