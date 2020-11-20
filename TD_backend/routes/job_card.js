var express = require('express');
var router = express.Router();
var TruckMaintenance = require('../models/truck_maintenance');
var TyreMaintenance = require('../models/tyre_maintenance');
var JobCard = require('../models/job_card');
var WorkToBeDoneSchema = require('../models/work_to_be_done');
var multer = require('multer');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})
var upload = multer({storage: storage});

router.post('/add', function(req, res, next) {

    req.body.job_details.forEach(element => {
        console.log("work_be_done  >>>", element.work_be_done);
        WorkToBeDoneSchema.find({"name": element.work_be_done}).then( function(result) {
            if(!result[0]) {
                console.log(" IF >>>>");
                var wdName = element.work_be_done;
                var row_wdvalue = wdName.toLowerCase();
                var wdvalue = row_wdvalue.replace(" ", "_");
                obj = {name: wdName, value: wdvalue};
                console.log(" obj >>>>", obj);
    
                var d = new WorkToBeDoneSchema( obj );
                d.save(function (err, save) {
                    console.log("err  >>>",err);
                    console.log("save  >>>",save); 
                });
            }
        }).catch(function(err) {
            res.send(err);
        });
    });

    var d = new JobCard(req.body);
    d.save(function (err, save) {
        console.log("err  >>>",err);
        console.log("save  >>>",save);
        res.send({"message": "Added..!"}); 
    });

    // JobCard.findOne().sort({jobno: -1}).then(function(result) {
    //     var max_jobno;
    //     if(result && result.jobno){
    //         max_jobno = result.jobno;
    //     } else {
    //         max_jobno = 0;
    //     }
    //     var jobno = max_jobno + 1;
    //     req.body.jobno = jobno;
    // }).catch(function(err) {
    //     console.log("err   >>>>",err);
    //     res.send(err);
    // });


    // JobCard.find({"truckno": req.body.truckno, "srno": req.body.srno }).then(function(result) {
    //     if(result[0]) {
    //         // console.log("If >>>>>", result[0]);

    //         JobCard.update({ 
    //             "truckno": req.body.truckno,
    //             "srno": req.body.srno
    //             }, { 
    //             "$push": 
    //                 { 
    //                     "job_details": req.body.job_details
    //                 }
    //             }).then(function(result) {
    //                 res.send({"message": "Added..!"}); 
    //         }).catch(function(err) {
    //             res.send(err);
    //         });

    //     } else {
    //         console.log("Else >>>>>");

    //         // Save New ...
    //         var d = new JobCard(req.body);
    //         d.save(function (err, save) {
    //             console.log("err  >>>",err);
    //             console.log("save  >>>",save);
    //             res.send({"message": "Added..!"}); 
    //         });            
    //     }
    // }).catch(function(err) {
    //     console.log(err);
    //     res.send(err);
    // });
});

router.get('/list_by_srno', function(req, res, next) {

    JobCard.find({"srno": req.query.srno}).sort({"jobno": -1}).then( function(result) {
        res.send({ "result": result });
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/list_job_card_details', function(req, res, next) {

    TruckMaintenance.find({"srno": req.query.srno, "truckno": req.query.truckno}).then( function(result) {
        
        var obj;

        if(result[0]) {
            obj = {
                "id": result[0]._id,
                "srno": result[0].srno,
                "truckno": result[0].truckno,
                "km_reading": result[0].km_reading ? result[0].km_reading: "",
                "remarks": result[0].remarks ? result[0].remarks: ""
            }
        } else {
            obj = {
                "id": "",
                "srno": req.query.srno,
                "truckno": req.query.truckno,
                "km_reading": "",
                "remarks": ""
            }
        }
        res.send({ "result": obj });
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/list_by_jobno', function(req, res, next) {

    JobCard.findOne({"jobno": req.query.jobno}).then( function(result) {
        // res.send({ "result": result });
        res.send(result);
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/max_jobno', function(req, res, next) {
    JobCard.findOne().sort({jobno: -1}).then(function(result) {
        var max_jobno;
        if(result && result.jobno){
            max_jobno = result.jobno;
        } else {
            max_jobno = 0;
        }
        var jobno = max_jobno + 1;
        
        res.send({"jobno": jobno});

    }).catch(function(err) {
        console.log("err   >>>>",err);
        res.send(err);
    });
});

router.post("/upload_bill", upload.single('file'), function(req, res, next){
    var fileName = req.file.filename;
    var filePath = "/uploads/"+ fileName;
    var fullUrl = req.protocol + '://' + req.get('host');
       
    res.send({url: fullUrl + filePath}); 
});

router.get('/list_work_done', function(req, res, next) {

    var regex = req.query.q;
    WorkToBeDoneSchema.find({"name": new RegExp('^' + regex, 'i')})
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

router.get('/get_last_done_on', function(req, res, next) {

    JobCard.find({"truckno": req.query.truckno}).sort({"date": -1}).then( function(result) {
        // res.send({ "result": result });
        var jobDetailsArray = [];
        result.forEach( r => {
            var jobDetails =  r.job_details;
            jobDetails.forEach( jd => {
                jobDetailsArray.push(jd);
            });
        });

        var obj = {
            "work_be_done": req.query.work_be_done,
            // "last_done_on": ""
        }

        jobDetailsArray.sort(function(a, b){
            return a.last_done_on < b.last_done_on ? -1 :  a.last_done_on > b.last_done_on ? 1 : 0;
        });
        jobDetailsArray.forEach( ls => {
            if(ls.work_be_done == req.query.work_be_done) {
                obj.work_be_done = req.query.work_be_done;
                obj.last_done_on = ls.last_done_on;
                // break;
            }
        });
    


        res.send({ "result": obj });
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/truck_jobcard_history', function(req, res, next) {

    JobCard.find({"truckno": req.query.truckno}).sort({"jobno": -1}).then( function(result) {
        // res.send({ "result": result });
        var total = 0; 
        var jobDetailsArray = [];
        result.forEach( r => {
            var jobDetails =  r.job_details;
            jobDetails.forEach( jd => {
                total = total + Number(r.amount);
                // var startDate = moment(req.query.start_date).format("YYYY-MM-DD");
                totalRate = (jd.qty * jd.rate) ;
                console.log("totalRate >>>", totalRate);
                addGst = (totalRate * jd.gst) / 100;
                mainAmount = totalRate + addGst;
                var obj = {
                    "jobno": r.jobno,
                    "date": r.date,
                    "srno": r.srno,
                    "km_reading": r.km_reading,
                    "work_be_done": jd.work_be_done,
                    "remarks": jd.remarks,
                    "qty": jd.qty,
                    "scrap_qty": jd.scrap_qty,
                    "next_due_km": jd.next_due_km,
                    "rate": jd.rate,
                    "gst": jd.gst,
                    "amount": mainAmount, 
                    "vendor_name": r.vendor_name,
                    // "total": total
                }

                console.log("obj >>>", obj);
                jobDetailsArray.push(obj);
            });
        });

        res.send({ "result": jobDetailsArray, "total": total });
    }).catch(function(err) {
        res.send(err);
    });
});

router.put('/update', function(req, res, next) {
    JobCard.find({"jobno": req.body.jobno }).then(function(result) {
        if(result[0]) {

            JobCard.updateMany({"jobno": req.body.jobno}, { $set : 
            {
                'date': req.body.date, 
                'km_reading': req.body.km_reading,
                'vendor_name': req.body.vendor_name,
                'bill_amount': req.body.bill_amount,
                'app_amount': req.body.app_amount,
                'remarks': req.body.remarks,
                'bill': req.body.bill,
                'job_details': [] 
            }} , {multi:true} ).then(function(updateResult) {   
                
                JobCard.update({ 
                    "jobno": req.body.jobno
                    },{ 
                    "$push": 
                        { 
                            "job_details": req.body.job_details
                        }
                    }).then(function(result) {
                        res.send({"message": "updated..!"});
                    }).catch(function(err) {
                        res.send(err);
                });
            }).catch(function(err) {
                res.send(err);
            });
        } else {
            res.send({"message": "Not Found Job Card..!"});
        }
    }).catch(function(err) {
        console.log(err);
        res.send(err);
    });
});

router.delete('/delete', function(req, res, next) {
    JobCard.deleteOne({ "jobno": req.query.jobno }).then(function(deleteResult) {   
        res.send({"message": deleteResult});
    }).catch(function(err) {
        res.send(err);
    });
});

module.exports = router;
