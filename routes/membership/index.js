var router = require("express").Router();
var ctrl = require("./../../controllers/membership");

router.get("/", ctrl.getMemberships);

module.exports = router;