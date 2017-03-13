var mysql = require("mysql");
var config= require("./../../config/config");
var pool = mysql.createPool(config.mariaDb);

//var jwt = require("jsonwebtoken");
var errMsg = require("./../../middlewares/errorMessages");

var getMemberships = function(req, res, next){
    pool.getConnection(function(err, conn){
        if(err){
            console.error("connection error @ getMemberships ", err);
            return next(errMsg.sError);
        }
        conn.query("SELECT code, description FROM Memberships", function(err, rows){
            if(err){
                console.error("select error @ getMemberships ", err);
                return next(err);
            }
            var data = {
                code : 200,
                data : {
                    type : 1,
                    memberships : rows
                }
            };
            res.status(data.code).json(data.data);
        });
    });
}

exports.getMemberships = getMemberships;