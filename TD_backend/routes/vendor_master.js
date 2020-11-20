var express = require('express');
var router = express.Router();
var VendorMaster = require('../models/vendor_master');

router.post('/add', function(req, res, next) {

    var d = new VendorMaster(req.body);
    d.save(function (err, save) {
        // console.log("err  >>>",err);
        // console.log("save  >>>",save);
        res.send({"message": "Added..!"}); 
    });
});

router.put('/', function(req, res, next) {

    VendorMaster.update({"_id": req.body._id}, { $set : {
        name: req.body.name,
        address: req.body.address,
        condition: req.body.condition,
        contact_person: req.body.contact_person,
        gst_no: req.body.gst_no,
        location: req.body.location,
        mobile_no: req.body.mobile_no,
        email: req.body.email,
        statename:req.body.statename,
        rating: req.body.rating,
        remarks: req.body.remarks,
        specialized_in: req.body.specialized_in,
        vendor_type: req.body.vendor_type
    }}).then(function(result) {
        res.send({ "message": "Updated...!"});
    }).catch(function(err) {
        res.send(err);
    });

});


router.get('/list', function(req, res, next) {

    VendorMaster.find().sort({name:1}).then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});

router.get('/all_vendors', function (req, res, next) { 
    VendorMaster.find({}).sort({name:1}).then(function (result) {
                    res.send({ records: result, totalRecords: result.length });
                }).catch(function (err) {
                    res.send(err);
                });      
});

router.get('/locations', function(req, res, next) {

    VendorMaster.find({location: new RegExp('^' + req.query.q, 'i')}).distinct('location').then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});

router.get('/vendor_type', function(req, res, next) {

    VendorMaster.find({vendor_type: new RegExp('^' + req.query.q, 'i')}).distinct('vendor_type').then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});

router.get('/vendorname', function(req, res, next) {

    VendorMaster.find({name: new RegExp('^' + req.query.q, 'i')}).distinct('name').then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});

router.get('/specialized_in', function(req, res, next) {

    VendorMaster.find({specialized_in: new RegExp('^' + req.query.q, 'i')}).distinct('specialized_in').then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        ////console.log("err   >>>>",err);
        res.send(err);
    });
});

router.delete('/:id', function(req, res, next) {
    VendorMaster.deleteOne({ _id: req.params.id}).then(function(deleteResult) {   
        res.send({"message": "delete..!"});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/search_vendor_name', (req, res) => {
    var regex = req.query.q;
    VendorMaster.find({"name": new RegExp('' + regex, 'i')}).select('name')
        .collation({ locale: "en" })
        .sort({name: 1})
        .limit(50)
        .then((fromResults) => {
            res.send(fromResults);
        }).catch(err => {
            console.log(err);
            res.status(500).send({error: JSON.stringify(err)});
    });
});

module.exports = router;