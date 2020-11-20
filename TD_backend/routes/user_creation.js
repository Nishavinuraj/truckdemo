var express = require('express');
var router = express.Router();
var Permissions = require('../models/permissions');
var Users = require('../models/users'); 
var crypto = require('crypto')

router.get('/list_of_permissions', function(req, res, next) {
    Permissions.find({}).sort({"sno": 1, "name": 1}).then(function(result) {
        // Permissions.find({}).sort({"name": 1}).then(function(result) {
    
        res.send(result);
    }).catch(function(err) {
        res.send(err);
    });
});


router.get('/list_of_users', function(req, res, next) {
    Users.find({}).sort({"name": 1}).then(function(result) {
    
        res.send(result);
    }).catch(function(err) {
        res.send(err);
    });
});

router.post('/create_user', function(req, res, next) {

    var userPassword = crypto.createHash('sha1').update(req.body.password).digest('hex');
    var tPassword = crypto.createHash('sha1').update(req.body.tpassword).digest('hex');
    req.body.password = userPassword;
    req.body.tpassword = tPassword;

    var d = new Users(req.body);
    
    d.save(function (err, save) {
       console.log("err  >>>",err);
       console.log("save  >>>",save);
       res.send({"message": "Added..!"}); 
    });
     
});

router.delete ('/delete_user', function(req, res, next) {
    Users.deleteOne({ name: req.query.name}).then(function(deleteResult) {   
        res.send({"message": "delete..!"});
    }).catch(function(err) {
        res.send(err);
    });
});

router.put ('/update_user', function(req, res, next) {
    Users.find({"_id": req.query.id}).then(function(result) {

            Users.updateMany({"_id": req.query.id}, { $set : {'name': req.body.name, 'site': req.body.site, 'role': req.body.role, 'permissions': [] }} , {multi:true} ).then(function(updateResult) {   
                
                Users.update({ 
                    "_id": result[0]._id
                    },{
                    "$push": 
                        { 
                            "permissions": req.body.permissions
                        }
                    }).then(function(result) {
                        res.send({ "message": "Updated...!"});
                    }).catch(function(err) {
                        res.send(err);
                });
            }).catch(function(err) {
                res.send(err);
            });

    }).catch(function(err) {
        res.send(err);
    });
});



module.exports = router;
