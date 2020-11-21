var express = require('express');
var router = express.Router();
var async = require('async');
var MaterialisSchema = require('../../models/inventory/material-issue');
var Materialis = require('../../models/inventory/material-issue')
var Scrapledgers = require('../../models/inventory/scrapledger');
var Orderledgers = require('../../models/inventory/orderledger');
var Itemledgers = require('../../models/inventory/itemledger');
var Truckledgers = require('../../models/inventory/truckledger');
var moment = require('moment');
var checkLogin = require('../middlewares/checkLogin');
var jwt = require('jsonwebtoken');

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
            Materialis.find({'$or': [sitematchCondition, { 'department': { $regex: regex }}, { 'user': { $regex: regex }}]}).count(function (e, count) {  
                Materialis.find({'$or': [sitematchCondition, { 'department': { $regex: regex }}, { 'user': { $regex: regex }}]}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
                res.send({ records: result, totalRecords: count });   
                });
            });

        } else {
            sitematchCondition = { site: req.user.site };
            console.log("ADMIN  >>>>>>>", sitematchCondition) ;
            Materialis.find({
                $and:[
                     {$or:[ 
                        { 'department': { $regex: regex }}, 
                        { 'user': { $regex: regex }}
                    ]},
                    sitematchCondition
                 ]}).count(function (e, count) {
                    Materialis.find({
                        $and:[
                             {$or:[
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

        Materialis.count(function (e, count) {  
            Materialis.find(matchCondition).sort({ mi_date: -1, mi_number: -1 }).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
            });
        });   
    }      
     
});


router.post('/', function (req, res, next) {
    // accounts posting starts
    var site = req.body.site;
    var department = req.body.department;
    var receiptno = req.body.mi_number;
    var transtype = req.body.mi_type;
    var trandate = req.body.mi_date;
    // accounts posting ends

    var user_name;
    jwt.verify(req.headers['x-auth'], 'secretPassword', function(err, decoded) {

        if (err) {
            console.log("err   >>>>>>>", err);
            return res.status(401).json({ statusCode: 401, code: "Invalid Token...!" });
        }

        user_name = decoded.split(":")[0];
    });
    
    req.body.user = user_name;

    var d = new Materialis(req.body);
    d.save(function (err, save) {
        req.body.materiali_items.forEach(element => {
          
        if(transtype == "Issue"){
            var tarefno = " Item issued to dept. "+department+ " agnst issue no "+receiptno;
            var tlarefno = " Item "+element['name']+ " issued"; 
            var tadebtamt= 0;
            var tacrdtamt= element['total'];
            var tdqty = 0;
            var tcqty = element['qty'];
        }
        else if(transtype == "Issue Return"){
            var tarefno=" Item return from "+department+ " agnst issue no "+receiptno;
            var tlarefno = " Item "+element['name']+ " returned"; 
            var tadebtamt= element['total'];
            var tacrdtamt= 0;
            var tdqty = element['qty'];
            var tcqty = 0;
        }

        element['litem_id'] = save['_id'];
        // posting in item ledger file
        var itemLeg = new Itemledgers(
            {    
                site:site,
                itemname:element['name'],
                avouno:receiptno,
                arefno:tarefno,
                adoctp:transtype,
                acrdtamt:tacrdtamt,
                adebtamt:tadebtamt,
                avoudt:trandate,
                cqty:tcqty,
                dqty:tdqty,
                user:null,
                // litem_id: element['litem_id']    
                litem_id: save['_id']
        });
        itemLeg.save(function(i_err,i_save) {
            console.log('items saveinfo ', i_err, i_save)
            // console.log(element['litem_id'])
        })


        // posting in truck ledger file
        var truckLeg = new Truckledgers(
            {    
                site:site,
                truckno:department,
                itemaccname:element['name'],
                avouno:receiptno,
                arefno:tlarefno,
                adoctp:transtype,
                acrdtamt:tacrdtamt,
                adebtamt:tadebtamt,
                avoudt:trandate,
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

        var trefund = element['refund'];
        var tmat_type = element['mat_type'];
        
        console.log(' Mat Type >>>', tmat_type);

        if(trefund == "Yes"){
            if(tmat_type == "Scrap"){
                var tarefno = " Scarp recd from  "+department+ " agnst issue no "+receiptno;
                var tadebtamt= 0;
                var tacrdtamt= 0;
                var tdqty = element['ref_qty'];
                var tcqty = 0;
    
                var ScrapLeg = new Scrapledgers(
                    {    
                        site:site,
                        itemname:element['name'],
                        avouno:receiptno,
                        arefno:tarefno,
                        adoctp:transtype,
                        acrdtamt:tacrdtamt,
                        adebtamt:tadebtamt,
                        avoudt:trandate,
                        cqty:tcqty,
                        dqty:tdqty,
                        user:null,
                        scrap_id:  save['_id']
                });
                ScrapLeg.save(function(i_err,i_save) {
                console.log('scrapledger saveinfo ', i_err, i_save)
                // console.log(element['litem_id'])
                })
            }
            else if(tmat_type == "Job"){
                var tarefno = " Job Order Placed for "+department+ " agnst issue no "+receiptno;
                var tadebtamt= 0;
                var tacrdtamt= 0;
                var tdqty = element['ref_qty'];
                var tcqty = 0;
    
                var OrderLeg = new Orderledgers(
                    {    
                        site:site,
                        itemname:element['name'],
                        avouno:receiptno,
                        arefno:tarefno,
                        adoctp:transtype,
                        acrdtamt:tacrdtamt,
                        adebtamt:tadebtamt,
                        avoudt:trandate,
                        cqty:tcqty,
                        dqty:tdqty,
                        user:null,
                        order_id:  save['_id']
                });
                OrderLeg.save(function(i_err,i_save) {
                console.log('Orderledger saveinfo ', i_err, i_save)
                // console.log(element['litem_id'])
                })
            }
        }
        }); 
        res.send(save);
    });
});


router.get('/:id', function(req, res) {
    Materialis.findOne({ _id: req.params.id }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});

router.put('/', function (req, res, next) {
    let post_data = req.body;
    let litem_id = req.query.id
    var site = req.body.site;
    var department = req.body.department;
    var receiptno = req.body.mi_number;
    var transtype = req.body.mi_type;
    var trandate = req.body.mi_date;
    var user_name;
    jwt.verify(req.headers['x-auth'], 'secretPassword', function(err, decoded) {

        if (err) {
            console.log("err   >>>>>>>", err);
            return res.status(401).json({ statusCode: 401, code: "Invalid Token...!" });
        }

        user_name = decoded.split(":")[0];
    });
    
    req.body.user = user_name;
    
    Materialis.update({_id:litem_id},{$set:{    
        mi_number: receiptno,
        mi_type: transtype,
        site: post_data.site,
        mi_date:post_data.mi_date,    
        department: post_data.department,
        issuedby: post_data.issuedby,
        issuedfor: post_data.issuedfor,
        mcreading: post_data.mcreading,
        narration: post_data.narration,
        rounded_off: post_data.rounded_off,
        net_amount: post_data.net_amount,
        total_amount: post_data.total_amount,
        round_off_type: post_data.round_off_type,
        user:req.body.user,
        materiali_items:post_data.materiali_items   
    }})
    .then(function(result) {
        
        console.log('litem_id',litem_id);

        Itemledgers.deleteMany({ litem_id: litem_id }, function (err, d_result) {
        });
        Orderledgers.deleteMany({ order_id: litem_id }, function (err, d_result) {
        });
        Scrapledgers.deleteMany({ scrap_id: litem_id }, function (err, d_result) {
        });
        Truckledgers.deleteMany({ truck_id: litem_id }, function (err, d_result) {
        });

        req.body.materiali_items.forEach(element => {

        console.log('transtype >>>>', transtype);
        console.log('USer Name >>>>', req.params.user);

        if(transtype == "Issue"){
            var tarefno = " Item issued to dept. "+department+ " agnst issue no "+receiptno;
            var tlarefno = " Item "+element['name']+ " issued"; 
            var tadebtamt= 0;
            var tacrdtamt= element['total'];
            var tdqty = 0;
            var tcqty = element['qty'];
            }
        else if(transtype == "Issue Return"){
            var tarefno=" Item return from "+department+ " agnst issue no "+receiptno;
            var tlarefno = " Item "+element['name']+ " returned"; 
            var tadebtamt= element['total'];
            var tacrdtamt= 0;
            var tdqty = element['qty'];
            var tcqty = 0;
        }

        var itemLeg = new Itemledgers(
            {    
                site:site,
                itemname:element['name'],
                avouno:receiptno,
                arefno:tarefno,
                adoctp:transtype,
                acrdtamt:tacrdtamt,
                adebtamt:tadebtamt,
                avoudt:trandate,
                cqty:tcqty,
                dqty:tdqty,
                user:req.params.user,
                litem_id:litem_id
                }
        );
        itemLeg.save(function(err,save) {
        console.log('itemledger _updated')
        })

        // posting in truck ledger file
        var truckLeg = new Truckledgers(
            {    
                site:site,
                truckno:department,
                itemaccname:element['name'],
                avouno:receiptno,
                arefno:tlarefno,
                adoctp:transtype,
                acrdtamt:tacrdtamt,
                adebtamt:tadebtamt,
                avoudt:trandate,
                cqty:tcqty,
                dqty:tdqty,
                user:null,
                truck_id: litem_id
            }
        );
        truckLeg.save(function(i_err,i_save) {
            console.log('items saveinfo ', i_err, i_save)
            console.log('Truckledger _updated')
            // console.log(element['litem_id'])
        })


        var trefund = element['refund'];
        var tmat_type = element['mat_type'];

        if(trefund == "Yes"){
            if(tmat_type == "Scrap"){
                var tarefno = " Scarp recd from  "+department+ " agnst issue no "+receiptno;
                var tadebtamt= 0;
                var tacrdtamt= 0;
                var tdqty = element['ref_qty'];
                var tcqty = 0;

                var ScrapLeg = new Scrapledgers(
                    {    
                        site:site,
                        itemname:element['name'],
                        avouno:receiptno,
                        arefno:tarefno,
                        adoctp:transtype,
                        acrdtamt:tacrdtamt,
                        adebtamt:tadebtamt,
                        avoudt:trandate,
                        cqty:tcqty,
                        dqty:tdqty,
                        user:req.params.user,
                        scrap_id:litem_id
                    });
                ScrapLeg.save(function(i_err,i_save) {
                    console.log('scrapledger saveinfo ', i_err, i_save)
                    // console.log(element['litem_id'])
                })
            }
            else if(tmat_type == "Job"){
                var tarefno = " Job Order Placed for "+department+ " agnst issue no "+receiptno;
                var tadebtamt= 0;
                var tacrdtamt= 0;
                var tdqty = element['ref_qty'];
                var tcqty = 0;
    
                var OrderLeg = new Orderledgers(
                    {    
                        site:site,
                        itemname:element['name'],
                        avouno:receiptno,
                        arefno:tarefno,
                        adoctp:transtype,
                        acrdtamt:tacrdtamt,
                        adebtamt:tadebtamt,
                        avoudt:trandate,
                        cqty:tcqty,
                        dqty:tdqty,
                        user:req.params.user,
                        order_id:litem_id
                });
                OrderLeg.save(function(i_err,i_save) {
                console.log('Orderledger saveinfo ', i_err, i_save)
                // console.log(element['litem_id'])
                })
            }
        }


    }); 
    res.send(result);
    }).catch(function(err) {
        console.log('error', err)
        res.send(err);
    });
});


router.delete ('/:id', function(req, res, next) {
    console.log('Material Issue Delete', req.params.id);
    
    Materialis.deleteOne({"_id": req.params.id}).then(function(deleteResult) {   

        Itemledgers.deleteMany({ litem_id: req.params.id }, function (err, result) {
            console.log(result)
            Orderledgers.deleteMany({ order_id:  req.params.id }, function (err, result) {
                console.log(result)
                
                Scrapledgers.deleteMany({ scrap_id: req.params.id }, function (err, result) {
                    console.log(result)
                    Truckledgers.deleteMany({ truck_id: req.params.id  }, function (err, result) {
                        console.log(result)
                    });
            
                });
            });
        });
        res.send(deleteResult);
    }).catch(function(err) {
        res.send(err);
    });
});


router.post('/generate_mi_number', function(req, res) {
    // let mi_type = req.body.mi_type
    // Materialis.find({ mi_type: mi_type }).count(function (e, count) { 
    //     res.send({count: count});
    // })
    console.log(' matchcond', req.body);

    Materialis.find(req.body).count(function (e, count) { 
        res.send({count: count});
    })

});


module.exports = router;
