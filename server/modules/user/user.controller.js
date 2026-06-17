const userController = require("../../src/controller/user.controller");
const employeeController = require("../../src/controller/employee.controller");

module.exports = {
  // User operations
  getList: userController.getList,
  register: userController.register,
  remove: userController.remove,
  getStaffSwitchList: userController.getStaffSwitchList,

  // Employee operations
  getEmployeeList: employeeController.getList,
  createEmployee: employeeController.create,
  updateEmployee: employeeController.update,
  removeEmployee: employeeController.remove,
  getEmployeePerformance: employeeController.getPerformance
};