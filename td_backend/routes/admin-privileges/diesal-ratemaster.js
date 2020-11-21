var express = require('express');
var router = express.Router();
var async = require('async');
var Diesalrates = require('../../models/admin-privileges/dieselrate');
var checkLogin = require('../middlewares/checkLogin');
var Sitepetrolpumps = require('../../models/admin-privileges/site-petrolpump')
var jwt = require('jsonwebtoken');

router.get('/rate/:vendor/:dateStr', function(req, res) {
    Diesalrates.findOne({ vendername: req.params.vendor, date: { "$regex": req.params.dateStr, "$options": "i" } }, (err, item) => {
      if (err) { return console.error(err); }
      if(item){
        res.send({rate:item.rate});
      }else{
        res.send({rate:""});
      }
    });
});

router.get('/',checkLogin(),function (req, res, next) {
    let limit = req.query.limit ? req.query.limit : 5
    let offset = req.query.offset ? req.query.offset : 0
    let searchText = req.query.searchText;
    if (searchText !== undefined) {
        var regex = new RegExp(searchText, 'i');
        let sitematchCondition = {}
        if (req.user.role == 'ADMIN') {
            sitematchCondition = {'site': { $regex: regex }};
            console.log("ADMIN  >>>>>>>", sitematchCondition) ;
            Diesalrates.find({'$or': [sitematchCondition, { 'vendername': { $regex: regex }}, { 'username': { $regex: regex }}]}).count(function (e, count) {  
                Diesalrates.find({'$or': [sitematchCondition, { 'vendername': { $regex: regex }}, { 'username': { $regex: regex }}]}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
                res.send({ records: result, totalRecords: count });   
                });
            });

        } else {
            sitematchCondition = { site: req.user.site };
            console.log("ADMIN  >>>>>>>", sitematchCondition) ;
            Diesalrates.find({
                $and:[
                     {$or:[ 
                        { 'vendername': { $regex: regex }}, 
                        { 'username': { $regex: regex }}, 
                    ]},
                    sitematchCondition
                 ]}).count(function (e, count) {
                    Diesalrates.find({
                        $and:[
                             {$or:[
                                { 'vendername': { $regex: regex }}, 
                                { 'username': { $regex: regex }}, 
                              ]},
                             sitematchCondition
                        ]}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
                            res.send({ records: result, totalRecords: count })              
                 });
                });
        }
    }
    else {
        let matchCondition = {};
        if (req.user.role == 'ADMIN') {
            console.log("ADMIN  >>>>>>>");
            matchCondition = { };
        } else {
            matchCondition = { site: req.user.site };
        }

        Diesalrates.count(function (e, count) {  
            Diesalrates.find(matchCondition).sort({ date: -1 }).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
            });
        });   
    }      
     
});


router.get('/:id', function(req, res) {
    Diesalrates.findOne({ _id: req.params.id }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});

// router.post('/', function (req, res, next) {
//     var im = new Diesalrates({
//         site: req.body.site,
//         vendername: req.body.vendername,
//         date: req.body.date,
//         rate: req.body.rate

//     });
//     im.save(function (err, result) {
//         res.send(result);
//     });
// });

router.post('/', function (req, res, next) {
    var site = req.body.site;
    var user_name;
    jwt.verify(req.headers['x-auth'], 'secretPassword', function(err, decoded) {

        if (err) {
            console.log("err   >>>>>>>", err);
            return res.status(401).json({ statusCode: 401, code: "Invalid Token...!" });
        }

        user_name = decoded.split(":")[0];
    });


    req.body.username = user_name;
    var d = new Diesalrates(req.body);

    d.save(function (err, save) {
        console.log("err  >>>",err);
        console.log("save  >>>",save);
        res.send({"message": "Added..!"}); 
    });

});

router.put('/', function (req, res, next) {
    let item_id = req.query.id
    Diesalrates.update({_id:item_id},{$set:{    
        site: req.body.site,
        vendername: req.body.vendername,
        date: req.body.date,
        rate: req.body.rate
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
    
    Diesalrates.deleteOne({"_id": req.params.id}).then(function(deleteResult) {   
        
        res.send(deleteResult);

    }).catch(function(err) {
        res.send(err);
    });
});



module.exports = router;
