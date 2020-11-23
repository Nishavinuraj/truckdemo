var express = require('express');
var router = express.Router();
var async = require('async');
var Accounts = require('../../models/accounts');
var checkLogin = require('../middlewares/checkLogin');
router.get('/',checkLogin(),function (req, res, next) {
    let limit = req.query.limit ? req.query.limit : 5
    let offset = req.query.offset ? req.query.offset : 0
    let searchText = req.query.searchText;
    if (searchText !== undefined) {
        var regex = new RegExp(searchText, 'i');
        let sitematchCondition = {}
        Accounts.find({'$or': [{ 'accountname': { $regex: regex }},{ 'category': { $regex: regex }},{ 'group': { $regex: regex }},{ 'site': { $regex: regex }},{ 'bcity': { $regex: regex }}]}).count(function (e, count) {  
            Accounts.find({'$or': [{ 'accountname': { $regex: regex }},{ 'category': { $regex: regex }},{ 'group': { $regex: regex }},{ 'site': { $regex: regex }},{ 'bcity': { $regex: regex }}]}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
            });
        });
    }
    else {
        Accounts.count(function (e, count) {  
            Accounts.find().sort({ accountname: 1 }).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
            });
        });   
    }      
     
});


router.get('/:id', function(req, res) {
    Accounts.findOne({ _id: req.params.id }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});

router.post('/', function (req, res, next) {
    var im = new Accounts({
        accountname: req.body.accountname,
        category: req.body.category,
        group: req.body.group,
        site: req.body.site,
        accounttype: req.body.accounttype,
        underledger: req.body.underledger,
        gstnumber: req.body.gstnumber,
        panno: req.body.panno,
        vcode: req.body.vcode,
        contactpersonname: req.body.contactpersonname,
        email: req.body.email,
        mobile1: req.body.mobile1,
        mobile2: req.body.mobile2,
        opbal: req.body.opbal,
        ocrdr: req.body.ocrdr,
        clbal: req.body.clbal,
        cdrcr: req.body.cdrcr,
        bstreet1: req.body.bstreet1,
        bstreet2: req.body.bstreet2,
        bcity: req.body.bcity,
        bstate: req.body.bstate,
        bzip: req.body.bzip,
        bcountry: req.body.bcountry,
        bphone: req.body.bphone,
        sstreet1: req.body.sstreet1,
        sstreet2: req.body.sstreet2,
        scity: req.body.scity,
        sstate: req.body.sstate,
        szip: req.body.szip,
        scountry: req.body.scountry,
        sphone: req.body.sphone
    });
    im.save(function (err, result) {
        res.send(result);
    });
});


router.put('/', function (req, res, next) {
    let item_id = req.query.id
    Accounts.update({_id:item_id},{$set:{    
        accountname: req.body.accountname,
        category: req.body.category,
        group: req.body.group,
        site: req.body.site,
        accounttype: req.body.accounttype,
        underledger: req.body.underledger,
        gstnumber: req.body.gstnumber,
        panno: req.body.panno,
        vcode: req.body.vcode,
        contactpersonname: req.body.contactpersonname,
        email: req.body.email,
        mobile1: req.body.mobile1,
        mobile2: req.body.mobile2,
        opbal: req.body.opbal,
        ocrdr: req.body.ocrdr,
        clbal: req.body.clbal,
        cdrcr: req.body.cdrcr,
        bstreet1: req.body.bstreet1,
        bstreet2: req.body.bstreet2,
        bcity: req.body.bcity,
        bstate: req.body.bstate,
        bzip: req.body.bzip,
        bcountry: req.body.bcountry,
        bphone: req.body.bphone,
        sstreet1: req.body.sstreet1,
        sstreet2: req.body.sstreet2,
        scity: req.body.scity,
        sstate: req.body.sstate,
        szip: req.body.szip,
        scountry: req.body.scountry,
        sphone: req.body.sphone
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
    console.log('Accounts Master Delete', req.params.id);
    
    Accounts.deleteOne({"_id": req.params.id}).then(function(deleteResult) {   
        
        res.send(deleteResult);

    }).catch(function(err) {
        res.send(err);
    });
});



module.exports = router;
