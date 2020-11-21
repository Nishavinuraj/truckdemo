var express = require('express');
var router = express.Router();
var Jwreminders = require('../../models/maintenance/job-workreminders');
var async = require('async');

router.get('/first_screen', function(req, res, next) {

    var calculateFiles = function(data) {
        return function (callback) {
            var expiredTotal = 0;
            var redTotal = 0;
            var orangeTotal = 0;
            Jwreminders.find({isDone:false}).then(function (trucksResult) {
                var filesArray = [];
                trucksResult.forEach(t => {
                    if (t.worktobedone == data) {

                        const duekm = t.nextduekm;
                        const currkm = t.ckm_reading;
                        const less500km = t.nextduekm - 500;
                        const less1000km = t.nextduekm - 1000;


                        if (currkm > duekm && t.isDone != "True") {
                            expiredTotal = expiredTotal  + 1;
                        }  else if (duekm > currkm && less500km < currkm && t.isDone != "True") { 

                            // console.log("------  IF  ----------");
                            // console.log("currkm  >>>>", currkm);
                            // console.log("duekm  >>>>", duekm);
                            // console.log("less500km >>>>", less500km);

                            redTotal = redTotal + 1;
                        } else if (duekm > currkm && less1000km < currkm && t.isDone != "True") { 
                            orangeTotal = orangeTotal  + 1;

                        }
                        
                    } 
                });
                var obj = {
                    "Name": data,
                    "Expired": expiredTotal,
                    "500_kms": redTotal,
                    "1000_kms": orangeTotal
                }
                callback(false, obj);
                
            }).catch(function(err) {
                callback(err, null);
            });
                 
        };
    };

    
    Jwreminders.find({isDone:false}).distinct("worktobedone").then(function(result) {   
        
       
        var filesArray = [];
        result.forEach(t => {
                filesArray.push(calculateFiles(t));
        });

        async.parallel(filesArray, function(err, asyncResults) {
            
            res.send( asyncResults );  
        });
    }).catch(function(err) {
        res.send(err);
    });
  

});

router.get('/second_screen', function(req, res, next) {

    var calculateFiles = function(data) {
        return function (callback) {
            Jwreminders.find({isDone:false}).then(function (trucksResult) {
                var mainArray = [];
                trucksResult.forEach(t => {
                    if (t.worktobedone == data) {

                        const duekm = t.nextduekm;
                        const currkm = t.ckm_reading;
                        const less500km = t.nextduekm - 500;
                        const less1000km = t.nextduekm - 1000;
                        const kmleft = t.nextduekm - t.ckm_reading;

                        if (duekm > currkm && less1000km < currkm && t.isDone != "True") { 
                            var vremarks = "";
                            if (t.remarks == "false") {
                                vremarks =  "--"
                            } else {
                                vremarks = t.remarks
                            }

                            var obj = {
                                "_id": t._id,
                                "document_id":t._id,
                                "truck_no": t.truck_no,
                                "worktobedone": t.worktobedone,
                                "duekm": t.nextduekm,
                                "currkm": t.ckm_reading,
                                "kmleft": kmleft,
                                "status": t.status,
                                "remarks": vremarks
                            }
                            mainArray.push(obj)
                            console.log('obj List >>>>', obj);
                        }   
                        } 
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

    // var getCompanyTrucks = function(data) {
    //     return function (callback) {

    //         console.log("data   >>>>", data);
    //         // Trucks.find({}).then(function (trucksResult) {

                
    //         //     if(mainArray == []) {
    //         //         callback(false);
                    
    //         //     } else {
    //         //         callback(false, mainArray);
    //         //     }

    //             callback(false, data);
                
    //         // }).catch(function(err) {
    //         //     callback(err, null);
    //         // });
    //     };
    // };

    Jwreminders.find({ isDone:false}).distinct("truck_no").then(function (CompanyTruckResult) {
        companyTruckList = [];
        CompanyTruckResult.forEach(ct => {
            companyTruckList.push(ct);
        });

        Jwreminders.find({isDone:false}).distinct("worktobedone").then(function(result) {    
            var filesArray = [];
            result.forEach(t => {
                filesArray.push(calculateFiles(t));
            });

            async.parallel(filesArray, function(err, asyncResults) {
                var asyncResult =  asyncResults.filter(e => e.length);
                var asyncResultArray = [];
                asyncResult.forEach( a =>{
                    a.forEach( i =>{
                        asyncResultArray.push(i);
                    });
                });

                asyncResultArray.sort(function(a, b){
                    return a.currkm < b.duekm ? -1 :  a.duekm > b.currkm ? 1 : 0;
                });

                // companyTruckList
                // asyncResultArray
                var companyTrucksResultArray = [];
                asyncResultArray.forEach(aa => {
                    companyTruckList.forEach(bb => {
                        if(aa.truck_no == bb){
                            companyTrucksResultArray.push(aa);
                        }
                    });
                });
                res.send( companyTrucksResultArray );  
            });
        }).catch(function(err) {
            res.send(err);
        });
    }).catch(function(err) {
        res.send(err);
    });

   

});

router.get('/second_screen_expired', function(req, res, next) {

    var calculateFiles = function(data) {
        return function (callback) {
            Jwreminders.find({isDone:false}).then(function (trucksResult) {
                var mainArray = [];
                trucksResult.forEach(t => {
                    if (t.worktobedone == data) {

                        const duekm = t.nextduekm;
                        const currkm = t.ckm_reading;
                        const excesskm = t.ckm_reading - t.nextduekm;

                        if (currkm > duekm && t.isDone != "True") { 
                            var vremarks = "";
                            if (t.remarks == "false") {
                                vremarks =  "--"
                            } else {
                                vremarks = t.remarks
                            }
    
                            var obj = {
                                "_id": t._id,
                                "document_id":t._id,
                                "truck_no": t.truck_no,
                                "worktobedone": t.worktobedone,
                                "duekm": t.nextduekm,
                                "currkm": t.ckm_reading,
                                "excesskm": excesskm,
                                "status": t.status,
                                "remarks": vremarks
                            }
                            mainArray.push(obj)
                            console.log('obj List >>>>', obj);
                        }   
                        } 
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

    Jwreminders.find({isDone:false}).distinct("truck_no").then(function (CompanyTruckResult) {
        companyTruckList = [];
        CompanyTruckResult.forEach(ct => {
            companyTruckList.push(ct);
        });
        Jwreminders.find({isDone:false}).distinct("worktobedone").then(function(result) {    
            var filesArray = [];
            result.forEach(t => {
                    filesArray.push(calculateFiles(t));
            });


            async.parallel(filesArray, function(err, asyncResults) {
                var asyncResult =  asyncResults.filter(e => e.length);
                var asyncResultArray = [];
                asyncResult.forEach( a =>{
                    a.forEach( i =>{
                        asyncResultArray.push(i);
                    });
                });

                asyncResultArray.sort(function(a, b){
                    return a.currkm < b.duekm ? -1 :  a.duekm > b.currkm ? 1 : 0;
                });
                // res.send( asyncResultArray );  
                var companyTrucksResultArray = [];
                asyncResultArray.forEach(aa => {
                    companyTruckList.forEach(bb => {
                        if(aa.truck_no == bb){
                            companyTrucksResultArray.push(aa);
                        }
                    });
                });
                res.send( companyTrucksResultArray ); 
            });
        }).catch(function(err) {
            res.send(err);
        });
    }).catch(function(err) {
        res.send(err);
    });
   

});

router.put('/update', function (req, res, next) {
    let litem_id = req.body.id;
    let visDone = ''
    if (req.body.status == "Done") {
        visDone  = "true"
    } else {
        visDone = "false"
    }
    console.log('Visdone >>>', visDone);

    Jwreminders.update({_id:litem_id},{$set:{    
        status: req.body.status,
        remarks: req.body.remarks,
        isDone: visDone
    }})
    .then(function(result) {
        
    res.send(result);
    }).catch(function(err) {
        console.log('error', err)
        res.send(err);
    });
});


// router.put('/update', function(req, res, next) {

//     Jwreminders.findOneAndUpdate(
//         { "_id": "req.body.id" },
//         { "$set": { "status" : req.body.status, "remarks": req.body.remarks} }).then(function(result) {
//         res.send({"message": "Updated..!"});
//     }).catch (function(err) {
//         res.send(err);
//     });
// });

module.exports = router;