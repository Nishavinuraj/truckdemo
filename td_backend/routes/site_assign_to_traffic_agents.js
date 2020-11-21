var express = require('express');
var router = express.Router();
var SiteAssign = require('../models/siteassign');

router.post('/create_traffic_agent', function(req, res, next) {

    var d = new SiteAssign(req.body);
    
    d.save(function (err, save) {
       console.log("err  >>>",err);
       console.log("save  >>>",save);
       res.send({"message": "Added..!"}); 
    });
     
});

router.get('/select_traffic_agent', function(req, res, next) {

    // matchCondition
    SiteAssign.find({ taname: req.query.ta_name }).select("sites").then(function(result) {
        var sitesArray = [];
        result.forEach(r => {
            var sites = r.sites;
            sites.forEach(e => {
                var obj = { "site": e.site};
                console.log(">>", obj);
                sitesArray.push(obj);
            });
        });
        
        res.send({ "sites": sitesArray});
    }).catch(function(err) {
        res.send(err);
    });
});

module.exports = router;