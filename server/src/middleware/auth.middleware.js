const jwt = require("jsonwebtoken");
const config = require("../util/config");

// This middleware will protect routes and inject business context
// 🚀 PERFORMANCE CACHE: Store permissions to avoid redundant JOIN queries
const permCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const authMiddleware = (permission_name) => {
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
            let rows = [];

            // 🚀 GUEST ACCESS BYPASS: If no role_id but has guest permissions in token
            if (!req.role_id && decoded.role_code === 'guest') {
                rows = (decoded.permissions || []).map(p => ({ route_key: p, can_view: 1, can_create: 1, can_edit: 0, can_delete: 0 }));
            } else {
                // 🚀 PERFORMANCE OPTIMIZATION: Use Cache for Permissions
                const cacheKey = `${req.business_id}:${req.role_id}`;
                const cached = permCache.get(cacheKey);

                if (cached && (Date.now() - cached.ts < CACHE_TTL)) {
                    rows = cached.data;
                } else {
                    // 🚀 SAAS-AWARE PERMISSION QUERY (Driven purely by the Database)
                    [rows] = await db.query(
                        `SELECT DISTINCT 
                            p.route_key, 
                            rp.can_view,
                            rp.can_create,
                            rp.can_edit,
                            rp.can_delete
                         FROM permissions p 
                         INNER JOIN businesses b ON b.id = ?
                         INNER JOIN roles r ON r.id = ?
                         INNER JOIN role_permissions rp ON p.id = rp.permission_id AND rp.role_id = r.id
                         LEFT JOIN plan_permissions pp ON p.id = pp.permission_id AND pp.plan_id = b.plan_id
                         LEFT JOIN module_permissions mp ON p.id = mp.permission_id
                         LEFT JOIN system_modules sm ON mp.module_id = sm.id
                         WHERE (
                            pp.plan_id IS NOT NULL -- Permission is in the Plan
                            OR FIND_IN_SET(sm.code, REPLACE(b.active_modules, ' ', '')) -- Permission is in an active Module
                            OR (
                                -- Truly Core: Only for Platform Admins (Business ID 1)
                                b.id = 1
                                AND mp.permission_id IS NULL
                            )
                         )`,
                        [req.business_id, req.role_id]
                    );
                    permCache.set(cacheKey, { data: rows, ts: Date.now() });
                }
            }
            const livePerms = rows.map(r => r.route_key.toLowerCase().replace(/^\/+|\/+$/g, ''));


            // Notify UI if local permissions are stale
            const jwtPerms = Array.isArray(decoded.permissions) ? decoded.permissions : [];
            if (JSON.stringify(livePerms.sort()) !== JSON.stringify(jwtPerms.sort())) {
                res.set("Access-Control-Expose-Headers", "X-Permissions-Updated");
                res.set("X-Permissions-Updated", "true");
            }

            // Removed SaaS Administrator (Business 1) Restriction to allow testing

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

authMiddleware.clearCache = () => {
    console.log("🚀 Clearing Permission Cache...");
    permCache.clear();
};

module.exports = authMiddleware;
