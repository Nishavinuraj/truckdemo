var express = require('express');
var router = express.Router();
var async = require('async');
var Tires = require('../../models/tires');

router.get('/', function (req, res, next) {
    let limit = req.query.limit ? req.query.limit : 5
    let offset = req.query.offset ? req.query.offset : 0
    let searchText = req.query.searchText;
    if (searchText !== undefined) {
        var regex = new RegExp(searchText, 'i');
        Tires.find({ 'name': { $regex: regex }}).count(function (e, count) {  
            Tires.find({'name': { $regex: regex } }).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
                });
        });
    }
    else {
        Tires.count(function (e, count) {  
            Tires.find().sort({tamount:1}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
            });
        });   
    }      
     
});

router.get('/:id', function(req, res) {
    Tires.findOne({ _id: req.params.id }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});

router.post('/', function (req, res, next) {
    var im = new Tires({
        name: req.body.name,
        tamount: req.body.tamount
    });
    im.save(function (err, result) {
        res.send(result);
    });
});


router.put('/', function (req, res, next) {
    let item_id = req.query.id
    Tires.update({_id:item_id},{$set:{    
        name: req.body.name,
        tamount: req.body.tamount
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
    Tires.deleteOne({"_id": req.params.id}).then(function(deleteResult) {   
        res.send(deleteResult);
    }).catch(function(err) {
        res.send(err);
    });
});


module.exports = router;