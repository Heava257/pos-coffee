const { validate_token } = require("../controller/auth.controller");
const {
    getList,
    create,
    update,
    remove,
} = require("../controller/raw_material.controller");
const { uploadFile } = require("../util/helper");

module.exports = (app) => {
    app.get("/api/raw_material", validate_token("raw_material.getlist"), getList);
    app.post("/api/raw_material", validate_token("raw_material.create"), uploadFile.single("image"), create);
    app.put("/api/raw_material", validate_token("raw_material.update"), uploadFile.single("image"), update);
    app.delete("/api/raw_material", validate_token("raw_material.remove"), remove);
};
