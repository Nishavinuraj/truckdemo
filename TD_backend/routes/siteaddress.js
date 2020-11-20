var express = require('express');
var router = express.Router();
var async = require('async');
var SA = require('../models/siteaddress');

router.get('/', function(req, res, next) {
    var listArray = [];
    var query = {};

    if(req.query.site) {
        query.site = req.query.site;
    }

    SA.find(query).then(function(result) {
        res.send(result);
    }).catch(function(err) {
        res.send(err);
    });
});

router.post('/', function(req, res, next) {
    var sa = new SA({
        site: req.body.site,
        address: req.body.address,
        phone_numbers: req.body.phone_numbers
    });

    sa.save(function (err, result) {
        res.send(result);
    });
});


module.exports = router;