var express = require('express');
var router = express.Router();
var Brand = require('../../models/brand');
var CompanyName = require('../../models/companyname');
var TyreName = require('../../models/tires');
var TruckTyreMaster = require('../../models/tyre-management/tyre-master');
var moment = require('moment');
var jwt = require('jsonwebtoken');
var async = require('async');
var jwt = require('jsonwebtoken');
var checkLogin = require('../middlewares/checkLogin');

router.get('/:id', function(req, res) {
    TruckTyreMaster.findOne({ _id: req.params.id }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});

router.get('/', function (req, res, next) {
    let limit = req.query.limit ? req.query.limit : 5
    let offset = req.query.offset ? req.query.offset : 0
    let searchText = req.query.searchText;
    if (searchText !== undefined) {
        var regex = new RegExp(searchText, 'i');
        TruckTyreMaster.find({'$or': [{ 'tyre_no': { $regex: regex }}, { 'purchase_type': { $regex: regex }}, { 'tyreposition': { $regex: regex }}, { 'tyre_size': { $regex: regex }}, { 'vehicle_no': { $regex: regex }}]}).count(function (e, count) {  
            TruckTyreMaster.find({'$or': [{ 'tyre_no': { $regex: regex }}, { 'purchase_type': { $regex: regex }}, { 'tyreposition': { $regex: regex }}, { 'tyre_size': { $regex: regex }}, { 'vehicle_no': { $regex: regex }}]}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
                });
        });
    }
    else {
        TruckTyreMaster.count(function (e, count) {  
            TruckTyreMaster.find().sort({bill_date:-1}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
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
//             TruckTyreMaster.find({'$or': [sitematchCondition, { 'tyre_no': { $regex: regex }}, { 'purchase_type': { $regex: regex }},{ 'tyreposition': { $regex: regex }}, { 'tyresize': { $regex: regex }}, { 'vehicle_no': { $regex: regex }},  { 'user': { $regex: regex }}]}).count(function (e, count) {  
//                 TruckTyreMaster.find({'$or': [sitematchCondition, { 'tyre_no': { $regex: regex }}, { 'purchase_type': { $regex: regex }}, { 'tyreposition': { $regex: regex }}, { 'tyresize': { $regex: regex }},  { 'vehicle_no': { $regex: regex }}, { 'user': { $regex: regex }}]}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
//                 res.send({ records: result, totalRecords: count });   
//                 });
//             });

//         } else {
//             sitematchCondition = { site: req.user.site };
//             console.log("ADMIN  >>>>>>>", sitematchCondition) ;
//             TruckTyreMaster.find({
//                 $and:[
//                      {$or:[ 
//                         { 'tyre_no': { $regex: regex }}, 
//                         { 'purchase_type': { $regex: regex }}, 
//                         { 'tyreposition': { $regex: regex }}, 
//                         { 'tyresize': { $regex: regex }}, 
//                         { 'vehicle_no': { $regex: regex }}, 
//                         { 'user': { $regex: regex }}
//                     ]},
//                     sitematchCondition
//                  ]}).count(function (e, count) {
//                     TruckTyreMaster.find({
//                         $and:[
//                              {$or:[
//                                 { 'tyre_no': { $regex: regex }}, 
//                                 { 'purchase_type': { $regex: regex }}, 
//                                 { 'tyreposition': { $regex: regex }}, 
//                                 { 'tyresize': { $regex: regex }}, 
//                                 { 'vehicle_no': { $regex: regex }}, 
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

//         TruckTyreMaster.count(function (e, count) {  
//             TruckTyreMaster.find(matchCondition).sort({ bill_date: -1 }).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
//                res.send({ records: result, totalRecords: count });   
//             });
//         });   
//     }      
     
// });


router.get('/list_brand', function(req, res, next) {

    var regex = req.query.q;
    Brand.find({"name": new RegExp('^' + regex, 'i')})
        .collation({ locale: "en" })
        .sort({name: 'asc'})
        .limit(50)
        .then((fromResults) => {
            res.send(fromResults);
        }).catch(err => {
            console.log(err);
            res.status(500).send({error: JSON.stringify(err)});
        });
});

router.get('/list_company', function(req, res, next) {

    var regex = req.query.q;
    CompanyName.find({"name": new RegExp('^' + regex, 'i')})
        .collation({ locale: "en" })
        .sort({name: 'asc'})
        .limit(50)
        .then((fromResults) => {
            res.send(fromResults);
        }).catch(err => {
            console.log(err);
            res.status(500).send({error: JSON.stringify(err)});
        });
});

router.get('/list_tyres', function(req, res, next) {

    var regex = req.query.q;
    TyreName.find({"name": new RegExp('^' + regex, 'i')})
        .collation({ locale: "en" })
        .sort({name: 'asc'})
        .limit(50)
        .then((fromResults) => {
            res.send(fromResults);
        }).catch(err => {
            console.log(err);
            res.status(500).send({error: JSON.stringify(err)});
        });
});

router.post('/', function (req, res, next) {
    var im = new TruckTyreMaster({
        tyre_no: req.body.tyre_no,
        purchase_type: req.body.purchase_type,
        bill_no: req.body.bill_no,
        bill_date: req.body.bill_date,
        dealer_name: req.body.dealer_name,
        price: req.body.price,
        company_name:req.body.company_name,
        brand:req.body.brand,
        tyre_type: req.body.tyre_type,
        nsd:req.body.nsd,
        rtd: req.body.rtd,
        date_of_fitment: req.body.date_of_fitment,
        fitment_km: req.body.fitment_km,
        tyre_size: req.body.tyre_size,
        vehicle_no: req.body.vehicle_no,
        tyrestatus: req.body.tyrestatus,
        tyreposition: req.body.tyreposition,
        rs_date: req.body.rs_date,
        removekm: req.body.removekm
    });
    im.save(function (err, result) {
        res.send(result);
    });
});

router.delete ('/:id', function(req, res, next) {
    TruckTyreMaster.deleteOne({"_id": req.params.id}).then(function(deleteResult) {   
        res.send(deleteResult);
    }).catch(function(err) {
        res.send(err);
    });
});


router.put('/', function (req, res, next) {
    let item_id = req.query.id
    TruckTyreMaster.update({_id:item_id},{$set:{    
        tyre_no: req.body.tyre_no,
        purchase_type: req.body.purchase_type,
        bill_no: req.body.bill_no,
        bill_date: req.body.bill_date,
        dealer_name: req.body.dealer_name,
        price: req.body.price,
        company_name:req.body.company_name,
        brand:req.body.brand,
        tyre_type: req.body.tyre_type,
        nsd:req.body.nsd,
        rtd: req.body.rtd,
        date_of_fitment: req.body.date_of_fitment,
        fitment_km: req.body.fitment_km,
        tyre_size: req.body.tyre_size,
        vehicle_no: req.body.vehicle_no,
        tyrestatus: req.body.tyrestatus,
        tyreposition: req.body.tyreposition,
        rs_date: req.body.rs_date,
        removekm: req.body.removekm
    }})
    .then(function(result) {
        console.log('item_id',item_id)
        res.send(result);
    }).catch(function(err) {
        console.log('error', err)
        res.send(err);
    });
});

router.get('/search', function(req, res, next) {

    var regex = req.query.tyre_no;
    TruckTyreMaster.find({"tyre_no": new RegExp('^' + regex, 'i')})
        .collation({ locale: "en" })
        .sort({tyre_no: 'asc'})
        .limit(50)
        .then((fromResults) => {
            res.send(fromResults);
        }).catch(err => {
            console.log(err);
            res.status(500).send({error: JSON.stringify(err)});
        });
});

module.exports = router;