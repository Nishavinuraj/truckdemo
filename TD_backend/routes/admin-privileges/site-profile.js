var express = require('express');
var router = express.Router();
var async = require('async');
var Siteprofiles = require('../../models/admin-privileges/site-profile');

router.get('/', function (req, res, next) {
    let limit = req.query.limit ? req.query.limit : 5
    let offset = req.query.offset ? req.query.offset : 0
    let searchText = req.query.searchText;
    if (searchText !== undefined) {
        var regex = new RegExp(searchText, 'i');
        Siteprofiles.find({'site': { $regex: regex }}).count(function (e, count) {  
            Siteprofiles.find({'site': { $regex: regex }}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
                });
        });
    }
    else {
        Siteprofiles.count(function (e, count) {  
            Siteprofiles.find().sort({site: 1}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
            });
        });   
    }      
     
});

router.get('/:id', function(req, res) {
    Siteprofiles.findOne({ _id: req.params.id }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});

router.post('/', function (req, res, next) {
    var im = new Siteprofiles({
        site: req.body.site,
        consignor: req.body.consignor,
        destination: req.body.destination,
        from: req.body.from,
        godown: req.body.godown,
        department: req.body.department,
        gstno: req.body.gstno,
        siteaddress: req.body.siteaddress,
        phoneno: req.body.phoneno,
        emailid: req.body.emailid,
        custcareno: req.body.custcareno

    });
    im.save(function (err, result) {
        res.send(result);
    });
});


router.put('/', function (req, res, next) {
    let item_id = req.query.id
    Siteprofiles.update({_id:item_id},{$set:{    
        site: req.body.site,
        consignor: req.body.consignor,
        destination: req.body.destination,
        from: req.body.from,
        godown: req.body.godown,
        department: req.body.department,
        gstno: req.body.gstno,
        siteaddress: req.body.siteaddress,
        phoneno: req.body.phoneno,
        emailid: req.body.emailid,
        custcareno: req.body.custcareno
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
    console.log('Site profile Delete', req.params.id);
    
    Siteprofiles.deleteOne({"_id": req.params.id}).then(function(deleteResult) {   
        
        res.send(deleteResult);

    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/consigner/:site', function(req, res) {
    Siteprofiles.findOne({ site: req.params.site }, (err, item) => {
      if (err) { return console.error(err); }
      res.send({consigner:item.consignor,from:item.from});
    });
});


module.exports = router;
