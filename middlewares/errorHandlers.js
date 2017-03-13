exports.error = function(err, req, res, next){
    //console.log("req", req.headers);
    console.log('err', err);
    res.status(err.code).json(err);
};