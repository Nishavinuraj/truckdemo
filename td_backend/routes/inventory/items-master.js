    var express = require('express');
    var router = express.Router();
    var async = require('async');
    var Itemmasters = require('../../models/inventory/items-master');
    var ScrapLedgers = require('../../models/inventory/scrapledger');


    router.get('/all_items', function (req, res, next) { 
        Itemmasters.find({}).sort({name:1}).then(function (result) {
                        res.send({ records: result, totalRecords: result.length });
                    }).catch(function (err) {
                        res.send(err);
                    });      
    });


    router.get('/scrapledger_items', function(req, res, next) {

        ScrapLedgers.distinct("itemname").then( function(result) {
            // res.send({"result": result});
            res.send({ records: result, totalRecords: result.length });
        }).catch (function(err) {
            //console.log("err   >>>>",err);
            res.send(err);
        });
    });
    
    router.get('/', function (req, res, next) {
        let limit = req.query.limit ? req.query.limit : 5
        let offset = req.query.offset ? req.query.offset : 0
        let searchText = req.query.searchText;
        if (searchText !== undefined) {
            var regex = new RegExp(searchText, 'i');
            Itemmasters.find({'$or': [{ 'name': { $regex: regex }}, { 'pdescription': { $regex: regex }}]}).count(function (e, count) {  
                Itemmasters.find({'$or': [{ 'name': { $regex: regex }}, { 'pdescription': { $regex: regex }}]}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
                   res.send({ records: result, totalRecords: count });   
                    });
            });
        }
        else {
            Itemmasters.count(function (e, count) {  
                Itemmasters.find().sort({name:1}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
                   res.send({ records: result, totalRecords: count });   
                });
            });   
        }      
         
    });
    
    
    router.get('/all_godowns', function (req, res, next) { 
        Itemmasters.find({}).then(function (result) {
                        res.send({ records: result, totalRecords: result.length });
                    }).catch(function (err) {
                        res.send(err);
                    });      
    });
    router.get('/:id', function(req, res) {
        Itemmasters.findOne({ _id: req.params.id }, (err, item) => {
          if (err) { return console.error(err); }
          res.send(item);
        });
    });
    
    router.post('/', function (req, res, next) {
        var im = new Itemmasters({
            type: req.body.type,
            name: req.body.name,
            pdescription: req.body.pdescription,
            itemcategory: req.body.itemcategory,
            itemtype:req.body.itemtype,
            unit:req.body.unit,
            godown: req.body.godown,
            oq:req.body.oq,
            rate: req.body.rate,
            value: req.body.value,
            hsncode: req.body.hsncode,
            gst: req.body.gst
        });
        im.save(function (err, result) {
            res.send(result);
        });
    });
 
   
    router.delete ('/:id', function(req, res, next) {
        Itemmasters.deleteOne({"_id": req.params.id}).then(function(deleteResult) {   
            res.send(deleteResult);
        }).catch(function(err) {
            res.send(err);
        });
    });
    
    router.put('/', function (req, res, next) {
        let item_id = req.query.id
        Itemmasters.update({_id:item_id},{$set:{    
            type: req.body.type,
            name: req.body.name,
            pdescription: req.body.pdescription,
            itemcategory: req.body.itemcategory,
            itemtype:req.body.itemtype,
            unit:req.body.unit,
            godown: req.body.godown,
            oq:req.body.oq,
            rate: req.body.rate,
            value: req.body.value,
            hsncode: req.body.hsncode,
            gst: req.body.gst
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