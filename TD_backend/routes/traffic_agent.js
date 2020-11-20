var express = require('express');
var router = express.Router();
var DocumentMaster = require('../models/documentmaster');
var Reminders = require('../models/reminders');
var Trucks = require('../models/trucks');
var moment = require('moment');
var async = require('async');
var multer = require('multer');


router.get('/first_screen', function(req, res, next) {

    var calculateFiles = function(data, truckNos) {
        return function (callback) {
            var expiredTotal = 0;
            var daysTotal = 0;
            var moreDaysTotal = 0;
            var todayDateRow = moment.utc(); 
            var todayDate = moment(todayDateRow, "YYYY-MM-DD").format("YYYY-MM-DD");
            // console.log("todayDate >>>>", todayDate);
            
            Reminders.find({truckno: { $in: truckNos }}).then(function (trucksResult) {
                var filesArray = [];
                trucksResult.forEach(t => {
                    var f = t.files;
                    f.forEach(a => {
                        if (a.documentname == data) {
                            var endDate = moment(a.enddate, "YYYY-MM-DD").format("YYYY-MM-DD");
                            var end20DateRow = moment(todayDateRow, "YYYY-MM-DD").add('days', 20);
                            var end20Date = moment(end20DateRow, "YYYY-MM-DD").format("YYYY-MM-DD");

                            if (todayDate < endDate && endDate < end20Date ) {
                                daysTotal = daysTotal + 1;

                                // console.log("------  IF  ----------");
                                // console.log("todayDate  >>>>", todayDate);
                                // console.log("endDate  >>>>", endDate);
                                // console.log("end20Date >>>>", end20Date);
                    

                            }  else if (todayDate > endDate) {
                                expiredTotal = expiredTotal  + 1;
                                // console.log("------  ELSE IF  ----------");
                                // console.log("todayDate  >>>>", todayDate);
                                // console.log("endDate  >>>>", endDate);
                                // console.log("end20Date >>>>", end20Date);

                            } else {
                                moreDaysTotal = moreDaysTotal  + 1;

                                // console.log("------  ELSE  ----------");
                                // console.log("todayDate  >>>>", todayDate);
                                // console.log("endDate  >>>>", endDate);
                                // console.log("end20Date >>>>", end20Date);
                            }
                            
                        } 
                    });
                });
                var obj = {
                    "Name": data,
                    "Expired": expiredTotal,
                    "20_Days": daysTotal,
                    "40_Days": moreDaysTotal,
                }
                callback(false, obj);
                
            }).catch(function(err) {
                callback(err, null);
            });
                 
        };
    };

    Trucks.find({ taname: req.query.traffic_agent }).then(function (trucksResult) {
        var truckNos = [];
        trucksResult.forEach(t => {
            truckNos.push(t.truckno);
        });

        DocumentMaster.find({}).then(function(result) {   
            var filesArray = [];
            result.forEach(t => {
                    filesArray.push(calculateFiles(t.name, truckNos));
            }); 
            async.parallel(filesArray, function(err, asyncResults) {
                
                res.send( asyncResults );  
            });
        }).catch(function(err) {
            res.send(err);
        });

    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/second_screen', function(req, res, next) {

    var calculateFiles = function(data, truckNos) {
        return function (callback) {
            var expiredTotal = 0;
            var daysTotal = 0;
            var moreDaysTotal = 0;
            var todayDateRow = moment.utc(); 
            var todayDate = moment(todayDateRow, "YYYY-MM-DD").format("YYYY-MM-DD");
            // console.log("todayDate >>>>", todayDate);
            
            Reminders.find({truckno: { $in: truckNos }}).then(function (trucksResult) {
                var mainArray = [];
                trucksResult.forEach(t => {
                    var f = t.files;
                    f.forEach(a => {
                        if (a.documentname == data) {
                            var endDate = moment(a.enddate, "YYYY-MM-DD").format("YYYY-MM-DD");
                            var end20DateRow = moment(todayDateRow, "YYYY-MM-DD").add('days', 20);
                            var end20Date = moment(end20DateRow, "YYYY-MM-DD").format("YYYY-MM-DD");

                            if (todayDate < endDate && endDate < end20Date ) {
                                var obj = {
                                    "_id": t._id,
                                    "document_id":a._id,
                                    "truck_no": t.truckno,
                                    "document_name": a.documentname,
                                    "startdate": a.startdate,
                                    "enddate": a.enddate,
                                    "status": a.status,
                                    "remarks": a.remarks,
                                }

                                mainArray.push(obj)
                                // console.log("------  IF  ----------");
                                // console.log("todayDate  >>>>", todayDate);
                                // console.log("endDate  >>>>", endDate);
                                // console.log("end20Date >>>>", end20Date);
                            }   
                        } 
                    });
                });
                
                if(mainArray == []) {
                    callback(false);
                    
                } else {
                    callback(false, mainArray);
                }

                
                
            }).catch(function(err) {
                callback(err, null);
            });
                 
        };
    };

    function onlyUnique(value, index, self) { 
        return self.indexOf(value) === index;
    }

    Trucks.find({ "taname": req.query.traffic_agent, "vtype" : "Company" }).then(function (trucksResult) {

        var truckNos = [];
        trucksResult.forEach(t => {
            truckNos.push(t.truckno);
        });

        DocumentMaster.find({}).then(function(result) {   
            var filesArray = [];
            result.forEach(t => {
                    filesArray.push(calculateFiles(t.name, truckNos));
            });


            async.parallel(filesArray, function(err, asyncResults) {
                var asyncResult =  asyncResults.filter(e => e.length);
                var asyncResultArray = [];
                var trucksArray = [];
                asyncResult.forEach( a =>{
                    a.forEach( i =>{
                        asyncResultArray.push(i);
                        trucksArray.push(i.truck_no);                        
                    });
                });
                
                res.send( asyncResultArray );  
            });
        }).catch(function(err) {
            res.send(err);
        });
    }).catch(function(err) {
        res.send(err);
    });

   

});

router.get('/second_screen_expired', function(req, res, next) {

    var calculateFiles = function(data, truckNos) {
        return function (callback) {
            var expiredTotal = 0;
            var daysTotal = 0;
            var moreDaysTotal = 0;
            var todayDateRow = moment.utc(); 
            var todayDate = moment(todayDateRow, "YYYY-MM-DD").format("YYYY-MM-DD");
            // console.log("todayDate >>>>", todayDate);
            
            Reminders.find({truckno: { $in: truckNos }}).then(function (trucksResult) {
                var mainArray = [];
                trucksResult.forEach(t => {
                    var f = t.files;
                    f.forEach(a => {
                        if (a.documentname == data) {
                            var endDate = moment(a.enddate, "YYYY-MM-DD").format("YYYY-MM-DD");
                            var end20DateRow = moment(todayDateRow, "YYYY-MM-DD").add('days', 20);
                            var end20Date = moment(end20DateRow, "YYYY-MM-DD").format("YYYY-MM-DD");

                            if (todayDate > endDate) {
                                var obj = {
                                    "_id": t._id,
                                    "document_id":a._id,
                                    "truck_no": t.truckno,
                                    "document_name": a.documentname,
                                    "startdate": a.startdate,
                                    "enddate": a.enddate,
                                    "status": a.status,
                                    "remarks": a.remarks,
                                }

                                mainArray.push(obj)
                                // console.log("------  IF  ----------");
                                // console.log("todayDate  >>>>", todayDate);
                                // console.log("endDate  >>>>", endDate);
                                // console.log("end20Date >>>>", end20Date);
                            }   
                        } 
                    });
                });
                
                if(mainArray == []) {
                    callback(false);
                    
                } else {
                    callback(false, mainArray);
                }

                
                
            }).catch(function(err) {
                callback(err, null);
            });
                 
        };
    };

    function onlyUnique(value, index, self) { 
        return self.indexOf(value) === index;
    }

    Trucks.find({ "taname": req.query.traffic_agent, "vtype" : "Company" }).then(function (trucksResult) {

        var truckNos = [];
        trucksResult.forEach(t => {
            truckNos.push(t.truckno);
        });

        DocumentMaster.find({}).then(function(result) {   
            var filesArray = [];
            result.forEach(t => {
                    filesArray.push(calculateFiles(t.name, truckNos));
            });


            async.parallel(filesArray, function(err, asyncResults) {
                var asyncResult =  asyncResults.filter(e => e.length);
                var asyncResultArray = [];
                var trucksArray = [];
                asyncResult.forEach( a =>{
                    a.forEach( i =>{
                        asyncResultArray.push(i);
                        trucksArray.push(i.truck_no);                        
                    });
                });
                
                res.send( asyncResultArray );  
            });
        }).catch(function(err) {
            res.send(err);
        });
    }).catch(function(err) {
        res.send(err);
    });

   

});

module.exports = router;