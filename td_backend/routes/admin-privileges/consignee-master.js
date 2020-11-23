var express = require('express');
var router = express.Router();
var async = require('async');
var CaddressSchema = require('../../models/caddress');
var Caddress = require('../../models/caddress')
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
        Caddress.find({'$or': [sitematchCondition, { 'name': { $regex: regex }}]}).count(function (e, count) {  
            Caddress.find({'$or': [sitematchCondition, { 'name': { $regex: regex }}]}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
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

        Caddress.count(function (e, count) {  
            Caddress.find(matchCondition).sort({ name: 1 }).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
            });
        });   
    }      
     
});

router.post('/', function (req, res, next) {
    // accounts posting starts
    var d = new Caddress(req.body);

    d.save(function (err, save) {
        req.body.multidest.forEach(element => {
          
        }); 
        res.send(save);
    });
});

router.get('/:id', function(req, res) {
    Caddress.findOne({ _id: req.params.id }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});

router.put('/', function (req, res, next) {
    let post_data = req.body;
    let litem_id = req.query.id
    Caddress.update({_id:litem_id},{$set:{    
        site: post_data.site,
        name:post_data.name,
        mobile:post_data.mobile,
        gst:post_data.gst,
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
    console.log('Consignee Master Delete', req.params.id);
    
    Caddress.deleteOne({"_id": req.params.id}).then(function(deleteResult) {   
        res.send(deleteResult);
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/consignee/:site', function(req, res) {
    Caddress.findOne({ site: req.params.site }, (err, item) => {
      if (err) { return console.error(err); }
      res.send({consignee:item.name,info:item.multidest});
    });
});

router.get('/consignee-by-name/:consignee', function(req, res) {
    Caddress.findOne({ name: req.params.consignee }, (err, item) => {
      if (err || !item) { return console.error(err); }
      res.send({consignee:item.name,info:item.multidest});
    });
});

module.exports = router;
