var express = require('express');
var router = express.Router();
var async = require('async');
var Accdataentry = require('../../models/accounts/accounts-dataentry');
var checkLogin = require('../middlewares/checkLogin');
var jwt = require('jsonwebtoken');
var Accountsledgers = require('../../models/accountsledger');

router.get('/',checkLogin(),function (req, res, next) {
    let limit = req.query.limit ? req.query.limit : 5
    let offset = req.query.offset ? req.query.offset : 0
    let searchText = req.query.searchText;
    if (searchText !== undefined) {
        var regex = new RegExp(searchText, 'i');
        let sitematchCondition = {}
        if (req.user.role == 'ADMIN') {
            sitematchCondition = {'site': { $regex: regex }};
            console.log("ADMIN  >>>>>>>", sitematchCondition) ;
            Accdataentry.find({'$or': [sitematchCondition, { 'draccount_name': { $regex: regex }}, { 'craccount_name': { $regex: regex }}, { 'user': { $regex: regex }}]}).count(function (e, count) {  
                Accdataentry.find({'$or': [sitematchCondition, { 'draccount_name': { $regex: regex }}, { 'craccount_name': { $regex: regex }}, { 'user': { $regex: regex }}]}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
                res.send({ records: result, totalRecords: count });   
                });
            });

        } else {
            sitematchCondition = { site: req.user.site };
            console.log("ADMIN  >>>>>>>", sitematchCondition) ;
            Accdataentry.find({
                $and:[
                     {$or:[ 
                        { 'draccount_name': { $regex: regex }}, 
                        { 'craccount_name': { $regex: regex }}, 
                        { 'user': { $regex: regex }}
                    ]},
                    sitematchCondition
                 ]}).count(function (e, count) {
                    Accdataentry.find({
                        $and:[
                             {$or:[
                                { 'draccount_name': { $regex: regex }}, 
                                { 'craccount_name': { $regex: regex }}, 
                                { 'user': { $regex: regex }}
                             ]},
                             sitematchCondition
                        ]}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
                            res.send({ records: result, totalRecords: count })              
                 });
                });
        }

    }
    else {
        let matchCondition = {};
        if (req.user.role == 'ADMIN') {
            console.log("ADMIN  >>>>>>>");
            matchCondition = { };
        } else {
            matchCondition = { site: req.user.site };
        }

        Accdataentry.count(function (e, count) {  
            Accdataentry.find(matchCondition).sort({ ade_date: -1, ade_number: -1 }).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
            });
        });   
    }      
     
});

router.get('/:id', function(req, res) {
    Accdataentry.findOne({ _id: req.params.id }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});

router.post('/', function (req, res, next) {
    var site = req.body.site;
    var payment_type = req.body.payment_type;
    var transtype = req.body.ade_type;
    var against = req.body.against;
    var department = req.body.department;
    var trandate = req.body.ade_date;

    var user_name;
    jwt.verify(req.headers['x-auth'], 'secretPassword', function(err, decoded) {

        if (err) {
            console.log("err   >>>>>>>", err);
            return res.status(401).json({ statusCode: 401, code: "Invalid Token...!" });
        }

        user_name = decoded.split(":")[0];
    });

    
    var max_ade_number;
    Accdataentry.findOne({site: site}).sort({ade_date: -1}).then(function(resultAT) {
        if(resultAT && resultAT.ade_number){
            max_ade_number = resultAT.ade_number;
        } else {
            max_ade_number = 0;
        }
        var new_ade_number = Number(max_ade_number) + 1;
        console.log("new_ade_number>>> ", new_ade_number);
        req.body.ade_number = new_ade_number;
        req.body.user = user_name;
        
        var receiptno = req.body.ade_number;

        var d = new Accdataentry(req.body);
    
        d.save(function (err, save) {
            drcramt = req.body.amount;
            if(transtype == "Receipt"){
                var dr_refno = " Being "+payment_type+ " received against"+" "+against+" for dept. "+department+" Voucher No " +receiptno;
                var cr_refno = " Being "+payment_type+ " paid against Voucher No " +receiptno;
            }
            else if(transtype == "Payment"){
                var dr_refno = " Being "+payment_type+ " paid against Voucher No " +receiptno;
                var cr_refno = " Being "+payment_type+ " received against"+" "+against+" for dept. "+department+" Voucher No " +receiptno;
            }
            else if(transtype == "Contra"){
                var dr_refno = " Being "+payment_type+ " received "+against+" for dept. "+department+" Voucher No " +receiptno;
                var cr_refno = " Being "+payment_type+ " paid against Voucher No " +receiptno;
            }
            else if(transtype == "Journal"){
                var dr_refno = " Being "+payment_type+ " against Voucher No " +receiptno;
                var cr_refno = " Being "+payment_type+ " against Voucher No " +receiptno;
            }

            var drLeg = new Accountsledgers(
                {    
                    branch:site,
                    accountname:req.body.draccount_name,
                    avouno:receiptno,
                    avoudt:trandate,
                    arefno:dr_refno,
                    adoctp:transtype,
                    adebtamt:drcramt,
                    acrdtamt:0,
                    user:req.body.user,
                    accounts_id: save['_id']
                });
            drLeg.save(function(i_err,i_save) {
                console.log('debit saveinfo ', i_err, i_save)
                // console.log(element['accounts_id'])
            })

            var crLeg = new Accountsledgers(
                {    
                    branch:site,
                    accountname:req.body.craccount_name,
                    avouno:receiptno,
                    avoudt:trandate,
                    arefno:cr_refno,
                    adoctp:transtype,
                    adebtamt:0,
                    acrdtamt:drcramt,
                    user:req.body.user,
                    accounts_id: save['_id']
                });
            crLeg.save(function(i_err,i_save) {
                console.log('Credit saveinfo ', i_err, i_save)
                // console.log(element['accounts_id'])
            })

            console.log("err  >>>",err);
            console.log("save  >>>",save);
            res.send({"message": "Added..!"}); 
        });

    }).catch(function(err) {
        console.log("err   >>>>",err);
        res.send(err);
    });
    
     
});


router.put('/', function (req, res, next) {
    let litem_id = req.query.id
    var site = req.body.site;
    var payment_type = req.body.payment_type;
    var receiptno = req.body.ade_number;
    var transtype = req.body.ade_type;
    var against = req.body.against;
    var department = req.body.department;
    var trandate = req.body.ade_date;

    var user_name;
    jwt.verify(req.headers['x-auth'], 'secretPassword', function(err, decoded) {

        if (err) {
            console.log("err   >>>>>>>", err);
            return res.status(401).json({ statusCode: 401, code: "Invalid Token...!" });
        }
        user_name = decoded.split(":")[0];
    });

    // user: user_name , 
    try {
        Accdataentry.updateOne({ _id: req.query.id  }, { $set: req.body }).then(function (result) {

            Accountsledgers.deleteMany({ accounts_id: litem_id }, function (err, d_result) {
            });

            drcramt = req.body.amount;
            if(transtype == "Receipt"){
                var dr_refno = " Being "+payment_type+ " received against"+" "+against+" for dept. "+department+" Voucher No " +receiptno;
                var cr_refno = " Being "+payment_type+ " paid against Voucher No " +receiptno;
            }
            else if(transtype == "Payment"){
                var dr_refno = " Being "+payment_type+ " paid against Voucher No " +receiptno;
                var cr_refno = " Being "+payment_type+ " received against"+" "+against+" for dept. "+department+" Voucher No " +receiptno;
            }
            else if(transtype == "Contra"){
                var dr_refno = " Being "+payment_type+ " received "+against+" for dept. "+department+" Voucher No " +receiptno;
                var cr_refno = " Being "+payment_type+ " paid against Voucher No " +receiptno;
            }
            else if(transtype == "Journal"){
                var dr_refno = " Being "+payment_type+ " against Voucher No " +receiptno;
                var cr_refno = " Being "+payment_type+ " against Voucher No " +receiptno;
            }

            var drLeg = new Accountsledgers(
                {    
                    branch:site,
                    accountname:req.body.draccount_name,
                    avouno:receiptno,
                    avoudt:trandate,
                    arefno:dr_refno,
                    adoctp:transtype,
                    adebtamt:drcramt,
                    acrdtamt:0,
                    user:req.body.user,
                    accounts_id:litem_id
                });
            drLeg.save(function(i_err,i_save) {
                console.log('debit saveinfo ', i_err, i_save)
                // console.log(element['accounts_id'])
            })

            var crLeg = new Accountsledgers(
                {    
                    branch:site,
                    accountname:req.body.craccount_name,
                    avouno:receiptno,
                    avoudt:trandate,
                    arefno:cr_refno,
                    adoctp:transtype,
                    adebtamt:0,
                    acrdtamt:drcramt,
                    user:req.body.user,
                    accounts_id:litem_id
                });
            crLeg.save(function(i_err,i_save) {
                console.log('Credit saveinfo ', i_err, i_save)
                // console.log(element['accounts_id'])
            })
                
            res.send({"result": "Updated...!"});
        }).catch(function(err) {
            console.log("err >>>>>", err);
            res.send(err);
        });
     } catch (e) {
        res.send(err);
     }

});

router.delete ('/:id', function(req, res, next) {
    console.log('Account Data Entry Delete', req.params.id);
    
    Accdataentry.deleteOne({"_id": req.params.id}).then(function(deleteResult) {   
        Accountsledgers.deleteMany({ accounts_id: req.params.id }, function (err, result) {
        });
        res.send(deleteResult);
    }).catch(function(err) {
        res.send(err);
    });
});


router.post('/generate_ade_number', function(req, res) {
    console.log(' matchcond', req.body);
    Accdataentry.find(req.body).count(function (e, count) { 
        res.send({count: count});
    })
});

module.exports = router;
