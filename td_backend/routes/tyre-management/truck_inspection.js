var express = require('express');
var router = express.Router();
var moment = require('moment');
var async = require('async');
var momentTZ = require('moment-timezone');
var TruckInspection = require('../../models/tyre-management/truck-inspection');
var TruckTyreMaster = require('../../models/tyre-management/tyre-master');
var Trucktyrepositionmaster =require('../../models/tyre-management/trucktyrepositionmaster')
var Trucks = require('../../models/trucks');
var jwt = require('jsonwebtoken');
var checkLogin = require('../middlewares/checkLogin');

router.get('/', function (req, res, next) {
    let limit = req.query.limit ? req.query.limit : 5
    let offset = req.query.offset ? req.query.offset : 0
    let searchText = req.query.searchText;
    if (searchText !== undefined) {
        var regex = new RegExp(searchText, 'i');
        TruckInspection.find({ 'truck_no': { $regex: regex }}).count(function (e, count) {  
            TruckInspection.find({ 'truck_no': { $regex: regex }}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
                });
        });
    }
    else {
        TruckInspection.count(function (e, count) {  
            TruckInspection.find().sort({idate:-1}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
            });
        });   
    }      
     
});

// router.get('/',checkLogin(),function (req, res, next) {
//     let limit = req.query.limit ? req.query.limit : 5
//     let offset = req.query.offset ? req.query.offset : 0
//     let searchText = req.query.searchText;
//     if (searchText !== undefined) {
//         var regex = new RegExp(searchText, 'i');
//         let sitematchCondition = {}
//         if (req.user.role == 'ADMIN') {
//             sitematchCondition = {'site': { $regex: regex }};
//             console.log("ADMIN  >>>>>>>", sitematchCondition) ;
//             Accdataentry.find({'$or': [sitematchCondition, { 'draccount_name': { $regex: regex }}, { 'craccount_name': { $regex: regex }}, { 'user': { $regex: regex }}]}).count(function (e, count) {  
//                 Accdataentry.find({'$or': [sitematchCondition, { 'draccount_name': { $regex: regex }}, { 'craccount_name': { $regex: regex }}, { 'user': { $regex: regex }}]}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
//                 res.send({ records: result, totalRecords: count });   
//                 });
//             });

//         } else {
//             sitematchCondition = { site: req.user.site };
//             console.log("ADMIN  >>>>>>>", sitematchCondition) ;
//             Accdataentry.find({
//                 $and:[
//                      {$or:[ 
//                         { 'draccount_name': { $regex: regex }}, 
//                         { 'craccount_name': { $regex: regex }}, 
//                         { 'user': { $regex: regex }}
//                     ]},
//                     sitematchCondition
//                  ]}).count(function (e, count) {
//                     Accdataentry.find({
//                         $and:[
//                              {$or:[
//                                 { 'draccount_name': { $regex: regex }}, 
//                                 { 'craccount_name': { $regex: regex }}, 
//                                 { 'user': { $regex: regex }}
//                              ]},
//                              sitematchCondition
//                         ]}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
//                             res.send({ records: result, totalRecords: count })              
//                  });
//                 });
//         }

//     }
//     else {
//         let matchCondition = {};
//         if (req.user.role == 'ADMIN') {
//             console.log("ADMIN  >>>>>>>");
//             matchCondition = { };
//         } else {
//             matchCondition = { site: req.user.site };
//         }

//         Accdataentry.count(function (e, count) {  
//             Accdataentry.find(matchCondition).sort({ ade_date: -1, ade_number: -1 }).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
//                res.send({ records: result, totalRecords: count });   
//             });
//         });   
//     }      
     
// });

router.get('/list_tyre', function(req, res, next) {
    var calculateOther = function(data) {
        var matchCond = {};
        if(req.query.truck_no){
            matchCond['vehicle_no'] = req.query.truck_no;
        }
    
        if(data.positionname){
            matchCond['tyreposition'] = data.positionname;
        }
        console.log('matchCond 1>>> ', matchCond);
        return function (callback) {
            console.log('matchCond 2>>> ', matchCond);
            // console.log('Data >>> ', data);
            // vehicle_no": req.query.truck_no, "tyreposition": data.tp
            TruckTyreMaster.find(matchCond).then((fromResults) => {
                // console.log(" Tyre Master data  >>>>", fromResults);
                var nsd = 0 ;
                var tyre_no = '';
                var fdate = '';
                var fitment_km = 0;
                fromResults.forEach( r => {
                    fdate = moment(r.date_of_fitment).format('YYYY-MM-DD');
                    nsd = r.nsd;
                    tyre_no = r.tyre_no;
                    fitment_km = r.fitment_km;

                });
                data.date_of_fitment = fdate;
                data.nsd = nsd;
                data.tyre_no = tyre_no;
                data.fitment_km = fitment_km;

                callback(false, data);
                }).catch(err => {
                console.log(err.stack);
                callback(err, null);
            });
        };
    };

    Trucks.findOne({"truckno": req.query.truck_no}).then(function(result) {
        var po = Number(result.type);
        // console.log('po no >>> ', po);
        Trucktyrepositionmaster.findOne({tyre: po}).then(function(result) {
            var mainArray = [];
            result.multidest.forEach(r => {
                var obj = {
                    "pno": parseInt(r.posno),
                    "positionname": r.postyre,
                };
                mainArray.push(calculateOther(obj));
           });
            
            async.parallel(mainArray, function(err, asyncResult) {
                console.log('result >>> ', asyncResult);
                res.send({ "results": asyncResult });  
            });
    
        }).catch(function(err) {
            res.send(err);
        });
    }).catch(function(err) {
        res.send(err);
    });
})



//Tyre number list
router.get('/tyre_no', function(req, res, next) {
    TruckTyreMaster.find({}).then(function(result) {

        let tyres = []; 

        result.forEach(r => {
            var fdata = moment(r.date).format('YYYY-MM-DD');
            r.date = fdata;

            let obj = {
                'date': r.date,
                'tyre_no': r.tyre_no
            }

            tyres.push(obj);
            
        });
        
        res.send({"results": tyres});
    }).catch(function(err) {
        res.send(err);
    });
});

//Inspection list
router.get('/list', function(req, res, next) {
    matchConditions = {};

    if(req.query.date){
        matchConditions['inspections.date'] = req.query.date;
    }

    if(req.query.truck_no){
        matchConditions['truck_no'] = req.query.truck_no;
    }

    if(req.query.km){
        matchConditions['inspections.km'] = req.query.km;
    }

    TruckInspection.findOne(matchConditions).then(function(result) {    
        res.send({"results": result});
    }).catch(function(err) {
        res.send(err);
    });
});

//Create inspection
router.post('/create', function(req, res, next) {
/*     console.log(req.body)
 */
    var d = new TruckInspection(req.body);
    d.save(function (err, save) {
       console.log("save  >>>",save);
       res.send({"message": "Added..!"});
    });
    
});

//Delete inspection
router.put ('/delete', function(req, res, next) {
    TruckInspection.update( {"_id": req.query.id}, { $pull: {"inspections": {"_id": req.body.insp_id} } }).then(function(deleteResult) {   
        res.send({"message": "deleted..!"});
    }).catch(function(err) {
        res.send(err);
    });
});

router.put('/update_inspection', function(req, res, next) {
    TruckInspection.find({"truck_no": req.body.truck_no }).then(function(result) {
        if(result[0]) {
            console.log("If >>>>>", result[0]);
            TruckInspection.updateMany({"truck_no": req.body.truck_no}, { $set : {'remarks': req.body.remarks , 'inspections': [] }} , {multi:true} ).then(function(updateResult) {   
                
                TruckInspection.update({ 
                    "truck_no": req.body.truck_no
                    },{ 
                    "$push": 
                        { 
                            "inspections": req.body.inspections
                        }
                    }).then(function(result) {

                        // console.log(">>>>>>>", result);

                        res.send({"message": "updated..!"});
                    }).catch(function(err) {
                        res.send(err);
                });
            }).catch(function(err) {
                res.send(err);
            });



        } else {
            console.log("Else >>>>>>");
            var d = new TruckInspection(req.body);
            d.save(function () {
                res.send({"message": "New Added..!"}); 
            });
        }
    }).catch(function(err) {
        console.log(err);
        res.send(err);
    });
});

router.get('/get_tyre', function(req, res, next) {
    TruckTyreMaster.findOne({"tyre_no": req.query.tyre_no}).then(function(result) {
        var obj = {};
        if (result){
            obj = {
                "date_of_fitment": result.date_of_fitment ? result.date_of_fitment : "",
                "nsd": result.nsd,
            }
            // mainArray.push(obj);
        }
            
        res.send({"result": obj});
    }).catch(function(err) {
        res.send(err);
    });
});


router.delete ('/:id', function(req, res, next) {
    TruckInspection.deleteOne({"_id": req.params.id}).then(function(deleteResult) {   
        res.send(deleteResult);
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/:id', function(req, res) {
    TruckInspection.findOne({ _id: req.params.id }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});

module.exports = router;
