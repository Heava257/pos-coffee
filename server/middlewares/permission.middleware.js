const authMiddleware = require("./auth.middleware");

module.exports = (permission_name) => {
    return authMiddleware(permission_name);
};
