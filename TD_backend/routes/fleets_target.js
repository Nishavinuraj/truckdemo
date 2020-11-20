var express = require('express');
var router = express.Router();
var FT = require('../models/fleetstarget');
var Trucks = require('../models/trucks');
var async = require('async');



router.get('/fleets_targets_list', function(req, res, next) {
    var truckNoArray = [];
    var matchCondition = {};

    if(req.query.year) {
        matchCondition = { 'year': req.query.year }
    }


    Array.prototype.diff = function(a) {
        return this.filter(function(i) {return a.indexOf(i) < 0;});
    };
    if(req.query.tyre_no){
        console.log("IF  >>>>>>>>>>>");
        Trucks.find({ 'type': req.query.tyre_no }).select({ "truckno": 1, "_id": 0}).then(function(results) {
            results.forEach(r => {
                truckNoArray.push(r.truckno)
            });

            var inMatchCondition = {};

            if(req.query.year) {
                inMatchCondition.year = req.query.year;
            }

            if(req.query.tyre_no) {
                inMatchCondition.truckno = { $in:  truckNoArray };
            }

            FT.find(inMatchCondition).then(function(truckResult) {
            
                var gettruckNoArray = [];
                var mainArray = [];
                truckResult.forEach(i => {
                    gettruckNoArray.push(i.truckno);
                    mainArray.push(i);
                });

                //  For Find diff from array ------------
                var Diff = [];
                Diff = truckNoArray.filter(function(obj) { return gettruckNoArray.indexOf(obj) == -1; });
                //  -----------

                Diff.forEach(add => {
                    newADD = { 
                        "truckno" : add, 
                        "months" : [
                            {
                                "name" : "January", 
                                "target" : "0"
                            }, 
                            {
                                "name" : "February", 
                                "target" : "0"
                            }, 
                            {
                                "name" : "March", 
                                "target" : "0"
                            }, 
                            {
                                "name" : "April", 
                                "target" : "0"
                            }, 
                            {
                                "name" : "May", 
                                "target" : "0"
                            }, 
                            {
                                "name" : "June", 
                                "target" : "0"
                            }, 
                            {
                                "name" : "July", 
                                "target" : "0"
                            }, 
                            {
                                "name" : "August", 
                                "target" : "0"
                            }, 
                            {
                                "name" : "September", 
                                "target" : "0"
                            }, 
                            {
                                "name" : "October", 
                                "target" : "0"
                            }, 
                            {
                                "name" : "November", 
                                "target" : "0"
                            }, 
                            {
                                "name" : "December", 
                                "target" : "0"
                            }
                        ],
                    };
                    mainArray.push(newADD);
                });
                res.send(mainArray);
            }).catch(function(err) {
                // cb(err);
                console.log(err);
            });

            
        }).catch(function(err) {
            res.send(err);
        });
    } else{
        console.log("ELSE  >>>>>>>>>>>");
        FT.find(matchCondition).then(function(result) {
            var fleets_target_data = [];
            result.forEach(a => {
                fleets_target_data.push(a);
            });
            
            res.send(fleets_target_data);
        }).catch(function(err) {
            res.send(err);
        });
    }
	
});

router.put('/fleets_targets_update', function(req, res, next) {
    
    if ( req.body.months && req.body.months.length == 12 ) {
        FT.find({"truckno": req.body.truckno }).then(function(result) {
            if(result[0]) {
                console.log("If >>>>>");
                FT.updateMany({"truckno": req.body.truckno}, { $set : {'year': req.body.year , 'months': [] }} , {multi:true} ).then(function(updateResult) {   
                    
                    FT.update({ 
                        "truckno": req.body.truckno
                        },{ 
                        "$push": 
                            { 
                                // "year": req.body.year,
                                "months": req.body.months
                            }
                        }).then(function(result) {
                            res.send({"message": "updated..!"});
                        }).catch(function(err) {
                            res.send(err);
                    });
                }).catch(function(err) {
                    res.send(err);
                });



            } else {
                console.log("Else >>>>>>");
                var d = new FT(req.body);
                d.save(function () {
                    res.send({"message": "New Added..!"}); 
                });
            }
        }).catch(function(err) {
            console.log(err);
            res.send(err);
        });
    } else {
        res.send({"Error": "Please add months. Months can not blank and must 12 months..!"});
    }
});

module.exports = router;