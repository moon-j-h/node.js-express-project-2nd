var jwt = require("jsonwebtoken");
var jwtRefresh = require("jsonwebtoken-refresh");

var config = require("./../../config/config").webToken;

var refreshWebToken = function(req, res, next){
    var refreshed = jwtRefresh.refresh(req.decoded, config.expiresIn, config.secret);
    var data = {
        code : 200,
        data : {
            type : 1,
            msg : "refresh SUC",
            refreshedToken : refreshed,
            expiresIn : config.expiresIn
        }
    };
    res.status(data.code).json(data.data);
}


exports.refreshWebToken = refreshWebToken;