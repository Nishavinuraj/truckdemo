var express = require('express');
var router = express.Router();
var AccountsTransaction = require('../models/accountstransaction');
var moment = require('moment');
var jwt = require('jsonwebtoken');

router.get('/list', function(req, res, next) {
    AccountsTransaction.find({}).sort({tdate: -1}).then(function(result) {
        res.send({"result": result});
    }).catch(function(err) {
        res.send(err);
    });
});

router.post('/create', function(req, res, next) {

    var user_name;
    jwt.verify(req.headers['x-auth'], 'secretPassword', function(err, decoded) {

        if (err) {
            console.log("err   >>>>>>>", err);
            return res.status(401).json({ statusCode: 401, code: "Invalid Token...!" });
        }

        user_name = decoded.split(":")[0];
    });
    var max_voucher_no;
    AccountsTransaction.findOne().sort({tdate: -1}).then(function(resultAT) {
        if(resultAT && resultAT.voucher_no){
            max_voucher_no = resultAT.voucher_no;
        } else {
            max_voucher_no = 0;
        }
        var new_voucher_no = Number(max_voucher_no) + 1;
        console.log("new_voucher_no>>> ", new_voucher_no);
        req.body.voucher_no = new_voucher_no;
        req.body.user = user_name;
    
        var d = new AccountsTransaction(req.body);
    
        d.save(function (err, save) {
            console.log("err  >>>",err);
            console.log("save  >>>",save);
            res.send({"message": "Added..!"}); 
        });

    }).catch(function(err) {
        console.log("err   >>>>",err);
        res.send(err);
    });
    
     
});

router.delete ('/delete', function(req, res, next) {
    var user_name;
    jwt.verify(req.headers['x-auth'], 'secretPassword', function(err, decoded) {

        if (err) {
            console.log("err   >>>>>>>", err);
            return res.status(401).json({ statusCode: 401, code: "Invalid Token...!" });
        }
        user_name = decoded.split(":")[0];
    });

    AccountsTransaction.deleteOne({ user: user_name, _id: req.query.id  }).then(function(deleteResult) {   
        res.send({"message": "deleted..!"});
    }).catch(function(err) {
        res.send(err);
    });
});

router.put('/update', function(req, res, next) {
    var user_name;
    jwt.verify(req.headers['x-auth'], 'secretPassword', function(err, decoded) {

        if (err) {
            console.log("err   >>>>>>>", err);
            return res.status(401).json({ statusCode: 401, code: "Invalid Token...!" });
        }
        user_name = decoded.split(":")[0];
    });

    try {
        AccountsTransaction.updateOne({ user: user_name , _id: req.query.id  }, { $set: req.body }).then(function (result) {
            res.send({"result": "Updated...!"});
        }).catch(function(err) {
            console.log("err >>>>>", err);
            res.send(err);
        });
     } catch (e) {
        res.send(err);
     }
});

module.exports = router;