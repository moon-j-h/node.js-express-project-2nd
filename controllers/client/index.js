var mysql = require('mysql');
var config = require('./../../config/config');
var toPas = require("./../../passport/password");
var randomstring = require("randomstring");
var path = require("path");
var jwt = require("jsonwebtoken");

var pool = mysql.createPool(config.mariaDb);

var errMsg = require('./../../middlewares/errorMessages');

var isIdDuplicated = function (req, res, next) {
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error("connect pool error ", err);
            return next(err);
        }
        var id = req.query.id;
        conn.query("select id from Clients where id=?", id, function (err, results) {
            conn.release();
            if (err) {
                console.error("error @ select id ", err);
                return next(err);
            }
            if (results.length === 0) {
                // 중복 없음
                var data = {
                    code: 200,
                    data: {
                        type: 1,
                        msg: "SUC"
                    }
                };
                res.status(data.code).json(data.data);
            } else {
                var data = {
                    code: 200,
                    data: {
                        type: 0,
                        msg: "FAIL"
                    }
                };
                res.status(data.code).json(data.data);
            }
        });
    });
}

var signUp = function (req, res, next) {
    toPas.createPassword(req.body.pw.trim(), function (err, salt, password) {
        if (err) {
            return next(errMsg.sError);
        }
        var client = {
            id: req.body.id.trim(),
            salt: salt,
            password: password,
            work: config.crypto.workFactor,
            name: req.body.name.trim(),
            phone: req.body.phone.trim()
        };
        pool.getConnection(function (err, conn) {
            if (err) {
                console.error("connection error ", err);
                return next(errMsg.sError);
            }
            conn.query("INSERT INTO Clients(id, salt, password, work, name, phone) VALUES (?, ?, ?, ?, ?, ?)",
                [client.id, client.salt, client.password, client.work, client.name, client.phone],
                function (err, result) {
                    if (err) {
                        console.error("insert into client error ", err);
                        return next(errMsg.sError);
                    }
                    conn.release();
                    var data = {
                        code: 200,
                        data: {
                            type: 1,
                            msg: "SUC"
                        }
                    };
                    res.status(data.code).json(data.data);
                });
        });
    });
}


var signIn = function (req, res, next) {
    pool.getConnection(function (err, con) {
        if (err) {
            console.error("connection error ", err);
            return next(errMsg.sError);
        } else {
            con.query("SELECT code, id, password, salt, work, name, phone, memberShipCode FROM Clients WHERE id = ?", req.body.id, function (err, result) {
                if (err) {
                    console.error("error @ sign in", err);
                    return next(errMsg.sError);
                } else {
                    if (result.length === 0) {
                        var data = {
                            code: 200,
                            data: {
                                type: 0,
                                msg: "아이디와 비밀번호를 다시 한번 확인해주세요."
                            }
                        };
                        return res.status(data.code).json(data.data);
                    }
                    toPas.checkPassword(req.body.pw, result[0].password, result[0].salt, result[0].work, function (err, isAuth) {
                        if (isAuth) {
                            var client ={
                                code: result[0].code,
                                id: result[0].id,
                                name: result[0].name,
                                phone: result[0].phone,
                                membershipCode: result[0].membershipCode
                            };
                           var webTokenConfig = config.webToken;
                           var token = jwt.sign({clientCode : client.code}, webTokenConfig.secret,{
                               expiresIn : webTokenConfig.expiresIn
                           });
                           var data = {
                               code : 200,
                               data : {
                                   type : 1,
                                   client : client,
                                   jsonwebtoken : token,
                                   expiresIn : webTokenConfig.expiresIn
                               }
                           };
                           return res.status(data.code).json(data.data);
                        } else {
                            console.error("sign in fail ");
                            var data = {
                                code: 200,
                                data: {
                                    type: 0,
                                    msg: "아이디와 비밀번호를 다시 한번 확인해주세요."
                                }
                            };
                            return res.status(data.code).json(data.data);
                        }
                    });
                }
            });
        }
    });
}
exports.isIdDuplicated = isIdDuplicated;
exports.signUp = signUp;
exports.signIn = signIn;