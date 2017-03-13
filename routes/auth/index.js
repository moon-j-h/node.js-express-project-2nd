var router = require("express").Router();
var ctrl = require("./../../controllers/auth");
var auth = require("./../../middlewares/auths");

router.get("/tokens", ctrl.refreshWebToken);

module.exports = router;