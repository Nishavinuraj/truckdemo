var express = require('express');
var router = express.Router();
var Estimates = require('../models/estimates');
var EstimatesSubmission = require('../models/estimatessubmission');
var EstimatesProdSubmission = require('../models/estimatesprodsubmissions');
var VendorMaster = require('../models/vendor_master');
var moment = require('moment');
var nodemailer = require('nodemailer');
var sendEmail  = function(vendor,estimate){
        //store
        var buff = Buffer.from('ZXN0aW1hdGVqc3RjQGdtYWlsLmNvbTpqc3RjIzEyMw==','base64').toString();
        if(buff.indexOf(":")==-1){
            console.log("email can not be sent");
            return;
        }
        var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: buff.split(":")[0],
            pass: buff.split(":")[1]
        }
        });

        var mailOptions = {
        from: 'support@jstc.com',
        to: vendor.email,
        subject: 'GL - Request to Provide Estimates',
        text: this.getEmailBody(vendor,estimate)
        };

        transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent to :'+vendor.email+' Response:' + info.response);
        }
        });
}

getEmailBody = function(vendor,estimate) {
    
    var text =  `
        
        Dear `+vendor.name+`,

        Estimate is required for below :`;

        for(var i =0 ; i < estimate.product.length;i++){
            text = text + +`
            `+(i+1) + `- Product: `+estimate.product[i]+`,Quantity: `+estimate.productQty[i]+`
            `;
        }

        text = text + `Expiry Date: `+estimate.expiryDate +`
        
        `;
        
        
        
        text = text + `Please provide estimates using below link,`+`

        `+encodeURI('http://harijstc.in/estimates/submit-estimate?estimateId='+estimate._id+'&vendor='+vendor.name)+`
        
        Thanks,
        GL`
    return text;
}

router.post('/create_estimate', function(req, res, next) {
    req.body.isDeleted = false;
    var estimate = new Estimates(req.body);
    
     estimate.save(function (err, save) {
        console.log("err  >>>",err);
        console.log("save  >>>",save);
        let vendors = req.body.vendors;
        if(save){
            for(var i=0; i<vendors.length;i++){
                VendorMaster.find({name:vendors[i]}).then(function(vendors){
                    for(var j=0;j<vendors.length;j++){
                        let email = vendors[j].email;
                        if(email){
                            sendEmail(vendors[j],save);
                        }
                    }
                })
            }
        }
        
        res.send({"message": "Added..!"}); 
     });
     
});


router.get('/list_created', function(req, res, next) {

    Estimates.find({status:'CREATED',isDeleted:false}).sort({expiryDate:1}).then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});

router.get('/list_submissions', function(req, res, next) {

    EstimatesSubmission.find({status:'PO_AWAITED'}).sort({receivedDate:-1}).then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});

router.get('/list_submissions/:id', function(req, res, next) {

    EstimatesProdSubmission.find({referenceEsSubmissionId:req.params.id}).then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});

router.get('/find_submission/:id', function(req, res, next) {

    EstimatesSubmission.findById(req.params.id).then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});

router.get('/find/:id', function(req, res, next) {

    Estimates.findById(req.params.id).then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});

router.get('/find-submission/:id/:vendor', function(req, res, next) {

    EstimatesSubmission.find({estimateId:req.params.id,vendor:req.params.vendor}).then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});

router.delete('/delete/:id', function(req, res, next) {

    Estimates.update({_id:req.params.id},{
        isDeleted:true
    }).then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});

router.put('/update/submission/:id', function(req, res, next) {

    EstimatesSubmission.update({_id:req.params.id},{
        status:'PO_COMPLETE'
    }).then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});

router.put('/reject/submission/:id', function(req, res, next) {

    EstimatesSubmission.update({_id:req.params.id},{
        status:'REJECTED'
    }).then( function(result) {
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});

router.put('/update/:id', function(req, res, next) {

    Estimates.update({_id:req.params.id},req.body).then( function(result) {
        Estimates.findById(req.params.id).then( function(save) {
            if(save){
                for(var i=0; i<save.vendors.length;i++){
                    VendorMaster.find({name:save.vendors[i]}).then(function(vendors){
                        for(var j=0;j<vendors.length;j++){
                            let email = vendors[j].email;
                            if(email){
                                sendEmail(vendors[j],save);
                            }
                        }
                    })
                }
            }
        }).catch (function(err) {
            //console.log("err   >>>>",err);
            res.send(err);
        });
        
        res.send({"result": result});
    }).catch (function(err) {
        //console.log("err   >>>>",err);
        res.send(err);
    });
});

router.post('/submit', function(req, res, next) {
    req.body.estimate.status = 'PO_AWAITED';
    var estimatessubmission = new EstimatesSubmission(req.body.estimate);

    estimatessubmission.save(function(error,save){
        console.log("err  >>>",error);
        console.log("save  >>>",save);
        for(var i = 0; i < req.body.instances.length;i++){
            instance = req.body.instances[i];
            instance.referenceEsSubmissionId = save._id;
            var estimatesprodsubmission = new EstimatesProdSubmission(instance);
            estimatesprodsubmission.save(function(error,save){
                console.log("err  >>>",error);
                console.log("save  >>>",save);
            })
        }
        
        res.send({"message": "Estimate submitted..!"}); 
    })
    
});


module.exports = router;