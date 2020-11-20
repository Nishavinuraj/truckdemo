var express = require('express');
var router = express.Router();
var async = require('async');
var moment = require('moment');
var Single = require('../models/single');
var RateList = require('../models/rates');
var SiteDestinationkm = require('../models/sitedestinationkm');


router.get('/async_plant_rate_list', function(req, res, next) {
    
    function onlyUnique(value, index, self) { 
        return self.indexOf(value) === index;
    }

    var siteDestinationKmAdd= function(objData) {
        return function (callback) {
           
            SiteDestinationkm.findOne(objData).then(function(result) {
                //console.log("SiteDestinationkm");
                if(!result) {
                    var addNewSite = new SiteDestinationkm(objData);
                    addNewSite.save(function (err, save) {
                        callback(null, '');
                    });
                    console.log("save");
                } else {
                    callback(null, '');
                    console.log("not save");
                }
            }).catch(function(err) {
                callback(err, null);
            });
        };
    };

    var singlesAdd = function(objData) {
        return function (callback) {
           
            Single.findOne({field: "DTo", name: objData.destination}).then(function(result) {
                //console.log("singlesAdd");
                if(!result) {
                    var single = new Single({
                        name: objData.destination,
                        field: "DTo"
                    });
                    single.save(function (err, save) {
                        callback(null, '');
                    });
                    console.log("save");
                } else {
                    callback(null, '');
                    console.log("not save");
                }
            }).catch(function(err) {
                // console.log("Error");
                callback(err, null);
            });
        };
    };

    
    RateList.find().limit(2).then(function(result) {
        var mainListArray = [];
        var siteDestRequestArray = []; // site and description array which will be used in async to insert data
        var singlesRequestArray = []; // used in async to insert data in singles table
        
        var destinationArray = [];  // all destinations array site wise
        var uniqueDestinationArray = [];

        // all rates list
        result.forEach(r =>{
            var count = 0;
            // console.log("Main");
            r.multidest.forEach(rr =>{
                destinationArray.push(rr.destination);
            });
            // destinationArray.push(r.multidest[0].destination);

            uniqueDestinationArray = destinationArray.filter(onlyUnique);
            
            uniqueDestinationArray.forEach(j => {
                var obj = {
                    site: r.site,
                    destination: j,
                };

                // console.log(obj);
                mainListArray.push(obj);
            });
        });

        // prepare request arrays for both functions 
        mainListArray.forEach(l => {
            siteDestRequestArray.push(siteDestinationKmAdd(l));
            singlesRequestArray.push(singlesAdd(l));
        });

        // console.log(uniqueDestinationArray);
        async.parallel(siteDestRequestArray, function(err, asyncResult) {
            
            async.parallel(singlesRequestArray, function (err, result) {
                
                res.send("ok");
            });
        });
    }).catch(function(err) {
        console.log(err);
        res.send(err);
    });
});

router.get('/plant_rate_list', function(req, res, next) {
    var listArray = [];
    var page, limit, offset;
    page = req.query.page ? req.query.page : 1;
    limit = req.query.limit ? req.query.limit: 50;
    offset = (page - 1) * limit;
	RateList.find({}).select('-multidest').sort({site: 1}).skip(offset).limit(500).then(function(result) {
        var count = 0;
        result.forEach(r => {
            obj = {
                "id": r._id,
                "name": r.name,
                "site": r.site,
                "status": r.status,
                "rateby": r.rateby,
                "diesel": r.diesel,
            }          
            listArray.push(obj);
            count = count + 1;
        });

        res.send({"results": listArray, "total": count});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/plant_rate_detail', function(req, res, next) {
  
    var listArrayDestinations = [];
    var listArraySites = [];
    var page, limit, offset;
    var totalCount = 0;
    page = req.query.page ? req.query.page : 1;
    limit = req.query.limit ? req.query.limit: 500;
    offset = (page - 1) * limit;

    
    function paginate (array, page_size, page_number) {
        --page_number; // because pages logically start with 1, but technically with 0
        return array.slice(page_number * page_size, (page_number + 1) * page_size);
      }

    var matchCondition = {};

    if (req.query.site_name) {
        var siteName = req.query.site_name ;
        siteName = siteName.replace('(', '\\(');
        siteName = siteName.replace(')', '\\)');

        matchCondition.site = new RegExp('^' + siteName, 'i');
        // matchCondition = { "site": new RegExp('^' + siteName, 'i') };
    }

    if (req.query.destination_name) {
        var destinationName = req.query.destination_name ;
        destinationName = destinationName.replace('(', '\\(');
        destinationName = destinationName.replace(')', '\\)');
        matchCondition['multidest.destination'] =  new RegExp('^' + destinationName, 'i');
    }


    console.log("matchCondition  >>>>>>", matchCondition);
    
    // .select({ 'multidest': { '$slice': [offset, 500] }})
	RateList.find(matchCondition).then(function(result) {
        var countDestination = 0;
        var countSite = 0;
        console.log("Length  >>>", result.length);
        result.forEach(r => {
            multidest = r.multidest;
            console.log("multidest  >>>", r.name);
            multidest.forEach(i => {

                if(i.destination && i.destination.toUpperCase() == req.query.destination_name.toUpperCase()) {
                    obj = {
                        "id": r._id,
                        "name": r.name,
                        "site": r.site,
                        "status": r.status,
                        "rateby": r.rateby,
                        "diesel": r.diesel,
                        "multidest_id": i._id,
                        "destination": i.destination,
                        "spi": i.spi,
                        "km": i.km,
                        "freight": i.freight,
                        "startdate": i.startdate,
                        "enddate": i.enddate
                    }       
                    listArrayDestinations.push(obj);

                } else {

                    obj = {
                        "id": r._id,
                        "name": r.name,
                        "site": r.site,
                        "status": r.status,
                        "rateby": r.rateby,
                        "diesel": r.diesel,
                        "multidest_id": i._id,
                        "destination": i.destination,
                        "spi": i.spi,
                        "km": i.km,
                        "freight": i.freight,
                        "startdate": i.startdate,
                        "enddate": i.enddate
                    }           
                    listArraySites.push(obj);

                }              
            });
        });
        // res.send(listArrayDestinations);

        RateList.find(matchCondition).then(function(results) {
            results.forEach(r => {
                // console.log(r);
                multidest = r.multidest;
                var a = 0;
                multidest.forEach(i => {
                    // console.log(i);
                    if(i.destination && i.destination.toUpperCase() == req.query.destination_name.toUpperCase()) {
                        countDestination = countDestination + 1;
                        // console.log("r  >>>",  r);
                        console.log("i  >>>",  i);
                        console.log("--------------------", a ,"--------------");
                        a = a + 1;
                    }else {
                        countSite = multidest.length;
                        a = a + 1;
                    }
                });
            });

            var sendRes;
            if(req.query.destination_name) {
                sendRes = {"results": paginate(listArrayDestinations, limit, page),"total" : countDestination};
            } else {
                sendRes = {"results": paginate(listArraySites, limit, page),"total" : countSite};
            }

            res.send(sendRes);
        }).catch(function(err) {
            console.log(err);
            res.send(err);
        });      
    }).catch(function(err) {
        console.log(err);
        res.send(err);
    });
});

router.put('/plant_rate_update', function(req, res, next) {
    var matchCondition = {};
    
    if (req.body.destination) {
        
        matchCondition['multidest.$.destination'] = req.body.destination;
        console.log(matchCondition);
    }
    if (req.body.spi) {
        matchCondition['multidest.$.spi'] = req.body.spi;
    }
    if (req.body.km) {
        matchCondition['multidest.$.km'] =  req.body.km;
    }
    if (req.body.freight) {
        matchCondition['multidest.$.freight'] =  req.body.freight;
    }
    if (req.body.startdate) {
        matchCondition['multidest.$.startdate'] = req.body.startdate;
    }
    if (req.body.enddate) {
        matchCondition['multidest.$.enddate'] =  req.body.enddate;
    }
    if (req.body.rateby) {
        matchCondition['rateby'] =  req.body.rateby;
    }
	
    RateList.update(
        { "_id": req.body.id, "multidest._id": req.body.multidest_id  },
        { "$set": matchCondition}
    ).then(function(result) {
        res.send({ "message": "Update..!"});
    }).catch(function(err) {
        console.log(err);
        res.send(err);
    });
});

router.post('/plant_rate_multidest_add', function(req, res, next) {

	RateList.find({"site": req.body.site}).then(function(result) {
        // console.log(result);
        if(result[0]) {
            console.log("If >>>>>>", result[0]._id);
            RateList.update({ 
                "_id": result[0]._id
                },{
                "rateby": req.body.rateby,
                "$push": 
                    { 
                        "multidest": req.body.multidest
                    }
                }).then(function(result) {
                    res.send({ "message": "Added Multidest"});
                }).catch(function(err) {
                    res.send(err);
            });
        } else {
            console.log("else >>>>>>");

            var d = new RateList(req.body);
            d.save(function () {
               res.send({ "message": "New Added Multidest"}); 
            });
        }
    }).catch(function(err) {
        res.send(err);
});
});

module.exports = router;