var express = require('express');
var router = express.Router();
var FL = require('../models/fleetstarget');
var AL = require('../models/accountsledger');
var Billing = require('../models/billing');
var Permissions = require('../models/permissions');
var mongoose = require('mongoose');

/* GET home page. */
router.get('/fleettarget', function(req, res, next) {
    var d = new FL({
        fyear: '2019',
        tyre: '6',
        truckno: 'MH40BG8857',
        months: [
            {name: "January", target: 20000},
            {name: "February", target: 30000},
            {name: "March", target: 40000},
            {name: "April", target: 50000},
            {name: "May", target: 60000},
            {name: "June", target: 70000},
            {name: "July", target: 40000},
            {name: "August", target: 20000},
            {name: "September", target: 10000},
            {name: "October", target: 30000},
            {name: "November", target: 60000},
            {name: "December", target: 90000}
        ]
    });

    d.save(function () {
       res.send("ok"); 
    });
});

router.get('/accounts_ledger', function(req, res, next) {
    var d = new AL({
        branch: 'AWARPUR',
        accountname :'HDFC BANK',
        avouno: 68596,
        arefno: 'Credit diesel paid agnst Lr No. 31696 - ',
        adoctp: 'Billty',
        adebtamt: 50000,
        acrdtamt: 4000,
        avoudt:  new Date("2019-02-12"),
        flag: 2,
        user:'Khobragade', 
    });

    d.save(function (err, save) {
       //console.log(d);
       console.log("err  >>>",err);
       console.log("save  >>>",save);
       res.send("ok"); 
    });
});

router.get('/billing_insert', function(req, res, next) {
    var d = new Billing({
        lrno: 1007,
        billdate: '2019-02-13',
        destination :'HINGANGHAT',
        packages: 160,
        weightkg: 8,
        description: 'Cement PPC',
        tbbamount: 45000, 
        load: 5000,
        unload: 2000,
        haltdays: 12,
        haltamt: 2400,
    });

    d.save(function (err, save) {
       console.log("err  >>>",err);
       console.log("save  >>>",save);
       res.send("ok"); 
    });
});

router.post('/permissions_insert', function(req, res, next) {

        var arr  = [{
            name: "Dashboard",
            value: "dashboard"
        }];

        arr.forEach(p => {
            // p._id = mongoose.Types.ObjectId();
            var tmp = new Permissions(p);

            tmp.save(function (err, result) {
                console.log('saved');
                // console.log("result  >>>>",result);
                console.log("err   >>>>>",err);
            });
        });

        res.send("ok");

        // console.log(arr);
        
        // Permissions.insertMany(arr).then(function(err, result) {
        //     console.log("result  >>>>",result);
        //     console.log("err   >>>>>",err);
    
        //     res.send(result);
        // }).catch(function(err) {
        //     res.send(err);
        // });
        // res.send("ok"); 
     
});

module.exports = router;
