var express = require('express');
var router = express.Router();
var async = require('async');
var Accountcategory = require('../../models/admin-privileges/accounts-category');

var checkLogin = require('../middlewares/checkLogin');

router.get('/',checkLogin(),function (req, res, next) {
    let limit = req.query.limit ? req.query.limit : 5
    let offset = req.query.offset ? req.query.offset : 0
    let searchText = req.query.searchText;
    if (searchText !== undefined) {
        var regex = new RegExp(searchText, 'i');
        let sitematchCondition = {}
        Accountcategory.find({'$or': [{ 'catname': { $regex: regex }},{ 'cattype': { $regex: regex }},{ 'undergroup': { $regex: regex }},{ 'accounts': { $regex: regex }}]}).count(function (e, count) {  
            Accountcategory.find({'$or': [{ 'catname': { $regex: regex }},{ 'cattype': { $regex: regex }},{ 'undergroup': { $regex: regex }},{ 'accounts': { $regex: regex }}]}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
            });
        });
    }
    else {
        Accountcategory.count(function (e, count) {  
            Accountcategory.find().sort({ catname: 1 }).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
            });
        });   
    }      
     
});


router.get('/:id', function(req, res) {
    Accountcategory.findOne({ _id: req.params.id }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});

router.post('/', function (req, res, next) {
    var im = new Accountcategory({
        catname: req.body.catname,
        cattype: req.body.cattype,
        undergroup: req.body.undergroup,
        accounts: req.body.accounts,
        drcr: req.body.drcr
    });
    im.save(function (err, result) {
        res.send(result);
    });
});


router.put('/', function (req, res, next) {
    let item_id = req.query.id
    Accountcategory.update({_id:item_id},{$set:{    
        catname: req.body.catname,
        cattype: req.body.cattype,
        undergroup: req.body.undergroup,
        accounts: req.body.accounts,
        drcr: req.body.drcr
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

    console.log('Accounts Category Delete', req.params.id);
    
    Accountcategory.deleteOne({"_id": req.params.id}).then(function(deleteResult) {   
        
        res.send(deleteResult);

    }).catch(function(err) {
        res.send(err);
    });
});



module.exports = router;
