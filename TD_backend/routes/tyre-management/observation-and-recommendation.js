var express = require('express');
var router = express.Router();
var async = require('async');
var Obrcmasters = require('../../models/tyre-management/obrcmaster');


router.get('/', function (req, res, next) {
    let limit = req.query.limit ? req.query.limit : 5
    let offset = req.query.offset ? req.query.offset : 0
    let searchText = req.query.searchText;
    if (searchText !== undefined) {
        var regex = new RegExp(searchText, 'i');
        Obrcmasters.find({'$or': [{ 'orname': { $regex: regex }}, { 'desc': { $regex: regex }}]}).count(function (e, count) {  
            Obrcmasters.find({'$or': [{ 'orname': { $regex: regex }}, { 'desc': { $regex: regex }}]}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
                });
        });
    }
    else {
        Obrcmasters.count(function (e, count) {  
            Obrcmasters.find().sort({orname:1}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
            });
        });   
    }      
     
});

router.get('/all', function (req, res, next) {
    Obrcmasters.find().exec(function(err, result) {   
        res.send({ records: result});   
     });
});

router.get('/:id', function(req, res) {
    Obrcmasters.findOne({ _id: req.params.id }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});

router.post('/', function (req, res, next) {
    var im = new Obrcmasters({
        orname: req.body.orname,
        desc: req.body.desc
    });
    im.save(function (err, result) {
        res.send(result);
    });
});


router.delete ('/:id', function(req, res, next) {
    Obrcmasters.deleteOne({"_id": req.params.id}).then(function(deleteResult) {   
        res.send(deleteResult);
    }).catch(function(err) {
        res.send(err);
    });
});

router.put('/', function (req, res, next) {
    let item_id = req.query.id
    Obrcmasters.update({_id:item_id},{$set:{    
        coname: req.body.orname,
        desc: req.body.desc
    }})
    .then(function(result) {
        console.log('item_id',item_id)
        res.send(result);
    }).catch(function(err) {
        console.log('error', err)
        res.send(err);
    });
});

module.exports = router;