
var mysql = require('mysql');
var config = require('./../../config/config');
var toPas = require("./../../passport/password");
var randomstring = require("randomstring");
var nodemailer = require("nodemailer");
var smtpTransport = require("nodemailer-smtp-transport");
var path = require("path");
var jwt = require("jsonwebtoken");

var pool = mysql.createPool(config.mariaDb);
var smtp = nodemailer.createTransport(smtpTransport(config.smpt));

var errMsg = require('./../../middlewares/errorMessages');


var insertOffice = function (conn, office, callback) {
    conn.query("SELECT code FROM Offices WHERE name=? AND address=? AND tel=?", [office.name, office.address, office.tel], function (err, results) {
        if (err) {
            console.error("insertOffice error ", err);
            return callback(err);
        }
        if (results.length == 0) {
            conn.query("INSERT INTO Offices(name, address, tel) VALUES (?, ?, ?)", [office.name, office.address, office.tel], function (err, result) {
                if (err) {
                    console.error("insert 사무실 error ", err);
                    return callback(err);
                }
                return callback(null, result.insertId);
            });
        } else {
            return callback(null, results[0].code);
        }
    });
}

var insertNewer = function (pool, newer, office, callback) {
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error("connect pool error ", err);
            return callback(err);
        } else {
            conn.beginTransaction(function (err) {
                if (err) {
                    console.error("begin transaction error ", err);
                    return callback(err);
                } else {
                    insertOffice(conn, office, function (err, insertId) {
                        if (err) {
                            console.error("insert 사무실 error ", err);
                            return conn.rollback(function () {
                                // 에러처리 
                                conn.release();
                                return callback(err);
                            });
                        }
                        conn.query("INSERT INTO Agents(email, salt, password, work, name, phone, officeCode) VALUES (?, ?, ?, ?, ?, ?, ?)", [newer.email, newer.salt, newer.password, newer.work, newer.name, newer.phone, insertId], function (err, result) {
                            if (err) {
                                console.error("insert 부동산 error ", err);
                                return conn.rollback(function () {
                                    conn.release();
                                    return callback(err);
                                });
                            }
                            var randomInfo = {
                                rand: randomstring.generate(),
                                code: result.insertId
                            };
                            conn.query("INSERT INTO EmailVerifications(verificationNum, agentCode) VALUES (?, ?)", [randomInfo.rand, randomInfo.code], function (err, result) {
                                if (err) {
                                    console.error("insert 인증번호 error ", err);
                                    return conn.rollback(function () {
                                        conn.release();
                                        return callback(err);
                                    });
                                }
                                conn.commit(function (err) {
                                    if (err) {
                                        return conn.rollback(function () {
                                            conn.release();
                                            return callback(err);
                                        });
                                    }
                                    return callback(null, randomInfo);
                                });
                            });
                        })
                    });
                }
            })
        }

    });
}

var isEmailDuplicated = function (req, res, next) {
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error("connect pool error ", err);
            return next(err);
        }
        var email = req.query.email;
        conn.query("select email from Agents where email=?", email, function (err, results) {
            conn.release();
            if (err) {
                console.error("error @ select email ", err);
                return next(err);
            }
            if (results.length === 0) {
                // 중복 없음
                var data = {
                    code: 200,
                    data: {
                        type: 1, // 중복이 아닌 경우
                        msg: "SUC"
                    }
                };
                res.status(data.code).json(data.data);
            } else {
                var data = {
                    code: 200,
                    data: {
                        type: 0, // 중복일 경우
                        msg: "FAIL"
                    }
                };
                res.status(data.code).json(data.data);
            }
        });
    });
}

var signUp = function (req, res, next) {
    toPas.createPassword(req.body.pw, function (err, salt, password) {
        if (err) {
            console.error("createPassword error : ", err);
            return next(errMsg.sError);
        }
        var newer = {
            email: req.body.email,
            salt: salt,
            password: password,
            work: config.crypto.workFactor,
            name: req.body.name,
            phone: req.body.phone,
        }
        var office = {
            name: req.body.officeName,
            address: req.body.officeAddress,
            tel: req.body.officeTel
        }
        insertNewer(pool, newer, office, function (err, verificationInfo) {
            if (err) {
                console.error("error @ insertNewer ", err);
                return next(errMsg.sError);
            }
            var hostTmp = req.get('host');
            hostTmp = hostTmp.split(":");
            var link = "https://" + hostTmp[0] +":"+config.httpsPort +'/agents/verification?id=' + verificationInfo.rand;
            var mailOptions = {
                to: newer.email,
                subject: "[중개박사] 가입 인증 메일",
                html: "안녕하세요, 중개박사입니다. <br />이메일 인증을 위해 <strong><a href=" + link + ">여기</a></strong>를 클릭해 주세요."
            };
            smtp.sendMail(mailOptions, function (err, info) {
                if (err) {
                    console.error("send mail error ", err);
                }
            });
            var data = {
                code: 200,
                data : {
                    tyep : 1,
                    msg : "SUC"
                }
            };
            res.status(data.code).json(data.data);
        });
    });
}

var updateMembership = function (pool, verificationNum, callback) {
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error("error @ connection ", err);
            return callback(err);
        }
        conn.query("select agentCode from EmailVerifications where verificationNum=?", [verificationNum], function (err, results) {
            if (err) {
                cosnole.error("error @ select agentCode ", err);
                return callback(err);
            }
            conn.beginTransaction(function (err) {
                if (err) {
                    console.error("error @ beginTransaction", err);
                    return callback(err);
                }
                conn.query("DELETE FROM EmailVerifications WHERE verificationNum=?", [verificationNum], function (err, result) {
                    if (err) {
                        console.error("delete error ", err);
                        return conn.rollback(function () {
                            conn.release();
                            return callback(err);
                        });
                    }
                    if (result.affectedRows == 1) {
                        conn.query("UPDATE Agents SET membershipCode=? where code=?", [2, results[0].agentCode], function (err, result) {
                            if (err) {
                                console.error("update error ", err);
                                return conn.rollback(function () {
                                    conn.release();
                                    return callback(err);
                                });
                            }
                            conn.commit(function (err) {
                                if (err) {
                                    console.error("error @ commit ", err);
                                    return conn.rollback(function () {
                                        conn.release();
                                        return callback(err);
                                    });
                                }
                                conn.release();
                                return callback(null, result);
                            });
                        });
                    } else {
                        return conn.rollback(function () {
                            conn.release();
                            var error = {
                                code: 500,
                                msg: "1개만 삭제된게 아님"
                            };
                            return callback(error);
                        });
                    }
                });
            });
        });
    });
}


var createVerificationNum = function (req, res, next) {   
    pool.getConnection(function(err, conn){
        if(err){
            console.error("connection error ", err);
            return next(errMsg.sError);
        }
        var agentCode = req.body.code;
        conn.query("SELECT email FROM Agents WHERE code=?", agentCode, function(err, row){
            if(err){
                console.error("error @ select email from agents @createVerificationNum ", err);
                return next(errMsg.sError);
            }else{
                if (row.length === 0) {
                    var data = {
                        code: 200,
                        data: {
                            type: 0,
                            msg: "잘 못 된 것"
                        }
                    }
                    res.status(data.code).json(data.data);
                }else{
                    var verificationNum = randomstring.generate();
                    var hostTmp = req.get('host');
                    hostTmp = hostTmp.split(":");
                    var link = "https://"+hostTmp[0]+":"+config.httpsPort+"/agents/verification?id="+verificationNum;
                    var mailOptions = {
                        to : row[0].email,
                        subject:"[중개박사] 가입 인증 메일",
                        html: "안녕하세요, 중개박사입니다. <br />이메일 인증을 위해 <strong><a href=" + link + ">여기</a></strong>를 클릭해 주세요."
                    };
                    smtp.sendMail(mailOptions, function(err, info){
                        if(err){
                            console.error("createVerificationNum send mail error ", err);
                            return next(errMsg.sError);
                        }
                    });
                    conn.query("SELECT agentCode from EmailVerifications WHERE agentCode=?", [agentCode], function (err, rows) {
                        if (err) {
                            console.error("error @ select @ EmailVerifications ", err);
                            return next(errMsg.sError);
                        }
                        if (rows.length !== 0) {
                            // 삭제
                            conn.query("DELETE FROM EmailVerifications WHERE agentCode=?", [agentCode], function(err, result){
                                if(err){
                                    console.error("error delete @ createVerificationNum ", err);
                                    return next(errMsg.sError);
                                }
                                conn.query("INSERT INTO EmailVerifications(verificationNum, agentCode) VALUES (?, ?)", [verificationNum, agentCode], function(err, result){
                                    if (err) {
                                        console.error("error insert EmailVerifications 2 ", err);
                                        return next(errMsg.sError);
                                    }
                                    conn.release();
                                });
                            });
                        } else {
                            conn.query("INSERT INTO EmailVerifications(verificationNum, agentCode) VALUES (?, ?)", [verificationNum, agentCode], function (err, result) {
                                if (err) {
                                    console.error("error insert EmailVerifications ", err);
                                    return next(errMsg.sError);
                                }
                                conn.release();

                            });
                        }
                    });


                    var data = {
                        code: 200,
                        data: {
                            type: 1,
                            msg: "SUC"
                        }
                        
                    };
                    res.status(data.code).json(data.data);
                }
            }
        });
    });
}

var verifyEmail = function (req, res, next) {
    updateMembership(pool, req.query.id, function (err, result) {
        if (err) {
            console.error("updateMembership error ", err);
            return next(errMsg.sError);
        }
        var data = {
            code: 200,
            data : {
                type : 1,
                msg : "인증 성공"
            }
        };
        res.status(data.code).json(data.data);
    });
}

var signIn = function (req, res, next) {
    pool.getConnection(function (err, con) {
        if (err) {
            // error 변경하셈...
            console.error("connection error ", err);
            return next(errMsg.sError);
        } else {
            var username = req.body.username;
            var password = req.body.password;
            var sql = "SELECT a.code, a.email, a.name, a.phone, a.salt, a.password, a.work, a.membershipCode, o.code officeCode, o.name officeName"
            sql+=" FROM Agents a, Offices o WHERE a.officeCode = o.code AND a.email = ?";
            con.query(sql, username, function (err, result) {
                if (err) {
                    console.error("error @ sign in", err);
                    var data = {
                        code: 200,
                        data: {
                            type: 0,
                            msg: "다시 시도해주세요."
                        }
                    }
                    res.status(data.code).json(data.data);
                } else {
                    if(result.length===0){
                        var data = {
                            code : 200,
                            data : {
                                type : 0,
                                msg : "아이디와 비밀번호를 다시 한번 확인해주세요."
                            }
                        };
                        return res.status(data.code).json(data.data);
                    }
                    toPas.checkPassword(password, result[0].password, result[0].salt, result[0].work, function (err, isAuth) {
                        if (isAuth) {
                            var user = {
                                code: result[0].code,
                                email: result[0].email,
                                name: result[0].name,
                                phone: result[0].phone,
                                membershipCode: result[0].membershipCode,
                                office: {
                                    code : result[0].officeCode,
                                    name: result[0].officeName
                                }
                            };
                            var expiresIn = config.webToken.expiresIn;
                            var token = jwt.sign({ userCode: user.code }, config.webToken.secret, {
                                expiresIn: expiresIn
                            });
                            var data = {
                                code: 200,
                                data: {
                                    type: 1,
                                    agent: user,
                                    jsonWebToken: token,
                                    expiresIn : expiresIn
                                }
                            };
                            res.status(data.code).json(data.data);
                        } else {
                            console.error("sign in fail ", err);
                            var data = {
                                code: 200,
                                data: {
                                    type: 0,
                                    msg: "아이디와 비밀번호를 다시 한번 확인해주세요."
                                }
                            }
                            res.status(data.code).json(data.data);
                        }
                    });
                }
            });
        }
    });
}


exports.verifyEmail = verifyEmail;
exports.createVerificationNum = createVerificationNum;
exports.signIn = signIn;
exports.signUp = signUp;
exports.isEmailDuplicated = isEmailDuplicated;


var testCheckWebToken = function(req, res, next){
    res.status(200).json({
        type : 1,
        msg : "통과 성공",
        data : req.decoded
    });
}
exports.testCheckWebToken = testCheckWebToken;