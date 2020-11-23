var express = require('express');
var router = express.Router();
var async = require('async');
var momentTZ = require('moment-timezone');
var moment = require('moment');
var PlantsTruckPosition = require('../models/plantstruckposition');
var Billty = require('../models/billties');
var Trucks = require('../models/trucks');
var mongoose = require('mongoose');
var DocumentMaster = require('../models/documentmaster');
var Reminders = require('../models/reminders');

router.get('/list', function(req, res, next) {


    page = req.query.page ? req.query.page : 1;
    limit = req.query.limit ? req.query.limit: 100;
    offset = (page - 1) * limit;

    function paginate (array, page_size, page_number) {
        --page_number; // because pages logically start with 1, but technically with 0
        return array.slice(page_number * page_size, (page_number + 1) * page_size);
    }
    var matchCondition = {billtytime: null, status: "Active"};
    req.query.site_name = req.query.site_name.replace('(', '\(');
    req.query.site_name = req.query.site_name.replace(')', '\)');

    if (req.query.site_name) {
        req.query.site_name = req.query.site_name.replace('(', '\\(');
        req.query.site_name = req.query.site_name.replace(')', '\\)');
        matchCondition.site = new RegExp('^' + req.query.site_name , 'i');
    }
    if (req.query.truck_no) {
        matchCondition.truckno = req.query.truck_no;
    }
    if (req.query.destination_name) {
        matchCondition.destination = req.query.destination_name ;
    }
    console.log(matchCondition);
    var listArray = [];
	PlantsTruckPosition.find(matchCondition).then(function(result) {
        result.forEach(r => {

            var  pDate = moment(r.pdate).format('YYYY-MM-DD');
            var  timeIn = moment(r.timein).format('HH:mm:ss');
            var obj = {
                "id": r._id,
                "destination": r.destination,
                "pdate": pDate,
                "lrno": r.lrno,
                "srno": r.srno,
                "truckno": r.truckno,
                "cc": r.cc,
                "timein": timeIn,
                "placedtime": r.placedtime,
                "billtytime": r.billtytime,
                "status": r.status,
            }          
            listArray.push(obj);
        });
        totalData = result.length;

        res.send({"results": paginate(listArray, limit, page),"total": totalData });
    }).catch(function(err) {
        res.send(err);
    });
});

router.post('/add', function(req, res, next) {

    var new_srno, max_srno;
    PlantsTruckPosition.findOne().sort({pdate: -1}).then(function(resultPTP) {
        if(resultPTP && resultPTP.srno){
            max_srno = resultPTP.srno;
        } else {
            max_srno = 0;
        }

        var new_srno = Number(max_srno) + 1;
        
        Trucks.findOne({ "truckno": req.body.truckno }).then(function(result) {
            console.log(result.vtype, '<<<>>>',req.body.km_reading);
            if(result.vtype === "Company" && !req.body.km_reading) {
                return res.status(400).send({error: "KM Reading is required."});
            }
            // console.log("err >>>", err)
            // console.log("if >>>", result)
            var tCC;
            if(result && result.newcarring){
                tCC = Number(result.newcarring);
                console.log("if >>>");
            } else {
                console.log("else >>>");
                tCC = 0;
            }
    
    
            // ADD  
            req.body.isBilltyGen = false;
            bodyData = req.body;
        
            var todayDate = moment.utc();  
            bodyData.srno = new_srno;
            bodyData.pdate = todayDate; 
            bodyData.cc = tCC;
            bodyData.timein = todayDate;
            bodyData.placedtime = "";
            bodyData.billtytime = "";
    
            var d = new PlantsTruckPosition(bodyData);
            d.save(function (err, result) {
                console.log("err   >>>>", err);
                console.log("result >>>", result);
                res.send({"message": "Added...!"});
            });
    
        }).catch(function(err) {
            res.send(err);
        });



    }).catch(function(err) {
        console.log("err   >>>>",err);
        res.send(err);
    });
    
});

router.put('/update', function(req, res, next) {
  
	PlantsTruckPosition.update({ srno: req.body.sr_no}, {placedtime: req.body.placed_time}, function(err, raw) {
        
        res.send({"message": "Updated...!"});
    }).catch(function(err) {
        res.send(err);
    });
});

router.put('/update_billty_time', function(req, res, next) {
    Billty.findOne({lrno: req.body.lrno}).then(function (record) {
        console.log(record.lrdate);
        PlantsTruckPosition.update({ srno: req.body.srno}, {billtytime: record.lrdate}, function(err, raw) {
            console.log("Result >>> ", raw);
            res.send({"message": "Updated...!", date: record.lrdate});
        }).catch(function(err) {
            res.send(err);
        });
    }).catch(function (err) {
        res.status(500).send({error: err.message ? err.message : 'Something went wrong.'});
    });

}); 

router.put('/update_placed_time', function(req, res, next) {
    var current_time = momentTZ().tz('Asia/Calcutta').format();
    console.log(" >>>> ", current_time);
    PlantsTruckPosition.update({ srno: req.body.srno}, {placedtime: current_time}, function(err, raw) {
        console.log("Result >>> ", raw);
        res.send({"message": "Updated...!", time: moment(current_time).format('DD/MM/YYYY HH:mm:ss')});
    }).catch(function(err) {
        res.send(err);
    });
}); 

router.delete('/delete', function(req, res, next) {
    PlantsTruckPosition.deleteOne({ srno: req.query.sr_no }).then(function(deleteResult) {   
        res.send({"message": "delete..!"});
    }).catch(function(err) {
        res.send(err);
    });
});

router.put('/cancel_position_entry', function(req, res, next) {
    try {
        PlantsTruckPosition.updateMany({ "_id": req.body.id }, {$set: {status: "Canceled"}}).then(function (result) {
            res.send({"message": "Canceled...!"});            
        }).catch(function(err) {
            console.log("err >>>>>", err);
            res.send(err);
        });
    } catch (e) {
        console.log("err >>>>>", e);
    }
});

router.get('/document_names', function(req, res, next) {

    var calculateFiles = function(data) {
        return function (callback) {
            var expiredTotal = 0;
            var daysTotal = 0;
            var moreDaysTotal = 0;
            var todayDateRow = moment.utc(); 
            var todayDate = moment(todayDateRow, "YYYY-MM-DD").format("YYYY-MM-DD");
            // console.log("todayDate >>>>", todayDate);
            
            var expiredFlag = false;
            var daysFlag = false;
            var moreDaysFlag = false;
            Reminders.find({"truckno": req.query.truckno}).then(function (trucksResult) {
                var filesArray = []; 
                
                trucksResult.forEach(t => {
                    var f = t.files;
                    f.forEach(a => {
                        if (a.documentname == data) {
                            var endDate = moment(a.enddate, "YYYY-MM-DD").format("YYYY-MM-DD");
                            var end20DateRow = moment(todayDateRow, "YYYY-MM-DD").add('days', 20);
                            var end20Date = moment(end20DateRow, "YYYY-MM-DD").format("YYYY-MM-DD");

                            if (todayDate < endDate && endDate < end20Date ) {
                                daysFlag = true;   
                                expiredFlag = false; 
                                moreDaysFlag = false; 
                            }  else if (todayDate > endDate) {
                                expiredFlag = true;
                                moreDaysFlag = false;
                                daysFlag = false; 
                            } else {
                                moreDaysFlag = true;  
                                daysFlag = false;
                                expiredFlag = false;                             
                            }                            
                        } 
                    });
                    return false
                });
                var obj = {
                    "name": data,
                    "expired": expiredFlag,
                    "20_days": daysFlag,
                    "40_days": moreDaysFlag,
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


router.post('/save', function(req, res, next){

    PlantsTruckPosition.findOne({ "srno": req.query.srno}).then( function(result) {
        if (!result) {
            res.send({"message": "Enter valid srno..!"});
        }

        if (result.truckno == req.body.truckno) {
            res.send({"message": "Save...!"});
        } else {
            res.send({"message": "Truckno invalid...!"});
        }
        

    }).catch(function(err) {
        console.log("err >>>>>", err);
        res.send(err);
    });
});


module.exports = router;