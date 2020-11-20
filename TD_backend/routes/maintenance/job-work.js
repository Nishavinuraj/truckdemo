var express = require('express');
var router = express.Router();
var async = require('async');
var JobworksSchema = require('../../models/maintenance/job-work');
var Jobworks = require('../../models/maintenance/job-work');
var Jwreminders = require('../../models/maintenance/job-workreminders');
var checkLogin = require('../middlewares/checkLogin');
var Trucks = require('../../models/trucks');
var jwt = require('jsonwebtoken');

router.get('/enginetype/:truckno', function(req, res) {
    Trucks.findOne({ truckno: req.params.truckno }, (err, item) => {
      if (err) { return console.error(err); }
      var enginetype = '';
      if(item){
          enginetype = item.enginetype
      }
      res.send({enginetype:enginetype});
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
            console.log("ADMIN  >>>>>>>");
            sitematchCondition = {'site': { $regex: regex }};
        } else {
            sitematchCondition = { site: req.user.site };
        }
        Jobworks.find({'$or': [sitematchCondition, { 'vendor': { $regex: regex }}, { 'truck_no': { $regex: regex }}]}).count(function (e, count) {  
            Jobworks.find({'$or': [sitematchCondition, { 'vendor': { $regex: regex }}, { 'truck_no': { $regex: regex }}]}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
            });
        });
    }
    else {
        let matchCondition = {};
        if (req.user.role == 'ADMIN') {
            console.log("ADMIN  >>>>>>>");
            matchCondition = { };
        } else {
            matchCondition = { site: req.user.site };
        }

        Jobworks.count(function (e, count) {  
            Jobworks.find(matchCondition).sort({ job_date: -1, job_number: -1 }).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
            });
        });   
    }      
     
});

router.post('/', function (req, res, next) {
    // accounts posting starts
    var site = req.body.site;
    var trandate = req.body.job_date;
    var vendor = req.body.vendor;
    var km_reading = req.body.km_reading;
    var truck_no = req.body.truck_no;

    var user_name;
    jwt.verify(req.headers['x-auth'], 'secretPassword', function(err, decoded) {

        if (err) {
            console.log("err   >>>>>>>", err);
            return res.status(401).json({ statusCode: 401, code: "Invalid Token...!" });
        }

        user_name = decoded.split(":")[0];
    });
    
    req.body.user = user_name;

    var d = new Jobworks(req.body);

    d.save(function (err, save) {
        req.body.job_items.forEach(element => {
            tnextduekm = element['nextduekm']
            tworktobedone = element['worktobedone']
            if(tnextduekm == 0){
            } 
            else 
            {
                var jwLeg = new Jwreminders(
                    {    
                        site:site,
                        job_date:trandate,
                        vendor:vendor,
                        worktobedone:tworktobedone,
                        nextduekm: tnextduekm,
                        km_reading:km_reading,
                        truck_no:truck_no,
                        ckm_reading:km_reading,
                        jobwork_id: save['_id']
                    });
                jwLeg.save(function(i_err,i_save) {
                    console.log('jobworkreminders saveinfo ', i_err, i_save)
                    // console.log(element['accounts_id'])
                })
            }
  

        }); 
        res.send(save);
    });
});

router.get('/:id', function(req, res) {
    Jobworks.findOne({ _id: req.params.id }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});

router.put('/', function (req, res, next) {
    let post_data = req.body;
    let litem_id = req.query.id
    var site = req.body.site;
    var trandate = req.body.job_date;
    var vendor = req.body.vendor;
    var km_reading = req.body.km_reading;
    var truck_no = req.body.truck_no;

    var user_name;
    jwt.verify(req.headers['x-auth'], 'secretPassword', function(err, decoded) {

        if (err) {
            console.log("err   >>>>>>>", err);
            return res.status(401).json({ statusCode: 401, code: "Invalid Token...!" });
        }

        user_name = decoded.split(":")[0];
    });
    
    req.body.user = user_name;


    Jobworks.update({_id:litem_id},{$set:{    
        job_number: post_data.job_number,
        job_type: post_data.job_type,
        site: post_data.site,
        job_date:post_data.job_date,
        truck_no:post_data.truck_no,
        vendor:post_data.vendor,
        km_reading: post_data.km_reading,
        enginetype:enginetype,
        mannualenginetype:mannualenginetype,
        bill_amount: post_data.bill_amount,
        app_amount: post_data.app_amount,
        job_remarks: post_data.job_remarks,
        user: req.body.user,
        job_items:post_data.job_items   
    }})
    .then(function(result) {
        Jwreminders.deleteMany({ jobwork_id: litem_id }, function (err, d_result) {
        });
        
        req.body.job_items.forEach(element => {
            tnextduekm = element['nextduekm']
            tworktobedone = element['worktobedone']
            if(tnextduekm == 0){
            } 
            else 
            {
                var jwLeg = new Jwreminders(
                    {    
                        site:site,
                        job_date:trandate,
                        vendor:vendor,
                        worktobedone:tworktobedone,
                        nextduekm: tnextduekm,
                        km_reading:km_reading,
                        truck_no:truck_no,
                        ckm_reading:km_reading,
                        jobwork_id: litem_id
                    });
                jwLeg.save(function(i_err,i_save) {
                    console.log('jobworkreminders saveinfo ', i_err, i_save)
                    // console.log(element['accounts_id'])
                })
            }
  

        });         
    res.send(result);
    }).catch(function(err) {
        console.log('error', err)
        res.send(err);
    });
});


router.delete ('/:id', function(req, res, next) {
    console.log('Job Work Delete', req.params.id);
    
    Jobworks.deleteOne({"_id": req.params.id}).then(function(deleteResult) {   
        Jwreminders.deleteMany({ jobwork_id: req.params.id }, function (err, result) {
        });

        res.send(deleteResult);
    }).catch(function(err) {
        res.send(err);
    });
});

router.post('/generate_job_number', function(req, res) {

    console.log(' matchcond', req.body);

    Jobworks.find(req.body).count(function (e, count) { 
        res.send({count: count});
    })
});

module.exports = router;
