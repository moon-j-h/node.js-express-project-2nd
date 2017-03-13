var config = require("./../config/config");

var redirectToHttps = function(req, res, next){
    if (!/https/.test(req.protocol) && req.method=='GET') {
        console.log("https가 아니므로 redirect");
        var host = req.headers.host;
        var info=host.split(":");
        console.log("https://" + info[0] +":"+config.httpsPort+req.url);
        res.redirect("https://" + info[0] +":"+config.httpsPort+req.url);  
    } else {
        return next();
    }
}

exports.redirectToHttps = redirectToHttps;