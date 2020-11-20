var express = require('express');
var router = express.Router();
var async = require('async');
var Units = require('../../models/inventory/units');

router.get('/', function (req, res, next) {
    Units.find({}).then(function (result) {
        res.send({ records: result, totalRecords: result.length });
    }).catch(function (err) {
        res.send(err);
    });
});

router.post('/', function (req, res, next) {
    var sa = new Units({
        name: req.body.name
    });

    sa.save(function (err, result) {
        res.send(result);
    });
});


module.exports = router;