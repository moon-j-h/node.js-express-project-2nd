var express = require('express');
var router = express.Router();
var ctrl = require('./../../controllers/client/index');

router.post('/', ctrl.signUp);

router.get("/idDuplication", ctrl.isIdDuplicated);

router.post("/signIn", ctrl.signIn);
module.exports = router;