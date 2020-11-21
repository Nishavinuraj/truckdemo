var express = require('express');
var router = express.Router();
var async = require('async');
var TruckaveragesSchema = require('../../models/admin-privileges/truck-average');
var Truckaverages = require('../../models/admin-privileges/truck-average')
var Truckavgs = require('../../models/truckavgs')

router.get('/', function (req, res, next) {
    let limit = req.query.limit ? req.query.limit : 5
    let offset = req.query.offset ? req.query.offset : 0
    let searchText = req.query.searchText;
    if (searchText !== undefined) {
        var regex = new RegExp(searchText, 'i');
        Truckaverages.find({'site': { $regex: regex }}).count(function (e, count) {  
            Truckaverages.find({'site': { $regex: regex }}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
                });
        });
    }
    else {
        Truckaverages.count(function (e, count) {  
            Truckaverages.find().sort({site:1}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
            });
        });   
    }      
     
});


router.post('/', function (req, res, next) {
    var d = new Truckaverages(req.body);
    d.save(function (err, save) {
        res.send(save);
    });
});

router.get('/:id', function(req, res) {
    Truckaverages.findOne({ _id: req.params.id }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});

router.get('/dqty/:tyre/:tcc/:site', function(req, res) {
    Truckavgs.findOne({ site: req.params.site,tyre:req.params.tyre,tcc:req.params.tcc }, (err, item) => {
      if (err) { return console.error(err); }
      var avg = null;
      if(item){
        avg = item.tavg;
      }
      res.send({tavg:avg});
    });
});

router.put('/', function (req, res, next) {
    let post_data = req.body;
    let litem_id = req.query.id
    Truckaverages.update({_id:litem_id},{$set:{    
        site: post_data.site,
        multidest:post_data.multidest   
    }})
    .then(function(result) {
        
    res.send(result);
    }).catch(function(err) {
        console.log('error', err)
        res.send(err);
    });
});

router.delete ('/:id', function(req, res, next) {
    console.log('Truck Average Delete', req.params.id);
    
    Truckaverages.deleteOne({"_id": req.params.id}).then(function(deleteResult) {   
        
        res.send(deleteResult);

    }).catch(function(err) {
        res.send(err);
    });
});



module.exports = router;
