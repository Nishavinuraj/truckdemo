var express = require('express');
var router = express.Router();
var async = require('async');
var tas = require('../../models/ta')

router.get('/', function (req, res, next) {
    let limit = req.query.limit ? req.query.limit : 5
    let offset = req.query.offset ? req.query.offset : 0
    let searchText = req.query.searchText;
    if (searchText !== undefined) {
        var regex = new RegExp(searchText, 'i');

        tas.find({'$or': [{ 'name': { $regex: regex }},{ 'mobile1': { $regex: regex }}]}).count(function (e, count) {  
            tas.find({'$or': [{ 'name': { $regex: regex }},{ 'mobile1': { $regex: regex }}] }).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
                });
        });
    }
    else {
        tas.count(function (e, count) {  
            tas.find().sort({field:1, name: 1}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
            });
        });   
    }      
     
});

router.get('/:id', function(req, res) {
    tas.findOne({ _id: req.params.id }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});

router.post('/', function (req, res, next) {
    var im = new tas({
        name: req.body.name,
        mobile1: req.body.mobile1,
        mobile2: req.body.mobile2,
        status: req.body.status
    });
    im.save(function (err, result) {
        res.send(result);
    });
});


router.put('/', function (req, res, next) {
    let item_id = req.query.id
    tas.update({_id:item_id},{$set:{    
        name: req.body.name,
        mobile1: req.body.mobile1,
        mobile2: req.body.mobile2,
        status: req.body.status
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
    tas.deleteOne({"_id": req.params.id}).then(function(deleteResult) {   
        res.send(deleteResult);
    }).catch(function(err) {
        res.send(err);
    });
});


module.exports = router;
