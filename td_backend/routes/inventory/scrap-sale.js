var express = require('express');
var router = express.Router();
var async = require('async');
var ScrapsSchema = require('../../models/inventory/scrap-sale');
var Scraps = require('../../models/inventory/scrap-sale')
var Scrapledgers = require('../../models/inventory/scrapledger');
var moment = require('moment');
var Itemledgers = require('../../models/inventory/itemledger');
var Truckledgers = require('../../models/inventory/truckledger');
var Accountsledgers = require('../../models/accountsledger');
var checkLogin = require('../middlewares/checkLogin');
var jwt = require('jsonwebtoken');

// router.get('/', checkLogin(),function (req, res, next) {
//     let limit = req.query.limit ? req.query.limit : 5
//     let offset = req.query.offset ? req.query.offset : 0
//     let searchText = req.query.searchText;
//     if (searchText !== undefined) {
//         var regex = new RegExp(searchText, 'i');
//         let sitematchCondition = {}
//         if (req.user.role == 'ADMIN') {
//             console.log("ADMIN  >>>>>>>");
//             sitematchCondition = {'site': { $regex: regex }};
//         } else {
//             sitematchCondition = { site: req.user.site };
//         }
//         Scraps.find({'$or': [sitematchCondition, { 'vendor': { $regex: regex }}, { 'department': { $regex: regex }}]}).count(function (e, count) {  
//             Scraps.find({'$or': [sitematchCondition, { 'vendor': { $regex: regex }}, { 'department': { $regex: regex }}]}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
//                res.send({ records: result, totalRecords: count });   
//             });
//         });
//     }
//     else {
//         let matchCondition = {};
//         if (req.user.role == 'ADMIN') {
//             console.log("ADMIN  >>>>>>>");
//             matchCondition = { };
//         } else {
//             matchCondition = { site: req.user.site };
//         }

//         Scraps.count(function (e, count) {  
//             Scraps.find(matchCondition).sort({ mr_date: -1 }).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
//                res.send({ records: result, totalRecords: count });   
//             });
//         });   
//     }      
     
// });

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
            Scraps.find({'$or': [sitematchCondition, { 'vendor': { $regex: regex }}, { 'department': { $regex: regex }}, { 'user': { $regex: regex }}]}).count(function (e, count) {  
                Scraps.find({'$or': [sitematchCondition, { 'vendor': { $regex: regex }}, { 'department': { $regex: regex }}, { 'user': { $regex: regex }}]}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
                res.send({ records: result, totalRecords: count });   
                });
            });

        } else {
            sitematchCondition = { site: req.user.site };
            console.log("ADMIN  >>>>>>>", sitematchCondition) ;
            Scraps.find({
                $and:[
                     {$or:[ 
                        { 'vendor': { $regex: regex }}, 
                        { 'department': { $regex: regex }}, 
                        { 'user': { $regex: regex }}
                    ]},
                    sitematchCondition
                 ]}).count(function (e, count) {
                    Scraps.find({
                        $and:[
                             {$or:[
                                { 'vendor': { $regex: regex }}, 
                                { 'department': { $regex: regex }}, 
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

        Scraps.count(function (e, count) {  
            Scraps.find(matchCondition).sort({ ss_date: -1, ss_number: -1 }).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
            });
        });   
    }      
     
});

router.post('/', function (req, res, next) {
    var site = req.body.site;
    var vendor = req.body.vendor;
    var department = req.body.department;
    var receiptno = req.body.ss_number;
    var transtype = req.body.ss_type
    var transdate = req.body.ss_date;
    var ttotal_amount = req.body.total_amount;

    var user_name;
    jwt.verify(req.headers['x-auth'], 'secretPassword', function(err, decoded) {

        if (err) {
            console.log("err   >>>>>>>", err);
            return res.status(401).json({ statusCode: 401, code: "Invalid Token...!" });
        }

        user_name = decoded.split(":")[0];
    });
    
    req.body.user = user_name;

    var d = new Scraps(req.body);
    d.save(function (err, save) {
        req.body.scraps_items.forEach(element => {

            if(transtype == "Scrap Sale"){
                var tarefno = " Scrap sold to "+vendor+" Item Name "+element['name'];
                var tadebtamt= 0;
                var tacrdtamt= element['total'];
                var tdqty = 0;
                var tcqty = element['qty'];

                element['scrap_id'] = save['_id'];
                var scrapLeg = new Scrapledgers(
                    {    
                        site:site,
                        itemname:element['name'],
                        avouno:receiptno,
                        arefno:tarefno,
                        adoctp:transtype,
                        adebtamt:tadebtamt,
                        acrdtamt:tacrdtamt,
                        avoudt:transdate,
                        dqty:tdqty,
                        cqty:tcqty,
                        user:null,
                        scrap_id: element['scrap_id']    
                    });
                    scrapLeg.save(function(i_err,i_save) {
                        console.log('items saveinfo ', i_err, i_save)
                        console.log(element['scrap_id'])
                    })
                }
            else if(transtype == "Truck Issue"){
                var tarefno=" Item issued from scrap to dept. "+department;
                var tadebtamt= 0;
                var tacrdtamt= element['total'];
                var tdqty = 0;
                var tcqty = element['qty'];

                // posting in scrap ledger file
                element['scrap_id'] = save['_id'];
                var scrapLeg = new Scrapledgers(
                    {    
                        site:site,
                        itemname:element['name'],
                        avouno:receiptno,
                        arefno:tarefno,
                        adoctp:transtype,
                        adebtamt:tadebtamt,
                        acrdtamt:tacrdtamt,
                        avoudt:transdate,
                        dqty:tdqty,
                        cqty:tcqty,
                        user:null,
                        scrap_id: element['scrap_id']    
                    });
                    scrapLeg.save(function(i_err,i_save) {
                        console.log('items saveinfo ', i_err, i_save)
                        console.log(element['scrap_id'])
                    })

                // posting in truck ledger file
                var truckLeg = new Truckledgers(
                    {    
                        site:site,
                        truckno:department,
                        itemaccname:element['name'],
                        avouno:receiptno,
                        arefno:tarefno,
                        adoctp:transtype,
                        acrdtamt:tacrdtamt,
                        adebtamt:tadebtamt,
                        avoudt:transdate,
                        cqty:tcqty,
                        dqty:tdqty,
                        user:null,
                        // litem_id: element['litem_id']    
                        truck_id: save['_id']
                });
                truckLeg.save(function(i_err,i_save) {
                    console.log('items saveinfo ', i_err, i_save)
                    // console.log(element['litem_id'])
                })
        
            }
        }); 

        // // vendor posting
        if(transtype == "Scrap Sale"){
            var tvarefno = "Scrap Sold to "+vendor+ " agnst Scrap Voucher No "+receiptno;
            var tvadebtamt= ttotal_amount;
            var tvacrdtamt= 0;

            var vendorLeg = new Accountsledgers(
                {    
                    branch:site,
                    accountname:vendor,
                    avouno:receiptno,
                    avoudt:transdate,
                    arefno:tvarefno,
                    adoctp:transtype,
                    adebtamt:tvadebtamt,
                    acrdtamt:tvacrdtamt,
                    user:req.params.user,
                    accounts_id: save['_id']
                });
            vendorLeg.save(function(i_err,i_save) {
                console.log('accounts Vendor saveinfo ', i_err, i_save)
                // console.log(element['accounts_id'])
            });
        };
    
        res.send(save);
    });
});

router.get('/:id', function(req, res) {
    Scraps.findOne({ _id: req.params.id }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});

router.put('/', function (req, res, next) {
    let post_data = req.body;
    let scrap_id = req.query.id
    var site = req.body.site;
    var vendor = req.body.vendor;
    var department = req.body.department;
    var receiptno = req.body.ss_number;
    var transtype = req.body.ss_type
    var transdate = req.body.ss_date;
    var ttotal_amount = req.body.total_amount;

    var user_name;
    jwt.verify(req.headers['x-auth'], 'secretPassword', function(err, decoded) {

        if (err) {
            console.log("err   >>>>>>>", err);
            return res.status(401).json({ statusCode: 401, code: "Invalid Token...!" });
        }

        user_name = decoded.split(":")[0];
    });
    
    req.body.user = user_name;

    Scraps.update({_id:scrap_id},{$set:{    
        ss_number: post_data.ss_number,
        ss_type: post_data.ss_type,
        site: post_data.site,
        ss_date:post_data.ss_date,    
        vendor:post_data.vendor,
        department: post_data.department,
        narration: post_data.narration,
        rounded_off: post_data.rounded_off,
        net_amount: post_data.net_amount,
        total_amount: post_data.total_amount,
        round_off_type: post_data.round_off_type,
        user: req.body.user,   
        scraps_items:post_data.scraps_items   
    }})
    .then(function(result) {
        console.log('scrap_id', scrap_id)
        Scrapledgers.deleteMany({ scrap_id: scrap_id }, function (err, d_result) {
        });
        Truckledgers.deleteMany({ truck_id: scrap_id }, function (err, d_result) {
        });
        Accountsledgers.deleteMany({ accounts_id: scrap_id }, function (err, d_result) {
        });
        req.body.scraps_items.forEach(element => {
            if(transtype == "Scrap Sale"){
                var tarefno = " Scrap sold to "+vendor;
                var tadebtamt= 0;
                var tacrdtamt= element['total'];
                var tdqty = 0;
                var tcqty = element['qty'];
                element['scrap_id'] = save['_id'];
                var scrapLeg = new Scrapledgers(
                    {    
                        site:site,
                        itemname:element['name'],
                        avouno:receiptno,
                        arefno:tarefno,
                        adoctp:transtype,
                        adebtamt:tadebtamt,
                        acrdtamt:tacrdtamt,
                        avoudt:transdate,
                        dqty:tdqty,
                        cqty:tcqty,
                        user:null,
                        scrap_id:scrap_id  
                    });
                    scrapLeg.save(function(i_err,i_save) {
                        console.log('items saveinfo ', i_err, i_save)
                        console.log(element['scrap_id'])
                    })
                }
            else if(transtype == "Truck Issue"){
                var tarefno=" Item issued from scrap to dept. "+department;
                var tadebtamt= 0;
                var tacrdtamt= element['total'];
                var tdqty = 0;
                var tcqty = element['qty'];

                // posting in scrap ledger file
                element['scrap_id'] = save['_id'];
                var scrapLeg = new Scrapledgers(
                    {    
                        site:site,
                        itemname:element['name'],
                        avouno:receiptno,
                        arefno:tarefno,
                        adoctp:transtype,
                        adebtamt:tadebtamt,
                        acrdtamt:tacrdtamt,
                        avoudt:transdate,
                        dqty:tdqty,
                        cqty:tcqty,
                        user:null,
                        scrap_id:scrap_id
                    });
                    scrapLeg.save(function(i_err,i_save) {
                        console.log('items saveinfo ', i_err, i_save)
                        console.log(element['scrap_id'])
                    })

        
                // posting in truck ledger file
                var truckLeg = new Truckledgers(
                    {    
                        site:site,
                        truckno:department,
                        itemaccname:element['name'],
                        avouno:receiptno,
                        arefno:tarefno,
                        adoctp:transtype,
                        acrdtamt:tacrdtamt,
                        adebtamt:tadebtamt,
                        avoudt:transdate,
                        cqty:tcqty,
                        dqty:tdqty,
                        user:null,
                        truck_id:scrap_id
                });
                truckLeg.save(function(i_err,i_save) {
                    console.log('items saveinfo ', i_err, i_save)
                })
        
            }
        }); 

        // // vendor posting
        if(transtype == "Scrap Sale"){
            var tvarefno = "Scrap Sold to "+vendor+ " agnst Scrap Voucher No "+receiptno;
            var tvadebtamt= ttotal_amount;
            var tvacrdtamt= 0;

            var vendorLeg = new Accountsledgers(
                {    
                    branch:site,
                    accountname:vendor,
                    avouno:receiptno,
                    avoudt:transdate,
                    arefno:tvarefno,
                    adoctp:transtype,
                    adebtamt:tvadebtamt,
                    acrdtamt:tvacrdtamt,
                    user:req.params.user,
                    accounts_id:scrap_id
                });
            vendorLeg.save(function(i_err,i_save) {
                console.log('accounts Vendor saveinfo ', i_err, i_save)
            });
        }
            res.send(result);
    }).catch(function(err) {
        console.log('error', err)
        res.send(err);
    });
});

router.delete ('/:id', function(req, res, next) {
    console.log('Scrap Delete', req.params.id);
    
    Scraps.deleteOne({"_id": req.params.id}).then(function(deleteResult) {   
        Scrapledgers.deleteMany({ scrap_id: req.params.id }, function (err, result) {
            console.log(result)
            Truckledgers.deleteMany({ truck_id: req.params.id  }, function (err, result) {
                console.log(result)
                Accountsledgers.deleteMany({ accounts_id: req.params.id }, function (err, result) {
                    console.log(result)
                });
       
            });
        });
        res.send(deleteResult);

    }).catch(function(err) {
        res.send(err);
    });
});

router.post('/generate_ss_number', function(req, res) {
    // let ss_type = req.body.ss_type
    // Scraps.find({ ss_type: ss_type }).count(function (e, count) { 
    //     res.send({count: count});
    // })
    console.log(' matchcond', req.body);

    Scraps.find(req.body).count(function (e, count) { 
        res.send({count: count});
    })

});


module.exports = router;
