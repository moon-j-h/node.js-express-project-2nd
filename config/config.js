var fs = require("fs");
var config = {
    port : 1234,
    httpsPort : 4443,
    httpsOptions : {
        key: fs.readFileSync('./config/encryption/key.pem'),
        cert: fs.readFileSync('./config/encryption/cert.pem')
    },
    secret : 'secret',
    mariaDb : {
        host : 'localhost',
        user : 'root',
        password : 'root passpord',
        database : 'rootdb'
    },
    crypto : {
        workFactor : 5000,
        keylen : 32,
        saltlen : 100
    },
    smpt : {
        host : "smtp.gmail.com",
        port : 465,
        secure : true,
        auth : {
            user : 'useremail@gmail.com',
            pass : 'userEmailpassword'
        }
    },
    webToken : {
        secret : "fkdslkjgwfesf",
        expiresIn : 86400
    }
}

module.exports = config;