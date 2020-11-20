var express = require('express');
var router = express.Router();
var async = require('async');
var MaterialrsSchema = require('../../models/inventory/material-receipt');
var Materialrs = require('../../models/inventory/material-receipt')
var Itemledgers = require('../../models/inventory/itemledger');
var Orderledgers = require('../../models/inventory/orderledger');
var Scrapledgers = require('../../models/inventory/scrapledger');
var Accountsledgers = require('../../models/accountsledger');
var moment = require('moment');
var momentTZ = require('moment-timezone');
var VendorMaster = require('../../models/vendor_master')
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
            Materialrs.find({'$or': [sitematchCondition, { 'mr_number': { $regex: regex }}, {'vendor': { $regex: regex }}, { 'department': { $regex: regex }}, { 'user': { $regex: regex }}]}).count(function (e, count) {  
                Materialrs.find({'$or': [sitematchCondition, { 'mr_number': { $regex: regex }}, {'vendor': { $regex: regex }}, { 'department': { $regex: regex }}, { 'user': { $regex: regex }}]}).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
                res.send({ records: result, totalRecords: count });   
                });
            });

        } else {
            sitematchCondition = { site: req.user.site };
            console.log("ADMIN  >>>>>>>", sitematchCondition) ;
            Materialrs.find({
                $and:[
                     {$or:[ 
                        { 'vendor': { $regex: regex }}, 
                        { 'department': { $regex: regex }}, 
                        { 'user': { $regex: regex }}
                    ]},
                    sitematchCondition
                 ]}).count(function (e, count) {
                    Materialrs.find({
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

        Materialrs.count(function (e, count) {  
            Materialrs.find(matchCondition).sort({ mr_date: -1, mr_number: -1 }).skip(parseInt(offset)).limit(parseInt(limit)).exec(function(err, result) {    
               res.send({ records: result, totalRecords: count });   
            });
        });   
    }      
     
});

router.post('/', function (req, res, next) {
    var site = req.body.site;
    var vendor = req.body.vendor;
    var department = req.body.department;
    var receiptno = req.body.mr_number;
    var transtype = req.body.mr_type;
    var receipttype = req.body.rec_type;
    
    var tgross_amount = req.body.gross_amount;
    var ttotal_amount = req.body.total_amount;
    var trandate = req.body.mr_date;
    var user_name;
    jwt.verify(req.headers['x-auth'], 'secretPassword', function(err, decoded) {

        if (err) {
            console.log("err   >>>>>>>", err);
            return res.status(401).json({ statusCode: 401, code: "Invalid Token...!" });
        }

        user_name = decoded.split(":")[0];
    });
    
    req.body.user = user_name;

    VendorMaster.findOne({ "name": vendor }).then(function(stateResult) {
        var vendorstate = stateResult.statename;
        console.log("Vendor State   >>>>", vendorstate);
        
        var d = new Materialrs(req.body);
        d.save(function (err, save) {
            req.body.materialr_items.forEach(element => {
    
              if(transtype == "Material Receipt"){
                var tarefno = " Item purchase from "+" "+vendor+" for dept. "+department;
                var tadebtamt= element['total'];
                var tacrdtamt= 0;
                var tdqty = element['qty'];
                var tcqty = 0;
                }
                else if(transtype == "Material Return"){
                    var tarefno=" Item return to "+" "+vendor+" of dept. "+department+ " agnst receipt no "+receiptno;
                    var tadebtamt= 0;
                    var tacrdtamt= element['total'];
                    var tdqty = 0;
                    var tcqty = element['qty'];
                }
    
                if(receipttype == "Direct" || receipttype == "Job Order" || receipttype == "Purchase Order" || receipttype == "Stock Transfer"){
                    element['litem_id'] = save['_id'];
                    var itemLeg = new Itemledgers(
                        {    
                            site:site,
                            itemname:element['name'],
                            avouno:receiptno,
                            arefno:tarefno,
                            avoudt:trandate,
                            adoctp:transtype,
                            user:req.params.user,
                            adebtamt:tadebtamt,
                            acrdtamt:tacrdtamt,
                            dqty:tdqty,
                            cqty:tcqty,
                            litem_id: element['litem_id']    
                        });
                      itemLeg.save(function(i_err,i_save) {
                        console.log('items saveinfo ', i_err, i_save)
                        console.log(element['litem_id'])
                      })
                }
                
                // tax posting
                if(receipttype == "Direct" || receipttype == "Purchase Order"){
                      // account posting
                      const tcgst_perc =  element['cgst']
                      const tsgst_perc =  element['sgst']
                      const tigst_perc =  element['igst']
                      
                      
                      const qty =  element['qty']
                      const price =  element['price']
                      const discount =  element['discount']
         
                      const original_price = qty * price;
                      const dis_difference = discount / 100;
                      const discounted_amount = original_price * dis_difference;
                      const discounted_price = original_price - discounted_amount;
                      
                      // individual tax calculation
                      const cgst_amount = parseFloat(tcgst_perc) / 100;
                      const cgsttaxamount = discounted_price * cgst_amount;
  
                      const sgst_amount = parseFloat(tsgst_perc) / 100;
                      const sgsttaxamount = discounted_price * sgst_amount;
  
                      const igst_amount = parseFloat(tigst_perc) / 100;
                      const igsttaxamount = discounted_price * igst_amount;
  
                      console.log('original_price >>>', original_price);
                      console.log('cgsttaxamount >>>', cgsttaxamount);
                      console.log('sgsttaxamount >>>', sgsttaxamount);
                      console.log('igsttaxamount >>>', igsttaxamount);
  
                        // cgst posting
                      if(tcgst_perc == 0){
                      }
                      else {
                          var taccountname = 'CGST INWARD @' +tcgst_perc+ '% ' +vendorstate;
                          if(transtype == "Material Receipt"){
                              var tcarefno = "Item " +element['name']+" purchase from "+vendor+" for dept. "+department+ " agnst receipt no "+receiptno;
                              var tcadebtamt= cgsttaxamount;
                              var tcacrdtamt= 0;
                              }
                              else if(transtype == "Material Return"){
                                  var tcarefno= "Item " +element['name']+ " return to "+vendor+" for dept. "+department+ " agnst receipt no "+receiptno;
                                  var tcadebtamt= 0;
                                  var tcacrdtamt= cgsttaxamount;
                              }
                              // 'CGST OUTWARD @' + this.cgst + '% ' + consignerState,
                          var cgstLeg = new Accountsledgers(
                              {    
                                  branch:site,
                                  accountname:taccountname,
                                  avouno:receiptno,
                                  avoudt:trandate,
                                  arefno:tcarefno,
                                  adoctp:transtype,
                                  adebtamt:tcadebtamt,
                                  acrdtamt:tcacrdtamt,
                                  user:req.params.user,
                                  accounts_id: save['_id']
                              });
                          cgstLeg.save(function(i_err,i_save) {
                              console.log('cgst saveinfo ', i_err, i_save)
                              // console.log(element['accounts_id'])
                          })
                      };
  
                      // sgst posting
                      if(tsgst_perc == 0){
                      }
                      else {
                          var taccountname = 'SGST INWARD @' +tsgst_perc+ '% ' +vendorstate;
                          if(transtype == "Material Receipt"){
                              var tsarefno = "Item " +element['name']+" purchase from "+vendor+" for dept. "+department+ " agnst receipt no "+receiptno;
                              var tsadebtamt= sgsttaxamount;
                              var tsacrdtamt= 0;
                              }
                              else if(transtype == "Material Return"){
                                  var tsarefno= "Item " +element['name']+ " return to "+vendor+" for dept. "+department+ " agnst receipt no "+receiptno;
                                  var tsadebtamt= 0;
                                  var tsacrdtamt= sgsttaxamount;
                              }
              
              
                          var sgstLeg = new Accountsledgers(
                          {    
                              branch:site,
                              accountname:taccountname,
                              avouno:receiptno,
                              avoudt:trandate,
                              arefno:tsarefno,
                              adoctp:transtype,
                              adebtamt:tsadebtamt,
                              acrdtamt:tsacrdtamt,
                              user:req.params.user,
                              accounts_id: save['_id']
                          });
                          sgstLeg.save(function(i_err,i_save) {
                          console.log('sgst saveinfo ', i_err, i_save)
                          // console.log(element['accounts_id'])
                          })
                      };
              
                      // igst posting
                      if(tigst_perc == 0){
                      }
                      else {
                          var taccountname = 'IGST INWARD @' +tigst_perc+ '% ' +vendorstate;
                          if(transtype == "Material Receipt"){
                              var tiarefno = "Item " +element['name']+" purchase from "+vendor+" for dept. "+department+ " agnst receipt no "+receiptno;
                              var tiadebtamt= igsttaxamount;
                              var tiacrdtamt= 0;
                              }
                              else if(transtype == "Material Return"){
                                  var tiarefno="Item " +element['name']+ " return to "+vendor+" for dept. "+department+ " agnst receipt no "+receiptno;
                                  var tiadebtamt= 0;
                                  var tiacrdtamt= igsttaxamount;
                              }
              
                              var igstLeg = new Accountsledgers(
                          {    
                              branch:site,
                              accountname:taccountname,
                              avouno:receiptno,
                              avoudt:trandate,
                              arefno:tiarefno,
                              adoctp:transtype,
                              adebtamt:tiadebtamt,
                              acrdtamt:tiacrdtamt,
                              user:req.params.user,
                              accounts_id: save['_id']
                          });
                          igstLeg.save(function(i_err,i_save) {
                          console.log('IGST saveinfo ', i_err, i_save)
                          console.log(element['accounts_id'])
                          })
                      };   
                }

                if(receipttype == "Job Order" || receipttype == "Purchase Order"){
                    element['order_id'] = save['_id'];
    
                    var orderLeg = new Orderledgers(
                      {    
                          site:site,
                          itemname:element['name'],
                          avouno:receiptno,
                          arefno:" Materials received against "+transtype+ " for " +department,
                          adoctp:transtype,
                          adebtamt:element['total'],
                          acrdtamt:0,
                          avoudt:trandate,
                          dqty:element['qty'],
                          cqty:0,
                          user:null,
                          order_id: element['order_id']    
                      });
                    orderLeg.save(function(i_err,i_save) {
                      console.log('items saveinfo ', i_err, i_save)
                      console.log(element['order_id'])
                    })
                                
                }

                if(receipttype == "Scrap"){
                    element['scrap_id'] = save['_id'];
                    var scrapLeg = new Scrapledgers(
                        {    
                            site:site,
                            itemname:element['name'],
                            avouno:receiptno,
                            arefno:receipttype+" received from "+department,
                            adoctp:transtype,
                            adebtamt:tadebtamt,
                            acrdtamt:tacrdtamt,
                            avoudt:trandate,
                            dqty:tdqty,
                            cqty:tcqty,
                            user:null,
                            scrap_id: element['scrap_id']    
                        });
                      scrapLeg.save(function(i_err,i_save) {
                        console.log('Scrap saveinfo ', i_err, i_save)
                        console.log(element['scrap_id'])
                      })
                }
    
            }); 
    
            // account posting
            //                         Dr.         Cr.
            // purchase a/c.         100
            // vendor posting                    220
            // cgst posting            60
            // sgst posting            60
            // igst posting             0
    
            // purchase a/c.
            // element['accounts_id:'] = save['_id'];
            if(receipttype == "Job Order" || receipttype == "Purchase Order" || receipttype == "Direct"){

                if(transtype == "Material Receipt"){
                    var tparefno = " Item purchase from "+vendor+" for dept. "+department+ " agnst receipt no "+receiptno;
                    var tpadebtamt=  tgross_amount;
                    var tpacrdtamt= 0;
                    }
                    else if(transtype == "Material Return"){
                        var tparefno=" Item return to "+vendor+" of dept. "+department+ " agnst receipt no "+receiptno;
                        var tpadebtamt= 0;
                        var tpacrdtamt= tgross_amount;
                    }
    
                var purchaseLeg = new Accountsledgers(
                    {    
                        branch:site,
                        accountname:"Purchase a/c.",
                        avouno:receiptno,
                        avoudt:trandate,
                        arefno:tparefno,
                        adoctp:transtype,
                        adebtamt:tpadebtamt,
                        acrdtamt:tpacrdtamt,
                        user:req.params.user,
                        accounts_id: save['_id']
                    });
                purchaseLeg.save(function(i_err,i_save) {
                    console.log('Purchase A/c. saveinfo ', i_err, i_save)
                    // console.log(element['accounts_id'])
                });
    
                // // vendor posting
                if(transtype == "Material Receipt"){
                    var tvarefno = "Item purchase for "+department+ " agnst receipt no "+receiptno;
                    var tvadebtamt= 0;
                    var tvacrdtamt= ttotal_amount;
                    }
                    else if(transtype == "Material Return"){
                        var tvarefno=" Item return from "+department+ " agnst receipt no "+receiptno;
                        var tvadebtamt= ttotal_amount;
                        var tvacrdtamt= 0;
                    };
        
                var vendorLeg = new Accountsledgers(
                    {    
                        branch:site,
                        accountname:vendor,
                        avouno:receiptno,
                        avoudt:trandate,
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
            }
            res.send(save);
        });

    }).catch(function(err) {
        console.log("err   >>>>",err);
        res.send(err);
    }); 
});

router.get('/:id', function(req, res) {
    Materialrs.findOne({ _id: req.params.id }, (err, item) => {
      if (err) { return console.error(err); }
      res.send(item);
    });
});


router.put('/', function (req, res, next) {
    let post_data = req.body;
    let litem_id = req.query.id;
    var site = req.body.site;
    var vendor = req.body.vendor;
    var department = req.body.department;
    var receiptno = req.body.mr_number;
    var transtype = req.body.mr_type;
    var receipttype = req.body.rec_type;
    var tgross_amount = req.body.gross_amount;
    var ttotal_amount = req.body.total_amount;
    var trandate = req.body.mr_date;
    
    var user_name;
    jwt.verify(req.headers['x-auth'], 'secretPassword', function(err, decoded) {

        if (err) {
            console.log("err   >>>>>>>", err);
            return res.status(401).json({ statusCode: 401, code: "Invalid Token...!" });
        }

        user_name = decoded.split(":")[0];
    });
    
    req.body.user = user_name;

    Materialrs.update({_id:litem_id},{$set:{    
        mr_number: post_data.mr_number,
        mr_type: post_data.mr_type,
        site: post_data.site,
        mr_date:post_data.mr_date,    
        vendor:post_data.vendor,
        department: post_data.department,
        godown: post_data.godown,
        rec_type: post_data.rec_type,
        invno: post_data.invno,
        invdate:post_data.invdate,
        pjno: post_data.pjno,
        narration: post_data.narration,
        terms_and_conditions: post_data.terms_and_conditions,
        rounded_off: post_data.rounded_off,
        gross_amount: post_data.gross_amount,
        cgst_amount: post_data.cgst_amount,
        sgst_amount: post_data.sgst_amount,
        igst_amount: post_data.igst_amount,
        net_amount: post_data.net_amount,
        total_amount: post_data.total_amount,
        round_off_type: post_data.round_off_type,
        user: req.body.user,
        materialr_items:post_data.materialr_items   
    }})
    .then(function(result) {
        console.log('litem_id',litem_id);

        Itemledgers.deleteMany({ litem_id: litem_id }, function (err, d_result) {
        });
        
        Orderledgers.deleteMany({ order_id: litem_id }, function (err, d_result) {
        });
        
        Scrapledgers.deleteMany({ scrap_id: litem_id }, function (err, d_result) {
        });

        Accountsledgers.deleteMany({ accounts_id: litem_id }, function (err, d_result) {
        });

        VendorMaster.findOne({ "name": vendor }).then(function(stateResult) {
            console.log("Vendor State   >>>>", stateResult);
            var vendorstate = stateResult.statename;
            console.log("Vendor State   >>>>", vendorstate);
            req.body.materialr_items.forEach(element => {
                
                
                if(transtype == "Material Receipt"){
                  var tarefno = "Item purchase from "+vendor+" for dept. "+department;
                  var tadebtamt= element['total'];
                  var tacrdtamt= 0;
                  var tdqty = element['qty'];
                  var tcqty = 0;
                }
                else if(transtype == "Material Return"){
                    var tarefno="Item return to "+vendor+" of dept. "+department;
                    var tadebtamt= 0;
                    var tacrdtamt= element['total'];
                    var tdqty = 0;
                    var tcqty = element['qty'];
                }

                if(receipttype == "Direct" || receipttype == "Job Order" || receipttype == "Purchase Order" || receipttype == "Stock Transfer"){
                    var itemLeg = new Itemledgers(
                        {    
                            site:site,
                            itemname:element['name'],
                            avouno:receiptno,
                            arefno:tarefno,
                            avoudt:trandate,
                            adoctp:transtype,
                            adebtamt:tadebtamt,
                            acrdtamt:tacrdtamt,
                            dqty:tdqty,
                            cqty:tcqty,
                            litem_id:litem_id,
                            user:req.params.user
                        }
                    );
                    itemLeg.save(function(i_err,i_save) {
                    })
      
       
                    }
                    if(receipttype == "Job Order" || receipttype == "Purchase Order"){
                        //   element['order_id'] = save['_id'];
        
                        var orderLeg = new Orderledgers(
                            {    
                                site:site,
                                itemname:element['name'],
                                avouno:receiptno,
                                arefno:" Materials received against "+transtype+ " for " +department,
                                adoctp:transtype,
                                adebtamt:element['total'],
                                acrdtamt:0,
                                avoudt:trandate,
                                dqty:element['qty'],
                                cqty:0,
                                user:null,
                                order_id: litem_id
                            });
                        orderLeg.save(function(i_err,i_save) {
                            // console.log('items saveinfo ', i_err, i_save)
                            // console.log(element['order_id'])
                        })
                                    
                    }
                                    // tax posting
                    if(receipttype == "Direct" || receipttype == "Purchase Order"){
                    // account posting
                    const tcgst_perc =  element['cgst']
                    const tsgst_perc =  element['sgst']
                    const tigst_perc =  element['igst']
                    
                    const qty =  element['qty']
                    const price =  element['price']
                    const discount =  element['discount']
        
                    const original_price = qty * price;
                    const dis_difference = discount / 100;
                    const discounted_amount = original_price * dis_difference;
                    const discounted_price = original_price - discounted_amount;
                      
                    // individual tax calculation
                    const cgst_amount = parseFloat(tcgst_perc) / 100;
                    const cgsttaxamount = discounted_price * cgst_amount;

                    const sgst_amount = parseFloat(tsgst_perc) / 100;
                    const sgsttaxamount = discounted_price * sgst_amount;

                    const igst_amount = parseFloat(tigst_perc) / 100;
                    const igsttaxamount = discounted_price * igst_amount;

                    console.log('original_price >>>', original_price);
                    console.log('cgsttaxamount >>>', cgsttaxamount);
                    console.log('sgsttaxamount >>>', sgsttaxamount);
                    console.log('igsttaxamount >>>', igsttaxamount);
  
                        // cgst posting
                    if(tcgst_perc == 0){
                    }
                    else {
                        var taccountname = 'CGST INWARD @' +tcgst_perc+ '% ' +vendorstate;
                        if(transtype == "Material Receipt"){
                            var tcarefno = "Item " +element['name']+" purchase from "+vendor+" for dept. "+department+ " agnst receipt no "+receiptno;
                            var tcadebtamt= cgsttaxamount;
                            var tcacrdtamt= 0;
                            }
                            else if(transtype == "Material Return"){
                                var tcarefno= "Item " +element['name']+ " return to "+vendor+" for dept. "+department+ " agnst receipt no "+receiptno;
                                var tcadebtamt= 0;
                                var tcacrdtamt= cgsttaxamount;
                            }
                            // 'CGST OUTWARD @' + this.cgst + '% ' + consignerState,
                        var cgstLeg = new Accountsledgers(
                            {    
                                branch:site,
                                accountname:taccountname,
                                avouno:receiptno,
                                avoudt:trandate,
                                arefno:tcarefno,
                                adoctp:transtype,
                                adebtamt:tcadebtamt,
                                acrdtamt:tcacrdtamt,
                                user:req.params.user,
                                accounts_id: litem_id
                            });
                        cgstLeg.save(function(i_err,i_save) {
                            // console.log('accounts saveinfo ', i_err, i_save)
                            // console.log(element['accounts_id'])
                        })
                    };
  
                    // sgst posting
                    if(tsgst_perc == 0){
                    }
                    else {
                        var taccountname = 'SGST INWARD @' +tsgst_perc+ '% ' +vendorstate;
                        if(transtype == "Material Receipt"){
                            var tsarefno = "Item " +element['name']+" purchase from "+vendor+" for dept. "+department+ " agnst receipt no "+receiptno;
                            var tsadebtamt= sgsttaxamount;
                            var tsacrdtamt= 0;
  
                        }
                            else if(transtype == "Material Return"){
                                var tsarefno= "Item " +element['name']+ " return to "+vendor+" for dept. "+department+ " agnst receipt no "+receiptno;
                                var tsadebtamt= 0;
                                var tsacrdtamt= sgsttaxamount;
                            }
                            var sgstLeg = new Accountsledgers(
                            {    
                                branch:site,
                                accountname:taccountname,
                                avouno:receiptno,
                                avoudt:trandate,
                                arefno:tsarefno,
                                adoctp:transtype,
                                adebtamt:tsadebtamt,
                                acrdtamt:tsacrdtamt,
                                user:req.params.user,
                                accounts_id: litem_id
                            });
                            sgstLeg.save(function(i_err,i_save) {
                        })
                    };

                        // igst posting
                        if(tigst_perc == 0){
                        }
                        else {
                            var taccountname = 'IGST INWARD @' +tigst_perc+ '% ' +vendorstate;
                            if(transtype == "Material Receipt"){
                                var tiarefno = "Item " +element['name']+" purchase from "+vendor+" for dept. "+department+ " agnst receipt no "+receiptno;
                                var tiadebtamt= igsttaxamount;
                                var tiacrdtamt= 0;
                                }
                                else if(transtype == "Material Return"){
                                    var tiarefno="Item " +element['name']+ " return to "+vendor+" for dept. "+department+ " agnst receipt no "+receiptno;
                                    var tiadebtamt= 0;
                                    var tiacrdtamt= igsttaxamount;
                                }
                
                                var igstLeg = new Accountsledgers(
                            {    
                                branch:site,
                                accountname:taccountname,
                                avouno:receiptno,
                                avoudt:trandate,
                                arefno:tiarefno,
                                adoctp:transtype,
                                adebtamt:tiadebtamt,
                                acrdtamt:tiacrdtamt,
                                user:req.params.user,
                                accounts_id: litem_id
                            });
                            igstLeg.save(function(i_err,i_save) {
                            //   console.log('accounts saveinfo ', i_err, i_save)
                            //   console.log(element['accounts_id'])
                            })
                        };                            
                    }

                    if(receipttype == "Scrap"){
                        element['scrap_id'] = save['_id'];
                        var scrapLeg = new Scrapledgers(
                            {    
                                site:site,
                                itemname:element['name'],
                                avouno:receiptno,
                                arefno:receipttype+" received from "+department,
                                adoctp:transtype,
                                adebtamt:tadebtamt,
                                acrdtamt:tacrdtamt,
                                avoudt:trandate,
                                dqty:tdqty,
                                cqty:tcqty,
                                user:null,
                                scrap_id: litem_id
                            });
                            scrapLeg.save(function(i_err,i_save) {
                            //   console.log('Scrap saveinfo ', i_err, i_save)
                            //   console.log(element['scrap_id'])
                            })
                    }
                }); 
      
                // account posting
                //                         Dr.         Cr.
                // purchase a/c.         100
                // vendor posting                    220
                // cgst posting            60
                // sgst posting            60
                // igst posting             0
        
                // purchase a/c.
                // element['accounts_id:'] = save['_id'];
                if(receipttype == "Job Order" || receipttype == "Purchase Order" || receipttype == "Direct"){
                    if(transtype == "Material Receipt"){
                        var tparefno = " Item purchase from "+vendor+" for dept. "+department;
                        var tpadebtamt=  tgross_amount;
                        var tpacrdtamt= 0;
                        }
                        else if(transtype == "Material Return"){
                            var tparefno=" Item return to "+vendor+" of dept. "+department;
                            var tpadebtamt= 0;
                            var tpacrdtamt= tgross_amount;
                      }
            
                      var purchaseLeg = new Accountsledgers(
                          {    
                              branch:site,
                              accountname:"Purchase a/c.",
                              avouno:receiptno,
                              avoudt:trandate,
                              arefno:tparefno,
                              adoctp:transtype,
                              adebtamt:tpadebtamt,
                              acrdtamt:tpacrdtamt,
                              user:req.params.user,
                              accounts_id: litem_id
                          });
                      purchaseLeg.save(function(i_err,i_save) {
                          // console.log('accounts saveinfo ', i_err, i_save)
                          // console.log(element['accounts_id'])
                      });
            
                      // // vendor posting
                      if(transtype == "Material Receipt"){
                          var tvarefno = "Item purchase for "+department+ " agnst receipt no "+receiptno;
                          var tvadebtamt= 0;
                          var tvacrdtamt= ttotal_amount;
                          }
                          else if(transtype == "Material Return"){
                              var tvarefno=" Item return from "+department+ " agnst receipt no "+receiptno;
                              var tvadebtamt= ttotal_amount;
                              var tvacrdtamt= 0;
                          };
            
                          var vendorLeg = new Accountsledgers(
                              {    
                                  branch:site,
                                  accountname:vendor,
                                  avouno:receiptno,
                                  avoudt:trandate,
                                  arefno:tvarefno,
                                  adoctp:transtype,
                                  adebtamt:tvadebtamt,
                                  acrdtamt:tvacrdtamt,
                                  user:req.params.user,
                                  accounts_id: litem_id
                              });
                          vendorLeg.save(function(i_err,i_save) {
                              // console.log('accounts saveinfo ', i_err, i_save)
                              // console.log(element['accounts_id'])
                          });
                    }

                    // res.send(save);
                }).catch(function(err) {
                    console.log("err   >>>>",err);
                    res.send(err);
                }); 
    
                res.send(result);
    }).catch(function(err) {
        console.log('error', err)
        res.send(err);
    });
});



router.delete ('/:id', function(req, res, next) {
    console.log('Material Receipt Delete', req.params.id);
    
    Materialrs.deleteOne({"_id": req.params.id}).then(function(deleteResult) {   
        Itemledgers.deleteMany({ litem_id: req.params.id }, function (err, result) {
            console.log(result)
            Orderledgers.deleteMany({ order_id: req.params.id }, function (err, result) {
                console.log(result)
                // res.send(deleteResult);
                Scrapledgers.deleteMany({ scrap_id: req.params.id }, function (err, result) {
                    console.log(result)
                    // res.send(deleteResult);
                    Accountsledgers.deleteMany({ accounts_id: req.params.id }, function (err, result) {
                        console.log(result)
                        // res.send(deleteResult);
                    });
                });

            });
        });
        res.send(deleteResult);
    }).catch(function(err) {
        res.send(err);
    });
});

router.post('/generate_mr_number', function(req, res) {

    console.log(' generate_mr_number matchcond', req.body);

    Materialrs.find(req.body).count(function (e, count) { 
        res.send({count: count});
    })
});


module.exports = router;