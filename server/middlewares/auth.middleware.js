const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../config/database');
const { getCache, setCache } = require('../src/util/redisClient');

// H-7 FIX: Permission cache lives in Redis, not in-process memory.
// This ensures all Node workers / PM2 cluster instances share the same
// permission state, and a single clearCache(key) invalidates everywhere.
const PERM_TTL_SECONDS = 300; // 5 minutes

const authMiddleware = (permission_name) => {
    return async (req, res, next) => {
        // 1. Check for Developer Portal API Keys
        const client_id = req.headers['x-client-id'] || req.headers['X-Client-Id'];
        const client_secret = req.headers['x-client-secret'] || req.headers['X-Client-Secret'];

        if (client_id && client_secret) {
            try {
                const [keys] = await db.query(
                    "SELECT id, name, scopes, status FROM developer_keys WHERE client_id = ? AND client_secret = ?",
                    [client_id, client_secret]
                );

                if (keys.length === 0) {
                    return res.status(401).json({
                        message: "Unauthorized - Invalid API credentials",
                        error: "INVALID_API_CREDENTIALS"
                    });
                }

                const key = keys[0];
                if (key.status !== 'active') {
                    return res.status(403).json({
                        message: "Forbidden - Developer API Key is suspended or inactive",
                        error: "API_KEY_INACTIVE"
                    });
                }

                // Check Scopes
                let scopes = [];
                try {
                    scopes = key.scopes ? JSON.parse(key.scopes) : [];
                } catch (e) {
                    scopes = [];
                }

                const isGet = req.method === "GET";
                const requiredScope = isGet ? "read" : "write";

                if (!scopes.includes(requiredScope)) {
                    return res.status(403).json({
                        message: `Forbidden - Missing required '${requiredScope}' scope for this action`,
                        error: "INSUFFICIENT_API_SCOPE"
                    });
                }

                // Inject mock admin auth context for downstream handlers
                req.user_id = 0; // System/Developer
                req.business_id = 1; // Platform Admin level bypass
                req.branch_id = 0;
                req.role_id = 1; // Owner
                req.is_developer_api = true;
                req.developer_key_name = key.name;
                req.auth = {
                    user_id: 0,
                    business_id: 1,
                    role_id: 1,
                    username: `developer:${key.name}`
                };

                return next();
            } catch (err) {
                console.error("API Key Auth Error:", err);
                return res.status(500).json({
                    message: "Internal server error during API key authentication",
                    error: "API_KEY_AUTH_FAILED"
                });
            }
        }

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

            // Active session revocation check
            if (decoded.session_uuid) {
                const sessionCacheKey = `session_active:${decoded.session_uuid}`;
                const isCachedActive = await getCache(sessionCacheKey);

                if (isCachedActive === 'false') {
                    return res.status(401).json({
                        message: "Session expired or revoked",
                        error: "SESSION_REVOKED"
                    });
                } else if (!isCachedActive) {
                    const [sessionRows] = await db.query(
                        "SELECT id FROM user_sessions WHERE token_uuid = ?",
                        [decoded.session_uuid]
                    );
                    if (sessionRows.length === 0) {
                        await setCache(sessionCacheKey, 'false', 'EX', 300);
                        return res.status(401).json({
                            message: "Session expired or revoked",
                            error: "SESSION_REVOKED"
                        });
                    }
                    await setCache(sessionCacheKey, 'true', 'EX', 60);
                }
            }

            // Inject SaaS context into request
            req.user_id = decoded.user_id;
            req.business_id = Number(decoded.business_id);
            req.branch_id = Number(decoded.branch_id);
            req.role_id = Number(decoded.role_id);
            req.auth = decoded;

            // strict business suspension check
            if (req.business_id && req.business_id !== 1) {
                const [bizRow] = await db.query("SELECT status FROM businesses WHERE id = ?", [req.business_id]);
                if (bizRow.length > 0 && bizRow[0].status === 'suspended') {
                    return res.status(403).json({
                        message: "Your business account is suspended!",
                        error: "BUSINESS_SUSPENDED"
                    });
                }
            }

            let rows = [];

            // H-7 FIX: Redis-backed permission cache — shared across all processes
            if (!req.role_id && decoded.role_code === 'guest') {
                rows = (decoded.permissions || []).map(p => ({ route_key: p, can_view: 1, can_create: 1, can_edit: 0, can_delete: 0 }));
            } else {
                const cacheKey = `perm:${req.business_id}:${req.role_id}`;
                const cached = await getCache(cacheKey);

                if (cached) {
                    rows = cached;
                } else {
                    // Live DB query — result cached in Redis for PERM_TTL_SECONDS
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
                            pp.plan_id IS NOT NULL
                            OR FIND_IN_SET(sm.code, REPLACE(b.active_modules, ' ', ''))
                            OR (
                                b.id = 1
                                AND mp.permission_id IS NULL
                            )
                         )`,
                        [req.business_id, req.role_id]
                    );
                    await setCache(cacheKey, rows, PERM_TTL_SECONDS);
                }
            }
            const livePerms = rows.map(r => r.route_key.toLowerCase().replace(/^\/+|\/+$/g, ''));

            // Notify UI if local permissions are stale
            const jwtPerms = Array.isArray(decoded.permissions) ? decoded.permissions : [];
            if (JSON.stringify(livePerms.sort()) !== JSON.stringify(jwtPerms.sort())) {
                res.set("Access-Control-Expose-Headers", "X-Permissions-Updated");
                res.set("X-Permissions-Updated", "true");
            }

            // 🚀 STRICT RBAC GUARD
            if (permission_name) {
                // Platform Owner (business_id = 1) has full access bypass
                if (req.business_id === 1) {
                    return next();
                }

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

// H-7 FIX: clearCache now invalidates the Redis key pattern for permissions.
// Call this after any role/permission change: authMiddleware.clearCache(bizId, roleId)
authMiddleware.clearCache = async (business_id, role_id) => {
  const { clearCache } = require('../src/util/redisClient');
  if (business_id && role_id) {
    await clearCache(`perm:${business_id}:${role_id}`);
  } else {
    await clearCache('perm:*');
  }
  console.log('🚀 Redis permission cache cleared.');
};

module.exports = authMiddleware;
