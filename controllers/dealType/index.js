var mysql = require("mysql");
var config = require("./../../config/config");
var pool = mysql.createPool(config.mariaDb);

var errMsg = require('./../../middlewares/errorMessages');

var getDealTypes = function(req, res, next){
    pool.getConnection(function(err, conn){
        if(err){
            console.error("connection error @ getDealTypes ", err);
            return next(errMsg.sError);
        }
        conn.query("SELECT code, description FROM DealTypes", function(err, rows){
            if(err){
                console.error("select error @ getDealTypes ", err);
                return next(errMsg.sError);
            }
            var data={
                code : 200,
                data : {
                    type : 1,
                    dealTypes : rows
                }
            };
            res.status(data.code).json(data.data);
        });
    });
}

exports.getDealTypes = getDealTypes;