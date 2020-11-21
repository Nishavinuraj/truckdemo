var express = require('express');
var router = express.Router();
var async = require('async');
var Trucks = require('../../models/trucks');

router.get('/', function (req, res, next) {
    let limit = req.query.limit ? req.query.limit : 5
    let offset = req.query.offset ? req.query.offset : 0
    let searchText = req.query.searchText;
    if (searchText !== undefined) {
        var regex = new RegExp(searchText, 'i');
        Trucks.find({'$or': [{ 'truckno': { $regex: regex }}, { 'ownername': { $regex: regex }}]}).count(function (e, count) {  
            Trucks.find({'$or': [{ 'truckno': { $regex: regex }}, { 'ownername': { $regex: regex }}]}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
                });
        });
    }
    else {
        Trucks.count(function (e, count) {  
            Trucks.find().sort({truckno:1}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
            });
        });   
    }      
     
});

router.get('/:id', function(req, res) {
    Trucks.findOne({ _id: req.params.id }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});

router.post('/', function (req, res, next) {
    var im = new Trucks({
        vtype: req.body.vtype,
        truckno: req.body.truckno,
        spi: req.body.spi,
        taname: req.body.taname,
        drivername: req.body.drivername,
        gps: req.body.gps,
        status: req.body.status,
        ownername: req.body.ownername,
        newaddress: req.body.newaddress,
        newpan: req.body.newpan,
        newaadhar: req.body.newaadhar,
        newmobile: req.body.newmobile,
        newcontactp: req.body.newcontactp,
        newcmobile: req.body.newcmobile,
        type: req.body.type,
        newcarring: req.body.newcarring,
        newengine: req.body.newengine,
        enginetype: req.body.enginetype,
        newchasis: req.body.newchasis,
        purchasedate: req.body.purchasedate,
        salesdate: req.body.salesdate,
        newcommision: req.body.newcommision,
        newrates: req.body.newrates,
        newpaymentcharge: req.body.newpaymentcharge,
        newbilltycharge: req.body.newbilltycharge

    });
    im.save(function (err, result) {
        res.send(result);
    });
});


router.put('/', function (req, res, next) {
    let item_id = req.query.id
    Trucks.update({_id:item_id},{$set:{    
        vtype: req.body.vtype,
        truckno: req.body.truckno,
        spi: req.body.spi,
        taname: req.body.taname,
        drivername: req.body.drivername,
        gps: req.body.gps,
        status: req.body.status,
        ownername: req.body.ownername,
        newaddress: req.body.newaddress,
        newpan: req.body.newpan,
        newaadhar: req.body.newaadhar,
        newmobile: req.body.newmobile,
        newcontactp: req.body.newcontactp,
        newcmobile: req.body.newcmobile,
        type: req.body.type,
        newcarring: req.body.newcarring,
        newengine: req.body.newengine,
        enginetype: req.body.enginetype,
        newchasis: req.body.newchasis,
        purchasedate: req.body.purchasedate,
        salesdate: req.body.salesdate,
        newcommision: req.body.newcommision,
        newrates: req.body.newrates,
        newpaymentcharge: req.body.newpaymentcharge,
        newbilltycharge: req.body.newbilltycharge

    }})
    .then(function(result) {
        console.log('item_id',item_id)
        res.send(result);
    }).catch(function(err) {
        console.log('error', err)
        res.send(err);
    });
});

router.delete ('/:id', function(req, res, next) {
    console.log('Site profile Delete', req.params.id);
    
    Trucks.deleteOne({"_id": req.params.id}).then(function(deleteResult) {   
        
        res.send(deleteResult);

    }).catch(function(err) {
        res.send(err);
    });
});



module.exports = router;
