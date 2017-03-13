var route = require("express").Router();
var ctrl = require("./../../controllers/realty");


route.post("/realtyCategories", ctrl.saveRealtyCategory);
route.get("/realtyCategories", ctrl.getRealtyCategories);

route.post("/", ctrl.saveRealty);
route.get("/", ctrl.getRealties);

route.put("/:realtyCode/soldState", ctrl.updateSoldState);
route.get("/:realtyCode", ctrl.getRealty);
route.put("/:realtyCode", ctrl.updateRealty);
route.delete("/:realtyCode", ctrl.deleteReatlty);

module.exports = route;