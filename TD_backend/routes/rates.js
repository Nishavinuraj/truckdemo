var express = require('express');
var router = express.Router();
var async = require('async');
var Rates = require('../models/rates');

router.post('/get_freight', function(req, res, next) {
    var listArray = [];
    var matchCondition = {site:req.body.site,name:req.body.consignor,'multidest.destination':req.body.destination,'multidest.spi':req.body.spi}
	Rates.find(matchCondition).then(function(results) {
        var freight = null;
        //multidest:{destination:req.body.destination,spi:req.body.spi}
        results.forEach(result=>{
            result.multidest.forEach(m => {
                if(m.destination==req.body.destination && m.spi==req.body.spi){
                    console.log(' Found rate true');
                    freight = m.freight;
                }
            });
        })
        
        console.log(' Party Freight B ', freight)
        res.send({freight:freight});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/rates_list', function(req, res, next) {
    var listArray = [];
	Rates.find({}).select('-multidest').then(function(result) {
        result.forEach(r => {
            obj = {
                "name": r.name,
                "site": r.site,
                "status": r.status,
                "rateby": r.rateby,
                "diesel": r.diesel,
            }          
            listArray.push(obj);
        });

        res.send(listArray);
    }).catch(function(err) {
        res.send(err);
    });
});


router.get('/rateby/:site', function(req, res, next) {
    var listArray = [];
	Rates.findOne({site:req.params.site}).then(function(result) {
        res.send({rateBy:result.rateby});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/rates_detail', function(req, res, next) {
    var listArray = [];
	Rates.find({"site": req.query.site_name }).then(function(result) {
        result.forEach(r => {
            multidest = r.multidest;
            multidest.forEach(i => {
                obj = {
                    "name": r.name,
                    "site": r.site,
                    "status": r.status,
                    "rateby": r.rateby,
                    "diesel": r.diesel,
                    "destination": i.destination,
                    "spi": i.spi,
                    "km": i.km,
                    "freight": i.freight,
                    "startdate": i.startdate,
                    "enddate": i.enddate
                }               
                listArray.push(obj);
            });
        });
        
        res.send(listArray);
    }).catch(function(err) {
        console.log(err);
        res.send(err);
    });
});


router.post('/rates_update', function(req, res, next) {
    var matchCondition;
    if (req.query.destination) {
        matchCondition = { "multidest.$.destination" : req.query.destination};
    }
    if (req.query.spi) {
        matchCondition = { "multidest.$.spi" : req.query.spi};
    }
    if (req.query.km) {
        matchCondition = { "multidest.$.km" : req.query.km};
    }
    if (req.query.freight) {
        matchCondition = { "multidest.$.freight" : req.query.freight};
    }
    if (req.query.startdate) {
        matchCondition = { "multidest.$.startdate" : req.query.startdate};
    }
    if (req.query.enddate) {
        matchCondition = { "multidest.$.enddate" : req.query.enddate};
    }
	
    Rates.update(
        { "_id": req.query.id, "multidest._id": req.query.multidest_id  },
        { "$set": matchCondition}
    ).then(function(result) {
        res.send({ "message": "Update..!"});
    }).catch(function(err) {
        console.log(err);
        res.send(err);
    });
});



module.exports = router;