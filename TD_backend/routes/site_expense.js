var express = require('express');
var router = express.Router();
var async = require('async');
var SitExpence = require('../models/sitexpences');

router.get('/site_expense_list', function(req, res, next) {
    var listArray = [];
    var page, limit, offset;
    page = req.query.page ? req.query.page : 1;
    limit = req.query.limit ? req.query.limit: 50;
    offset = (page - 1) * limit;
	SitExpence.find({}).select('-multidest').skip(offset).limit(limit).then(function(result) {
        var count = 0;

        result.forEach(r => {
            obj = {
                "site": r.site,
                "status": r.status,
            }          
            listArray.push(obj);
            count = count + 1;
        });

        res.send( {"results": listArray,"total" : count} );
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/site_expense_detail', function(req, res, next) {
    
    var listArray = [];
    var page, limit, offset;
    
    page = req.query.page ? req.query.page : 1;
    limit = req.query.limit ? req.query.limit: 500;
    offset = (page - 1) * limit;
    console.log("offset  >>>", offset);
	SitExpence.find({ "site": req.query.site_name }).select({ 'multidest': { '$slice': [offset, limit] }}).then(function(result) {
        var count = 0;
        result.forEach(r => {
            console.log(r);
            multidest = r.multidest;
            var destination, spi, multidestId, km, newtoll, newbhatta, loading, newmisc, newtotal;
            multidest.forEach(i => {
                destination = i.destination;
                spi = i.spi;
                km = i.km;
                newtoll = i.newtoll;
                newbhatta = i.newbhatta;
                loading = i.loading;
                newmisc = i.newmisc;
                newtotal = i.newtotal;

                multidestId = i._id;

                obj = {
                    "id": r._id,
                    "site": r.site,
                    "status": r.status,
                    "destination": destination,
                    "spi": spi,
                    "km": km,
                    "multidest_id": multidestId,
                    "newtoll": newtoll,
                    "newbhatta": newbhatta,
                    "loading": loading,
                    "newmisc": newmisc,
                    "newtotal": newtotal,
                }
                count = count + 1; 
                listArray.push(obj);
            });            
        });
        
        res.send({"results": listArray,"total" : count});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/site_expense_multidest_detail', function(req, res, next) {
    var matchCondition;
    var listArrayDestinations = [];
    var listArraySites = [];
    var listArray = [];
    var page, limit, offset;
    page = req.query.page ? req.query.page : 1;
    limit = req.query.limit ? req.query.limit: 500;
    offset = (page - 1) * limit;

    function paginate (array, page_size, page_number) {
        --page_number; // because pages logically start with 1, but technically with 0
        return array.slice(page_number * page_size, (page_number + 1) * page_size);
    }

    var matchCondition;

    if (req.query.site_name) {
        var siteName = req.query.site_name ;
        matchCondition = { "site": new RegExp('^' + siteName, 'i') };
    }
    if (req.query.destination_name) {
        var destinationName = req.query.destination_name ;
        destinationName = destinationName.replace('(', '\\(');
        destinationName = destinationName.replace(')', '\\)');
        matchCondition = { 'multidest.destination': new RegExp('^' + destinationName, 'i') };
    }

    // SitExpence.aggregate([
    //     {
    //         "$match": matchCondition
    //     } , {
    //         "$sort": {
    //             "multidest.destination": -1
    //         }
    //     } , {
    //         "$group" : {
    //             _id:"$multidest.destination",
    //             count:{$sum: 1}
    //         }
    //     }
    // ]).then(function(result) {
    //     res.send(result);

	SitExpence.find(matchCondition).then(function(result) {
        
        var countDestination = 0;
        var countSite = 0;
        var count = 0;

        result.forEach(r => {
            // console.log(r);
            multidest = r.multidest;
            
            multidest.forEach(i => {
                if(i.destination == req.query.destination_name) {
                    // var totali = Number(i.loading) + Number(i.newbhatta) + Number(i.newmisc) + Number(i.newtotal);
                    obj = {
                        "id": r._id,
                        "site": r.site,
                        "status": r.status,
                        "destination": i.destination,
                        "spi": i.spi,
                        "km": i.km,
                        "multidest_id": i._id,
                        "newtoll": i.newtoll,
                        "newbhatta": i.newbhatta,
                        "loading": i.loading,
                        "newmisc": i.newmisc,
                        "newtotal": i.newtotal,
                    }
                    listArrayDestinations.push(obj);
                } else {
                    // var totale = Number(i.loading) + Number(i.newbhatta) + Number(i.newmisc) + Number(i.newtotal);
                    obj = {
                        "id": r._id,
                        "site": r.site,
                        "status": r.status,
                        "destination": i.destination,
                        "spi": i.spi,
                        "km": i.km,
                        "multidest_id": i._id,
                        "newtoll": i.newtoll,
                        "newbhatta": i.newbhatta,
                        "loading": i.loading,
                        "newmisc": i.newmisc,
                        "newtotal": i.newtotal,
                    }
                    listArraySites.push(obj);
                }              
            });  
        });
        


        SitExpence.find(matchCondition).then(function(results) {
            results.forEach(r => {
                // console.log(r);
                multidest = r.multidest;
                multidest.forEach(i => {
                    console.log(i);
                    if(i.destination == req.query.destination_name) {
                        countDestination = countDestination + 1;
                    }else {
                        countSite = multidest.length;
                    }
                });
            });

            // var sendRes;
            // if(req.query.destination_name) {
            //     sendRes = {"results": listArrayDestinations,"total" : countDestination};
            // } else {
            //     sendRes = {"results": listArraySites,"total" : countSite};
            // }

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
        res.send(err);
    });
});

router.put('/site_expense_update', function(req, res, next) {
    var matchCondition = {};
    if (req.body.status) {
        matchCondition.status = req.body.status ;
    }

    if (req.body.destination) {
        matchCondition['multidest.$.destination'] = req.body.destination;
    }

    if (req.body.spi) {
        matchCondition['multidest.$.spi'] =  req.body.spi;
    }

    if (req.body.km) {
        matchCondition['multidest.$.km'] = req.body.km;
    }

    if (req.body.newtoll) {
        matchCondition['multidest.$.newtoll'] =  req.body.newtoll;
    }

    if (req.body.newbhatta) {
        matchCondition['multidest.$.newbhatta'] = req.body.newbhatta;
    }

    if (req.body.loading) {
        matchCondition['multidest.$.loading'] =  req.body.loading;
    }

    if (req.body.newmisc) {
        matchCondition['multidest.$.newmisc'] = req.body.newmisc;
    }

    if (req.body.newtotal) {
        matchCondition['multidest.$.newtotal'] =  req.body.newtotal;
    }

    console.log(matchCondition);
	
    SitExpence.update(
        { "_id": req.body.id, "multidest._id": req.body.multidest_id },
        { "$set": matchCondition}
    ).then(function(result) {
        res.send({ "message": "Update..!"});
    }).catch(function(err) {
        console.log(err);
        res.send(err);
    });
});

router.post('/site_expense_multidest_add', function(req, res, next) {
    
    SitExpence.find({"site": req.body.site}).then(function(result) {
            // console.log(result);
            if(result[0]) {
                // console.log("If >>>>>>", result[0]._id);
                SitExpence.update({ 
                    "_id": result[0]._id
                    },{ 
                    "$push": 
                        { 
                            "multidest": req.body.multidest
                        }
                    }).then(function(err, result) {
                        // console.log("err  >>>>", err);
                        // console.log("result  >>>>", result);
                        res.send({ "message": "Added Multidest"});
                    }).catch(function(err) {
                        console.log("err  >>>>", err);
                        res.send(err);
                });
            } else {

                // console.log("else >>>>>>");
                var d = new SitExpence(req.body);
                d.save(function () {
                   res.send({ "message": "Added Multidest"}); 
                });
            }
            
        }).catch(function(err) {
            res.send(err);
    });
	
});



module.exports = router;