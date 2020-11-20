var express = require('express');
var router = express.Router();
var async = require('async');
var RateList = require('../models/rates');
var SitExpence = require('../models/sitexpences');
var multer = require('multer');
var XLSX = require('xlsx');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})
var upload = multer({storage: storage});

router.post("/plant_rate_list", upload.single('file'), function(req, res, next){
    if (req.file) {
        console.log(req.file);
        var fileName = req.file.filename;
        console.log("req.file.filename  >>>>>", fileName);
        console.log("req.file.path  >>>>>",  req.file.path);

        var filePath = "./uploads/"+fileName; 
        console.log("req.file.path  >>>>>", filePath);
        var workbook = XLSX.readFile(filePath);
        var sheet_name_list = workbook.SheetNames;
        var fileData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
        //   console.log(fileData);
        


        
        RateList.find({"site": req.body.site}).then(function(result) {
            // console.log(result);
            if(result[0]) {
                console.log("If >>>>>>", result[0]._id);

                var multidestArrayIf = [];
                fileData.forEach( r => {
                    console.log(r['spi']);
                    console.log(r['destination']);
                    var obj = {
                        "destination": r['citycodedescription'],
                        "spi": r['spi'],
                        "km": r['km'],
                        "freight": r['freight']
                        // "startdate": r['validitystart']
                    }
                    multidestArrayIf.push(obj);
                });

                RateList.updateMany({"site": req.body.site}, { $set : {'rateby': req.body.rateby , 'multidest': [] }} , {multi:true} ).then(function(updateResult) {   
                    RateList.update({ 
                        "_id": result[0]._id
                        },{
                        "$push": 
                            { 
                                "multidest": multidestArrayIf
                            }
                        }).then(function(result) {
                            res.send({ "message": "Added Multidest"});
                        }).catch(function(err) {
                            res.send(err);
                    });
                }).catch(function(err) {
                    res.send(err);
                });
            } else {
                console.log("else >>>>>>");

                var multidestArray = [];
                fileData.forEach( r => {
                    console.log(r['spi']);
                    var obj = {
                        "destination": r['citycodedescription'],
                        "spi": r['spi'],
                        "km": r['km'],
                        "freight": r['freight']
                        // "startdate": r['validitystart']
                    }
                    multidestArray.push(obj);
                });
    
                var d = new RateList({
                    "name": req.body.name,
                    "site": req.body.site,
                    "status": req.body.status,
                    "rateby": req.body.rateby,
                    "multidest": multidestArray
                });
                d.save(function () {
                   res.send({ "message": "Added Multidest"}); 
                });
            }
        }).catch(function(err) {
            res.send(err);
    });
        
		// fs.exists(req.file.path, function(exists) {
		// 	if(exists) {
        //         res.send("Got your file!");
        //         console.log("exists  >>>>>>>>", exists);
		// 	} else {
		// 		res.send("Well, there is no magic for those who don’t believe in it!");
		// 	}
        // });

        
        // res.send("Find Files....!");
	} else {
        res.send("No files");
    }
});

router.post("/site_truck_expenses", upload.single('file'), function(req, res, next){
    if (req.file) {
        console.log(req.file);
        var fileName = req.file.filename;
        console.log("req.file.filename  >>>>>", fileName);
        console.log("req.file.path  >>>>>",  req.file.path);

        var filePath = "./uploads/"+fileName; 
        console.log("req.file.path  >>>>>", filePath);
        var workbook = XLSX.readFile(filePath);
        var sheet_name_list = workbook.SheetNames;
        var fileData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
        //   console.log(fileData);
        

        SitExpence.deleteOne({ "site": req.body.site }, function (err, d_result) {
        });

        SitExpence.find({"site": req.body.site}).then(function(result) {
            // console.log(result);
            if(result[0]) {
                console.log("If >>>>>>", result[0]._id);

                var multidestArrayIf = [];
                fileData.forEach( r => {
                    console.log(r['spi']);
                    var obj = {
                        "destination": r['citycodedescription'],
                        "spi": r['spi'],
                        "km": r['km'],
                        "freight": r['Freight'],
                        "startdate": r['validitystart']
                    }
                    multidestArrayIf.push(obj);
                });
                SitExpence.updateMany({"site": req.body.site}, { $set : {'multidest': [] }} , {multi:true} ).then(function(updateResult) {   
                    SitExpence.update({ 
                        "_id": result[0]._id
                        },{ 
                        "$push": 
                            { 
                                "multidest": multidestArrayIf
                            }
                        }).then(function(result) {
                            res.send({ "message": "Added Multidest"});
                        }).catch(function(err) {
                            res.send(err);
                    });
                }).catch(function(err) {
                    res.send(err);
                });
            } else {
                console.log("else >>>>>>");

                var multidestArray = [];
                fileData.forEach( r => {
                    console.log(r['spi']);
                    var obj = {
                        "destination": r['destination'],
                        "spi": r['spi'],
                        "km": r['km'],
                        "loading": r['loading'],
                        "unloading": r['unloading'],
                        "newtoll": r['toll'],
                        "newbhatta": r['bhatta'],
                        "newmisc": r['misc'],
                        "newtotal": r['exp'],
                    }
                    multidestArray.push(obj);
                });
    
                var d = new SitExpence({
                    "site": req.body.site,
                    "status": req.body.status,
                    "multidest": multidestArray
                });
                d.save(function () {
                   res.send({ "message": "Added Multidest"}); 
                });
            }
        }).catch(function(err) {
            res.send(err);
    });
        
		// fs.exists(req.file.path, function(exists) {
		// 	if(exists) {
        //         res.send("Got your file!");
        //         console.log("exists  >>>>>>>>", exists);
		// 	} else {
		// 		res.send("Well, there is no magic for those who don’t believe in it!");
		// 	}
        // });

        
        // res.send("Find Files....!");
	} else {
        res.send("No files");
    }
});

router.post("/test", upload.single('file'), function(req, res, next){
    var XLSX = require('xlsx');
    var workbook = XLSX.readFile('./uploads/Freights_sharing.xlsx');
    var sheet_name_list = workbook.SheetNames;
    res.send(XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]));
});




module.exports = router;