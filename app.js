var express = require('express');
var bodyParser = require('body-parser');
var path = require("path");
var jwt = require("jsonwebtoken");

var config = require('./config/config');

var mysql = require('mysql');
var pool = mysql.createPool(config.mariaDb);

var errorHandler = require("./middlewares/errorHandlers");

var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var randomstring = require('randomstring');
var app = express();

app.use(bodyParser.urlencoded({extended : false}));
app.use(bodyParser.json());

// var redirectMiddleware = require("./middlewares/redirect");
var auths = require("./middlewares/auths");
// app.use(redirectMiddleware.redirectToHttps);
// 부동산 api 
app.use("/agents", require("./routes/agent"));

// 일반 고객 api
app.use("/clients", require("./routes/client"));

// 인증관련 api
app.use("/auths", auths.checkWebToken, require("./routes/auth"));

// 등급 api
app.use("/memberships", auths.checkWebToken, require("./routes/membership"));

// 거래타입 api
app.use("/dealTypes", auths.checkWebToken, require("./routes/dealType"));

// 매물 api
app.use("/realties", auths.checkWebToken, require("./routes/realty"));

// 부동산 사무소 api
app.use("/offices", auths.checkWebToken, require("./routes/office"));

app.use(errorHandler.error);

app.listen(config.port, function(){
    console.log("server start @ ", config.port);
});

// var https = require("https");
// var secureServer = https.createServer(config.httpsOptions, app);
// secureServer.listen(config.httpsPort,function(){
//     console.log('Https Server @ '+config.httpsPort);
// });
