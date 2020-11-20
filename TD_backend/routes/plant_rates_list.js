var express = require('express');
var router = express.Router();
var async = require('async');
var PlantRateList = require('../models/plant_rates_list');
var Billtiy = require('../models/billties');
var Trucks = require('../models/trucks');
var AccountsLedger = require('../models/accountsledger');
var multer = require('multer');
var XLSX = require('xlsx');
var RateList = require('../models/rates');
var moment = require('moment');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})
var upload = multer({storage: storage});

router.post("/data", upload.single('file'), function(req, res, next){

    truckType = "";
    checkTruckType = false;
    tyoeOfT = "";
   
    var getRate = function(objData) {
        return function (callback) {
            var startDate = moment(objData.date_from).format("YYYY-MM-DD");
            var endDate = moment(objData.date_to).format("YYYY-MM-DD");
            var matchCondition = { 
                "from": objData.site, 
                "to": objData.destination,
                "lrdate": {
                    $gte: startDate,
                    $lte: endDate
                }
             };

            Billtiy.find(matchCondition).then(function(results) {

                if(!results[0]) {
                    console.log("No >>", matchCondition);
                    callback(null, '');
                } else {
                    // callback(null, '');
                    console.log("Yes >>", matchCondition);

                    var truckNoList = [];
                    var lrNoList = [];
                    results.forEach(tn => {
                        truckNoList.push(tn.truckno);
                        lrNoList.push(tn.lrno);
                        
                    });

                    var i = 1;
                    results.forEach(result => {

                        console.log("To >>>>>", objData.destination, "   Truck No >>", truckNoList);
                        
                        
                    
                        var update_newrate = objData.freight  // file like 100
                        var update_newamount = result.actualweight * objData.freight; // 100 * 29 *

                        Trucks.findOne({"truckno": result.truckno}).then(function(trucksResult) {
                            if(!trucksResult) {
                                console.log("No");
                                callback(null, '');
                            } else {
                                
                                if (!checkTruckType) {
                                    if( truckType == 'TON' ) {
                                        if( Number(trucksResult.newcarring) <= 11 ) {
                                            tyoeOfT = 'U11';
                                            checkTruckType = true;
                                        } else if( (Number(trucksResult.newcarring) > 11) && (Number(trucksResult.newcarring) <= 26) ) {
                                            tyoeOfT = 'U26';
                                            checkTruckType = true;
                                        } else if( Number(trucksResult.newcarring) > 26 ) {
                                            tyoeOfT = 'A26';
                                            checkTruckType = true;
                                        }
                                    } else if( truckType == 'SPI' ) {
                                        tyoeOfT = 'SPI';
                                        checkTruckType = true;
                                    } else {
                                        if( Number(trucksResult.type) <= 6 ) {
                                            tyoeOfT = 'U9';
                                            checkTruckType = true;
                                        } else if( (Number(trucksResult.type) > 6) && (Number(trucksResult.type) <= 12) ) {
                                            tyoeOfT = 'U26';
                                            checkTruckType = true;
                                        } else {
                                            tyoeOfT = 'U31';
                                            checkTruckType = true;
                                        }
                                    }
                                }



                                if( tyoeOfT == 'SPI') {                      // <---------------------------------------- IF
                                    console.log("Truck >>", trucksResult.newcommision);
                                    var update_rate;
                                    var update_vamount;
                                    var update_finalamount;
                                    if (trucksResult.newcommision == "Weight"){
                                        update_rate = result.rate - trucksResult.newrates;
                                        update_vamount = update_rate * result.cweight;
                                        update_finalamount = update_vamount - result.paymentcharge;

                                        // console.log("Weight >>>>>>", update_vamount, " paymentcharge :", result.paymentcharge, " Finalamount : ", update_finalamount);
                                        // callback(null, '');
                                    } 
                                    if ( trucksResult.newcommision == "Percentage" ) {
                                        var aa = (result.rate * trucksResult.newrates) / 100;
                                        update_rate = result.rate - aa;
                                        update_vamount = update_rate * result.cweight;
                                        update_finalamount = update_vamount - result.paymentcharge;

                                        // console.log("Percentage >>>>>>", update_vamount, " Finalamount : ", update_finalamount );
                                        // callback(null, '');
                                    } 

                                    Billtiy.update({ "_id": result._id}, 
                                        { "$set": {
                                        "newrate": update_newrate,
                                        "newamount": update_newamount,
                                        "rate": update_rate,
                                        "vamount": update_vamount,
                                        "finalamount": update_finalamount
                                    }}).then(function(trucksUpdateResult) {

                                        //  Delete Old Record
                                        var avouno = result.lrno;
                                        var branch = result.site
                                        var adoctp = "Billty"
                                        // var  query =  {"avouno": {$in: lrNoList},"branch":branch,"adoctp":adoctp};
                                        var  query =  {"avouno": avouno,"branch":branch,"adoctp":adoctp};

                                        // console.log("delete ---------------------------->>>>>>>", query);
                                        AccountsLedger.deleteMany(query).then(function(deleteResult) {   
                                            var latestflag = 10;
                                            //  Add New Record --------------

                                            if(result.ppaymentmode == 'To Be Billed') {
                                                let consignerLedger = new AccountsLedger({
                                                    branch: result.site,
                                                    accountname: result.consigner + " TPT INC",
                                                    avouno: result.lrno,
                                                    arefno:"Freight from "+ result.from +" to "+ result.to+" agnst Lr No. "+ result.lrno+" - "+result.truckno,
                                                    adoctp:"Billty",
                                                    adebtamt:0,
                                                    acrdtamt: update_newamount,
                                                    avoudt:result.lrdate,
                                                    flag: latestflag + 1,
                                                    user: result.username
                                                })
                                
                                                console.log(result.consigner, " <-- ", update_newamount, " New Record --------------> ", result.actualweight, " >>> ", objData.freight);
                                                let consignerLedger2 = new AccountsLedger({
                                                    branch: result.site,
                                                    accountname: result.consigner + " UNBILLED A/C.",
                                                    avouno: result.lrno,
                                                    arefno:"Freight from "+ result.from +" to "+ result.to +" agnst Lr No. "+ result.lrno +" - "+ result.truckno,
                                                    adoctp:"Billty",
                                                    adebtamt: update_newamount,
                                                    acrdtamt:0,
                                                    avoudt: result.lrdate,
                                                    flag: latestflag + 1,
                                                    user: result.username
                                                })
                                
                                                consignerLedger.save(function (err, res) {
                                                console.log("CONSIGNER ENTRY 1 >>>>", err, res);
                                                });
                                                consignerLedger2.save(function (err, res) {
                                                    console.log("CONSIGNER ENTRY 2 >>>>", err, res);
                                                });
                                            }

                                            let newAccountsledger0 = new AccountsLedger({
                                                branch: result.site,
                                                accountname: result.consigner + " TPT CHARGES",
                                                avouno:result.lrno,
                                                arefno:"Freight From "+result.from+" To "+result.to+" agnst Lr No. "+result.lrno+" - "+result.truckno,
                                                adoctp:"Billty",
                                                adebtamt:update_finalamount,
                                                acrdtamt:0,
                                                avoudt:result.lrdate,
                                                flag: latestflag+1,
                                                user: result.username
                                            });
                                            
                                        
                                            let newAccountsledger10 = new AccountsLedger({
                                                branch: result.site,
                                                accountname:result.truckno,
                                                avouno:result.lrno,
                                                arefno:"Freight From "+result.from+" To "+result.to+" agnst Lr No. "+result.lrno,
                                                adoctp:"Billty",
                                                adebtamt:0,
                                                acrdtamt:update_finalamount,
                                                avoudt:result.lrdate,
                                                flag:latestflag+1,
                                                user:result.username
                                            })
                                        
                                            let newAccountsledgeraur2 = new AccountsLedger({
                                                branch: result.site,
                                                accountname:result.truckno,
                                                avouno:result.lrno,
                                                arefno:result.dtransactiontype+" Slip No. "+result.dslipno+ " "+result.dqty+ " Ltr. diesel paid agnst Lr No. "+result.lrno+" - "+result.dieselaccountname,
                                                adoctp:"Billty",
                                                adebtamt:result.damount,
                                                acrdtamt:0,
                                                avoudt:result.lrdate,
                                                flag:latestflag+1,
                                                user:result.username
                                            })
                                        
                                        
                                            let newAccountsledgeraur3 = new AccountsLedger({
                                                branch: result.site,
                                                accountname:result.dieselaccountname,
                                                avouno:result.lrno,
                                                arefno:result.dtransactiontype+" Slip No. "+result.dslipno+ " "+result.dqty+ " Ltr. diesel paid agnst Lr No. "+result.lrno+" - "+result.truckno,
                                                adoctp:"Billty",
                                                adebtamt:0,
                                                acrdtamt:result.damount,
                                                avoudt:result.lrdate,
                                                flag:latestflag+1,
                                                user:result.username
                                            })
                                        
                                        
                                            // let newAccountsledgerTBB3 = new AccountsLedger({
                                            //     branch: result.site,
                                            //     accountname:"TPT INC",
                                            //     avouno:result.lrno,
                                            //     arefno:"Advance recd. agnst freight from "+result.from+" to "+result.to+" agnst Lr No. "+result.lrno+" - "+result.truckno,
                                            //     adoctp:"Billty",
                                            //     adebtamt:0,
                                            //     acrdtamt:result.padvance,
                                            //     avoudt:result.padate,
                                            //     flag:latestflag+1,
                                            //     user:result.username
                                            // })
                                        
                                            let newAccountsledgerTBB4 = new AccountsLedger({
                                                branch: result.site,
                                                accountname:result.papaymentmode,
                                                avouno:result.lrno,
                                                arefno:"Advance recd. from "+result.consigner+" agnst Lr No. "+result.lrno+" - "+result.truckno,
                                                adoctp:"Billty",
                                                adebtamt:result.padvance,
                                                acrdtamt:0,
                                                avoudt:result.padate,
                                                flag: latestflag+1,
                                                user: result.username
                                            })
                                        
                                            newAccountsledger0.save();
                                            newAccountsledger10.save();
                                            newAccountsledgerTBB4.save();
                                        
                                            // newAccountsledgeraur2.save();
                                            // newAccountsledgeraur3.save();

                                            result.transactiondetails.forEach(element => {

                                                let newAccountsledgerwanted = new AccountsLedger({

                                                    branch: result.site,
                                                    accountname: element.paymentmode,
                                                    avouno: result.lrno,
                                                    arefno: element.accountname +" paid agnst Lr No. "+ result.lrno+" - "+ result.truckno,
                                                    adoctp: "Billty",
                                                    adebtamt: 0,
                                                    acrdtamt: element.amount,
                                                    avoudt: element.date,
                                                    flag: latestflag+1,
                                                    user: result.username
                                                });
                                        
                                                newAccountsledgerwanted.save(function(err, result){
                                                    console.log(" PAYMENT MODE ADV > ", err, result);
                                                });
                                        
                                        
                                                let newAccountsledger20 = new AccountsLedger({
                                            
                                                    branch: result.site,
                                                    accountname: result.truckno,
                                                    avouno: result.lrno,
                                                    arefno: element.accountname +" paid agnst Lr No. "+ result.lrno,
                                                    adoctp: "Billty",
                                                    adebtamt: element.amount,
                                                    acrdtamt: 0,
                                                    avoudt: element.date,
                                                    flag: latestflag+1,
                                                    user: result.username
                                            
                                                });
                                                newAccountsledger20.save(function(err, result){
                                                    console.log(" TRUCKNO > ", err, result);
                                                });
                                                
                                            });
                                        
                                            
                                            if((result.damount != null)&&(result.damount != "0")&&(result.damount != 0)){
                                                console.log(">>>>>>> Add Ledger 1 ");
                                                
                                                newAccountsledgeraur2.save(function (err, save) {
                                                    console.log("err  >>>",err);
                                                    console.log("save  >>>",save); 
                                                });

                                                newAccountsledgeraur3.save(function (err, save) {
                                                    console.log("err  >>>",err);
                                                    console.log("save  >>>",save); 
                                                });
                                            
                                                // callback(null, '');
                                            } else if((result.padvance != null)&&(result.padvance != "0")&&(result.padvance != 0)){
                                                console.log(">>>>>>> Add Ledger 2");
                                                // newAccountsledgerTBB3.save();
                                                // newAccountsledgerTBB4.save();
                                                // callback(null, '');
                                            } else {
                                                console.log(">>>>>>> Not Add Ledger");
                                                // callback(null, '');
                                            }

                                        }).catch(function(err) {
                                            console.log("Delete Error >>>", err);
                                            callback(err, null);
                                        });
                                    }).catch(function(err) {
                                        console.log("Update Error >>>", err);
                                        callback(err, null);
                                    });


                                } else {                                     // <---------------------------------------- Else

                                    if( objData.spi == tyoeOfT) {            // <---------------------------------------- Else 

                                        console.log("Truck >>", trucksResult.newcommision);
                                        var update_rate;
                                        var update_vamount;
                                        var update_finalamount;
                                        if (trucksResult.newcommision == "Weight"){
                                            update_rate = result.rate - trucksResult.newrates;
                                            update_vamount = update_rate * result.cweight;
                                            update_finalamount = update_vamount - result.paymentcharge;

                                            // console.log("Weight >>>>>>", update_vamount, " paymentcharge :", result.paymentcharge, " Finalamount : ", update_finalamount);
                                            // callback(null, '');
                                        } 
                                        if ( trucksResult.newcommision == "Percentage" ) {
                                            var aa = (result.rate * trucksResult.newrates) / 100;
                                            update_rate = result.rate - aa;
                                            update_vamount = update_rate * result.cweight;
                                            update_finalamount = update_vamount - result.paymentcharge;

                                            // console.log("Percentage >>>>>>", update_vamount, " Finalamount : ", update_finalamount );
                                            // callback(null, '');
                                        } 

                                        Billtiy.update({ "_id": result._id}, 
                                            { "$set": {
                                            "newrate": update_newrate,
                                            "newamount": update_newamount,
                                            "vamount": update_vamount,
                                            "finalamount": update_finalamount
                                        }}).then(function(trucksUpdateResult) {

                                            //  Delete Old Record
                                            var avouno = result.lrno;
                                            var branch = result.site
                                            var adoctp = "Billty"
                                            var  query =  {"avouno":avouno,"branch":branch,"adoctp":adoctp};
                                            AccountsLedger.remove(query).then(function(deleteResult) {   
                                                var latestflag = 10;
                                                //  Add New Record --------------

                                                if(result.ppaymentmode == 'To Be Billed') {
                                                    let consignerLedger = new Accountsledger({
                                                        branch: result.site,
                                                        accountname: result.consigner + " TPT INC",
                                                        avouno: result.lrno,
                                                        arefno:"Freight from "+ result.from +" to "+ result.to+" agnst Lr No. "+ result.lrno+" - "+result.truckno,
                                                        adoctp:"Billty",
                                                        adebtamt:0,
                                                        acrdtamt: update_newamount,
                                                        avoudt:result.lrdate,
                                                        flag: latestflag + 1,
                                                        user: result.username
                                                    })
                                    
                                    
                                                    let consignerLedger2 = new Accountsledger({
                                                        branch: result.site,
                                                        accountname: consigner + " UNBILLED A/C.",
                                                        avouno: result.lrno,
                                                        arefno:"Freight from "+ result.from +" to "+ result.to +" agnst Lr No. "+ result.lrno +" - "+ result.truckno,
                                                        adoctp:"Billty",
                                                        adebtamt: update_newamount,
                                                        acrdtamt:0,
                                                        avoudt: result.lrdate,
                                                        flag: latestflag + 1,
                                                        user: result.username
                                                    })
                                    
                                                    consignerLedger.save(function (err, res) {
                                                    console.log("CONSIGNER ENTRY 1 >>>>", err, res);
                                                    });
                                                    consignerLedger2.save(function (err, res) {
                                                        console.log("CONSIGNER ENTRY 2 >>>>", err, res);
                                                    });
                                                }

                                                let newAccountsledger0 = new AccountsLedger({
                                                    branch: result.site,
                                                    accountname: result.consigner + " TPT CHARGES",
                                                    avouno:result.lrno,
                                                    arefno:"Freight From "+result.from+" To "+result.to+" agnst Lr No. "+result.lrno+" - "+result.truckno,
                                                    adoctp:"Billty",
                                                    adebtamt:update_finalamount,
                                                    acrdtamt:0,
                                                    avoudt:result.lrdate,
                                                    flag: latestflag+1,
                                                    user: result.username
                                                });
                                                
                                            
                                                let newAccountsledger10 = new AccountsLedger({
                                                    branch: result.site,
                                                    accountname:result.truckno,
                                                    avouno:result.lrno,
                                                    arefno:"Freight From "+result.from+" To "+result.to+" agnst Lr No. "+result.lrno,
                                                    adoctp:"Billty",
                                                    adebtamt:0,
                                                    acrdtamt:update_finalamount,
                                                    avoudt:result.lrdate,
                                                    flag:latestflag+1,
                                                    user:result.username
                                                })
                                            
                                                let newAccountsledgeraur2 = new AccountsLedger({
                                                    branch: result.site,
                                                    accountname:result.truckno,
                                                    avouno:result.lrno,
                                                    arefno:result.dtransactiontype+" Slip No. "+result.dslipno+ " "+result.dqty+ " Ltr. diesel paid agnst Lr No. "+result.lrno+" - "+result.dieselaccountname,
                                                    adoctp:"Billty",
                                                    adebtamt:result.damount,
                                                    acrdtamt:0,
                                                    avoudt:result.lrdate,
                                                    flag:latestflag+1,
                                                    user:result.username
                                                })
                                            
                                            
                                                let newAccountsledgeraur3 = new AccountsLedger({
                                                    branch: result.site,
                                                    accountname:result.dieselaccountname,
                                                    avouno:result.lrno,
                                                    arefno:result.dtransactiontype+" Slip No. "+result.dslipno+ " "+result.dqty+ " Ltr. diesel paid agnst Lr No. "+result.lrno+" - "+result.truckno,
                                                    adoctp:"Billty",
                                                    adebtamt:0,
                                                    acrdtamt:result.damount,
                                                    avoudt:result.lrdate,
                                                    flag:latestflag+1,
                                                    user:result.username
                                                })
                                            
                                            
                                                // let newAccountsledgerTBB3 = new AccountsLedger({
                                                //     branch: result.site,
                                                //     accountname:"TPT INC",
                                                //     avouno:result.lrno,
                                                //     arefno:"Advance recd. agnst freight from "+result.from+" to "+result.to+" agnst Lr No. "+result.lrno+" - "+result.truckno,
                                                //     adoctp:"Billty",
                                                //     adebtamt:0,
                                                //     acrdtamt:result.padvance,
                                                //     avoudt:result.padate,
                                                //     flag:latestflag+1,
                                                //     user:result.username
                                                // })
                                            
                                                let newAccountsledgerTBB4 = new AccountsLedger({
                                                    branch: result.site,
                                                    accountname:result.papaymentmode,
                                                    avouno:result.lrno,
                                                    arefno:"Advance recd. from "+result.consigner+" agnst Lr No. "+result.lrno+" - "+result.truckno,
                                                    adoctp:"Billty",
                                                    adebtamt:result.padvance,
                                                    acrdtamt:0,
                                                    avoudt:result.padate,
                                                    flag: latestflag+1,
                                                    user: result.username
                                                })
                                            
                                                newAccountsledger0.save();
                                                newAccountsledger10.save();
                                                newAccountsledgerTBB4.save();
                                            
                                                // newAccountsledgeraur2.save();
                                                // newAccountsledgeraur3.save();

                                                result.transactiondetails.forEach(element => {

                                                    let newAccountsledgerwanted = new Accountsledgerwanted1({

                                                        branch: result.site,
                                                        accountname: element.paymentmode,
                                                        avouno: result.lrno,
                                                        arefno: element.accountname +" paid agnst Lr No. "+ result.lrno+" - "+ result.truckno,
                                                        adoctp: "Billty",
                                                        adebtamt: 0,
                                                        acrdtamt: element.amount,
                                                        avoudt: element.date,
                                                        flag: latestflag+1,
                                                        user: result.username
                                                    });
                                            
                                                    newAccountsledgerwanted.save(function(err, result){
                                                        console.log(" PAYMENT MODE ADV > ", err, result);
                                                    });
                                            
                                            
                                                    let newAccountsledger20 = new Accountsledger2({
                                                
                                                        branch: result.site,
                                                        accountname: result.truckno,
                                                        avouno: result.lrno,
                                                        arefno: element.accountname +" paid agnst Lr No. "+ result.lrno,
                                                        adoctp: "Billty",
                                                        adebtamt: element.amount,
                                                        acrdtamt: 0,
                                                        avoudt: element.date,
                                                        flag: latestflag+1,
                                                        user: result.username
                                                
                                                    });
                                                    newAccountsledger20.save(function(err, result){
                                                        console.log(" TRUCKNO > ", err, result);
                                                    });
                                                    
                                                });
                                            
                                                
                                                if((result.damount != null)&&(result.damount != "0")&&(result.damount != 0)){
                                                    console.log(">>>>>>> Add Ledger 1 ");
                                                    
                                                    newAccountsledgeraur2.save(function (err, save) {
                                                        console.log("err  >>>",err);
                                                        console.log("save  >>>",save); 
                                                    });

                                                    newAccountsledgeraur3.save(function (err, save) {
                                                        console.log("err  >>>",err);
                                                        console.log("save  >>>",save); 
                                                    });
                                                
                                                    // callback(null, '');
                                                } else if((result.padvance != null)&&(result.padvance != "0")&&(result.padvance != 0)){
                                                    console.log(">>>>>>> Add Ledger 2");
                                                    // newAccountsledgerTBB3.save();
                                                    // newAccountsledgerTBB4.save();
                                                    // callback(null, '');
                                                } else {
                                                    console.log(">>>>>>> Not Add Ledger");
                                                    // callback(null, '');
                                                }


                                                

                                                
                                                

                                                // ------------------


                                            }).catch(function(err) {
                                                console.log("Delete Error >>>", err);
                                                callback(err, null);
                                            });
                                        }).catch(function(err) {
                                            console.log("Update Error >>>", err);
                                            callback(err, null);
                                        });
                                    
                                    } else {
                                        callback(null, '');
                                    }

                                }

                            }
                        }).catch(function(err) {
                            console.log("Error >>>", err);
                            callback(err, null);
                        });

                        i = i + 1;

                        if( i == results.length){
                            callback(null, ' ');
                        }
                    });
                }
            }).catch(function(err) {
                // console.log("Error");
                callback(err, null);
            });
        };
    };
   
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
        

        RateList.findOne({ "name": req.body.name, "site": req.body.site }).then(function(rateResult) {
            truckType = rateResult.rateby;
            PlantRateList.findOne().sort({srno: -1}).then(function(result) {
                var max_srno;
                if(result && result.srno){
                    max_srno = result.srno;
                } else {
                    max_srno = 0;
                }
                var srno = max_srno + 1;
            
                var multidestArray = [];
                var plantRateListArray = [];
                fileData.forEach( r => {
                    var obj = {
                        "destination": r['citycodedescription'],
                        "spi": r['spi'],
                        "km": r['km'],
                        "freight": r['freight'],
                        "startdate": r['validitystart']
                    }

                    var obj2 = {
                        "srno": srno,
                        "name": req.body.name,
                        "site": req.body.site,
                        "status": req.body.status,
                        "rateby": req.body.rateby,
                        "date_from": req.body.date_from,
                        "date_to": req.body.date_to,
                        "destination": r['citycodedescription'],
                        "spi": r['spi'],
                        "km": r['km'],
                        "freight": r['freight'],
                        "startdate": r['validitystart']
                    }
                    multidestArray.push(obj);
                    plantRateListArray.push(obj2);
                });

                var d = new PlantRateList({
                    "srno": srno,
                    "name": req.body.name,
                    "site": req.body.site,
                    "status": req.body.status,
                    "rateby": req.body.rateby,
                    "date_from": req.body.date_from,
                    "date_to": req.body.date_to,
                    "multidest": multidestArray
                });

                var getRateArray = [];
                plantRateListArray.forEach( gr => {
                    getRateArray.push(getRate(gr));
                });
                
            
                async.parallel(getRateArray, function(err, asyncResult) {
                    // res.send({ "message": plantRateListArray});
                    // Save  Plant Rate List"
                    d.save(function () {
                        res.send({ "message": "Added Plant Rate List"}); 
                    });
                });


                
            }).catch(function(err) {
                console.log("err   >>>>",err);
                res.send(err);
            });        
        }).catch(function(err) {
            console.log("err   >>>>",err);
            res.send(err);
        }); 
	} else {
        res.send("No files");
    }
});


router.get('/plant_list', function(req, res, next) {
    PlantRateList.find({}).then(function(result) {
        var resultArray = [];   
        result.forEach( r => {
            var obj = {
                "srno": r.srno,
                "name": r.name,
                "site": r.site,
                "status": r.status,
                "rateby": r.rateby,
                "date_from": r.date_from,
                "date_to": r.date_to,
            }
            resultArray.push(obj);
        });
        res.send({"result": resultArray});
    }).catch(function(err) {
        res.send(err);
    });
});

router.get('/search_plant_list', function(req, res, next) {
    PlantRateList.find({"name": req.query.name, "site": req.query.site}).then(function(result) {
        var resultArray = [];   
        result.forEach( r => {
            var obj = {
                "srno": r.srno,
                "name": r.name,
                "site": r.site,
                "status": r.status,
                "rateby": r.rateby,
                "date_from": r.date_from,
                "date_to": r.date_to,
            }
            resultArray.push(obj);
        });
        res.send({"result": resultArray});
    }).catch(function(err) {
        res.send(err);
    });
});


module.exports = router;