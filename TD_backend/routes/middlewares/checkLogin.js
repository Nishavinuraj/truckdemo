var jwt = require('jsonwebtoken');
var Users = require('../../models/users'); 

module.exports = function() {

    return function(req, res, next) {
        // verify a token symmetric

        jwt.verify(req.headers['x-auth'], 'secretPassword', function(err, decoded) {

            if (err) {
                console.log("err   >>>>>>>", err);
                return res.status(401).json({ statusCode: 401, code: "Invalid Token...!" });
            }

            var username = decoded.split(":")[0];
            var password = decoded.split(":")[1];
            Users.findOne({"name": username, "password": password}).then(function(result) {
                if (result) {
                    // console.log("If   >>>>>");
                    var user = result.toJSON();
                    req.user = user;
                    next();

                } else {
                    // console.log("Else   >>>>>");
                    res.send({ "message": "Invalid Username or Password...!" });
                }
            }).catch(function(err) {
                console.log("err   >>>>>", err);
                res.send(err);
            });

            // Attach login details with request
            // console.log("Decoded   >>>>>>>", decoded);
        });
    };
};