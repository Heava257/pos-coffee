const mp = require("../../src/controller/modular_package.controller");
const sm = require("../../src/controller/system_module.controller");

module.exports = {
    getListPackages: mp.getList,
    createPackage: mp.create,
    updatePackage: mp.update,
    getPackagePermissions: mp.getPermissions,
    getListModules: sm.getList,
    createModule: sm.create,
    updateModule: sm.update,
    deleteModule: sm.remove,
    getModulePermissions: sm.getPermissions,
    saveModulePermissions: sm.savePermissions,
    getMatrix: sm.getMatrix,
    saveMatrix: sm.saveMatrix
};