const jwt = require("jsonwebtoken");
const config = require("../util/config");

// This middleware will protect routes and inject business context
const authMiddleware = (permission_name) => {
    // Helper to check if decoded token contains required permission
    const hasPermission = (decoded, permission) => {
        if (!decoded || !Array.isArray(decoded.permissions)) return false;
        // Clean the input permission (remove leading /)
        const target = permission.replace(/^\/+/, '');
        return decoded.permissions.includes(target);
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
            const { db } = require("../util/helper"); // Dynamic require to avoid circularity

            // Inject SaaS context into request
            req.user_id = decoded.user_id;
            req.business_id = Number(decoded.business_id);
            req.branch_id = Number(decoded.branch_id);
            req.role_id = Number(decoded.role_id);
            req.auth = decoded;

            // 🚀 LIVE DATABASE PROTECTION: Fetch current role permissions with granular actions
            const [rows] = await db.query(
                "SELECT p.route_key, rp.can_view, rp.can_create, rp.can_edit, rp.can_delete FROM permissions p INNER JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = ?",
                [req.role_id]
            );
            const livePerms = rows.map(r => r.route_key.toLowerCase().replace(/^\/+|\/+$/g, ''));


            // Notify UI if local permissions are stale
            const jwtPerms = Array.isArray(decoded.permissions) ? decoded.permissions : [];
            if (JSON.stringify(livePerms.sort()) !== JSON.stringify(jwtPerms.sort())) {
                res.set("Access-Control-Expose-Headers", "X-Permissions-Updated");
                res.set("X-Permissions-Updated", "true");
            }

            // 🚀 SaaS Administrator (Business 1) Restriction
            // We remove 'product' and 'table' from this list to allow the main system to manage its own base data if needed.
            const shopLevelRoutes = ['invoices', 'order', 'inventory', 'stock', 'raw_material', 'purchase', 'expense', 'shift', 'payment', 'exchange'];
            if (req.business_id === 1 && permission_name && shopLevelRoutes.includes(permission_name.toLowerCase())) {
                return res.status(403).json({ message: "Security Violation: SaaS Administrator cannot perform shop-level operations.", error: "SYSTEM_RESTRICTION" });
            }

            // 🚀 STRICT RBAC GUARD: Check against live DB state and HTTP Method
            if (permission_name) {
                const target = permission_name.toLowerCase().replace(/^\/+|\/+$/g, '');
                const userPerm = rows.find(r => r.route_key.toLowerCase().replace(/^\/+|\/+$/g, '') === target);

                if (!userPerm) {
                    return res.status(403).json({
                        message: `Forbidden - No access to ${permission_name}`,
                        error: "INSUFFICIENT_PERMISSIONS"
                    });
                }

                // Check Action-level Permission based on HTTP Method
                const method = req.method;
                if (method === 'GET' && !userPerm.can_view) {
                    return res.status(403).json({ message: "Forbidden - View access denied", error: "VIEW_DENIED" });
                }
                if (method === 'POST' && !userPerm.can_create) {
                    return res.status(403).json({ message: "Forbidden - Create access denied", error: "CREATE_DENIED" });
                }
                if ((method === 'PUT' || method === 'PATCH') && !userPerm.can_edit) {
                    return res.status(403).json({ message: "Forbidden - Update access denied", error: "EDIT_DENIED" });
                }
                if (method === 'DELETE' && !userPerm.can_delete) {
                    return res.status(403).json({ message: "Forbidden - Delete access denied", error: "DELETE_DENIED" });
                }
            }


            next();
        } catch (error) {
            console.error("Auth Middleware Error:", error.message);
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Session expired", error: "TOKEN_EXPIRED" });
            }
            return res.status(401).json({ message: "Invalid identity token", error: "TOKEN_INVALID" });
        }
    };
};

module.exports = authMiddleware;
