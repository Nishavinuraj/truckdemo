var express = require('express');
var router = express.Router();
var async = require('async');
var Jobworkmasters = require('../../models/maintenance/job-workmaster');

router.get('/', function (req, res, next) {
    let limit = req.query.limit ? req.query.limit : 5
    let offset = req.query.offset ? req.query.offset : 0
    let searchText = req.query.searchText;
    if (searchText !== undefined) {
        var regex = new RegExp(searchText, 'i');
        Jobworkmasters.find({ 'jobworkname': { $regex: regex }}).count(function (e, count) {  
            Jobworkmasters.find({'jobworkname': { $regex: regex } }).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
                });
        });
    }
    else {
        Jobworkmasters.count(function (e, count) {  
            Jobworkmasters.find().sort({jobworkname:1}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
            });
        });   
    }      
     
});

router.get('/all_items', function (req, res, next) { 
    Jobworkmasters.find({}).sort({jobworkname:1}).then(function (result) {
                    res.send({ records: result, totalRecords: result.length });
                }).catch(function (err) {
                    res.send(err);
                });      
});

router.get('/:id', function(req, res) {
    Jobworkmasters.findOne({ _id: req.params.id }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});

router.post('/', function (req, res, next) {
    var im = new Jobworkmasters({
        jobworkname: req.body.jobworkname
    });
    im.save(function (err, result) {
        res.send(result);
    });
});


router.put('/', function (req, res, next) {
    let item_id = req.query.id
    Jobworkmasters.update({_id:item_id},{$set:{    
        jobworkname: req.body.jobworkname
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
    Jobworkmasters.deleteOne({"_id": req.params.id}).then(function(deleteResult) {   
        res.send(deleteResult);
    }).catch(function(err) {
        res.send(err);
    });
});


module.exports = router;