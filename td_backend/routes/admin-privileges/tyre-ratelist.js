var express = require('express');
var router = express.Router();
var async = require('async');
var TyreratelistsSchema = require('../../models/admin-privileges/tyre-ratelist');
var Tyreratelists = require('../../models/admin-privileges/tyre-ratelist')

router.get('/', function (req, res, next) {    
    let limit = req.query.limit ? req.query.limit : 5
    let offset = req.query.offset ? req.query.offset : 0       
    Tyreratelists.count(function (e, count) { 
        console.log("limit", limit, offset)  
        Tyreratelists.find({}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
           res.send({ records: result, totalRecords: count });   
        });
    });  
});


router.post('/', function (req, res, next) {
    var d = new Tyreratelists(req.body);
    d.save(function (err, save) {
        res.send(save);
    });
});

router.get('/:id', function(req, res) {
    Tyreratelists.findOne({ _id: req.params.id }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});

router.put('/', function (req, res, next) {
    let tyreratelist_id = req.query.id    
    Tyreratelists.update(req.body).then(function(result) {
        console.log('tyreratelist_id',tyreratelist_id)
        res.send(result);
    }).catch(function(err) {
        console.log('error', err)
        res.send(err);
    });
});


router.delete ('/:id', function(req, res, next) {
    console.log('Tyre Rate List Delete', req.params.id);
    
    Tyreratelists.deleteOne({"_id": req.params.id}).then(function(deleteResult) {   
    }).catch(function(err) {
        res.send(err);
    });
});



module.exports = router;
