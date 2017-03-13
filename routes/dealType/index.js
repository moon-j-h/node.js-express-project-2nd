var router = require("express").Router();
var ctrl = require("./../../controllers/dealType");

router.get("/", ctrl.getDealTypes);

module.exports = router;