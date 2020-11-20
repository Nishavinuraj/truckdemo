var express = require('express');
var router = express.Router();
var TruckMaintenance = require('../models/truck_maintenance');
var TyreMaintenance = require('../models/tyre_maintenance');
var JobCard = require('../models/job_card');

var momentTZ = require('moment-timezone');

router.get('/list_trucks', function(req, res, next) {

    TruckMaintenance.find({"accept": "No"}).sort({ "srno": 1}).then( function(result) {
        
        var resultArray = [];
        result.forEach( r => {
            // var  taTime = moment(r.time).format('HH:mm:ss');
            var obj = {
                "id": r._id,
                "srno": r.srno,
                "taname": r.taname,
                "truckno": r.truckno,
                "particulars": r.particulars ? r.particulars : "",
                "ta_time": r.time,
                "assign_to": r.assign,
                "km_reading": r.km_reading ? r.km_reading : "",
                "remarks": r.remarks
            }
            resultArray.push(obj);
        });
        res.send({"result": resultArray});
    }).catch (function(err) {
        console.log("err   >>>>",err);
        res.send(err);
    });

});

router.put('/accept_truck_maintenance', function(req, res, next) {
    req.body.job_time= momentTZ().tz('Asia/Calcutta').format();
    req.body.accept = "Yes";

    try {
        TruckMaintenance.updateOne({ "_id": req.query.id }, {$set: req.body}).then(function (result) {
            res.send({"message": "Updated...!"});
        }).catch(function(err) {
            console.log("err >>>>>", err);
            res.send(err);
        });
    } catch (e) {
    console.log("err >>>>>", e);
    }
});

router.get('/accepted_trucks', function(req, res, next){

    TruckMaintenance.find({"accept": "Yes", "status": { $ne: "Completed" }}).sort({"srno": 1}).then( function(result) {
        
        var resultArray = [];
        result.forEach( r => {
            var obj = {
                "id": r._id,
                "srno": r.srno,
                "taname": r.taname,
                "truckno": r.truckno,
                "particulars": r.particulars ? r.particulars : "",
                "ta_time": r.time,
                "job_time": r.job_time,
                "hrs": "",
                "status": r.status,
                "remarks": r.remarks
            }
            resultArray.push(obj);
        });
        res.send({"result": resultArray});
    }).catch( function(err) {
        res.send(err);
    });
});

router.put('/update_accepted_truck', function(req, res, next) {

    try {
        TruckMaintenance.updateOne({ "_id": req.body.id }, {$set: {"status": req.body.status, "remarks": req.body.remarks}}).then(function (result) {
            res.send({"message": "Updated...!"});
        }).catch(function(err) {
            console.log("err >>>>>", err);
            res.send(err);
        });
    } catch (e) {
    console.log("err >>>>>", e);
    }
});

router.post('/add_job_card', function(req, res, next) {


    var d = new JobCard(req.body);
    d.save(function (err, save) {
        console.log("err  >>>",err);
        console.log("save  >>>",save);
        res.send({"message": "Added..!"}); 
    });  
    // JobCard.find({"truckno": req.body.truckno, "srno": req.body.srno }).then(function(result) {
    //     if(result[0]) {
    //         // console.log("If >>>>>", result[0]);

    //         JobCard.update({ 
    //             "truckno": req.body.truckno,
    //             "srno": req.body.srno
    //             }, { 
    //             "$push": 
    //                 { 
    //                     "job_details": req.body.job_details
    //                 }
    //             }).then(function(result) {
    //                 res.send({"message": "Added..!"}); 
    //         }).catch(function(err) {
    //             res.send(err);
    //         });

    //     } else {
    //         console.log("Else >>>>>");

    //         // Save New ...
    //         var d = new JobCard(req.body);
    //         d.save(function (err, save) {
    //             console.log("err  >>>",err);
    //             console.log("save  >>>",save);
    //             res.send({"message": "Added..!"}); 
    //         });            
    //     }
    // }).catch(function(err) {
    //     console.log(err);
    //     res.send(err);
    // });
});

router.get('/list_job_card_details', function(req, res, next) {

    TruckMaintenance.find({"srno": req.query.srno, "truckno": req.query.truckno}).then( function(result) {
        
        var obj;

        if(result[0]) {
            obj = {
                "id": result[0]._id,
                "srno": result[0].srno,
                "truckno": result[0].truckno,
                "km_reading": result[0].km_reading ? result[0].km_reading: "",
                "remarks": result[0].remarks ? result[0].remarks: ""
            }
        } else {
            obj = {
                "id": "",
                "srno": req.query.srno,
                "truckno": req.query.truckno,
                "km_reading": "",
                "remarks": ""
            }
        }
        res.send({ "result": obj });
    }).catch(function(err) {
        res.send(err);
    });
});

module.exports = router;