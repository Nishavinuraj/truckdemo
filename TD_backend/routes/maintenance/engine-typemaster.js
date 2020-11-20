var express = require('express');
var router = express.Router();
var async = require('async');
var EnginemastersSchema = require('../../models/maintenance/engine-typemaster');
var Enginemasters = require('../../models/maintenance/engine-typemaster')

router.post('/get_kmtolerance', function(req, res, next) {
    var listArray = [];
    var matchCondition = {enginetype:req.body.enginetype,'multidest.jobworkname':req.body.worktobedone}
	Enginemasters.find(matchCondition).then(function(results) {
        var kmtolerance = null;
        results.forEach(result=>{
            result.multidest.forEach(m => {
                if(m.jobworkname==req.body.worktobedone){
                    console.log(' Found Job work');
                    kmtolerance = m.kmtolerance;
                }
            });
        })
        
        res.send({kmtolerance:kmtolerance});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/', function (req, res, next) {
    let limit = req.query.limit ? req.query.limit : 5
    let offset = req.query.offset ? req.query.offset : 0
    let searchText = req.query.searchText;
    if (searchText !== undefined) {
        var regex = new RegExp(searchText, 'i');
        Enginemasters.find({'enginetype': { $regex: regex }}).count(function (e, count) {  
            Enginemasters.find({'enginetype': { $regex: regex }}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
                });
        });
    }
    else {
        Enginemasters.count(function (e, count) {  
            Enginemasters.find().sort({enginetype:1}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
            });
        });   
    }      
     
});


router.post('/', function (req, res, next) {
    var d = new Enginemasters(req.body);
    d.save(function (err, save) {
        res.send(save);
    });
});

router.get('/:id', function(req, res) {
    Enginemasters.findOne({ _id: req.params.id }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});


router.put('/', function (req, res, next) {
    let post_data = req.body;
    let litem_id = req.query.id
    Enginemasters.update({_id:litem_id},{$set:{    
        enginetype: post_data.enginetype,
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
    console.log('Engine Type Master Delete', req.params.id);
    
    Enginemasters.deleteOne({"_id": req.params.id}).then(function(deleteResult) {   
        
        res.send(deleteResult);

    }).catch(function(err) {
        res.send(err);
    });
});



module.exports = router;
