var express = require('express');
var router = express.Router();
var async = require('async');
var Sitedestinationkms = require('../../models/sitedestinationkm');
var Rates = require('../../models/rates');

router.get('/km/:site/:destination', function(req, res) {
    Sitedestinationkms.findOne({ site: req.params.site,destination: req.params.destination }, (err, item) => {
      if (err) { return console.error(err); }
      var km = 0;
      if(item){
          km = item.km
      }
      res.send({km:km});
    });
});

router.get('/', function (req, res, next) {
    let limit = req.query.limit ? req.query.limit : 5
    let offset = req.query.offset ? req.query.offset : 0
    let searchText = req.query.searchText;
    if (searchText !== undefined) {
        var regex = new RegExp(searchText, 'i');
        Sitedestinationkms.find({'destination': { $regex: regex }}).count(function (e, count) {  
            Sitedestinationkms.find({'destination': { $regex: regex }}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
                });
        });
    }
    else {
        Sitedestinationkms.count(function (e, count) {  
            Sitedestinationkms.find().sort({km:1}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
            });
        });   
    }      
     
});

router.get('/:id', function(req, res) {
    Sitedestinationkms.findOne({ _id: req.params.id }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});

router.get('/update/rates_site_dest_kms', function(req, res) {
var upd = function(sitev,dest,km){
    return function(callback){
        Rates.update({
            site:sitev,
            'multidest.destination':dest,
            'multidest.km':0
        },{
            'multidest.km':km
        },function(err,i){
            console.log("info:"+sitev+","+dest+","+km);
            callback(false,i)
        }) 
    }
}
    var findSite = function(site, dest){
        return function(callback){
            Sitedestinationkms.findOne({site:site,destination:dest},(err, sdk)=>{
                var arr = [];
                if(sdk && sdk.destination==dest){
                    arr.push(upd(site,dest,sdk.km))
                }
                async.parallel(arr, function(err, asyncResult) {
                    callback(false, asyncResult);
                });
            })
        }
    }


    Rates.find({ 'multidest.km':0}, (err, item) => {
      if (err) { return console.error(err); }
      var updArray = [];
       item.forEach(r => {
           let site = r.site;
           let multidests = r.multidest
        
           multidests.forEach(md=>{
               let dest = md.destination;
                updArray.push(findSite(site,dest));
           })
       });
       async.parallel(updArray, function(err, asyncResult) {
            res.send({status:true});
       });
    });
});

router.get('/update/site_dest_kms', function(req, res) {

    updatedata = function(id,sitev,dest,km){
        return function(callback){
            Sitedestinationkms.update({
                _id :id
            },{
                km:km
            },function(err,i){
                console.log("info:"+sitev+","+dest+","+km);
                callback(false,i)
            })
        }
    }
 
    var findRate = function(id, sitev,dest){
        return function(callback){
            Rates.find({site:sitev},(err, rates)=>{
                var updArr = [];
                rates.forEach(rate=>{
                    if(rate){
                        
                        let multidests = rate.multidest;
                        multidests.forEach(multidest=>{
                            if(multidest.destination==dest){       
                                updArr.push(updatedata(id, sitev,dest,multidest.km))
                            }
                        })
                       }
                })

                async.parallel(updArr, function(err, asyncResult) {
                    callback(false, asyncResult);
                });

                
                
                 
            })
        }
    }

    Sitedestinationkms.find({ km:0}, (err, item) => {
      if (err) { return console.error(err); }
      var rates = [];
        console.log(item.length)
       item.forEach(r => {
           let sitev = r.site;
           let dest = r.destination
           rates.push(findRate(r._id,sitev,dest))

       });

       async.parallel(rates, function(err, asyncResult) {
           res.send({status:true});
       });


    });
});

router.post('/', function (req, res, next) {
    var im = new Sitedestinationkms({
        site: req.body.site,
        destination: req.body.destination,
        km: req.body.km
    });
    im.save(function (err, result) {
        res.send(result);
    });
});


router.put('/', function (req, res, next) {
    let item_id = req.query.id
    Sitedestinationkms.update({_id:item_id},{$set:{    
        site: req.body.site,
        destination: req.body.destination,
        km: req.body.km
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
    console.log('Site Destinationkm Delete', req.params.id);
    
    Sitedestinationkms.deleteOne({"_id": req.params.id}).then(function(deleteResult) {   
        
        res.send(deleteResult);

    }).catch(function(err) {
        res.send(err);
    });
});



module.exports = router;
