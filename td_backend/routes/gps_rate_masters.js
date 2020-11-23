var express = require('express');
var router = express.Router();

var GpsRateMaster = require('../models/gps_rate_master');
var Single = require('../models/single');

router.post('/insert_gps_rate', function (req, res, next) {

   try {
      GpsRateMaster.insertMany(req.body);
      console.log(req.body);
      res.send({ success: true });
   } catch (e) {
      print(e);
   }
})

router.get('/getdestination', function (req, res, next) {
   matchCondition = {};

   matchCondition.field = {
      $eq: 'DTo'
   };

   var fetchData = function (matchCondition, cb) {
      Single.find(matchCondition,{name:1, _id:0}).sort({ name: 1 }).then(function (result) {
         cb(false, result);
      }).catch(function (err) {
         cb(err);
      });
   };

   fetchData(matchCondition,function(err, result){
      if (err) {
         console.log(err);
         return res.status(500).send(err);
     }
     console.log(result);
     res.send(result);
   });

})

router.get('/getgpsratebydestination',function(req, res, next ){
   matchCondition = {};
   var fetchData = function (matchCondition, cb) {
      GpsRateMaster.find(matchCondition).sort({ destination: 1 }).then(function (result) {
         cb(false, result);
      }).catch(function (err) {
         cb(err);
      });
   };

   if(req.query.destination){
      matchCondition.destination = {
         $eq: req.query.destination
      }
   }
   fetchData(matchCondition,function(err, result){
      if (err) {
         console.log(err);
         return res.status(500).send(err);
     }
     console.log(result);
     res.send(result);
   });
})

router.get('/getgpsrate',function(req, res, next ){
   matchCondition = {};

   

   var fetchData = function (matchCondition, cb) {
      GpsRateMaster.find().sort({ destination: 1 }).then(function (result) {
         cb(false, result);
      }).catch(function (err) {
         cb(err);
      });
   };
   fetchData(matchCondition,function(err, result){
      if (err) {
         console.log(err);
         return res.status(500).send(err);
     }
     console.log(result);
     res.send(result);
   });
})
router.get('/deleteData',function(req, res, next ){
   var deleteData = function(matchCondition, cb) {
      GpsRateMaster.remove(matchCondition).then(function (result) {
         console.log(result);
         cb(false, result);
      }).catch(function (err) {
         cb(err);
      });
   }
   if(req.query.destination){
      matchCondition.destination = {
         $eq: req.query.destination
      }
   }
   deleteData(matchCondition,function(err, result) {
      if (err) {
         console.log(err);
         return res.status(500).send(err);
     }
     console.log(result);
     res.send(result);
   })
})

module.exports = router;