var express = require('express');
var router = express.Router();
var async = require('async');
var TyrecmsSchema = require('../../models/tyre-management/tyre-company-master');
var Tyrecms = require('../../models/tyre-management/tyre-company-master');

router.get('/', function (req, res, next) {
    let limit = req.query.limit ? req.query.limit : 5
    let offset = req.query.offset ? req.query.offset : 0
    let searchText = req.query.searchText;
    if (searchText !== undefined) {
        var regex = new RegExp(searchText, 'i');
        Tyrecms.find({'coname': { $regex: regex }}).count(function (e, count) {  
            Tyrecms.find({'coname': { $regex: regex }}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
                });
        });
    }
    else {
        Tyrecms.count(function (e, count) {  
            Tyrecms.find().sort({coname:1}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
            });
        });   
    }      
     
});


router.post('/', function (req, res, next) {
    // accounts posting starts
    var d = new Tyrecms(req.body);

    d.save(function (err, save) {
        req.body.tcm_items.forEach(element => {
          
        }); 
        res.send(save);
    });
});



router.get('/:id', function(req, res) {
    Tyrecms.findOne({ _id: req.params.id }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});

router.get('/company/:name', function(req, res) {
    Tyrecms.findOne({ coname: req.params.name }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});

router.put('/', function (req, res, next) {
    let post_data = req.body;
    let litem_id = req.query.id
    Tyrecms.update({_id:litem_id},{$set:{    
        coname: post_data.coname,
        user: null,
        tcm_items:post_data.tcm_items   
    }})
    .then(function(result) {
        
    res.send(result);
    }).catch(function(err) {
        console.log('error', err)
        res.send(err);
    });
});


router.delete ('/:id', function(req, res, next) {
    console.log('Tyre Company Master Delete', req.params.id);
    
    Tyrecms.deleteOne({"_id": req.params.id}).then(function(deleteResult) {   


        res.send(deleteResult);
    }).catch(function(err) {
        res.send(err);
    });
});

module.exports = router;
