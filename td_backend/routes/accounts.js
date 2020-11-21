var express = require('express');
var router = express.Router();
var Accounts = require('../models/accounts');
var AccountsLedger = require('../models/accountsledger');
var AccountsItemsLedger = require('../models/accountsitemledger');
var moment = require('moment');
var momentTZ = require('moment-timezone');
var Sitexpences = require('../models/sitexpences');

router.post('/final_amount', function(req, res, next) {
    console.log(' Accountname VehicleType B ', req.body.vehicletype)
    var amount  = '0';
    var unloading  = '0';
    if(req.body.vehicletype == "Company"){
        Sitexpences.findOne({site:req.body.site},(err,sitexes)=>{
            if(sitexes) {

                for(var i =0 ; i < sitexes.multidest.length;i++){
                    var md = sitexes.multidest[i];
                    if(md.destination==req.body.destination){
                        amount = md.newtotal;
                        unloading = md.unloading;

                        console.log(' fetched Amount ', amount);
                        break;
                    }
                }
            }

            res.send({'newamount':amount, 'newunloading': unloading}) 
        })
    } else{
        res.send({'newamount':0}) 
    }
});

router.post('/generate_draccountlist', function(req, res) {

    let ade_type = req.body.ade_type
    console.log(' Dr >>>>>', ade_type);
    // var matchCondition = {};
    var matchCond = {};
    if(ade_type == "Receipt"){
        matchCond = {accounttype: 'Cash - Bank'}
    } else if(ade_type == "Payment"){
        // matchCond = {accounttype: 'Cash - Bank'}
    } else if(ade_type == "Contra"){
        matchCond = {accounttype: 'Cash - Bank'}
    } else if(ade_type == "Journal"){
    } else if(ade_type == "Debit Note"){
    } else if(ade_type == "Credit Note"){
    }
    console.log(' matchCond >>>>>', matchCond);
    Accounts.find(matchCond).sort({ accountname: 1 }).then(function(result) {
        res.send({"result": result});
    })
    .catch(function(err) {
    res.send(err);
    });

});

router.post('/generate_craccountlist', function(req, res) {
    let ade_type = req.body.ade_type
    
    console.log(' Cr >>>>>', ade_type);
    var matchCond = {};

    if(ade_type == "Receipt"){
        // matchCond = {accounttype: 'Cash - Bank'}
    } else if(ade_type == "Payment"){
        matchCond = {accounttype: 'Cash - Bank'}
    } else if(ade_type == "Contra"){
        matchCond = {accounttype: 'Cash - Bank'}
    } else if(ade_type == "Journal"){
    } else if(ade_type == "Debit Note"){
    } else if(ade_type == "Credit Note"){
    }

    console.log(' matchCond >>>>>', matchCond);
    Accounts.find(matchCond).sort({ accountname: 1 }).then(function(result) {
        // console.log(' result ', result)
        res.send({"result": result});
    })
    .catch(function(err) {
    res.send(err);
    });

});



router.get('/accountsitemsledger', function(req, res, next) {
    
    var rvopbal = 0;
    var matchCondition = {};
    var rrvopbal, accountType;

    var getMatchCondition = function () {
        var matchCondition = {};
        if(req.query.start_date) {
            matchCondition.avoudt = req.query.start_date;
        }
        
        if(req.query.end_date && req.query.start_date) {
            var startDate = moment(req.query.start_date, 'YYYY-MM-DD').format("YYYY-MM-DD");
            var endDate = moment(req.query.end_date, 'YYYY-MM-DD').format("YYYY-MM-DD");
            matchCondition.avoudt = {
                $gte: startDate,
                $lte: endDate
            };
        }



        if ( req.query.start_date == req.query.end_date ) {
            var startDate = moment(req.query.start_date, 'YYYY-MM-DD').format("YYYY-MM-DD");
            matchCondition.avoudt = startDate;
        } 
        
        if(req.query.site_name){
            matchCondition.branch = req.query.site_name;
        } 
        
        if(req.query.account_name) {
            matchCondition.accountname = req.query.account_name;
        }
        

        return matchCondition;
    };

    // used to calculate balance using previous records before start date if start date is specified
    var calculateOpeningBalanceUsingOldRecords = function (defaultOpeningBalance, defaultAccountType, cb) {
        // var matchCond = {avoudt: {$lt: new Date(req.query.start_date)}};

        if(req.query.start_date) {
            // var startDate = moment(req.query.start_date, 'YYYY-MM-DD').format("YYYY-MM-DD");
            var matchCond = {avoudt: {$lt: moment(req.query.start_date, 'YYYY-MM-DD').format("YYYY-MM-DD")}};
        }


        if(req.query.site_name){
            matchCond.branch = req.query.site_name;
        } 
        
        if(req.query.account_name) {
            matchCond.accountname = req.query.account_name;
        }


        AccountsItemsLedger.find(matchCond).sort({'avoudt': 1}).then(function (accountNameresults) {
            var data = [];
            accountNameresults.forEach(r => {
                defaultOpeningBalance = (Number(r.acrdtamt ? r.acrdtamt : 0) + defaultOpeningBalance) - Number(r.adebtamt ? r.adebtamt : 0);
            });
            var accType;
            if(defaultAccountType){
                accType = defaultAccountType

            } else {
                accType = defaultOpeningBalance > 0 ? 'Credit' : 'Debit'
            }
            cb(false, {type: accType, opening_balance: defaultOpeningBalance});
        }).catch(function (err) {
            // console.log(err);
            cb(err, false);
        });
    };

    var findRecords = function (openingBalance, cb) {
        var closing_balance = openingBalance.opening_balance;
        var matchCond = getMatchCondition();
        AccountsItemsLedger.find(matchCond).sort({'avoudt': 1}).then(function (accountNameresults) {
            var data = [];

            console.log(" >>>>>>", accountNameresults.length);
            accountNameresults.forEach(r => {
                if (r.branch && r.accountname) {
                    var debtamt = r.adebtamt ? r.adebtamt : 0;
                    var crdtamt = r.acrdtamt ? r.acrdtamt : 0;
                    // console.log(r.adebtamt, r.crdtamt, closing_balance);
                    closing_balance = (closing_balance + Number(crdtamt)) - Number(debtamt);
                    // console.log("closing >>>", r.avoudt);
                    var obj = {
                        branch: r.branch,
                        date: moment(r.avoudt).format('DD/MM/YYYY'),
                        particular: r.arefno,
                        dr: r.adebtamt,
                        cr: r.acrdtamt,
                        closing: Math.abs(closing_balance.toFixed(2))
                    }
                    data.push(obj);
                }
            });
            
            cb(false, {records: data, closing_balance: Math.abs(closing_balance), type: closing_balance > 0 ? 'Credit' : 'Debit'});
        }).catch(function (err) {
            // console.log(err);
            cb(err, false);
        });
    };

    console.log(" >>>>>>", req.query.account_name);

    if(req.query.account_name) {
        matchCondition.accountname = req.query.account_name;
    }

    Accounts.find(matchCondition).then(results => {
        var vopbal = 0;
        var accountName = '';
        // console.log("results  >>>", results);
        if(results) {

            // console.log("results[0]  >>>", results[0]);

            if(!results[0]) {
                vopbal = 0;
            } else {
                accountName = results[0].accountname;
                // console.log(results[0].ocrdr);
                vopbal = 0;
                if(results[0].ocrdr === "Debit"){
                    vopbal = vopbal + Number(results[0].opbal ? results[0].opbal : 0);
                    accountType = "Debit";
                    // console.log("Debit.....");
                } else{
                    vopbal = vopbal - Number(results[0].opbal ? results[0].opbal : 0);
                    accountType = "Credit";
                    // console.log("Credit.....");
                }
            }
            
        } else {
            vopbal = 0;
        }
        rvopbal = vopbal;
        rrvopbal = rvopbal;   // give for send res in opning_balance        

        if(req.query.start_date) {
            calculateOpeningBalanceUsingOldRecords(rvopbal,accountType, function (err, newOpeningBalance) {
                if(err) {
                    return res.status(500).send(err);
                }
                findRecords(newOpeningBalance, function (err, results) {
                    if(err) {
                        return res.status(500).send(err);
                    }

                    res.send({                      
                        opening_balance: newOpeningBalance,
                        results: results.records,
                        closing_balance : results.closing_balance,
                        account_type : results.type
                    });
                });
            });
        } else {
            findRecords(vopbal, function (err, results) {
                if(err) {
                    return res.status(500).send(err);
                }

                res.send({
                    opening_balance: {type: rrvopbal && rrvopbal > 0 ? 'Credit' : 'Debit', opening_balance: rrvopbal ? rrvopbal : 0},
                    results: results.records,
                    closing_balance : results.closing_balance,
                    account_type : results.type,
                });
            });
        }

    }).catch(err => {
        // console.log(err);
        res.send("err");
    });


});


router.get('/ledger', function(req, res, next) {
    
    var rvopbal = 0;
    var matchCondition = {};
    var rrvopbal, accountType;

    var getMatchCondition = function () {
        var matchCondition = {};
        if(req.query.start_date) {
            matchCondition.avoudt = req.query.start_date;
        }
        
        if (req.query.start_date && req.query.end_date) {
            // var start = momentTZ(req.query.start_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD');
            var end = momentTZ(req.query.end_date, 'YYYY-MM-DD').tz('Asia/Calcutta').format('YYYY-MM-DD');
            // var startDate = new Date(start);
            var endDate = new Date(end)
            // startDate.setUTCHours(00,00,00,000);
            endDate.setUTCHours(23,59,59,999);
            matchCondition.avoudt = {
                // $gte: startDate,
                // $lte: endDate
                $gte: new Date(req.query.start_date),
                $lte: endDate


                // $lte: new Date(req.query.end_date)

            };
        }

        if(req.query.site_name){
            matchCondition.branch = req.query.site_name;
        } 
        
        if(req.query.account_name) {
            matchCondition.accountname = req.query.account_name;
        }
        console.log('matchcondition >>>>', matchCondition);
        return matchCondition;
    };

    
    // used to calculate balance using previous records before start date if start date is specified
    var calculateOpeningBalanceUsingOldRecords = function (defaultOpeningBalance, defaultAccountType, cb) {
        // var matchCond = {avoudt: {$lt: new Date(req.query.start_date)}};

        if(req.query.start_date) {
            // var startDate = moment(req.query.start_date, 'YYYY-MM-DD').format("YYYY-MM-DD");
            var matchCond = {avoudt: {$lt: moment(req.query.start_date, 'YYYY-MM-DD').format("YYYY-MM-DD")}};
        }


        if(req.query.site_name){
            matchCond.branch = req.query.site_name;
        } 
        
        if(req.query.account_name) {
            matchCond.accountname = req.query.account_name;
        }

        console.log("Old Records matchcond  >>>", matchCond);

        AccountsLedger.find(matchCond).sort({'avoudt': 1}).then(function (accountNameresults) {
            var data = [];
            var odebtamt = 0 
            var ocrdtamt = 0
            if(defaultAccountType === "Debit"){
                odebtamt = defaultOpeningBalance
            } else{
                ocrdtamt = defaultOpeningBalance
            }
            accountNameresults.forEach(r => {
                odebtamt = Number(odebtamt) + Number(r.adebtamt ? r.adebtamt : 0);
                ocrdtamt = Number(ocrdtamt) + Number(r.acrdtamt ? r.acrdtamt : 0);
            });
            var accType;
            if (odebtamt > ocrdtamt) {
                defaultOpeningBalance = Number(odebtamt) - Number(ocrdtamt)
                accType = "Debit"
            } else {
                defaultOpeningBalance  = Number(ocrdtamt) - Number(odebtamt)
                accType = "Credit"
            }
            
            // if(defaultAccountType){
            //     accType = defaultAccountType
            // } else {
            //     accType = defaultOpeningBalance > 0 ? 'Credit' : 'Debit'
            // }
            cb(false, {account_type: accType, opening_balance: defaultOpeningBalance});
        }).catch(function (err) {
            // console.log(err);
            cb(err, false);
        });
    };

    var findRecords = function (openingBalance,  cb) {
        var closing_type = openingBalance.account_type;
        var closing_balance = openingBalance.opening_balance;


        var matchCond = getMatchCondition();
        AccountsLedger.find(matchCond).sort({'avoudt': 1}).then(function (accountNameresults) {
            var data = [];
            var totdebit = 0 
            var totcredit = 0 

            // console.log('closing Type find records >>>', closing_type );
            // console.log('closing Balance find records >>>', closing_balance );

            if (closing_type === "Debit") {
                totdebit = Number(closing_balance)
            } else {
                totcredit = Number(closing_balance)
            }
            // console.log('Debit Amount op>>>', totdebit );
            // console.log('Credit Amount op>>>', totcredit );

            // console.log(" >>>>>>", accountNameresults.length);
            accountNameresults.forEach(r => {
                if (r.branch && r.accountname) {

                    totdebit = Number(totdebit)  + Number(r.adebtamt ? r.adebtamt : 0);
                    totcredit = Number(totcredit) + Number(r.acrdtamt ? r.acrdtamt : 0)
                    if (totdebit >= totcredit) {
                        closing_balance = Number(totdebit) - Number(totcredit)
                        closing_type = "Debit"
                    } else {
                        closing_balance = Number(totcredit) - Number(totdebit)
                        closing_type = "Credit"
                    }
                
                    // console.log('Debit Amount tran>>>', totdebit );
                    // console.log('Credit Amount tran>>>', totcredit );
                    // console.log('closing Balance 1 >>>', closing_balance );

                    var obj = {
                        branch: r.branch,
                        date: moment(r.avoudt).format('DD/MM/YYYY'),
                        particular: r.arefno,
                        dr: r.adebtamt,
                        cr: r.acrdtamt,
                        closing: Math.abs(closing_balance.toFixed(2)),
                        drcr : closing_type
                    }
                    data.push(obj);
                }
            });
            
            // cb(false, {records: data, closing_balance: Math.abs(closing_balance), type: closing_balance > 0 ? 'Credit' : 'Debit'});
            cb(false, {records: data, closing_balance: Math.abs(closing_balance), type: closing_type});
        }).catch(function (err) {
            // console.log(err);
            cb(err, false);
        });
    };

    console.log(" >>>>>>", req.query.account_name);

    if(req.query.account_name) {
        matchCondition.accountname = req.query.account_name;
    }

    Accounts.find(matchCondition).then(results => {
        var vopbal = 0;
        var accountName = '';
        // console.log("results  >>>", results);
        if(results) {

            // console.log("results[0]  >>>", results[0]);

            if(!results[0]) {
                vopbal = 0;
            } else {
                accountName = results[0].accountname;
                // console.log(results[0].ocrdr);
                vopbal = 0;
                if(results[0].ocrdr === "Debit"){
                    vopbal = vopbal + Number(results[0].opbal ? results[0].opbal : 0);
                    accountType = "Debit";
                    // console.log("Debit.....");
                } else{
                    vopbal = vopbal - Number(results[0].opbal ? results[0].opbal : 0);
                    accountType = "Credit";
                    // console.log("Credit.....");
                }
            }
            
        } else {
            vopbal = 0;
        }
        rvopbal = vopbal;
        rrvopbal = rvopbal;   // give for send res in opning_balance 

        if(req.query.start_date) {
            calculateOpeningBalanceUsingOldRecords(rvopbal,accountType, function (err, newOpeningBalance) {
                if(err) {
                    return res.status(500).send(err);
                }

                // console.log('Account Type >>>', newOpeningBalance.account_type );
                // console.log('newOpeningBalance >>>', newOpeningBalance.opening_balance );

                findRecords(newOpeningBalance, function (err, results) {
                    if(err) {
                        return res.status(500).send(err);
                    }

                    res.send({                      
                        opening_balance: newOpeningBalance,
                        results: results.records,
                        closing_balance : results.closing_balance,
                        account_type : results.type
                    });
                });
            });
        } else {
            findRecords(vopbal, function (err, results) {
                if(err) {
                    return res.status(500).send(err);
                }

                res.send({
                    opening_balance: {type: rrvopbal && rrvopbal > 0 ? 'Credit' : 'Debit', opening_balance: rrvopbal ? rrvopbal : 0},
                    results: results.records,
                    closing_balance : results.closing_balance,
                    account_type : results.type,
                });
            });
        }

    }).catch(err => {
        // console.log(err);
        res.send("err");
    });


});

router.get('/consignor_city', function(req, res, next) {

    Accounts.findOne({'accountname': req.query.consignor}).then( function(result) {
        res.send(result);
    }).catch(err => {
        res.send("err");
    });
});


router.post('/principle_billing_posting', function(req, res, next) {

    // var d = new AccountsLedger(req.body);
    
    // d.save(function (err, save) {
    //    console.log("err  >>>",err);
    //    console.log("save  >>>",save);
    //    res.send({"message": "Added..!"}); 
    // });

    AccountsLedger.insertMany(req.body).then((result) => {
        res.send({"message": "Added..!"}); 
    }).catch((err) => {
        res.send({"message": err}); 
    });
     
});
module.exports = router;