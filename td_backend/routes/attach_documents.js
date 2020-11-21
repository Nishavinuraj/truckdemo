var express = require('express');
var router = express.Router();
var DocumentMaster = require('../models/documentmaster');
var Reminders = require('../models/reminders');
var moment = require('moment');
var async = require('async');
var multer = require('multer');
var Trucks = require('../models/trucks');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})
var upload = multer({storage: storage});


router.post('/create', upload.single('file'), function(req, res, next) {

    var createTruckReminderMainEntryIfNotExist = function () {
        return function (callback) {
            Reminders.findOne({"truckno": req.body.truckno}).then(function (result) {
                if (!result) {
                    var r = new Reminders({truckno: req.body.truckno, files: []});
                    r.save(function (err, result) {
                        callback(err, result);
                    });
                } else {
                    callback(null, true);
                }
            });
        };
    }; 

    var findFilePath = function() {
        return function (callback) {
            console.log("file   >>>>", req.file);

            var fileName = req.file.filename;
            var filePath = "uploads/"+fileName;
            req.body.attachdocument = filePath;

            // console.log("req.file.filename  >>>>>", fileName);
            // console.log("req.file.path  >>>>>",  req.file.path);
            // console.log("filePath >>>>>", filePath);

            console.log("body >>>>>", req.body);
    
            callback(false, null);
               
        };
    };
    
    
    var findDocumentMaster = function() {
        return function (callback) {
            DocumentMaster.find({"name" : req.body.documentname}).then(function(result) {
                var obj = {};
                if(!result[0]) {
                    console.log(" IF >>>>");
                    var bname = req.body.documentname;
                    obj = {name: bname};
                    console.log(" obj >>>>", obj);
        
        
                    var d = new DocumentMaster(obj);
                    d.save(function (err, save) {
                        console.log("err  >>>",err);
                        console.log("save  >>>",save);
                        res.send({"message": "Added..!"}); 
                    });
                }
                callback(false, null);
            }).catch(function(err) {
                callback(false, null);
            });
            
        };
    };
 
    async.series([createTruckReminderMainEntryIfNotExist(), findFilePath(), findDocumentMaster() ], function(err, asyncResult) {
        console.log("ERROR >>> ", err);
        
        Reminders.update({truckno: req.body.truckno}, {
            $push: {
                files: {
                    "documentname": req.body.documentname,
                    "attachdocument": req.body.attachdocument,
                    "startdate": req.body.startdate,
                    "enddate": req.body.enddate,
                }
            }
        }).then(function (results) {
            res.send({"message": "Uploaded.", "link": req.body.attachdocument});
        }).catch(function (err) {
            res.status(500).send(JSON.parse(JSON.stringify(err)));
        });

    });    
});

router.get('/list_document_name', function(req, res, next) {

    var regex = req.query.q;
    DocumentMaster.find({"name": new RegExp('^' + regex, 'i')})
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

router.post('/add_document_master', function(req, res, next) {

    var d = new DocumentMaster(req.body);
    d.save(function (err, save) {
        console.log("err  >>>",err);
        console.log("save  >>>",save);
        res.send({"message": "Added..!"}); 
    });
});

router.get('/list_document_master', function(req, res, next) {

    DocumentMaster.find({}).then((results) => {
        res.send({"results": results});
    }).catch(err => {
        console.log(err);
        res.status(500).send({error: JSON.stringify(err)});
    });
});

router.delete('/delete_document_master', function(req, res, next) {
    DocumentMaster.deleteOne({ "_id": req.query.id }).then(function(deleteResult) {   
        res.send({"message": "delete..!"});
    }).catch(function(err) {
        res.send(err);
    });
});

router.put('/update_document_master', function(req, res, next) {
    
    DocumentMaster.updateOne({ "_id" : req.query.id}, {"name": req.body.name}).then(function (result) {
        res.send({"result": "Updated...!"});
    }).catch(function(err) {
        console.log("err >>>>>", err);
        res.send(err);
    });
});

router.get('/list_files', function(req, res, next) {
    var page, limit, offset;

    page = req.query.page ? req.query.page : 1;
    limit = req.query.limit ? req.query.limit : 50;
    offset = (page - 1) * limit;

    DocumentMaster.find({}).then(function(docMaster) {   
        var finalArray = [];

        Reminders.findOne({ "truckno": req.query.truckno }).then(function (trucksResult) {
            
            if(trucksResult) {
                docMaster.forEach((d, idx) => {
                    finalArray[idx] = {"documentname": d.name, files: []};
                    trucksResult.files.forEach(f => {
                        if(d.name === f.documentname) {
                            
                            var obj = {
                                "parent_id": trucksResult._id,
                                "status": f.status,
                                "remarks": f.remarks,
                                "fdate": f.fdate,
                                "_id": f._id,
                                "documentname": f.documentname,
                                "attachdocument": f.attachdocument,
                                "startdate": f.startdate,
                                "enddate": f.enddate,
                            };
                            
                            finalArray[idx].files.push(obj);
                        }
                    });
                    if(finalArray[idx].files.length > 0) {
                        finalArray[idx].fileFlag = true;
                    }
                });
            } else {
                docMaster.forEach((d, idx) => {
                    finalArray[idx] = {"documentname": d.name, files: [], fileFlag: false};
                });
            }

            res.send(finalArray);
        }).catch(function(err) {
            callback(err, null);
        });
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/first_screen', function(req, res, next) {

    var calculateFiles = function(data) {
        return function (callback) {
            var expiredTotal = 0;
            var daysTotal = 0;
            var moreDaysTotal = 0;
            var todayDateRow = moment.utc(); 
            var todayDate = moment(todayDateRow, "YYYY-MM-DD").format("YYYY-MM-DD");
            // console.log("todayDate >>>>", todayDate);
            
            Reminders.find({}).then(function (trucksResult) {
                var filesArray = [];
                trucksResult.forEach(t => {
                    var f = t.files;
                    f.forEach(a => {
                        if (a.documentname == data) {
                            var endDate = moment(a.enddate, "YYYY-MM-DD").format("YYYY-MM-DD");
                            var end20DateRow = moment(todayDateRow, "YYYY-MM-DD").add('days', 20);
                            var end20Date = moment(end20DateRow, "YYYY-MM-DD").format("YYYY-MM-DD");

                            if (todayDate < endDate && endDate < end20Date && a.status != "Done") {
                                daysTotal = daysTotal + 1;

                                // console.log("------  IF  ----------");
                                // console.log("todayDate  >>>>", todayDate);
                                // console.log("endDate  >>>>", endDate);
                                // console.log("end20Date >>>>", end20Date);
                    

                            }  else if (todayDate > endDate && a.status != "Done") {
                                expiredTotal = expiredTotal  + 1;
                                // console.log("------  ELSE IF  ----------");
                                // console.log("todayDate  >>>>", todayDate);
                                // console.log("endDate  >>>>", endDate);
                                // console.log("end20Date >>>>", end20Date);

                            } else {
                                moreDaysTotal = moreDaysTotal  + 1;

                                // console.log("------  ELSE  ----------");
                                // console.log("todayDate  >>>>", todayDate);
                                // console.log("endDate  >>>>", endDate);
                                // console.log("end20Date >>>>", end20Date);
                            }
                            
                        } 
                    });
                });
                var obj = {
                    "Name": data,
                    "Expired": expiredTotal,
                    "20_Days": daysTotal,
                    "40_Days": moreDaysTotal,
                }
                callback(false, obj);
                
            }).catch(function(err) {
                callback(err, null);
            });
                 
        };
    };

    DocumentMaster.find({}).then(function(result) {   
        var filesArray = [];
        result.forEach(t => {
                filesArray.push(calculateFiles(t.name));
        });


        async.parallel(filesArray, function(err, asyncResults) {
            
            res.send( asyncResults );  
        });
    }).catch(function(err) {
        res.send(err);
    });

   

});

router.get('/second_screen', function(req, res, next) {

    var calculateFiles = function(data) {
        return function (callback) {
            var expiredTotal = 0;
            var daysTotal = 0;
            var moreDaysTotal = 0;
            var todayDateRow = moment.utc(); 
            var todayDate = moment(todayDateRow, "YYYY-MM-DD").format("YYYY-MM-DD");
            // console.log("todayDate >>>>", todayDate);
            
            Reminders.find({}).then(function (trucksResult) {
                var mainArray = [];
                trucksResult.forEach(t => {
                    var f = t.files;
                    f.forEach(a => {
                        if (a.documentname == data) {
                            var endDate = moment(a.enddate, "YYYY-MM-DD").format("YYYY-MM-DD");
                            var end20DateRow = moment(todayDateRow, "YYYY-MM-DD").add('days', 20);
                            var end20Date = moment(end20DateRow, "YYYY-MM-DD").format("YYYY-MM-DD");

                            if (todayDate < endDate && endDate < end20Date && a.status != "Done") {
                                var obj = {
                                    "_id": t._id,
                                    "document_id":a._id,
                                    "truck_no": t.truckno,
                                    "document_name": a.documentname,
                                    "startdate": a.startdate,
                                    "enddate": a.enddate,
                                    "status": a.status,
                                    "remarks": a.remarks,
                                }

                                mainArray.push(obj)
                                // console.log("------  IF  ----------");
                                // console.log("todayDate  >>>>", todayDate);
                                // console.log("endDate  >>>>", endDate);
                                // console.log("end20Date >>>>", end20Date);
                            }   
                        } 
                    });
                });
                
                if(mainArray == []) {
                    callback(false);
                    
                } else {
                    callback(false, mainArray);
                }

                
                
            }).catch(function(err) {
                callback(err, null);
            });
                 
        };
    };

    var getCompanyTrucks = function(data) {
        return function (callback) {

            console.log("data   >>>>", data);
            // Trucks.find({}).then(function (trucksResult) {

                
            //     if(mainArray == []) {
            //         callback(false);
                    
            //     } else {
            //         callback(false, mainArray);
            //     }

                callback(false, data);
                
            // }).catch(function(err) {
            //     callback(err, null);
            // });
        };
    };

    Trucks.find({ "vtype" : "Company"}).then(function (CompanyTruckResult) {
        companyTruckList = [];
        CompanyTruckResult.forEach(ct => {
            companyTruckList.push(ct.truckno);
        });
        DocumentMaster.find({}).then(function(result) {   
            var filesArray = [];
            result.forEach(t => {
                    filesArray.push(calculateFiles(t.name));
            });


            async.parallel(filesArray, function(err, asyncResults) {
                var asyncResult =  asyncResults.filter(e => e.length);
                var asyncResultArray = [];
                asyncResult.forEach( a =>{
                    a.forEach( i =>{
                        asyncResultArray.push(i);
                    });
                });
                asyncResultArray.sort(function(a, b){
                    return a.enddate < b.enddate ? -1 :  a.enddate > b.enddate ? 1 : 0;
                });

                // companyTruckList
                // asyncResultArray
                var companyTrucksResultArray = [];
                asyncResultArray.forEach(aa => {
                    companyTruckList.forEach(bb => {
                        if(aa.truck_no == bb){
                            companyTrucksResultArray.push(aa);
                        }
                    });
                });
                res.send( companyTrucksResultArray );  
                // var companyTrucksResultArray;
                // asyncResultArray.forEach( tt => {
                //     // console.log("tt  >>>>>", tt);
                //     companyTrucksResultArray.push(getCompanyTrucks(tt));
                // });
                
                // async.parallel(filesArray, function(err, asyncMainResults) {

                // });
            });
        }).catch(function(err) {
            res.send(err);
        });
    }).catch(function(err) {
        res.send(err);
    });

   

});

router.get('/second_screen_expired', function(req, res, next) {

    var calculateFiles = function(data) {
        return function (callback) {
            var expiredTotal = 0;
            var daysTotal = 0;
            var moreDaysTotal = 0;
            var todayDateRow = moment.utc(); 
            var todayDate = moment(todayDateRow, "YYYY-MM-DD").format("YYYY-MM-DD");
            // console.log("todayDate >>>>", todayDate);
            
            Reminders.find({}).then(function (trucksResult) {
                var mainArray = [];
                trucksResult.forEach(t => {
                    var f = t.files;
                    f.forEach(a => {
                        if (a.documentname == data) {
                            var endDate = moment(a.enddate, "YYYY-MM-DD").format("YYYY-MM-DD");
                            var end20DateRow = moment(todayDateRow, "YYYY-MM-DD").add('days', 20);
                            var end20Date = moment(end20DateRow, "YYYY-MM-DD").format("YYYY-MM-DD");

                            if (todayDate > endDate && a.status != "Done") {
                                var obj = {
                                    "_id": t._id,
                                    "document_id":a._id,
                                    "truck_no": t.truckno,
                                    "document_name": a.documentname,
                                    "startdate": a.startdate,
                                    "enddate": a.enddate,
                                    "status": a.status,
                                    "remarks": a.remarks,
                                }

                                mainArray.push(obj)
                                // console.log("------  IF  ----------");
                                // console.log("todayDate  >>>>", todayDate);
                                // console.log("endDate  >>>>", endDate);
                                // console.log("end20Date >>>>", end20Date);
                            }   
                        } 
                    });
                });
                
                if(mainArray == []) {
                    callback(false);
                    
                } else {
                    callback(false, mainArray);
                }

                
                
            }).catch(function(err) {
                callback(err, null);
            });
                 
        };
    };

    Trucks.find({ "vtype" : "Company"}).then(function (CompanyTruckResult) {
        companyTruckList = [];
        CompanyTruckResult.forEach(ct => {
            companyTruckList.push(ct.truckno);
        });
        DocumentMaster.find({}).then(function(result) {   
            var filesArray = [];
            result.forEach(t => {
                    filesArray.push(calculateFiles(t.name));
            });


            async.parallel(filesArray, function(err, asyncResults) {
                var asyncResult =  asyncResults.filter(e => e.length);
                var asyncResultArray = [];
                asyncResult.forEach( a =>{
                    a.forEach( i =>{
                        asyncResultArray.push(i);
                    });
                });

                asyncResultArray.sort(function(a, b){
                    return a.enddate < b.enddate ? -1 :  a.enddate > b.enddate ? 1 : 0;
                });
                // res.send( asyncResultArray );  
                var companyTrucksResultArray = [];
                asyncResultArray.forEach(aa => {
                    companyTruckList.forEach(bb => {
                        if(aa.truck_no == bb){
                            companyTrucksResultArray.push(aa);
                        }
                    });
                });
                res.send( companyTrucksResultArray ); 
            });
        }).catch(function(err) {
            res.send(err);
        });
    }).catch(function(err) {
        res.send(err);
    });
   

});

router.put('/update', function(req, res, next) {

    Reminders.findOneAndUpdate(
        { "files._id": req.body.id },
        { "$set": { "files.$.status" : req.body.status, "files.$.remarks" : req.body.remarks} }).then(function(result) {
        res.send({"message": "Updated..!"});
    }).catch (function(err) {
        res.send(err);
    });
});

router.put('/update_file_date', function(req, res, next) {

    Reminders.findOneAndUpdate(
        { "files._id": req.body.id },
        { "$set": { "files.$.startdate" : req.body.startdate, "files.$.enddate" : req.body.enddate} }).then(function(result) {
        res.send({"message": "Updated..!"});
    }).catch (function(err) {
        res.send(err);
    });
});

router.put('/delete_document', function(req, res, next) {
    Reminders.update( {"_id": req.body.id}, { $pull: {"files": {"_id": req.body.document_id} } }).then(function(deleteResult) {   
        res.send({"message": "deleted..!"});
    }).catch(function(err) {
        res.send(err);
    });
});

module.exports = router;