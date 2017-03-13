var config = require("./../../config/config").mariaDb;
var mysql = require("mysql");
var pool = mysql.createPool(config);
var errMsg = require("./../../middlewares/errorMessages");
var async = require("async");

var saveRealtyCategory = function(req, res, next){
    pool.getConnection(function(err, conn){
        if(err){
            console.error("error @ getConnection @ saveRealtyCategory ", err);
            return next(errMsg.sError);
        }
        conn.query("INSERT INTO RealtyCategories(description) VALUES(?)", req.body.description, function(err, result){
            if(err){
                console.error("error @ INSERT @ saveRealtyCategory ", err);
                return next(errMsg.sError);
            }
            var data = {
                code : 200,
                data : {
                    type : 1,
                    msg : "SUC"
                }
            };
            conn.release();
            res.status(data.code).json(data.data); 
        });
    });
}

var getRealtyCategories = function(req, res, next){
    pool.getConnection(function(err, conn){
        if(err){
            console.error("error @ getConnection getRealtyCategories ", err);
            return next(errMsg.sError);
        }
        conn.query("SELECT code, description FROM RealtyCategories", function(err, rows){
            if(err){
                console.error("error @ select @ getRealtyCategories ", err);
                return next(errMsg.sError);
            }
            var data = {
                code : 200,
                data : {
                    type : 1,
                    realtyCategories : rows
                }
            };
            conn.release();
            res.status(data.code).json(data.data);
        });
    });
}


var saveAddress = function(req, conn, callback){
    var sigunguBubjungdongLee = {
        bcode : req.body.bcode,
        bname : req.body.bname,
        sigunguCode : req.body.sigunguCode,
        sigunguName : req.body.sigunguName
    };
    async.waterfall([
        function(callback){
            conn.query("SELECT bcode FROM SigunguBubJungDongLees WHERE bcode=?", sigunguBubjungdongLee.bcode, function(err, rows){
                if(err){
                    console.error("error @ select SigunguBubJungDongLees @ saveAddress", err);
                    callback(err);
                }else{
                    callback(null, rows);
                }
            });
        }, function(rows, callback){
            if(rows.length===0){
                conn.query("INSERT INTO SigunguBubJungDongLees SET ?", sigunguBubjungdongLee, function(err, result){
                    if(err){
                        console.error("error @ insert SigunguBubJungDongLees ", err);
                        callback(err);
                    }else{
                        callback(null, sigunguBubjungdongLee.bcode);
                    }
                });
            }else{
                callback(null, sigunguBubjungdongLee.bcode);
            }
        }, function(bcode, callback){
            var jibunAddress = req.body.jibunAddress;
            conn.query("SELECT code FROM Addresses WHERE bcode=? AND jibunAddress=?", [bcode, jibunAddress], function(err, rows){
                if(err){
                    console.error("error @ insert address @ select from addresses ", err);
                    callback(err);
                }else{
                    if(rows.length===0){
                        callback(null, bcode, null);
                    }else{
                        callback(null, bcode, rows[0].code);
                    }
                }
            });
        },function(bcode, addressCode, callback){
            if(addressCode!==null){
                return callback(null, addressCode);
            }
            var address = {
                zoneCode: req.body.zoneCode,
                userSelectedType: req.body.userSelectedType,
                roadAddress: req.body.roadAddress,
                jibunAddress: req.body.jibunAddress,
                buildingName: req.body.buildingName,
                isApartment: req.body.isApartment,
                sido: req.body.sido,
                bcode: bcode,
                lat: req.body.lat,
                lng: req.body.lng
            };
            conn.query("INSERT INTO Addresses SET ?", address, function (err, result) {
                if (err) {
                    console.error("error @ insert addresses ", err);
                    callback(err);
                } else {
                    callback(null, result.insertId);
                }
            });
        }
    ], function(err, addressCode){
        if(err){
            callback(err);
        }else{
            callback(null, addressCode);
        }
    });
}
var saveRealty = function(req, res, next){
    pool.getConnection(function(err, conn){
        if(err){
            console.error("error @ getConnection @ saveRealty ", err);
            return next(errMsg.sError);
        }
        saveAddress(req, conn, function(err, addressCode){
            if(err){
                return next(errMsg.sError);
            }
            // 진짜 매물 정보 등록
            var newRealty = {
                agentCode : req.decoded.userCode,
                name : req.body.name,
                realtyCategoryCode : req.body.realtyCategoryCode,
                dealTypeCode : req.body.dealTypeCode,
                loan : req.body.loan,
                price1 : req.body.price1,
                price2 : req.body.price2,
                floor : req.body.floor,
                totalFloor : req.body.totalFloor,
                area1 : req.body.area1,
                area2 : req.body.area2,
                memo : req.body.memo,
                addressCode : addressCode,
                dong : req.body.dong,
                ho : req.body.ho,
                ownerCode : req.body.ownerCode,
                dealStatus : 0
            };
            conn.query("INSERT INTO Realties SET ?", newRealty, function(err, result){
                if(err){
                    console.error("error @ insert realties @ saveRealty", err);
                    return next(errMsg.sError);
                }
                var data = {
                    code : 200,
                    data : {
                        type : 1,
                        msg : "SUC"
                    }
                };
                conn.release();
                res.status(data.code).json(data.data);
            });
        });
    });
}

var getRealties = function(req, res, next){
    var agentCode = req.decoded.userCode;
    pool.getConnection(function(err, conn){
        if(err){
            console.error("error @ getConnection @ getRealties ", err);
            return next(errMsg.sError);
        }
        var sql = "SELECT r.code, r.agentCode, r.name, r.realtyCategoryCode, r.dealTypeCode, r.loan, r.price1, r.price2, r.floor, r.totalFloor, r.area1, r.area2, r.memo, a.zoneCode, a.userSelectedType, a.roadAddress, a.jibunAddress, a.buildingName, a.isApartment, a.sido, s.bname, s.sigunguName, a.lat, a.lng, r.dong, r.ho, r.ownerCode, r.dealStatus";
        sql+=" FROM Realties r, Addresses a, SigunguBubJungDongLees s";
        sql+=" WHERE r.addressCode = a.code AND a.bcode = s.bcode";
        sql+=" AND r.agentCode = ?";
        conn.query(sql, [agentCode], function(err, rows){
            if(err){
                console.error("error @ select @ getRealties ", err);
                return next(errMsg.sError);
            }
            var data = {
                code : 200,
                data : null
            };
            if(rows.length!==0){
                data.data = {
                    type : 1,
                    realties : rows
                };
            }else{
                data.data = {
                    type : 0,
                    msg : "없음"
                };
            }
            conn.release();
            res.status(data.code).json(data.data);
        });
    });
}

var getRealty = function(req, res, next){
    var realtyCode = req.params.realtyCode;
    var agentCode = req.decoded.userCode;
    pool.getConnection(function(err, conn){
        if(err){
            console.error("error @ getConnection @ getRealties ", err);
            return next(errMsg.sError);
        }
        var sql = "SELECT r.code, r.agentCode, r.name, r.realtyCategoryCode, r.dealTypeCode, r.loan, r.price1, r.price2, r.floor, r.totalFloor, r.area1, r.area2, r.memo, a.zoneCode, a.userSelectedType, a.roadAddress, a.jibunAddress, a.buildingName, a.isApartment, a.sido, s.bname, s.sigunguName, a.lat, a.lng, r.dong, r.ho, r.ownerCode, r.dealStatus";
        sql+=" FROM Realties r, Addresses a, SigunguBubJungDongLees s";
        sql+=" WHERE r.addressCode = a.code AND a.bcode = s.bcode";
        sql+=" AND r.code = ?";
        conn.query(sql, [realtyCode], function(err, rows){
            if(err){
                console.error("error @ select @ getRealties ", err);
                return next(errMsg.sError);
            }
            var data;
            if(rows.length===0){
                data ={
                    code : 200,
                    data : {
                        type : 0,
                        msg : "해당 매물이 없습니다."
                    }
                };
            }else{
                if(rows[0].agentCode !== agentCode){
                    data = {
                        code : 200,
                        data : {
                            type : 0,
                            msg : "권한이 없습니다."
                        }
                    };
                }else{
                    data = {
                        code : 200,
                        data : {
                            type : 1,
                            realty : rows[0]
                        }
                    };
                }
            }
            conn.release();
            res.status(data.code).json(data.data);
        });
    })
}

var updateRealty = function(req, res, next){
    var realtyCode = req.params.realtyCode;
    var agentCode = req.decoded.userCode;
    pool.getConnection(function(err, conn){
        if(err){
            console.error("error @ getConnection @ updateRealty ", err);
            return next(errMsg.sError);
        }
        saveAddress(req, conn, function(err, addressCode){
            if(err){
                return next(errMsg.sError);
            }
            var sql = "UPDATE Realties SET";
            sql+=" name=?, realtyCategoryCode=?, dealTypeCode=?, loan=?, price1=?, price2=?, floor=?, totalFloor=?, area1=?, area2=?, memo=?, addressCode=?, dong=?, ho=?";
            sql+=" WHERE code=? AND agentCode=?";
            var newInfo=[
                req.body.name,
                req.body.realtyCategoryCode,
                req.body.dealTypeCode,
                req.body.loan,
                req.body.price1,
                req.body.price2,
                req.body.floor,
                req.body.totalFloor,
                req.body.area1,
                req.body.area2,
                req.body.memo,
                addressCode,
                req.body.dong,
                req.body.ho,
                realtyCode,
                agentCode
            ];
            conn.query(sql, newInfo, function(err, result){
                if(err){
                    console.error("error @ updateRealty @ updateQuery ", err);
                    return next(errMsg.sError);
                }
                conn.release();
                if(result.affectedRows === 1){
                    var data = {
                        code : 200,
                        data : {
                            type : 1,
                            msg : "SUC"
                        }
                    };
                    res.status(data.code).json(data.data);
                }else{
                    var data={
                        code : 200,
                        data : {
                            type : 0,
                            msg : "FAIL"
                        }
                    };
                    res.status(data.code).json(data.data);
                }
            });
        });
    });
}

var updateSoldState = function(req, res, next){
    var realtyCode = req.params.realtyCode;
    var newState = req.body.state;
    var agentCode = req.decoded.userCode;
    pool.getConnection(function(err, conn){
        if(err){
            console.error("error @getConnection @ updateSoldState", err);
            return next(errMsg.sError);
        }
        conn.query("UPDATE Realties SET dealStatus=? WHERE code=? AND agentCode=?", [newState, realtyCode, agentCode], function(err, result){
            if(err){
                console.error("error @ updateSoldState @ updateQuery ", err);
                return next(errMsg.sError);
            }
            var data;
            if(result.affectedRows === 1){
                data = {
                    code : 200,
                    data : {
                        type : 1,
                        msg : "SUC"
                    }
                };
            }else{
                data ={
                    code : 200,
                    data : {
                        type : 1,
                        msg : "FAIL"
                    }
                };
            }
            conn.release();
            res.status(data.code).json(data.data);
        });
    });
}

var deleteReatlty = function(req, res, next){
    var agentCode = req.decoded.userCode;
    var realtyCode = req.params.realtyCode;

    pool.getConnection(function(err, conn){
        if(err){
            console.error("error @ getConnection @ deleteReatlty ", err);
            return next(errMsg.sError);
        }
        conn.query("DELETE FROM Realties WHERE code = ? AND agentcode = ?", [realtyCode, agentCode], function(err, result){
            if(err){
                console.error("error @ deletequery @ deleteReatlty ", err);
                return next(errMsg.sError);
            }
            var data;
            if(result.affectedRows === 1){
                data = {
                    code : 200,
                    data : {
                        type : 1,
                        msg : "SUC"
                    }
                };
            }else{
                data={
                    code : 200,
                    data : {
                        type : 0,
                        msg : "FAIL"
                    }
                };
            }
            conn.release();
            res.status(data.code).json(data.data);
        });
    });
}

exports.deleteReatlty = deleteReatlty;
exports.updateSoldState = updateSoldState;
exports.updateRealty = updateRealty;
exports.getRealty = getRealty;
exports.getRealties = getRealties;
exports.saveRealty = saveRealty;
exports.saveRealtyCategory = saveRealtyCategory;
exports.getRealtyCategories = getRealtyCategories;