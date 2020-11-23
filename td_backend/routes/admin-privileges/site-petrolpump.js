var express = require('express');
var router = express.Router();
var async = require('async');
var SitepetrolpumpsSchema = require('../../models/admin-privileges/site-petrolpump');
var Sitepetrolpumps = require('../../models/admin-privileges/site-petrolpump')
var checkLogin = require('../middlewares/checkLogin');

router.get('/',checkLogin(),function (req, res, next) {
    let limit = req.query.limit ? req.query.limit : 5
    let offset = req.query.offset ? req.query.offset : 0
    let searchText = req.query.searchText;
    if (searchText !== undefined) {
        var regex = new RegExp(searchText, 'i');
        let sitematchCondition = {}
        if (req.user.role == 'ADMIN') {
            console.log("ADMIN  >>>>>>>");
            sitematchCondition = {'site': { $regex: regex }};
        } else {
            sitematchCondition = { site: req.user.site };
        }
        Sitepetrolpumps.find({sitematchCondition}).count(function (e, count) {  
            Sitepetrolpumps.find({sitematchCondition}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
            });
        });
    }
    else {
        let matchCondition = {};
        if (req.user.role == 'ADMIN') {
            console.log("ADMIN  >>>>>>>");
            matchCondition = { };
        } else {
            matchCondition = { site: req.user.site };
        }

        Sitepetrolpumps.count(function (e, count) {  
            Sitepetrolpumps.find(matchCondition).sort({ site: 1 }).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
            });
        });   
    }      
     
});

router.post('/', function (req, res, next) {
    var d = new Sitepetrolpumps(req.body);
    d.save(function (err, save) {
        res.send(save);
    });
});

router.get('/:id', function(req, res) {
    Sitepetrolpumps.findOne({ _id: req.params.id }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});

router.put('/', function (req, res, next) {
    let post_data = req.body;
    let litem_id = req.query.id
    Sitepetrolpumps.update({_id:litem_id},{$set:{    
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
    console.log('Petrol Pump Delete', req.params.id);
    
    Sitepetrolpumps.deleteOne({"_id": req.params.id}).then(function(deleteResult) {   
        
        res.send(deleteResult);

    }).catch(function(err) {
        res.send(err);
    });
});



module.exports = router;
