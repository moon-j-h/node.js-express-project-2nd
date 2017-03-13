var express = require('express');
var router = express.Router();
var ctrl = require('./../../controllers/agent/index');
var auths = require("./../../middlewares/auths");

router.post('/', ctrl.signUp);

router.get("/emailDuplication", ctrl.isEmailDuplicated);

router.post("/signIn", ctrl.signIn);

router.get("/verification", ctrl.verifyEmail);
router.post("/verification", ctrl.createVerificationNum);

router.get("/check", auths.checkWebToken, ctrl.testCheckWebToken);

module.exports = router;

