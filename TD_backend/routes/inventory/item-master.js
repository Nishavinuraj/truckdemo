var express = require('express');
var router = express.Router();
var async = require('async');
var Itemmaster = require('../../models/inventory/items-master');

router.get('/', function (req, res, next) {    
    let limit = req.query.limit ? req.query.limit : 10
    let offset = req.query.offset ? req.query.offset : 0       
    Itemsmaster.count(function (e, count) { 
        console.log("limit", limit, offset)  
        Itemsmaster.find().sort({name:1}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
           res.send({ records: result, totalRecords: count });   
        });
    });  
});

router.post('/', function (req, res, next) {
    var d = new Itemmasters(req.body);
    d.save(function (err, save) {
        console.log("err  >>>",err);
        console.log("save  >>>",save);
        res.send(save);
    });
});
router.get('/:id', function(req, res) {
    Itemmaster.findOne({ _id: req.params.id }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});
router.put('/', function (req, res, next) {
    Itemmaster.update(req.body).then(function(result) {
        res.send(result);
    }).catch(function(err) {
        res.send(err);
    });
});
router.delete ('/:id', function(req, res, next) {
    Itemmaster.deleteOne({"_id": req.params.id}).then(function(deleteResult) {   
        res.send(deleteResult);
    }).catch(function(err) {
        res.send(err);
    });
});


module.exports = router;