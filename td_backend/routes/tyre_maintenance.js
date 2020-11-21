var express = require('express');
var router = express.Router();
var TyreMaintenance = require('../models/tyre_maintenance');
var TruckMaintenance = require('../models/truck_maintenance');
var momentTZ = require('moment-timezone');

router.get('/list_tyres', function(req, res, next) {

    TyreMaintenance.find({"accept": "No"}).sort({ "srno": 1}).then( function(result) {
        
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

router.put('/accept_tyre_maintenance', function(req, res, next) {
    req.body.job_time= momentTZ().tz('Asia/Calcutta').format();
    req.body.accept = "Yes";

    try {
        TyreMaintenance.updateOne({ "_id": req.query.id }, {$set: req.body}).then(function (result) {
            res.send({"message": "Updated...!"});
        }).catch(function(err) {
            console.log("err >>>>>", err);
            res.send(err);
        });
    } catch (e) {
    console.log("err >>>>>", e);
    }
});

router.get('/accepted_tyres', function(req, res, next){

    TyreMaintenance.find({"accept": "Yes", "status": { $ne: "Completed" }}).sort({"srno": 1}).then( function(result) {
        
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

router.put('/update_accepted_tyre', function(req, res, next) {

    try {
        TyreMaintenance.updateOne({ "_id": req.body.id }, {$set: {"status": req.body.status, "remarks": req.body.remarks}}).then(function (result) {
            res.send({"message": "Updated...!"});
        }).catch(function(err) {
            console.log("err >>>>>", err);
            res.send(err);
        });
    } catch (e) {
    console.log("err >>>>>", e);
    }
});

module.exports = router;