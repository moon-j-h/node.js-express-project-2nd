var Router = require("express").Router();
var ctrl = require("./../../controllers/office");

Router.get("/:officeCode", ctrl.getOffice);
Router.put("/:officeCode", ctrl.updateOffice);

module.exports = Router;