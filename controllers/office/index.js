var errMsg = require("./../../middlewares/errorMessages");
var mysql = require("mysql");
var config = require("./../../config/config").mariaDb;
var pool = mysql.createPool(config);
var async = require("async");
var getOffice = function(req, res, next){
    var officeCode = req.params.officeCode;
    pool.getConnection(function(err, conn){
        if(err){
            console.error("error @ getConnection @ getOffice ", err);
            return next(errMsg.sError);
        }
        var sql = "SELECT code, name, address, tel FROM Offices WHERE code=?";
        conn.query(sql, [officeCode], function(err, rows){
            if(err){
                console.error("error @ select query @ getOffice ", err);
                return next(errMsg.sError);
            }
            conn.release();
            var data = {
                code : 200,
                data : null
            };
            if(rows.length===1){
                data.data = {
                    type : 1,
                    office : rows[0]
                };  
            }else{
                data.data = {
                    type : 0,
                    msg : "없음"
                };
            }
            res.status(data.code).json(data.data);
        });
    });
}

var updateOffice = function(req, res, next){
    var officeCode = Number(req.params.officeCode);
    var agentCode = req.decoded.userCode;
    pool.getConnection(function(err, conn){
        if(err){
            console.error("error @ getConnection @ updateOffice ", err);
            return next(errMsg.sError);
        }
        async.waterfall([
            function(callback){
                var sql = "SELECT officeCode FROM Agents WHERE code = ?";
                conn.query(sql, [agentCode], function(err, rows){
                    if(err){
                        console.error("error @ 1 function @ async ", err);
                        callback(err);
                    }else{
                        if(rows.length===1){
                            if(rows[0].officeCode === officeCode)
                                callback(null, 1);
                            else
                                callback(null, 2);
                        }else{
                            callback(null, 0);
                        }
                    }
                });
            }, function(result, callback){
                if(result===1){
                    // update하셈 
                    var newInfo = {
                        name : req.body.name,
                        address : req.body.address,
                        tel : req.body.tel
                    };
                    var sql ="UPDATE Offices SET name=?, address=?, tel=? WHERE code=?";
                    conn.query(sql, [newInfo.name, newInfo.address, newInfo.tel, officeCode], function(err, result){
                        if(err){
                            console.error("error @ updatequery @ updateOffice ", err);
                            return callback(err);
                        }

                        conn.release();
                        callback(null, result.affectedRows);
                    });
                }else if(result===2){
                    callback(null, 2);
                }else{
                    callback(null, 0);
                }
            }
        ], function(err, affectedRows){
            var data = {
                code : 200,
                data : null
            };
            if(affectedRows===1){
                data.data = {
                    type : 1,
                    msg : "SUC"
                };
            }else if(affectedRows ===2){
                data.data = {
                    type : 0,
                    msg : "권한 없음"
                };
            }else{
                data.data = {
                    type : 0,
                    msg : "FAIL"
                };
            }
            res.status(data.code).json(data.data);
        });        
    });  
}
exports.getOffice = getOffice;
exports.updateOffice = updateOffice;