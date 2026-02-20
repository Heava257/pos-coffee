const { validate_token } = require("../controller/auth.controller");
const {
    create,
    getList,
} = require("../controller/purchase.controller");

module.exports = (app) => {
    app.get("/api/purchase", validate_token("purchase.list"), getList);
    app.post("/api/purchase", validate_token("purchase.create"), create);
};
