var express = require('express');
var router = express.Router();
var TrafficAgents = require('../../models/ta');
var Accounts = require('../../models/accounts');
var Stateindias = require('../../models/stateindia')
var AccountsLedgers = require('../../models/accountsledger');
var AccountsItemLedgers = require('../../models/accountsitemledger');
var TruckLedgers = require('../../models/inventory/truckledger');
var ItemLedgers = require('../../models/inventory/itemledger');
var OrderLedgers = require('../../models/inventory/orderledger');
var ScrapLedgers = require('../../models/inventory/scrapledger');
var Tyrepositionmaster = require('../../models/tyre-management/tyrepositionmaster');
var Items = require('../../models/inventory/items-master');
var Single = require('../../models/single');
var Billty = require('../../models/billties');
var Trucks = require('../../models/trucks');
var PlantsTruckPosition = require('../../models/plantstruckposition');
var TruckTyreMaster = require('../../models/tyre-management/tyre-master');
var Caddress = require('../../models/caddress');
var moment = require('moment');
var momentTZ = require('moment-timezone');
var checkLogin = require('../middlewares/checkLogin');
var TruckMaintenance = require('../../models/truck_maintenance');
var TyreMaintenance = require('../../models/tyre_maintenance');
var VendorMaster = require('../../models/vendor_master');
var Tyrepositionmasters = require('../../models/tyre-management/tyrepositionmaster');
var Companynames = require('../../models/companyname');
var Issuedbies = require('../../models/inventory/issuedbie');
var Brands = require('../../models/brand');
var Materialrs = require('../../models/inventory/material-receipt')
var Materialrs = require('../../models/inventory/material-receipt')
var Itemmasters = require('../../models/inventory/items-master');
var TruckTyreMasters = require('../../models/tyre-management/tyre-master');
var Tyrecms = require('../../models/tyre-management/tyre-company-master');
var Jobworkmaster = require('../../models/maintenance/job-workmaster');
var Petrols = require('../../models/admin-privileges/site-petrolpump');
var RateList = require('../../models/rates');
var Siteprofiles = require('../../models/admin-privileges/site-profile');
var Driver = require('../../models/driver');
var Tyre = require('../../models/tires');
var Accountcategory = require('../../models/admin-privileges/accounts-category');

router.get('/truckpositionparking/:site', function(req, res) {

    // console.log('site ', req.params.site);

    // Siteprofiles.findOne({ site: req.params.site }, (err, item) => {
    //   if (err) { return console.error(err); }
    //   res.send({destination:item.destination});
    // });

    Siteprofiles.findOne({ site: req.params.site }).then( function(result) {
        res.send({destination:result.destination});
    }).catch (function(err) {
        res.send(err);
    });
});

router.get('/ToDestinationsFromPlantRateList/:site', function(req, res) {
    // RateList.findOne({ site: req.params.site }, (err, item) => {
    //   if (err) { return console.error(err); }
    //   res.send({info:item.multidest});
    // });

    RateList.findOne({ site: req.params.site }).then( function(result) {
        res.send({info:result.multidest});
    }).catch (function(err) {
        res.send(err);
    });


});

router.get('/Sitepetrolpump/:site', function(req, res) {
    Petrols.findOne({ site: req.params.site }, (err, item) => {
      if (err) { return console.error(err); }
      res.send({info:item.multidest});
    });
});

router.get('/petrolpump/:site', function(req, res) {
    Petrols.findOne({ site: req.params.site }, (err, item) => {
      if (err) { return console.error(err); }
      res.send({info:item.multidest});
    });
});

router.get("/tyrenolist", function(req, res, next) {
    // "vtype" : "Company"
    TruckTyreMasters.distinct("tyre_no").then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});


router.get('/mrvendorlist', function(req, res, next) {

    Materialrs.distinct("vendor").then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});

router.get('/mritemlist', function(req, res, next) {

    Itemmasters.sort({name:1}).then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        res.send(err);
    });
});

router.get('/deptlist', function(req, res, next) {

    // Departments.find().sort({deptname:1}).then( function(result) {
    //     res.send({"result": result});
    // }).catch (function(err) {
    //     //console.log("err   >>>>",err);
    //     res.send(err);
    // });
    Single.find({field: "Department"}).sort({name:1}).then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });


});

router.get('/companylist', function(req, res, next) {
    Tyrecms.find().sort({coname:1}).then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});


router.post('/generate_brand_name', function(req, res, next) {
    
    matchCondition = {};
    if (req.body.company_name) {
        matchCondition.coname = {
            $eq: req.body.company_name
        };
    }

    Tyrecms.find(matchCondition).then(function(result) {
        var mainArray = [];
        result.tcm_items.forEach(r => {
            var obj = {
                "brand": r.brand
            };
            
            mainArray.push(obj);
        });
        
        res.send({ "result": mainArray });  
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/brandlist', function(req, res, next) {

    Brands.find().sort({name:1}).then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});


// router.post('/generate_brand_name', function(req, res, next) {
//     var listArray = [];
//     let coname = req.body.company_name
    
//     console.log('Company Name ', req.body.company_name);

// 	Tyrecms.find({coname: coname}).select('-tcm_items').then(function(result) {
        
//         console.log('TyreCms Result ', result);

//         result.forEach(r => {
//             obj = {
//                 "brand": r.brand,
//             }          
//             listArray.push(obj);
//         });
        
//         res.send({ "result": listArray });  
        
//         console.log('listArray ', listArray);
        
//         // res.send(listArray);
//     }).catch(function(err) {
//         res.send(err);
//     });
// });


router.get('/truckledgertrucknolist', function(req, res, next) {

    TruckLedgers.distinct("truckno").then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});


router.get('/truckledgeritemslist', function(req, res, next) {

    TruckLedgers.distinct("itemaccname").then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});

router.get('/orderledgeritemslist', function(req, res, next) {

    OrderLedgers.distinct("itemname").then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});


router.get('/scrapledgeritemslist', function(req, res, next) {

    ScrapLedgers.distinct("itemname").then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});

router.get('/accountsledgerslist', function(req, res, next) {

    AccountsLedgers.distinct("accountname").then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});

router.get('/accountsItemsledgerslist', function(req, res, next) {

    AccountsItemLedgers.distinct("accountname").then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});

router.get('/statelists', function(req, res, next) {
    Stateindias.find().sort({statename:1}).then( function(result) {
        // console.log("stateindia   >>>>",result);
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});

router.get('/issuedbylist', function(req, res, next) {

    Issuedbies.find({}).then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});

router.get("/tyrepositions", function(req, res, next) {
    Tyrepositionmasters.find()
    .sort({ positionname: 1 })
    .then(function(result) {
    res.send(result);
    })
    .catch(function(err) {
    res.send(err);
    });
});

router.get('/sites', checkLogin(), function(req, res, next) {
    var matchCondition = {};
    
    //  console.log("req   >>>>>>>", req.user);

    if (req.user.role == 'ADMIN') {
        // console.log("ADMIN  >>>>>>>");
        matchCondition = { field: 'Site' };
    } else {
        matchCondition = { field: 'Site', name: req.user.site };
    }
    // console.log("ADMIN  >>>>>>>", matchCondition );
    Single.aggregate([
        {
            $match : matchCondition
        },{ 
            "$project": {
                "name": "$name" 
        }},
        { "$sort": { "name": 1 } }

    ]).then(function(result) {
        var name = [];
        result.forEach(element => {
            name.push({'branch_name': element.name});
        });

        res.send(name);
    }).catch(function (err) {
        console.log(err);
        res.status(500).send(err);
    });
});
router.get('/allsites', function(req, res, next) {
    var matchCondition = {};

    matchCondition = { field: 'Site' };

    Single.aggregate([
        {
            $match : matchCondition
        },{ 
            "$project": {
                "name": "$name" 
        }},
        { "$sort": { "name": 1 } }

    ]).then(function(result) {
        var name = [];
        result.forEach(element => {
            name.push({'branch_name': element.name});
        });

        res.send(name);
    }).catch(function (err) {
        console.log(err);
        res.status(500).send(err);
    });
});

router.get('/search_sites', function(req, res, next) {
    var regex = req.query.q;
    Single.find({field: 'Site', "name": new RegExp('' + regex, 'i')}).select('name').collation({ locale: "en" }).sort({name: 'asc'}).then(function(result) {
        res.send(result);
    }).catch(function(err) {
        res.send(err);
    });
});



router.get('/parties', function(req, res, next) {
    Accounts.find({accounttype: "Consignor"}).select('_id accountname category').collation({ locale: "en" }).sort({accountname: 'asc'}).then(function(result) {
        res.send(result);
        // console.log('>>>>Party_options', result);
        // res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/search_parties', function(req, res, next) {
    var regex = req.query.q;
    Accounts.find({accounttype: "Consignor", "accountname": new RegExp('' + regex, 'i')}).select('accountname').collation({ locale: "en" }).sort({accountname: 'asc'}).then(function(result) {
        res.send(result);
    }).catch(function(err) {
        res.send(err);
    });
});


router.get('/traffic_agents', function(req, res, next) {
    TrafficAgents.aggregate([
        { "$project": {
           "name": 1
        }},
        { "$sort": { "name": 1 } }
        // {$project: {
        //     "name": {$toUpper: "$name"}
        // }}
    ]).then(function(result) {
        var name = [];
        var splitedString;
        var value = [];
        result.forEach(element => {
            value.push({name: element.name});
        });

        // name.forEach(element => {
        //     splitedString = element.split(" ");
        //     var newArray = [];

        //     for (let i = 0; i < splitedString.length; i++) {
        //         newArray.push(splitedString[i].charAt(0).toUpperCase() + splitedString[i].slice(1))
        //     }

        // });

        res.send(value);
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/accounts', function(req, res, next) {
    AccountsLedgers.aggregate([{
        $group: {
            _id: "$accountname"
        }
    }, {
        $project: {
            _id: 0,
            accountname: "$_id"
        }
    }]).then(function(result) {
        res.send(result);
    }).catch(function (err) {
        res.status(500).send(err);
    });
});

router.get('/items', function(req, res, next) {
    ItemLedger.aggregate([{
        $group: {
            _id: "$itemname"
        }
    }, {
        $project: {
            _id: 0,
            itemname: "$_id"
        }
    }]).then(function(result) {
        res.send(result);
    }).catch(function (err) {
        res.status(500).send(err);
    });
});

router.get('/from_destinations', (req, res) => {
    var regex = req.query.q;
    Single.find({field: "Destination", "name": new RegExp('^' + regex, 'i')})
        .collation({ locale: "en" })
        .sort({name: 'asc'})
        .limit(50)
        .then((fromResults) => {
            res.send(fromResults);
        }).catch(err => {
            console.log(err);
            res.status(500).send({error: JSON.stringify(err)});
        });
});



router.get('/to_destinations', (req, res) => {
    var regex = req.query.q;
    Single.find({field: "Destination", "name": new RegExp('^' + regex, 'i')})
        .collation({ locale: "en" })
        .sort({name: 'asc'})
        .limit(50)
        .then((fromResults) => {
            res.send(fromResults);
        }).catch(err => {
            console.log(err);
            res.status(500).send({error: JSON.stringify(err)});
        });
});


router.get('/trucks', (req, res) => {
    
    var regex = req.query.q;
    Trucks.find({"truckno": new RegExp('' + regex, 'i')}).select('truckno')
        .collation({ locale: "en" })
        .sort({truckno: 'asc'})
        .limit(50)
        .then((fromResults) => {
            res.send(fromResults);
        }).catch(err => {
            console.log(err);
            res.status(500).send({error: JSON.stringify(err)});
    });
});

// router.get('/trucks', (req, res) => {
    
//     var regex = req.query.q;
//     Trucks.find({"truckno": new RegExp('' + regex, 'i')}).select('truckno')
//         .collation({ locale: "en" })
//         .sort({truckno: 'asc'})
//         .limit(50)
//         .then((fromResults) => {
//             res.send(fromResults);
//         }).catch(err => {
//             console.log(err);
//             res.status(500).send({error: JSON.stringify(err)});
//     });
// });

router.get('/itemslist', function(req, res, next) {

    ItemLedgers.distinct("itemname").then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});

router.get("/companytrucklist", function(req, res, next) {
    // "vtype" : "Company"
    Trucks.find({"vtype" : "Company"})
    .sort({ truckno: 1 })
    .then(function(result) {
        res.send({"result": result});
    })
    .catch(function(err) {
    res.send(err);
    });
});

router.get("/jobworknamelist", function(req, res, next) {
    Jobworkmaster.find({})
    .sort({ jobworkname: 1 })
    .then(function(result) {
        res.send({"result": result});
    })
    .catch(function(err) {
    res.send(err);
    });
});

router.get("/tyrepositionlist", function(req, res, next) {
    Tyrepositionmaster.find({})
    .sort({ positionname: 1 })
    .then(function(result) {
        res.send({"result": result});
    })
    .catch(function(err) {
    res.send(err);
    });
});


// router.get('/companytruckslist', (req, res) => {
//     Trucks.find({"vtype" : "Company"}).select('truckno')
//         .collation({ locale: "en" })
//         .sort({truckno: 'asc'})
//         .then((fromResults) => {
//             res.send(fromResults);
//         }).catch(err => {
//             console.log(err);
//             res.status(500).send({error: JSON.stringify(err)});
//     });
// });

router.get('/company_trucks', (req, res) => {
    var regex = req.query.q;
    Trucks.find({"truckno": new RegExp('' + regex, 'i'), "vtype" : "Company"}).select('truckno')
        .collation({ locale: "en" })
        .sort({truckno: 'asc'})
        .limit(50)
        .then((fromResults) => {
            res.send(fromResults);
        }).catch(err => {
            console.log(err);
            res.status(500).send({error: JSON.stringify(err)});
    });
});

// router.get('/company_trucks', (req, res) => {
//     var regex = req.query.q;
//     Trucks.find({"truckno": new RegExp('' + regex, 'i')}).select('truckno')
//         .collation({ locale: "en" })
//         .sort({truckno: 'asc'})
//         .limit(50)
//         .then((fromResults) => {
//             res.send(fromResults);
//         }).catch(err => {
//             console.log(err);
//             res.status(500).send({error: JSON.stringify(err)});
//     });
// });






router.get('/lr_numbers', function(req, res, next) {

    var end = momentTZ(req.query.end_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD');
    var endDate = new Date(end)
    endDate.setUTCHours(23,59,59,999);

    var matchCondition= {
        lrdate: {
            $gt: new Date(req.query.start_date),
            $lte: endDate

        },
        site: req.query.site_name
    };


    // original 
    // var matchCondition= {
    //     lrdate: {
    //         $gt: new Date(req.query.start_date),
    //         $lt: new Date(req.query.end_date)
    //     },
    //     site: req.query.site_name
    // };


    console.log('matchCondition >>>>>>>', matchCondition);


    if (!req.query.start_date) {
        res.send({ "message": "Please Select Start Date....!"} );
    } 
    
    // original
    // if ( req.query.start_date == req.query.end_date ) {
    //     // res.send({ "message": "Same Date....!"} );
    //     var startDate = moment(req.query.start_date).format("YYYY-MM-DD");
    //     console.log("start_date >>>", startDate);
    //     matchCondition= {
    //         lrdate: startDate,
    //         site: req.query.site_name
    //     };
    // } 
        
    
    
    Billty.find(matchCondition).sort({'lrno': 1}).then(function(result) {
        var mainArray = [];
        result.forEach( r => {
            lrNo = r.lrno;
            // console.log("site  >>>", r.site);
            mainArray.push({"lrno": lrNo});
        });
        res.send({ "result": mainArray});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/vendor_name', (req, res) => {
    var regex = req.query.q;
    VendorMaster.find({"name": new RegExp('' + regex, 'i')}).select('name')
        .collation({ locale: "en" })
        .sort({name: 'asc'})
        .limit(50)
        .then((fromResults) => {
            res.send(fromResults);
        }).catch(err => {
            console.log(err);
            res.status(500).send({error: JSON.stringify(err)});
    });
});

router.get('/tyre_no', (req, res) => {
    var regex = req.query.q;
    TruckTyreMaster.find({"tyre_no": new RegExp('' + regex, 'i')}).select('tyre_no')
        .collation({ locale: "en" })
        .sort({tyre_no: 'asc'})
        .limit(50)
        .then((fromResults) => {
            res.send(fromResults);
        }).catch(err => {
            console.log(err);
            res.status(500).send({error: JSON.stringify(err)});
    });
});

router.get('/demo', (req, res) => {
    
    // PlantsTruckPosition.find({"site": "NCW PLANT"}).then((fromResults) => {
    //     var totalCC = 0;
    //     var totalTruck = 0;
    //     var placed = 0;
    //     var dispatch = 0;
    //     fromResults.forEach(p => {
    //         if ( p.placedtime == null && p.billtytime == null ) {
    //             totalTruck = totalTruck + 1;
    //             totalCC = totalCC + p.cc;
    //             // console.log("placedtime >>>", p.placedtime);
    //             // console.log("billtytime >>>", p.billtytime);
    //         } else if ( p.placedtime != null && p.billtytime == null ) {
    //             placed = placed + 1;
    //         } else {
    //             dispatch = dispatch + 1 
    //             // console.log("placedtime >>>", p.placedtime);
    //             // console.log("billtytime >>>", p.billtytime);
    //         }
    //     });
    //         res.send({ "trucks_at_site": totalTruck, "CC": totalCC, "placed": placed, "dispatch": dispatch });
    //     }).catch(err => {
    //         console.log(err);
    //         res.status(500).send({error: JSON.stringify(err)});
    //     });

    try {

        TyreMaintenance.updateMany({}, {$set: {"accept": "No"}}, {
            upsert:false,
            multi:true
        }).then(function (result) {
            res.send("Updated...!");
        }).catch(function(err) {
            console.log("err >>>>>", err);
            res.send(err);
        });
     } catch (e) {
        console.log("err >>>>>", e);
     }

});

router.get('/trafficagentlist', function(req, res, next) {
    TrafficAgents.find({}).select('_id name').collation({ locale: "en" }).sort({name: 'asc'}).then(function(result) {
        res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/driverlist', function(req, res, next) {
    Driver.find({}).select('_id name').collation({ locale: "en" }).sort({name: 'asc'}).then(function(result) {
        res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/tyrelist', function(req, res, next) {
    Tyre.find({}).select('_id name').collation({ locale: "en" }).sort({name: 'asc'}).then(function(result) {
        res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });
});

// billty dataentry
router.get('/consignor', function(req, res, next) {
    Accounts.find({accounttype: "Consignor"}).select('_id accountname category').collation({ locale: "en" }).sort({accountname: 'asc'}).then(function(result) {
        // console.log('>>>>ConsignorNames', result);
        res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/receiptmodenames', function(req, res, next) {
    Accounts.find({accounttype: "Cash - Bank"}).select('_id accountname').collation({ locale: "en" }).sort({accountname: 'asc'}).then(function(result) {
        // console.log('>>>>ReceiptModeNames', result);
        res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/diesalaccountnames', function(req, res, next) {
    Accounts.find({accounttype:["Cash - Bank","Pump Owner"]}).select('_id accountname').collation({ locale: "en" }).sort({accountname: 'asc'}).then(function(result) {
        // console.log('>>>>Petrol Pump Names', result);
        res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/roadexpaccountnames', function(req, res, next) {
    Accounts.find({accounttype:["Cash - Bank","Sundry Expences"]}).select('_id accountname').collation({ locale: "en" }).sort({accountname: 'asc'}).then(function(result) {
        // console.log('>>>>ConsignorNames', result);
        res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/consignee', function(req, res, next) {
    Caddress.find({}).select('_id name').collation({ locale: "en" }).sort({name: 'asc'}).then(function(result) {
        // console.log('>>>>Billty ConsigneeNames', result);
        res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/site/:name', function(req, res) {
    Sitepetrolpumps.findOne({ site: req.params.name }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});

router.get('/dfrom', function(req, res, next) {
    // Single.find({field: "Destination"}).select('_id name category').collation({ locale: "en" }).sort({name: 'asc'}).then(function(result) {
    //     // console.log('>>>>Destination From', result);
    //     res.send({"result": result});
    // }).catch(function(err) {
    //     res.send(err);
    // });
    Single.find({field: "Destination"}).sort({name:1}).then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });

});

router.get('/accountscategory', function(req, res, next) {
    Single.find({field: "AC"}).select('_id name').collation({ locale: "en" }).sort({name: 'asc'}).then(function(result) {
        res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/accountsgroups', function(req, res, next) {
    Single.find({field: "AG"}).select('_id name ').collation({ locale: "en" }).sort({name: 'asc'}).then(function(result) {
        res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/accounttype', function(req, res, next) {
    Single.find({field: "CType"}).select('_id name ').collation({ locale: "en" }).sort({name: 'asc'}).then(function(result) {
        res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/underledger', function(req, res, next) {
    Accounts.find({}).select('_id accountname').collation({ locale: "en" }).sort({accountname: 'asc'}).then(function(result) {
        res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/city', function(req, res, next) {
    Single.find({field: "City"}).select('_id name ').collation({ locale: "en" }).sort({name: 'asc'}).then(function(result) {
        res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/state', function(req, res, next) {
    Single.find({field: "State"}).select('_id name ').collation({ locale: "en" }).sort({name: 'asc'}).then(function(result) {
        res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/country', function(req, res, next) {
    Single.find({field: "Country"}).select('_id name ').collation({ locale: "en" }).sort({name: 'asc'}).then(function(result) {
        res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });
});

// accounts category
router.get('/catnamesgroup', function(req, res, next) {
    Accountcategory.find({cattype: "Primary"}).select('_id catname').collation({ locale: "en" }).sort({catname: 'asc'}).then(function(result) {
        res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/catnames', function(req, res, next) {
    Accountcategory.find({}).select('_id catname').collation({ locale: "en" }).sort({catname: 'asc'}).then(function(result) {
        res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/godownlist', function(req, res, next) {
    Single.find({field: "Godown"}).select('_id name category').collation({ locale: "en" }).sort({name: 'asc'}).then(function(result) {
        // console.log('>>>>Godown', result);
        res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/transactiontypelist', function(req, res, next) {
    Single.find({field: "AT"}).select('_id name ').collation({ locale: "en" }).sort({name: 'asc'}).then(function(result) {
        // console.log('>>>>Godown', result);
        res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });
});


router.post('/trucklastbilltydetails', function(req, res) {
    Billty.findone(req.body).select('_id tkmr newkm').collation({ locale: "en" }).sort({lrno: 'des'}).then(function(result) {
        // console.log('>>>>Truck Last Details', result);
        res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });

    // console.log(' matchcond', req.body);

    // Billty.find(req.body).count(function (e, count) { 
    //     res.send({count: count});
    // })
});

router.get('/prefdestinationlist', function(req, res, next) {

    Single.find({field: "Destination"}).sort({name:1}).then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});

router.get('/dto', function(req, res, next) {
    // Single.find({field: "Destination"}).select('_id name category').collation({ locale: "en" }).sort({name: 'asc'}).then(function(result) {
    //     res.send({"result": result});
    // }).catch(function(err) {
    //     res.send(err);
    // });

    Single.find({field: "Destination"}).sort({name:1}).then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });

});

router.get('/units', function(req, res, next) {
    Single.find({field: "Unit"}).select('_id name category').collation({ locale: "en" }).sort({name: 'asc'}).then(function(result) {
        // console.log('>>>>Units ', result);
        res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/contains', function(req, res, next) {
    Single.find({field: "Cont"}).select('_id name category').collation({ locale: "en" }).sort({name: 'asc'}).then(function(result) {
        // console.log('>>>>Contains ', result);
        res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/receipttypenames', function(req, res, next) {
    Single.find({field: "Pyttype"}).select('_id name').collation({ locale: "en" }).sort({name: 'asc'}).then(function(result) {
        // console.log('>>>>Contains ', result);
        res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });
});

// billty dataentry
router.get('/consignor', function(req, res, next) {
    Accounts.find({accounttype: "Consignor"}).select('_id accountname category').collation({ locale: "en" }).sort({accountname: 'asc'}).then(function(result) {
        // console.log('>>>>ConsignorNames', result);
        res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/consignee', function(req, res, next) {
    Caddress.find({}).select('_id name').collation({ locale: "en" }).sort({name: 'asc'}).then(function(result) {
        // console.log('>>>>ConsigneeNames', result);
        res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });
});

// router.get('/consignee', function(req, res, next) {
//     Caddress.find({}).collation({ locale: "en" }).sort({name: 'asc'}).then(function(result) {
//         console.log('>>>>ConsigneeNames', siteInfo['result']);
//         res.send({"result": result});
//     }).catch(function(err) {
//         res.send(err);
//     });
// });

router.get('/trucks/:no', (req, res) => {
    
    Trucks.findOne({"truckno": req.params.no},(err,fromResults) => {
        if(err){
            console.log(err);
            res.status(500).send({error: JSON.stringify(err)});
        }
        res.send(fromResults);
            
    });
});

module.exports = router;