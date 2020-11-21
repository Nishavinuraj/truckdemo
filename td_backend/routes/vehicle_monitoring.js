var express = require('express');
var router = express.Router();
var Billty = require('../models/billties');
var Trucks = require('../models/trucks');
var FT = require('../models/fleetstarget');
var async = require('async');
var momentTZ = require('moment-timezone');
var PlantsTruckPosition = require('../models/plantstruckposition');
var ExtraReturnExpences = require('../models/extrareturnexpences');
var TruckMaintenance = require('../models/truck_maintenance');
var TyreMaintenance = require('../models/tyre_maintenance');
var Maintenance = require('../models/maintenance');
var moment = require('moment');


router.get('/by_site_old', function(req, res, next) {
    var page, limit, offset;

    page = req.query.page ? req.query.page : 1;
    limit = req.query.limit ? req.query.limit : 50;
    offset = (page - 1) * limit;

    Trucks.find({ taname: req.query.traffic_agent }).then(function (trucksResult) {
        var truckNos = [];
        trucksResult.forEach(t => {
            truckNos.push(t.truckno);
        });

        var matchCondition = { truckno: { $in: truckNos }, completed: "No"  };

        Billty.find(matchCondition).skip(offset).limit(limit).then(function (result) {
            var mainArray = [];
            var srno = 1;
            result.forEach(r => {
                var obj = {
                    "id": r._id,
                    "srno": srno,
                    "truckno": r.truckno,
                    "lrno": r.lrno,
                    "date": r.lrdate,
                    "from": r.from,
                    "to": r.to,
                    "m_ton": r.actualweight,
                    "customer_name": r.consignne,
                    "map": "",   
                    "km": r.newkm,
                    "currentlocation": r.currentlocation,
                    "tripsstatus": r.tripsstatus,
                    "remark": r.remark,
                    "completed": r.completed,             
                }
                srno = srno + 1;
                mainArray.push(obj);
            });
            mainArray.sort(function(a, b){
                return a.date > b.date ? -1 :  a.date < b.date ? 1 : 0;
            });
            res.send({ "result": mainArray});
    
        }).catch(function(err) {
            res.send(err);
        });
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/by_site', function(req, res, next) {
    var page, limit, offset;

    page = req.query.page ? req.query.page : 1;
    limit = req.query.limit ? req.query.limit : 50;
    offset = (page - 1) * limit;



    var calculateBillty = function(data, srno) {
        return function (callback) {
            
            var matchCondition = { truckno: data, completed: "No"  };
            Billty.find(matchCondition).skip(offset).limit(limit).then(function (result) {
                var obj = {};
                if (result[0]) {
                    console.log("Yes   >>>>", data);
                    obj = {
                        "id": result[0]._id,
                        "srno": srno,
                        "truckno": result[0].truckno,
                        "lrno": result[0].lrno,
                        "date": result[0].lrdate,
                        "from": result[0].from,
                        "to": result[0].to,
                        "m_ton": result[0].actualweight,
                        "customer_name": result[0].consignne,
                        "map": "",   
                        "km": result[0].newkm,
                        "currentlocation": result[0].currentlocation,
                        "tripsstatus": result[0].tripsstatus,
                        "remark": result[0].remark,
                        "completed": result[0].completed,    
                        "flag": true,          
                    }
                    callback(false, obj);
                } else {
                    console.log("No   >>>>", data);
                    obj = {
                        "id": "--",
                        "srno": srno,
                        "truckno": data,
                        "lrno": "--",
                        "date": "",
                        "from": "--",
                        "to": "--",
                        "m_ton": "--",
                        "customer_name": "--",
                        "map": "--",
                        "km": "--",
                        "currentlocation": "--",
                        "tripsstatus": "--",
                        "remark": "--",
                        "completed": "--",
                        "flag": false,
                    }
                    callback(false, obj);
                }

                
            }).catch(function(err) {
                callback(err, null);
            });
                 
        };
    };



    Trucks.find({ taname: req.query.traffic_agent }).then(function (trucksResult) {
        var truckNos = [];
        var srno = 1;
        trucksResult.forEach(t => {
            truckNos.push(calculateBillty(t.truckno, srno));
            srno = srno + 1;
        });

        async.parallel(truckNos, function(err, asyncResults) {
            
            // var srno = 1;
            // var mainArray = [];
            // asyncResults.forEach(s =>{
            //     s.srno = srno;
            //     mainArray.push(s);
            //     srno = srno + 1;
            // });
            asyncResults.sort(function(a, b){
                return a.date > b.date ? -1 :  a.date < b.date ? 1 : 0;
            });
            res.send({ "result": asyncResults });  
        });

    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/by_truck', function(req, res, next) {
    var page, limit, offset;

    page = req.query.page ? req.query.page : 1;
    limit = req.query.limit ? req.query.limit : 50;
    offset = (page - 1) * limit;



    var calculateBillty = function(data, srno) {
        return function (callback) {
            
            var matchCondition = { truckno: data, completed: "No"  };
            Billty.find(matchCondition).skip(offset).limit(limit).then(function (result) {
                var obj = {};
                if (result[0]) {
                    console.log("Yes   >>>>", data);
                    obj = {
                        "id": result[0]._id,
                        "srno": srno,
                        "truckno": result[0].truckno,
                        "lrno": result[0].lrno,
                        "date": result[0].lrdate,
                        "from": result[0].from,
                        "to": result[0].to,
                        "m_ton": result[0].actualweight,
                        "customer_name": result[0].consignne,
                        "map": "",   
                        "km": result[0].newkm,
                        "currentlocation": result[0].currentlocation,
                        "tripsstatus": result[0].tripsstatus,
                        "remark": result[0].remark,
                        "completed": result[0].completed,    
                        "flag": true,          
                    }
                    callback(false, obj);
                } else {
                    console.log("No   >>>>", data);
                    obj = {
                        "id": "--",
                        "srno": srno,
                        "truckno": data,
                        "lrno": "--",
                        "date": "",
                        "from": "--",
                        "to": "--",
                        "m_ton": "--",
                        "customer_name": "--",
                        "map": "--",
                        "km": "--",
                        "currentlocation": "--",
                        "tripsstatus": "--",
                        "remark": "--",
                        "completed": "--",
                        "flag": false,
                    }
                    callback(false, obj);
                }

                
            }).catch(function(err) {
                callback(err, null);
            });
                 
        };
    };



    Trucks.findOne({ "truckno": req.query.truckno }).then(function (trucksResult) {
        // res.send(trucksResult);
        Billty.find({ "truckno": req.query.truckno, "completed": "No"  }).sort({"lrdate": -1}).skip(offset).limit(limit).then(function (result) {
            var obj = {};
            if (result[0]) {
                console.log("Yes   >>>>");
                obj = {
                    "id": result[0]._id,
                    "srno": 1,
                    "truckno": result[0].truckno, 
                    "taname": trucksResult.taname, 
                    "site": result[0].site,
                    "lrno": result[0].lrno,
                    "date": result[0].lrdate,
                    "from": result[0].from,
                    "to": result[0].to,
                    "m_ton": result[0].actualweight,
                    "customer_name": result[0].consignne,
                    "map": "",   
                    "km": result[0].newkm,
                    "currentlocation": result[0].currentlocation,
                    "tripsstatus": result[0].tripsstatus,
                    "remark": result[0].remark,
                    "completed": result[0].completed,    
                    "flag": true,          
                }
                res.send({"result": obj});
            } else {
                console.log("No   >>>>");
                obj = {
                    "id": "--",
                    "srno": 1,
                    "truckno": req.query.truckno,
                    "taname": trucksResult.taname,
                    "site": "--",
                    "lrno": "--",
                    "date": "",
                    "from": "--",
                    "to": "--",
                    "m_ton": "--",
                    "customer_name": "--",
                    "map": "--",
                    "km": "--",
                    "currentlocation": "--",
                    "tripsstatus": "--",
                    "remark": "--",
                    "completed": "--",
                    "flag": false,
                }
                res.send({"result": obj});
            }

        }).catch(function(err) {
            console.log("err  >>>>", err);
            res.send(err);
        });
    }).catch(function(err) {
        res.send(err);
    });
});

router.put('/update', function(req, res, next) {

    try {
        Billty.updateOne({ _id: req.query.id }, { $set: req.body }).then(function (result) {
            res.send({"result": "Updated...!"});
        }).catch(function(err) {
            console.log("err >>>>>", err);
            res.send(err);
        });
     } catch (e) {
        res.send(err);
     }
});

router.get('/performance', function (req, res, next) {

    matchCondition = {};

    var getBilltyData = function (matchCondition, cb) {
        Billty.aggregate([
            {
                $match: matchCondition,
            },
            {
                $group: {
                    _id: { $substr: ['$lrdate', 5, 2] },
                    
                    lrno:{ $push: '$lrno' },

                    trips: {
                        $sum: 1
                    },
                    
                    mtons: {
                        $sum: '$actualweight'
                    },
                    freight: {
                        $sum: '$finalamount'
                    },
                    jstc: {
                        $sum: '$totaltruckexpences'
                    },
                    party: {
                        $sum: '$padvance'
                    },
                    diesal_amount: {
                        $sum: '$damount'
                    },
                    P_Freight: {
                        $sum: '$vamount'
                    },
                    C_Freight: {
                        $sum: '$newamount'
                    },

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

                r.comm = r.C_Freight - r.P_Freight;
                r.month = month[parseInt(r._id)];
                // console.log("month name >>", r.month);
            });
            var data = results;
            // console.log(results);
            cb(false, data);
        }).catch(function (err) {
            console.log(err);
            cb(err, false);
        });

    };

    var calculateFleetTargets = function(monthName, data) {
        return function (callback) {
            var inMatchCondition = req.query
            var target = 0;
            FT.find(inMatchCondition).then((fromResults) => {
                fromResults.forEach(z => {

                    var allMonths = z.months;
                    allMonths.forEach(x => {
                       if(x.name == monthName){
                            target = x.target;
                            console.log(">>>>", x.target);
                       }
                        
                    });
                });
                console.log(" data  >>>>", data);
                data.target = target;
                callback(false, data);
                }).catch(err => {
                console.log(err.stack);
                callback(err, null);
            });
        };
    };

    var calculateOther = function(data) {
        return function (callback) {
            // data.lrno
            ExtraReturnExpences.find({ "lrno": { $in:  data.lrno } }).select({"multidest.acamt": 1, _id:0 }).then((fromResults) => {
                // console.log(" data  >>>>", fromResults);
                var acamt = 0;
                fromResults.forEach( r => {
                    var multidest  = r.multidest;
                    multidest.forEach( a => {
                        acamt  =  Number(acamt) + Number(a.acamt);
                        console.log("acamt >>>>", acamt);
                    });
                });
                data.other = acamt;
                callback(false, data);
                }).catch(err => {
                console.log(err.stack);
                callback(err, null);
            });
        };
    };

    if (req.query.year && req.query.truckno) {
        startYear = req.query.year + "-01-01";
        endYear = req.query.year + "-12-31";

        matchCondition.truckno = {
            $eq: req.query.truckno,
        };
        matchCondition.lrdate = {
            $gte: new Date(startYear),
            $lte: new Date(endYear)
        };
    }


    getBilltyData(matchCondition, function (err, result) {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }

        console.log("query  >>>>", req.query);
        var billtyResult = [];
        result.forEach(a => {
            // console.log("month  >>>>>>", a.month);
            billtyResult.push(calculateFleetTargets(a.month, a));
        });

        async.parallel(billtyResult, function(err, asyncResult) {
            console.log("ERROR >>> ", err);
            var total = 0;
            var mainArray = []
            asyncResult.forEach(a => {
                //   need to put salary emi other things here
                
                // total = a.target - a.freight - a.diesal_amount + a.comm;
                total =  a.freight - a.diesal_amount + a.comm;
                // console.log(" >>>>>>", a);
                // a.gross_profit = a.freight - a.other - a.diesal_amount + a.comm;
                a.gross_profit = a.freight - a.diesal_amount + a.comm;
                // a.net_profit = total;
                a.net_profit = a.freight - a.diesal_amount + a.comm;;
                mainArray.push(calculateOther(a));
            });

            async.parallel(mainArray, function(err, asyncResults) {   
                res.send({ "result": asyncResults });  
            }); 
        });


        // res.send(result);
    });

});

router.get('/monthly', function (req, res, next) {

    matchCondition = {};

    var getBilltyData = function (matchCondition, cb) {
        Billty.aggregate([
            {
                $match: matchCondition,
            },
            {
                $group: {
                    _id: '$truckno',
                    
                    lrno:{ $push: '$lrno' },

                    trips: {
                        $sum: 1
                    },
                    
                    mtons: {
                        $sum: '$actualweight'
                    },
                    freight: {
                        $sum: '$finalamount'
                    },
                    jstc: {
                        $sum: '$totaltruckexpences'
                    },
                    party: {
                        $sum: '$padvance'
                    },
                    diesal_amount: {
                        $sum: '$damount'
                    },
                    P_Freight: {
                        $sum: '$vamount'
                    },
                    C_Freight: {
                        $sum: '$newamount'
                    },

                }
            },

        ]).sort({ _id: 1 }).then(function (results) {

            results.forEach(r => {

                r.comm = r.C_Freight - r.P_Freight;
            });
            var data = results;
            // console.log(results);
            cb(false, data);
        }).catch(function (err) {
            console.log(err);
            cb(err, false);
        });

    };

    var calculateFleetTargets = function(monthNames, dateYear, data) {
        return function (callback) {

            // console.log("calculateFleetTargets  >>>>"); 
            var target = 0;
            FT.find({"truckno": data._id, "year": dateYear }).then((fromResults) => {
                fromResults.forEach(z => {
                    var allMonths = z.months;
                    allMonths.forEach(x => {
                        monthNames.forEach(monthName => {
                            if(x.name == monthName){
                                target = target + Number(x.target);
                                console.log("target  >>>>", x.target);
                                console.log("target Sum  >>>>", x.target);
                            }
                        });
                    });
                });
                // console.log(" data  >>>>", data);
                data.target = target;
                callback(false, data);
                
            }).catch(err => {
                console.log(err.stack);
                callback(err, null);
            });                   
        };
    };

    var calculateOther = function(data) {
        return function (callback) {
            // data.lrno
            ExtraReturnExpences.find({ "lrno": { $in:  data.lrno } }).select({"multidest.acamt": 1, _id:0 }).then((fromResults) => {
                // console.log(" data  >>>>", fromResults);
                var acamt = 0;
                fromResults.forEach( r => {
                    var multidest  = r.multidest;
                    multidest.forEach( a => {
                        acamt  =  Number(acamt) + Number(a.acamt);
                        // console.log("acamt >>>>", acamt);
                    });
                });
                data.other = acamt;
                callback(false, data);
                }).catch(err => {
                console.log(err.stack);
                callback(err, null);
            });
        };
    };

    if (req.query.truckno) {
        matchCondition.truckno = {
            $eq: req.query.truckno,
        };
    }

    if(req.query.start_date && req.query.end_date) {
        matchCondition.lrdate = {
            $gte: new Date(req.query.start_date),
            $lte: new Date(req.query.end_date)
        };
    }

    console.log("query  >>>>", matchCondition);

    getBilltyData(matchCondition, function (err, result) {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        // res.send(result);
        var billtyResult = [];

        var dateStart = moment(req.query.start_date).format('M');
        var dateEnd = moment(req.query.end_date).format('M');
        var dateYear = moment(req.query.end_date).format('YYYY')

        console.log("dateStart  >>>>", dateStart);
        console.log("dateEnd  >>>>", dateEnd);
        console.log("dateYear  >>>>", dateYear);


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

        var monthsArray = []
        while (dateStart <= dateEnd) {
            console.log("month >", month[dateStart]);
            monthsArray.push(month[dateStart]);
            dateStart++;
        }
        result.forEach(a => {

            billtyResult.push(calculateFleetTargets(monthsArray, dateYear, a));
        });

        async.parallel(billtyResult, function(err, asyncResult) {
            console.log("ERROR >>> ", err);
            var total = 0;
            var mainArray = [];
            asyncResult.forEach(a => {
                var total = a.target - a.party - a.other - a.diesal_amount + a.comm;
                // console.log(" >>>>>>", a);
                a.net_profit = total;
                mainArray.push(calculateOther(a));
            });


            async.parallel(mainArray, function(err, asyncResults) {   
                var mainResultsArray = [];
                asyncResults.forEach(aa => {
                    var total = aa.target - aa.party - aa.other - aa.diesal_amount + aa.comm;
                    aa.net_profit = total;
                    console.log(" >>>>>>", aa);
                    mainResultsArray.push(aa);
                    console.log("total  >>>>>>>>>>>>>>>>>>>", total);
                    
                })
                res.send({ "result": mainResultsArray });  
            }); 
        });


        // res.send(result);
    });

});

router.get('/daily', function(req, res, next) {

    var page, limit, offset;

    page = req.query.page ? req.query.page : 1;
    limit = req.query.limit ? req.query.limit : 50;
    offset = (page - 1) * limit;


    var matchCondition = { "truckno": req.query.truck_no };
    if (req.query.start_date && req.query.end_date) {
            var start = momentTZ(req.query.start_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD');
            var end = momentTZ(req.query.end_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD');
            var startDate = new Date(start);
            var endDate = new Date(end)
            startDate.setUTCHours(00,00,00,000);
            endDate.setUTCHours(23,59,59,999);
            matchCondition.lrdate = {
                // $eq: req.query.start_date
                $gte: startDate,
                $lte: endDate
            };
        }

    console.log('Match Condition V>>>>', matchCondition);
    
    var calculateOther = function(data) {
        return function (callback) {
            // data.lrno
            console.log(" data Lrno >>>>", data.lrno);

            ExtraReturnExpences.find({ "lrno": data.lrno  }).select({"multidest.acamt": 1, _id:0 }).then((fromResults) => {
                console.log(" data  >>>>", fromResults);
                var acamt = 0;
                fromResults.forEach( r => {
                    var multidest  = r.multidest;
                    multidest.forEach( a => {
                        acamt  = a.acamt;
                        console.log("acamt >>>>", acamt);
                    });
                });

                data.other = acamt;
                callback(false, data);
                }).catch(err => {
                console.log(err.stack);
                callback(err, null);
            });
        };
    };
    var mainArray = [];
    Billty.find(matchCondition).skip(offset).limit(limit).then(function (result) {
        
        var sno = 1;
        for(var i = 0 ; i < result.length;i++){
            let r = result[i];
            if(!r.newamount){
                r.newamount = 0;
            }
            if(!r.damount){
                r.damount = 0;
            }
            if(!r.vamount){
                r.vamount = 0;
            }
            if(!r.totaltruckexpences){
                r.totaltruckexpences = 0;
            }
            let obj = {};
            obj["sno"]= sno
            obj["lrno"]= r.lrno
            obj["truckno"]= r.truckno
            obj["date"]= r.lrdate
            obj["from"]= r.from
            obj["to"]= r.to
            obj["km"]= Number(r.newkm) + Number(r.newkm)
            obj["qty"]= r.cweight
            obj["rate"]= r.newrate
            obj["freight"]= r.newamount
            obj["dqty"]= r.dqty
            obj["damount"]= r.damount
            obj["JSTC_Adv"]= r.totaltruckexpences
            obj["Party_Adv"]= r.padvance ? r.padvance : 0
            obj["tot_exp"]= Number(r.damount.toFixed(2)) + Number(r.totaltruckexpences.toFixed(2))
            obj["comm"]= (r.newamount - r.vamount ).toFixed(2)
            obj["gross_profit"]= Number(r.newamount.toFixed(2)) - Number(r.damount.toFixed(2)) - Number(r.totaltruckexpences.toFixed(2))
            sno = sno + 1; 
            mainArray.push(calculateOther(obj))
        }
        
       async.parallel(mainArray, function(err, asyncResult) {
            
            res.send({ "result": asyncResult });  
        });

    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/summary', function(req, res, next) {

    var page, limit, offset;

    page = req.query.page ? req.query.page : 1;
    limit = req.query.limit ? req.query.limit : 50;
    offset = (page - 1) * limit;


    var matchCondition = { "truckno": req.query.truck_no };
    if (req.query.start_date && req.query.end_date) {
        var start = momentTZ(req.query.start_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD');
        var end = momentTZ(req.query.end_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD');
        var startDate = new Date(start);
        var endDate = new Date(end)
        startDate.setUTCHours(00,00,00,000);
        endDate.setUTCHours(23,59,59,999);
        matchCondition.lrdate = {
            $gte: startDate,
            $lte: endDate
        };
    }

    var calculateOther = function(data) {
        return function (callback) {
            // data.lrno
            console.log(" data Lrno >>>>", data.lrno);

            ExtraReturnExpences.find({ "lrno": data.lrno  }).select({"multidest.acamt": 1, _id:0 }).then((fromResults) => {
                console.log(" data  >>>>", fromResults);
                var acamt = 0;
                fromResults.forEach( r => {
                    var multidest  = r.multidest;
                    multidest.forEach( a => {
                        acamt  = a.acamt;
                        console.log("acamt >>>>", acamt);
                    });
                });

                data.other = acamt;
                callback(false, data);
                }).catch(err => {
                console.log(err.stack);
                callback(err, null);
            });
        };
    };

    console.log('Matchcondition>>>>>', matchCondition );

    Billty.find(matchCondition).skip(offset).limit(limit).then(function (result) {
        var mainArray = [];

        var sno = 1;
        for(var i = 0 ; i < result.length;i++){
            let r = result[i];
            if(!r.newamount){
                r.newamount = 0;
            }
            if(!r.damount){
                r.damount = 0;
            }
            if(!r.vamount){
                r.vamount = 0;
            }
            if(!r.totaltruckexpences){
                r.totaltruckexpences = 0;
            }
            let obj = {};
            obj["sno"]= sno
            obj["lrno"]= r.lrno
            obj["truckno"]= r.truckno
            obj["date"]= r.lrdate
            obj["from"]= r.from
            obj["to"]= r.to
            obj["km"]= Number(r.newkm) + Number(r.newkm)
            obj["qty"]= r.cweight
            obj["rate"]= r.newrate
            obj["freight"]= r.newamount
            obj["dqty"]= r.dqty
            obj["damount"]= r.damount
            obj["JSTC_Adv"]= r.totaltruckexpences
            obj["Party_Adv"]= r.padvance ? r.padvance : 0
            obj["tot_exp"]= Number(r.damount.toFixed(2)) + Number(r.totaltruckexpences.toFixed(2))
            obj["comm"]= (r.newamount - r.vamount ).toFixed(2)
            obj["gross_profit"]= Number(r.newamount.toFixed(2)) - Number(r.damount.toFixed(2)) - Number(r.totaltruckexpences.toFixed(2))
            sno = sno + 1; 
            mainArray.push(calculateOther(obj))
        }

        async.parallel(mainArray, function(err, asyncResult) {
            var totalFreightAmount = 0;
            var totalComm = 0;
            var totalDiesalAmount = 0;
            var totalTripAmount = 0;
            var totalTotalAmount = 0;
            var totalDriverSalary = 0;
            var totalEMi = 0;
            var totalTyre = 0;
            var totalDoc = 0;
            var totalFinalAmount = 0;

            
            asyncResult.forEach(d => {
                totalFreightAmount = totalFreightAmount + d.freight;
                totalComm = totalComm + Number(d.comm);
                totalDiesalAmount = totalDiesalAmount + d.damount;
                totalTripAmount = totalTripAmount + d.JSTC_Adv;
                
                totalTotalAmount = totalFreightAmount + totalComm - totalDiesalAmount - totalTripAmount;
            });

            

            var obj = {
                "freight_amount": totalFreightAmount,
                "comm": totalComm,
                "diesal_amount": totalDiesalAmount,
                "trip_amount": totalTripAmount,
                "total_amount": totalTotalAmount,
                "driver_salary": totalDriverSalary,
                "emi": totalEMi,
                "tyre": totalTyre,
                "doc": totalDoc,
                "final_amount": totalTotalAmount,
            };
            console.log('Matchcondition>>>>>Result', obj );
            res.send({ "result": obj });  
        });
        // res.send({ "result": mainArray});

    }).catch(function(err) {
        res.send(err);
    });
});


router.get('/screen_one', function(req, res, next) {


    var getMaintenance = function(data) {
        return function (callback) {
            // data.lrno
            Maintenance.findOne({"truckno": data.truckno}).sort({"time": -1}).then((fromResults) => {
                
                if (fromResults == null) {
                    // console.log(" data  >>>>", fromResults, " >>>", data.truckno );
                    callback(false, data);
                } else {
                    // data.date = fromResults.pdate
                    // console.log(" Yesssss  >>>>");
                    callback(false, fromResults);
                }
            }).catch(err => {
            console.log(err.stack);
            callback(err, null);
            });
        };
    };


    var matchCondition = { "vtype" : "Company" };

    if (req.query.traffic_agent) {
        matchCondition = { "taname": req.query.traffic_agent, "vtype" : "Company" }
    }
    Trucks.find(matchCondition).then(function (trucksResult) {
        var trucks= [];

        trucksResult.forEach(t => {
            var obj = {
                "taname": t.taname,
                "truckno": t.truckno
            }
            // trucks.push(obj);
            trucks.push(getMaintenance(obj));
        });
        // res.send({ "result": trucks });  

        async.parallel(trucks, function(err, asyncResult) {
            res.send({ "result": asyncResult });
        });
    }).catch(function(err) {
        res.send(err);
    });
});


router.get('/screen_one_demo', function(req, res, next) {
    
    var sortlist = function(data) {
        return function (callback) {
            // data.lrno
            PlantsTruckPosition.findOne({"truckno": data.truckno}).sort({"pdate": -1}).then((fromResults) => {
                
                if (fromResults == null) {
                    // console.log(" data  >>>>", fromResults, " >>>", data.truckno );
                    callback(false, null);
                } else {
                    data.date = fromResults.pdate
                    callback(false, data);
                }
                // callback(false, data);
                }).catch(err => {
                console.log(err.stack);
                callback(err, null);
            });
        };
    };
    

    var matchCondition = { "vtype" : "Company" };
    if (req.query.traffic_agent) {
        matchCondition = { "taname": req.query.traffic_agent, "vtype" : "Company" }
    }
    Trucks.find(matchCondition).then(function (trucksResult) {
        var trucks= [];
        var allTrucks= [];

        trucksResult.forEach(t => {
            var obj = {
                "taname": t.taname,
                "truckno": t.truckno
            }
            allTrucks.push(obj);
            trucks.push(sortlist(obj));
            
        });

        async.parallel(trucks, function(err, asyncResult) {
            
            // remove null value
            var filtered = asyncResult.filter(function (el) { return el != null; });              

            // sorting 
            filtered.sort(function(a, b){
                return a.date > b.date ? -1 :  a.date < b.date ? 1 : 0;
            });

            // concate both Array 
            allTrucks.forEach(b => { 
                if (filtered.indexOf(b) > -1) {
                    // console.log("Yes....");
                } else {
                    // console.log("No....");
                    filtered.push(b);
                }
            });

            // delete date from obj
            filtered.forEach(b => { 
                delete b.date;
            })
            
            res.send({ "result": filtered });
        });
          
    }).catch(function(err) {
        res.send(err);
    });
});

router.post('/add_maintenance', function(req, res, next) {

    function largest(a, b) {
        if(a > b)
            return a;
        else if(a === b)
            return a;
        else
            return b;
    }

    if (req.body.truck_maintenance == "Yes" && req.body.tyre_maintenance == "Yes") {

        var new_srno, truck_max_srno = 0, tyre_max_srno = 0;
        TyreMaintenance.findOne().sort({srno: -1}).then(function(result) {
            if(result && result.srno){
                truck_max_srno = result.srno;
            } else {
                truck_max_srno = 0;
            }

            TruckMaintenance.findOne().sort({srno: -1}).then(function(result) {
                if(result && result.srno){
                    tyre_max_srno = result.srno;
                } else {
                    tyre_max_srno = 0;
                }

                var max = largest(truck_max_srno, tyre_max_srno);
                var max_srno = max + 1;

                req.body.srno = max_srno;
                req.body.particulars = req.body.truck_particulars ? req.body.truck_particulars: "";

                //  Add Truck Maintenance.......
                var d = new TruckMaintenance(req.body);
        
                d.save(function (err, save) {
                // console.log("err  >>>",err);
                // console.log("save  >>>",save);


                req.body.srno = max_srno + 1;
                req.body.particulars = req.body.tyre_particulars ? req.body.tyre_particulars: "";
                var d2 = new TyreMaintenance(req.body);
    
                d2.save(function (err, save) {
                // console.log("err  >>>",err);
                // console.log("save  >>>",save);
                res.send({"message": "Added..!"}); 
                });

                });                    
                
            }).catch(function(err) {
                //console.log("err   >>>>",err);
                res.send(err);
            });
        }).catch(function(err) {
            //console.log("err   >>>>",err);
            res.send(err);
        });

    } else if (req.body.truck_maintenance == "Yes") {

        var new_srno, truck_max_srno = 0, tyre_max_srno = 0;
        TyreMaintenance.findOne().sort({srno: -1}).then(function(result) {
            if(result && result.srno){
                truck_max_srno = result.srno;
            } else {
                truck_max_srno = 0;
            }

            TruckMaintenance.findOne().sort({srno: -1}).then(function(result) {
                if(result && result.srno){
                    tyre_max_srno = result.srno;
                } else {
                    tyre_max_srno = 0;
                }

                var max = largest(truck_max_srno, tyre_max_srno);
                var max_srno = max + 1;

                req.body.srno = max_srno;
                req.body.particulars = req.body.truck_particulars ? req.body.truck_particulars: "";
                var d = new TruckMaintenance(req.body);
        
                d.save(function (err, save) {
                // console.log("err  >>>",err);
                // console.log("save  >>>",save);
                res.send({"message": "Added..!"}); 
                });
                    
                
            }).catch(function(err) {
                //console.log("err   >>>>",err);
                res.send(err);
            });
        }).catch(function(err) {
            //console.log("err   >>>>",err);
            res.send(err);
        }); 

    } else if (req.body.tyre_maintenance == "Yes"){
        var new_srno, truck_max_srno = 0, tyre_max_srno = 0;
        TyreMaintenance.findOne().sort({srno: -1}).then(function(result) {
            if(result && result.srno){
                truck_max_srno = result.srno;
            } else {
                truck_max_srno = 0;
            }

            TruckMaintenance.findOne().sort({srno: -1}).then(function(result) {
                if(result && result.srno){
                    tyre_max_srno = result.srno;
                } else {
                    tyre_max_srno = 0;
                }

                var max = largest(truck_max_srno, tyre_max_srno);
                var max_srno = max + 1;

                req.body.srno = max_srno;
                req.body.particulars = req.body.tyre_particulars ? req.body.tyre_particulars: "";
                var d = new TyreMaintenance(req.body);
        
                d.save(function (err, save) {
                // console.log("err  >>>",err);
                // console.log("save  >>>",save);
                res.send({"message": "Added..!"}); 
                });
                    
                
            }).catch(function(err) {
                //console.log("err   >>>>",err);
                res.send(err);
            });
        }).catch(function(err) {
            //console.log("err   >>>>",err);
            res.send(err);
        }); 
    } else {
        res.send({"message": "Maintenance not selected....! "});
    }
     
});

router.post('/save_maintenance', function(req, res, next) {

    if (req.body.truck_maintenance == "Yes") {
        req.body.truck_maintenance = "Yes";
    } else {
        req.body.truck_maintenance = "No";
    }

    if (req.body.tyre_maintenance == "Yes") {
        req.body.tyre_maintenance = "Yes";
    } else {
        req.body.tyre_maintenance = "No";
    }
    delete req.body._id;
    delete req.body.date;
    delete req.body.time;
    var d2 = new Maintenance(req.body);
    
    d2.save(function (err, save) {
    // console.log("err  >>>",err);
    // console.log("save  >>>",save);
    res.send({"message": "Added..!"}); 
    });
});

router.get('/maintenance_list', function(req, res, next) {

    var matchCondition = {};
    if (req.query.truck_no) {
        matchCondition = { "truckno": req.query.truck_no };
    }
    Maintenance.find(matchCondition).sort({"time": -1}).then( function(result) {
        
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});



module.exports = router;