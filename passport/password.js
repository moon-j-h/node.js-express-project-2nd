var crypto = require('crypto');
var scmp = require('scmp');
var config = require('./../config/config');

module.exports.createPassword = function(password, callback){
    crypto.randomBytes(config.crypto.saltlen, function(err, salt){
        if(err){
            return callback(err, null);
        }else{
            crypto.pbkdf2(password, salt.toString('hex'), config.crypto.workFactor, config.crypto.keylen, 'sha512', function(err, key){
                callback(null, salt.toString('hex'), key.toString('hex'));
            })
        }
    });
};

module.exports.checkPassword = function(password, derivedPassword, salt, work, callback){
    crypto.pbkdf2(password, salt, work, config.crypto.keylen, 'sha512', function(err, key){
        if(err){
            console.error("checkPassword errr ", err);
            return callback(err, null);
        }
        callback(null, scmp(key.toString('hex'), derivedPassword));
    });
};