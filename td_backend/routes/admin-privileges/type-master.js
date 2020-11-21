var express = require('express');
var router = express.Router();
var async = require('async');
var Singles = require('../../models/single')


router.get('/', function (req, res, next) {    
    let limit = req.query.limit ? req.query.limit : 10
    let offset = req.query.offset ? req.query.offset : 0       
    Singles.count(function (e, count) { 
        console.log("limit", limit, offset)  
        Singles.find().sort({name:1}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
           res.send({ records: result, totalRecords: count });   
        });
    });  
});


router.post('/', function (req, res, next) {
    var sa = new TypeMaster({
        name: req.body.name
    });

    sa.save(function (err, result) {
        res.send(result);
    });
});


module.exports = router;