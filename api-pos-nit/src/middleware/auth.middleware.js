const jwt = require("jsonwebtoken");
const config = require("../util/config");

// This middleware will protect routes and inject business context
const authMiddleware = (permission_name) => {
    // Helper to check if decoded token contains required permission
    const hasPermission = (decoded, permission) => {
        // Assuming decoded.permissions is an array of permission strings
        if (!decoded || !Array.isArray(decoded.permissions)) return false;
        return decoded.permissions.includes(permission);
    };
    return async (req, res, next) => {
        const authorization = req.headers.authorization;
        let token = null;

        if (authorization && authorization.startsWith("Bearer ")) {
            token = authorization.slice(7);
        }

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized - No token provided",
                error: "TOKEN_MISSING"
            });
        }

        try {
            const decoded = jwt.verify(token, config.token.access_token_key);

            // Inject SaaS context into request
            req.user_id = decoded.user_id;
            req.business_id = decoded.business_id;
            req.branch_id = decoded.branch_id;
            req.role_id = decoded.role_id;
            req.plan_type = decoded.plan_type;

            // Detailed Auth object for legacy support
            req.auth = {
                id: decoded.user_id,
                business_id: decoded.business_id,
                branch_id: decoded.branch_id,
                role_id: decoded.role_id,
                name: decoded.name,
                plan: decoded.plan_type
            };

            // TODO: Permission Check logic can be added here
            if (permission_name && !hasPermission(decoded, permission_name)) {
                return res.status(403).json({ message: "Forbidden - Insufficient permissions" });
            }
            //    return res.status(403).json({ message: "Forbidden - Insufficient permissions" });


            next();
        } catch (error) {
            console.error("Auth Middleware Error:", error.message, "Token start:", token ? token.substring(0, 10) : "none");
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Session expired", error: "TOKEN_EXPIRED" });
            }
            return res.status(401).json({ message: "Invalid identity token", error: "TOKEN_INVALID" });
        }
    };
};

module.exports = authMiddleware;
