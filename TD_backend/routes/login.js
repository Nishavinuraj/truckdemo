var express = require('express');
var router = express.Router();
var Permissions = require('../models/permissions');
var Users = require('../models/users'); 
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var base64urlEncode = require('base64url');

router.post('/', function(req, res, next) {
    var userName = req.body.username;
    var userPassword = crypto.createHash('sha1').update(req.body.password).digest('hex');

    Users.findOne({"name": userName, "password": userPassword}).then(function(result) {
        if (result) {
            // console.log("If   >>>>>");
            
            var user = result.toJSON();
            
            var token = jwt.sign(userName+':'+userPassword, 'secretPassword');
            user.token = token;
            res.send({ "data": user });
        } else {
            console.log("Else   >>>>>");
            res.send({ "message": "Invalid Username or Password...!" });
        }
    }).catch(function(err) {
        console.log("err   >>>>>", err);
        res.send(err);
    });
});

router.post('/decode', function(req, res, next) {
    var decoded = jwt.verify(req.headers['x-auth'], 'secretPassword');
    var username = decoded.split(":")[0];
    var password = decoded.split(":")[1];
    Users.findOne({"name": username, "password": password}).then(function(result) {
        if (result) {
            // console.log("If   >>>>>");
            var user = result.toJSON();
            
            res.send(user); // bar
        } else {
            // console.log("Else   >>>>>");
            res.send({ "message": "Invalid Username or Password...!" });
        }
    }).catch(function(err) {
        console.log("err   >>>>>", err);
        res.send(err);
    });
});



module.exports = router;