module.exports = (req, res, next) => {
    const businessId = req.business_id || req.headers['x-tenant-id'] || req.query.business_id;
    if (!businessId) {
        return res.status(400).json({
            message: "Bad Request - Tenant context missing",
            error: "TENANT_CONTEXT_MISSING"
        });
    }
    req.business_id = Number(businessId);
    next();
};
