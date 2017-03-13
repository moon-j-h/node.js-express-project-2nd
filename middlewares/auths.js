var config = require("./../config/config");
var errMsg = require("./errorMessages");
var jwt = require("jsonwebtoken");

module.exports.checkWebToken = function(req, res, next){
    var token = req.headers['x-access-token'];

    // decode token
    if (token) {

        // verifies secret and checks exp
        jwt.verify(token, config.webToken.secret, function (err, decoded) {
            if (err) {
                console.error("err @ checkWebToken ", err);
                var data = {
                    code : 200,
                    data : {
                        type : 0,
                        msg : "invalid webToken"
                    }
                };
                return res.status(data.code).json(data.data);
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });

    } else {

        // if there is no token
        // return an error
        console.error("not exist token");
        return next(errMsg.notAuth);

    }
}